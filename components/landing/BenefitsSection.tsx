import { memo, useRef, useEffect, useState } from 'react';

/**
 * Component: BenefitsSection
 * 결과와 혜택 섹션
 * Tailwind CSS 기반
 */
const benefits = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    title: '상담준비 시간 40% 절감',
    color: 'green',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: 'DM 응답률 평균 20%p 증가',
    color: 'blue',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: '제안서 제작 시간 반으로 단축',
    color: 'orange',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: '영업에 쓰는 시간을 고객 접점에 재투자',
    color: 'indigo',
  },
];

const colorClasses = {
  green: 'text-green-600 border-green-200 hover:border-green-400',
  blue: 'text-blue-600 border-blue-200 hover:border-blue-400',
  orange: 'text-orange-600 border-orange-200 hover:border-orange-400',
  indigo: 'text-indigo-600 border-indigo-200 hover:border-indigo-400',
};

export default memo(function BenefitsSection() {
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
      aria-label="결과와 혜택 섹션"
      className={`bg-gray-50 py-16 md:py-20 lg:py-24 px-4 transition-opacity duration-600 ease-out transition-transform duration-600 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center space-y-10 md:space-y-12 lg:space-y-16">
          {/* 제목 */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 text-center leading-tight max-w-5xl px-2 md:px-0 mb-4 md:mb-6 tracking-tight">
            AI가 가져오는 실질적 변화
          </h2>

          {/* 혜택 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 w-full mt-4 md:mt-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`p-6 md:p-8 bg-white rounded-xl border-2 transition-all duration-300 h-full flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-1 ${colorClasses[benefit.color as keyof typeof colorClasses]}`}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className={`${colorClasses[benefit.color as keyof typeof colorClasses].split(' ')[0]} flex items-center text-4xl md:text-5xl mb-2`}>
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 leading-relaxed">
                    {benefit.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});
