/**
 * Error Logger Utility
 * 에러 로그를 console과 DB에 기록
 * 요구사항: 에러 로그 반드시 console + DB
 */

import type { D1Database } from '../../types/cloudflare';

export interface ErrorLog {
  level: 'error' | 'warn' | 'info';
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
  timestamp: string;
}

/**
 * 에러를 console과 DB에 기록
 * @param db D1 데이터베이스 인스턴스
 * @param error 에러 객체 또는 메시지
 * @param context 추가 컨텍스트 정보
 */
export async function logError(
  db: D1Database,
  error: Error | string,
  context?: Record<string, unknown>
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;

  // Console에 로그 기록
  console.error('Error logged:', {
    message: errorMessage,
    stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // DB에 로그 기록 (비동기, 실패해도 계속 진행)
  try {
    await db
      .prepare(
        `INSERT INTO error_logs (level, message, context, stack, created_at) 
         VALUES (?, ?, ?, ?, datetime('now'))`
      )
      .bind(
        'error',
        errorMessage,
        context ? JSON.stringify(context) : null,
        stack || null
      )
      .run();
  } catch (dbError) {
    // DB 로그 실패 시에도 console에는 기록됨
    console.error('Failed to log error to database:', dbError);
  }
}

/**
 * 경고를 console과 DB에 기록
 */
export async function logWarning(
  db: D1Database,
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  console.warn('Warning logged:', {
    message,
    context,
    timestamp: new Date().toISOString(),
  });

  try {
    await db
      .prepare(
        `INSERT INTO error_logs (level, message, context, created_at) 
         VALUES (?, ?, ?, datetime('now'))`
      )
      .bind('warn', message, context ? JSON.stringify(context) : null)
      .run();
  } catch (dbError) {
    console.error('Failed to log warning to database:', dbError);
  }
}

/**
 * 정보를 console과 DB에 기록
 */
export async function logInfo(
  db: D1Database,
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  console.log('Info logged:', {
    message,
    context,
    timestamp: new Date().toISOString(),
  });

  try {
    await db
      .prepare(
        `INSERT INTO error_logs (level, message, context, created_at) 
         VALUES (?, ?, ?, datetime('now'))`
      )
      .bind('info', message, context ? JSON.stringify(context) : null)
      .run();
  } catch (dbError) {
    console.error('Failed to log info to database:', dbError);
  }
}

