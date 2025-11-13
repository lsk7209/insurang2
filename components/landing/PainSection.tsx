import { Box, Container, Typography, Stack, Grid } from '@mui/material';
import { memo } from 'react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import WorkOffIcon from '@mui/icons-material/WorkOff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

/**
 * Component: PainSection
 * @example <PainSection />
 */
export default memo(function PainSection() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <Box
      ref={ref}
      component="section"
      role="region"
      aria-label="Pain 섹션"
      sx={{
        bgcolor: 'background.default',
        py: { xs: 6, sm: 8, md: 14 },
        px: { xs: 2, sm: 3, md: 0 },
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          {/* 이미지 영역 */}
          <Grid item xs={12} md={5} order={{ xs: 2, md: 1 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: { xs: '200px', sm: '250px', md: '400px' },
                mt: { xs: 3, md: 0 },
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: { xs: '100%', sm: '350px', md: '400px' },
                  height: { xs: '250px', sm: '300px', md: '350px' },
                  bgcolor: 'neutral.100',
                  borderRadius: { xs: 3, md: 4 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: { xs: 2, md: 3 },
                  position: 'relative',
                  boxShadow: { xs: 3, md: 4 },
                }}
              >
                <WorkOffIcon
                  sx={{
                    fontSize: { xs: '4rem', sm: '5rem', md: '6rem' },
                    color: 'text.secondary',
                    opacity: 0.6,
                  }}
                />
                <AccessTimeIcon
                  sx={{
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                    color: 'warning.main',
                    position: 'absolute',
                    top: { xs: '10%', md: '15%' },
                    right: { xs: '5%', md: '10%' },
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: { xs: '15%', md: '20%' },
                    left: { xs: '5%', md: '10%' },
                    right: { xs: '5%', md: '10%' },
                    height: { xs: '25%', md: '30%' },
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 2,
                    px: 1,
                  }}
                >
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    textAlign="center"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' } }}
                  >
                    상담 준비에<br />3시간 소요
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* 텍스트 영역 */}
          <Grid item xs={12} md={7} order={{ xs: 1, md: 2 }}>
            <Stack spacing={{ xs: 3, sm: 4, md: 5 }} textAlign={{ xs: 'center', md: 'left' }}>
              {/* 소제목 */}
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  color: 'text.primary',
                  fontWeight: 700,
                  lineHeight: { xs: 1.5, md: 1.4 },
                  px: { xs: 1, md: 0 },
                }}
              >
                하루 3시간, 상담 준비에 묶여 있지 않나요?
              </Typography>

              {/* 본문 */}
              <Stack spacing={{ xs: 2, md: 3 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: { xs: '1rem', md: '1.125rem' }, 
                    lineHeight: { xs: 2.1, md: 2 },
                    px: { xs: 1, md: 0 },
                  }}
                >
                  어제도 문안 다듬느라 야근,
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: { xs: '1rem', md: '1.125rem' }, 
                    lineHeight: { xs: 2.1, md: 2 },
                    px: { xs: 1, md: 0 },
                  }}
                >
                  오늘도 약관 문장 때문에 멈췄죠.
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: { xs: '1rem', md: '1.125rem' }, 
                    lineHeight: { xs: 2.1, md: 2 },
                    mt: { xs: 1, md: 2 },
                    px: { xs: 1, md: 0 },
                  }}
                >
                  AI를 써야 한다는 건 알지만,
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: { xs: '1rem', md: '1.125rem' }, 
                    lineHeight: { xs: 2.1, md: 2 },
                    px: { xs: 1, md: 0 },
                  }}
                >
                  어디서부터 시작해야 할지 막막하셨죠?
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
});

