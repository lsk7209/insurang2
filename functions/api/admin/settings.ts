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
  // 설정은 Cloudflare KV 또는 D1에 저장하는 것을 권장
  // 현재는 환경 변수에서만 읽기
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
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

    return new Response(JSON.stringify({ success: true, data: settings }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
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
      return new Response(
        JSON.stringify({ success: false, error: '솔라피 API 필수 필드가 누락되었습니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Cloudflare Workers에서는 환경 변수를 런타임에 변경할 수 없음
    // 설정은 Cloudflare KV 또는 D1에 저장해야 함
    // TODO: Cloudflare KV 또는 D1에 설정 저장 구현

    return new Response(
      JSON.stringify({
        success: false,
        error: '설정 저장은 Cloudflare Dashboard에서 환경 변수로 관리하거나, Cloudflare KV/D1에 저장해야 합니다.',
      }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Settings save error:', error);
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

