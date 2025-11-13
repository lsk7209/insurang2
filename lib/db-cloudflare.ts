/**
 * Cloudflare D1 Database Client
 * Cloudflare Pages Functions에서 사용
 */

import type { D1Database } from '@/types/cloudflare';

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
  consent_privacy: boolean; // D1에서는 INTEGER(0/1)로 저장되지만 boolean으로 변환
  consent_marketing: boolean; // D1에서는 INTEGER(0/1)로 저장되지만 boolean으로 변환
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
 * Get offer by slug
 */
export async function getOfferBySlug(db: D1Database, slug: string): Promise<Offer | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM offers WHERE slug = ? AND status = ?')
      .bind(slug, 'active')
      .first<Offer>();

    return result;
  } catch (error) {
    console.error('getOfferBySlug error:', error);
    return null;
  }
}

/**
 * Create lead
 */
export async function createLead(
  db: D1Database,
  data: {
    offer_slug: string;
    name: string;
    email: string;
    phone: string;
    organization?: string;
    consent_privacy: boolean;
    consent_marketing: boolean;
  }
): Promise<number> {
  try {
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
  } catch (error) {
    console.error('createLead error:', error);
    throw error;
  }
}

/**
 * Create message log
 */
export async function createMessageLog(
  db: D1Database,
  data: {
    lead_id: number;
    channel: 'email' | 'sms';
    status: 'success' | 'failed';
    error_message?: string;
  }
): Promise<number> {
  try {
    const result = await db
      .prepare('INSERT INTO message_logs (lead_id, channel, status, error_message) VALUES (?, ?, ?, ?)')
      .bind(data.lead_id, data.channel, data.status, data.error_message || null)
      .run();

    return result.meta.last_row_id;
  } catch (error) {
    console.error('createMessageLog error:', error);
    throw error;
  }
}

/**
 * Get leads with message logs (최적화: N+1 쿼리 문제 해결)
 */
export async function getLeadsWithLogs(
  db: D1Database,
  limit: number = 100,
  offset: number = 0
): Promise<Array<Lead & { email_status: string; sms_status: string }>> {
  try {
    // 서브쿼리를 사용하여 한 번의 쿼리로 해결
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
  } catch (error) {
    console.error('getLeadsWithLogs error:', error);
    return [];
  }
}

/**
 * Get lead by ID with logs
 */
export async function getLeadById(
  db: D1Database,
  leadId: number
): Promise<(Lead & { logs: MessageLog[] }) | null> {
  try {
    const lead = await db.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first<Lead>();

    if (!lead) {
      return null;
    }

    const logs = await db
      .prepare('SELECT * FROM message_logs WHERE lead_id = ? ORDER BY sent_at DESC')
      .bind(leadId)
      .all<MessageLog>();

    return {
      ...lead,
      // D1에서 INTEGER로 저장된 boolean 값을 변환
      consent_privacy: Boolean(lead.consent_privacy),
      consent_marketing: Boolean(lead.consent_marketing),
      logs: logs.results || [],
    };
  } catch (error) {
    console.error('getLeadById error:', error);
    return null;
  }
}

