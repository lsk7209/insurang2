/**
 * Cloudflare Pages Functions
 * /api/leads 엔드포인트
 * Cloudflare Pages Functions는 자동으로 /api/* 경로를 처리합니다.
 */

import type { D1Database } from '@/types/cloudflare';
import { generateEmailTemplate } from '@/lib/utils/email-template';
import { checkRateLimit, getClientIdentifier } from '@/lib/utils/rate-limit';

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

    const body = await context.request.json();
    const {
      offer_slug,
      name,
      email,
      phone,
      organization,
      consent_privacy,
      consent_marketing,
    } = body;

    // 필수 필드 검증
    if (!offer_slug || !name || !email || !phone || consent_privacy === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 필드가 누락되었습니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 입력 길이 검증
    if (name.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: '이름은 100자 이하여야 합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (email.length > 255) {
      return new Response(
        JSON.stringify({ success: false, error: '이메일은 255자 이하여야 합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 이메일 형식 검증
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: '올바른 이메일 형식이 아닙니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 휴대폰 번호 검증
    const phoneNumbers = phone.replace(/[^\d]/g, '');
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      return new Response(
        JSON.stringify({ success: false, error: '올바른 휴대폰 번호 형식이 아닙니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
          name.trim(),
          email.trim().toLowerCase(),
          phoneNumbers,
          organization?.trim() || null,
          consent_privacy ? 1 : 0,
          consent_marketing ? 1 : 0
        )
        .run();

      if (!leadResult.meta.last_row_id) {
        throw new Error('Failed to insert lead');
      }

      leadId = leadResult.meta.last_row_id;
    } catch (dbError: unknown) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Database error:', {
        error: errorMessage,
        offer_slug: offer_slug,
        email: email.substring(0, 5) + '***', // 개인정보 마스킹
      });
      return new Response(
        JSON.stringify({ success: false, error: '데이터베이스 오류가 발생했습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 이메일 발송 (비동기, 실패해도 계속)
    sendEmailAsync(context.env, email, name, offer.download_link || 'https://example.com/workbook.pdf', leadId, context.env.DB).catch(
      (err) => console.error('Email send error:', err)
    );

    // SMS 발송 (비동기, 실패해도 계속)
    // 환경 변수 확인 후 발송
    if (context.env.SOLAPI_API_KEY && context.env.SOLAPI_API_SECRET && context.env.SOLAPI_SENDER_PHONE) {
      sendSMSAsync(context.env, phoneNumbers, offer.download_link || undefined, leadId, context.env.DB).catch(
        (err) => console.error('SMS send error:', err)
      );
    } else {
      console.warn('Solapi API configuration missing. SMS will not be sent.');
      // SMS 발송 실패 로그 기록
      context.env.DB.prepare('INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)')
        .bind(leadId, 'sms', 'failed', 'Solapi API configuration missing')
        .run()
        .catch((err) => console.error('Failed to log SMS error:', err));
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Lead creation error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류가 발생했습니다.' }),
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email send error:', errorMessage);
    await db
      .prepare('INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)')
      .bind(leadId, 'email', 'failed', errorMessage)
      .run()
      .catch((logError) => console.error('Failed to log email error:', logError));
  }
}


// SMS 발송
async function sendSMSAsync(
  env: Env,
  to: string,
  shortLink: string | undefined,
  leadId: number,
  db: D1Database
) {
  try {
    const message = shortLink
      ? `[인슈랑] 신청 완료되었습니다. 안내 메일을 확인해 주세요. 자료: ${shortLink}`
      : '[인슈랑] 신청 완료되었습니다. 안내 메일을 확인해 주세요.';

    // 솔라피 API 호출
    const date = new Date().toISOString();
    const salt = crypto.randomUUID();
    const signature = await generateSignature(env.SOLAPI_API_SECRET, date, salt);

    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        Authorization: `HMAC-SHA256 apiKey=${env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            to,
            from: env.SOLAPI_SENDER_PHONE,
            text: message,
          },
        ],
      }),
    });

    const result = await response.json();
    const success = result.messageId ? true : false;

    await db
      .prepare('INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)')
      .bind(leadId, 'sms', success ? 'success' : 'failed', success ? null : JSON.stringify(result))
      .run();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await db
      .prepare('INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)')
      .bind(leadId, 'sms', 'failed', errorMessage)
      .run()
      .catch((logError) => console.error('Failed to log SMS error:', logError));
  }
}

async function generateSignature(secret: string, date: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(date + salt);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

