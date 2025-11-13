import { memo, useRef, useEffect, useState } from 'react';

/**
 * Component: FreeOfferSection
 * 무료 오퍼 안내 섹션
 * Tailwind CSS 기반
 * @param {() => void} onCtaClick - CTA 버튼 클릭 핸들러 [Required]
 */
interface Props {
  onCtaClick: () => void;
}

const offerItems = [
  '상담 스크립트',
  'DM 12종',
  '제안서 문장 템플릿',
];

export default memo(function FreeOfferSection({ onCtaClick }: Props) {
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
      aria-label="무료 오퍼 안내 섹션"
      className={`bg-primary py-16 md:py-20 lg:py-24 px-4 transition-opacity duration-600 ease-out transition-transform duration-600 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-8 md:space-y-10 lg:space-y-12">
          {/* 제목 */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight max-w-5xl px-2 md:px-0 mb-4 md:mb-6 tracking-tight">
            지금 가입하면 AI 상담·DM 워크북 무료 제공
          </h2>

          {/* 설명 */}
          <p className="text-lg md:text-xl text-white leading-relaxed max-w-3xl opacity-95 mb-4 md:mb-6">
            실제 영업 현장에서 바로 쓸 수 있는 보험설계사 전용 워크북 제공.
          </p>

          {/* 포함 항목 카드 */}
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 text-left">
                포함 내용:
              </h3>
              <div className="flex flex-col space-y-3">
                {offerItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6 text-green-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-base md:text-lg text-gray-900 leading-relaxed">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA 버튼 */}
          <button
            onClick={onCtaClick}
            aria-label="무료 오퍼 받기"
            className="bg-warning hover:bg-warning-dark text-gray-900 font-bold py-3 md:py-4 px-6 md:px-8 rounded-lg text-base md:text-lg shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary min-h-[48px] md:min-h-[56px] flex items-center gap-2"
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
            무료 오퍼 받기
          </button>
        </div>
      </div>
    </section>
  );
});
