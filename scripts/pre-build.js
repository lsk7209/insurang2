/**
 * Cloudflare Pages 빌드 전 준비 스크립트
 * 빌드 전에 캐시 디렉토리를 미리 정리하여 캐시 생성 방지
 */

const fs = require('fs');
const path = require('path');

const nextDir = path.join(process.cwd(), '.next');
const cacheDir = path.join(nextDir, 'cache');

console.log('🔧 Pre-build cleanup...');

// 기존 캐시 디렉토리 제거 (빌드 전)
if (fs.existsSync(cacheDir)) {
  console.log('  Removing existing cache directory...');
  try {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('  ✓ Cache directory removed');
  } catch (error) {
    console.warn(`  ⚠ Could not remove cache: ${error.message}`);
  }
}

// .next 디렉토리가 없으면 생성 (Next.js가 자동 생성하지만 확실히)
if (!fs.existsSync(nextDir)) {
  try {
    fs.mkdirSync(nextDir, { recursive: true });
    console.log('  ✓ .next directory ready');
  } catch (error) {
    // 무시 (Next.js가 생성함)
  }
}

console.log('✅ Pre-build cleanup completed\n');

