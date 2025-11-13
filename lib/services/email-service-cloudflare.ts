/**
 * Email Service for Cloudflare Workers
 * Cloudflare Workers 환경에서는 nodemailer 대신 외부 이메일 서비스 API 사용
 * 예: Resend, SendGrid, Mailgun 등
 */

interface EmailConfig {
  apiKey: string;
  from: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  name: string;
  downloadLink: string;
}

/**
 * Generate email template
 */
function generateEmailTemplate(name: string, downloadLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Pretendard, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1A202C; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #F7FAFC; padding: 30px; border-radius: 8px;">
    <h1 style="color: #002C5F; margin-top: 0;">안녕하세요, ${name}님.</h1>
    
    <p>AI 상담 워크북 신청이 완료되었습니다.</p>
    
    <p>자료는 아래 링크에서 확인하실 수 있습니다:</p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${downloadLink}" 
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

/**
 * Send email using Resend API (예시)
 * 실제 사용 시 Resend, SendGrid, Mailgun 등 선택
 */
export async function sendEmailCloudflare(
  params: SendEmailParams,
  env: { RESEND_API_KEY?: string; SMTP_FROM?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = env.RESEND_API_KEY;
    const from = env.SMTP_FROM || 'noreply@example.com';

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const html = generateEmailTemplate(params.name, params.downloadLink);

    // Resend API 호출
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Email send failed');
    }

    const result = await response.json();
    console.log('Email sent:', result.id);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send email using SendGrid API (대안)
 */
export async function sendEmailSendGrid(
  params: SendEmailParams,
  env: { SENDGRID_API_KEY?: string; SMTP_FROM?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = env.SENDGRID_API_KEY;
    const from = env.SMTP_FROM || 'noreply@example.com';

    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    const html = generateEmailTemplate(params.name, params.downloadLink);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: from },
        subject: params.subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Email send failed');
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

