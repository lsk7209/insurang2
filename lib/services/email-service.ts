import nodemailer from 'nodemailer';

/**
 * Email Service
 * SMTP를 통한 이메일 발송 서비스
 */

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  name: string;
  downloadLink: string;
}

/**
 * Get email transporter
 */
function getTransporter() {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  if (!config.host || !config.auth.user || !config.auth.pass) {
    throw new Error('SMTP configuration is missing');
  }

  return nodemailer.createTransport(config);
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
 * Send email
 */
export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    
    const html = generateEmailTemplate(params.name, params.downloadLink);
    
    const info = await transporter.sendMail({
      from: `"인슈랑" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: params.to,
      subject: params.subject,
      html,
    });
    
    console.log('Email sent:', info.messageId);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

