/**
 * Cloudflare Pages Functions
 * /api/admin/leads 엔드포인트
 */

import type { D1Database } from '@/types/cloudflare';

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
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
          JSON.stringify({ success: false, error: '리드를 찾을 수 없습니다.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ success: true, data: lead }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 리드 목록 조회
    const leads = await getLeadsWithLogs(context.env.DB, limit, offset);

    return new Response(JSON.stringify({ success: true, data: leads }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Leads fetch error:', error);
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper functions
async function getLeadsWithLogs(
  db: D1Database,
  limit: number,
  offset: number
): Promise<Array<any>> {
  const leads = await db
    .prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all();

  if (!leads.results) {
    return [];
  }

  const leadsWithLogs = await Promise.all(
    leads.results.map(async (lead: any) => {
      const emailLog = await db
        .prepare('SELECT status FROM message_logs WHERE lead_id = ? AND channel = ? ORDER BY sent_at DESC LIMIT 1')
        .bind(lead.id, 'email')
        .first();

      const smsLog = await db
        .prepare('SELECT status FROM message_logs WHERE lead_id = ? AND channel = ? ORDER BY sent_at DESC LIMIT 1')
        .bind(lead.id, 'sms')
        .first();

      return {
        ...lead,
        // D1에서 INTEGER로 저장된 boolean 값을 변환
        consent_privacy: Boolean(lead.consent_privacy),
        consent_marketing: Boolean(lead.consent_marketing),
        email_status: emailLog?.status || 'pending',
        sms_status: smsLog?.status || 'pending',
      };
    })
  );

  return leadsWithLogs;
}

async function getLeadById(db: D1Database, leadId: number): Promise<any | null> {
  const lead = await db.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first();

  if (!lead) {
    return null;
  }

  const logs = await db
    .prepare('SELECT * FROM message_logs WHERE lead_id = ? ORDER BY sent_at DESC')
    .bind(leadId)
    .all();

  return {
    ...lead,
    // D1에서 INTEGER로 저장된 boolean 값을 변환
    consent_privacy: Boolean(lead.consent_privacy),
    consent_marketing: Boolean(lead.consent_marketing),
    logs: logs.results || [],
  };
}

