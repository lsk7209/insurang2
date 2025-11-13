/**
 * Validation Utilities
 * 중앙화된 입력 검증 함수 모음
 * 요구사항: 모든 required 필드 검사, email 형식 검사, phone 숫자 검사
 */

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface LeadFormData {
  offer_slug?: string;
  name?: string;
  email?: string;
  phone?: string;
  organization?: string | null;
  consent_privacy?: boolean;
  consent_marketing?: boolean;
}

/**
 * 이메일 형식 검증
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  // RFC 5322 호환 이메일 정규식 (간소화 버전)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * 휴대폰 번호 검증
 * 한국 휴대폰 번호 형식: 010-1234-5678 또는 01012345678
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  // 숫자만 추출
  const phoneNumbers = phone.replace(/[^\d]/g, '');
  // 10자리 또는 11자리 (010-1234-5678 또는 010-123-4567)
  return phoneNumbers.length >= 10 && phoneNumbers.length <= 11;
}

/**
 * 휴대폰 번호 정규화 (숫자만 추출)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

/**
 * 이름 검증
 */
export function validateName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
}

/**
 * 오퍼 슬러그 검증
 */
export function validateOfferSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  // 영문자, 숫자, 하이픈, 언더스코어만 허용
  const slugRegex = /^[a-z0-9_-]+$/;
  return slugRegex.test(slug.trim().toLowerCase());
}

/**
 * 전체 리드 폼 데이터 검증
 * 요구사항: 모든 required 필드 검사, email 형식 검사, phone 숫자 검사
 */
export function validateLeadForm(data: LeadFormData): ValidationResult {
  const errors: Record<string, string> = {};

  // 필수 필드 검증
  if (!data.offer_slug || !data.offer_slug.trim()) {
    errors.offer_slug = '오퍼 슬러그가 필요합니다.';
  } else if (!validateOfferSlug(data.offer_slug)) {
    errors.offer_slug = '올바른 오퍼 슬러그 형식이 아닙니다.';
  }

  if (!data.name || !data.name.trim()) {
    errors.name = '이름을 입력해주세요.';
  } else if (!validateName(data.name)) {
    errors.name = '이름은 1자 이상 100자 이하여야 합니다.';
  }

  if (!data.email || !data.email.trim()) {
    errors.email = '이메일을 입력해주세요.';
  } else if (data.email.length > 255) {
    errors.email = '이메일은 255자 이하여야 합니다.';
  } else if (!validateEmail(data.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.';
  }

  if (!data.phone || !data.phone.trim()) {
    errors.phone = '휴대폰 번호를 입력해주세요.';
  } else if (!validatePhone(data.phone)) {
    errors.phone = '올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)';
  }

  if (data.consent_privacy === undefined || data.consent_privacy === false) {
    errors.consent_privacy = '개인정보 수집 및 이용에 동의해주세요.';
  }

  // 선택 필드 검증 (organization)
  if (data.organization && data.organization.length > 200) {
    errors.organization = '소속은 200자 이하여야 합니다.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 입력 데이터 정규화
 */
export function normalizeLeadData(data: LeadFormData): {
  offer_slug: string;
  name: string;
  email: string;
  phone: string;
  organization: string | null;
  consent_privacy: boolean;
  consent_marketing: boolean;
} {
  return {
    offer_slug: (data.offer_slug || '').trim(),
    name: (data.name || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
    phone: normalizePhone(data.phone || ''),
    organization: data.organization?.trim() || null,
    consent_privacy: Boolean(data.consent_privacy),
    consent_marketing: Boolean(data.consent_marketing),
  };
}

