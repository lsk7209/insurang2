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
}

module.exports = nextConfig

