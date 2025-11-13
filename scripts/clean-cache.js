/**
 * Cloudflare Pages 배포 전 캐시 디렉토리 정리 스크립트
 * .next/cache 디렉토리를 삭제하여 25 MiB 파일 크기 제한을 준수합니다.
 */

const fs = require('fs');
const path = require('path');

const nextDir = path.join(process.cwd(), '.next');
const cacheDir = path.join(nextDir, 'cache');
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MiB

console.log('🧹 Starting cache cleanup...');

// .next/cache 디렉토리 완전 삭제
if (fs.existsSync(cacheDir)) {
  console.log('  Removing .next/cache directory...');
  try {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('  ✓ Cache directory removed');
  } catch (error) {
    console.error('  ✗ Error removing cache directory:', error.message);
    // 계속 진행 (다른 방법 시도)
  }
} else {
  console.log('  ✓ Cache directory does not exist');
}

// .next 디렉토리 내의 모든 cache 관련 파일/디렉토리 검색 및 삭제
function removeCacheFiles(dir, basePath = '') {
  if (!fs.existsSync(dir)) return;
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      // cache 관련 이름이면 삭제
      if (entry.name.includes('cache') || entry.name.includes('.pack')) {
        try {
          if (entry.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`  ✓ Removed cache directory: ${relativePath}`);
          } else {
            fs.unlinkSync(fullPath);
            console.log(`  ✓ Removed cache file: ${relativePath}`);
          }
        } catch (error) {
          console.warn(`  ⚠ Could not remove: ${relativePath} - ${error.message}`);
        }
      } else if (entry.isDirectory() && entry.name !== 'cache') {
        // 재귀적으로 검사 (cache 디렉토리는 이미 처리)
        removeCacheFiles(fullPath, relativePath);
      }
    }
  } catch (error) {
    // 디렉토리 읽기 실패는 무시
  }
}

// .next 디렉토리 전체에서 cache 파일 검색 및 삭제
if (fs.existsSync(nextDir)) {
  console.log('  Scanning for cache files...');
  removeCacheFiles(nextDir, '.next');
}

// 큰 파일 검사 및 제거
function removeLargeFiles(dir, basePath = '') {
  if (!fs.existsSync(dir)) return;
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        // cache 디렉토리는 이미 처리했으므로 스킵
        if (entry.name !== 'cache') {
          removeLargeFiles(fullPath, relativePath);
        }
      } else {
        try {
          const stats = fs.statSync(fullPath);
          if (stats.size > MAX_FILE_SIZE) {
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            console.warn(`  ⚠ Large file found: ${relativePath} (${sizeMB} MiB)`);
            
            // cache 관련 파일이면 삭제
            if (fullPath.includes('cache') || fullPath.includes('.pack')) {
              fs.unlinkSync(fullPath);
              console.log(`  ✓ Removed large cache file: ${relativePath}`);
            }
          }
        } catch (error) {
          // 파일 접근 실패는 무시
        }
      }
    }
  } catch (error) {
    // 디렉토리 읽기 실패는 무시
  }
}

if (fs.existsSync(nextDir)) {
  console.log('  Checking for oversized files...');
  removeLargeFiles(nextDir, '.next');
}

console.log('✅ Cache cleanup completed\n');

