/**
 * Cloudflare Pages Function for Admin Authentication
 * /api/admin/auth 엔드포인트
 * 
 * output: 'export'를 사용하면 Next.js middleware가 작동하지 않으므로
 * Cloudflare Pages Functions에서 인증을 처리합니다.
 */

interface Env {
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    const body = await context.request.json();
    const { username, password } = body;

    const adminUsername = context.env.ADMIN_USERNAME;
    const adminPassword = context.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return new Response(
        JSON.stringify({ success: false, error: '서버 설정 오류' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (username === adminUsername && password === adminPassword) {
      // 인증 성공 - 토큰 생성 (Cloudflare Workers 호환)
      // Base64 인코딩은 btoa 사용 (Cloudflare Workers에서 지원)
      const credentials = `${username}:${password}`;
      const token = btoa(credentials);
      
      return new Response(
        JSON.stringify({ success: true, token }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: '인증 실패' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

