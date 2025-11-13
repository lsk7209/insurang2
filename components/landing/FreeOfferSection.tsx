import { Box, Container, Typography, Button, Stack, Card, CardContent } from '@mui/material';
import { memo } from 'react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Component: FreeOfferSection
 * 무료 오퍼 안내 섹션
 * @param {() => void} onCtaClick - CTA 버튼 클릭 핸들러 [Required]
 */
interface Props {
  onCtaClick: () => void;
}

const offerItems = [
  '상담 스크립트',
  'DM 12종',
  '제안서 문장 템플릿',
];

export default memo(function FreeOfferSection({ onCtaClick }: Props) {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <Box
      ref={ref}
      component="section"
      role="region"
      aria-label="무료 오퍼 안내 섹션"
      sx={{
        bgcolor: 'primary.main',
        py: { xs: 8, sm: 10, md: 14 },
        px: { xs: 2, sm: 3, md: 0 },
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={{ xs: 4, sm: 5, md: 6 }} alignItems="center" textAlign="center">
          {/* 제목 */}
          <Typography
            variant="h2"
            component="h2"
            sx={{
              color: 'background.default',
              fontWeight: 700,
              lineHeight: { xs: 1.5, md: 1.4 },
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              maxWidth: { xs: '100%', md: '900px' },
            }}
          >
            지금 가입하면 AI 상담·DM 워크북 무료 제공
          </Typography>

          {/* 설명 */}
          <Typography
            variant="body1"
            sx={{
              color: 'background.default',
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: { xs: 1.8, md: 1.7 },
              maxWidth: { xs: '100%', md: '700px' },
            }}
          >
            실제 영업 현장에서 바로 쓸 수 있는 보험설계사 전용 워크북 제공.
          </Typography>

          {/* 포함 항목 카드 */}
          <Card
            sx={{
              width: '100%',
              maxWidth: { xs: '100%', md: '600px' },
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 6,
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={2}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: 1,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                  }}
                >
                  포함 내용:
                </Typography>
                <Stack spacing={1.5}>
                  {offerItems.map((item, index) => (
                    <Stack key={index} direction="row" spacing={1.5} alignItems="center">
                      <CheckCircleIcon
                        sx={{
                          color: 'success.main',
                          fontSize: { xs: '1.25rem', md: '1.5rem' },
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: { xs: '0.9375rem', md: '1rem' },
                          color: 'text.primary',
                        }}
                      >
                        {item}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>

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
              bgcolor: 'warning.main',
              color: 'text.primary',
              '&:hover': {
                boxShadow: 6,
                bgcolor: 'warning.dark',
              },
            }}
            aria-label="무료 오퍼 받기"
          >
            무료 오퍼 받기
          </Button>
        </Stack>
      </Container>
    </Box>
  );
});

