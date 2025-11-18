'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { validateLeadForm, normalizePhone } from '@/lib/utils/validation';
import { trackPageView, trackFunnelEvent } from '@/lib/utils/tracking';
import Header from '@/components/layout/Header';

interface OfferData {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  download_link: string | null;
  // 신청 페이지 콘텐츠
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_badge_text: string | null;
  hero_cta_text: string | null;
  hero_background_image: string | null;
  hero_stats_text: string | null;
  preview_title: string | null;
  preview_subtitle: string | null;
  preview_image: string | null;
  preview_features: string | null;
  value_title: string | null;
  value_subtitle: string | null;
  value_cards: string | null;
  trust_title: string | null;
  trust_subtitle: string | null;
  testimonials: string | null;
  form_title: string | null;
  form_subtitle: string | null;
  form_badge_text: string | null;
  form_description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Offer Landing Page
 * 동적 라우팅: /offer/[offerSlug]
 * Tailwind CSS 기반
 */
export default function OfferLandingPage() {
  const router = useRouter();
  const params = useParams();
  const offerSlug = params?.offerSlug as string;
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [isLoadingOffer, setIsLoadingOffer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    consent_privacy: false,
    consent_marketing: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleCtaClick = useCallback(() => {
    const formSection = document.getElementById('application-form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = useCallback((value: string): string => {
    const numbers = normalizePhone(value);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }, []);

  // 폼 검증 (중앙화된 validation 함수 사용)
  const validateForm = useCallback((): boolean => {
    const validation = validateLeadForm({
      offer_slug: offerSlug,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      organization: formData.organization || null,
      consent_privacy: formData.consent_privacy,
      consent_marketing: formData.consent_marketing,
    });

    setErrors(validation.errors);
    return validation.valid;
  }, [formData, offerSlug]);

  const handleChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const isCheckbox = field === 'consent_privacy' || field === 'consent_marketing';
    const value = isCheckbox ? e.target.checked : e.target.value;

    // 폼 시작 이벤트 추적 (첫 입력 시)
    if (!formData.name && !formData.email && !formData.phone && (field === 'name' || field === 'email' || field === 'phone')) {
      trackFunnelEvent('form_start', `/offer/${offerSlug}`, offerSlug);
    }

    if (field === 'phone' && typeof value === 'string') {
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, [field]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }, [errors, formatPhoneNumber, formData, offerSlug]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneNumbers = normalizePhone(formData.phone);
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_slug: offerSlug,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: phoneNumbers,
          organization: formData.organization.trim() || null,
          consent_privacy: formData.consent_privacy,
          consent_marketing: formData.consent_marketing,
        }),
      });

      // HTTP 상태 코드 확인
      if (!response.ok) {
        let errorMessage = '신청 처리 중 오류가 발생했습니다.';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 상태 코드 기반 메시지
          if (response.status === 400) {
            errorMessage = '입력 정보를 확인해주세요.';
          } else if (response.status === 429) {
            errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
          } else if (response.status >= 500) {
            errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          }
        }
        alert(errorMessage);
        setIsSubmitting(false);
        return;
      }

      // 성공 응답 파싱
      let result;
      try {
        result = await response.json();
        console.log(`[Offer Page] API Response for ${offerSlug}:`, result);
      } catch (parseError) {
        console.error(`[Offer Page] JSON parse error for ${offerSlug}:`, parseError);
        alert('응답 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }

      if (result.success) {
        console.log(`[Offer Page] Form submission successful for ${offerSlug}, redirecting to thanks page...`);
        
        // 퍼널 이벤트 추적
        const leadId = result.data?.leadId;
        trackFunnelEvent('form_submit', `/offer/${offerSlug}`, offerSlug, leadId);
        
        // 정적 빌드 환경에서도 안정적으로 작동하도록 window.location 사용
        await new Promise((resolve) => setTimeout(resolve, 500));
        try {
          router.push(`/offer/${offerSlug}/thanks`);
        } catch (routerError) {
          console.warn(`[Offer Page] router.push failed for ${offerSlug}, using window.location:`, routerError);
          window.location.href = `/offer/${offerSlug}/thanks`;
        }
      } else {
        const errorMessage = result.error || '신청 처리 중 오류가 발생했습니다.';
        console.error(`[Offer Page] API returned success: false for ${offerSlug}`, { error: errorMessage, result });
        alert(errorMessage);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`신청 처리 중 오류가 발생했습니다: ${errorMessage}\n\n잠시 후 다시 시도해주세요.`);
      setIsSubmitting(false);
    }
  };

  // 오퍼 데이터 로드
  // 페이지뷰 추적
  useEffect(() => {
    if (offerSlug) {
      trackPageView(`/offer/${offerSlug}`, offerSlug);
    }
  }, [offerSlug]);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        setIsLoadingOffer(true);
        const response = await fetch(`/api/offers?slug=${encodeURIComponent(offerSlug)}`);
        const result = await response.json();

        if (result.success && result.data) {
          setOfferData(result.data);
        } else {
          // 오퍼를 찾을 수 없으면 기본값 사용
          console.warn('Offer not found, using default values');
        }
      } catch (error) {
        console.error('Failed to fetch offer:', error);
        // 에러 발생 시 기본값 사용
      } finally {
        setIsLoadingOffer(false);
      }
    };

    if (offerSlug) {
      fetchOffer();
    }

  }, [offerSlug]);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-display">
      {/* Header */}
      <Header onCtaClick={handleCtaClick} ctaText="AI 상담 워크북 받기" />

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="loading-title">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true"></div>
            <p id="loading-title" className="text-gray-900 font-medium">신청 처리 중...</p>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* Section 1: Hero */}
        <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden" role="region" aria-label="히어로 섹션">
          {/* 그라데이션 배경 */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 dark:from-primary/10 dark:via-accent/10 dark:to-primary/20" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-cover bg-center opacity-5 dark:opacity-3"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA4yagbPVTg-Qkmjqg8im1y7hpZmmkqHQq0KXQt09GN6q_UuwcESTvdRzp8_M1kcKfrgpt78PBQs45bj76iA5lMErTdRmlUpTpFKIzYTP8oOLhHJTMlOOndejFPoXbUBNd1ozj53PKcStyZN2YnN9Dm4MCbM9tpu2mcF0dr3dmeMxFvKYuZNAIy9D_MIP26Wweav9o_j1lWKBYfCn7I0c5_j15kUPHh-XtHtjf9B4EbnEO1qXa-Jn6FqlRnWwIlw1xoN7LQE6QeJ2NV")',
            }}
            aria-hidden="true"
          />
          <div className="relative container mx-auto max-w-5xl px-4 text-center">
            {isLoadingOffer ? (
              <div className="py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" aria-label="로딩 중"></div>
                <p className="text-text-light dark:text-text-dark" aria-live="polite">로딩 중...</p>
              </div>
            ) : (
              <>
                <div className="mx-auto max-w-4xl">
                  {/* 배지 */}
                  {offerData?.hero_badge_text && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 mb-6">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-bold text-primary">{offerData.hero_badge_text}</span>
                    </div>
                  )}
                  
                  <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-primary dark:text-white sm:text-5xl lg:text-7xl mb-6">
                    {offerData?.hero_title ? (
                      <span className="block">{offerData.hero_title}</span>
                    ) : (
                      <>
                        <span className="block mb-2">상담 성공률을</span>
                        <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">2배로 높이는</span>
                        <span className="block mt-2">AI 워크북</span>
                      </>
                    )}
                  </h1>
                  {offerData?.hero_subtitle && (
                    <p className="mt-6 text-lg sm:text-xl lg:text-2xl leading-relaxed text-text-light/90 dark:text-text-dark/90 font-medium max-w-2xl mx-auto">
                      {offerData.hero_subtitle}
                    </p>
                  )}
                  
                  {/* 통계 배지 */}
                  {offerData?.hero_stats_text && (() => {
                    try {
                      const stats = JSON.parse(offerData.hero_stats_text);
                      return (
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
                          {stats.downloads && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true"></div>
                              <span className="text-text-light/80 dark:text-text-dark/80">{stats.downloads}</span>
                            </div>
                          )}
                          {stats.rating && (
                            <div className="hidden sm:flex items-center gap-2">
                              <span className="text-text-light/60 dark:text-text-dark/60">•</span>
                              <span className="text-text-light/80 dark:text-text-dark/80">{stats.rating}</span>
                            </div>
                          )}
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
                <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <button
                    onClick={handleCtaClick}
                    className="group relative flex w-full sm:w-auto min-w-[280px] cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl h-16 px-10 bg-gradient-to-r from-primary to-accent text-white text-lg font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="AI 상담 워크북 무료로 받기"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {offerData?.hero_cta_text || '지금 바로 무료로 받기'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
                  </button>
                  <p className="text-base text-text-light/60 dark:text-text-dark/60">
                    <span className="hidden sm:inline">신용카드 불필요 · </span>30초면 완료
                  </p>
                </div>
                <div className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-text-light/70 dark:text-text-dark/70" aria-hidden="true">
                  <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section 2: Offer Preview */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-background-dark/50" role="region" aria-label="오퍼 미리보기 섹션">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-primary dark:text-white sm:text-4xl">
                {offerData?.preview_title || 'AI 상담 워크북, 이런 내용을 담았습니다'}
              </h2>
              {offerData?.preview_subtitle && (
                <p className="mt-4 max-w-2xl mx-auto text-base text-text-light/80 dark:text-text-dark/80">
                  {offerData.preview_subtitle}
                </p>
              )}
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
              <div className="w-full h-auto aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
                <div
                  className="w-full h-full bg-center bg-no-repeat bg-cover"
                  style={{
                    backgroundImage: offerData?.preview_image
                      ? `url("${offerData.preview_image}")`
                      : 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuApdcnBuidW2a8iye1uLx_TLeOi0L-CKTAQ5CHI-QLQi66MEKUUPeN5B0oT7btyuRG8Jc9-r6tWj6fZWb8rX6bjiRzJk-LKaEdEj_z5RmhoYAtdBvz0SRtyFOkp3uLRhNsjebOOntzGGKA49tRkiL97Tp2t27cuogPUVAPLCXWIAgDNMHAxeiQFV-ezvde9mPMvgOOIdOqK34zSLpAUnEQmFOQpnPZ63ullzYlDlIEc2PRonJZrbHzq_Bl2gJ2PQnkiCcyTjw-Fvj5p")',
                  }}
                  aria-label="워크북 샘플 페이지"
                />
              </div>
              <div className="flex flex-col gap-4 text-left">
                {offerData?.preview_features ? (() => {
                  try {
                    const features = JSON.parse(offerData.preview_features);
                    if (Array.isArray(features) && features.length > 0) {
                      return features.map((feature: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-4">
                          {feature.icon && (
                            <div className="flex-shrink-0 text-accent" dangerouslySetInnerHTML={{ __html: feature.icon }} />
                          )}
                          <div>
                            {feature.title && (
                              <h3 className="text-lg font-bold text-primary dark:text-white">{feature.title}</h3>
                            )}
                            {feature.description && (
                              <p className="mt-1 text-base text-text-light/80 dark:text-text-dark/80">
                                {feature.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ));
                    }
                  } catch {
                    // JSON 파싱 실패 시 기본값 사용
                  }
                  return null;
                })() : (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 text-accent">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-primary dark:text-white">고객 유형별 심리 분석 및 접근법</h3>
                        <p className="mt-1 text-base text-text-light/80 dark:text-text-dark/80">
                          분석형, 우호형 등 4가지 고객 유형을 파악하고 마음을 여는 대화 전략을 제시합니다.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 text-accent">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-primary dark:text-white">상담 단계별 필수 질문 체크리스트</h3>
                        <p className="mt-1 text-base text-text-light/80 dark:text-text-dark/80">
                          상담의 흐름을 주도하고 고객의 핵심 니즈를 정확히 파악하는 질문들로 구성되어 있습니다.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 text-accent">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-primary dark:text-white">거절에 대응하는 반론 화법 5가지</h3>
                        <p className="mt-1 text-base text-text-light/80 dark:text-text-dark/80">
                          고객의 거절을 기회로 바꾸는 데이터 기반의 설득 논리와 클로징 팁을 제공합니다.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Value Section */}
        <section className="py-16 sm:py-20 lg:py-24" role="region" aria-label="가치 섹션">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-primary dark:text-white sm:text-4xl">
                {offerData?.value_title || '워크북 하나로 당신의 상담이 달라집니다'}
              </h2>
              {offerData?.value_subtitle && (
                <p className="mt-4 text-base text-text-light/80 dark:text-text-dark/80">
                  {offerData.value_subtitle}
                </p>
              )}
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {offerData?.value_cards ? (() => {
                try {
                  const cards = JSON.parse(offerData.value_cards);
                  if (Array.isArray(cards) && cards.length > 0) {
                    return cards.map((card: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-background-dark/50 p-6 text-center transition-transform hover:scale-105 hover:shadow-xl"
                      >
                        {card.icon && (
                          <div className="mx-auto text-accent" dangerouslySetInnerHTML={{ __html: card.icon }} />
                        )}
                        {card.title && (
                          <h3 className="text-lg font-bold text-primary dark:text-white">{card.title}</h3>
                        )}
                        {card.description && (
                          <p className="text-base text-text-light/80 dark:text-text-dark/80">{card.description}</p>
                        )}
                      </div>
                    ));
                  }
                } catch {
                  // JSON 파싱 실패 시 기본값 사용
                }
                return null;
              })() : (
                [
                  {
                    icon: (
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    title: '상담 시간 50% 단축',
                    desc: 'AI가 분석한 핵심 질문으로 불필요한 과정을 없애고 상담의 질을 높입니다.',
                  },
                  {
                    icon: (
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    title: '고객 만족도 30% 상승',
                    desc: '고객 유형별 맞춤 응대 전략으로 모든 고객에게 최고의 경험을 선사합니다.',
                  },
                  {
                    icon: (
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ),
                    title: '계약 성공률 2배 증가',
                    desc: '데이터 기반의 설득 논리로 고객의 최종 결정을 이끌어내는 클로징 팁을 제공합니다.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-background-dark/50 p-6 text-center transition-transform hover:scale-105 hover:shadow-xl"
                  >
                    <div className="mx-auto text-accent">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-primary dark:text-white">{item.title}</h3>
                    <p className="text-base text-text-light/80 dark:text-text-dark/80">{item.desc}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Trust Section */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-background-dark/50" role="region" aria-label="신뢰 섹션">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-primary dark:text-white sm:text-4xl">
                {offerData?.trust_title || '먼저 경험한 설계사들의 생생한 후기'}
              </h2>
              {offerData?.trust_subtitle && (
                <p className="mt-4 text-base text-text-light/80 dark:text-text-dark/80">
                  {offerData.trust_subtitle}
                </p>
              )}
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {offerData?.testimonials ? (() => {
                try {
                  const testimonials = JSON.parse(offerData.testimonials);
                  if (Array.isArray(testimonials) && testimonials.length > 0) {
                    return testimonials.map((testimonial: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-background-light dark:border-slate-800 dark:bg-background-dark p-6"
                      >
                        <div className="flex items-center gap-4">
                          {testimonial.image && (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={testimonial.image}
                              alt={`${testimonial.name || '고객'} 프로필 사진`}
                            />
                          )}
                          <div>
                            {testimonial.name && (
                              <p className="font-bold text-primary dark:text-white">{testimonial.name}</p>
                            )}
                            {testimonial.company && (
                              <p className="text-sm text-text-light/60 dark:text-text-dark/60">{testimonial.company}</p>
                            )}
                          </div>
                        </div>
                        {testimonial.review && (
                          <p className="mt-4 text-base text-text-light/80 dark:text-text-dark/80 italic">{testimonial.review}</p>
                        )}
                      </div>
                    ));
                  }
                } catch {
                  // JSON 파싱 실패 시 기본값 사용
                }
                return null;
              })() : (
                [
                  {
                    name: '김민준 설계사',
                    company: 'AIA생명',
                    image:
                      'https://randomuser.me/api/portraits/men/32.jpg',
                    review:
                      '"매번 상담 준비에만 몇 시간을 썼는데, 워크북 덕분에 핵심만 짚어 상담할 수 있게 됐어요. 고객 반응부터 달라졌습니다."',
                  },
                  {
                    name: '이서연 설계사',
                    company: '메리츠화재',
                    image:
                      'https://randomuser.me/api/portraits/women/44.jpg',
                    review:
                      '"신입이라 상담이 막막했는데, 워크북이 훌륭한 멘토가 되어주었습니다. 특히 거절 대응 파트가 정말 큰 도움이 됐어요."',
                  },
                  {
                    name: '박지훈 팀장',
                    company: 'DB손해보험',
                    image:
                      'https://randomuser.me/api/portraits/men/28.jpg',
                    review:
                      '"팀원 교육 자료로 활용하고 있습니다. 체계적인 내용 덕분에 팀 전체의 상담 능력이 상향 평준화되었습니다."',
                  },
                ].map((testimonial, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-background-light dark:border-slate-800 dark:bg-background-dark p-6"
                >
                  <div className="flex items-center gap-4">
                    <img
                      className="h-12 w-12 rounded-full object-cover"
                      src={testimonial.image}
                      alt={`${testimonial.name} 프로필 사진`}
                    />
                    <div>
                      <p className="font-bold text-primary dark:text-white">{testimonial.name}</p>
                      <p className="text-xs text-text-light/60 dark:text-text-dark/60">{testimonial.company}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-base text-text-light/90 dark:text-text-dark/90">{testimonial.review}</p>
                </div>
              ))
              )}
            </div>
          </div>
        </section>

        {/* Section 5: Form Section */}
        <section
          id="application-form-section"
          className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-primary/5 to-white dark:from-background-dark dark:via-primary/10 dark:to-background-dark"
          role="region"
          aria-label="신청 폼 섹션"
        >
          {/* 장식 요소 */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden="true"></div>
          
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-2xl text-center mb-12">
              {offerData?.form_badge_text && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 dark:bg-accent/20 border border-accent/20 dark:border-accent/30 mb-6">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-bold text-accent">{offerData.form_badge_text}</span>
                </div>
              )}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-primary dark:text-white mb-4">
                {offerData?.form_title ? (
                  <span className="block">{offerData.form_title}</span>
                ) : (
                  <span className="block">지금 바로 시작하세요</span>
                )}
                {offerData?.form_subtitle && (
                  <span className="block mt-2 text-lg sm:text-xl lg:text-2xl font-medium text-text-light/70 dark:text-text-dark/70">
                    {offerData.form_subtitle}
                  </span>
                )}
              </h2>
              {offerData?.form_description && (
                <p className="mt-4 text-base text-text-light/70 dark:text-text-dark/70">
                  {offerData.form_description}
                </p>
              )}
            </div>
            <div className="mt-12 mx-auto max-w-lg">
              <div className="bg-white dark:bg-background-dark/80 rounded-2xl shadow-xl shadow-primary/10 dark:shadow-primary/20 border border-slate-200 dark:border-slate-800 p-8 sm:p-10">
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* 에러 메시지 영역 */}
                {Object.keys(errors).length > 0 && (
                  <div
                    role="alert"
                    aria-live="polite"
                    aria-atomic="true"
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800"
                  >
                    <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">입력 오류가 있습니다. 아래 항목을 확인해주세요.</p>
                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                      {Object.values(errors).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-text-light dark:text-text-dark/90 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange('name')}
                    placeholder="홍길동"
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={`mt-1 block w-full h-12 rounded-xl border-2 px-4 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none ${
                      errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'
                    }`}
                    required
                  />
                  {errors.name && (
                    <p id="name-error" className="mt-2 text-sm text-red-500 font-medium" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-text-light dark:text-text-dark/90 mb-2">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    placeholder="your@email.com"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`mt-1 block w-full h-12 rounded-xl border-2 px-4 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none ${
                      errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'
                    }`}
                    required
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-2 text-sm text-red-500 font-medium" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-text-light dark:text-text-dark/90 mb-2">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    placeholder="010-1234-5678"
                    aria-invalid={errors.phone ? 'true' : 'false'}
                    aria-required="true"
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className={`mt-1 block w-full h-12 rounded-xl border-2 px-4 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none ${
                      errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'
                    }`}
                    required
                  />
                  {errors.phone && (
                    <p id="phone-error" className="mt-2 text-sm text-red-500 font-medium" role="alert">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex h-5 items-center pt-0.5">
                    <input
                      type="checkbox"
                      id="privacy"
                      name="privacy"
                      checked={formData.consent_privacy}
                      onChange={handleChange('consent_privacy')}
                      aria-invalid={errors.consent_privacy ? 'true' : 'false'}
                      aria-describedby={errors.consent_privacy ? 'privacy-error' : undefined}
                      className="h-5 w-5 rounded border-2 border-slate-300 text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex-1 text-sm">
                    <label htmlFor="privacy" className="text-text-light/90 dark:text-text-dark/90 cursor-pointer">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPrivacyModal(true);
                        }}
                        className="font-bold text-primary dark:text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                      >
                        개인정보 처리방침
                      </button>
                      에 동의합니다. <span className="text-red-500">*</span>
                    </label>
                    {errors.consent_privacy && (
                      <p id="privacy-error" className="mt-2 text-sm text-red-500 font-medium" role="alert">
                        {errors.consent_privacy}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  aria-disabled={isSubmitting}
                  className="group relative w-full flex justify-center items-center gap-3 rounded-xl h-14 px-6 bg-gradient-to-r from-primary to-accent text-white text-lg font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="sr-only">제출 중입니다</span>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span aria-hidden="true">처리 중...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>지금 바로 무료로 받기</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
                
                {/* 보안 배지 */}
                <div className="flex items-center justify-center gap-4 pt-4 text-xs text-text-light/60 dark:text-text-dark/60">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>SSL 보안</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>개인정보 보호</span>
                  </div>
                </div>
              </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary/90 text-white" role="contentinfo">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-4">
              <div className="size-5">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g clipPath="url(#clip0_6_535_footer)">
                    <path
                      clipRule="evenodd"
                      d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z"
                      fill="currentColor"
                      fillRule="evenodd"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_6_535_footer">
                      <rect fill="white" height="48" width="48" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <span className="text-xl font-black tracking-tighter font-display">인슈랑</span>
            </div>
            <div className="text-xs opacity-70">
              <p>(주)인슈랑 | 대표: 홍길동 | 사업자등록번호: 123-45-67890</p>
              <p>© 2024 인슈랑 Inc. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPrivacyModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <h2 id="privacy-modal-title" className="text-2xl font-bold text-text-light dark:text-text-dark">
                개인정보 처리방침
              </h2>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="p-2 text-text-light/60 dark:text-text-dark/60 hover:text-text-light dark:hover:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary rounded-lg transition-colors"
                aria-label="닫기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-sm text-text-light/90 dark:text-text-dark/90 leading-relaxed">
              <div>
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">1. 개인정보의 처리 목적</h3>
                <p className="mb-2">
                  (주)인슈랑(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>서비스 제공 및 본인 확인: 오퍼 신청, 콘텐츠 제공, 본인 확인</li>
                  <li>마케팅 및 광고 활용: 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공</li>
                  <li>고객 문의 및 불만 처리: 민원 처리, 고지사항 전달</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">2. 개인정보의 처리 및 보유기간</h3>
                <p className="mb-2">
                  회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>서비스 이용 기록: 3년 (통신비밀보호법)</li>
                  <li>마케팅 동의: 동의 철회 시까지</li>
                  <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">3. 처리하는 개인정보의 항목</h3>
                <p className="mb-2">회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>필수 항목: 이름, 이메일, 휴대폰 번호</li>
                  <li>선택 항목: 소속사</li>
                  <li>자동 수집 항목: IP 주소, 쿠키, 서비스 이용 기록</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">4. 개인정보의 제3자 제공</h3>
                <p>
                  회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">5. 개인정보처리의 위탁</h3>
                <p>
                  회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다. 위탁계약 체결 시 개인정보 보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">6. 정보주체의 권리·의무 및 행사방법</h3>
                <p className="mb-2">정보주체는 다음과 같은 권리를 행사할 수 있습니다:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>개인정보 열람 요구</li>
                  <li>개인정보 정정·삭제 요구</li>
                  <li>개인정보 처리정지 요구</li>
                  <li>개인정보 수집·이용·제공에 대한 동의 철회</li>
                </ul>
                <p className="mt-2">
                  위 권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">7. 개인정보의 파기</h3>
                <p className="mb-2">회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
                <p className="mb-2">파기의 절차 및 방법은 다음과 같습니다:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>파기 절차: 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                  <li>파기 방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다. 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">8. 개인정보 보호책임자</h3>
                <p className="mb-2">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                  <p className="mb-1"><strong>개인정보 보호책임자</strong></p>
                  <p className="mb-1">성명: 홍길동</p>
                  <p className="mb-1">직책: 대표이사</p>
                  <p className="mb-1">연락처: privacy@insurang.com</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">9. 개인정보의 안전성 확보조치</h3>
                <p className="mb-2">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                  <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                  <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">10. 개인정보 처리방침 변경</h3>
                <p>
                  이 개인정보 처리방침은 2024년 1월 1일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors font-medium"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

