# GitHub 자동 배포 완료 ✅

## 🎉 설정 완료

GitHub 자동 배포가 설정되었습니다. 이제 `main` 브랜치에 푸시하면 자동으로 Cloudflare Pages에 배포됩니다.

## 📋 생성된 파일

### 1. GitHub Actions 워크플로우
- `.github/workflows/deploy-cloudflare.yml` - Cloudflare Pages 자동 배포
- `.github/workflows/ci.yml` - CI (린트 및 빌드 테스트)

### 2. 배포 가이드 문서
- `GITHUB_DEPLOYMENT.md` - 상세 배포 가이드
- `QUICK_START.md` - 빠른 시작 가이드

## 🚀 다음 단계

### 방법 1: Cloudflare Dashboard에서 직접 연동 (권장)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속
2. **Workers & Pages** > **Create application** > **Pages**
3. **Connect to Git** 클릭
4. GitHub 저장소 선택: `lsk7209/insurang2`
5. 프로젝트 이름: `insurang-landing`
6. 빌드 설정:
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Build output directory: `.next`
7. 환경 변수 및 D1 바인딩 설정
8. **Save and Deploy** 클릭

**이 방법이 가장 간단하고 권장됩니다!**

### 방법 2: GitHub Actions 사용 (고급)

GitHub Actions를 사용하려면:

1. Cloudflare API Token 생성
2. GitHub Secrets 설정:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. `.github/workflows/deploy-cloudflare.yml`이 자동으로 실행됨

## ✅ 자동 배포 작동 방식

### Cloudflare Dashboard 연동 시
- `main` 브랜치에 푸시 → 자동 배포 시작
- Pull Request 생성 → Preview 배포
- 배포 상태는 Cloudflare Dashboard에서 확인

### GitHub Actions 사용 시
- `main` 브랜치에 푸시 → GitHub Actions 실행 → Cloudflare Pages 배포
- Pull Request 생성 → CI 실행 (배포는 하지 않음)
- 배포 상태는 GitHub Actions 탭에서 확인

## 📚 참고 문서

- [빠른 시작 가이드](./QUICK_START.md)
- [상세 배포 가이드](./GITHUB_DEPLOYMENT.md)
- [Cloudflare 설정 가이드](./CLOUDFLARE_SETUP.md)

**자동 배포 설정 완료!** 🎉

