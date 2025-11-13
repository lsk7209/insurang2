import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { memo } from 'react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

/**
 * Component: FinalCTASection
 * 마무리 CTA 섹션
 * @param {() => void} onCtaClick - CTA 버튼 클릭 핸들러 [Required]
 */
interface Props {
  onCtaClick: () => void;
}

export default memo(function FinalCTASection({ onCtaClick }: Props) {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <Box
      ref={ref}
      component="section"
      role="region"
      aria-label="마무리 CTA 섹션"
      sx={{
        bgcolor: 'neutral.50',
        py: { xs: 8, sm: 10, md: 14 },
        px: { xs: 2, sm: 3, md: 0 },
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={{ xs: 4, sm: 5, md: 6 }} alignItems="center" textAlign="center">
          {/* 제목 */}
          <Typography
            variant="h2"
            component="h2"
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              lineHeight: { xs: 1.5, md: 1.4 },
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              maxWidth: { xs: '100%', md: '900px' },
            }}
          >
            이제 AI로 영업 효율을 높이세요
          </Typography>

          {/* 설명 */}
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: { xs: 1.8, md: 1.7 },
              maxWidth: { xs: '100%', md: '700px' },
            }}
          >
            설계사의 시간은 고객에게 쓰여야 합니다.
            <br />
            나머지는 AI가 대신합니다.
          </Typography>

          {/* CTA 버튼 */}
          <Button
            variant="contained"
            color="warning"
            size="large"
            onClick={onCtaClick}
            startIcon={<AutoAwesomeIcon />}
            sx={{
              px: { xs: 4, md: 6 },
              py: { xs: 2.5, md: 2.5 },
              fontSize: { xs: '1rem', md: '1.125rem' },
              minHeight: { xs: '48px', md: '56px' },
              fontWeight: 700,
              borderRadius: 2,
              boxShadow: 4,
              '&:hover': {
                boxShadow: 6,
              },
            }}
            aria-label="무료로 시작하기"
          >
            무료로 시작하기
          </Button>
        </Stack>
      </Container>
    </Box>
  );
});

