# D1 데이터베이스 빠른 참조

## 🚀 빠른 설정 (5분)

### 1. 데이터베이스 생성

```bash
wrangler login
wrangler d1 create insurang-db
```

### 2. wrangler.toml 업데이트

생성된 `database_id`를 복사하여 `wrangler.toml`에 입력:

```toml
[[d1_databases]]
binding = "DB"
database_name = "insurang-db"
database_id = "여기에-생성된-ID-입력"
```

### 3. 스키마 적용

```bash
npm run d1:remote
```

### 4. Cloudflare Pages 바인딩

Cloudflare Dashboard > Pages > 프로젝트 > Settings > Functions > D1 Database bindings:

- Variable name: `DB`
- Database: `insurang-db`

---

## 📋 주요 명령어

```bash
# 데이터베이스 목록
wrangler d1 list

# 데이터베이스 정보
wrangler d1 info insurang-db

# 로컬 스키마 적용
npm run d1:local

# 프로덕션 스키마 적용
npm run d1:remote

# 쿼리 실행 (로컬)
wrangler d1 execute insurang-db --local --command "SELECT * FROM offers"

# 쿼리 실행 (프로덕션)
wrangler d1 execute insurang-db --command "SELECT * FROM leads"
```

---

## 🔍 확인 방법

### 데이터베이스 확인

```bash
# 테이블 목록 확인
wrangler d1 execute insurang-db --command "SELECT name FROM sqlite_master WHERE type='table'"

# 오퍼 데이터 확인
wrangler d1 execute insurang-db --command "SELECT * FROM offers"

# 리드 수 확인
wrangler d1 execute insurang-db --command "SELECT COUNT(*) as count FROM leads"
```

### Cloudflare Dashboard

1. Workers & Pages > D1 > `insurang-db`
2. Data 탭: 테이블 및 데이터 확인
3. Query 탭: SQL 쿼리 실행

---

## ⚠️ 주의사항

1. **바인딩 이름**: 반드시 `DB` (대문자)
2. **로컬/프로덕션**: 완전히 분리된 데이터베이스
3. **스키마 변경**: 프로덕션 적용 시 주의
4. **SQLite 문법**: `TEXT`, `INTEGER` 사용

---

자세한 내용은 [D1_SETUP.md](./D1_SETUP.md)를 참고하세요.

