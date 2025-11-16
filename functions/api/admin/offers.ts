/**
 * Cloudflare Pages Functions
 * /api/admin/offers 엔드포인트
 * 오퍼 CRUD 관리 API
 */

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
    rows_read: number;
    rows_written: number;
  };
  results?: T[];
}

interface Env {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
}

interface Offer {
  id: number;
  slug: string;
  name: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  status: 'draft' | 'active' | 'inactive';
  download_link: string | null;
  json_ld: string | null;
  ab_test_variant: 'A' | 'B';
  // 페이지 콘텐츠 필드
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_badge_text: string | null;
  hero_cta_text: string | null;
  hero_background_image: string | null;
  hero_stats_text: string | null;
  preview_title: string | null;
  preview_subtitle: string | null;
  preview_image: string | null;
  preview_features: string | null;
  value_title: string | null;
  value_subtitle: string | null;
  value_cards: string | null;
  trust_title: string | null;
  trust_subtitle: string | null;
  testimonials: string | null;
  form_title: string | null;
  form_subtitle: string | null;
  form_badge_text: string | null;
  form_description: string | null;
  created_at: string;
  updated_at: string;
}

interface OfferCreateRequest {
  slug: string;
  name: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  status?: 'draft' | 'active' | 'inactive';
  download_link?: string;
  json_ld?: string;
  ab_test_variant?: 'A' | 'B';
  // 페이지 콘텐츠 필드
  hero_title?: string;
  hero_subtitle?: string;
  hero_badge_text?: string;
  hero_cta_text?: string;
  hero_background_image?: string;
  hero_stats_text?: string;
  preview_title?: string;
  preview_subtitle?: string;
  preview_image?: string;
  preview_features?: string;
  value_title?: string;
  value_subtitle?: string;
  value_cards?: string;
  trust_title?: string;
  trust_subtitle?: string;
  testimonials?: string;
  form_title?: string;
  form_subtitle?: string;
  form_badge_text?: string;
  form_description?: string;
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function checkBasicAuth(request: Request, env: Env): boolean {
  if (!env.ADMIN_PASSWORD) {
    return true;
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }
  const base64Credentials = authHeader.substring(6);
  const credentials = atob(base64Credentials);
  const [, password] = credentials.split(':');
  return password === env.ADMIN_PASSWORD;
}

// 슬러그 생성 (한글 → 영문 변환)
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET: 오퍼 목록 조회
export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
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

    const url = new URL(context.request.url);
    const offerId = url.searchParams.get('id');
    const slug = url.searchParams.get('slug');

    // 특정 오퍼 조회
    if (offerId) {
      const offer = await context.env.DB.prepare('SELECT * FROM offers WHERE id = ?')
        .bind(parseInt(offerId))
        .first<Offer>();
      
      if (!offer) {
        return createErrorResponse('오퍼를 찾을 수 없습니다.', 404);
      }
      return createSuccessResponse(offer);
    }

    if (slug) {
      const offer = await context.env.DB.prepare('SELECT * FROM offers WHERE slug = ?')
        .bind(slug)
        .first<Offer>();
      
      if (!offer) {
        return createErrorResponse('오퍼를 찾을 수 없습니다.', 404);
      }
      return createSuccessResponse(offer);
    }

    // 오퍼 목록 조회
    const offers = await context.env.DB.prepare(
      'SELECT * FROM offers ORDER BY created_at DESC'
    )
      .all<Offer>();

    return createSuccessResponse(offers.results || []);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Offers API] GET error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// POST: 오퍼 생성
export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
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

    const body = await context.request.json() as OfferCreateRequest;

    // 필수 필드 검증
    if (!body.name) {
      return createErrorResponse('오퍼 이름이 필요합니다.', 400);
    }

    // 슬러그 생성 또는 검증
    const slug = body.slug || generateSlug(body.name);

    // 슬러그 중복 확인
    const existing = await context.env.DB.prepare('SELECT id FROM offers WHERE slug = ?')
      .bind(slug)
      .first<{ id: number }>();

    if (existing) {
      return createErrorResponse('이미 사용 중인 슬러그입니다.', 400);
    }

    // 오퍼 생성
    const result = await context.env.DB.prepare(
      `INSERT INTO offers (
        slug, name, title, description, thumbnail, status, 
        download_link, json_ld, ab_test_variant,
        hero_title, hero_subtitle, hero_badge_text, hero_cta_text, hero_background_image, hero_stats_text,
        preview_title, preview_subtitle, preview_image, preview_features,
        value_title, value_subtitle, value_cards,
        trust_title, trust_subtitle, testimonials,
        form_title, form_subtitle, form_badge_text, form_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        slug,
        body.name,
        body.title || null,
        body.description || null,
        body.thumbnail || null,
        body.status || 'draft',
        body.download_link || null,
        body.json_ld || null,
        body.ab_test_variant || 'A',
        body.hero_title || null,
        body.hero_subtitle || null,
        body.hero_badge_text || null,
        body.hero_cta_text || null,
        body.hero_background_image || null,
        body.hero_stats_text || null,
        body.preview_title || null,
        body.preview_subtitle || null,
        body.preview_image || null,
        body.preview_features || null,
        body.value_title || null,
        body.value_subtitle || null,
        body.value_cards || null,
        body.trust_title || null,
        body.trust_subtitle || null,
        body.testimonials || null,
        body.form_title || null,
        body.form_subtitle || null,
        body.form_badge_text || null,
        body.form_description || null
      )
      .run();

    if (!result.meta.last_row_id) {
      return createErrorResponse('오퍼 생성에 실패했습니다.', 500);
    }

    // 생성된 오퍼 조회
    const newOffer = await context.env.DB.prepare('SELECT * FROM offers WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first<Offer>();

    return createSuccessResponse(newOffer, 201);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Offers API] POST error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// PUT: 오퍼 수정
export async function onRequestPut(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
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

    const url = new URL(context.request.url);
    const offerId = url.searchParams.get('id');

    if (!offerId) {
      return createErrorResponse('오퍼 ID가 필요합니다.', 400);
    }

    const body = await context.request.json() as Partial<OfferCreateRequest>;

    // 오퍼 존재 확인
    const existing = await context.env.DB.prepare('SELECT id FROM offers WHERE id = ?')
      .bind(parseInt(offerId))
      .first<{ id: number }>();

    if (!existing) {
      return createErrorResponse('오퍼를 찾을 수 없습니다.', 404);
    }

    // 슬러그 변경 시 중복 확인
    if (body.slug) {
      const slugConflict = await context.env.DB.prepare(
        'SELECT id FROM offers WHERE slug = ? AND id != ?'
      )
        .bind(body.slug, parseInt(offerId))
        .first<{ id: number }>();

      if (slugConflict) {
        return createErrorResponse('이미 사용 중인 슬러그입니다.', 400);
      }
    }

    // 업데이트 필드 구성
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.slug !== undefined) {
      updates.push('slug = ?');
      values.push(body.slug);
    }
    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title || null);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description || null);
    }
    if (body.thumbnail !== undefined) {
      updates.push('thumbnail = ?');
      values.push(body.thumbnail || null);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(body.status);
    }
    if (body.download_link !== undefined) {
      updates.push('download_link = ?');
      values.push(body.download_link || null);
    }
    if (body.json_ld !== undefined) {
      updates.push('json_ld = ?');
      values.push(body.json_ld || null);
    }
    if (body.ab_test_variant !== undefined) {
      updates.push('ab_test_variant = ?');
      values.push(body.ab_test_variant);
    }
    // 페이지 콘텐츠 필드
    if (body.hero_title !== undefined) {
      updates.push('hero_title = ?');
      values.push(body.hero_title || null);
    }
    if (body.hero_subtitle !== undefined) {
      updates.push('hero_subtitle = ?');
      values.push(body.hero_subtitle || null);
    }
    if (body.hero_badge_text !== undefined) {
      updates.push('hero_badge_text = ?');
      values.push(body.hero_badge_text || null);
    }
    if (body.hero_cta_text !== undefined) {
      updates.push('hero_cta_text = ?');
      values.push(body.hero_cta_text || null);
    }
    if (body.hero_background_image !== undefined) {
      updates.push('hero_background_image = ?');
      values.push(body.hero_background_image || null);
    }
    if (body.hero_stats_text !== undefined) {
      updates.push('hero_stats_text = ?');
      values.push(body.hero_stats_text || null);
    }
    if (body.preview_title !== undefined) {
      updates.push('preview_title = ?');
      values.push(body.preview_title || null);
    }
    if (body.preview_subtitle !== undefined) {
      updates.push('preview_subtitle = ?');
      values.push(body.preview_subtitle || null);
    }
    if (body.preview_image !== undefined) {
      updates.push('preview_image = ?');
      values.push(body.preview_image || null);
    }
    if (body.preview_features !== undefined) {
      updates.push('preview_features = ?');
      values.push(body.preview_features || null);
    }
    if (body.value_title !== undefined) {
      updates.push('value_title = ?');
      values.push(body.value_title || null);
    }
    if (body.value_subtitle !== undefined) {
      updates.push('value_subtitle = ?');
      values.push(body.value_subtitle || null);
    }
    if (body.value_cards !== undefined) {
      updates.push('value_cards = ?');
      values.push(body.value_cards || null);
    }
    if (body.trust_title !== undefined) {
      updates.push('trust_title = ?');
      values.push(body.trust_title || null);
    }
    if (body.trust_subtitle !== undefined) {
      updates.push('trust_subtitle = ?');
      values.push(body.trust_subtitle || null);
    }
    if (body.testimonials !== undefined) {
      updates.push('testimonials = ?');
      values.push(body.testimonials || null);
    }
    if (body.form_title !== undefined) {
      updates.push('form_title = ?');
      values.push(body.form_title || null);
    }
    if (body.form_subtitle !== undefined) {
      updates.push('form_subtitle = ?');
      values.push(body.form_subtitle || null);
    }
    if (body.form_badge_text !== undefined) {
      updates.push('form_badge_text = ?');
      values.push(body.form_badge_text || null);
    }
    if (body.form_description !== undefined) {
      updates.push('form_description = ?');
      values.push(body.form_description || null);
    }

    if (updates.length === 0) {
      return createErrorResponse('수정할 필드가 없습니다.', 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(parseInt(offerId));

    const result = await context.env.DB.prepare(
      `UPDATE offers SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    // 수정된 오퍼 조회
    const updatedOffer = await context.env.DB.prepare('SELECT * FROM offers WHERE id = ?')
      .bind(parseInt(offerId))
      .first<Offer>();

    return createSuccessResponse(updatedOffer);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Offers API] PUT error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// DELETE: 오퍼 삭제
export async function onRequestDelete(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
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

    const url = new URL(context.request.url);
    const offerId = url.searchParams.get('id');

    if (!offerId) {
      return createErrorResponse('오퍼 ID가 필요합니다.', 400);
    }

    // 오퍼 존재 확인
    const existing = await context.env.DB.prepare('SELECT id FROM offers WHERE id = ?')
      .bind(parseInt(offerId))
      .first<{ id: number }>();

    if (!existing) {
      return createErrorResponse('오퍼를 찾을 수 없습니다.', 404);
    }

    // 관련 리드 확인 (안전 체크)
    const relatedLeads = await context.env.DB.prepare(
      'SELECT COUNT(*) as count FROM leads WHERE offer_slug = (SELECT slug FROM offers WHERE id = ?)'
    )
      .bind(parseInt(offerId))
      .first<{ count: number }>();

    if (relatedLeads && relatedLeads.count > 0) {
      return createErrorResponse(
        `이 오퍼에 연결된 리드가 ${relatedLeads.count}개 있습니다. 먼저 리드를 삭제하거나 다른 오퍼로 이동해주세요.`,
        400
      );
    }

    // 오퍼 메트릭 삭제
    await context.env.DB.prepare('DELETE FROM offer_metrics WHERE offer_id = ?')
      .bind(parseInt(offerId))
      .run();

    // 오퍼 삭제
    const result = await context.env.DB.prepare('DELETE FROM offers WHERE id = ?')
      .bind(parseInt(offerId))
      .run();

    if (result.meta.changes === 0) {
      return createErrorResponse('오퍼 삭제에 실패했습니다.', 500);
    }

    return createSuccessResponse({ deleted: true, id: parseInt(offerId) });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Offers API] DELETE error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

