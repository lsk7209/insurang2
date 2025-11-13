/**
 * Cloudflare Pages 배포 후 검증 스크립트
 * .next 디렉토리의 파일 크기를 검사하고 25 MiB 제한을 준수하는지 확인합니다.
 */

const fs = require('fs');
const path = require('path');

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MiB
const nextDir = path.join(process.cwd(), '.next');

/**
 * 디렉토리 내의 모든 파일을 재귀적으로 검사
 */
function checkFileSizes(dir, basePath = '') {
  const issues = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        // cache 디렉토리는 이미 삭제되었어야 함
        if (entry.name === 'cache') {
          if (fs.existsSync(fullPath)) {
            issues.push({
              type: 'error',
              path: relativePath,
              message: 'Cache directory should be removed before deployment',
            });
          }
        } else {
          // 재귀적으로 검사
          issues.push(...checkFileSizes(fullPath, relativePath));
        }
      } else {
        // 파일 크기 검사
        const stats = fs.statSync(fullPath);
        if (stats.size > MAX_FILE_SIZE) {
          issues.push({
            type: 'error',
            path: relativePath,
            size: stats.size,
            sizeMB: (stats.size / 1024 / 1024).toFixed(2),
            message: `File exceeds 25 MiB limit: ${(stats.size / 1024 / 1024).toFixed(2)} MiB`,
          });
        } else if (stats.size > 10 * 1024 * 1024) {
          // 10 MiB 이상이면 경고
          issues.push({
            type: 'warning',
            path: relativePath,
            size: stats.size,
            sizeMB: (stats.size / 1024 / 1024).toFixed(2),
            message: `Large file detected: ${(stats.size / 1024 / 1024).toFixed(2)} MiB`,
          });
        }
      }
    }
  } catch (error) {
    // 디렉토리 읽기 실패는 무시
  }
  
  return issues;
}

// 검사 실행
if (fs.existsSync(nextDir)) {
  console.log('Checking .next directory for file size compliance...');
  const issues = checkFileSizes(nextDir, '.next');
  
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  
  if (warnings.length > 0) {
    console.log('\n⚠ Warnings:');
    warnings.forEach(w => {
      console.log(`  - ${w.path}: ${w.message}`);
    });
  }
  
  if (errors.length > 0) {
    console.error('\n❌ Errors found:');
    errors.forEach(e => {
      console.error(`  - ${e.path}: ${e.message}`);
    });
    console.error('\nBuild validation failed. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('✓ All files are within size limits');
  }
} else {
  console.log('⚠ .next directory not found. Build may have failed.');
  process.exit(1);
}

