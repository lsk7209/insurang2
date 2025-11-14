/**
 * API Response Helper Utilities
 * 공통 API 응답 헬퍼 함수
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(data?: T, status = 200): Response {
  const body: ApiResponse<T> = { success: true };
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

/**
 * 에러 응답 생성
 */
export function createErrorResponse(
  error: string,
  status = 400,
  additionalHeaders?: HeadersInit
): Response {
  const body: ApiResponse = { success: false, error };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...additionalHeaders,
    },
  });
}

/**
 * CORS preflight 응답 생성
 */
export function createCorsResponse(): Response {
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

