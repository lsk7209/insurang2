/**
 * Cloudflare Workers Cron Trigger
 * 일일 리포트 생성 및 발송
 * wrangler.toml에서 cron 설정 필요
 */

import type { D1Database, ScheduledEvent, ExecutionContext } from '@/types/cloudflare';

interface Env {
  DB: D1Database;
  // 기타 환경 변수
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(processDailyReport(env));
  },
};

async function processDailyReport(env: Env) {
  try {
    // 오늘 날짜의 리드 수 조회
    // D1은 SQLite 기반이므로 date() 함수 사용
    const today = new Date().toISOString().split('T')[0];
    const result = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM leads WHERE date(created_at) = ?'
    )
      .bind(today)
      .first();

    const count = (result as any)?.count || 0;

    console.log(`Daily report: ${count} leads created on ${today}`);

    // 여기서 관리자에게 리포트 이메일 발송 등 추가 작업 가능
    // 예: 이메일 발송, Slack 알림 등
  } catch (error) {
    console.error('Daily report error:', error);
  }
}

