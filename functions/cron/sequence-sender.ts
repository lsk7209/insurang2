/**
 * Cloudflare Workers Cron Trigger
 * 시퀀스 메시지 자동 발송 (10분마다 실행)
 * wrangler.toml에서 cron 설정 필요: 10분마다 실행
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

interface SequenceLogRow {
  id: number;
  sequence_id: number;
  lead_id: number;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
}

interface SequenceRow {
  id: number;
  offer_slug: string;
  name: string;
  day_offset: number;
  channel: string;
  subject: string | null;
  message: string;
}

interface LeadRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  offer_slug: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(processSequenceQueue(env));
  },
};

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
      .all<SequenceLogRow>();

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
          .first<SequenceRow>();

        if (!sequence) {
          console.warn(`[Sequence Sender] Sequence not found: ${log.sequence_id}`);
          await updateLogStatus(env.DB, log.id, 'failed', 'Sequence not found');
          continue;
        }

        // 리드 정보 조회
        const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?')
          .bind(log.lead_id)
          .first<LeadRow>();

        if (!lead) {
          console.warn(`[Sequence Sender] Lead not found: ${log.lead_id}`);
          await updateLogStatus(env.DB, log.id, 'failed', 'Lead not found');
          continue;
        }

        // Quiet Hour 체크
        const currentHour = new Date().getHours();
        const quietStart = 22; // 기본값 (sequence 테이블에서 가져올 수도 있음)
        const quietEnd = 8;

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

// 이메일 발송 (간단한 버전)
async function sendEmail(
  env: Env,
  lead: LeadRow,
  sequence: SequenceRow
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

// SMS 발송 (간단한 버전)
async function sendSMS(
  env: Env,
  lead: LeadRow,
  sequence: SequenceRow
): Promise<{ success: boolean; error?: string }> {
  try {
    // D1에서 설정 조회 (없으면 환경 변수에서 가져오기)
    let apiKey: string | undefined;
    let apiSecret: string | undefined;
    let senderPhone: string | undefined;

    if (env.DB) {
      const solapiApiKey = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
        .bind('solapi_api_key')
        .first<{ value: string }>();
      apiKey = solapiApiKey?.value;

      const solapiApiSecret = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
        .bind('solapi_api_secret')
        .first<{ value: string }>();
      apiSecret = solapiApiSecret?.value;

      const solapiSenderPhone = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
        .bind('solapi_sender_phone')
        .first<{ value: string }>();
      senderPhone = solapiSenderPhone?.value;
    }

    // D1에 없으면 환경 변수에서 가져오기
    apiKey = apiKey || env.SOLAPI_API_KEY;
    apiSecret = apiSecret || env.SOLAPI_API_SECRET;
    senderPhone = senderPhone || env.SOLAPI_SENDER_PHONE;

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

