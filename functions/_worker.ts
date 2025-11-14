/**
 * Cloudflare Pages Functions Worker
 * Pages Functions와 Cron 트리거를 통합하는 메인 Worker
 * 
 * 설정 방법:
 * 1. Cloudflare Dashboard > Workers & Pages > Pages > insurang-landing
 * 2. Settings > Functions > Cron Triggers
 * 3. Add Cron Trigger 클릭
 * 4. Schedule: "0 9 * * *" (매일 오전 9시 UTC)
 * 5. Worker: functions/_worker.ts 선택
 * 
 * 또는 별도 Worker로 배포:
 * wrangler deploy --name insurang-cron --compatibility-date 2024-01-01
 */

import type { D1Database, ScheduledEvent, ExecutionContext } from '@/types/cloudflare';
import { logError } from '@/lib/utils/error-logger';

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  SMTP_FROM?: string;
  SOLAPI_API_KEY?: string;
  SOLAPI_API_SECRET?: string;
  SOLAPI_SENDER_PHONE?: string;
}

/**
 * Cron 트리거 핸들러
 * Cloudflare Dashboard에서 Cron Triggers 설정 필요
 */
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(processDailyReport(env, ctx));
  },
};

/**
 * 일일 리포트 처리
 */
async function processDailyReport(env: Env, ctx: ExecutionContext) {
  try {
    // 오늘 날짜의 리드 수 조회
    // D1은 SQLite 기반이므로 date() 함수 사용
    const today = new Date().toISOString().split('T')[0];
    const result = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM leads WHERE date(created_at) = ?'
    )
      .bind(today)
      .first<{ count: number }>();

    const count = result?.count || 0;

    console.log(`[Cron] Daily report: ${count} leads created on ${today}`);

    // 에러 로그도 함께 조회
    const errorResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM error_logs WHERE date(created_at) = ? AND level = ?'
    )
      .bind(today, 'error')
      .first<{ count: number }>();

    const errorCount = errorResult?.count || 0;
    if (errorCount > 0) {
      console.warn(`[Cron] Daily report: ${errorCount} errors occurred on ${today}`);
    }

    // 여기서 관리자에게 리포트 이메일 발송 등 추가 작업 가능
    // 예: Resend/SendGrid API를 통한 이메일 발송, Slack 알림 등
    // 이메일 발송 예시:
    // if (env.RESEND_API_KEY && env.SMTP_FROM) {
    //   await sendDailyReportEmail(env, { leadCount: count, errorCount });
    // }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('[Cron] Daily report error:', err);
    
    // 에러 로깅 (DB에 저장)
    try {
      await logError(env.DB, err, {
        operation: 'daily_report',
        cron_scheduled_time: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('[Cron] Failed to log error:', logError);
    }
  }
}

