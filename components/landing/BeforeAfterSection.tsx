import { memo, useRef, useEffect, useState } from 'react';

/**
 * Component: BeforeAfterSection
 * 실제 적용 예시 섹션 (Before → After)
 * Tailwind CSS 기반
 */
const examples = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    before: '상담 준비 1–2시간',
    after: 'AI 사용 후: 5분',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    before: 'DM 작성 반복',
    after: 'AI 사용 후: 맞춤형 자동문안',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    before: '약관 설명 어려움',
    after: 'AI 사용 후: 쉬운 요약본 제공',
  },
];

export default memo(function BeforeAfterSection() {
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
      aria-label="실제 적용 예시 섹션"
      className={`bg-white py-16 md:py-20 lg:py-24 px-4 transition-opacity duration-600 ease-out transition-transform duration-600 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center space-y-10 md:space-y-12 lg:space-y-16">
          {/* 제목 */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 text-center leading-tight max-w-5xl px-2 md:px-0 mb-4 md:mb-6 tracking-tight">
            현장에서 바로 체감하는 변화
          </h2>

          {/* Before/After 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full mt-4 md:mt-8">
            {examples.map((example, index) => (
              <div
                key={index}
                className="p-6 md:p-8 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 h-full flex flex-col"
              >
                <div className="flex flex-col items-center space-y-6">
                  {/* 아이콘 */}
                  <div className="text-primary flex items-center text-4xl md:text-5xl mb-2">
                    {example.icon}
                  </div>

                  {/* Before */}
                  <div className="w-full p-4 bg-red-50 rounded-lg text-center border border-red-200">
                    <span className="text-red-800 font-semibold text-xs mb-1 block">기존</span>
                    <p className="text-red-800 font-semibold text-base md:text-lg leading-relaxed">
                      {example.before}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="text-primary transform rotate-90">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>

                  {/* After */}
                  <div className="w-full p-4 bg-green-50 rounded-lg text-center border border-green-200">
                    <span className="text-green-800 font-semibold text-xs mb-1 block">AI 사용 후</span>
                    <p className="text-green-800 font-semibold text-base md:text-lg leading-relaxed">
                      {example.after}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});
