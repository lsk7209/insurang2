import { useEffect, useRef, useState } from 'react';

/**
 * Hook: useScrollAnimation
 * 스크롤 시 요소가 뷰포트에 들어올 때 애니메이션 트리거
 * @param {IntersectionObserverInit} options - IntersectionObserver 옵션 [Optional]
 * @returns {[React.RefObject<HTMLElement>, boolean]} [ref, isVisible]
 * @example
 * const [ref, isVisible] = useScrollAnimation({ threshold: 0.1 });
 * <Box ref={ref} sx={{ opacity: isVisible ? 1 : 0 }}>Content</Box>
 */
export function useScrollAnimation(options?: IntersectionObserverInit) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // 한 번만 트리거되도록 옵저버 해제
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [options]);

  return [ref, isVisible] as const;
}

