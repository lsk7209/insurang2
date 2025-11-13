/**
 * Database Client
 * Cloudflare D1 전용 클라이언트
 * Cloudflare Pages Functions에서만 사용 가능
 */
import type { D1Database } from '@/types/cloudflare';
import * as cloudflareDb from './db-cloudflare';

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
 * Get D1 database instance
 * 
 * 주의: 이 함수는 Cloudflare Pages Functions에서만 작동합니다.
 * Next.js API Routes에서는 사용할 수 없습니다.
 * functions/api/*.ts에서 env.DB를 직접 전달받아 사용하세요.
 */
function getDb(): D1Database {
  // Cloudflare Workers/Pages Functions 환경
  if (typeof process !== 'undefined' && process.env?.DB) {
    return process.env.DB as unknown as D1Database;
  }
  
  throw new Error(
    'D1 Database not configured. ' +
    'Cloudflare Pages Functions에서 env.DB를 전달받아 사용하세요.'
  );
}

/**
 * Get offer by slug
 * 
 * 주의: 이 함수는 Cloudflare Pages Functions에서만 사용 가능합니다.
 * Next.js API Routes에서는 functions/api/*.ts를 사용하세요.
 */
export async function getOfferBySlug(slug: string, db?: D1Database): Promise<Offer | null> {
  const d1 = db || getDb();
  return cloudflareDb.getOfferBySlug(d1, slug);
}

/**
 * Create lead
 * 
 * 주의: 이 함수는 Cloudflare Pages Functions에서만 사용 가능합니다.
 * Next.js API Routes에서는 functions/api/*.ts를 사용하세요.
 */
export async function createLead(
  data: {
    offer_slug: string;
    name: string;
    email: string;
    phone: string;
    organization?: string;
    consent_privacy: boolean;
    consent_marketing: boolean;
  },
  db?: D1Database
): Promise<number> {
  const d1 = db || getDb();
  return cloudflareDb.createLead(d1, data);
}

/**
 * Create message log
 * 
 * 주의: 이 함수는 Cloudflare Pages Functions에서만 사용 가능합니다.
 */
export async function createMessageLog(
  data: {
    lead_id: number;
    channel: 'email' | 'sms';
    status: 'success' | 'failed';
    error_message?: string;
  },
  db?: D1Database
): Promise<number> {
  const d1 = db || getDb();
  return cloudflareDb.createMessageLog(d1, data);
}

/**
 * Get leads with message logs
 * 
 * 주의: 이 함수는 Cloudflare Pages Functions에서만 사용 가능합니다.
 */
export async function getLeadsWithLogs(
  limit: number = 100,
  offset: number = 0,
  db?: D1Database
): Promise<Array<Lead & { email_status: string; sms_status: string }>> {
  const d1 = db || getDb();
  return cloudflareDb.getLeadsWithLogs(d1, limit, offset);
}

/**
 * Get lead by ID with logs
 * 
 * 주의: 이 함수는 Cloudflare Pages Functions에서만 사용 가능합니다.
 */
export async function getLeadById(
  leadId: number,
  db?: D1Database
): Promise<(Lead & { logs: MessageLog[] }) | null> {
  const d1 = db || getDb();
  return cloudflareDb.getLeadById(d1, leadId);
}

