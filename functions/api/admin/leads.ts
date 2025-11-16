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

  const adminUsername = env.ADMIN_USERNAME || 'admin';
  const adminPassword = env.ADMIN_PASSWORD;

  return username === adminUsername && password === adminPassword;
}

// Helper functions
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
  email_status: string | null;
  sms_status: string | null;
}

async function getLeadsWithLogs(
  db: D1Database,
  limit: number,
  offset: number
): Promise<LeadListItem[]> {
  try {
    // N+1 쿼리 문제 해결: JOIN을 사용하여 한 번의 쿼리로 해결
    // SQLite는 LEFT JOIN LATERAL을 지원하지 않으므로 서브쿼리 사용
    const query = `
      SELECT 
        l.*,
        (SELECT status FROM message_logs 
         WHERE lead_id = l.id AND channel = 'email' 
         ORDER BY sent_at DESC LIMIT 1) as email_status,
        (SELECT status FROM message_logs 
         WHERE lead_id = l.id AND channel = 'sms' 
         ORDER BY sent_at DESC LIMIT 1) as sms_status
      FROM leads l
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await db
      .prepare(query)
      .bind(limit, offset)
      .all<LeadRow>();

    if (!result.results) {
      return [];
    }

    return result.results.map((lead) => ({
      id: lead.id,
      offer_slug: lead.offer_slug,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      organization: lead.organization,
      consent_privacy: Boolean(lead.consent_privacy),
      consent_marketing: Boolean(lead.consent_marketing),
      created_at: lead.created_at,
      email_status: lead.email_status || 'pending',
      sms_status: lead.sms_status || 'pending',
    }));
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
}

interface MessageLogRow {
  id: number;
  lead_id: number;
  channel: string;
  status: string;
  error_message: string | null;
  sent_at: string;
}

async function getLeadById(db: D1Database, leadId: number): Promise<LeadDetail | null> {
  try {
    const lead = await db
      .prepare('SELECT * FROM leads WHERE id = ?')
      .bind(leadId)
      .first<LeadDetailRow>();

    if (!lead) {
      return null;
    }

    const logs = await db
      .prepare('SELECT * FROM message_logs WHERE lead_id = ? ORDER BY sent_at DESC')
      .bind(leadId)
      .all<MessageLogRow>();

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
      email_status: 'pending',
      sms_status: 'pending',
      logs: (logs.results || []).map((log) => ({
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
