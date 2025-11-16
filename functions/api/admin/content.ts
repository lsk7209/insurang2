/**
 * Cloudflare Pages Functions
 * /api/admin/content 엔드포인트
 * 콘텐츠 아티클 관리 API
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

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author: string | null;
  category: string | null;
  tags: string | null;
  featured_image: string | null;
  published_at: string | null;
  status: 'draft' | 'published' | 'archived';
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

interface ArticleCreateRequest {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author?: string;
  category?: string;
  tags?: string;
  featured_image?: string;
  published_at?: string;
  status?: 'draft' | 'published' | 'archived';
  seo_title?: string;
  seo_description?: string;
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

// GET: 아티클 목록 조회
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
    const articleId = url.searchParams.get('id');
    const slug = url.searchParams.get('slug');
    const status = url.searchParams.get('status');

    // 특정 아티클 조회
    if (articleId) {
      const article = await context.env.DB.prepare('SELECT * FROM content_articles WHERE id = ?')
        .bind(parseInt(articleId))
        .first<ArticleRow>();

      if (!article) {
        return createErrorResponse('아티클을 찾을 수 없습니다.', 404);
      }

      return createSuccessResponse(mapArticleRow(article));
    }

    if (slug) {
      const article = await context.env.DB.prepare('SELECT * FROM content_articles WHERE slug = ?')
        .bind(slug)
        .first<ArticleRow>();

      if (!article) {
        return createErrorResponse('아티클을 찾을 수 없습니다.', 404);
      }

      return createSuccessResponse(mapArticleRow(article));
    }

    // 아티클 목록 조회
    let query = 'SELECT * FROM content_articles';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const articles = await context.env.DB.prepare(query)
      .bind(...params)
      .all<ArticleRow>();

    const result = (articles.results || []).map(mapArticleRow);

    return createSuccessResponse(result);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Content API] GET error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    return createErrorResponse(`서버 오류가 발생했습니다: ${err.message}`, 500);
  }
}

interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author: string | null;
  category: string | null;
  tags: string | null;
  featured_image: string | null;
  published_at: string | null;
  status: string;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

function mapArticleRow(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    category: row.category,
    tags: row.tags,
    featured_image: row.featured_image,
    published_at: row.published_at,
    status: row.status as 'draft' | 'published' | 'archived',
    view_count: row.view_count,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// POST: 아티클 생성
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

    const body = await context.request.json() as ArticleCreateRequest;

    // 필수 필드 검증
    if (!body.title || !body.slug || !body.content) {
      return createErrorResponse('제목, 슬러그, 본문은 필수 필드입니다.', 400);
    }

    // 슬러그 중복 확인
    const existingArticle = await context.env.DB.prepare('SELECT id FROM content_articles WHERE slug = ?')
      .bind(body.slug)
      .first<{ id: number }>();

    if (existingArticle) {
      return createErrorResponse('이미 존재하는 슬러그입니다.', 409);
    }

    // 아티클 생성
    const result = await context.env.DB.prepare(
      `INSERT INTO content_articles (
        title, slug, excerpt, content, author, category, tags,
        featured_image, published_at, status, seo_title, seo_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        body.title,
        body.slug,
        body.excerpt || null,
        body.content,
        body.author || null,
        body.category || null,
        body.tags || null,
        body.featured_image || null,
        body.published_at || null,
        body.status || 'draft',
        body.seo_title || null,
        body.seo_description || null
      )
      .run();

    if (!result.meta.last_row_id) {
      return createErrorResponse('아티클 생성에 실패했습니다.', 500);
    }

    // 생성된 아티클 조회
    const newArticle = await context.env.DB.prepare('SELECT * FROM content_articles WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first<ArticleRow>();

    return createSuccessResponse(mapArticleRow(newArticle!), 201);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Content API] POST error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// PUT: 아티클 수정
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
    const articleId = url.searchParams.get('id');

    if (!articleId) {
      return createErrorResponse('아티클 ID가 필요합니다.', 400);
    }

    const body = await context.request.json() as Partial<ArticleCreateRequest>;

    // 아티클 존재 확인
    const existing = await context.env.DB.prepare('SELECT id FROM content_articles WHERE id = ?')
      .bind(parseInt(articleId))
      .first<{ id: number }>();

    if (!existing) {
      return createErrorResponse('아티클을 찾을 수 없습니다.', 404);
    }

    // 업데이트 필드 구성
    const updates: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.slug !== undefined) {
      // 슬러그 중복 확인 (자기 자신 제외)
      const duplicateSlug = await context.env.DB.prepare('SELECT id FROM content_articles WHERE slug = ? AND id != ?')
        .bind(body.slug, parseInt(articleId))
        .first<{ id: number }>();

      if (duplicateSlug) {
        return createErrorResponse('이미 존재하는 슬러그입니다.', 409);
      }

      updates.push('slug = ?');
      values.push(body.slug);
    }
    if (body.excerpt !== undefined) {
      updates.push('excerpt = ?');
      values.push(body.excerpt || null);
    }
    if (body.content !== undefined) {
      updates.push('content = ?');
      values.push(body.content);
    }
    if (body.author !== undefined) {
      updates.push('author = ?');
      values.push(body.author || null);
    }
    if (body.category !== undefined) {
      updates.push('category = ?');
      values.push(body.category || null);
    }
    if (body.tags !== undefined) {
      updates.push('tags = ?');
      values.push(body.tags || null);
    }
    if (body.featured_image !== undefined) {
      updates.push('featured_image = ?');
      values.push(body.featured_image || null);
    }
    if (body.published_at !== undefined) {
      updates.push('published_at = ?');
      values.push(body.published_at || null);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(body.status);
    }
    if (body.seo_title !== undefined) {
      updates.push('seo_title = ?');
      values.push(body.seo_title || null);
    }
    if (body.seo_description !== undefined) {
      updates.push('seo_description = ?');
      values.push(body.seo_description || null);
    }

    if (updates.length === 0) {
      return createErrorResponse('수정할 필드가 없습니다.', 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(parseInt(articleId));

    await context.env.DB.prepare(
      `UPDATE content_articles SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    // 수정된 아티클 조회
    const updatedArticle = await context.env.DB.prepare('SELECT * FROM content_articles WHERE id = ?')
      .bind(parseInt(articleId))
      .first<ArticleRow>();

    return createSuccessResponse(mapArticleRow(updatedArticle!));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Content API] PUT error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// DELETE: 아티클 삭제
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
    const articleId = url.searchParams.get('id');

    if (!articleId) {
      return createErrorResponse('아티클 ID가 필요합니다.', 400);
    }

    // 아티클 존재 확인
    const existing = await context.env.DB.prepare('SELECT id FROM content_articles WHERE id = ?')
      .bind(parseInt(articleId))
      .first<{ id: number }>();

    if (!existing) {
      return createErrorResponse('아티클을 찾을 수 없습니다.', 404);
    }

    // 관련 CTAs 삭제
    await context.env.DB.prepare('DELETE FROM content_ctas WHERE article_id = ?')
      .bind(parseInt(articleId))
      .run();

    // 아티클 삭제
    const result = await context.env.DB.prepare('DELETE FROM content_articles WHERE id = ?')
      .bind(parseInt(articleId))
      .run();

    if (result.meta.changes === 0) {
      return createErrorResponse('아티클 삭제에 실패했습니다.', 500);
    }

    return createSuccessResponse({ deleted: true, id: parseInt(articleId) });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Content API] DELETE error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

