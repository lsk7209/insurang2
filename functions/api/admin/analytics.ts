/**
 * Cloudflare Pages Functions
 * /api/admin/analytics 엔드포인트
 * 트래픽 통계 및 퍼널 분석 API
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

function createSuccessResponse<T>(data?: T): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// GET: 트래픽 통계 및 퍼널 분석 데이터 조회
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
    const type = url.searchParams.get('type'); // 'traffic' or 'funnel'
    const period = url.searchParams.get('period') || '7d'; // '1d', '7d', '30d', 'all'
    const offerSlug = url.searchParams.get('offer_slug'); // 특정 오퍼 필터

    // 기간 계산
    let dateFilter = '';
    const params: any[] = [];
    if (period === '1d') {
      dateFilter = "AND created_at >= datetime('now', '-1 day')";
    } else if (period === '7d') {
      dateFilter = "AND created_at >= datetime('now', '-7 days')";
    } else if (period === '30d') {
      dateFilter = "AND created_at >= datetime('now', '-30 days')";
    }

    if (type === 'funnel') {
      // 퍼널 분석 데이터
      const funnelData = await getFunnelData(context.env.DB, dateFilter, offerSlug);
      return createSuccessResponse(funnelData);
    } else {
      // 트래픽 통계 데이터
      const trafficData = await getTrafficData(context.env.DB, dateFilter, offerSlug);
      return createSuccessResponse(trafficData);
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Analytics API] Error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

async function getTrafficData(db: D1Database, dateFilter: string, offerSlug?: string | null) {
  const offerFilter = offerSlug ? 'AND offer_slug = ?' : '';
  const params: any[] = [];
  if (offerSlug) params.push(offerSlug);

  try {
    // 총 페이지뷰
    const totalViews = await db.prepare(
      `SELECT COUNT(*) as count FROM page_views WHERE 1=1 ${dateFilter} ${offerFilter}`
    )
      .bind(...params)
      .first<{ count: number }>();

    // 고유 세션 수
    const uniqueSessions = await db.prepare(
      `SELECT COUNT(DISTINCT session_id) as count FROM page_views WHERE 1=1 ${dateFilter} ${offerFilter}`
    )
      .bind(...params)
      .first<{ count: number }>();

    // 페이지별 뷰 수
    const pageViews = await db.prepare(
      `SELECT page_path, COUNT(*) as views, COUNT(DISTINCT session_id) as unique_visitors
       FROM page_views
       WHERE 1=1 ${dateFilter} ${offerFilter}
       GROUP BY page_path
       ORDER BY views DESC
       LIMIT 20`
    )
      .bind(...params)
      .all<{ page_path: string; views: number; unique_visitors: number }>();

    // 일별 트래픽 추이
    const dailyTraffic = await db.prepare(
      `SELECT 
         date(created_at) as date,
         COUNT(*) as views,
         COUNT(DISTINCT session_id) as unique_visitors
       FROM page_views
       WHERE 1=1 ${dateFilter} ${offerFilter}
       GROUP BY date(created_at)
       ORDER BY date ASC`
    )
      .bind(...params)
      .all<{ date: string; views: number; unique_visitors: number }>();

    // 오퍼별 트래픽
    const offerTrafficParams: any[] = [];
    const offerTraffic = await db.prepare(
      `SELECT 
         offer_slug,
         COUNT(*) as views,
         COUNT(DISTINCT session_id) as unique_visitors
       FROM page_views
       WHERE offer_slug IS NOT NULL ${dateFilter}
       GROUP BY offer_slug
       ORDER BY views DESC`
    )
      .bind(...offerTrafficParams)
      .all<{ offer_slug: string; views: number; unique_visitors: number }>();

    return {
      totalViews: totalViews?.count || 0,
      uniqueSessions: uniqueSessions?.count || 0,
      pageViews: pageViews.results || [],
      dailyTraffic: dailyTraffic.results || [],
      offerTraffic: offerTraffic.results || [],
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Analytics API] getTrafficData error:', err);
    return {
      totalViews: 0,
      uniqueSessions: 0,
      pageViews: [],
      dailyTraffic: [],
      offerTraffic: [],
    };
  }
}

async function getFunnelData(db: D1Database, dateFilter: string, offerSlug?: string | null) {
  const offerFilter = offerSlug ? 'AND offer_slug = ?' : '';
  const params: any[] = [];
  if (offerSlug) params.push(offerSlug);

  try {
    // 퍼널 단계별 이벤트 수
    const funnelSteps = await db.prepare(
      `SELECT 
         event_type,
         COUNT(DISTINCT session_id) as sessions,
         COUNT(*) as events
       FROM funnel_events
       WHERE 1=1 ${dateFilter} ${offerFilter}
       GROUP BY event_type
       ORDER BY 
         CASE event_type
           WHEN 'page_view' THEN 1
           WHEN 'form_start' THEN 2
           WHEN 'form_submit' THEN 3
           WHEN 'thank_you' THEN 4
           WHEN 'download' THEN 5
           ELSE 6
         END`
    )
      .bind(...params)
      .all<{ event_type: string; sessions: number; events: number }>();

    // 세션별 퍼널 진행도
    const sessionFunnels = await db.prepare(
      `SELECT 
         session_id,
         GROUP_CONCAT(event_type, ' > ') as funnel_path,
         COUNT(DISTINCT event_type) as steps_completed,
         MAX(created_at) as last_event_at
       FROM funnel_events
       WHERE 1=1 ${dateFilter} ${offerFilter}
       GROUP BY session_id
       ORDER BY last_event_at DESC
       LIMIT 100`
    )
      .bind(...params)
      .all<{ session_id: string; funnel_path: string; steps_completed: number; last_event_at: string }>();

    // 퍼널 전환율 계산
    const pageViews = await db.prepare(
      `SELECT COUNT(DISTINCT session_id) as count FROM funnel_events WHERE event_type = 'page_view' ${dateFilter} ${offerFilter}`
    )
      .bind(...params)
      .first<{ count: number }>();

    const formStarts = await db.prepare(
      `SELECT COUNT(DISTINCT session_id) as count FROM funnel_events WHERE event_type = 'form_start' ${dateFilter} ${offerFilter}`
    )
      .bind(...params)
      .first<{ count: number }>();

    const formSubmits = await db.prepare(
      `SELECT COUNT(DISTINCT session_id) as count FROM funnel_events WHERE event_type = 'form_submit' ${dateFilter} ${offerFilter}`
    )
      .bind(...params)
      .first<{ count: number }>();

    const thankYous = await db.prepare(
      `SELECT COUNT(DISTINCT session_id) as count FROM funnel_events WHERE event_type = 'thank_you' ${dateFilter} ${offerFilter}`
    )
      .bind(...params)
      .first<{ count: number }>();

    const pageViewCount = pageViews?.count || 0;
    const formStartCount = formStarts?.count || 0;
    const formSubmitCount = formSubmits?.count || 0;
    const thankYouCount = thankYous?.count || 0;

    return {
      funnelSteps: funnelSteps.results || [],
      sessionFunnels: sessionFunnels.results || [],
      conversionRates: {
        pageViewToFormStart: pageViewCount > 0 ? (formStartCount / pageViewCount) * 100 : 0,
        formStartToSubmit: formStartCount > 0 ? (formSubmitCount / formStartCount) * 100 : 0,
        formSubmitToThankYou: formSubmitCount > 0 ? (thankYouCount / formSubmitCount) * 100 : 0,
        overall: pageViewCount > 0 ? (thankYouCount / pageViewCount) * 100 : 0,
      },
      counts: {
        pageViews: pageViewCount,
        formStarts: formStartCount,
        formSubmits: formSubmitCount,
        thankYous: thankYouCount,
      },
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Analytics API] getFunnelData error:', err);
    return {
      funnelSteps: [],
      sessionFunnels: [],
      conversionRates: {
        pageViewToFormStart: 0,
        formStartToSubmit: 0,
        formSubmitToThankYou: 0,
        overall: 0,
      },
      counts: {
        pageViews: 0,
        formStarts: 0,
        formSubmits: 0,
        thankYous: 0,
      },
    };
  }
}

