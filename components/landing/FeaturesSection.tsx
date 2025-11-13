import { Box, Container, Typography, Stack, Grid, Card, CardContent } from '@mui/material';
import { memo } from 'react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import AnimatedCard from './AnimatedCard';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DescriptionIcon from '@mui/icons-material/Description';
import MessageIcon from '@mui/icons-material/Message';
import SummarizeIcon from '@mui/icons-material/Summarize';

/**
 * Component: FeaturesSection
 * 핵심 기능 섹션
 */
const features = [
  {
    icon: <AutoFixHighIcon />,
    title: '상담 준비 자동화',
    description: '고객 시나리오 요약, 상담 흐름, 질문리스트 생성',
  },
  {
    icon: <DescriptionIcon />,
    title: '제안서 초안 생성',
    description: '상품 비교표, 가입근거 문장, 이해하기 쉬운 요약',
  },
  {
    icon: <MessageIcon />,
    title: 'DM·문자·SNS 카피',
    description: '응답률을 높이는 문장 자동 구성',
  },
  {
    icon: <SummarizeIcon />,
    title: '약관 핵심요약',
    description: '고객 친화적 설명문 자동 생성',
  },
];

export default memo(function FeaturesSection() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <Box
      ref={ref}
      component="section"
      role="region"
      aria-label="핵심 기능 섹션"
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
              lineHeight: { xs: 1.5, md: 1.4 },
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              maxWidth: { xs: '100%', md: '900px' },
              px: { xs: 1, md: 0 },
            }}
          >
            설계사의 시간을 돌려주는 실무 중심 기능
          </Typography>

          {/* 기능 카드 그리드 */}
          <Grid container spacing={{ xs: 3, sm: 4, md: 4 }} sx={{ mt: { xs: 2, md: 4 } }}>
            {features.map((feature, index) => (
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
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Stack spacing={{ xs: 2, md: 2.5 }} alignItems="flex-start">
                        <Box
                          sx={{
                            color: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {feature.icon}
                        </Box>
                        <Typography
                          variant="h6"
                          component="h3"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1.125rem', md: '1.25rem' },
                            color: 'text.primary',
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: { xs: '0.9375rem', md: '1rem' },
                            lineHeight: { xs: 1.7, md: 1.6 },
                            color: 'text.secondary',
                          }}
                        >
                          {feature.description}
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

