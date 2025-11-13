'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

/**
 * Root Landing Page
 * 기본 오퍼(workbook)로 클라이언트 사이드 리다이렉트
 * Cloudflare Pages에서 서버 사이드 리다이렉트가 작동하지 않을 수 있으므로
 * 클라이언트 사이드 리다이렉트 사용
 */
export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // 기본 오퍼로 리다이렉트
    router.replace('/offer/workbook');
  }, [router]);

  // 리다이렉트 중 로딩 표시
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

