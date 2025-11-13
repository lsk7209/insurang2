# 배포 체크리스트

## ✅ 배포 전 확인사항

### 1. 코드 검증
- [x] 빌드 성공 확인 (`npm run build`)
- [x] TypeScript 컴파일 에러 없음
- [x] Linter 에러 없음
- [x] 모든 페이지 정상 작동
- [x] API 엔드포인트 정상 작동

### 2. 데이터베이스 설정
- [ ] D1 데이터베이스 생성 완료
- [ ] `wrangler.toml`에 `database_id` 설정 완료
- [ ] 스키마 적용 완료 (`npm run d1:remote`)
- [ ] Cloudflare Pages에서 D1 바인딩 추가 완료
  - Variable name: `DB` (대문자)
  - Database: `insurang-db`

### 3. 환경 변수 설정
- [ ] `RESEND_API_KEY` 또는 `SENDGRID_API_KEY` 설정
- [ ] `SMTP_FROM` 설정 (도메인 인증 완료)
- [ ] `SOLAPI_API_KEY` 설정
- [ ] `SOLAPI_API_SECRET` 설정
- [ ] `SOLAPI_SENDER_PHONE` 설정
- [ ] `ADMIN_USERNAME` 설정 (선택사항)
- [ ] `ADMIN_PASSWORD` 설정 (권장)

### 4. Cloudflare Pages 설정
- [ ] GitHub 저장소 연결 완료
- [ ] 빌드 설정 확인
  - Build command: `npm run build`
  - Build output directory: `.next`
- [ ] 환경 변수 설정 완료
- [ ] D1 바인딩 추가 완료

### 5. 기능 테스트
- [ ] 오퍼 랜딩 페이지 접근 가능 (`/offer/workbook`)
- [ ] 신청 폼 제출 테스트
- [ ] 감사 페이지 리다이렉트 확인 (`/offer/workbook/thanks`)
- [ ] 이메일 발송 확인
- [ ] SMS 발송 확인
- [ ] 관리자 페이지 접근 테스트 (`/admin/leads`)
- [ ] Basic Auth 동작 확인
- [ ] 리드 목록 조회 확인

### 6. 보안 확인
- [ ] Rate Limiting 동작 확인 (10 req/min)
- [ ] Basic Auth 동작 확인
- [ ] 입력 검증 동작 확인
- [ ] 에러 로깅 동작 확인 (console + DB)

## 🚀 배포 프로세스

### 1단계: GitHub에 푸시

```bash
git add .
git commit -m "feat: 배포 준비 완료"
git push origin main
```

### 2단계: Cloudflare Pages 자동 배포 확인

1. Cloudflare Dashboard > Pages > 프로젝트 > **Deployments** 탭 확인
2. 배포 상태 확인 (Building → Success)
3. 배포 완료 후 제공되는 URL 확인

### 3단계: 배포 후 테스트

1. **오퍼 랜딩 페이지 테스트**
   ```
   https://your-project.pages.dev/offer/workbook
   ```

2. **신청 폼 테스트**
   - 이름, 이메일, 전화번호 입력
   - 개인정보 동의 체크
   - 제출 버튼 클릭
   - 감사 페이지로 리다이렉트 확인

3. **이메일 발송 확인**
   - 입력한 이메일 주소로 이메일 수신 확인
   - 제목: "[AI 상담 워크북] 신청해 주셔서 감사합니다."

4. **SMS 발송 확인**
   - 입력한 전화번호로 SMS 수신 확인
   - 메시지: "[인슈랑] 신청 완료되었습니다. 자료 안내는 이메일로 발송되었습니다. 확인 부탁드립니다."

5. **관리자 페이지 테스트**
   ```
   https://your-project.pages.dev/admin/leads
   ```
   - Basic Auth 팝업 확인
   - 로그인 후 리드 목록 확인
   - 이메일/SMS 발송 상태 확인

## 📊 모니터링

### Cloudflare Dashboard

1. **Functions 로그 확인**
   - Pages > 프로젝트 > **Deployments** > 최신 배포 > **Functions** 탭
   - 에러 로그 확인

2. **Analytics 확인**
   - Pages > 프로젝트 > **Analytics** 탭
   - 요청 수, 에러율 확인

### 데이터베이스 모니터링

1. **D1 데이터베이스 확인**
   ```bash
   # 리드 목록 확인
   wrangler d1 execute insurang-db --command "SELECT COUNT(*) FROM leads"
   
   # 에러 로그 확인
   wrangler d1 execute insurang-db --command "SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 10"
   ```

2. **메시지 로그 확인**
   ```bash
   wrangler d1 execute insurang-db --command "SELECT * FROM message_logs ORDER BY sent_at DESC LIMIT 10"
   ```

## 🐛 문제 해결

### 빌드 실패

1. Cloudflare Dashboard > Deployments > 실패한 배포 클릭
2. 빌드 로그 확인
3. 일반적인 원인:
   - 환경 변수 누락
   - TypeScript 컴파일 에러
   - 의존성 설치 실패

### 데이터베이스 접근 불가

1. D1 바인딩 확인
   - Settings > Functions > D1 Database bindings
   - Variable name이 `DB` (대문자)인지 확인
2. 데이터베이스 ID 확인
   - `wrangler.toml`의 `database_id` 확인
3. 스키마 적용 확인
   - `npm run d1:remote` 실행

### 이메일/SMS 발송 실패

1. 환경 변수 확인
   - Cloudflare Dashboard > Settings > Environment Variables
2. Functions 로그 확인
   - 에러 메시지 확인
3. API 서비스 상태 확인
   - Resend/SendGrid/Solapi 서비스 상태 확인

## 📝 배포 후 작업

1. **도메인 연결** (선택사항)
   - Custom Domain 설정
   - SSL 인증서 자동 발급

2. **모니터링 설정**
   - 에러 알림 설정
   - 성능 모니터링 설정

3. **백업 설정**
   - D1 데이터베이스 백업 스케줄 설정

---

**작성일**: 2025-01-13  
**최종 업데이트**: 2025-01-13

