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
      className="bg-gray-900 text-gray-100 py-8"
    >
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-sm text-center opacity-80">
          © 2025 INSURANG. All rights reserved.
        </p>
      </div>
    </footer>
  );
});
