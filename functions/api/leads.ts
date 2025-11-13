/**
 * Cloudflare Pages Functions
 * /api/leads 엔드포인트
 * Cloudflare Pages Functions는 자동으로 /api/* 경로를 처리합니다.
 */

import type { D1Database } from '@/types/cloudflare';

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
    const offerResult = await context.env.DB.prepare(
      'SELECT * FROM offers WHERE slug = ? AND status = ?'
    )
      .bind(offer_slug, 'active')
      .first();

    let offer = offerResult as any;
    if (!offer) {
      offer = {
        slug: offer_slug,
        name: 'AI 상담 워크북',
        download_link: 'https://example.com/workbook.pdf',
      };
    }

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
          phoneNumbers,
          organization || null,
          consent_privacy ? 1 : 0,
          consent_marketing ? 1 : 0
        )
        .run();

      leadId = leadResult.meta.last_row_id;
    } catch (dbError: any) {
      console.error('Database error:', {
        error: dbError.message,
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
    if (env.SOLAPI_API_KEY && env.SOLAPI_API_SECRET && env.SOLAPI_SENDER_PHONE) {
      sendSMSAsync(context.env, phoneNumbers, offer.download_link, leadId, context.env.DB).catch(
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
  } catch (error: any) {
    console.error('Lead creation error:', error);
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
  } catch (error: any) {
    console.error('Email send error:', error);
    await db
      .prepare('INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)')
      .bind(leadId, 'email', 'failed', error?.message || 'Unknown error')
      .run();
  }
}

// HTML 이스케이프 함수 (XSS 방지)
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// 이메일 템플릿 생성
function generateEmailTemplate(name: string, downloadLink: string): string {
  const escapedName = escapeHtml(name);
  const escapedLink = escapeHtml(downloadLink);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Pretendard, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1A202C; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #F7FAFC; padding: 30px; border-radius: 8px;">
    <h1 style="color: #002C5F; margin-top: 0;">안녕하세요, ${escapedName}님.</h1>
    
    <p>AI 상담 워크북 신청이 완료되었습니다.</p>
    
    <p>자료는 아래 링크에서 확인하실 수 있습니다:</p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${escapedLink}" 
         style="display: inline-block; background-color: #FF9F4A; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        워크북 다운로드
      </a>
    </div>
    
    <p>문의가 필요하시면 회신 주세요.</p>
    
    <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #718096;">
      ※ 본 내용은 AI가 생성한 예시를 포함하며, 실제 약관·상품 내용은 반드시 확인 바랍니다.
    </p>
  </div>
</body>
</html>
  `.trim();
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
  } catch (error: any) {
    await db
      .prepare('INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)')
      .bind(leadId, 'sms', 'failed', error?.message || 'Unknown error')
      .run();
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

