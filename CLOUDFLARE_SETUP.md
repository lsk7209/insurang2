# Cloudflare 배포 가이드

## 1. Cloudflare D1 데이터베이스 설정

### D1 데이터베이스 생성

```bash
# Wrangler CLI 설치 (이미 설치되어 있다면 생략)
npm install -g wrangler

# 로그인
wrangler login

# D1 데이터베이스 생성
wrangler d1 create insurang-db
```

**출력 예시:**
```
✅ Successfully created DB 'insurang-db'!

[[d1_databases]]
binding = "DB"
database_name = "insurang-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**중요**: 생성된 `database_id`를 복사하여 `wrangler.toml`에 업데이트하세요!

### wrangler.toml 업데이트

`wrangler.toml` 파일을 열고 `database_id`를 업데이트:

```toml
[[d1_databases]]
binding = "DB"
database_name = "insurang-db"
database_id = "your-database-id-here"  # ← 생성된 ID로 변경
```

### 스키마 적용

```bash
# 로컬 개발용
npm run d1:local
# 또는
wrangler d1 execute insurang-db --local --file=./db/schema.sql

# 프로덕션용
npm run d1:remote
# 또는
wrangler d1 execute insurang-db --file=./db/schema.sql
```

### Cloudflare Pages에서 D1 바인딩 설정

1. Cloudflare Dashboard > **Workers & Pages** > **Pages**
2. 프로젝트 선택: `insurang-landing`
3. **Settings** > **Functions** > **D1 Database bindings**
4. **Add binding** 클릭:
   - **Variable name**: `DB` (반드시 대문자)
   - **Database**: `insurang-db` 선택
5. **Save** 클릭

자세한 설정은 [D1_SETUP.md](./D1_SETUP.md)를 참고하세요.

## 2. Cloudflare Pages 배포

### GitHub 연동

1. Cloudflare Dashboard > Pages > Create a project
2. GitHub 저장소 연결: `lsk7209/insurang2`
3. 빌드 설정:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `/` (프로젝트 루트)

### 환경 변수 설정

Cloudflare Dashboard > Pages > Settings > Environment Variables에서 설정:

**Production:**
```
# 이메일 서비스 (Resend 또는 SendGrid 중 하나 선택)
RESEND_API_KEY=your-resend-api-key
# 또는
# SENDGRID_API_KEY=your-sendgrid-api-key
SMTP_FROM=noreply@example.com

# 솔라피 API
SOLAPI_API_KEY=your-api-key
SOLAPI_API_SECRET=your-api-secret
SOLAPI_SENDER_PHONE=01012345678
```

**Preview (선택):**
- 동일한 환경 변수 또는 테스트용 값

## 3. D1 데이터베이스 바인딩

### Pages Functions에서 D1 접근

`wrangler.toml`에 설정된 바인딩이 자동으로 적용됩니다:

```toml
[[d1_databases]]
binding = "DB"
database_name = "insurang-db"
database_id = "your-database-id-here"
```

### Pages 프로젝트에 바인딩 추가

Cloudflare Dashboard > Pages > Settings > Functions에서:
- D1 Database 바인딩 추가
- Binding name: `DB`
- Database: `insurang-db`

## 4. Cron Triggers 설정

### 방법 1: wrangler.toml (권장)

```toml
[[triggers.crons]]
cron = "0 9 * * *"  # 매일 오전 9시 (UTC)
```

### 방법 2: Cloudflare Dashboard

1. Workers & Pages > Cron Triggers
2. 새 트리거 생성
3. Schedule: `0 9 * * *` (매일 오전 9시 UTC)
4. Worker: `insurang-landing` 선택

### Cron Worker 배포

```bash
# Cron Worker 배포
wrangler deploy --name insurang-landing
```

## 5. 이메일 발송 설정

### 옵션 1: Resend 사용 (권장)

1. [Resend](https://resend.com) 가입
2. API Key 발급
3. 환경 변수에 `RESEND_API_KEY` 추가
4. `lib/services/email-service.ts`에서 `sendEmailCloudflare` 사용

### 옵션 2: SendGrid 사용

1. [SendGrid](https://sendgrid.com) 가입
2. API Key 발급
3. 환경 변수에 `SENDGRID_API_KEY` 추가
4. `lib/services/email-service.ts`에서 `sendEmailSendGrid` 사용

### 옵션 3: Cloudflare Email Workers (베타)

Cloudflare Email Workers를 사용하여 직접 SMTP 연결 가능 (베타 기능)

## 6. 로컬 개발

### Wrangler로 로컬 개발 서버 실행

```bash
# D1 로컬 데이터베이스 생성
wrangler d1 execute insurang-db --local --file=./db/schema.sql

# 로컬 개발 서버 실행
wrangler pages dev .next
```

### 환경 변수 설정

`.dev.vars` 파일 생성 (`.gitignore`에 포함):

```
DB_TYPE=d1
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=noreply@example.com
SOLAPI_API_KEY=your-api-key
SOLAPI_API_SECRET=your-api-secret
SOLAPI_SENDER_PHONE=01012345678
RESEND_API_KEY=your-resend-key
```

## 7. 주의사항

### Cloudflare Pages Functions

- **Cloudflare Pages Functions** (`functions/api/*.ts`): Cloudflare Workers 환경에서 실행
- D1 데이터베이스 직접 접근 가능 (`env.DB`)
- Resend/SendGrid API를 통한 이메일 발송
- 솔라피 API를 통한 SMS 발송

### 데이터베이스 접근

- **Cloudflare Pages Functions**: `env.DB`로 D1 직접 접근
- 모든 API는 `functions/api/*.ts`에서 구현

### 환경 변수

- Cloudflare Pages Functions에서는 `env` 객체 사용
- Pages Functions에서만 `env` 접근 가능
- Next.js 컴포넌트에서는 `process.env.NEXT_PUBLIC_*`만 접근 가능

## 8. 배포 체크리스트

- [ ] D1 데이터베이스 생성 및 스키마 적용
- [ ] `wrangler.toml`의 `database_id` 업데이트
- [ ] Cloudflare Pages 프로젝트 생성 및 GitHub 연동
- [ ] 환경 변수 설정 (Production, Preview)
- [ ] D1 바인딩 추가
- [ ] Cron Triggers 설정 (선택)
- [ ] 이메일 서비스 API Key 설정
- [ ] 첫 배포 후 테스트

## 9. 트러블슈팅

### D1 데이터베이스 연결 실패

- `wrangler.toml`의 `database_id` 확인
- Pages 프로젝트에 D1 바인딩이 추가되었는지 확인

### 환경 변수 접근 불가

- Pages Functions에서는 `env` 객체 사용
- Next.js 컴포넌트에서는 `process.env.NEXT_PUBLIC_*`만 사용 가능

### 이메일 발송 실패

- Resend 또는 SendGrid API Key 확인
- Cloudflare Workers에서 외부 API 호출 제한 확인

