/**
 * Cloudflare Pages Functions
 * /api/admin/leads 엔드포인트
 */

// 간단한 타입 정의 (외부 의존성 최소화)
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
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
}

interface LeadListItem {
  id: number;
  offer_slug: string;
  name: string;
  email: string;
  phone: string;
  organization: string | null;
  consent_privacy: boolean;
  consent_marketing: boolean;
  created_at: string;
  email_status: string;
  sms_status: string;
}

interface MessageLog {
  id: number;
  lead_id: number;
  channel: 'email' | 'sms';
  status: 'success' | 'failed' | 'pending';
  error_message: string | null;
  sent_at: string;
}

interface LeadDetail extends LeadListItem {
  logs: MessageLog[];
}

// 간단한 응답 헬퍼 함수 (인라인)
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// CORS preflight 요청 처리
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function checkBasicAuth(request: Request, env: Env): boolean {
  // 개발 단계: ADMIN_PASSWORD가 설정되지 않았으면 인증 건너뛰기
  if (!env.ADMIN_PASSWORD) {
    console.warn('[Admin API] ADMIN_PASSWORD not set, skipping authentication (development mode)');
    return true;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.substring(6);
  const credentials = atob(base64Credentials);
  const [username, password] = credentials.split(':');

  const expectedUsername = env.ADMIN_USERNAME || 'admin';
  const expectedPassword = env.ADMIN_PASSWORD;

  return username === expectedUsername && password === expectedPassword;
}

interface LeadRow {
  id: number;
  offer_slug: string;
  name: string;
  email: string;
  phone: string;
  organization: string | null;
  consent_privacy: number;
  consent_marketing: number;
  created_at: string;
}

interface MessageLogRow {
  id: number;
  lead_id: number;
  channel: string;
  status: string;
  error_message: string | null;
  sent_at: string;
}

interface LeadDetailRow extends LeadRow {
  email_status: string;
  sms_status: string;
}

async function getLeadsWithLogs(db: D1Database, limit = 100, offset = 0): Promise<LeadListItem[]> {
  try {
    const leads = await db
      .prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<LeadRow>();

    if (!leads.results || leads.results.length === 0) {
      return [];
    }

    const leadIds = leads.results.map((lead) => lead.id);
    const placeholders = leadIds.map(() => '?').join(',');

    const logs = await db
      .prepare(`SELECT * FROM message_logs WHERE lead_id IN (${placeholders}) ORDER BY sent_at DESC`)
      .bind(...leadIds)
      .all<MessageLogRow>();

    const logsByLeadId = new Map<number, MessageLogRow[]>();
    (logs.results || []).forEach((log) => {
      if (!logsByLeadId.has(log.lead_id)) {
        logsByLeadId.set(log.lead_id, []);
      }
      logsByLeadId.get(log.lead_id)!.push(log);
    });

    return leads.results.map((lead) => {
      const leadLogs = logsByLeadId.get(lead.id) || [];
      const emailLog = leadLogs.find((log) => log.channel === 'email');
      const smsLog = leadLogs.find((log) => log.channel === 'sms');

      return {
        id: lead.id,
        offer_slug: lead.offer_slug,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        organization: lead.organization,
        consent_privacy: Boolean(lead.consent_privacy),
        consent_marketing: Boolean(lead.consent_marketing),
        created_at: lead.created_at,
        email_status: emailLog ? emailLog.status : 'pending',
        sms_status: smsLog ? smsLog.status : 'pending',
      };
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin API] getLeadsWithLogs error:', {
      message: err.message,
      stack: err.stack,
    });
    return [];
  }
}

interface LeadDetailRow {
  id: number;
  offer_slug: string;
  name: string;
  email: string;
  phone: string;
  organization: string | null;
  consent_privacy: number;
  consent_marketing: number;
  created_at: string;
  email_status: string;
  sms_status: string;
  error_message: string | null;
  sent_at: string;
}

async function getLeadById(db: D1Database, leadId: number): Promise<LeadDetail | null> {
  try {
    const lead = await db
      .prepare('SELECT * FROM leads WHERE id = ?')
      .bind(leadId)
      .first<LeadRow>();

    if (!lead) {
      return null;
    }

    const logs = await db
      .prepare('SELECT * FROM message_logs WHERE lead_id = ? ORDER BY sent_at DESC')
      .bind(leadId)
      .all<MessageLogRow>();

    const leadLogs = logs.results || [];
    const emailLog = leadLogs.find((log) => log.channel === 'email');
    const smsLog = leadLogs.find((log) => log.channel === 'sms');

    return {
      id: lead.id,
      offer_slug: lead.offer_slug,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      organization: lead.organization,
      consent_privacy: Boolean(lead.consent_privacy),
      consent_marketing: Boolean(lead.consent_marketing),
      created_at: lead.created_at,
      email_status: emailLog ? emailLog.status : 'pending',
      sms_status: smsLog ? smsLog.status : 'pending',
      logs: leadLogs.map((log) => ({
        id: log.id,
        lead_id: log.lead_id,
        channel: log.channel as 'email' | 'sms',
        status: log.status as 'success' | 'failed' | 'pending',
        error_message: log.error_message,
        sent_at: log.sent_at,
      })),
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin API] getLeadById error:', {
      message: err.message,
      stack: err.stack,
    });
    return null;
  }
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  console.log('[Admin Leads API] GET request received');
  
  try {
    // Basic Auth 확인 (개발 단계에서는 ADMIN_PASSWORD가 없으면 자동 통과)
    if (!checkBasicAuth(context.request, context.env)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // DB 바인딩 확인
    if (!context.env.DB) {
      console.error('[Admin Leads API] DB binding not found');
      return createErrorResponse('데이터베이스 연결 오류가 발생했습니다.', 500);
    }

    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const leadId = url.searchParams.get('id');

    // 특정 리드 조회
    if (leadId) {
      const lead = await getLeadById(context.env.DB, parseInt(leadId));
      if (!lead) {
        return createErrorResponse('리드를 찾을 수 없습니다.', 404);
      }
      return createSuccessResponse(lead);
    }

    // 리드 목록 조회
    const leads = await getLeadsWithLogs(context.env.DB, limit, offset);
    return createSuccessResponse(leads);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Leads API] Unexpected error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      error: String(error),
    });
    
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// DELETE 요청 처리 - 리드 삭제
export async function onRequestDelete(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  console.log('[Admin Leads API] DELETE request received');
  
  try {
    // Basic Auth 확인
    if (!checkBasicAuth(context.request, context.env)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // DB 바인딩 확인
    if (!context.env.DB) {
      console.error('[Admin Leads API] DB binding not found');
      return createErrorResponse('데이터베이스 연결 오류가 발생했습니다.', 500);
    }

    const url = new URL(context.request.url);
    const leadId = url.searchParams.get('id');

    if (!leadId) {
      return createErrorResponse('리드 ID가 필요합니다.', 400);
    }

    const leadIdNum = parseInt(leadId);
    if (isNaN(leadIdNum)) {
      return createErrorResponse('유효하지 않은 리드 ID입니다.', 400);
    }

    // 리드 존재 확인
    const existingLead = await context.env.DB.prepare('SELECT id FROM leads WHERE id = ?')
      .bind(leadIdNum)
      .first<{ id: number }>();

    if (!existingLead) {
      return createErrorResponse('리드를 찾을 수 없습니다.', 404);
    }

    // 관련 메시지 로그 삭제 (CASCADE 대신 수동 삭제)
    try {
      await context.env.DB.prepare('DELETE FROM message_logs WHERE lead_id = ?')
        .bind(leadIdNum)
        .run();
      console.log('[Admin Leads API] Message logs deleted for lead:', leadIdNum);
    } catch (logError) {
      console.warn('[Admin Leads API] Failed to delete message logs:', logError);
      // 로그 삭제 실패해도 계속 진행
    }

    // 리드 삭제
    const result = await context.env.DB.prepare('DELETE FROM leads WHERE id = ?')
      .bind(leadIdNum)
      .run();

    if (result.meta.changes === 0) {
      return createErrorResponse('리드 삭제에 실패했습니다.', 500);
    }

    console.log('[Admin Leads API] Lead deleted successfully:', leadIdNum);
    return createSuccessResponse({ deleted: true, id: leadIdNum });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Leads API] Delete error:', {
      message: err.message,
      stack: err.stack,
    });
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}
