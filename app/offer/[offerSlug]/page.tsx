'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { validateEmail, validatePhone, normalizePhone } from '@/lib/utils/validation';
import Header from '@/components/layout/Header';

interface OfferData {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  download_link: string | null;
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

    if (field === 'phone' && typeof value === 'string') {
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, [field]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }, [errors, formatPhoneNumber]);

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

    // 페이지 로드 시 스크롤 위치 초기화
    window.scrollTo(0, 0);
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
        <section className="relative py-20 sm:py-24 lg:py-32" role="region" aria-label="히어로 섹션">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-5"
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
                <div className="mx-auto max-w-3xl">
                  <h1 className="text-4xl font-black leading-tight tracking-tight text-primary dark:text-white sm:text-5xl lg:text-6xl">
                    혹시 매일 같은 상담에 지치지 않으셨나요?
                  </h1>
                  <p className="mt-6 text-lg leading-relaxed text-text-light dark:text-text-dark sm:text-xl">
                    반복되는 질문, 끝없는 자료 준비에서 벗어나 고객의 마음에만 집중하세요. AI가 당신의 상담을 혁신합니다.
                  </p>
                </div>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <button
                    onClick={handleCtaClick}
                    className="flex w-full sm:w-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-8 bg-cta text-white text-lg font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cta focus:ring-offset-2"
                    aria-label="AI 상담 워크북 무료로 받기"
                  >
                    <span className="truncate">AI 상담 워크북 무료로 받기</span>
                  </button>
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
                AI 상담 워크북, 이런 내용을 담았습니다
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-base text-text-light/80 dark:text-text-dark/80">
                고객의 첫마디부터 계약서 사인까지, 모든 단계를 체계적으로 안내하는 실전 가이드입니다.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
              <div className="w-full h-auto aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
                <div
                  className="w-full h-full bg-center bg-no-repeat bg-cover"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuApdcnBuidW2a8iye1uLx_TLeOi0L-CKTAQ5CHI-QLQi66MEKUUPeN5B0oT7btyuRG8Jc9-r6tWj6fZWb8rX6bjiRzJk-LKaEdEj_z5RmhoYAtdBvz0SRtyFOkp3uLRhNsjebOOntzGGKA49tRkiL97Tp2t27cuogPUVAPLCXWIAgDNMHAxeiQFV-ezvde9mPMvgOOIdOqK34zSLpAUnEQmFOQpnPZ63ullzYlDlIEc2PRonJZrbHzq_Bl2gJ2PQnkiCcyTjw-Fvj5p")',
                  }}
                  aria-label="워크북 샘플 페이지"
                />
              </div>
              <div className="flex flex-col gap-4 text-left">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-accent">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-primary dark:text-white">고객 유형별 심리 분석 및 접근법</h3>
                    <p className="mt-1 text-sm text-text-light/80 dark:text-text-dark/80">
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
                    <p className="mt-1 text-sm text-text-light/80 dark:text-text-dark/80">
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
                    <p className="mt-1 text-sm text-text-light/80 dark:text-text-dark/80">
                      고객의 거절을 기회로 바꾸는 데이터 기반의 설득 논리와 클로징 팁을 제공합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Value Section */}
        <section className="py-16 sm:py-20 lg:py-24" role="region" aria-label="가치 섹션">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-primary dark:text-white sm:text-4xl">
                워크북 하나로 당신의 상담이 달라집니다
              </h2>
              <p className="mt-4 text-base text-text-light/80 dark:text-text-dark/80">
                단순한 스크립트가 아닙니다. 고객의 마음을 열고 계약으로 이끄는 과학적인 상담 전략입니다.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
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
                  <p className="text-sm text-text-light/80 dark:text-text-dark/80">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Trust Section */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-background-dark/50" role="region" aria-label="신뢰 섹션">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-primary dark:text-white sm:text-4xl">
                먼저 경험한 설계사들의 생생한 후기
              </h2>
              <p className="mt-4 text-base text-text-light/80 dark:text-text-dark/80">
                이미 많은 분들이 INSURANG과 함께 최고의 성과를 만들고 있습니다.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: '김민준 설계사',
                  company: 'AIA생명',
                  image:
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuB-6WcE3jby_vcv8z1lUrj8l6n5Or_RD1mfZ8gOIg0qn2EnDq8l0BihWQiG3Qgqw6cxPyQ5ra4HGJTNaYJfZMvdzPkSWBiesS0cNd_5vqGEwm8-XWwDiqeZYAze4CfJroK356AOwbglxpsXrqz2Uj2wW04O6XNbFFQwNsj67h3opzsP2MWUXzFEeInywLdJcVKo7hqEGv0IU9gP8JgJ85oX7aLn7Z7HuqqCIjZYaeiM6v9qUoZOgM2KlqNYYDFYJdOZ26mStU_XIDj6',
                  review:
                    '"매번 상담 준비에만 몇 시간을 썼는데, 워크북 덕분에 핵심만 짚어 상담할 수 있게 됐어요. 고객 반응부터 달라졌습니다."',
                },
                {
                  name: '이서연 설계사',
                  company: '메리츠화재',
                  image:
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuDiL18lIzd5wJ1a3G8XR1ZW0myX_kvX3dBpUbTq4jJzYsoc5Eln6mmr_HQ7sbA2ieyN1ZrIilqfDBhVBgt_BlU34q8Xk88FzBInwhfhzTlbHGYAYktlZzfRjbmCBQtl6E0Jp487rUIqorLrknlmh3As_u5ZoPsFQX1FuQFn0cNMpYlexyBFIOlljkzNXq-AV0M2xTNyTrDn7heAq6ffSp3yFYgMm4nIAv-_ZugpGfXUEn_N4RDU9w2yXE3QBTp9x5AICDwT3mxOJePL',
                  review:
                    '"신입이라 상담이 막막했는데, 워크북이 훌륭한 멘토가 되어주었습니다. 특히 거절 대응 파트가 정말 큰 도움이 됐어요."',
                },
                {
                  name: '박지훈 팀장',
                  company: 'DB손해보험',
                  image:
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBJOld1Sg7unFatsojatL12hvygG4dJ4WtFrSOJqNhzdE-WC3ZPcDGO0i9Yc0gDWBSHvUYLJA1aDEZ2yIguHI3AtOYCXJLIAoSw9YsN3QErXKBVjx8ky_gWcVenp1VAjGt1IexkGqi2h9658MSYW8wtrIpn-auftih7tbneEgxTGQzqMzhq7Sa73E8scsSdT5wLNN_-wQsPJtwW5SPEPHWa8b1GlktNtKeDkOKvHrsshuNzTTuN7CEKzWESTUyFZogDAE54grR86FsF',
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
                  <p className="mt-4 text-sm text-text-light/90 dark:text-text-dark/90">{testimonial.review}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: Form Section */}
        <section
          id="form-section"
          className="py-16 sm:py-20 lg:py-24 bg-primary/5 dark:bg-background-dark/30"
          role="region"
          aria-label="신청 폼 섹션"
        >
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-primary dark:text-white sm:text-4xl">
                성공적인 상담의 비밀, 지금 바로 확인하세요
              </h2>
              <p className="mt-4 text-base text-text-light/80 dark:text-text-dark/80">
                이름과 이메일만 입력하시면 AI 상담 워크북을 즉시 보내드립니다.
              </p>
            </div>
            <div className="mt-12 mx-auto max-w-lg">
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                  <label htmlFor="name" className="block text-sm font-medium text-text-light dark:text-text-dark/90">
                    이름
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
                    className={`mt-1 block w-full rounded-lg border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50 ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {errors.name && (
                    <p id="name-error" className="mt-1 text-sm text-red-500" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-light dark:text-text-dark/90">
                    이메일
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
                    className={`mt-1 block w-full rounded-lg border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50 ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1 text-sm text-red-500" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-text-light dark:text-text-dark/90">
                    연락처 (선택)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    placeholder="010-1234-5678"
                    aria-invalid={errors.phone ? 'true' : 'false'}
                    aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
                    className={`mt-1 block w-full rounded-lg border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50 ${
                      errors.phone ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.phone ? (
                    <p id="phone-error" className="mt-1 text-sm text-red-500" role="alert">
                      {errors.phone}
                    </p>
                  ) : (
                    <p id="phone-hint" className="mt-1 text-sm text-text-light/60 dark:text-text-dark/60">선택 사항입니다</p>
                  )}
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      id="privacy"
                      name="privacy"
                      checked={formData.consent_privacy}
                      onChange={handleChange('consent_privacy')}
                      aria-invalid={errors.consent_privacy ? 'true' : 'false'}
                      aria-describedby={errors.consent_privacy ? 'privacy-error' : undefined}
                      className="h-4 w-4 rounded border-slate-300 text-cta focus:ring-cta"
                      required
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="privacy" className="text-text-light/80 dark:text-text-dark/80">
                      <Link href="#" className="font-medium text-primary dark:text-accent hover:underline">
                        개인정보 처리방침
                      </Link>
                      에 동의합니다.
                    </label>
                    {errors.consent_privacy && (
                      <p id="privacy-error" className="mt-1 text-sm text-red-500" role="alert">
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
                  className="w-full flex justify-center items-center rounded-lg h-12 px-6 bg-cta text-white text-base font-bold transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cta focus:ring-offset-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="sr-only">제출 중입니다</span>
                      <span aria-hidden="true">워크북 무료로 받고 상담 혁신하기</span>
                    </>
                  ) : (
                    '워크북 무료로 받고 상담 혁신하기'
                  )}
                </button>
              </form>
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
              <span className="text-xl font-black tracking-tighter font-display">INSURANG</span>
            </div>
            <div className="text-xs opacity-70">
              <p>(주)인슈랑 | 대표: 홍길동 | 사업자등록번호: 123-45-67890</p>
              <p>© 2024 INSURANG Inc. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

