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

    if (!context.env.DB) {
      return createErrorResponse('데이터베이스 연결 오류가 발생했습니다.', 500);
    }

    // D1에서 설정 조회 (없으면 환경 변수에서 가져오기)
    const solapiApiKey = await context.env.DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind('solapi_api_key')
      .first<{ value: string }>();
    
    const solapiApiSecret = await context.env.DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind('solapi_api_secret')
      .first<{ value: string }>();
    
    const solapiSenderPhone = await context.env.DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind('solapi_sender_phone')
      .first<{ value: string }>();

    const settings = {
      smtp_host: '', // Cloudflare Workers에서는 SMTP 직접 사용 불가
      smtp_port: '587',
      smtp_secure: false,
      smtp_user: '',
      smtp_pass: '',
      smtp_from: context.env.SMTP_FROM || '',
      resend_api_key: context.env.RESEND_API_KEY || '',
      sendgrid_api_key: context.env.SENDGRID_API_KEY || '',
      solapi_api_key: solapiApiKey?.value || context.env.SOLAPI_API_KEY || '',
      solapi_api_secret: solapiApiSecret?.value ? '***' : (context.env.SOLAPI_API_SECRET ? '***' : ''), // 보안을 위해 마스킹
      solapi_sender_phone: solapiSenderPhone?.value || context.env.SOLAPI_SENDER_PHONE || '',
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

    if (!context.env.DB) {
      return createErrorResponse('데이터베이스 연결 오류가 발생했습니다.', 500);
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

    // 기존 설정 조회 (API Secret이 없을 때 기존 값 유지)
    const existingSolapiApiSecret = await context.env.DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind('solapi_api_secret')
      .first<{ value: string }>();

    // 실제로 저장할 값 결정 (API Secret이 없거나 빈 문자열이면 기존 값 유지)
    const finalSolapiApiSecret = (solapi_api_secret && typeof solapi_api_secret === 'string' && solapi_api_secret.trim() !== '' && solapi_api_secret !== '***') 
      ? solapi_api_secret 
      : (existingSolapiApiSecret?.value || '');

    // 유효성 검증
    if (!solapi_api_key || !finalSolapiApiSecret || !solapi_sender_phone) {
      return createErrorResponse('솔라피 API 필수 필드가 누락되었습니다.', 400);
    }

    // 발신자 번호 형식 검증 (숫자만)
    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(solapi_sender_phone)) {
      return createErrorResponse('발신자 번호는 숫자만 입력해주세요.', 400);
    }

    // D1에 설정 저장 (UPSERT)
    const now = new Date().toISOString();

    try {
      // solapi_api_key 저장
      await context.env.DB.prepare(
        `INSERT INTO settings (key, value, description, updated_at) 
         VALUES (?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`
      )
        .bind('solapi_api_key', solapi_api_key, '솔라피 API Key', now, solapi_api_key, now)
        .run();

      // solapi_api_secret 저장 (기존 값 유지 또는 새 값 저장)
      await context.env.DB.prepare(
        `INSERT INTO settings (key, value, description, updated_at) 
         VALUES (?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`
      )
        .bind('solapi_api_secret', finalSolapiApiSecret, '솔라피 API Secret', now, finalSolapiApiSecret, now)
        .run();

      // solapi_sender_phone 저장
      await context.env.DB.prepare(
        `INSERT INTO settings (key, value, description, updated_at) 
         VALUES (?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`
      )
        .bind('solapi_sender_phone', solapi_sender_phone, '솔라피 발신자 번호', now, solapi_sender_phone, now)
        .run();
    } catch (dbError) {
      const dbErrorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      console.error('Database operation error:', dbErrorMessage);
      
      // settings 테이블이 없을 수 있음
      if (dbErrorMessage.includes('no such table: settings') || dbErrorMessage.includes('no such table')) {
        return createErrorResponse(
          'settings 테이블이 존재하지 않습니다. 데이터베이스 마이그레이션을 실행해주세요.',
          500
        );
      }
      
      throw dbError;
    }

    return createSuccessResponse({ message: '설정이 저장되었습니다.' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Settings save error:', errorMessage, errorStack);
    
    // 더 자세한 에러 정보 반환 (개발 환경에서만)
    return createErrorResponse(
      `서버 오류가 발생했습니다: ${errorMessage}`,
      500
    );
  }
}
