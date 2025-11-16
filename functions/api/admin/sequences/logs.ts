/**
 * Cloudflare Pages Functions
 * /api/admin/sequences/logs 엔드포인트
 * 시퀀스 로그 조회 및 관리 API
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// GET: 시퀀스 로그 조회
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
    const sequenceId = url.searchParams.get('sequence_id');
    const leadId = url.searchParams.get('lead_id');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = `
      SELECT 
        sl.*,
        s.name as sequence_name,
        s.channel,
        s.offer_slug,
        l.name as lead_name,
        l.email as lead_email,
        l.phone as lead_phone
      FROM sequence_logs sl
      JOIN sequences s ON sl.sequence_id = s.id
      JOIN leads l ON sl.lead_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (sequenceId) {
      query += ' AND sl.sequence_id = ?';
      params.push(parseInt(sequenceId));
    }
    if (leadId) {
      query += ' AND sl.lead_id = ?';
      params.push(parseInt(leadId));
    }
    if (status) {
      query += ' AND sl.status = ?';
      params.push(status);
    }

    query += ' ORDER BY sl.scheduled_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await context.env.DB.prepare(query)
      .bind(...params)
      .all<{
        id: number;
        sequence_id: number;
        lead_id: number;
        scheduled_at: string;
        sent_at: string | null;
        status: string;
        error_message: string | null;
        created_at: string;
        sequence_name: string;
        channel: string;
        offer_slug: string;
        lead_name: string;
        lead_email: string;
        lead_phone: string;
      }>();

    // 전체 개수 조회
    let countQuery = 'SELECT COUNT(*) as count FROM sequence_logs sl WHERE 1=1';
    const countParams: any[] = [];
    if (sequenceId) {
      countQuery += ' AND sl.sequence_id = ?';
      countParams.push(parseInt(sequenceId));
    }
    if (leadId) {
      countQuery += ' AND sl.lead_id = ?';
      countParams.push(parseInt(leadId));
    }
    if (status) {
      countQuery += ' AND sl.status = ?';
      countParams.push(status);
    }

    const countResult = await context.env.DB.prepare(countQuery)
      .bind(...countParams)
      .first<{ count: number }>();

    return createSuccessResponse({
      logs: results || [],
      total: countResult?.count || 0,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Sequence Logs API] Error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// POST: 시퀀스 수동 재발송
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

    const body = await context.request.json();
    const { log_id } = body;

    if (!log_id) {
      return createErrorResponse('log_id가 필요합니다.', 400);
    }

    // 로그 조회
    const log = await context.env.DB.prepare(
      `SELECT sl.*, s.*, l.email, l.phone, l.name as lead_name
       FROM sequence_logs sl
       JOIN sequences s ON sl.sequence_id = s.id
       JOIN leads l ON sl.lead_id = l.id
       WHERE sl.id = ?`
    )
      .bind(log_id)
      .first<{
        id: number;
        sequence_id: number;
        lead_id: number;
        scheduled_at: string;
        sent_at: string | null;
        status: string;
        error_message: string | null;
        channel: string;
        subject: string | null;
        message: string;
        email: string;
        phone: string;
        lead_name: string;
      }>();

    if (!log) {
      return createErrorResponse('로그를 찾을 수 없습니다.', 404);
    }

    // 상태를 pending으로 변경하여 재발송 대기열에 추가
    await context.env.DB.prepare(
      'UPDATE sequence_logs SET status = ?, scheduled_at = ?, error_message = NULL WHERE id = ?'
    )
      .bind('pending', new Date().toISOString(), log_id)
      .run();

    return createSuccessResponse({
      message: '재발송 대기열에 추가되었습니다. 다음 Cron 실행 시 발송됩니다.',
      log_id,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Sequence Logs API] POST error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

