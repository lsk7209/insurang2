import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for Basic Auth
 * 관리자 페이지 접근 시 Basic Auth 적용
 */
export function middleware(request: NextRequest) {
  // 관리자 페이지 경로 체크
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Basic Auth 헤더 확인
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      // 인증 요청
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      });
    }

    // Basic Auth 디코딩
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // 환경 변수에서 인증 정보 확인
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // 프로덕션 환경에서는 환경 변수 필수
    if (!adminUsername || !adminPassword) {
      console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be set');
      return new NextResponse('Server configuration error', {
        status: 500,
      });
    }

    if (username !== adminUsername || password !== adminPassword) {
      return new NextResponse('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};

