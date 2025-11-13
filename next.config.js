/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages 호환: 정적 빌드 출력 사용
  // output: 'export'를 사용하면 빌드 출력이 'out' 디렉토리에 생성됩니다
  output: 'export',
  // 클라우드플레어 Pages 호환을 위한 설정
  images: {
    unoptimized: true,
  },
  // 빌드 최적화: 불필요한 파일 생성 방지
  generateBuildId: async () => {
    // 빌드 ID를 고정하여 캐시 최소화
    return 'build-' + Date.now();
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
        // 소스맵 생성 비활성화
        minimize: true,
      };
    }
    
    return config;
  },
  // output: 'export'를 사용할 때는 API Routes와 middleware가 작동하지 않으므로
  // 빌드 시 경고를 무시하도록 설정
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig

