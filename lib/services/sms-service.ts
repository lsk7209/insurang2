/**
 * SMS Service
 * 솔라피 API를 통한 SMS 발송 서비스
 * Cloudflare Workers 호환 버전 (Web Crypto API 사용)
 */

interface SendSMSParams {
  to: string;
  message: string;
  shortLink?: string;
}

/**
 * Generate Solapi API signature using Web Crypto API (Cloudflare Workers 호환)
 */
async function generateSignature(apiSecret: string): Promise<{
  date: string;
  salt: string;
  signature: string;
}> {
  const date = new Date().toISOString();
  // Cloudflare Workers에서 crypto.randomUUID() 사용
  const salt = crypto.randomUUID().replace(/-/g, '');
  
  // Web Crypto API를 사용한 HMAC-SHA256
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
 * Send SMS via Solapi API (Cloudflare Workers 호환)
 * @param params SMS 발송 파라미터
 * @param env 환경 변수 객체 (Cloudflare Workers env)
 */
export async function sendSMS(
  params: SendSMSParams,
  env: {
    SOLAPI_API_KEY?: string;
    SOLAPI_API_SECRET?: string;
    SOLAPI_SENDER_PHONE?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = env.SOLAPI_API_KEY;
    const apiSecret = env.SOLAPI_API_SECRET;
    const senderPhone = env.SOLAPI_SENDER_PHONE;

    if (!apiKey || !apiSecret || !senderPhone) {
      throw new Error('Solapi configuration is missing');
    }

    const { date, salt, signature } = await generateSignature(apiSecret);
    const message = generateMessage(params.shortLink);

    // 솔라피 API 엔드포인트
    const url = 'https://api.solapi.com/messages/v4/send';

    const requestBody = {
      messages: [
        {
          to: params.to,
          from: senderPhone,
          text: message,
        },
      ],
    };

    // Cloudflare Workers에서 fetch API 사용 (axios 대신)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SMS API error: ${errorText}`);
    }

    const result = await response.json();
    if (result.messageId) {
      console.log('SMS sent:', result.messageId);
      return { success: true };
    }

    throw new Error('SMS send failed: No messageId in response');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SMS send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

