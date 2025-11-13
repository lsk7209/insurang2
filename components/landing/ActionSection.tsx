import { Box, Container, Typography, Stack } from '@mui/material';
import { memo } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

/**
 * Component: ActionSection
 * @example <ActionSection />
 */
export default memo(function ActionSection() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <Box
      ref={ref}
      component="section"
      role="region"
      aria-label="Action 섹션"
      sx={{
        bgcolor: 'primary.main',
        py: { xs: 6, sm: 8, md: 14 },
        px: { xs: 2, sm: 3, md: 0 },
        position: 'relative',
        overflow: 'hidden',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 4, sm: 5, md: 6 }} alignItems="center" textAlign="center">
          {/* 아이콘 */}
          <AccessTimeIcon
            sx={{
              fontSize: { xs: '3.5rem', sm: '4rem', md: '5rem' },
              color: 'warning.main',
            }}
          />

          {/* 헤드라인 */}
          <Typography
            variant="h2"
            component="h2"
            sx={{
              color: 'background.default',
              maxWidth: { xs: '100%', md: '800px' },
              fontWeight: 700,
              lineHeight: { xs: 1.4, md: 1.3 },
              px: { xs: 1, md: 0 },
            }}
          >
            이 워크북, 당신의 하루를 2시간 절약합니다.
          </Typography>

          {/* 서브카피 */}
          <Typography
            variant="h5"
            component="p"
            sx={{
              color: 'background.default',
              maxWidth: { xs: '100%', md: '600px' },
              fontWeight: 400,
              opacity: 0.9,
              lineHeight: { xs: 1.9, md: 1.8 },
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              px: { xs: 1, md: 0 },
            }}
          >
            지금 무료로 워크북을 받고,
            <br />
            내일부터 바로 적용해보세요.
          </Typography>

          {/* 면책 문구 */}
          <Typography
            variant="caption"
            sx={{
              color: 'background.default',
              opacity: 0.7,
              mt: { xs: 2, md: 4 },
              maxWidth: { xs: '100%', md: '700px' },
              lineHeight: { xs: 1.7, md: 1.6 },
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              px: { xs: 2, md: 0 },
            }}
          >
            ※ 본 자료는 AI가 생성한 예시를 포함하며, 실제 약관·상품 내용은 반드시 확인 바랍니다.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
});

