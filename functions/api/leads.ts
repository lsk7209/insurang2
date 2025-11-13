/**
 * Cloudflare Pages Functions
 * /api/leads 엔드포인트
 * Cloudflare Pages Functions는 자동으로 /api/* 경로를 처리합니다.
 */

import type { D1Database } from '@/types/cloudflare';
import { generateEmailTemplate } from '@/lib/utils/email-template';
import { checkRateLimit, getClientIdentifier } from '@/lib/utils/rate-limit';
import { validateLeadForm, normalizeLeadData } from '@/lib/utils/validation';
import { logError } from '@/lib/utils/error-logger';
import { sendSMS } from '@/lib/services/sms-service';
import type { LeadCreateRequest, LeadCreateResponse } from '@/types/api';

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  SMTP_FROM?: string;
  SOLAPI_API_KEY: string;
  SOLAPI_API_SECRET: string;
  SOLAPI_SENDER_PHONE: string;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    // Rate Limiting 체크 (MVP: 간단한 IP 기반)
    const clientId = getClientIdentifier(context.request);
    const rateLimit = await checkRateLimit(context.env.DB, clientId, {
      maxRequests: 10, // 10 requests
      windowMs: 60 * 1000, // per minute
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }

    const body = await context.request.json() as LeadCreateRequest;

    // 중앙화된 Validation 사용
    const validation = validateLeadForm(body);
    if (!validation.valid) {
      // 첫 번째 에러 메시지 반환
      const firstError = Object.values(validation.errors)[0];
      return new Response(
        JSON.stringify({ success: false, error: firstError } as LeadCreateResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 데이터 정규화
    const normalizedData = normalizeLeadData(body);
    const { offer_slug, name, email, phone, organization, consent_privacy, consent_marketing } = normalizedData;

    // 오퍼 확인
    interface Offer {
      slug: string;
      name: string;
      download_link: string | null;
    }

    const offerResult = await context.env.DB.prepare(
      'SELECT slug, name, download_link FROM offers WHERE slug = ? AND status = ?'
    )
      .bind(offer_slug, 'active')
      .first<Offer>();

    const offer: Offer = offerResult || {
      slug: offer_slug,
      name: 'AI 상담 워크북',
      download_link: 'https://example.com/workbook.pdf',
    };

    // 리드 저장
    let leadId: number;
    try {
      const leadResult = await context.env.DB.prepare(
        'INSERT INTO leads (offer_slug, name, email, phone, organization, consent_privacy, consent_marketing) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(
          offer_slug,
          name,
          email,
          phone,
          organization || null,
          consent_privacy ? 1 : 0,
          consent_marketing ? 1 : 0
        )
        .run();

      if (!leadResult.meta.last_row_id) {
        throw new Error('Failed to insert lead');
      }

      leadId = leadResult.meta.last_row_id;
    } catch (dbError: unknown) {
      const error = dbError instanceof Error ? dbError : new Error('Unknown database error');
      // 에러 로깅 (console + DB)
      await logError(context.env.DB, error, {
        operation: 'lead_insert',
        offer_slug: offer_slug,
        email_prefix: email.substring(0, 5) + '***', // 개인정보 마스킹
      });
      return new Response(
        JSON.stringify({ success: false, error: '데이터베이스 오류가 발생했습니다.' } as LeadCreateResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 이메일 발송 (비동기, 실패해도 계속)
    sendEmailAsync(context.env, email, name, offer.download_link || 'https://example.com/workbook.pdf', leadId, context.env.DB).catch(
      async (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        await logError(context.env.DB, error, {
          operation: 'email_send',
          lead_id: leadId,
        });
      }
    );

    // SMS 발송 (비동기, 실패해도 계속)
    // 환경 변수 확인 후 발송
    if (context.env.SOLAPI_API_KEY && context.env.SOLAPI_API_SECRET && context.env.SOLAPI_SENDER_PHONE) {
      sendSMSAsync(context.env, phone, offer.download_link || undefined, leadId, context.env.DB).catch(
        async (err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          await logError(context.env.DB, error, {
            operation: 'sms_send',
            lead_id: leadId,
          });
        }
      );
    } else {
      // SMS 발송 실패 로그 기록
      await logError(context.env.DB, new Error('Solapi API configuration missing'), {
        operation: 'sms_send',
        lead_id: leadId,
      });
      context.env.DB.prepare('INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)')
        .bind(leadId, 'sms', 'failed', 'Solapi API configuration missing')
        .run()
        .catch(async (err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          await logError(context.env.DB, error, {
            operation: 'message_log_insert',
            lead_id: leadId,
          });
        });
    }

    return new Response(JSON.stringify({ success: true } as LeadCreateResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    // 에러 로깅 (console + DB)
    await logError(context.env.DB, err, {
      operation: 'lead_creation',
    });
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류가 발생했습니다.' } as LeadCreateResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 이메일 발송 (Cloudflare Workers용 fetch API)
async function sendEmailAsync(
  env: Env,
  to: string,
  name: string,
  downloadLink: string,
  leadId: number,
  db: D1Database
) {
  try {
    // Resend 또는 SendGrid API 사용
    let success = false;
    let errorMessage: string | null = null;

    if (env.RESEND_API_KEY) {
      // Resend API 사용
      const html = generateEmailTemplate(name, downloadLink);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.SMTP_FROM || 'noreply@example.com',
          to,
          subject: '[AI 상담 워크북] 신청해 주셔서 감사합니다.',
          html,
        }),
      });

      if (response.ok) {
        success = true;
      } else {
        const error = await response.json();
        errorMessage = error.message || 'Email send failed';
      }
    } else if (env.SENDGRID_API_KEY) {
      // SendGrid API 사용
      const html = generateEmailTemplate(name, downloadLink);
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: env.SMTP_FROM || 'noreply@example.com' },
          subject: '[AI 상담 워크북] 신청해 주셔서 감사합니다.',
          content: [{ type: 'text/html', value: html }],
        }),
      });

      if (response.ok) {
        success = true;
      } else {
        const error = await response.text();
        errorMessage = error || 'Email send failed';
      }
    } else {
      errorMessage = 'Email service not configured (RESEND_API_KEY or SENDGRID_API_KEY required)';
    }

    await db
      .prepare('INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)')
      .bind(leadId, 'email', success ? 'success' : 'failed', errorMessage)
      .run();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Unknown email error');
      const errorMessage = err.message;
      // 에러 로깅 (console + DB)
      await logError(db, err, {
        operation: 'email_send_async',
        lead_id: leadId,
      });
      await db
        .prepare('INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)')
        .bind(leadId, 'email', 'failed', errorMessage)
        .run()
      .catch(async (logErr) => {
        const err = logErr instanceof Error ? logErr : new Error(String(logErr));
        await logError(db, err, {
          operation: 'message_log_insert_email',
          lead_id: leadId,
        });
      });
    }
}


// SMS 발송 (lib/services/sms-service.ts 사용)
async function sendSMSAsync(
  env: Env,
  to: string,
  shortLink: string | undefined,
  leadId: number,
  db: D1Database
) {
  try {
    const result = await sendSMS(
      {
        to,
        message: '', // generateMessage 함수가 요구사항에 맞는 메시지를 생성
        shortLink,
      },
      {
        SOLAPI_API_KEY: env.SOLAPI_API_KEY,
        SOLAPI_API_SECRET: env.SOLAPI_API_SECRET,
        SOLAPI_SENDER_PHONE: env.SOLAPI_SENDER_PHONE,
      }
    );

    await db
      .prepare('INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)')
      .bind(leadId, 'sms', result.success ? 'success' : 'failed', result.error || null)
      .run();
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown SMS error');
    const errorMessage = err.message;
    // 에러 로깅 (console + DB)
    await logError(db, err, {
      operation: 'sms_send_async',
      lead_id: leadId,
    });
    await db
      .prepare('INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)')
      .bind(leadId, 'sms', 'failed', errorMessage)
      .run()
      .catch(async (logErr) => {
        const err = logErr instanceof Error ? logErr : new Error(String(logErr));
        await logError(db, err, {
          operation: 'message_log_insert_sms',
          lead_id: leadId,
        });
      });
  }
}

