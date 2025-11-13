import { Box, Container, Typography, Stack, Grid, Card, CardContent } from '@mui/material';
import { memo, useMemo } from 'react';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

/**
 * Component: ProofSection
 * @example <ProofSection />
 */
const testimonials = [
  '이제 상담 준비가 두 배 빨라졌어요.',
  'AI가 제 파트너가 됐습니다.',
  '팀에서 공유하니 문서 품질이 눈에 띄게 올라갔어요.',
];

const stats = [
  { label: '누적 참여자', value: '1,200명' },
  { label: '만족도', value: '94%' },
  { label: '평균 상담준비시간 단축', value: '2.1시간' },
];

export default memo(function ProofSection() {
  const [ref, isVisible] = useScrollAnimation();
  const testimonialCards = useMemo(
    () =>
      testimonials.map((testimonial, index) => (
        <Grid item xs={12} md={4} key={index}>
          <Card
            sx={{
              height: '100%',
              boxShadow: 2,
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={{ xs: 2, md: 3 }}>
                <FormatQuoteIcon
                  sx={{
                    color: 'primary.main',
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    opacity: 0.3,
                  }}
                />
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: { xs: '1rem', md: '1.125rem' }, 
                    lineHeight: { xs: 2.1, md: 2 },
                  }}
                >
                  &quot;{testimonial}&quot;
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )),
    []
  );

  return (
    <Box
      ref={ref}
      component="section"
      role="region"
      aria-label="Proof 섹션"
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
        <Stack spacing={{ xs: 5, sm: 6, md: 8 }} alignItems="center">
          {/* 소제목 */}
          <Typography
            variant="h3"
            component="h2"
            sx={{
              color: 'text.primary',
              textAlign: 'center',
              maxWidth: { xs: '100%', md: '700px' },
              fontWeight: 700,
              lineHeight: { xs: 1.5, md: 1.4 },
              px: { xs: 1, md: 0 },
            }}
          >
            같은 고민, 이미 해결한 설계사들의 이야기
          </Typography>

          {/* 후기 슬라이드 */}
          <Grid 
            container 
            spacing={{ xs: 2, sm: 3, md: 4 }} 
            sx={{ 
              mt: { xs: 3, md: 4 }, 
              width: '100%' 
            }}
          >
            {testimonialCards}
          </Grid>

          {/* 데이터 근거 */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 2, sm: 3, md: 4 }}
            sx={{
              mt: { xs: 5, sm: 6, md: 8 },
              width: '100%',
              maxWidth: '900px',
            }}
          >
            {stats.map((stat, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  textAlign: 'center',
                  p: { xs: 2.5, md: 3 },
                  bgcolor: 'neutral.50',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h4"
                  component="div"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 700,
                    mb: 1,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
});

