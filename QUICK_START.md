# 빠른 시작 가이드

## 🚀 GitHub 자동 배포 설정 (5분)

### 1단계: Cloudflare Pages 프로젝트 생성

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속
2. **Workers & Pages** > **Create application** > **Pages** 클릭
3. **Connect to Git** 클릭
4. GitHub 저장소 선택: `lsk7209/insurang2`
5. 프로젝트 이름: `insurang-landing`

### 2단계: 빌드 설정

- **Framework preset**: `Next.js` (자동 감지)
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (기본값)

### 3단계: D1 데이터베이스 설정

#### D1 데이터베이스 생성

```bash
# Wrangler CLI 로그인 (처음 한 번만)
wrangler login

# D1 데이터베이스 생성
wrangler d1 create insurang-db
```

**출력에서 `database_id`를 복사하세요!**

#### wrangler.toml 업데이트

생성된 `database_id`를 `wrangler.toml`에 업데이트:

```toml
[[d1_databases]]
binding = "DB"
database_name = "insurang-db"
database_id = "your-database-id-here"  # ← 생성된 ID로 변경
```

#### 스키마 적용

```bash
# 프로덕션 스키마 적용
npm run d1:remote
```

#### D1 바인딩 추가 (중요!)

Cloudflare Dashboard > Pages > 프로젝트 > **Settings** > **Functions** > **D1 Database bindings**:

1. **Add binding** 클릭
2. **Variable name**: `DB` (반드시 대문자)
3. **Database**: `insurang-db` 선택
4. **Save** 클릭

**⚠️ 주의**: D1 바인딩을 추가하지 않으면 데이터베이스에 접근할 수 없습니다!

자세한 설정은 [D1_SETUP.md](./D1_SETUP.md)를 참고하세요.

### 4단계: 환경 변수 설정

Cloudflare Dashboard > Pages > 프로젝트 > **Settings** > **Environment Variables**:

**Production 환경 변수 추가:**

```
RESEND_API_KEY=your-resend-api-key
SMTP_FROM=noreply@yourdomain.com
SOLAPI_API_KEY=your-api-key
SOLAPI_API_SECRET=your-api-secret
SOLAPI_SENDER_PHONE=01012345678
```

### 5단계: 배포 확인

1. **Save and Deploy** 클릭
2. GitHub에 푸시하면 자동 배포 시작
3. **Deployments** 탭에서 배포 상태 확인
4. 배포 완료 후 제공되는 URL로 접속

---

## ✅ 배포 완료 체크리스트

- [ ] D1 데이터베이스 생성 및 스키마 적용
- [ ] `wrangler.toml`에 `database_id` 업데이트
- [ ] 환경 변수 설정 완료
- [ ] D1 바인딩 추가 완료
- [ ] 첫 배포 성공 확인
- [ ] `/offer/workbook` 페이지 접속 확인
- [ ] 신청 폼 제출 테스트
- [ ] 관리자 페이지 (`/admin/leads`) 접속 확인

---

## 🔧 문제 해결

### 배포 실패 시

1. **빌드 로그 확인**
   - Cloudflare Dashboard > Pages > 프로젝트 > Deployments
   - 실패한 배포 클릭하여 에러 확인

2. **환경 변수 확인**
   - Settings > Environment Variables
   - 모든 필수 변수 확인

3. **D1 바인딩 확인**
   - Settings > Functions > D1 Database bindings
   - 바인딩 이름이 `DB`인지 확인

### 로컬 테스트

```bash
# D1 로컬 데이터베이스
npm run d1:local

# .dev.vars 파일 생성
cat > .dev.vars << EOF
RESEND_API_KEY=your-key
SMTP_FROM=noreply@example.com
SOLAPI_API_KEY=your-key
SOLAPI_API_SECRET=your-secret
SOLAPI_SENDER_PHONE=01012345678
EOF

# 로컬 개발 서버
npm run cf:dev
```

---

## 📚 추가 자료

- [상세 배포 가이드](./GITHUB_DEPLOYMENT.md)
- [Cloudflare 설정 가이드](./CLOUDFLARE_SETUP.md)
- [최종 검증 보고서](./FINAL_VERIFICATION.md)

**자동 배포 설정 완료!** 🎉

