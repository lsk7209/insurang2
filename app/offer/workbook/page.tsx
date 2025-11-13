'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Workbook Offer Landing Page Redirect
 * 정적 경로: /offer/workbook
 * 동적 라우팅 /offer/[offerSlug]로 리다이렉트
 */
export default function WorkbookOfferPage() {
  const router = useRouter();

  useEffect(() => {
    // 동적 라우팅으로 리다이렉트
    router.replace('/offer/workbook');
  }, [router]);

  // 리다이렉트 중 로딩 표시
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" aria-label="로딩 중"></div>
        <p className="text-gray-600" aria-live="polite">페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}
