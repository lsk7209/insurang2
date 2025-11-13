/**
 * Cloudflare Pages Functions Worker
 * Pages Functions와 Cron 트리거를 통합하는 메인 Worker
 * 
 * 참고: Pages Functions는 자동으로 /functions 디렉토리를 처리하므로
 * 이 파일은 선택사항입니다. Cron 트리거만 별도로 관리하려면
 * 이 파일을 사용하거나 별도 Worker로 배포하세요.
 */

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
    ctx.waitUntil(processDailyReport(env));
  },
};

/**
 * 일일 리포트 처리
 */
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

    console.log(`[Cron] Daily report: ${count} leads created on ${today}`);

    // 여기서 관리자에게 리포트 이메일 발송 등 추가 작업 가능
    // 예: Resend/SendGrid API를 통한 이메일 발송, Slack 알림 등
  } catch (error) {
    console.error('[Cron] Daily report error:', error);
  }
}

