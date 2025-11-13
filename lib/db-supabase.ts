/**
 * Supabase Database Client
 * Supabase Postgres를 사용하는 경우
 */

import { createClient } from '@supabase/supabase-js';

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
 * Get Supabase client
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get offer by slug
 */
export async function getOfferBySlug(slug: string): Promise<Offer | null> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Supabase getOfferBySlug error:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return data as Offer;
  } catch (error) {
    console.error('getOfferBySlug error:', error);
    return null;
  }
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
  try {
    const supabase = getSupabaseClient();

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        offer_slug: data.offer_slug,
        name: data.name,
        email: data.email,
        phone: data.phone,
        organization: data.organization || null,
        consent_privacy: data.consent_privacy,
        consent_marketing: data.consent_marketing,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase createLead error:', error);
      throw new Error(error.message || 'Failed to create lead');
    }

    if (!lead) {
      throw new Error('Failed to create lead: No data returned');
    }

    return lead.id;
  } catch (error) {
    console.error('createLead error:', error);
    throw error;
  }
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
  const supabase = getSupabaseClient();

  const { data: log, error } = await supabase
    .from('message_logs')
    .insert({
      lead_id: data.lead_id,
      channel: data.channel,
      status: data.status,
      error_message: data.error_message || null,
    })
    .select('id')
    .single();

  if (error || !log) {
    throw new Error(error?.message || 'Failed to create message log');
  }

  return log.id;
}

/**
 * Get leads with message logs
 */
export async function getLeadsWithLogs(limit: number = 100, offset: number = 0): Promise<Array<Lead & { email_status: string; sms_status: string }>> {
  const supabase = getSupabaseClient();

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !leads) {
    return [];
  }

  // 각 lead의 메시지 로그 조회
  const leadsWithLogs = await Promise.all(
    leads.map(async (lead) => {
      const { data: emailLogs } = await supabase
        .from('message_logs')
        .select('status')
        .eq('lead_id', lead.id)
        .eq('channel', 'email')
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      const { data: smsLogs } = await supabase
        .from('message_logs')
        .select('status')
        .eq('lead_id', lead.id)
        .eq('channel', 'sms')
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...lead,
        email_status: emailLogs?.status || 'pending',
        sms_status: smsLogs?.status || 'pending',
      };
    })
  );

  return leadsWithLogs;
}

/**
 * Get lead by ID with logs
 */
export async function getLeadById(leadId: number): Promise<(Lead & { logs: MessageLog[] }) | null> {
  const supabase = getSupabaseClient();

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    return null;
  }

  const { data: logs } = await supabase
    .from('message_logs')
    .select('*')
    .eq('lead_id', leadId)
    .order('sent_at', { ascending: false });

  return {
    ...lead,
    logs: logs || [],
  };
}

