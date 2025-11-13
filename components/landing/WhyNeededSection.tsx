import { Box, Container, Typography, Stack, Grid } from '@mui/material';
import { memo } from 'react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MessageIcon from '@mui/icons-material/Message';
import DescriptionIcon from '@mui/icons-material/Description';
import CampaignIcon from '@mui/icons-material/Campaign';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Component: WhyNeededSection
 * 왜 필요한가 섹션 (페인포인트 → 해결 제시)
 */
export default memo(function WhyNeededSection() {
  const [ref, isVisible] = useScrollAnimation();

  const painPoints = [
    {
      icon: <AccessTimeIcon />,
      text: '상담 준비에 매번 1시간씩 걸린다',
    },
    {
      icon: <MessageIcon />,
      text: 'DM 문안이 매번 비슷하고 반응이 낮다',
    },
    {
      icon: <DescriptionIcon />,
      text: '약관·상품 설명을 고객 눈높이로 쉽게 바꾸기 어렵다',
    },
    {
      icon: <CampaignIcon />,
      text: '콘텐츠·홍보가 필요하지만 시간 여유가 없다',
    },
  ];

  return (
    <Box
      ref={ref}
      component="section"
      role="region"
      aria-label="왜 필요한가 섹션"
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
            보험영업, 더 이상 혼자서 모든 걸 할 필요는 없습니다
          </Typography>

          {/* 페인포인트 리스트 */}
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mt: { xs: 2, md: 4 } }}>
            {painPoints.map((point, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    bgcolor: 'neutral.50',
                    borderRadius: 2,
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        color: 'warning.main',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {point.icon}
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { xs: '0.9375rem', md: '1.0625rem' },
                        lineHeight: { xs: 1.7, md: 1.6 },
                        color: 'text.primary',
                        fontWeight: 500,
                      }}
                    >
                      {point.text}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* 해결 메시지 */}
          <Box
            sx={{
              mt: { xs: 4, md: 6 },
              p: { xs: 3, md: 4 },
              bgcolor: 'primary.main',
              borderRadius: 3,
              maxWidth: { xs: '100%', md: '800px' },
              width: '100%',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <CheckCircleIcon
                sx={{
                  color: 'warning.main',
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  color: 'background.default',
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  lineHeight: { xs: 1.7, md: 1.6 },
                  fontWeight: 600,
                }}
              >
                이 모든 업무를 AI가 초안으로 만들어주면,
                <br />
                설계사는 핵심 대화·상담에만 집중할 수 있습니다.
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
});

