import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'INSURANG - AI 상담 워크북 무료 제공',
  description: 'AI가 상담 준비를 대신합니다. 하루 2시간을 돌려받는 설계사의 비밀, 지금 무료 워크북으로 직접 확인하세요.',
};

/**
 * Root Layout
 * Tailwind CSS 기반
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

