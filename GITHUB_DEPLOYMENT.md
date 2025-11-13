# GitHub 자동 배포 설정 가이드

## 🚀 Cloudflare Pages 자동 배포 설정

### 방법 1: Cloudflare Dashboard에서 직접 연동 (권장)

#### 1단계: Cloudflare Pages 프로젝트 생성

1. [Cloudflare Dashboard](https://dash.cloudflare.com)에 로그인
2. **Workers & Pages** > **Create application** > **Pages** 선택
3. **Connect to Git** 클릭
4. GitHub 저장소 선택: `lsk7209/insurang2`
5. 프로젝트 이름: `insurang-landing`

#### 2단계: 빌드 설정

- **Framework preset**: `Next.js`
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (프로젝트 루트)

#### 3단계: 환경 변수 설정

**Settings** > **Environment Variables**에서 다음 변수 추가:

**Production:**
```
RESEND_API_KEY=your-resend-api-key
# 또는
# SENDGRID_API_KEY=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
SOLAPI_API_KEY=your-api-key
SOLAPI_API_SECRET=your-api-secret
SOLAPI_SENDER_PHONE=01012345678
```

**Preview (선택):**
- 동일한 환경 변수 또는 테스트용 값

#### 4단계: D1 데이터베이스 바인딩

**Settings** > **Functions** > **D1 Database bindings**:

1. **Add binding** 클릭
2. **Variable name**: `DB` (반드시 대문자)
3. **Database**: `insurang-db` 선택
4. **Save** 클릭

**⚠️ 중요**: D1 바인딩을 추가하지 않으면 데이터베이스에 접근할 수 없습니다!

자세한 D1 설정은 [D1_SETUP.md](./D1_SETUP.md)를 참고하세요.

#### 5단계: 배포 확인

- GitHub에 푸시하면 자동으로 배포 시작
- **Deployments** 탭에서 배포 상태 확인
- 배포 완료 후 제공되는 URL로 접속 가능

---

### 방법 2: GitHub Actions 사용 (고급)

#### 1단계: Cloudflare API Token 생성

1. Cloudflare Dashboard > **My Profile** > **API Tokens**
2. **Create Token** 클릭
3. **Edit Cloudflare Workers** 템플릿 선택
4. 권한 설정:
   - **Account** > **Cloudflare Pages** > **Edit**
   - **Zone** > **Zone Settings** > **Read** (도메인 사용 시)
5. Token 생성 및 복사

#### 2단계: GitHub Secrets 설정

1. GitHub 저장소 > **Settings** > **Secrets and variables** > **Actions**
2. 다음 Secrets 추가:

```
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

**Account ID 확인 방법:**
- Cloudflare Dashboard 우측 사이드바에서 확인
- 또는 `wrangler whoami` 명령어로 확인

#### 3단계: GitHub Actions 워크플로우

`.github/workflows/deploy-cloudflare.yml` 파일이 자동으로 사용됩니다.

#### 4단계: 배포 확인

- `main` 브랜치에 푸시하면 자동 배포
- **Actions** 탭에서 워크플로우 실행 상태 확인

---

## 📋 배포 전 체크리스트

### 필수 설정
- [ ] D1 데이터베이스 생성 및 스키마 적용
- [ ] `wrangler.toml`에 `database_id` 업데이트
- [ ] 환경 변수 설정 (Cloudflare Dashboard)
- [ ] D1 바인딩 추가 (Pages Settings)

### 선택 설정
- [ ] 커스텀 도메인 설정
- [ ] SSL 인증서 확인
- [ ] Cron 트리거 활성화

---

## 🔧 로컬 테스트

배포 전 로컬에서 테스트:

```bash
# 1. D1 로컬 데이터베이스 생성
npm run d1:local

# 2. .dev.vars 파일 생성
RESEND_API_KEY=your-key
SMTP_FROM=noreply@example.com
SOLAPI_API_KEY=your-key
SOLAPI_API_SECRET=your-secret
SOLAPI_SENDER_PHONE=01012345678

# 3. 빌드
npm run build

# 4. 로컬 테스트
npm run cf:dev
```

---

## 🚨 트러블슈팅

### 배포 실패 시

1. **빌드 로그 확인**
   - Cloudflare Dashboard > Pages > 프로젝트 > Deployments
   - 실패한 배포 클릭하여 로그 확인

2. **환경 변수 확인**
   - Settings > Environment Variables
   - 모든 필수 변수가 설정되었는지 확인

3. **D1 바인딩 확인**
   - Settings > Functions > D1 Database bindings
   - 바인딩 이름이 `DB`인지 확인

4. **스키마 확인**
   - D1 데이터베이스에 스키마가 적용되었는지 확인
   - `npm run d1:remote` 실행

### GitHub Actions 실패 시

1. **Secrets 확인**
   - GitHub Settings > Secrets and variables > Actions
   - `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` 확인

2. **워크플로우 로그 확인**
   - GitHub > Actions 탭
   - 실패한 워크플로우 클릭하여 로그 확인

---

## 📚 참고 자료

- [Cloudflare Pages 문서](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)

---

## ✅ 배포 완료 후

배포가 완료되면:

1. 제공된 URL로 접속하여 테스트
2. `/offer/workbook` 페이지 확인
3. 신청 폼 제출 테스트
4. 관리자 페이지 (`/admin/leads`) 확인
5. 이메일/SMS 발송 확인

**자동 배포 설정 완료!** 🎉

