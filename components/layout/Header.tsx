import { memo } from 'react';
import Link from 'next/link';

interface Props {
  onCtaClick?: () => void;
  ctaText?: string;
}

/**
 * Component: Header
 * 헤더 컴포넌트 (스티키 네비게이션)
 * @param {() => void} onCtaClick - CTA 버튼 클릭 핸들러 [Optional]
 * @param {string} ctaText - CTA 버튼 텍스트 [Optional, default="AI 상담 워크북 받기"]
 * @example <Header onCtaClick={() => {}} ctaText="시작하기" />
 */
export default memo(function Header({ onCtaClick, ctaText = 'AI 상담 워크북 받기' }: Props) {
  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      const formSection = document.getElementById('form-section') || document.getElementById('application-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-background-light/80 dark:border-slate-800/80 dark:bg-background-dark/80 backdrop-blur-sm"
      role="banner"
    >
      <div className="container mx-auto max-w-5xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-4 text-primary" aria-label="인슈랑 홈으로 이동">
            <div className="size-5">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <g clipPath="url(#clip0_6_535)">
                  <path
                    clipRule="evenodd"
                    d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z"
                    fill="currentColor"
                    fillRule="evenodd"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_6_535">
                    <rect fill="white" height="48" width="48" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <h2 className="text-xl font-black tracking-tighter font-display">INSURANG</h2>
          </Link>
          <button
            onClick={handleCtaClick}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-cta text-white text-sm font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cta focus:ring-offset-2"
            aria-label={ctaText}
          >
            <span className="truncate">{ctaText}</span>
          </button>
        </div>
      </div>
    </header>
  );
});

