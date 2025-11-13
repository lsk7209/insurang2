/**
 * Database Client
 * Cloudflare D1 또는 Supabase 클라이언트 설정
 * 환경 변수 DB_TYPE으로 선택: 'd1' 또는 'supabase'
 */
import type { D1Database } from '@/types/cloudflare';
import * as supabaseDb from './db-supabase';

// 타입 정의
export interface Offer {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  download_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: number;
  offer_slug: string;
  name: string;
  email: string;
  phone: string;
  organization: string | null;
  consent_privacy: boolean;
  consent_marketing: boolean;
  created_at: string;
}

export interface MessageLog {
  id: number;
  lead_id: number;
  channel: 'email' | 'sms';
  status: 'success' | 'failed';
  error_message: string | null;
  sent_at: string;
}

/**
 * Get database type
 */
function getDbType(): 'd1' | 'supabase' {
  return (process.env.DB_TYPE || 'supabase') as 'd1' | 'supabase';
}

/**
 * Get offer by slug
 */
export async function getOfferBySlug(slug: string): Promise<Offer | null> {
  if (getDbType() === 'supabase') {
    return supabaseDb.getOfferBySlug(slug);
  }

  // D1 사용 시
  const db = getDb();
  const result = await db
    .prepare('SELECT * FROM offers WHERE slug = ? AND status = ?')
    .bind(slug, 'active')
    .first<Offer>();
  
  return result;
}

/**
 * Get D1 database instance (Cloudflare Workers 환경)
 */
function getDb(): D1Database {
  if (typeof process !== 'undefined' && process.env?.DB) {
    return process.env.DB as unknown as D1Database;
  }
  throw new Error('D1 Database not configured');
}

/**
 * Create lead
 */
export async function createLead(data: {
  offer_slug: string;
  name: string;
  email: string;
  phone: string;
  organization?: string;
  consent_privacy: boolean;
  consent_marketing: boolean;
}): Promise<number> {
  if (getDbType() === 'supabase') {
    return supabaseDb.createLead(data);
  }

  // D1 사용 시
  const db = getDb();
  const result = await db
    .prepare(
      'INSERT INTO leads (offer_slug, name, email, phone, organization, consent_privacy, consent_marketing) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      data.offer_slug,
      data.name,
      data.email,
      data.phone,
      data.organization || null,
      data.consent_privacy ? 1 : 0,
      data.consent_marketing ? 1 : 0
    )
    .run();
  
  return result.meta.last_row_id;
}

/**
 * Create message log
 */
export async function createMessageLog(data: {
  lead_id: number;
  channel: 'email' | 'sms';
  status: 'success' | 'failed';
  error_message?: string;
}): Promise<number> {
  if (getDbType() === 'supabase') {
    return supabaseDb.createMessageLog(data);
  }

  // D1 사용 시
  const db = getDb();
  const result = await db
    .prepare(
      'INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)'
    )
    .bind(
      data.lead_id,
      data.channel,
      data.status,
      data.error_message || null
    )
    .run();
  
  return result.meta.last_row_id;
}

/**
 * Get leads with message logs
 */
export async function getLeadsWithLogs(limit: number = 100, offset: number = 0): Promise<Array<Lead & { email_status: string; sms_status: string }>> {
  if (getDbType() === 'supabase') {
    return supabaseDb.getLeadsWithLogs(limit, offset);
  }

  // D1 사용 시
  const db = getDb();
  
  // leads 조회
  const leads = await db
    .prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<Lead>();
  
  if (!leads.results) {
    return [];
  }
  
  // 각 lead의 메시지 로그 조회
  const leadsWithLogs = await Promise.all(
    leads.results.map(async (lead) => {
      const emailLog = await db
        .prepare('SELECT status FROM message_logs WHERE lead_id = ? AND channel = ? ORDER BY sent_at DESC LIMIT 1')
        .bind(lead.id, 'email')
        .first<{ status: string }>();
      
      const smsLog = await db
        .prepare('SELECT status FROM message_logs WHERE lead_id = ? AND channel = ? ORDER BY sent_at DESC LIMIT 1')
        .bind(lead.id, 'sms')
        .first<{ status: string }>();
      
      return {
        ...lead,
        email_status: emailLog?.status || 'pending',
        sms_status: smsLog?.status || 'pending',
      };
    })
  );
  
  return leadsWithLogs;
}

/**
 * Get lead by ID with logs
 */
export async function getLeadById(leadId: number): Promise<(Lead & { logs: MessageLog[] }) | null> {
  if (getDbType() === 'supabase') {
    return supabaseDb.getLeadById(leadId);
  }

  // D1 사용 시
  const db = getDb();
  
  const lead = await db
    .prepare('SELECT * FROM leads WHERE id = ?')
    .bind(leadId)
    .first<Lead>();
  
  if (!lead) {
    return null;
  }
  
  const logs = await db
    .prepare('SELECT * FROM message_logs WHERE lead_id = ? ORDER BY sent_at DESC')
    .bind(leadId)
    .all<MessageLog>();
  
  return {
    ...lead,
    logs: logs.results || [],
  };
}

