/**
 * Offers API Endpoint
 * GET /api/offers?slug=workbook
 * 오퍼 정보 조회 API
 */

import type { D1Database } from '@/types/cloudflare';

interface Env {
  DB: D1Database;
}

interface OfferResponse {
  success: boolean;
  data?: {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    status: string;
    download_link: string | null;
    created_at: string;
    updated_at: string;
  };
  error?: string;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response(
        JSON.stringify({ success: false, error: 'slug 파라미터가 필요합니다.' } as OfferResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const offer = await context.env.DB.prepare(
      'SELECT * FROM offers WHERE slug = ? AND status = ?'
    )
      .bind(slug, 'active')
      .first<{
        id: number;
        slug: string;
        name: string;
        description: string | null;
        status: string;
        download_link: string | null;
        created_at: string;
        updated_at: string;
      }>();

    if (!offer) {
      return new Response(
        JSON.stringify({ success: false, error: '오퍼를 찾을 수 없습니다.' } as OfferResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true, data: offer } as OfferResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('getOffer error:', err);
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류가 발생했습니다.' } as OfferResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

