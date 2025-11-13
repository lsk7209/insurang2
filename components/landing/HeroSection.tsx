import { Box, Container, Typography, Button, Stack, Grid } from '@mui/material';
import { memo } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';

/**
 * Component: HeroSection
 * @param {() => void} onCtaClick - CTA 버튼 클릭 핸들러 [Required]
 * @example <HeroSection onCtaClick={() => console.log('CTA clicked')} />
 */
interface Props {
  onCtaClick: () => void;
}

export default memo(function HeroSection({ onCtaClick }: Props) {
  return (
    <Box
      component="section"
      role="region"
      aria-label="Hero 섹션"
      sx={{
        bgcolor: 'neutral.50',
        py: { xs: 6, sm: 8, md: 16 },
        px: { xs: 2, sm: 3, md: 0 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          {/* 텍스트 영역 */}
          <Grid item xs={12} md={6}>
            <Stack spacing={{ xs: 3, sm: 4, md: 5 }} textAlign={{ xs: 'center', md: 'left' }}>
              {/* 헤드라인 */}
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  lineHeight: { xs: 1.4, md: 1.3 },
                  px: { xs: 1, md: 0 },
                }}
              >
                상담 준비, 하루가 아닌{' '}
                <Box component="span" sx={{ color: 'warning.main' }}>
                  '1분'
                </Box>
                이면 충분합니다.
              </Typography>

              {/* 서브카피 */}
              <Typography
                variant="h5"
                component="p"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 400,
                  lineHeight: { xs: 1.9, md: 1.8 },
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                  px: { xs: 1, md: 0 },
                }}
              >
                AI가 상담문안·약관요약·DM 초안을 대신 만듭니다.
                <br />
                이제 당신은 '고객과의 대화'에만 집중하세요.
              </Typography>

              {/* 보조포인트 */}
              <Stack spacing={{ xs: 1.5, md: 2 }}>
                <Box
                  sx={{
                    px: { xs: 2, md: 3 },
                    py: { xs: 1.5, md: 2 },
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 2,
                  }}
                >
                  <Typography 
                    variant="h6" 
                    color="primary.main"
                    sx={{ fontSize: { xs: '0.9375rem', md: '1rem' } }}
                  >
                    상담준비시간 40% 절감
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: { xs: 2, md: 3 },
                    py: { xs: 1.5, md: 2 },
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 2,
                  }}
                >
                  <Typography 
                    variant="h6" 
                    color="success.main"
                    sx={{ fontSize: { xs: '0.9375rem', md: '1rem' } }}
                  >
                    문안 품질 20% 향상
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: { xs: 2, md: 3 },
                    py: { xs: 1.5, md: 2 },
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 2,
                  }}
                >
                  <Typography 
                    variant="h6" 
                    color="info.main"
                    sx={{ fontSize: { xs: '0.9375rem', md: '1rem' } }}
                  >
                    실제 현장 적용률 80% 이상
                  </Typography>
                </Box>
              </Stack>

              {/* CTA 버튼 */}
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={onCtaClick}
                fullWidth={{ xs: true, md: false }}
                sx={{
                  px: { xs: 4, md: 6 },
                  py: { xs: 2.5, md: 2 },
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  minHeight: { xs: '48px', md: 'auto' },
                  alignSelf: { xs: 'stretch', md: 'flex-start' },
                  mt: { xs: 1, md: 0 },
                }}
                aria-label="AI 상담워크북 무료로 받기"
              >
                AI 상담워크북 무료로 받기
              </Button>
            </Stack>
          </Grid>

          {/* 이미지 영역 */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: { xs: '250px', sm: '300px', md: '500px' },
                mt: { xs: 2, md: 0 },
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: { xs: '100%', sm: '450px', md: '500px' },
                  height: { xs: '280px', sm: '350px', md: '400px' },
                  bgcolor: 'primary.main',
                  borderRadius: { xs: 3, md: 4 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: { xs: 2, md: 3 },
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: { xs: 4, md: 6 },
                }}
              >
                <LaptopMacIcon
                  sx={{
                    fontSize: { xs: '5rem', sm: '6rem', md: '8rem' },
                    color: 'warning.main',
                    opacity: 0.9,
                  }}
                />
                <AutoAwesomeIcon
                  sx={{
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
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
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: { xs: '35%', md: '40%' },
                    bgcolor: 'background.paper',
                    borderRadius: { xs: '12px 12px 0 0', md: '16px 16px 0 0' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography 
                    variant="h6" 
                    color="primary.main" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                    }}
                  >
                    AI 상담 워크북
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
});

