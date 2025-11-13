'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import MainHeroSection from '@/components/landing/MainHeroSection';
import WhyNeededSection from '@/components/landing/WhyNeededSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import BeforeAfterSection from '@/components/landing/BeforeAfterSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import TrustSection from '@/components/landing/TrustSection';
import FreeOfferSection from '@/components/landing/FreeOfferSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import Footer from '@/components/layout/Footer';

/**
 * Main Landing Page
 * 메인페이지 - 보험설계사 대상 AI 마케팅 플랫폼 소개
 */
export default function MainPage() {
  const router = useRouter();

  const handleCtaClick = useCallback(() => {
    // 오퍼 페이지로 스크롤 또는 이동
    const formSection = document.getElementById('application-form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // 오퍼 페이지로 이동
      router.push('/offer/workbook');
    }
  }, [router]);

  const handleOfferCtaClick = useCallback(() => {
    // 오퍼 페이지로 이동
    router.push('/offer/workbook');
  }, [router]);

  return (
    <Box component="main" role="main" position="relative">
      {/* 1. 히어로 섹션 */}
      <MainHeroSection onCtaClick={handleCtaClick} />

      {/* 2. 왜 필요한가 섹션 (페인포인트) */}
      <WhyNeededSection />

      {/* 3. 핵심 기능 섹션 */}
      <FeaturesSection />

      {/* 4. 실제 적용 예시 섹션 (Before → After) */}
      <BeforeAfterSection />

      {/* 5. 결과와 혜택 섹션 */}
      <BenefitsSection />

      {/* 6. 신뢰 섹션 */}
      <TrustSection />

      {/* 7. 무료 오퍼 안내 섹션 */}
      <FreeOfferSection onCtaClick={handleOfferCtaClick} />

      {/* 8. 마무리 CTA 섹션 */}
      <FinalCTASection onCtaClick={handleOfferCtaClick} />

      {/* Footer */}
      <Footer />
    </Box>
  );
}
