/**
 * API 타입 정의
 * 요청/응답 타입 중앙화
 */

/**
 * 리드 생성 요청 타입
 */
export interface LeadCreateRequest {
  offer_slug: string;
  name: string;
  email: string;
  phone: string;
  organization?: string | null;
  consent_privacy: boolean;
  consent_marketing?: boolean;
}

/**
 * 리드 생성 응답 타입
 */
export interface LeadCreateResponse {
  success: boolean;
  error?: string;
}

/**
 * 관리자 리드 조회 응답 타입
 */
export interface AdminLeadsResponse {
  success: boolean;
  data?: LeadListItem[] | LeadDetail;
  error?: string;
}

/**
 * 리드 목록 항목 타입
 */
export interface LeadListItem {
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

/**
 * 리드 상세 정보 타입
 */
export interface LeadDetail extends LeadListItem {
  logs: MessageLog[];
}

/**
 * 메시지 로그 타입
 */
export interface MessageLog {
  id: number;
  lead_id: number;
  channel: 'email' | 'sms';
  status: 'success' | 'failed' | 'pending';
  error_message: string | null;
  sent_at: string;
}

/**
 * 오퍼 정보 타입
 */
export interface Offer {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  download_link: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Rate Limit 응답 타입
 */
export interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
}

