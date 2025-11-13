# Cloudflare 환경 코드 검토 결과

## ✅ 수정 완료 사항

### 1. Next.js 설정
- ❌ `output: 'standalone'` 제거 (Cloudflare Pages 미지원)
- ✅ `images.unoptimized: true` 유지 (정적 이미지 최적화)

### 2. D1 데이터베이스
- ✅ `wrangler.toml`에 D1 바인딩 설정
- ✅ `lib/db-cloudflare.ts` 추가 (Cloudflare 전용 DB 클라이언트)
- ⚠️ Next.js API Routes에서는 D1 접근 불가 → Supabase 사용 또는 Pages Functions로 마이그레이션 필요

### 3. 이메일 발송
- ✅ `lib/services/email-service-cloudflare.ts` 추가
- ✅ Resend API 지원
- ✅ SendGrid API 지원
- ❌ nodemailer는 Cloudflare Workers에서 작동하지 않음 → 외부 API 사용 필요

### 4. Cron Triggers
- ✅ `functions/cron/daily-report.ts` 예시 추가
- ✅ `wrangler.toml`에 cron 설정 예시 추가

### 5. 환경 변수
- ✅ `.dev.vars` 파일 지원 (로컬 개발용)
- ✅ Cloudflare Dashboard 환경 변수 설정 가이드

## ⚠️ 중요 주의사항

### Next.js API Routes vs Cloudflare Pages Functions

**현재 구조:**
- `app/api/*/route.ts` → Next.js API Routes (Node.js 환경)
- `functions/api/*.ts` → Cloudflare Pages Functions (Workers 환경)

**문제점:**
1. Next.js API Routes는 D1에 직접 접근 불가
2. 환경 변수 접근 방식이 다름 (`process.env` vs `env`)
3. nodemailer는 Workers에서 작동하지 않음

**해결 방안:**

#### 옵션 1: Supabase 사용 (현재 구현)
- Next.js API Routes 그대로 사용
- Supabase를 데이터베이스로 사용
- 장점: 기존 코드 유지, 빠른 개발
- 단점: D1 사용 불가

#### 옵션 2: Pages Functions로 마이그레이션 (권장)
- `app/api/*` → `functions/api/*`로 이동
- D1 직접 사용 가능
- 장점: Cloudflare 네이티브 기능 활용
- 단점: 코드 마이그레이션 필요

## 📋 배포 전 체크리스트

### 필수 설정
- [ ] D1 데이터베이스 생성 및 스키마 적용
- [ ] `wrangler.toml`의 `database_id` 업데이트
- [ ] Cloudflare Pages 프로젝트 생성
- [ ] 환경 변수 설정 (Dashboard)
- [ ] D1 바인딩 추가 (Pages Settings)

### 선택 설정
- [ ] Cron Triggers 설정
- [ ] 이메일 서비스 API Key 설정 (Resend/SendGrid)
- [ ] 커스텀 도메인 설정

## 🔧 권장 마이그레이션 계획

### Phase 1: 현재 (Supabase 사용)
- Next.js API Routes 유지
- Supabase 데이터베이스 사용
- 개발 및 테스트

### Phase 2: Cloudflare 네이티브로 전환
1. `app/api/leads/route.ts` → `functions/api/leads.ts`로 이동
2. D1 데이터베이스로 전환
3. Resend/SendGrid로 이메일 발송 전환
4. 테스트 및 배포

## 📝 코드 구조

```
프로젝트/
├── app/
│   └── api/              # Next.js API Routes (Supabase 사용)
│       ├── leads/
│       └── admin/
├── functions/            # Cloudflare Pages Functions (D1 사용)
│   ├── api/
│   │   └── leads.ts     # 예시 구현
│   └── cron/
│       └── daily-report.ts
├── lib/
│   ├── db.ts            # 통합 DB 클라이언트 (Supabase/D1)
│   ├── db-cloudflare.ts # D1 전용 클라이언트
│   └── services/
│       ├── email-service.ts           # nodemailer (Node.js)
│       └── email-service-cloudflare.ts # Resend/SendGrid (Workers)
└── wrangler.toml        # Cloudflare 설정
```

## 🚀 다음 단계

1. **즉시 사용 가능**: Supabase 설정 후 배포
2. **최적화**: Pages Functions로 마이그레이션하여 D1 사용
3. **확장**: Cron Triggers로 자동화 작업 추가

