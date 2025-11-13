import { memo } from 'react';

/**
 * Component: MainHeroSection
 * 메인페이지 히어로 섹션
 * Tailwind CSS 기반
 * @param {() => void} onCtaClick - CTA 버튼 클릭 핸들러 [Required]
 */
interface Props {
  onCtaClick: () => void;
}

export default memo(function MainHeroSection({ onCtaClick }: Props) {
  return (
    <section
      role="region"
      aria-label="Hero 섹션"
      className="bg-gray-50 py-16 md:py-20 lg:py-24 px-4 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-8 md:space-y-10 lg:space-y-12">
          {/* 메인 제목 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight max-w-5xl px-2 md:px-0 mb-6 md:mb-8 tracking-tight">
            당신의 영업 시간을{' '}
            <span className="text-warning inline-block">절반으로 줄이는</span>
            <br />
            AI 보조설계 플랫폼
          </h1>

          {/* 부제 */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-900 font-medium leading-relaxed max-w-4xl px-2 md:px-0 mb-4 md:mb-6">
            상담 준비, DM 작성, 제안서 초안을{' '}
            <span className="text-primary font-bold">3분 안에 완성</span>
            하는 새로운 업무 방식
          </p>

          {/* 주요 설명 */}
          <p className="text-base md:text-xl text-gray-600 max-w-3xl leading-relaxed px-2 md:px-0 mb-6 md:mb-8">
            복잡한 입력 없이, 현장에서 바로 쓰는 보험설계사 전용 ChatGPT 자동화 도구.
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

          {/* 시각적 요소 */}
          <div className="w-full max-w-full sm:max-w-[500px] md:max-w-[600px] h-[250px] sm:h-[300px] md:h-[350px] mt-8 md:mt-12 relative">
            <div className="w-full h-full bg-primary rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-4 md:gap-6 relative overflow-hidden shadow-lg md:shadow-xl">
              {/* 노트북 아이콘 */}
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-warning opacity-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>

              {/* AI 아이콘 (애니메이션) */}
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white absolute top-[15%] md:top-[20%] right-[10%] md:right-[15%] animate-pulse"
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
