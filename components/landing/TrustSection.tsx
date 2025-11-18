import { memo, useRef, useEffect, useState } from 'react';

/**
 * Component: TrustSection
 * 신뢰 섹션
 * Tailwind CSS 기반
 */
const trustPoints = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: '퍼널 기반 AI 실무 자동화 프레임',
    description: '보험영업 프로세스에 최적화된 AI 워크플로우',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: '보험업 전용 가드레일',
    description: '광고심의 부적합 표현 자동 차단',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: '실무자 중심 교육·컨설팅 기반 성장',
    description: '현장 경험을 바탕으로 한 실전 가이드',
  },
];

export default memo(function TrustSection() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <section
      ref={ref}
      role="region"
      aria-label="신뢰 섹션"
      className={`bg-white py-16 md:py-20 lg:py-24 px-4 transition-opacity duration-600 ease-out transition-transform duration-600 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center space-y-10 md:space-y-12 lg:space-y-16">
          {/* 제목 */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 text-center leading-tight max-w-5xl px-2 md:px-0 mb-4 md:mb-6 tracking-tight">
            왜 인슈랑을 선택해야 할까요?
          </h2>

          {/* 신뢰 포인트 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full mt-4 md:mt-8">
            {trustPoints.map((point, index) => (
              <div
                key={index}
                className="p-6 md:p-8 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 h-full flex flex-col"
              >
                <div className="flex flex-col items-start space-y-4">
                  <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-2">
                    {point.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                    {point.title}
                  </h3>
                  <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});
