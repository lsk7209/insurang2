import { Box, Container, Typography, Stack, Grid, Card, CardContent } from '@mui/material';
import { memo } from 'react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MessageIcon from '@mui/icons-material/Message';
import DescriptionIcon from '@mui/icons-material/Description';

/**
 * Component: BeforeAfterSection
 * 실제 적용 예시 섹션 (Before → After)
 */
const examples = [
  {
    icon: <AccessTimeIcon />,
    before: '상담 준비 1–2시간',
    after: 'AI 사용 후: 5분',
  },
  {
    icon: <MessageIcon />,
    before: 'DM 작성 반복',
    after: 'AI 사용 후: 맞춤형 자동문안',
  },
  {
    icon: <DescriptionIcon />,
    before: '약관 설명 어려움',
    after: 'AI 사용 후: 쉬운 요약본 제공',
  },
];

export default memo(function BeforeAfterSection() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <Box
      ref={ref}
      component="section"
      role="region"
      aria-label="실제 적용 예시 섹션"
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
              lineHeight: { xs: 1.6, md: 1.5 },
              fontSize: { xs: '1.875rem', sm: '2.5rem', md: '3rem' },
              maxWidth: { xs: '100%', md: '1000px' },
              px: { xs: 1, md: 0 },
              mb: { xs: 2, md: 3 },
              letterSpacing: '-0.01em',
            }}
          >
            현장에서 바로 체감하는 변화
          </Typography>

          {/* Before/After 카드 */}
          <Grid container spacing={{ xs: 3, sm: 4, md: 4 }} sx={{ mt: { xs: 2, md: 4 } }}>
            {examples.map((example, index) => (
              <Grid item xs={12} md={4} key={index}>
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
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Stack spacing={3} alignItems="center">
                      <Box
                        sx={{
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: { xs: '2.5rem', md: '3rem' },
                          mb: 1,
                          '& svg': {
                            fontSize: { xs: '2.5rem', md: '3rem' },
                          },
                        }}
                      >
                        {example.icon}
                      </Box>

                      {/* Before */}
                      <Box
                        sx={{
                          width: '100%',
                          p: 2,
                          bgcolor: 'error.light',
                          borderRadius: 2,
                          textAlign: 'center',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'error.dark',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            mb: 0.5,
                            display: 'block',
                          }}
                        >
                          기존
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'error.dark',
                            fontWeight: 600,
                            fontSize: { xs: '1rem', md: '1.0625rem' },
                            lineHeight: { xs: 1.7, md: 1.6 },
                          }}
                        >
                          {example.before}
                        </Typography>
                      </Box>

                      {/* Arrow */}
                      <Box
                        sx={{
                          color: 'primary.main',
                          transform: 'rotate(90deg)',
                        }}
                      >
                        <AutoAwesomeIcon />
                      </Box>

                      {/* After */}
                      <Box
                        sx={{
                          width: '100%',
                          p: 2,
                          bgcolor: 'success.light',
                          borderRadius: 2,
                          textAlign: 'center',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'success.dark',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            mb: 0.5,
                            display: 'block',
                          }}
                        >
                          AI 사용 후
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'success.dark',
                            fontWeight: 600,
                            fontSize: { xs: '1rem', md: '1.0625rem' },
                            lineHeight: { xs: 1.7, md: 1.6 },
                          }}
                        >
                          {example.after}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
});

