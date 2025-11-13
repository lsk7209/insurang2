import { Box, Container, Typography, Stack, Grid, Card, CardContent } from '@mui/material';
import { memo } from 'react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import AnimatedCard from './AnimatedCard';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import PeopleIcon from '@mui/icons-material/People';

/**
 * Component: BenefitsSection
 * 결과와 혜택 섹션
 */
const benefits = [
  {
    icon: <TrendingDownIcon />,
    title: '상담준비 시간 40% 절감',
    color: 'success',
  },
  {
    icon: <TrendingUpIcon />,
    title: 'DM 응답률 평균 20%p 증가',
    color: 'primary',
  },
  {
    icon: <SpeedIcon />,
    title: '제안서 제작 시간 반으로 단축',
    color: 'warning',
  },
  {
    icon: <PeopleIcon />,
    title: '영업에 쓰는 시간을 고객 접점에 재투자',
    color: 'info',
  },
];

export default memo(function BenefitsSection() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <Box
      ref={ref}
      component="section"
      role="region"
      aria-label="결과와 혜택 섹션"
      sx={{
        bgcolor: 'neutral.50',
        py: { xs: 8, sm: 10, md: 14 },
        px: { xs: 2, sm: 3, md: 0 },
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={{ xs: 5, sm: 6, md: 8 }} alignItems="center">
          {/* 제목 */}
          <Typography
            variant="h2"
            component="h2"
            sx={{
              color: 'text.primary',
              textAlign: 'center',
              fontWeight: 700,
              lineHeight: { xs: 1.6, md: 1.5 },
              fontSize: { xs: '1.875rem', sm: '2.5rem', md: '3rem' },
              maxWidth: { xs: '100%', md: '1000px' },
              px: { xs: 1, md: 0 },
              mb: { xs: 2, md: 3 },
              letterSpacing: '-0.01em',
            }}
          >
            AI가 가져오는 실질적 변화
          </Typography>

          {/* 혜택 카드 그리드 */}
          <Grid container spacing={{ xs: 3, sm: 4, md: 4 }} sx={{ mt: { xs: 2, md: 4 } }}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <AnimatedCard delay={index * 100}>
                  <Card
                    sx={{
                      height: '100%',
                      boxShadow: 3,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-4px)',
                        borderColor: `${benefit.color}.main`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 3.5, md: 4.5 } }}>
                      <Stack spacing={2.5} alignItems="center" textAlign="center">
                        <Box
                          sx={{
                            color: `${benefit.color}.main`,
                            display: 'flex',
                            alignItems: 'center',
                            mb: 0.5,
                            fontSize: { xs: '2.5rem', md: '3rem' },
                            '& svg': {
                              fontSize: { xs: '2.5rem', md: '3rem' },
                            },
                          }}
                        >
                          {benefit.icon}
                        </Box>
                        <Typography
                          variant="h6"
                          component="h3"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: '1.0625rem', md: '1.1875rem' },
                            color: 'text.primary',
                            lineHeight: { xs: 1.7, md: 1.6 },
                          }}
                        >
                          {benefit.title}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
});

