import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/settings
 * 설정 조회
 * 
 * 주의: 이 파일은 Next.js API Routes입니다.
 * Cloudflare Pages Functions로 마이그레이션하려면 functions/api/admin/settings.ts를 사용하세요.
 * 
 * Cloudflare 환경에서는 functions/api/admin/settings.ts가 자동으로 사용됩니다.
 */
export async function GET(request: NextRequest) {
  // Cloudflare Pages Functions가 우선적으로 처리
  return NextResponse.json(
    {
      success: false,
      error: '이 엔드포인트는 Cloudflare Pages Functions에서만 사용 가능합니다. functions/api/admin/settings.ts를 확인하세요.',
    },
    { status: 501 }
  );
}

/**
 * POST /api/admin/settings
 * 설정 저장
 * 
 * 주의: Cloudflare Workers에서는 환경 변수를 런타임에 변경할 수 없습니다.
 * 설정은 Cloudflare Dashboard에서 환경 변수로 관리하거나,
 * Cloudflare KV 또는 D1에 저장해야 합니다.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: '설정 저장은 Cloudflare Dashboard에서 환경 변수로 관리하거나, Cloudflare KV/D1에 저장해야 합니다.',
    },
    { status: 501 }
  );
}

