# Cloudflare 환경 최종 체크리스트

## ✅ 완료된 항목

### 1. 데이터베이스 (D1)
- ✅ `wrangler.toml`에 D1 바인딩 설정
- ✅ `lib/db-cloudflare.ts` - D1 전용 클라이언트 구현
- ✅ `db/schema.sql` - D1 스키마 준비
- ✅ Supabase 의존성 완전 제거

### 2. Pages Functions
- ✅ `functions/api/leads.ts` - 리드 생성 API
- ✅ `functions/api/admin/leads.ts` - 관리자 리드 조회
- ✅ `functions/api/admin/settings.ts` - 설정 관리
- ✅ 모든 API가 D1 직접 사용

### 3. 이메일/SMS 서비스
- ✅ Resend API 지원
- ✅ SendGrid API 지원
- ✅ 솔라피 API (HMAC-SHA256 인증)
- ✅ nodemailer 제거

### 4. 빌드 설정
- ✅ `next.config.js` - standalone 출력 제거
- ✅ `wrangler.toml` - pages_build_output_dir 설정
- ✅ 이미지 최적화 비활성화

### 5. Cron Triggers
- ✅ `functions/cron/daily-report.ts` - 일일 리포트 Worker
- ⚠️ wrangler.toml에 cron 설정 필요 (현재 주석 처리됨)

## ⚠️ 수정 필요 항목

### 1. Cron 트리거 설정
- `wrangler.toml`에서 cron 주석 해제 필요
- 또는 Cloudflare Dashboard에서 설정

### 2. D1 스키마 DATE 함수
- D1은 SQLite 기반이므로 DATE 함수 사용 시 주의
- `DATE(created_at)` 대신 `date(created_at)` 또는 다른 방식 사용

### 3. package.json 정리
- `@types/nodemailer` 제거 필요 (nodemailer 미사용)

### 4. 환경 변수 검증
- API에서 필수 환경 변수 검증 추가

## 📋 배포 전 확인사항

### 필수 설정
- [ ] D1 데이터베이스 생성 및 `database_id` 설정
- [ ] D1 스키마 적용 (`npm run d1:remote`)
- [ ] 환경 변수 설정 (Cloudflare Dashboard)
  - `RESEND_API_KEY` 또는 `SENDGRID_API_KEY`
  - `SMTP_FROM`
  - `SOLAPI_API_KEY`
  - `SOLAPI_API_SECRET`
  - `SOLAPI_SENDER_PHONE`
- [ ] D1 바인딩 확인 (Pages Settings)

### 선택 설정
- [ ] Cron 트리거 활성화
- [ ] 커스텀 도메인 설정
- [ ] SSL 인증서 확인

## 🔧 로컬 개발

```bash
# 1. D1 로컬 데이터베이스 생성
npm run d1:local

# 2. .dev.vars 파일 생성
RESEND_API_KEY=your-key
SMTP_FROM=noreply@example.com
SOLAPI_API_KEY=your-key
SOLAPI_API_SECRET=your-secret
SOLAPI_SENDER_PHONE=01012345678

# 3. 로컬 개발 서버 실행
npm run cf:dev
```

## 🚀 배포

```bash
# 1. 빌드
npm run build

# 2. D1 스키마 적용 (프로덕션)
npm run d1:remote

# 3. 배포 (GitHub 연동 시 자동)
# 또는 수동 배포
npm run cf:deploy
```

