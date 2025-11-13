import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/leads
 * 관리자 리드 목록 조회
 * 
 * 주의: 이 파일은 Next.js API Routes입니다.
 * Cloudflare Pages Functions로 마이그레이션하려면 functions/api/admin/leads.ts를 사용하세요.
 * 
 * Cloudflare 환경에서는 functions/api/admin/leads.ts가 자동으로 사용됩니다.
 * 이 파일은 개발 환경에서만 사용됩니다.
 */
export async function GET(request: NextRequest) {
  // Cloudflare Pages Functions가 우선적으로 처리하므로
  // 이 코드는 로컬 개발 환경에서만 실행됩니다.
  return NextResponse.json(
    { 
      success: false, 
      error: '이 엔드포인트는 Cloudflare Pages Functions에서만 사용 가능합니다. functions/api/admin/leads.ts를 확인하세요.' 
    },
    { status: 501 }
  );
}

