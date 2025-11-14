'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

/**
 * 404 Not Found Page
 * 페이지를 찾을 수 없을 때 표시되는 페이지
 */
export default function NotFound() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light font-display group/design-root overflow-x-hidden dark:bg-background-dark">
      <Header ctaText="홈으로" onCtaClick={() => window.location.href = '/'} />
      
      <main className="flex-1">
        <section className="relative py-20 sm:py-24 lg:py-32" role="region" aria-label="404 에러 섹션">
          <div className="container mx-auto max-w-5xl px-4 text-center">
            <div className="mx-auto max-w-3xl">
              <h1 className="text-6xl font-black leading-tight tracking-tight text-primary dark:text-white sm:text-7xl lg:text-8xl">
                404
              </h1>
              <h2 className="mt-6 text-3xl font-bold text-text-light dark:text-text-dark sm:text-4xl">
                페이지를 찾을 수 없습니다
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-text-light/70 dark:text-text-dark/70 sm:text-xl">
                요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
              </p>
            </div>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="flex w-full sm:w-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-8 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="홈으로 이동"
              >
                <span className="truncate">홈으로 돌아가기</span>
              </Link>
              <Link
                href="/offer/workbook"
                className="flex w-full sm:w-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-8 bg-cta text-white text-lg font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cta focus:ring-offset-2"
                aria-label="AI 상담 워크북 받기"
              >
                <span className="truncate">AI 상담 워크북 받기</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

