/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages는 standalone 출력을 지원하지 않음
  // output: 'standalone', // 제거
  // 클라우드플레어 Pages 호환을 위한 설정
  images: {
    unoptimized: true,
  },
  // Cloudflare Pages Functions를 위한 설정
  experimental: {
    // 필요시 추가 설정
  },
  // 빌드 최적화: 불필요한 파일 생성 방지
  generateBuildId: async () => {
    // 빌드 ID를 고정하여 캐시 최소화
    return 'build-' + Date.now();
  },
  // Cloudflare Pages 배포 최적화
  distDir: '.next',
  // 캐시 디렉토리 설정 (배포 시 제외됨)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig

