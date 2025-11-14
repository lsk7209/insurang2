/**
 * Offers API Endpoint
 * GET /api/offers?slug=workbook
 * 오퍼 정보 조회 API
 */

import type { D1Database } from '@/types/cloudflare';
import { createSuccessResponse, createErrorResponse, createCorsResponse } from '@/lib/utils/api-response';
import { logError } from '@/lib/utils/error-logger';

interface Env {
  DB: D1Database;
}

interface OfferData {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  download_link: string | null;
  created_at: string;
  updated_at: string;
}

// CORS preflight 요청 처리
export async function onRequestOptions(): Promise<Response> {
  return createCorsResponse();
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return createErrorResponse('slug 파라미터가 필요합니다.', 400);
    }

    const offer = await context.env.DB.prepare(
      'SELECT * FROM offers WHERE slug = ? AND status = ?'
    )
      .bind(slug, 'active')
      .first<OfferData>();

    if (!offer) {
      return createErrorResponse('오퍼를 찾을 수 없습니다.', 404);
    }

    return createSuccessResponse(offer);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('[Offers API] Error:', err);
    await logError(context.env.DB, err, {
      operation: 'get_offer',
    });
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

