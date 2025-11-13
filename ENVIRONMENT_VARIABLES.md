# 환경 변수 설정 가이드

## 📋 필수 환경 변수

### 이메일 서비스 (Resend 또는 SendGrid 중 하나 선택)

#### Resend 사용 시
```bash
RESEND_API_KEY=your-resend-api-key
SMTP_FROM=noreply@yourdomain.com
```

#### SendGrid 사용 시
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

**참고**: `SMTP_FROM`은 발신자 이메일 주소입니다. 도메인 인증이 필요할 수 있습니다.

### SMS 서비스 (솔라피)

```bash
SOLAPI_API_KEY=your-api-key
SOLAPI_API_SECRET=your-api-secret
SOLAPI_SENDER_PHONE=01012345678
```

**참고**: 
- `SOLAPI_SENDER_PHONE`은 발신자 전화번호입니다. 숫자만 입력하세요 (예: `01012345678`).
- 솔라피 계정에서 발신번호 등록이 필요합니다.

### 관리자 인증 (선택사항)

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

**참고**: 
- 설정하지 않으면 기본값 `admin`이 사용됩니다.
- `ADMIN_PASSWORD`는 반드시 설정해야 합니다.
- 관리자 API (`/api/admin/leads`)에 접근할 때 Basic Auth가 필요합니다.

## 🔧 설정 위치

### 로컬 개발

`.dev.vars` 파일을 프로젝트 루트에 생성:

```bash
# .dev.vars
RESEND_API_KEY=your-resend-api-key
SMTP_FROM=noreply@yourdomain.com
SOLAPI_API_KEY=your-api-key
SOLAPI_API_SECRET=your-api-secret
SOLAPI_SENDER_PHONE=01012345678
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

**⚠️ 중요**: `.dev.vars` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

### Cloudflare Pages 배포

Cloudflare Dashboard > Pages > 프로젝트 > **Settings** > **Environment Variables**:

1. **Production** 환경 변수 추가:
   - `RESEND_API_KEY` 또는 `SENDGRID_API_KEY`
   - `SMTP_FROM`
   - `SOLAPI_API_KEY`
   - `SOLAPI_API_SECRET`
   - `SOLAPI_SENDER_PHONE`
   - `ADMIN_USERNAME` (선택사항)
   - `ADMIN_PASSWORD` (선택사항, 하지만 권장)

2. **Preview** 환경 변수 (선택사항):
   - 테스트용 환경 변수 설정 가능

## 🔐 보안 권장사항

1. **강력한 비밀번호 사용**
   - `ADMIN_PASSWORD`는 최소 16자 이상의 복잡한 비밀번호 사용
   - 랜덤 비밀번호 생성기 사용 권장

2. **환경 변수 보호**
   - `.dev.vars` 파일을 절대 Git에 커밋하지 마세요
   - Cloudflare Dashboard에서 환경 변수는 암호화되어 저장됩니다

3. **API 키 관리**
   - API 키는 정기적으로 로테이션하세요
   - 사용하지 않는 API 키는 즉시 삭제하세요

## ✅ 환경 변수 확인

### 로컬 개발 시

```bash
# Wrangler CLI로 환경 변수 확인
wrangler pages dev .next
```

### 프로덕션 배포 후

Cloudflare Dashboard > Pages > 프로젝트 > **Deployments** > 최신 배포 > **Functions** 탭에서 환경 변수 확인 가능합니다.

## 🐛 문제 해결

### 이메일이 발송되지 않는 경우

1. `RESEND_API_KEY` 또는 `SENDGRID_API_KEY` 확인
2. `SMTP_FROM` 도메인 인증 확인
3. Cloudflare Dashboard의 Functions 로그 확인

### SMS가 발송되지 않는 경우

1. `SOLAPI_API_KEY`, `SOLAPI_API_SECRET` 확인
2. `SOLAPI_SENDER_PHONE` 형식 확인 (숫자만)
3. 솔라피 계정에서 발신번호 등록 확인
4. Cloudflare Dashboard의 Functions 로그 확인

### 관리자 페이지 접근 불가

1. `ADMIN_USERNAME`, `ADMIN_PASSWORD` 확인
2. 브라우저 개발자 도구 > Network 탭에서 401 에러 확인
3. Basic Auth 헤더 확인

---

**작성일**: 2025-01-13  
**최종 업데이트**: 2025-01-13

