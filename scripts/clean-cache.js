/**
 * Cloudflare Pages 배포 전 캐시 디렉토리 정리 스크립트
 * .next/cache 디렉토리를 삭제하여 25 MiB 파일 크기 제한을 준수합니다.
 */

const fs = require('fs');
const path = require('path');

const cacheDir = path.join(process.cwd(), '.next', 'cache');

if (fs.existsSync(cacheDir)) {
  console.log('Cleaning .next/cache directory...');
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✓ Cache directory cleaned successfully');
} else {
  console.log('Cache directory does not exist, skipping...');
}

