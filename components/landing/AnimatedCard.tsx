import { Card, CardContent, Box } from '@mui/material';
import { memo, ReactNode } from 'react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

/**
 * Component: AnimatedCard
 * 스크롤 애니메이션이 적용된 카드 컴포넌트
 * @param {ReactNode} children - 카드 내용 [Required]
 * @param {number} delay - 애니메이션 지연 시간 (ms) [Optional, default=0]
 * @example <AnimatedCard delay={100}>Content</AnimatedCard>
 */
interface Props {
  children: ReactNode;
  delay?: number;
}

export default memo(function AnimatedCard({ children, delay = 0 }: Props) {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <Box
      ref={ref}
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease-out ${delay}ms, transform 0.5s ease-out ${delay}ms`,
      }}
    >
      {children}
    </Box>
  );
});

