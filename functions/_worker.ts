/**
 * Cloudflare Pages Functions Worker
 * 통합 Worker - Cron 트리거 처리
 * 
 * Cloudflare Pages Functions의 Cron은 functions/_worker.ts의 scheduled 핸들러를 사용합니다.
 * Cloudflare Dashboard에서 Cron Triggers 설정 필요
 */

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
    rows_read: number;
    rows_written: number;
  };
  results?: T[];
}

interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
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

/**
 * Cron 트리거 핸들러
 * Cloudflare Dashboard에서 Cron Triggers 설정 필요
 */
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Cron 타입에 따라 다른 작업 수행
    const cron = event.cron || '';
    
    if (cron.includes('*/10')) {
      // 10분마다: 시퀀스 메시지 발송
      ctx.waitUntil(processSequenceQueue(env));
    } else {
      // 일일 리포트 (매일 오전 9시)
      ctx.waitUntil(processDailyReport(env));
    }
  },
};

/**
 * 일일 리포트 처리
 */
async function processDailyReport(env: Env) {
  try {
    // 오늘 날짜의 리드 수 조회
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
      "SELECT COUNT(*) as count FROM error_logs WHERE level = 'error' AND date(created_at) = ?"
    )
      .bind(today)
      .first<{ count: number }>();

    const errorCount = errorResult?.count || 0;
    if (errorCount > 0) {
      console.warn(`[Cron] Daily report: ${errorCount} errors occurred on ${today}`);
    }

    // 여기서 관리자에게 리포트 이메일 발송 등 추가 작업 가능
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Cron] Daily report error:', err);
  }
}

/**
 * 시퀀스 메시지 큐 처리 (10분마다 실행)
 */
async function processSequenceQueue(env: Env) {
  try {
    console.log('[Sequence Sender] Starting sequence queue processing...');

    if (!env.DB) {
      console.error('[Sequence Sender] DB binding not found');
      return;
    }

    // 현재 시간 기준으로 발송 예정인 시퀀스 로그 조회 (pending 상태)
    const now = new Date().toISOString();
    const pendingLogs = await env.DB.prepare(
      `SELECT sl.* FROM sequence_logs sl
       WHERE sl.status = 'pending' 
       AND sl.scheduled_at <= ?
       ORDER BY sl.scheduled_at ASC
       LIMIT 50`
    )
      .bind(now)
      .all<{
        id: number;
        sequence_id: number;
        lead_id: number;
        scheduled_at: string;
        sent_at: string | null;
        status: string;
      }>();

    if (!pendingLogs.results || pendingLogs.results.length === 0) {
      console.log('[Sequence Sender] No pending sequences to send');
      return;
    }

    console.log(`[Sequence Sender] Found ${pendingLogs.results.length} pending sequences`);

    // 각 시퀀스 로그 처리
    for (const log of pendingLogs.results) {
      try {
        // 시퀀스 정보 조회
        const sequence = await env.DB.prepare('SELECT * FROM sequences WHERE id = ?')
          .bind(log.sequence_id)
          .first<{
            id: number;
            offer_slug: string;
            name: string;
            day_offset: number;
            channel: string;
            subject: string | null;
            message: string;
            quiet_hour_start: number;
            quiet_hour_end: number;
          }>();

        if (!sequence) {
          console.warn(`[Sequence Sender] Sequence not found: ${log.sequence_id}`);
          await updateLogStatus(env.DB, log.id, 'failed', 'Sequence not found');
          continue;
        }

        // 리드 정보 조회
        const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?')
          .bind(log.lead_id)
          .first<{
            id: number;
            name: string;
            email: string;
            phone: string;
            offer_slug: string;
          }>();

        if (!lead) {
          console.warn(`[Sequence Sender] Lead not found: ${log.lead_id}`);
          await updateLogStatus(env.DB, log.id, 'failed', 'Lead not found');
          continue;
        }

        // Quiet Hour 체크
        const currentHour = new Date().getHours();
        const quietStart = sequence.quiet_hour_start;
        const quietEnd = sequence.quiet_hour_end;

        if (quietStart > quietEnd) {
          // 22시~8시 같은 경우 (자정을 넘김)
          if (currentHour >= quietStart || currentHour < quietEnd) {
            console.log(`[Sequence Sender] Skipping due to quiet hour: ${currentHour}`);
            // 다음 날 Quiet Hour 종료 후로 재스케줄
            const nextScheduled = new Date();
            nextScheduled.setDate(nextScheduled.getDate() + 1);
            nextScheduled.setHours(quietEnd, 0, 0, 0);
            
            await env.DB.prepare('UPDATE sequence_logs SET scheduled_at = ? WHERE id = ?')
              .bind(nextScheduled.toISOString(), log.id)
              .run();
            continue;
          }
        } else {
          // 일반적인 경우
          if (currentHour >= quietStart && currentHour < quietEnd) {
            console.log(`[Sequence Sender] Skipping due to quiet hour: ${currentHour}`);
            const nextScheduled = new Date();
            nextScheduled.setHours(quietEnd, 0, 0, 0);
            if (nextScheduled.getTime() <= new Date().getTime()) {
              nextScheduled.setDate(nextScheduled.getDate() + 1);
            }
            
            await env.DB.prepare('UPDATE sequence_logs SET scheduled_at = ? WHERE id = ?')
              .bind(nextScheduled.toISOString(), log.id)
              .run();
            continue;
          }
        }

        // 메시지 발송
        let sendResult: { success: boolean; error?: string };
        
        if (sequence.channel === 'email') {
          sendResult = await sendEmail(env, lead, sequence);
        } else if (sequence.channel === 'sms') {
          sendResult = await sendSMS(env, lead, sequence);
        } else {
          await updateLogStatus(env.DB, log.id, 'failed', `Unknown channel: ${sequence.channel}`);
          continue;
        }

        // 로그 상태 업데이트
        if (sendResult.success) {
          await updateLogStatus(env.DB, log.id, 'sent', null);
          console.log(`[Sequence Sender] Successfully sent ${sequence.channel} to lead ${lead.id}`);
        } else {
          await updateLogStatus(env.DB, log.id, 'failed', sendResult.error || 'Unknown error');
          console.error(`[Sequence Sender] Failed to send ${sequence.channel} to lead ${lead.id}:`, sendResult.error);
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`[Sequence Sender] Error processing log ${log.id}:`, err);
        await updateLogStatus(env.DB, log.id, 'failed', err.message);
      }
    }

    console.log('[Sequence Sender] Queue processing completed');
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Sequence Sender] Fatal error:', err);
  }
}

async function updateLogStatus(
  db: D1Database,
  logId: number,
  status: string,
  errorMessage: string | null
) {
  await db.prepare(
    'UPDATE sequence_logs SET status = ?, sent_at = CURRENT_TIMESTAMP, error_message = ? WHERE id = ?'
  )
    .bind(status, errorMessage, logId)
    .run();
}

// 이메일 발송
async function sendEmail(
  env: Env,
  lead: { email: string; name: string },
  sequence: { subject: string | null; message: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = env.RESEND_API_KEY || env.SENDGRID_API_KEY;
    const from = env.SMTP_FROM || 'noreply@example.com';

    if (!apiKey) {
      return { success: false, error: 'Email API key not configured' };
    }

    // Resend API 사용
    if (env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: lead.email,
          subject: sequence.subject || '[인슈랑] 안내',
          html: sequence.message.replace(/\n/g, '<br>'),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Email send failed' };
      }

      return { success: true };
    }

    // SendGrid API 사용
    if (env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: lead.email }] }],
          from: { email: from },
          subject: sequence.subject || '[인슈랑] 안내',
          content: [{ type: 'text/html', value: sequence.message.replace(/\n/g, '<br>') }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: error || 'Email send failed' };
      }

      return { success: true };
    }

    return { success: false, error: 'No email service configured' };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { success: false, error: err.message };
  }
}

// SMS 발송
async function sendSMS(
  env: Env,
  lead: { phone: string },
  sequence: { message: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = env.SOLAPI_API_KEY;
    const apiSecret = env.SOLAPI_API_SECRET;
    const senderPhone = env.SOLAPI_SENDER_PHONE;

    if (!apiKey || !apiSecret || !senderPhone) {
      return { success: false, error: 'Solapi configuration missing' };
    }

    // 솔라피 API 서명 생성
    const date = new Date().toISOString();
    const salt = crypto.randomUUID().replace(/-/g, '');
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(apiSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(date + salt)
    );
    
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            to: lead.phone.replace(/[^\d]/g, ''),
            from: senderPhone,
            text: sequence.message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `SMS API error: ${errorText}` };
    }

    const result = await response.json();
    if (result.messageId) {
      return { success: true };
    }

    return { success: false, error: 'SMS send failed: No messageId in response' };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { success: false, error: err.message };
  }
}
