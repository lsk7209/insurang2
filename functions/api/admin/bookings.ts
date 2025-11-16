/**
 * Cloudflare Pages Functions
 * /api/admin/bookings 엔드포인트
 * 코칭 예약 관리 API
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

interface Booking {
  id: number;
  lead_id: number;
  consultant_name: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface BookingCreateRequest {
  lead_id: number;
  consultant_name: string;
  scheduled_at: string;
  duration_minutes?: number;
  notes?: string;
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

// GET: 예약 목록 조회
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
    const bookingId = url.searchParams.get('id');
    const leadId = url.searchParams.get('lead_id');
    const status = url.searchParams.get('status');

    // 특정 예약 조회
    if (bookingId) {
      const booking = await context.env.DB.prepare('SELECT * FROM bookings WHERE id = ?')
        .bind(parseInt(bookingId))
        .first<BookingRow>();

      if (!booking) {
        return createErrorResponse('예약을 찾을 수 없습니다.', 404);
      }

      return createSuccessResponse({
        id: booking.id,
        lead_id: booking.lead_id,
        consultant_name: booking.consultant_name,
        scheduled_at: booking.scheduled_at,
        duration_minutes: booking.duration_minutes,
        status: booking.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
        notes: booking.notes,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      });
    }

    // 예약 목록 조회
    let query = 'SELECT * FROM bookings';
    const params: any[] = [];

    if (leadId) {
      query += ' WHERE lead_id = ?';
      params.push(parseInt(leadId));
    } else if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY scheduled_at ASC';

    const bookings = await context.env.DB.prepare(query)
      .bind(...params)
      .all<BookingRow>();

    const result = (bookings.results || []).map((booking) => ({
      id: booking.id,
      lead_id: booking.lead_id,
      consultant_name: booking.consultant_name,
      scheduled_at: booking.scheduled_at,
      duration_minutes: booking.duration_minutes,
      status: booking.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      notes: booking.notes,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
    }));

    return createSuccessResponse(result);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Bookings API] GET error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    return createErrorResponse(`서버 오류가 발생했습니다: ${err.message}`, 500);
  }
}

interface BookingRow {
  id: number;
  lead_id: number;
  consultant_name: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// POST: 예약 생성
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

    const body = await context.request.json() as BookingCreateRequest;

    // 필수 필드 검증
    if (!body.lead_id || !body.consultant_name || !body.scheduled_at) {
      return createErrorResponse('필수 필드가 누락되었습니다.', 400);
    }

    // 리드 존재 확인
    const lead = await context.env.DB.prepare('SELECT id FROM leads WHERE id = ?')
      .bind(body.lead_id)
      .first<{ id: number }>();

    if (!lead) {
      return createErrorResponse('리드를 찾을 수 없습니다.', 404);
    }

    // 시간 충돌 확인 (같은 상담사의 같은 시간대 예약 체크)
    const scheduledDate = new Date(body.scheduled_at);
    const endDate = new Date(scheduledDate.getTime() + (body.duration_minutes || 30) * 60000);

    const conflictingBooking = await context.env.DB.prepare(
      `SELECT id FROM bookings 
       WHERE consultant_name = ? 
       AND status IN ('pending', 'confirmed')
       AND scheduled_at < ? 
       AND datetime(scheduled_at, '+' || duration_minutes || ' minutes') > ?`
    )
      .bind(body.consultant_name, endDate.toISOString(), scheduledDate.toISOString())
      .first<{ id: number }>();

    if (conflictingBooking) {
      return createErrorResponse('해당 시간대에 이미 예약이 있습니다.', 409);
    }

    // 예약 생성
    const result = await context.env.DB.prepare(
      `INSERT INTO bookings (lead_id, consultant_name, scheduled_at, duration_minutes, notes, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`
    )
      .bind(
        body.lead_id,
        body.consultant_name,
        body.scheduled_at,
        body.duration_minutes || 30,
        body.notes || null
      )
      .run();

    if (!result.meta.last_row_id) {
      return createErrorResponse('예약 생성에 실패했습니다.', 500);
    }

    // 생성된 예약 조회
    const newBooking = await context.env.DB.prepare('SELECT * FROM bookings WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first<BookingRow>();

    return createSuccessResponse({
      id: newBooking!.id,
      lead_id: newBooking!.lead_id,
      consultant_name: newBooking!.consultant_name,
      scheduled_at: newBooking!.scheduled_at,
      duration_minutes: newBooking!.duration_minutes,
      status: newBooking!.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      notes: newBooking!.notes,
      created_at: newBooking!.created_at,
      updated_at: newBooking!.updated_at,
    }, 201);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Bookings API] POST error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// PUT: 예약 수정
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
    const bookingId = url.searchParams.get('id');

    if (!bookingId) {
      return createErrorResponse('예약 ID가 필요합니다.', 400);
    }

    const body = await context.request.json() as Partial<BookingCreateRequest & { status?: string }>;

    // 예약 존재 확인
    const existing = await context.env.DB.prepare('SELECT * FROM bookings WHERE id = ?')
      .bind(parseInt(bookingId))
      .first<BookingRow>();

    if (!existing) {
      return createErrorResponse('예약을 찾을 수 없습니다.', 404);
    }

    // 업데이트 필드 구성
    const updates: string[] = [];
    const values: any[] = [];

    if (body.consultant_name !== undefined) {
      updates.push('consultant_name = ?');
      values.push(body.consultant_name);
    }
    if (body.scheduled_at !== undefined) {
      updates.push('scheduled_at = ?');
      values.push(body.scheduled_at);
    }
    if (body.duration_minutes !== undefined) {
      updates.push('duration_minutes = ?');
      values.push(body.duration_minutes);
    }
    if (body.notes !== undefined) {
      updates.push('notes = ?');
      values.push(body.notes || null);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(body.status);
    }

    if (updates.length === 0) {
      return createErrorResponse('수정할 필드가 없습니다.', 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(parseInt(bookingId));

    await context.env.DB.prepare(
      `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    // 수정된 예약 조회
    const updatedBooking = await context.env.DB.prepare('SELECT * FROM bookings WHERE id = ?')
      .bind(parseInt(bookingId))
      .first<BookingRow>();

    return createSuccessResponse({
      id: updatedBooking!.id,
      lead_id: updatedBooking!.lead_id,
      consultant_name: updatedBooking!.consultant_name,
      scheduled_at: updatedBooking!.scheduled_at,
      duration_minutes: updatedBooking!.duration_minutes,
      status: updatedBooking!.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      notes: updatedBooking!.notes,
      created_at: updatedBooking!.created_at,
      updated_at: updatedBooking!.updated_at,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Bookings API] PUT error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

// DELETE: 예약 삭제
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
    const bookingId = url.searchParams.get('id');

    if (!bookingId) {
      return createErrorResponse('예약 ID가 필요합니다.', 400);
    }

    // 예약 존재 확인
    const existing = await context.env.DB.prepare('SELECT id FROM bookings WHERE id = ?')
      .bind(parseInt(bookingId))
      .first<{ id: number }>();

    if (!existing) {
      return createErrorResponse('예약을 찾을 수 없습니다.', 404);
    }

    // 예약 삭제
    const result = await context.env.DB.prepare('DELETE FROM bookings WHERE id = ?')
      .bind(parseInt(bookingId))
      .run();

    if (result.meta.changes === 0) {
      return createErrorResponse('예약 삭제에 실패했습니다.', 500);
    }

    return createSuccessResponse({ deleted: true, id: parseInt(bookingId) });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Admin Bookings API] DELETE error:', err);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

