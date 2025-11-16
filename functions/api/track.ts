/**
 * Cloudflare Pages Functions
 * /api/track 엔드포인트
 * 페이지뷰 및 퍼널 이벤트 추적 API
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
}

function createSuccessResponse(data?: any): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function createErrorResponse(error: string, status = 400): Response {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// POST: 페이지뷰 또는 퍼널 이벤트 추적
export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    if (!context.env.DB) {
      console.error('[Track API] DB binding not found');
      return createErrorResponse('데이터베이스 연결 오류가 발생했습니다.', 500);
    }

    const body = await context.request.json();
    const { type, session_id, page_path, referrer, user_agent, ip_address, offer_slug, event_type, lead_id, metadata } = body;

    if (!session_id || !page_path) {
      return createErrorResponse('session_id와 page_path는 필수입니다.', 400);
    }

    // IP 주소 마스킹 (마지막 옥텟 제거)
    let maskedIp = ip_address || '';
    if (maskedIp) {
      const parts = maskedIp.split('.');
      if (parts.length === 4) {
        parts[3] = '0';
        maskedIp = parts.join('.');
      }
    }

    if (type === 'page_view') {
      // 페이지뷰 기록
      await context.env.DB.prepare(
        'INSERT INTO page_views (session_id, page_path, referrer, user_agent, ip_address, offer_slug) VALUES (?, ?, ?, ?, ?, ?)'
      )
        .bind(session_id, page_path, referrer || null, user_agent || null, maskedIp || null, offer_slug || null)
        .run();

      // 퍼널 이벤트도 함께 기록
      await context.env.DB.prepare(
        'INSERT INTO funnel_events (session_id, event_type, page_path, offer_slug, metadata) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(session_id, 'page_view', page_path, offer_slug || null, JSON.stringify({ referrer, user_agent: user_agent?.substring(0, 200) || null }))
        .run();

      return createSuccessResponse({ message: 'Page view tracked' });
    } else if (type === 'funnel_event') {
      // 퍼널 이벤트 기록
      if (!event_type) {
        return createErrorResponse('event_type은 필수입니다.', 400);
      }

      await context.env.DB.prepare(
        'INSERT INTO funnel_events (session_id, event_type, page_path, offer_slug, lead_id, metadata) VALUES (?, ?, ?, ?, ?, ?)'
      )
        .bind(
          session_id,
          event_type,
          page_path,
          offer_slug || null,
          lead_id || null,
          metadata ? JSON.stringify(metadata) : null
        )
        .run();

      return createSuccessResponse({ message: 'Funnel event tracked' });
    } else {
      return createErrorResponse('유효하지 않은 type입니다. page_view 또는 funnel_event를 사용하세요.', 400);
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Track API] Error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

