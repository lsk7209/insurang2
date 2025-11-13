# 코드 검토 및 보완 사항

## ✅ 완료된 항목

### 1. 타입 안정성
- ✅ D1Database 타입 import 추가 완료
- ✅ Cloudflare Pages Functions 타입 정의 완료

### 2. 보안
- ✅ SQL Injection 방지 (Prepared Statements 사용)
- ✅ Basic Auth 미들웨어 구현
- ✅ 입력 검증 (이메일, 전화번호 형식)

### 3. 에러 처리
- ✅ try-catch 블록으로 에러 처리
- ✅ 이메일/SMS 발송 실패 시에도 리드 저장 성공 처리

## ⚠️ 개선 필요 사항

### 1. 보안 강화

#### 1.1 환경 변수 검증
**위치**: `functions/api/leads.ts`

**문제**: 필수 환경 변수가 optional로 정의되어 있음
```typescript
SOLAPI_API_KEY: string;  // 필수인데 실제로는 optional일 수 있음
```

**개선**:
```typescript
// 환경 변수 검증 추가
if (!env.SOLAPI_API_KEY || !env.SOLAPI_API_SECRET || !env.SOLAPI_SENDER_PHONE) {
  console.error('Solapi API configuration missing');
  // SMS 발송은 스킵하되 리드 저장은 계속
}
```

#### 1.2 XSS 방지
**위치**: `functions/api/leads.ts` - `generateEmailTemplate`

**문제**: 사용자 입력(`name`)이 직접 HTML에 삽입됨

**개선**: HTML 이스케이프 함수 추가
```typescript
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
```

#### 1.3 Basic Auth 기본값 제거
**위치**: `middleware.ts`

**문제**: 개발용 기본값이 프로덕션에서 사용될 수 있음

**개선**: 환경 변수 필수로 변경
```typescript
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminUsername || !adminPassword) {
  console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be set');
  return new NextResponse('Server configuration error', { status: 500 });
}
```

### 2. 에러 처리 개선

#### 2.1 데이터베이스 오류 처리
**위치**: `functions/api/leads.ts`

**개선**: 더 구체적인 에러 메시지 및 로깅
```typescript
try {
  const leadResult = await context.env.DB.prepare(...).run();
  const leadId = leadResult.meta.last_row_id;
} catch (dbError: any) {
  console.error('Database error:', {
    error: dbError.message,
    stack: dbError.stack,
    offerSlug,
  });
  return new Response(
    JSON.stringify({ success: false, error: '데이터베이스 오류가 발생했습니다.' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

#### 2.2 입력 길이 제한
**위치**: `functions/api/leads.ts`

**개선**: 입력 필드 길이 검증 추가
```typescript
// 이름 길이 검증
if (name.length > 100) {
  return new Response(
    JSON.stringify({ success: false, error: '이름은 100자 이하여야 합니다.' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

// 이메일 길이 검증
if (email.length > 255) {
  return new Response(
    JSON.stringify({ success: false, error: '이메일은 255자 이하여야 합니다.' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 3. 타입 안정성 개선

#### 3.1 any 타입 제거
**위치**: 여러 파일

**개선**: 명시적 타입 정의
```typescript
// Before
let offer = offerResult as any;

// After
interface Offer {
  slug: string;
  name: string;
  download_link?: string;
}
let offer = offerResult as Offer | null;
```

#### 3.2 타입 정의 파일 생성
**위치**: `types/api.ts` (신규)

**개선**: API 요청/응답 타입 정의
```typescript
export interface LeadRequest {
  offer_slug: string;
  name: string;
  email: string;
  phone: string;
  organization?: string;
  consent_privacy: boolean;
  consent_marketing: boolean;
}

export interface LeadResponse {
  success: boolean;
  error?: string;
}
```

### 4. 코드 품질

#### 4.1 TODO 주석 처리
**위치**: `app/offer/[offerSlug]/thanks/page.tsx`

**개선**: 실제 링크로 변경 또는 제거
```typescript
// Before
href="https://pf.kakao.com/_example" // TODO: 실제 카카오 채널 링크로 변경

// After
href={process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL || '#'}
```

#### 4.2 설정 저장 기능 구현
**위치**: `functions/api/admin/settings.ts`

**현재**: TODO 주석만 있음

**개선**: Cloudflare KV 또는 D1에 설정 저장 구현
```typescript
// Cloudflare KV 사용 예시
const settings = await env.SETTINGS_KV.get('admin_settings');
// 또는 D1에 settings 테이블 생성
```

### 5. 성능 최적화

#### 5.1 쿼리 최적화
**위치**: `functions/api/admin/leads.ts`

**개선**: JOIN 사용으로 쿼리 수 감소
```typescript
// Before: N+1 쿼리 문제
leads.results.map(async (lead) => {
  const emailLog = await db.prepare(...).first();
  const smsLog = await db.prepare(...).first();
})

// After: JOIN 사용
const leadsWithLogs = await db.prepare(`
  SELECT l.*, 
    (SELECT status FROM message_logs WHERE lead_id = l.id AND channel = 'email' ORDER BY sent_at DESC LIMIT 1) as email_status,
    (SELECT status FROM message_logs WHERE lead_id = l.id AND channel = 'sms' ORDER BY sent_at DESC LIMIT 1) as sms_status
  FROM leads l
  ORDER BY l.created_at DESC
  LIMIT ? OFFSET ?
`).bind(limit, offset).all();
```

### 6. 문서화

#### 6.1 API 문서화
**개선**: OpenAPI/Swagger 스펙 추가 또는 JSDoc 강화

#### 6.2 환경 변수 문서화
**개선**: `.env.example` 파일 생성
```bash
# .env.example
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
RESEND_API_KEY=your-resend-api-key
SMTP_FROM=noreply@yourdomain.com
SOLAPI_API_KEY=your-api-key
SOLAPI_API_SECRET=your-api-secret
SOLAPI_SENDER_PHONE=01012345678
```

## 📋 우선순위별 개선 계획

### 높은 우선순위 (보안)
1. ✅ XSS 방지 (HTML 이스케이프)
2. ✅ Basic Auth 기본값 제거
3. ✅ 환경 변수 검증 강화

### 중간 우선순위 (안정성)
1. ✅ 입력 길이 제한
2. ✅ 데이터베이스 오류 처리 개선
3. ✅ 타입 안정성 개선

### 낮은 우선순위 (품질)
1. ✅ 쿼리 최적화
2. ✅ TODO 주석 처리
3. ✅ 문서화 개선

## 🔍 추가 검토 사항

### 1. Rate Limiting
- API 엔드포인트에 Rate Limiting 추가 고려
- Cloudflare Pages Functions는 자동으로 DDoS 보호 제공

### 2. 로깅
- 구조화된 로깅 시스템 고려
- Cloudflare Workers Logs 활용

### 3. 모니터링
- 에러 추적 도구 통합 (예: Sentry)
- 성능 모니터링

### 4. 테스트
- 단위 테스트 추가
- 통합 테스트 추가
- E2E 테스트 고려

