# Cloudflare 배포 가이드

## 🚀 빠른 시작

### 1. D1 데이터베이스 생성

```bash
# Wrangler CLI 로그인
wrangler login

# D1 데이터베이스 생성
wrangler d1 create insurang-db

# 생성된 database_id를 wrangler.toml에 업데이트
# database_id = "your-database-id-here" → 실제 ID로 변경
```

### 2. 스키마 적용

```bash
# 로컬 개발용
npm run d1:local

# 프로덕션용
npm run d1:remote
```

### 3. 환경 변수 설정

#### 로컬 개발 (.dev.vars)

`.dev.vars` 파일 생성:

```bash
# 이메일 서비스 (Resend 또는 SendGrid 중 하나)
RESEND_API_KEY=re_xxxxxxxxxxxxx
# 또는
# SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SMTP_FROM=noreply@yourdomain.com

# 솔라피 API
SOLAPI_API_KEY=your-api-key
SOLAPI_API_SECRET=your-api-secret
SOLAPI_SENDER_PHONE=01012345678
```

#### 프로덕션 (Cloudflare Dashboard)

1. Cloudflare Dashboard > Pages > 프로젝트 선택
2. Settings > Environment Variables
3. Production 환경 변수 추가:
   - `RESEND_API_KEY` 또는 `SENDGRID_API_KEY`
   - `SMTP_FROM`
   - `SOLAPI_API_KEY`
   - `SOLAPI_API_SECRET`
   - `SOLAPI_SENDER_PHONE`

### 4. GitHub 연동 배포

1. **프로젝트 생성**
   - Cloudflare Dashboard > Pages > Create a project
   - GitHub 저장소 연결: `lsk7209/insurang2`

2. **빌드 설정**
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Build output directory: `.next`
   - Root directory: `/` (프로젝트 루트)

3. **D1 바인딩 추가**
   - Settings > Functions > D1 Database bindings
   - Binding name: `DB`
   - Database: `insurang-db` 선택

4. **배포**
   - GitHub에 푸시하면 자동 배포
   - 또는 "Deploy" 버튼으로 수동 배포

### 5. Cron 트리거 설정 (선택)

#### 방법 1: Cloudflare Dashboard

1. Workers & Pages > Cron Triggers
2. 새 트리거 생성
3. Schedule: `0 9 * * *` (매일 오전 9시 UTC)
4. Worker: `insurang-landing` 선택

#### 방법 2: 별도 Worker 배포

```bash
# functions/_worker.ts를 별도 Worker로 배포
wrangler deploy --name insurang-cron --compatibility-date 2024-01-01
```

## 📁 프로젝트 구조

```
프로젝트/
├── functions/              # Cloudflare Pages Functions
│   ├── api/
│   │   ├── leads.ts        # POST /api/leads
│   │   └── admin/
│   │       ├── leads.ts    # GET /api/admin/leads
│   │       └── settings.ts # GET/POST /api/admin/settings
│   ├── cron/
│   │   └── daily-report.ts # 일일 리포트 (참고용)
│   └── _worker.ts          # 통합 Worker (Cron 포함)
├── app/                    # Next.js App Router
│   ├── api/                # Next.js API Routes (비활성화, 참고용)
│   ├── offer/
│   │   └── [offerSlug]/    # 동적 오퍼 페이지
│   └── admin/              # 관리자 페이지
├── lib/
│   ├── db.ts               # DB 인터페이스
│   ├── db-cloudflare.ts    # D1 구현체
│   └── services/
│       ├── email-service-cloudflare.ts  # Resend/SendGrid
│       └── sms-service.ts  # 솔라피 API
├── db/
│   └── schema.sql          # D1 스키마
└── wrangler.toml          # Cloudflare 설정
```

## 🔧 API 엔드포인트

### 프로덕션 (Cloudflare Pages Functions)

- `POST /api/leads` - 리드 생성
- `GET /api/admin/leads` - 리드 목록 조회
- `GET /api/admin/leads?id=123` - 리드 상세 조회
- `GET /api/admin/settings` - 설정 조회
- `POST /api/admin/settings` - 설정 저장 (제한적)

### 로컬 개발

- Next.js API Routes는 비활성화됨 (501 에러)
- `wrangler pages dev .next`로 로컬 테스트

## ⚠️ 중요 사항

### 1. Pages Functions 우선순위

- `functions/api/*.ts`가 `app/api/*/route.ts`보다 우선
- Cloudflare 배포 시 Pages Functions 자동 사용

### 2. D1 SQLite 함수

- `DATE()` → `date()` (소문자)
- `DATETIME()` → `datetime()`
- SQLite 함수 참고: https://www.sqlite.org/lang_datefunc.html

### 3. 환경 변수 접근

- **Pages Functions**: `env.VARIABLE_NAME`
- **Next.js 컴포넌트**: `process.env.NEXT_PUBLIC_*`만 가능

### 4. 이메일 서비스

- nodemailer는 Cloudflare Workers에서 작동하지 않음
- Resend 또는 SendGrid API 사용 필수
- 둘 중 하나만 설정 (Resend 우선)

## 🧪 테스트

### 로컬 테스트

```bash
# D1 로컬 데이터베이스
npm run d1:local

# 로컬 개발 서버
npm run cf:dev
```

### API 테스트

```bash
# 리드 생성 테스트
curl -X POST http://localhost:8788/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "offer_slug": "workbook",
    "name": "테스트",
    "email": "test@example.com",
    "phone": "010-1234-5678",
    "consent_privacy": true,
    "consent_marketing": false
  }'
```

## 📊 모니터링

- Cloudflare Dashboard > Pages > 프로젝트 > Analytics
- D1 쿼리 로그: Workers & Pages > D1 > 데이터베이스 선택
- Functions 로그: Pages > 프로젝트 > Functions > Logs

## 🔍 트러블슈팅

### D1 연결 실패
- `wrangler.toml`의 `database_id` 확인
- Pages Settings에서 D1 바인딩 확인

### API 501 에러
- `functions/api/*.ts` 파일 위치 확인
- Pages Functions 활성화 확인

### 이메일 발송 실패
- Resend/SendGrid API Key 확인
- `SMTP_FROM` 도메인 인증 확인

### 환경 변수 접근 불가
- Cloudflare Dashboard에서 환경 변수 설정 확인
- Pages Functions에서만 `env` 접근 가능

