import { Box, Container, Typography, Stack, Grid, Card, CardContent } from '@mui/material';
import { memo } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import AnimatedCard from './AnimatedCard';

/**
 * Component: ValueSection
 * @example <ValueSection />
 */
const valueItems = [
  '상담 문안 자동화 템플릿 10종',
  '약관 요약 프롬프트',
  '고객응답 DM 문안',
  '실제 사례 기반 수정 가이드',
];

export default memo(function ValueSection() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <Box
      ref={ref}
      component="section"
      role="region"
      aria-label="Value 섹션"
      sx={{
        bgcolor: 'neutral.50',
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
              maxWidth: { xs: '100%', md: '800px' },
              fontWeight: 700,
              lineHeight: { xs: 1.5, md: 1.4 },
              px: { xs: 1, md: 0 },
            }}
          >
            AI 상담 워크북 한 권으로,
            <br />
            당신의 영업 방식이 바뀝니다.
          </Typography>

          {/* 본문 */}
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              textAlign: 'center',
              maxWidth: { xs: '100%', md: '600px' },
              color: 'text.secondary',
              lineHeight: { xs: 1.9, md: 1.8 },
              px: { xs: 1, md: 0 },
            }}
          >
            보험설계사를 위해 설계된 실전형 가이드.
          </Typography>

          {/* 가치 항목 카드 */}
          <Grid 
            container 
            spacing={{ xs: 2, sm: 3, md: 4 }} 
            sx={{ 
              mt: { xs: 3, md: 4 }, 
              maxWidth: '900px',
              width: '100%',
            }}
          >
            {valueItems.map((item, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <AnimatedCard delay={index * 100}>
                  <Card
                    sx={{
                      height: '100%',
                      boxShadow: 2,
                      borderRadius: 2,
                      '&:hover': {
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                      <Stack direction="row" spacing={{ xs: 1.5, md: 2 }} alignItems="flex-start">
                        <CheckCircleIcon
                          sx={{
                            color: 'success.main',
                            fontSize: { xs: '1.5rem', md: '2rem' },
                            flexShrink: 0,
                            mt: { xs: 0.25, md: 0.5 },
                          }}
                        />
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: { xs: '0.9375rem', md: '1rem' },
                            lineHeight: { xs: 1.7, md: 1.6 },
                          }}
                        >
                          {item}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>

          {/* 하단 메시지 */}
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              textAlign: 'center',
              maxWidth: { xs: '100%', md: '700px' },
              color: 'text.primary',
              mt: { xs: 4, md: 6 },
              lineHeight: { xs: 1.9, md: 1.8 },
              px: { xs: 1, md: 0 },
            }}
          >
            AI가 만든 초안에 당신의 경험을 더하세요.
            <br />
            그게 &apos;AI 영업 자동화&apos;의 시작입니다.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
});

