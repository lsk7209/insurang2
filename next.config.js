/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // 클라우드플레어 Pages 호환을 위한 설정
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

