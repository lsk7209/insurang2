# Cloudflare D1 데이터베이스 설정 가이드

## 🗄️ D1 데이터베이스 설정 완전 가이드

### 1단계: D1 데이터베이스 생성

#### Wrangler CLI 설치 (아직 설치하지 않은 경우)

```bash
npm install -g wrangler
# 또는
npm install --save-dev wrangler
```

#### Wrangler 로그인

```bash
wrangler login
```

브라우저가 열리면 Cloudflare 계정으로 로그인하세요.

#### D1 데이터베이스 생성

```bash
wrangler d1 create insurang-db
```

출력 예시:
```
✅ Successfully created DB 'insurang-db'!

[[d1_databases]]
binding = "DB"
database_name = "insurang-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**중요**: 생성된 `database_id`를 복사하세요!

---

### 2단계: wrangler.toml 설정

`wrangler.toml` 파일을 열고 `database_id`를 업데이트하세요:

```toml
# D1 데이터베이스 바인딩
[[d1_databases]]
binding = "DB"
database_name = "insurang-db"
database_id = "your-database-id-here"  # ← 여기에 생성된 ID 입력
```

---

### 3단계: 스키마 적용

#### 로컬 개발용 스키마 적용

```bash
npm run d1:local
```

또는 직접 실행:

```bash
wrangler d1 execute insurang-db --local --file=./db/schema.sql
```

#### 프로덕션 스키마 적용

```bash
npm run d1:remote
```

또는 직접 실행:

```bash
wrangler d1 execute insurang-db --file=./db/schema.sql
```

**⚠️ 중요**: 프로덕션 스키마는 한 번만 실행하면 됩니다. 중복 실행해도 `CREATE TABLE IF NOT EXISTS`로 인해 안전합니다.

---

### 4단계: Cloudflare Pages에서 D1 바인딩 설정

#### Cloudflare Dashboard에서 설정

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속
2. **Workers & Pages** > **Pages** 선택
3. 프로젝트 선택: `insurang-landing`
4. **Settings** 탭 클릭
5. **Functions** 섹션으로 스크롤
6. **D1 Database bindings** 섹션에서 **Add binding** 클릭
7. 설정:
   - **Variable name**: `DB` (반드시 대문자)
   - **Database**: `insurang-db` 선택
8. **Save** 클릭

#### 확인 방법

D1 바인딩이 제대로 설정되었는지 확인:

1. Pages 프로젝트 > **Settings** > **Functions**
2. **D1 Database bindings** 섹션에 `DB` 바인딩이 표시되어야 함
3. 연결된 데이터베이스: `insurang-db`

---

### 5단계: 데이터베이스 확인

#### 로컬 데이터베이스 확인

```bash
# 로컬 D1 쿼리 실행
wrangler d1 execute insurang-db --local --command "SELECT * FROM offers"
```

#### 프로덕션 데이터베이스 확인

```bash
# 프로덕션 D1 쿼리 실행
wrangler d1 execute insurang-db --command "SELECT * FROM offers"
```

#### Cloudflare Dashboard에서 확인

1. **Workers & Pages** > **D1** 선택
2. `insurang-db` 데이터베이스 클릭
3. **Data** 탭에서 테이블 및 데이터 확인
4. **Query** 탭에서 SQL 쿼리 실행 가능

---

## 📋 스키마 구조

### 테이블 목록

1. **offers** - 오퍼 정보
   - `id`, `slug`, `name`, `description`, `status`, `download_link`, `created_at`, `updated_at`

2. **leads** - 리드 정보
   - `id`, `offer_slug`, `name`, `email`, `phone`, `organization`, `consent_privacy`, `consent_marketing`, `created_at`

3. **message_logs** - 메시지 발송 로그
   - `id`, `lead_id`, `channel`, `status`, `error_message`, `sent_at`

### 초기 데이터

스키마 적용 시 자동으로 다음 오퍼가 생성됩니다:

- **slug**: `workbook`
- **name**: `AI 상담 워크북`
- **status**: `active`

---

## 🔧 유용한 D1 명령어

### 데이터베이스 목록 확인

```bash
wrangler d1 list
```

### 특정 데이터베이스 정보 확인

```bash
wrangler d1 info insurang-db
```

### SQL 쿼리 실행

```bash
# 로컬
wrangler d1 execute insurang-db --local --command "SELECT COUNT(*) FROM leads"

# 프로덕션
wrangler d1 execute insurang-db --command "SELECT COUNT(*) FROM leads"
```

### SQL 파일 실행

```bash
# 로컬
wrangler d1 execute insurang-db --local --file=./db/schema.sql

# 프로덕션
wrangler d1 execute insurang-db --file=./db/schema.sql
```

### 데이터베이스 백업 (로컬)

```bash
wrangler d1 export insurang-db --local --output=./backup.sql
```

### 데이터베이스 복원 (로컬)

```bash
wrangler d1 execute insurang-db --local --file=./backup.sql
```

---

## ⚠️ 주의사항

### 1. 데이터베이스 ID 보안

- `database_id`는 공개되어도 되지만, 민감한 정보는 아닙니다
- 하지만 GitHub에 푸시하기 전에 실제 ID로 업데이트하세요
- `.dev.vars` 파일은 `.gitignore`에 포함되어 있어 안전합니다

### 2. 로컬 vs 프로덕션

- **로컬 D1**: 개발 및 테스트용
- **프로덕션 D1**: 실제 운영 데이터
- 두 데이터베이스는 완전히 분리되어 있습니다

### 3. 스키마 변경

- 스키마를 변경한 경우 `db/schema.sql` 파일을 수정
- 프로덕션에 적용: `npm run d1:remote`
- **주의**: 기존 데이터가 있는 경우 마이그레이션 스크립트 필요

### 4. D1 제한사항

- SQLite 기반이므로 SQLite 문법 사용
- `VARCHAR` 대신 `TEXT` 사용
- `BOOLEAN` 대신 `INTEGER` (0/1) 사용
- 일부 고급 SQL 기능 제한

---

## 🧪 테스트

### 로컬 테스트

```bash
# 1. 로컬 D1 데이터베이스 생성
npm run d1:local

# 2. 로컬 개발 서버 실행
npm run cf:dev

# 3. 브라우저에서 테스트
# http://localhost:8788/offer/workbook
```

### 프로덕션 테스트

1. 스키마 적용 확인:
   ```bash
   wrangler d1 execute insurang-db --command "SELECT * FROM offers"
   ```

2. 배포 후 테스트:
   - 신청 폼 제출
   - 관리자 페이지에서 리드 확인
   - D1 Dashboard에서 데이터 확인

---

## 📊 모니터링

### Cloudflare Dashboard

1. **Workers & Pages** > **D1** > `insurang-db`
2. **Analytics** 탭: 쿼리 통계 확인
3. **Data** 탭: 데이터 확인 및 수정
4. **Query** 탭: SQL 쿼리 실행

### 쿼리 로그

Pages Functions에서 실행된 D1 쿼리는 자동으로 로깅됩니다:
- Cloudflare Dashboard > Pages > 프로젝트 > **Functions** > **Logs**

---

## 🔍 트러블슈팅

### D1 바인딩 오류

**문제**: `D1 Database not configured` 에러

**해결**:
1. Cloudflare Dashboard에서 D1 바인딩 확인
2. 바인딩 이름이 `DB` (대문자)인지 확인
3. 연결된 데이터베이스가 `insurang-db`인지 확인
4. Pages 프로젝트 재배포

### 스키마 적용 실패

**문제**: 스키마 적용 시 에러 발생

**해결**:
1. SQL 문법 확인 (SQLite 호환)
2. 기존 테이블 확인: `SELECT name FROM sqlite_master WHERE type='table'`
3. 테이블이 이미 있는 경우 `DROP TABLE` 후 재생성 (주의!)

### 데이터 조회 실패

**문제**: 쿼리 결과가 없음

**해결**:
1. 로컬/프로덕션 구분 확인
2. 테이블에 데이터가 있는지 확인
3. 쿼리 문법 확인

---

## ✅ 체크리스트

### 초기 설정
- [ ] Wrangler CLI 설치 및 로그인
- [ ] D1 데이터베이스 생성
- [ ] `wrangler.toml`에 `database_id` 업데이트
- [ ] 로컬 스키마 적용 (`npm run d1:local`)
- [ ] 프로덕션 스키마 적용 (`npm run d1:remote`)

### Cloudflare Pages 설정
- [ ] Pages 프로젝트 생성
- [ ] D1 바인딩 추가 (Settings > Functions > D1 Database bindings)
- [ ] 바인딩 이름: `DB`
- [ ] 연결된 데이터베이스: `insurang-db`

### 테스트
- [ ] 로컬에서 D1 쿼리 실행 확인
- [ ] 프로덕션에서 D1 쿼리 실행 확인
- [ ] 신청 폼 제출 후 데이터 저장 확인
- [ ] 관리자 페이지에서 리드 조회 확인

---

## 📚 참고 자료

- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
- [D1 SQLite 참조](https://www.sqlite.org/lang.html)
- [Wrangler CLI 문서](https://developers.cloudflare.com/workers/wrangler/)

**D1 데이터베이스 설정 완료!** 🎉

