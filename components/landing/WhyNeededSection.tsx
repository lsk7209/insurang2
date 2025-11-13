import { memo, useRef, useEffect, useState } from 'react';

/**
 * Component: WhyNeededSection
 * 왜 필요한가 섹션 (페인포인트 → 해결 제시)
 * Tailwind CSS 기반
 */
export default memo(function WhyNeededSection() {
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

  const painPoints = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: '상담 준비에 매번 1시간씩 걸린다',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      text: 'DM 문안이 매번 비슷하고 반응이 낮다',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      text: '약관·상품 설명을 고객 눈높이로 쉽게 바꾸기 어렵다',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      text: '콘텐츠·홍보가 필요하지만 시간 여유가 없다',
    },
  ];

  return (
    <section
      ref={ref}
      role="region"
      aria-label="왜 필요한가 섹션"
      className={`bg-white py-16 md:py-20 lg:py-24 px-4 transition-opacity duration-600 ease-out transition-transform duration-600 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 md:mb-8 leading-tight">
            보험영업, 더 이상 혼자서 모든 걸 할 필요는 없습니다
          </h2>
        </div>

        {/* 페인포인트 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                {point.icon}
              </div>
              <p className="text-lg md:text-xl text-gray-900 font-medium leading-relaxed flex-1">
                {point.text}
              </p>
            </div>
          ))}
        </div>

        {/* 해결 메시지 */}
        <div className="bg-gradient-to-r from-primary/10 to-warning/10 rounded-2xl p-8 md:p-12 text-center border border-primary/20">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-8 h-8 md:w-10 md:h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 leading-relaxed max-w-4xl mx-auto">
            이 모든 업무를 AI가 초안으로 만들어주면, 설계사는{' '}
            <span className="text-primary">핵심 대화·상담에만 집중</span>할 수 있습니다.
          </p>
        </div>
      </div>
    </section>
  );
});
