/**
 * Cloudflare Pages Functions
 * /api/admin/sequences 엔드포인트
 * 시퀀스 메시지 CRUD 관리 API
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

interface Env {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
}

interface Sequence {
  id: number;
  offer_slug: string;
  name: string;
  day_offset: number;
  channel: 'email' | 'sms';
  subject: string | null;
  message: string;
  quiet_hour_start: number;
  quiet_hour_end: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface SequenceCreateRequest {
  offer_slug: string;
  name: string;
  day_offset: number;
  channel: 'email' | 'sms';
  subject?: string;
  message: string;
  quiet_hour_start?: number;
  quiet_hour_end?: number;
  enabled?: boolean;
}

function createSuccessResponse<T>(data?: T, status = 200): Response {
  const body: { success: boolean; data?: T } = { success: true };
  if (data !== undefined) {
    body.data = data;
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function checkBasicAuth(request: Request, env: Env): boolean {
  if (!env.ADMIN_PASSWORD) {
    return true;
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }
  const base64Credentials = authHeader.substring(6);
  const credentials = atob(base64Credentials);
  const [, password] = credentials.split(':');
  return password === env.ADMIN_PASSWORD;
}

// GET: 시퀀스 목록 조회
export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    if (!checkBasicAuth(context.request, context.env)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!context.env.DB) {
      return createErrorResponse('데이터베이스 연결 오류가 발생했습니다.', 500);
    }

    const url = new URL(context.request.url);
    const offerSlug = url.searchParams.get('offer_slug');
    const sequenceId = url.searchParams.get('id');

    // 특정 시퀀스 조회
    if (sequenceId) {
      const sequence = await context.env.DB.prepare('SELECT * FROM sequences WHERE id = ?')
        .bind(parseInt(sequenceId))
        .first<SequenceRow>();

      if (!sequence) {
        return createErrorResponse('시퀀스를 찾을 수 없습니다.', 404);
      }

      return createSuccessResponse({
        id: sequence.id,
        offer_slug: sequence.offer_slug,
        name: sequence.name,
        day_offset: sequence.day_offset,
        channel: sequence.channel as 'email' | 'sms',
        subject: sequence.subject,
        message: sequence.message,
        quiet_hour_start: sequence.quiet_hour_start,
        quiet_hour_end: sequence.quiet_hour_end,
        enabled: Boolean(sequence.enabled),
        created_at: sequence.created_at,
        updated_at: sequence.updated_at,
      });
    }

    // 시퀀스 목록 조회
    try {
      let query = 'SELECT * FROM sequences';
      const params: any[] = [];

      if (offerSlug) {
        query += ' WHERE offer_slug = ?';
        params.push(offerSlug);
      }

      query += ' ORDER BY offer_slug, day_offset ASC';

      const sequences = await context.env.DB.prepare(query)
        .bind(...params)
        .all<SequenceRow>();

      const result = (sequences.results || []).map((seq) => ({
        id: seq.id,
        offer_slug: seq.offer_slug,
        name: seq.name,
        day_offset: seq.day_offset,
        channel: seq.channel as 'email' | 'sms',
        subject: seq.subject,
        message: seq.message,
        quiet_hour_start: seq.quiet_hour_start,
        quiet_hour_end: seq.quiet_hour_end,
        enabled: Boolean(seq.enabled),
        created_at: seq.created_at,
        updated_at: seq.updated_at,
      }));

      return createSuccessResponse(result);
    } catch (dbError: unknown) {
      const dbErr = dbError instanceof Error ? dbError : new Error(String(dbError));
      // 테이블이 존재하지 않는 경우 빈 배열 반환
      if (dbErr.message.includes('no such table') || dbErr.message.includes('does not exist')) {
        console.warn('[Admin Sequences API] Table does not exist, returning empty array');
        return createSuccessResponse([]);
      }
      throw dbError;
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Sequences API] GET error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    return createErrorResponse(`서버 오류가 발생했습니다: ${err.message}`, 500);
  }
}

interface SequenceRow {
  id: number;
  offer_slug: string;
  name: string;
  day_offset: number;
  channel: string;
  subject: string | null;
  message: string;
  quiet_hour_start: number;
  quiet_hour_end: number;
  enabled: number;
  created_at: string;
  updated_at: string;
}

// POST: 시퀀스 생성
export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    if (!checkBasicAuth(context.request, context.env)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!context.env.DB) {
      return createErrorResponse('데이터베이스 연결 오류가 발생했습니다.', 500);
    }

    const body = await context.request.json() as SequenceCreateRequest;

    // 필수 필드 검증
    if (!body.offer_slug || !body.name || body.day_offset === undefined || !body.channel || !body.message) {
      return createErrorResponse('필수 필드가 누락되었습니다.', 400);
    }

    // 오퍼 존재 확인
    const offer = await context.env.DB.prepare('SELECT id FROM offers WHERE slug = ?')
      .bind(body.offer_slug)
      .first<{ id: number }>();

    if (!offer) {
      return createErrorResponse('오퍼를 찾을 수 없습니다.', 404);
    }

    // 시퀀스 생성
    const result = await context.env.DB.prepare(
      `INSERT INTO sequences (
        offer_slug, name, day_offset, channel, subject, message,
        quiet_hour_start, quiet_hour_end, enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        body.offer_slug,
        body.name,
        body.day_offset,
        body.channel,
        body.subject || null,
        body.message,
        body.quiet_hour_start ?? 22,
        body.quiet_hour_end ?? 8,
        body.enabled !== undefined ? (body.enabled ? 1 : 0) : 1
      )
      .run();

    if (!result.meta.last_row_id) {
      return createErrorResponse('시퀀스 생성에 실패했습니다.', 500);
    }

    // 생성된 시퀀스 조회
    const newSequence = await context.env.DB.prepare('SELECT * FROM sequences WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first<SequenceRow>();

    return createSuccessResponse({
      id: newSequence!.id,
      offer_slug: newSequence!.offer_slug,
      name: newSequence!.name,
      day_offset: newSequence!.day_offset,
      channel: newSequence!.channel as 'email' | 'sms',
      subject: newSequence!.subject,
      message: newSequence!.message,
      quiet_hour_start: newSequence!.quiet_hour_start,
      quiet_hour_end: newSequence!.quiet_hour_end,
      enabled: Boolean(newSequence!.enabled),
      created_at: newSequence!.created_at,
      updated_at: newSequence!.updated_at,
    }, 201);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Sequences API] POST error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// PUT: 시퀀스 수정
export async function onRequestPut(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    if (!checkBasicAuth(context.request, context.env)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!context.env.DB) {
      return createErrorResponse('데이터베이스 연결 오류가 발생했습니다.', 500);
    }

    const url = new URL(context.request.url);
    const sequenceId = url.searchParams.get('id');

    if (!sequenceId) {
      return createErrorResponse('시퀀스 ID가 필요합니다.', 400);
    }

    const body = await context.request.json() as Partial<SequenceCreateRequest>;

    // 시퀀스 존재 확인
    const existing = await context.env.DB.prepare('SELECT id FROM sequences WHERE id = ?')
      .bind(parseInt(sequenceId))
      .first<{ id: number }>();

    if (!existing) {
      return createErrorResponse('시퀀스를 찾을 수 없습니다.', 404);
    }

    // 업데이트 필드 구성
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.day_offset !== undefined) {
      updates.push('day_offset = ?');
      values.push(body.day_offset);
    }
    if (body.channel !== undefined) {
      updates.push('channel = ?');
      values.push(body.channel);
    }
    if (body.subject !== undefined) {
      updates.push('subject = ?');
      values.push(body.subject || null);
    }
    if (body.message !== undefined) {
      updates.push('message = ?');
      values.push(body.message);
    }
    if (body.quiet_hour_start !== undefined) {
      updates.push('quiet_hour_start = ?');
      values.push(body.quiet_hour_start);
    }
    if (body.quiet_hour_end !== undefined) {
      updates.push('quiet_hour_end = ?');
      values.push(body.quiet_hour_end);
    }
    if (body.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(body.enabled ? 1 : 0);
    }

    if (updates.length === 0) {
      return createErrorResponse('수정할 필드가 없습니다.', 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(parseInt(sequenceId));

    await context.env.DB.prepare(
      `UPDATE sequences SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    // 수정된 시퀀스 조회
    const updatedSequence = await context.env.DB.prepare('SELECT * FROM sequences WHERE id = ?')
      .bind(parseInt(sequenceId))
      .first<SequenceRow>();

    return createSuccessResponse({
      id: updatedSequence!.id,
      offer_slug: updatedSequence!.offer_slug,
      name: updatedSequence!.name,
      day_offset: updatedSequence!.day_offset,
      channel: updatedSequence!.channel as 'email' | 'sms',
      subject: updatedSequence!.subject,
      message: updatedSequence!.message,
      quiet_hour_start: updatedSequence!.quiet_hour_start,
      quiet_hour_end: updatedSequence!.quiet_hour_end,
      enabled: Boolean(updatedSequence!.enabled),
      created_at: updatedSequence!.created_at,
      updated_at: updatedSequence!.updated_at,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Sequences API] PUT error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// DELETE: 시퀀스 삭제
export async function onRequestDelete(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    if (!checkBasicAuth(context.request, context.env)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!context.env.DB) {
      return createErrorResponse('데이터베이스 연결 오류가 발생했습니다.', 500);
    }

    const url = new URL(context.request.url);
    const sequenceId = url.searchParams.get('id');

    if (!sequenceId) {
      return createErrorResponse('시퀀스 ID가 필요합니다.', 400);
    }

    // 시퀀스 존재 확인
    const existing = await context.env.DB.prepare('SELECT id FROM sequences WHERE id = ?')
      .bind(parseInt(sequenceId))
      .first<{ id: number }>();

    if (!existing) {
      return createErrorResponse('시퀀스를 찾을 수 없습니다.', 404);
    }

    // 관련 로그 삭제
    await context.env.DB.prepare('DELETE FROM sequence_logs WHERE sequence_id = ?')
      .bind(parseInt(sequenceId))
      .run();

    // 시퀀스 삭제
    const result = await context.env.DB.prepare('DELETE FROM sequences WHERE id = ?')
      .bind(parseInt(sequenceId))
      .run();

    if (result.meta.changes === 0) {
      return createErrorResponse('시퀀스 삭제에 실패했습니다.', 500);
    }

    return createSuccessResponse({ deleted: true, id: parseInt(sequenceId) });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Sequences API] DELETE error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

