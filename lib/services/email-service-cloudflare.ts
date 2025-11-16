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

import { generateEmailTemplate } from '../utils/email-template';

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

