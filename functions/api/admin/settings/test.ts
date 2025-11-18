/**
 * Cloudflare Pages Functions
 * /api/admin/settings/test 엔드포인트
 * 이메일/SMS 테스트 발송
 */

interface Env {
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  SMTP_FROM?: string;
  SOLAPI_API_KEY?: string;
  SOLAPI_API_SECRET?: string;
  SOLAPI_SENDER_PHONE?: string;
  ADMIN_PASSWORD?: string;
}

function checkBasicAuth(request: Request, env: Env): boolean {
  if (!env.ADMIN_PASSWORD) {
    return true;
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }
  const base64Credentials = authHeader.substring(6);
  const credentials = atob(base64Credentials);
  const [, password] = credentials.split(':');
  return password === env.ADMIN_PASSWORD;
}

function createSuccessResponse<T>(data?: T): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function createErrorResponse(error: string, status = 400): Response {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// 이메일 템플릿 생성 (인라인)
function generateEmailTemplate(name: string, downloadLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">신청해 주셔서 감사합니다!</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">안녕하세요, <strong>${name}</strong>님,</p>
    <p style="font-size: 16px; margin-bottom: 20px;">AI 상담 워크북 신청이 완료되었습니다.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${downloadLink}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">워크북 다운로드</a>
    </div>
    <p style="font-size: 14px; color: #666; margin-top: 30px;">문의사항이 있으시면 언제든지 연락주세요.</p>
  </div>
</body>
</html>
  `.trim();
}

// SMS 메시지 생성
function generateSMSMessage(): string {
  return '[인슈랑] 신청 완료되었습니다. 자료 안내는 이메일로 발송되었습니다. 확인 부탁드립니다.';
}

// 솔라피 API 서명 생성
async function generateSolapiSignature(apiSecret: string): Promise<{
  date: string;
  salt: string;
  signature: string;
}> {
  const date = new Date().toISOString();
  const salt = crypto.randomUUID().replace(/-/g, '');
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(date + salt)
  );
  
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { date, salt, signature };
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    // Basic Auth 확인
    if (!checkBasicAuth(context.request, context.env)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const body = await context.request.json();
    const { type, email, phone } = body;

    if (!type || (type !== 'email' && type !== 'sms')) {
      return createErrorResponse('유효하지 않은 테스트 타입입니다. email 또는 sms를 지정해주세요.', 400);
    }

    if (type === 'email') {
      if (!email) {
        return createErrorResponse('이메일 주소가 필요합니다.', 400);
      }

      const apiKey = context.env.RESEND_API_KEY || context.env.SENDGRID_API_KEY;
      const from = context.env.SMTP_FROM || 'noreply@example.com';

      if (!apiKey) {
        return createErrorResponse('이메일 API 키가 설정되지 않았습니다.', 400);
      }

      const html = generateEmailTemplate('테스트', 'https://example.com/workbook.pdf');

      // Resend API 사용
      if (context.env.RESEND_API_KEY) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: email,
            subject: '[테스트] AI 상담 워크북',
            html,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          return createErrorResponse(`이메일 발송 실패: ${error.message || 'Unknown error'}`, 500);
        }

        return createSuccessResponse({ message: '테스트 이메일이 성공적으로 발송되었습니다.' });
      }

      // SendGrid API 사용
      if (context.env.SENDGRID_API_KEY) {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${context.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from: { email: from },
            subject: '[테스트] AI 상담 워크북',
            content: [{ type: 'text/html', value: html }],
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          return createErrorResponse(`이메일 발송 실패: ${error}`, 500);
        }

        return createSuccessResponse({ message: '테스트 이메일이 성공적으로 발송되었습니다.' });
      }
    }

    if (type === 'sms') {
      if (!phone) {
        return createErrorResponse('전화번호가 필요합니다.', 400);
      }

      // D1에서 설정 조회 (없으면 환경 변수에서 가져오기)
      let apiKey: string | undefined;
      let apiSecret: string | undefined;
      let senderPhone: string | undefined;

      if (context.env.DB) {
        const solapiApiKey = await context.env.DB.prepare('SELECT value FROM settings WHERE key = ?')
          .bind('solapi_api_key')
          .first<{ value: string }>();
        apiKey = solapiApiKey?.value;

        const solapiApiSecret = await context.env.DB.prepare('SELECT value FROM settings WHERE key = ?')
          .bind('solapi_api_secret')
          .first<{ value: string }>();
        apiSecret = solapiApiSecret?.value;

        const solapiSenderPhone = await context.env.DB.prepare('SELECT value FROM settings WHERE key = ?')
          .bind('solapi_sender_phone')
          .first<{ value: string }>();
        senderPhone = solapiSenderPhone?.value;
      }

      // D1에 없으면 환경 변수에서 가져오기
      apiKey = apiKey || context.env.SOLAPI_API_KEY;
      apiSecret = apiSecret || context.env.SOLAPI_API_SECRET;
      senderPhone = senderPhone || context.env.SOLAPI_SENDER_PHONE;

      if (!apiKey || !apiSecret || !senderPhone) {
        return createErrorResponse('솔라피 API 설정이 완료되지 않았습니다.', 400);
      }

      const { date, salt, signature } = await generateSolapiSignature(apiSecret);
      const message = generateSMSMessage();

      const response = await fetch('https://api.solapi.com/messages/v4/send', {
        method: 'POST',
        headers: {
          Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              to: phone.replace(/[^\d]/g, ''),
              from: senderPhone,
              text: message,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return createErrorResponse(`SMS 발송 실패: ${errorText}`, 500);
      }

      const result = await response.json();
      if (result.messageId) {
        return createSuccessResponse({ message: '테스트 SMS가 성공적으로 발송되었습니다.' });
      }

      return createErrorResponse('SMS 발송에 실패했습니다.', 500);
    }

    return createErrorResponse('알 수 없는 오류가 발생했습니다.', 500);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Test send error:', err);
    return createErrorResponse(`서버 오류: ${err.message}`, 500);
  }
}

