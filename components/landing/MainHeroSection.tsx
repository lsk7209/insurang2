import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { memo } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';

/**
 * Component: MainHeroSection
 * 메인페이지 히어로 섹션
 * @param {() => void} onCtaClick - CTA 버튼 클릭 핸들러 [Required]
 */
interface Props {
  onCtaClick: () => void;
}

export default memo(function MainHeroSection({ onCtaClick }: Props) {
  return (
    <Box
      component="section"
      role="region"
      aria-label="Hero 섹션"
      sx={{
        bgcolor: 'neutral.50',
        py: { xs: 8, sm: 10, md: 16 },
        px: { xs: 2, sm: 3, md: 0 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 4, sm: 5, md: 6 }} alignItems="center" textAlign="center">
          {/* 메인 제목 */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              lineHeight: { xs: 1.4, md: 1.3 },
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
              maxWidth: { xs: '100%', md: '900px' },
              px: { xs: 1, md: 0 },
            }}
          >
            당신의 영업 시간을{' '}
            <Box component="span" sx={{ color: 'warning.main' }}>
              절반으로 줄이는
            </Box>
            <br />
            AI 보조설계 플랫폼
          </Typography>

          {/* 부제 */}
          <Typography
            variant="h5"
            component="p"
            sx={{
              color: 'text.secondary',
              fontWeight: 400,
              lineHeight: { xs: 1.9, md: 1.8 },
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.375rem' },
              maxWidth: { xs: '100%', md: '800px' },
              px: { xs: 1, md: 0 },
            }}
          >
            상담 준비, DM 작성, 제안서 초안을{' '}
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
              3분 안에 완성
            </Box>
            하는 새로운 업무 방식
          </Typography>

          {/* 주요 설명 */}
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.9375rem', md: '1.125rem' },
              maxWidth: { xs: '100%', md: '700px' },
              lineHeight: { xs: 1.8, md: 1.7 },
              px: { xs: 1, md: 0 },
            }}
          >
            복잡한 입력 없이, 현장에서 바로 쓰는 보험설계사 전용 ChatGPT 자동화 도구.
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

          {/* 시각적 요소 */}
          <Box
            sx={{
              width: '100%',
              maxWidth: { xs: '100%', sm: '500px', md: '600px' },
              height: { xs: '250px', sm: '300px', md: '350px' },
              mt: { xs: 4, md: 6 },
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                bgcolor: 'primary.main',
                borderRadius: { xs: 3, md: 4 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: { xs: 2, md: 3 },
                position: 'relative',
                overflow: 'hidden',
                boxShadow: { xs: 4, md: 8 },
              }}
            >
              <LaptopMacIcon
                sx={{
                  fontSize: { xs: '4rem', sm: '5rem', md: '6rem' },
                  color: 'warning.main',
                  opacity: 0.9,
                }}
              />
              <AutoAwesomeIcon
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  color: 'background.default',
                  position: 'absolute',
                  top: { xs: '15%', md: '20%' },
                  right: { xs: '10%', md: '15%' },
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 0.8, transform: 'scale(1)' },
                    '50%': { opacity: 1, transform: 'scale(1.1)' },
                  },
                }}
              />
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
});

