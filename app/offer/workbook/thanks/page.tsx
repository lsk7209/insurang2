'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trackPageView, trackFunnelEvent } from '@/lib/utils/tracking';
import Header from '@/components/layout/Header';

/**
 * Workbook Thank You Page
 * 정적 경로: /offer/workbook/thanks
 * 동적 라우팅과 동일한 내용을 직접 렌더링
 */
export default function WorkbookThankYouPage() {
  const router = useRouter();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // 페이지뷰 및 감사 페이지 도달 추적
  useEffect(() => {
    trackPageView('/offer/workbook/thanks', 'workbook');
    trackFunnelEvent('thank_you', '/offer/workbook/thanks', 'workbook');
  }, []);

  const handleCopy = useCallback(
    async (text: string, index: number) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    },
    []
  );

  const examples = [
    {
      title: '즉시 신뢰를 구축하는 문장',
      text: '"오늘 제 목표는 무언가를 판매하는 것이 아니라, 고객님께서 가족을 위한 최선의 결정을 내리실 수 있도록 명확한 정보를 제공하는 것입니다."',
    },
    {
      title: '우아하게 거절에 대처하는 문장',
      text: '"정말 타당한 고민이십니다. 그 부분은 잠시 접어두고, 이 플랜이 고객님의 필요를 충족하는지 먼저 확인해 보시죠. 그렇지 않다면 가격은 무의미하니까요."',
    },
    {
      title: '긴급성을 자연스럽게 만드는 문장',
      text: '"이 보장을 확보하기 가장 좋은 때는 어제였습니다. 다음으로 좋은 때는 바로 지금, 건강하시고 가장 저렴한 보험료로 가입할 수 있는 순간입니다."',
    },
  ];

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light font-display group/design-root overflow-x-hidden dark:bg-background-dark">
      <Header 
        ctaText="홈으로" 
        onCtaClick={() => {
          try {
            router.push('/');
          } catch (error) {
            window.location.href = '/';
          }
        }} 
      />

      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-10 lg:px-20 flex flex-1 justify-center py-5 sm:py-10">
          <div className="layout-content-container flex flex-col w-full max-w-4xl flex-1">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row flex-wrap justify-between items-center gap-8 p-4 text-center md:text-left">
              <div className="flex flex-col gap-3 max-w-lg">
                <h1 className="text-primary dark:text-white text-4xl lg:text-5xl font-black leading-tight tracking-tighter">
                  오퍼 신청이 완료되었습니다!
                </h1>
                <p className="text-accent dark:text-gray-300 text-base lg:text-lg font-normal leading-normal">
                  신청해 주셔서 감사합니다. 워크북을 이메일로 발송했습니다. 성공에 도움이 될 인사이트로 가득 차 있으니, 지금 바로 확인해 보세요!
                </p>
              </div>
              <div className="relative w-full max-w-[280px] md:max-w-[240px] lg:max-w-[300px] aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-primary/30 rounded-full blur-2xl" aria-hidden="true"></div>
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute top-1/4 left-1/4 w-20 h-14 bg-gray-200 dark:bg-gray-600 rounded-lg shadow-md -rotate-12 opacity-50" aria-hidden="true"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-24 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg shadow-md rotate-15 opacity-50" aria-hidden="true"></div>
                  <div className="absolute top-[30%] right-[15%] w-16 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg shadow-sm rotate-6 opacity-40" aria-hidden="true"></div>
                  <div className="absolute bottom-[20%] left-[10%] w-20 h-14 bg-gray-200 dark:bg-gray-600 rounded-lg shadow-sm -rotate-20 opacity-40" aria-hidden="true"></div>
                  <div className="relative z-10 w-40 h-28 bg-white dark:bg-gray-100 rounded-xl shadow-2xl flex items-center justify-center scale-110">
                    <div className="absolute -inset-2 bg-cta rounded-xl blur-xl opacity-60" aria-hidden="true"></div>
                    <div className="relative w-full h-full p-2">
                      <div className="w-full h-full border-2 border-cta rounded-lg flex items-center justify-center">
                        <svg className="w-12 h-12 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 z-20" aria-hidden="true">
                    <svg className="w-20 h-20 text-primary dark:text-white" fill="currentColor" viewBox="0 0 100 100">
                      <path d="M78.2,34.8c-1.3-4.3-4.2-7.8-8.1-9.8c-3.9-2-8.3-2.5-12.6-1.5c-4.3,1-8.1,3.4-10.8,6.8c-2.7,3.4-4.2,7.7-4.2,12.2v10.1c0,2.8-1.1,5.4-3.1,7.4c-2,2-4.6,3.1-7.4,3.1H25c-2.8,0-5,2.2-5,5s2.2,5,5,5h6.9c4.2,0,8.2-1.7,11.2-4.7c3-3,4.7-7,4.7-11.2V52.6c0-3.3,1-6.5,2.9-9.1c1.9-2.6,4.6-4.4,7.7-5.2c3.1-0.8,6.3-0.5,9.2,0.8c2.9,1.3,5.3,3.6,6.7,6.5c1.4,2.9,1.8,6.2,1,9.3c-0.8,3.1-2.6,5.8-5.2,7.7c-2.6,1.9-5.8,2.9-9.1,2.9h-5.8c-2.8,0-5,2.2-5,5s2.2,5,5,5h5.8c4.8,0,9.5-1.5,13.4-4.3c3.9-2.8,6.8-6.8,8.3-11.4c1.5-4.6,1.5-9.6-0.1-14.2S82.4,38.3,78.2,34.8z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </header>

            {/* Workbook Preview Section */}
            <section className="mt-12 md:mt-20" role="region" aria-label="워크북 맛보기 섹션">
              <h2 className="text-primary dark:text-white text-2xl lg:text-3xl font-bold leading-tight tracking-tight px-4 pb-4 pt-5 text-center">
                워크북 맛보기: 바로 쓰는 문장 예시
              </h2>
              <div className="grid grid-cols-1 gap-6 p-4">
                {examples.map((example, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-stretch justify-start rounded-xl shadow-lg bg-white dark:bg-background-dark"
                  >
                    <div className="flex flex-col items-stretch justify-center gap-2 py-6 px-6">
                      <p className="text-primary dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                        {example.title}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <p className="text-accent dark:text-gray-300 text-base font-normal leading-normal flex-1">{example.text}</p>
                        <button
                          onClick={() => handleCopy(example.text, index)}
                          className="flex min-w-[100px] w-full sm:w-auto cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary hover:bg-opacity-90 text-white text-sm font-medium leading-normal gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          aria-label={`${example.title} 복사하기`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            {copiedIndex === index ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            )}
                          </svg>
                          <span className="truncate">{copiedIndex === index ? '복사됨' : '복사하기'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Philosophy Section */}
            <section className="mt-12 md:mt-20 p-4" role="region" aria-label="철학 섹션">
              <div className="bg-white dark:bg-background-dark rounded-xl shadow-lg p-8 lg:p-12 text-center flex flex-col items-center">
                <h2 className="text-primary dark:text-white text-2xl lg:text-3xl font-bold leading-tight tracking-tight mb-6">우리의 철학</h2>
                <blockquote className="max-w-3xl">
                  <p className="text-accent dark:text-gray-300 text-lg lg:text-xl font-normal leading-relaxed italic">
                    "우리는 진정성 있는 연결이 이 비즈니스의 핵심이라고 믿습니다. 우리의 미션은 설계사님들이 단순히 계약을 체결하는 것이 아니라, 지속적인 신뢰를 구축하는 도구와 언어를 갖추도록 돕는 것입니다. 성공은 진심을 따릅니다."
                  </p>
                </blockquote>
                <div className="flex items-center gap-4 mt-8">
                  <img
                    className="h-14 w-14 rounded-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCulAqYhExfux59O2bSxBh0PBurA-6WS9flX1XVEAY_sIKvUo2Hc8-Ywsks4IKavjdPZLHqyU_xphLn6tJQ5e_e0Jb65Q1wt8mCZjwgiwWQ2xgYkYTimcEizxFb0bBg42Yox1YfsvFg2zoq4QlFFi5-U5bf7oWwn5RYhhVTlrhs0uMDgy1iKOxR4nQNciKdHxzxTqDCsUbggt7waMFNemWxAiYpgp_ZWkpOBpV2sy3ZbVoyv8mDhTotubM9y-qT4xwEQGCiaEzvGLF"
                    alt="INSURANG 대표 프로필 사진"
                  />
                  <div>
                    <p className="text-primary dark:text-white font-bold">김지훈</p>
                    <p className="text-accent dark:text-gray-300 text-sm">INSURANG 대표</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Next Steps Section */}
            <section className="mt-12 md:mt-20 text-center" role="region" aria-label="다음 단계 섹션">
              <h2 className="text-primary dark:text-white text-2xl lg:text-3xl font-bold leading-tight tracking-tight px-4 pb-6 pt-5">다음 단계는?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                <Link
                  href="/"
                  className="flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-cta hover:bg-opacity-90 text-primary text-base font-bold leading-normal transition-colors focus:outline-none focus:ring-2 focus:ring-cta focus:ring-offset-2"
                >
                  <span className="truncate">설계사 인사이트 읽기</span>
                </Link>
                <Link
                  href="/"
                  className="flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-cta hover:bg-opacity-90 text-primary text-base font-bold leading-normal transition-colors focus:outline-none focus:ring-2 focus:ring-cta focus:ring-offset-2"
                >
                  <span className="truncate">성공 사례 둘러보기</span>
                </Link>
                <Link
                  href="/"
                  className="flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-cta hover:bg-opacity-90 text-primary text-base font-bold leading-normal transition-colors focus:outline-none focus:ring-2 focus:ring-cta focus:ring-offset-2"
                >
                  <span className="truncate">블로그 방문하기</span>
                </Link>
              </div>
            </section>

            {/* Footer */}
            <footer className="mt-12 md:mt-20 border-t border-gray-200 dark:border-gray-700 pt-8 pb-4 px-4 text-center" role="contentinfo">
              <p className="text-accent dark:text-gray-400 text-base mb-6">
                신뢰받는 조언자로의 여정이 지금 시작됩니다. 인슈랑이 그 여정에 함께하게 되어 기쁩니다.
              </p>
              <div className="flex justify-center gap-6 text-sm text-primary dark:text-gray-300">
                <Link href="#" className="hover:underline">
                  개인정보 처리방침
                </Link>
                <Link href="#" className="hover:underline">
                  문의하기
                </Link>
                <span>© 2024 INSURANG</span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
