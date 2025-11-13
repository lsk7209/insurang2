/**
 * Cloudflare Pages 배포 전 캐시 디렉토리 정리 스크립트
 * .next/cache 디렉토리를 삭제하여 25 MiB 파일 크기 제한을 준수합니다.
 */

const fs = require('fs');
const path = require('path');

const nextDir = path.join(process.cwd(), '.next');
const cacheDir = path.join(nextDir, 'cache');

// .next/cache 디렉토리 삭제
if (fs.existsSync(cacheDir)) {
  console.log('Cleaning .next/cache directory...');
  try {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('✓ Cache directory cleaned successfully');
  } catch (error) {
    console.error('Error cleaning cache directory:', error);
    process.exit(1);
  }
} else {
  console.log('Cache directory does not exist, skipping...');
}

// .next/cache/webpack 디렉토리도 확인 및 삭제
const webpackCacheDir = path.join(cacheDir, 'webpack');
if (fs.existsSync(webpackCacheDir)) {
  console.log('Cleaning .next/cache/webpack directory...');
  try {
    fs.rmSync(webpackCacheDir, { recursive: true, force: true });
    console.log('✓ Webpack cache directory cleaned successfully');
  } catch (error) {
    console.error('Error cleaning webpack cache directory:', error);
  }
}

// 큰 파일 검사 및 제거
if (fs.existsSync(nextDir)) {
  console.log('Checking for large files in .next directory...');
  const checkAndRemoveLargeFiles = (dir, maxSize = 25 * 1024 * 1024) => {
    // 25 MiB = 25 * 1024 * 1024 bytes
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // cache 디렉토리는 이미 삭제했으므로 스킵
          if (entry.name !== 'cache') {
            checkAndRemoveLargeFiles(fullPath, maxSize);
          }
        } else {
          const stats = fs.statSync(fullPath);
          if (stats.size > maxSize) {
            console.warn(`⚠ Large file found: ${fullPath} (${(stats.size / 1024 / 1024).toFixed(2)} MiB)`);
            // cache 관련 파일이면 삭제
            if (fullPath.includes('cache') || fullPath.includes('.pack')) {
              console.log(`Removing large cache file: ${fullPath}`);
              fs.unlinkSync(fullPath);
            }
          }
        }
      }
    } catch (error) {
      // 디렉토리 읽기 실패는 무시 (이미 삭제된 경우 등)
    }
  };
  
  checkAndRemoveLargeFiles(nextDir);
}

console.log('✓ Build cleanup completed');

