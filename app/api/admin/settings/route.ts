import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/settings
 * 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 환경 변수에서 설정 읽기
    const settings = {
      smtp_host: process.env.SMTP_HOST || '',
      smtp_port: process.env.SMTP_PORT || '587',
      smtp_secure: process.env.SMTP_SECURE === 'true',
      smtp_user: process.env.SMTP_USER || '',
      smtp_pass: process.env.SMTP_PASS || '',
      smtp_from: process.env.SMTP_FROM || '',
      solapi_api_key: process.env.SOLAPI_API_KEY || '',
      solapi_api_secret: process.env.SOLAPI_API_SECRET || '',
      solapi_sender_phone: process.env.SOLAPI_SENDER_PHONE || '',
    };

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings
 * 설정 저장
 * TODO: 실제로는 환경 변수 파일(.env.local) 또는 데이터베이스에 저장해야 함
 * 현재는 메모리에만 저장되므로 서버 재시작 시 초기화됨
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_user,
      smtp_pass,
      smtp_from,
      solapi_api_key,
      solapi_api_secret,
      solapi_sender_phone,
    } = body;

    // 유효성 검증
    if (!smtp_host || !smtp_user || !smtp_pass || !smtp_from) {
      return NextResponse.json(
        { success: false, error: 'SMTP 필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (!solapi_api_key || !solapi_api_secret || !solapi_sender_phone) {
      return NextResponse.json(
        { success: false, error: '솔라피 API 필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 환경 변수 업데이트 (런타임에만 적용, 영구 저장은 별도 구현 필요)
    process.env.SMTP_HOST = smtp_host;
    process.env.SMTP_PORT = smtp_port || '587';
    process.env.SMTP_SECURE = smtp_secure ? 'true' : 'false';
    process.env.SMTP_USER = smtp_user;
    process.env.SMTP_PASS = smtp_pass;
    process.env.SMTP_FROM = smtp_from;
    process.env.SOLAPI_API_KEY = solapi_api_key;
    process.env.SOLAPI_API_SECRET = solapi_api_secret;
    process.env.SOLAPI_SENDER_PHONE = solapi_sender_phone;

    // TODO: 실제 프로덕션에서는 다음 중 하나를 구현해야 함:
    // 1. 데이터베이스에 설정 저장 (recommended)
    // 2. 환경 변수 파일 업데이트 (권장하지 않음)
    // 3. Cloudflare KV 또는 다른 영구 저장소 사용

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

