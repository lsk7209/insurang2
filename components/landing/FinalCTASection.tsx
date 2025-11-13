import { memo, useRef, useEffect, useState } from 'react';

/**
 * Component: FinalCTASection
 * 마무리 CTA 섹션
 * Tailwind CSS 기반
 * @param {() => void} onCtaClick - CTA 버튼 클릭 핸들러 [Required]
 */
interface Props {
  onCtaClick: () => void;
}

export default memo(function FinalCTASection({ onCtaClick }: Props) {
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
      aria-label="마무리 CTA 섹션"
      className={`bg-gray-50 py-16 md:py-20 lg:py-24 px-4 transition-opacity duration-600 ease-out transition-transform duration-600 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-8 md:space-y-10 lg:space-y-12">
          {/* 제목 */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight max-w-5xl px-2 md:px-0 mb-4 md:mb-6 tracking-tight">
            이제 AI로 영업 효율을 높이세요
          </h2>

          {/* 설명 */}
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mb-4 md:mb-6">
            설계사의 시간은 고객에게 쓰여야 합니다.
            <br />
            나머지는 AI가 대신합니다.
          </p>

          {/* CTA 버튼 */}
          <button
            onClick={onCtaClick}
            aria-label="무료로 시작하기"
            className="bg-warning hover:bg-warning-dark text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded-lg text-base md:text-lg shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[48px] md:min-h-[56px] flex items-center gap-2"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            무료로 시작하기
          </button>
        </div>
      </div>
    </section>
  );
});
