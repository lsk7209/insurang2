'use client';

import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { memo } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Footer from '@/components/layout/Footer';

/**
 * 정적 생성용 파라미터 생성
 * Cloudflare Pages 정적 빌드를 위해 필수
 */
export function generateStaticParams() {
  // 기본 오퍼 슬러그 반환
  return [{ offerSlug: 'workbook' }];
}

/**
 * Thank You Page
 * 신청 완료 감사 페이지
 * @example /offer/workbook/thanks
 */
export default memo(function ThankYouPage() {
  const params = useParams();
  const router = useRouter();
  const offerSlug = params.offerSlug as string;

  return (
    <Box component="main" role="main">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'neutral.50',
        }}
      >
        <Container maxWidth="md" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: { xs: 8, md: 12 } }}>
          <Stack spacing={6} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
            {/* 성공 아이콘 */}
            <CheckCircleIcon
              sx={{
                fontSize: { xs: '5rem', md: '6rem' },
                color: 'success.main',
              }}
            />

            {/* 헤드라인 */}
            <Typography
              variant="h2"
              component="h1"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                lineHeight: { xs: 1.4, md: 1.3 },
              }}
            >
              신청이 완료되었습니다!
            </Typography>

            {/* 안내 메시지 */}
            <Stack spacing={3} sx={{ maxWidth: '600px' }}>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  lineHeight: { xs: 1.9, md: 1.8 },
                  color: 'text.primary',
                }}
              >
                입력하신 이메일로 워크북 다운로드 링크를 보내드렸습니다.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  lineHeight: { xs: 1.9, md: 1.8 },
                  color: 'text.secondary',
                }}
              >
                문자 메시지도 발송되었으니 확인해 주세요.
              </Typography>
            </Stack>

            {/* CTA 버튼 */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => router.push(`/offer/${offerSlug}`)}
                sx={{
                  px: { xs: 4, md: 6 },
                  py: { xs: 2.5, md: 2 },
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  minHeight: { xs: '48px', md: 'auto' },
                }}
              >
                다시 보기
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                href={process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  px: { xs: 4, md: 6 },
                  py: { xs: 2.5, md: 2 },
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  minHeight: { xs: '48px', md: 'auto' },
                }}
              >
                카카오 채널 문의
              </Button>
            </Stack>

            {/* 면책 문구 */}
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                mt: 4,
                maxWidth: '700px',
                lineHeight: { xs: 1.7, md: 1.6 },
                fontSize: { xs: '0.75rem', md: '0.875rem' },
              }}
            >
              ※ 본 자료는 AI가 생성한 예시를 포함하며, 실제 약관·상품 내용은 반드시 확인 바랍니다.
            </Typography>
          </Stack>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
});

