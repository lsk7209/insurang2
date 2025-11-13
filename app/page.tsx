import { redirect } from 'next/navigation';

/**
 * Root Landing Page
 * 기본 오퍼(workbook)로 서버 사이드 리다이렉트
 * output: 'export'를 사용하므로 정적 리다이렉트 사용
 */
export default function LandingPage() {
  // 정적 빌드에서 리다이렉트는 클라이언트에서 처리
  redirect('/offer/workbook');
}

