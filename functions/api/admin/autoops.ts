/**
 * Cloudflare Pages Functions
 * /api/admin/autoops 엔드포인트
 * AutoOps 모니터링 API
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

// GET: 모니터링 데이터 조회
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

    // Cron 상태 체크 (최근 실행 시간)
    const cronStatus = await checkCronStatus(context.env.DB);

    // Queue 백로그 체크 (pending 시퀀스 로그 수)
    const queueBacklog = await checkQueueBacklog(context.env.DB);

    // 에러 카운트 (최근 24시간)
    const errorCount = await checkErrorCount(context.env.DB);

    // 리드 트렌드 (최근 7일)
    const leadTrend = await checkLeadTrend(context.env.DB);

    // 시퀀스 발송 성공률 (최근 24시간)
    const sequenceSuccessRate = await checkSequenceSuccessRate(context.env.DB);

    return createSuccessResponse({
      cronStatus,
      queueBacklog,
      errorCount,
      leadTrend,
      sequenceSuccessRate,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin AutoOps API] Error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

async function checkCronStatus(db: D1Database) {
  try {
    // 최근 1시간 내 에러 로그에서 cron 관련 에러 확인
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const cronErrors = await db.prepare(
      "SELECT COUNT(*) as count FROM error_logs WHERE created_at > ? AND context LIKE '%cron%'"
    )
      .bind(oneHourAgo)
      .first<{ count: number }>();

    return {
      status: cronErrors?.count === 0 ? 'ok' : 'warning',
      lastChecked: new Date().toISOString(),
      recentErrors: cronErrors?.count || 0,
    };
  } catch (error) {
    return {
      status: 'error',
      lastChecked: new Date().toISOString(),
      error: 'Cron 상태 확인 실패',
    };
  }
}

async function checkQueueBacklog(db: D1Database) {
  try {
    const pendingCount = await db.prepare(
      "SELECT COUNT(*) as count FROM sequence_logs WHERE status = 'pending'"
    )
      .first<{ count: number }>();

    const overdueCount = await db.prepare(
      `SELECT COUNT(*) as count FROM sequence_logs 
       WHERE status = 'pending' AND scheduled_at < datetime('now', '-1 hour')`
    )
      .first<{ count: number }>();

    return {
      pending: pendingCount?.count || 0,
      overdue: overdueCount?.count || 0,
      status: overdueCount && overdueCount.count > 10 ? 'warning' : 'ok',
    };
  } catch (error) {
    return {
      pending: 0,
      overdue: 0,
      status: 'error',
      error: 'Queue 백로그 확인 실패',
    };
  }
}

async function checkErrorCount(db: D1Database) {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const errorCount = await db.prepare(
      "SELECT COUNT(*) as count FROM error_logs WHERE level = 'error' AND created_at > ?"
    )
      .bind(last24Hours)
      .first<{ count: number }>();

    const warningCount = await db.prepare(
      "SELECT COUNT(*) as count FROM error_logs WHERE level = 'warning' AND created_at > ?"
    )
      .bind(last24Hours)
      .first<{ count: number }>();

    return {
      errors: errorCount?.count || 0,
      warnings: warningCount?.count || 0,
      status: (errorCount?.count || 0) > 10 ? 'error' : (errorCount?.count || 0) > 5 ? 'warning' : 'ok',
    };
  } catch (error) {
    return {
      errors: 0,
      warnings: 0,
      status: 'error',
      error: '에러 카운트 확인 실패',
    };
  }
}

async function checkLeadTrend(db: D1Database) {
  try {
    const last7Days: { date: string; count: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = await db.prepare(
        "SELECT COUNT(*) as count FROM leads WHERE date(created_at) = ?"
      )
        .bind(dateStr)
        .first<{ count: number }>();

      last7Days.push({
        date: dateStr,
        count: count?.count || 0,
      });
    }

    const total = last7Days.reduce((sum, day) => sum + day.count, 0);
    const average = total / 7;
    const todayCount = last7Days[last7Days.length - 1].count;

    return {
      days: last7Days,
      total,
      average: Math.round(average * 100) / 100,
      today: todayCount,
      trend: todayCount > average ? 'up' : todayCount < average ? 'down' : 'stable',
    };
  } catch (error) {
    return {
      days: [],
      total: 0,
      average: 0,
      today: 0,
      trend: 'unknown',
      error: '리드 트렌드 확인 실패',
    };
  }
}

async function checkSequenceSuccessRate(db: D1Database) {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const total = await db.prepare(
      `SELECT COUNT(*) as count FROM sequence_logs 
       WHERE created_at > ? AND status IN ('sent', 'failed')`
    )
      .bind(last24Hours)
      .first<{ count: number }>();

    const sent = await db.prepare(
      `SELECT COUNT(*) as count FROM sequence_logs 
       WHERE created_at > ? AND status = 'sent'`
    )
      .bind(last24Hours)
      .first<{ count: number }>();

    const totalCount = total?.count || 0;
    const sentCount = sent?.count || 0;
    const successRate = totalCount > 0 ? (sentCount / totalCount) * 100 : 0;

    return {
      total: totalCount,
      sent: sentCount,
      failed: totalCount - sentCount,
      successRate: Math.round(successRate * 100) / 100,
      status: successRate >= 95 ? 'ok' : successRate >= 80 ? 'warning' : 'error',
    };
  } catch (error) {
    return {
      total: 0,
      sent: 0,
      failed: 0,
      successRate: 0,
      status: 'error',
      error: '시퀀스 성공률 확인 실패',
    };
  }
}

