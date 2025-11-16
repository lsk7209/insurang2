/**
 * Cloudflare Pages Functions
 * /api/leads 엔드포인트
 * Cloudflare Pages Functions는 자동으로 /api/* 경로를 처리합니다.
 */

// 간단한 타입 정의 (외부 의존성 최소화)
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

interface D1Result {
  meta: {
    last_row_id: number;
  };
}

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  SMTP_FROM?: string;
  SOLAPI_API_KEY?: string;
  SOLAPI_API_SECRET?: string;
  SOLAPI_SENDER_PHONE?: string;
}

interface LeadCreateRequest {
  offer_slug: string;
  name: string;
  email: string;
  phone: string;
  organization?: string | null;
  consent_privacy: boolean;
  consent_marketing?: boolean;
}

// 간단한 응답 헬퍼 함수 (인라인)
function createSuccessResponse(data?: unknown, status = 200): Response {
  const body = { success: true };
  if (data !== undefined) {
    (body as any).data = data;
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

function createCorsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// 간단한 검증 함수 (인라인)
function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const phoneNumbers = phone.replace(/[^\d]/g, '');
  return phoneNumbers.length >= 10 && phoneNumbers.length <= 11;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

function validateLeadForm(data: LeadCreateRequest): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.offer_slug || !data.offer_slug.trim()) {
    errors.offer_slug = '오퍼 슬러그가 필요합니다.';
  }

  if (!data.name || !data.name.trim()) {
    errors.name = '이름을 입력해주세요.';
  }

  if (!data.email || !data.email.trim()) {
    errors.email = '이메일을 입력해주세요.';
  } else if (!validateEmail(data.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.';
  }

  if (!data.phone || !data.phone.trim()) {
    errors.phone = '휴대폰 번호를 입력해주세요.';
  } else if (!validatePhone(data.phone)) {
    errors.phone = '올바른 휴대폰 번호 형식이 아닙니다.';
  }

  if (!data.consent_privacy) {
    errors.consent_privacy = '개인정보 수집 및 이용에 동의해주세요.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function normalizeLeadData(data: LeadCreateRequest) {
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

// CORS preflight 요청 처리
export async function onRequestOptions(): Promise<Response> {
  return createCorsResponse();
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  console.log('[Leads API] POST request received');
  
  try {
    // 요청 본문 파싱
    let body: LeadCreateRequest;
    try {
      body = await context.request.json() as LeadCreateRequest;
      console.log('[Leads API] Request body received:', { 
        offer_slug: body.offer_slug, 
        has_name: !!body.name,
        has_email: !!body.email,
        has_phone: !!body.phone,
      });
    } catch (parseError) {
      console.error('[Leads API] JSON parse error:', parseError);
      return createErrorResponse('요청 데이터 형식이 올바르지 않습니다.', 400);
    }

    // 검증
    const validation = validateLeadForm(body);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      console.warn('[Leads API] Validation failed:', validation.errors);
      return createErrorResponse(firstError, 400);
    }

    // 데이터 정규화
    const normalizedData = normalizeLeadData(body);
    const { offer_slug, name, email, phone, organization, consent_privacy, consent_marketing } = normalizedData;

    // DB 바인딩 확인
    if (!context.env.DB) {
      console.error('[Leads API] DB binding not found');
      return createErrorResponse('데이터베이스 연결 오류가 발생했습니다.', 500);
    }

    // 리드 저장
    let leadId: number;
    try {
      const leadResult = await context.env.DB.prepare(
        'INSERT INTO leads (offer_slug, name, email, phone, organization, consent_privacy, consent_marketing) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(
          offer_slug,
          name,
          email,
          phone,
          organization || null,
          consent_privacy ? 1 : 0,
          consent_marketing ? 1 : 0
        )
        .run();

      if (!leadResult.meta.last_row_id) {
        console.error('[Leads API] Failed to insert lead: last_row_id is missing');
        return createErrorResponse('리드 저장에 실패했습니다.', 500);
      }

      leadId = leadResult.meta.last_row_id;
      console.log('[Leads API] Lead inserted successfully:', { leadId, offer_slug, name, email: email.substring(0, 5) + '***' });
    } catch (dbError: unknown) {
      const error = dbError instanceof Error ? dbError : new Error(String(dbError));
      console.error('[Leads API] Database error:', {
        message: error.message,
        stack: error.stack,
        offer_slug,
        name,
        email: email.substring(0, 5) + '***',
      });
      return createErrorResponse('데이터베이스 오류가 발생했습니다.', 500);
    }

    // 성공 응답 반환
    console.log('[Leads API] Success response:', { leadId, offer_slug });
    return createSuccessResponse({ leadId });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Leads API] Unexpected error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      error: String(error),
    });
    
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}
