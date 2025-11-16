/**
 * Cloudflare Pages Functions
 * /api/admin/settings 엔드포인트
 */

import type { D1Database } from '../../../types/cloudflare';

interface Env {
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  SMTP_FROM?: string;
  SOLAPI_API_KEY?: string;
  SOLAPI_API_SECRET?: string;
  SOLAPI_SENDER_PHONE?: string;
  DB?: D1Database;
  ADMIN_PASSWORD?: string;
}

function checkBasicAuth(request: Request, env: Env): boolean {
  // 개발 단계: ADMIN_PASSWORD가 설정되지 않았으면 인증 건너뛰기
  if (!env.ADMIN_PASSWORD) {
    console.warn('[Admin Settings API] ADMIN_PASSWORD not set, skipping authentication (development mode)');
    return true;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.substring(6);
  const credentials = atob(base64Credentials);
  const [username, password] = credentials.split(':');

  const expectedPassword = env.ADMIN_PASSWORD;
  return password === expectedPassword;
}

function createSuccessResponse<T>(data?: T, status = 200): Response {
  const body: { success: boolean; data?: T } = { success: true };
  if (data !== undefined) {
    body.data = data;
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// CORS preflight 요청 처리
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestGet(context: {
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

    const settings = {
      smtp_host: '', // Cloudflare Workers에서는 SMTP 직접 사용 불가
      smtp_port: '587',
      smtp_secure: false,
      smtp_user: '',
      smtp_pass: '',
      smtp_from: context.env.SMTP_FROM || '',
      resend_api_key: context.env.RESEND_API_KEY || '',
      sendgrid_api_key: context.env.SENDGRID_API_KEY || '',
      solapi_api_key: context.env.SOLAPI_API_KEY || '',
      solapi_api_secret: context.env.SOLAPI_API_SECRET ? '***' : '', // 보안을 위해 마스킹
      solapi_sender_phone: context.env.SOLAPI_SENDER_PHONE || '',
    };

    return createSuccessResponse(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
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
    const {
      resend_api_key,
      sendgrid_api_key,
      smtp_from,
      solapi_api_key,
      solapi_api_secret,
      solapi_sender_phone,
    } = body;

    // 유효성 검증
    if (!solapi_api_key || !solapi_api_secret || !solapi_sender_phone) {
      return createErrorResponse('솔라피 API 필수 필드가 누락되었습니다.', 400);
    }

    // Cloudflare Workers에서는 환경 변수를 런타임에 변경할 수 없음
    // 설정은 Cloudflare KV 또는 D1에 저장해야 함
    // 현재는 Cloudflare Dashboard에서 환경 변수로 관리하는 것을 권장
    return createErrorResponse(
      '설정 저장은 Cloudflare Dashboard에서 환경 변수로 관리하거나, Cloudflare KV/D1에 저장해야 합니다. 현재는 읽기 전용입니다.',
      501
    );
  } catch (error) {
    console.error('Settings save error:', error);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}
