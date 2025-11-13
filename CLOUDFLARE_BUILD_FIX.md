# Cloudflare Pages 빌드 최적화 가이드

## 문제: 25 MiB 파일 크기 제한

Cloudflare Pages는 배포 시 단일 파일이 25 MiB를 초과할 수 없습니다. Next.js 빌드 시 생성되는 `.next/cache` 디렉토리의 파일들이 이 제한을 초과하는 경우가 있습니다.

## 해결 방법

### 1. 자동 캐시 정리 (권장)

프로젝트는 이미 다음 스크립트들을 포함하고 있습니다:

- **`scripts/pre-build.js`**: 빌드 전 캐시 정리
- **`scripts/clean-cache.js`**: 빌드 후 캐시 정리
- **`scripts/post-build.js`**: 빌드 검증

`package.json`의 빌드 스크립트가 자동으로 실행합니다:

```json
{
  "scripts": {
    "prebuild": "node scripts/pre-build.js",
    "build": "next build",
    "postbuild": "node scripts/clean-cache.js && node scripts/post-build.js"
  }
}
```

### 2. Cloudflare Pages 빌드 설정

Cloudflare Dashboard에서 다음 설정을 확인하세요:

**Build settings:**
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (프로젝트 루트)

### 3. 수동 캐시 정리 (필요시)

로컬에서 빌드할 때 캐시를 수동으로 정리하려면:

```bash
# 캐시 디렉토리 삭제
rm -rf .next/cache

# 빌드 실행
npm run build
```

### 4. 빌드 검증

빌드 후 다음 명령으로 검증:

```bash
# 파일 크기 확인
find .next -type f -size +25M

# 캐시 디렉토리 확인
ls -la .next/cache  # 존재하지 않아야 함
```

## 문제 해결 체크리스트

- [ ] `package.json`의 `prebuild`, `build`, `postbuild` 스크립트 확인
- [ ] Cloudflare Dashboard의 빌드 명령이 `npm run build`인지 확인
- [ ] `.wranglerignore` 파일이 존재하는지 확인
- [ ] 빌드 로그에서 캐시 정리 스크립트 실행 확인
- [ ] `.next/cache` 디렉토리가 배포에 포함되지 않는지 확인

## 추가 최적화

### Next.js 설정 (`next.config.js`)

```javascript
webpack: (config) => {
  config.cache = false; // 캐시 완전 비활성화
  return config;
}
```

### 환경 변수

프로덕션 빌드에서 캐시를 방지하려면:

```bash
NODE_ENV=production npm run build
```

## 참고

- Cloudflare Pages 문서: https://developers.cloudflare.com/pages/
- Next.js 배포 가이드: https://nextjs.org/docs/deployment

