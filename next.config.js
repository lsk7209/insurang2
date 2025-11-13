/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages는 standalone 출력을 지원하지 않음
  // output: 'standalone', // 제거
  // Cloudflare Pages 호환: 정적 빌드 출력 사용
  output: 'export',
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
  // Webpack 캐시 완전 비활성화 (Cloudflare Pages 25 MiB 제한 준수)
  webpack: (config, { isServer, dev }) => {
    // 모든 빌드에서 캐시 비활성화
    config.cache = false;
    
    // 추가 최적화: 불필요한 파일 생성 방지
    if (!dev) {
      // 프로덕션 빌드에서만 추가 최적화
      config.optimization = {
        ...config.optimization,
        // 소스맵 생성 비활성화 (선택사항)
        // minimize: true,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig

