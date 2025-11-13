import axios from 'axios';
import crypto from 'crypto';

/**
 * SMS Service
 * 솔라피 API를 통한 SMS 발송 서비스
 */

interface SendSMSParams {
  to: string;
  message: string;
  shortLink?: string;
}

/**
 * Generate Solapi API signature
 */
function generateSignature(apiKey: string, apiSecret: string): {
  date: string;
  salt: string;
  signature: string;
} {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString('hex');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex');

  return { date, salt, signature };
}

/**
 * Generate SMS message template
 */
function generateMessage(shortLink?: string): string {
  const baseMessage = '[인슈랑] 신청 완료되었습니다. 안내 메일을 확인해 주세요.';
  
  if (shortLink) {
    return `${baseMessage} 자료: ${shortLink}`;
  }
  
  return baseMessage;
}

/**
 * Send SMS via Solapi API
 */
export async function sendSMS(params: SendSMSParams): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    const senderPhone = process.env.SOLAPI_SENDER_PHONE;

    if (!apiKey || !apiSecret || !senderPhone) {
      throw new Error('Solapi configuration is missing');
    }

    const { date, salt, signature } = generateSignature(apiKey, apiSecret);
    const message = generateMessage(params.shortLink);

    // 솔라피 API 엔드포인트
    const url = 'https://api.solapi.com/messages/v4/send';

    const requestBody = {
      message: {
        to: params.to,
        from: senderPhone,
        text: message,
      },
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.messageId) {
      console.log('SMS sent:', response.data.messageId);
      return { success: true };
    }

    throw new Error('SMS send failed: No messageId in response');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SMS send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

