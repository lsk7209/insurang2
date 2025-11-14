import { memo } from 'react';

/**
 * Component: Footer
 * 푸터 컴포넌트
 * Tailwind CSS 기반
 * @example <Footer />
 */
export default memo(function Footer() {
  return (
    <footer
      role="contentinfo"
      className="w-full max-w-7xl py-10 border-t border-subtle-light dark:border-subtle-dark mt-10 px-6 sm:px-10 mx-auto"
    >
      <div className="text-center text-sm text-text-light/50 dark:text-text-dark/50">
        <p>© 2024 INSURANG. All Rights Reserved.</p>
        <p className="mt-2">INSURANG Inc. | 서울특별시 강남구 테헤란로 123</p>
      </div>
    </footer>
  );
});
