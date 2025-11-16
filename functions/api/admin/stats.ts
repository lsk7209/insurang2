/**
 * Cloudflare Pages Functions
 * /api/admin/stats 엔드포인트
 * 대시보드 통계 API
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

interface OfferStats {
  offer_slug: string;
  offer_name: string;
  total_leads: number;
  today_leads: number;
  conversion_rate: number;
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

    // 전체 통계
    const totalLeads = await context.env.DB.prepare('SELECT COUNT(*) as count FROM leads')
      .first<{ count: number }>();

    const today = new Date().toISOString().split('T')[0];
    const todayLeads = await context.env.DB.prepare(
      "SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) = ?"
    )
      .bind(today)
      .first<{ count: number }>();

    const emailSuccess = await context.env.DB.prepare(
      "SELECT COUNT(*) as count FROM message_logs WHERE channel = 'email' AND status = 'success'"
    )
      .first<{ count: number }>();

    const smsSuccess = await context.env.DB.prepare(
      "SELECT COUNT(*) as count FROM message_logs WHERE channel = 'sms' AND status = 'success'"
    )
      .first<{ count: number }>();

    // 오퍼별 통계
    const offerStatsQuery = await context.env.DB.prepare(`
      SELECT 
        o.slug as offer_slug,
        o.name as offer_name,
        COUNT(l.id) as total_leads,
        SUM(CASE WHEN DATE(l.created_at) = ? THEN 1 ELSE 0 END) as today_leads
      FROM offers o
      LEFT JOIN leads l ON o.slug = l.offer_slug
      GROUP BY o.id, o.slug, o.name
      ORDER BY total_leads DESC
    `)
      .bind(today)
      .all<{
        offer_slug: string;
        offer_name: string;
        total_leads: number;
        today_leads: number;
      }>();

    // 전환율 계산 (리드 수 대비 메시지 발송 성공률)
    const offerStats: OfferStats[] = (offerStatsQuery.results || []).map((offer) => {
      // 간단한 전환율: 전체 리드 대비 이메일/SMS 발송 성공률
      // 실제로는 더 복잡한 로직이 필요할 수 있음
      const conversionRate = offer.total_leads > 0 
        ? ((emailSuccess?.count || 0) + (smsSuccess?.count || 0)) / (offer.total_leads * 2) * 100
        : 0;

      return {
        offer_slug: offer.offer_slug,
        offer_name: offer.offer_name,
        total_leads: offer.total_leads,
        today_leads: offer.today_leads || 0,
        conversion_rate: Math.round(conversionRate * 100) / 100, // 소수점 2자리
      };
    });

    return createSuccessResponse({
      totalLeads: totalLeads?.count || 0,
      todayLeads: todayLeads?.count || 0,
      emailSuccess: emailSuccess?.count || 0,
      smsSuccess: smsSuccess?.count || 0,
      offerStats,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Stats API] Error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

