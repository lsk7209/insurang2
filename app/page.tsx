'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root Landing Page
 * 기본 오퍼(workbook)로 리다이렉트
 */
export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // 기본 오퍼로 리다이렉트
    router.replace('/offer/workbook');
  }, [router]);

  return null;
}

