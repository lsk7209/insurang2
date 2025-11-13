/**
 * Rate Limiting Utility
 * Cloudflare Workers 환경에서 간단한 Rate Limiting 구현
 * MVP 수준: IP 기반 간단한 체크
 */

import type { D1Database } from '@/types/cloudflare';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10, // 10 requests
  windowMs: 60 * 1000, // per minute
};

/**
 * Simple rate limit check using D1 database
 * 실제 프로덕션에서는 Cloudflare KV나 Rate Limiting API 사용 권장
 */
export async function checkRateLimit(
  db: D1Database,
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // 최근 요청 기록 조회
    const result = await db
      .prepare(
        `SELECT COUNT(*) as count 
         FROM rate_limit_logs 
         WHERE identifier = ? AND created_at > ?`
      )
      .bind(identifier, new Date(windowStart).toISOString())
      .first<{ count: number }>();

    const requestCount = result?.count || 0;

    if (requestCount >= config.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    // 요청 기록 저장
    await db
      .prepare(
        `INSERT INTO rate_limit_logs (identifier, created_at) 
         VALUES (?, ?)`
      )
      .bind(identifier, new Date(now).toISOString())
      .run()
      .catch((err) => {
        // 로그 실패해도 계속 진행
        console.error('Rate limit log error:', err);
      });

    return { allowed: true, remaining: config.maxRequests - requestCount - 1 };
  } catch (error) {
    // Rate limit 체크 실패 시 허용 (fail-open)
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: config.maxRequests };
  }
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Cloudflare에서 제공하는 CF-Connecting-IP 헤더 사용
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) {
    return cfIp;
  }

  // Fallback: X-Forwarded-For 또는 기타 헤더
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // 최종 Fallback: 요청 URL
  return new URL(request.url).hostname;
}

