import { Box, Container, Typography, Stack, Grid, Card, CardContent } from '@mui/material';
import { memo } from 'react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import AnimatedCard from './AnimatedCard';
import SecurityIcon from '@mui/icons-material/Security';
import SchoolIcon from '@mui/icons-material/School';
import BuildIcon from '@mui/icons-material/Build';

/**
 * Component: TrustSection
 * 신뢰 섹션
 */
const trustPoints = [
  {
    icon: <BuildIcon />,
    title: '퍼널 기반 AI 실무 자동화 프레임',
    description: '보험영업 프로세스에 최적화된 AI 워크플로우',
  },
  {
    icon: <SecurityIcon />,
    title: '보험업 전용 가드레일',
    description: '광고심의 부적합 표현 자동 차단',
  },
  {
    icon: <SchoolIcon />,
    title: '실무자 중심 교육·컨설팅 기반 성장',
    description: '현장 경험을 바탕으로 한 실전 가이드',
  },
];

export default memo(function TrustSection() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <Box
      ref={ref}
      component="section"
      role="region"
      aria-label="신뢰 섹션"
      sx={{
        bgcolor: 'background.default',
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
              lineHeight: { xs: 1.5, md: 1.4 },
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              maxWidth: { xs: '100%', md: '900px' },
              px: { xs: 1, md: 0 },
            }}
          >
            보험 설계사를 위해 설계된 전문 프레임
          </Typography>

          {/* 신뢰 포인트 카드 */}
          <Grid container spacing={{ xs: 3, sm: 4, md: 4 }} sx={{ mt: { xs: 2, md: 4 } }}>
            {trustPoints.map((point, index) => (
              <Grid item xs={12} md={4} key={index}>
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
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Stack spacing={2.5} alignItems="flex-start">
                        <Box
                          sx={{
                            color: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {point.icon}
                        </Box>
                        <Typography
                          variant="h6"
                          component="h3"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1.0625rem', md: '1.125rem' },
                            color: 'text.primary',
                            lineHeight: { xs: 1.6, md: 1.5 },
                          }}
                        >
                          {point.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: { xs: '0.9375rem', md: '1rem' },
                            lineHeight: { xs: 1.7, md: 1.6 },
                            color: 'text.secondary',
                          }}
                        >
                          {point.description}
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

