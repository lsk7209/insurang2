'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeroSection from '@/components/landing/HeroSection';
import PainSection from '@/components/landing/PainSection';
import ValueSection from '@/components/landing/ValueSection';
import ProofSection from '@/components/landing/ProofSection';
import ActionSection from '@/components/landing/ActionSection';
import ApplicationFormSection from '@/components/landing/ApplicationFormSection';
import Footer from '@/components/layout/Footer';
import { Box, CircularProgress } from '@mui/material';

/**
 * Workbook Offer Landing Page
 * 정적 경로: /offer/workbook
 * Steps: 1) 폼 제출 → 2) API 호출 → 3) 감사 페이지 이동
 */
export default function WorkbookOfferPage() {
  const router = useRouter();
  const offerSlug = 'workbook';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCtaClick = useCallback(() => {
    const formSection = document.getElementById('application-form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleFormSubmit = useCallback(
    async (formData: {
      name: string;
      email: string;
      phone: string;
      consent_privacy: boolean;
      consent_marketing: boolean;
    }) => {
      setIsSubmitting(true);

      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            offer_slug: offerSlug,
            ...formData,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // 감사 페이지로 이동
          // 약간의 지연을 두어 사용자에게 성공 피드백 제공
          await new Promise((resolve) => setTimeout(resolve, 500));
          router.push(`/offer/workbook/thanks`);
        } else {
          // 에러 메시지 표시
          const errorMessage = result.error || '신청 처리 중 오류가 발생했습니다.';
          alert(errorMessage);
          setIsSubmitting(false);
          throw new Error(errorMessage); // ApplicationFormSection에서 에러 처리하도록
        }
      } catch (error) {
        console.error('Form submission error:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        alert(`신청 처리 중 오류가 발생했습니다: ${errorMessage}\n\n잠시 후 다시 시도해주세요.`);
        setIsSubmitting(false);
        throw error; // ApplicationFormSection에서 에러 상태를 유지하도록
      }
    },
    [offerSlug, router]
  );

  return (
    <Box component="main" role="main" position="relative">
      {isSubmitting && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Box component="p" sx={{ color: 'text.primary', m: 0 }}>
              신청 처리 중...
            </Box>
          </Box>
        </Box>
      )}

      <HeroSection onCtaClick={handleCtaClick} />
      <PainSection />
      <ValueSection />
      <ProofSection />
      <Box id="action-section">
        <ActionSection />
      </Box>
      <Box id="application-form-section">
        <ApplicationFormSection onSubmit={handleFormSubmit} />
      </Box>
      <Footer />
    </Box>
  );
}

