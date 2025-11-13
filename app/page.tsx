import { redirect } from 'next/navigation';

/**
 * Root Landing Page
 * 기본 오퍼(workbook)로 서버 사이드 리다이렉트
 */
export default function LandingPage() {
  // 서버 사이드에서 리다이렉트 (SSR)
  redirect('/offer/workbook');
}

