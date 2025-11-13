/**
 * Cloudflare Pages Functions
 * /api/admin/leads 엔드포인트
 */

import type { D1Database } from '@/types/cloudflare';
import type { AdminLeadsResponse, LeadListItem, LeadDetail } from '@/types/api';
import { logError } from '@/lib/utils/error-logger';

interface Env {
  DB: D1Database;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
}

function checkBasicAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.substring(6);
  const credentials = atob(base64Credentials);
  const [username, password] = credentials.split(':');

  const adminUsername = env.ADMIN_USERNAME || 'admin';
  const adminPassword = env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return false;
  }

  return username === adminUsername && password === adminPassword;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  // Basic Auth 확인
  if (!checkBasicAuth(context.request, context.env)) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
      },
    });
  }

  try {
    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const leadId = url.searchParams.get('id');

    // 특정 리드 조회
    if (leadId) {
      const lead = await getLeadById(context.env.DB, parseInt(leadId));
      if (!lead) {
      return new Response(
        JSON.stringify({ success: false, error: '리드를 찾을 수 없습니다.' } as AdminLeadsResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify({ success: true, data: lead } as AdminLeadsResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    }

    // 리드 목록 조회
    const leads = await getLeadsWithLogs(context.env.DB, limit, offset);

    return new Response(JSON.stringify({ success: true, data: leads } as AdminLeadsResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    // 에러 로깅 (console + DB)
    await logError(context.env.DB, err, {
      operation: 'admin_leads_fetch',
    });
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류가 발생했습니다.' } as AdminLeadsResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
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
}

