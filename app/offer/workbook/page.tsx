'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
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
 * Workbook Offer Landing Page
 * 정적 경로: /offer/workbook
 * 동적 라우팅과 동일한 내용을 직접 렌더링
 */
export default function WorkbookOfferPage() {
  const router = useRouter();
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '휴대폰 번호를 입력해주세요.';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = '올바른 휴대폰 번호 형식을 입력해주세요.';
    }

    if (!formData.consent_privacy) {
      newErrors.consent_privacy = '개인정보 수집 및 이용에 동의해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (value: string): string => {
    const numbers = normalizePhone(value);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    if (name === 'phone' && type === 'tel') {
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: fieldValue }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

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
          offer_slug: 'workbook',
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
        console.log('[Workbook Page] API Response:', result);
      } catch (parseError) {
        console.error('[Workbook Page] JSON parse error:', parseError);
        alert('응답 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }

      if (result.success) {
        console.log('[Workbook Page] Form submission successful, redirecting to thanks page...');
        // 정적 빌드 환경에서도 안정적으로 작동하도록 window.location 사용
        await new Promise((resolve) => setTimeout(resolve, 500));
        try {
          router.push('/offer/workbook/thanks');
        } catch (routerError) {
          console.warn('[Workbook Page] router.push failed, using window.location:', routerError);
          window.location.href = '/offer/workbook/thanks';
        }
      } else {
        const errorMessage = result.error || '신청 처리 중 오류가 발생했습니다.';
        console.error('[Workbook Page] API returned success: false', { error: errorMessage, result });
        alert(errorMessage);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('[Workbook Page] Form submission error:', error);
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
        const response = await fetch('/api/offers?slug=workbook');
        const result = await response.json();

        if (result.success && result.data) {
          setOfferData(result.data);
        } else {
          console.error('Failed to fetch offer:', result.error);
        }
      } catch (error) {
        console.error('Error fetching offer:', error);
      } finally {
        setIsLoadingOffer(false);
      }
    };

    fetchOffer();
  }, []);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light font-display group/design-root overflow-x-hidden dark:bg-background-dark">
      <Header onCtaClick={handleCtaClick} ctaText="AI 상담 워크북 받기" />

      <main className="w-full max-w-7xl flex flex-col items-center px-6 sm:px-10 mx-auto">
        {/* Hero Section */}
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

        {/* Application Form Section */}
        <section className="w-full py-16 sm:py-24" id="application-form-section" role="region" aria-label="신청 폼 섹션">
          <div className="container mx-auto max-w-2xl px-4">
            <div className="rounded-xl bg-white dark:bg-background-dark border border-subtle-light dark:border-subtle-dark shadow-xl p-6 sm:p-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 font-display">무료 워크북 신청하기</h2>
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
              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`block w-full rounded-md border ${
                      errors.name ? 'border-red-500' : 'border-subtle-light dark:border-subtle-dark'
                    } shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-light dark:bg-gray-800 py-3 px-4`}
                    id="name"
                    name="name"
                    placeholder="홍길동"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    aria-label="이름 입력"
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`block w-full rounded-md border ${
                      errors.email ? 'border-red-500' : 'border-subtle-light dark:border-subtle-dark'
                    } shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-light dark:bg-gray-800 py-3 px-4`}
                    id="email"
                    name="email"
                    placeholder="your@email.com"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    aria-label="이메일 입력"
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`block w-full rounded-md border ${
                      errors.phone ? 'border-red-500' : 'border-subtle-light dark:border-subtle-dark'
                    } shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-light dark:bg-gray-800 py-3 px-4`}
                    id="phone"
                    name="phone"
                    placeholder="010-1234-5678"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    aria-label="연락처 입력"
                    aria-required="true"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                  />
                  {errors.phone && (
                    <p id="phone-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                    소속사 (선택)
                  </label>
                  <input
                    className="block w-full rounded-md border border-subtle-light dark:border-subtle-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-light dark:bg-gray-800 py-3 px-4"
                    id="organization"
                    name="organization"
                    placeholder="보험사명 또는 소속사"
                    type="text"
                    value={formData.organization}
                    onChange={handleChange}
                  />
                </div>
                <div className="pt-2">
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary ${
                          errors.consent_privacy ? 'border-red-500' : ''
                        }`}
                        id="consent_privacy"
                        name="consent_privacy"
                        type="checkbox"
                        checked={formData.consent_privacy}
                        onChange={handleChange}
                        aria-label="개인정보 수집 및 이용 동의"
                        aria-required="true"
                        aria-invalid={!!errors.consent_privacy}
                        aria-describedby={errors.consent_privacy ? 'consent-error' : undefined}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="consent_privacy" className="font-medium text-text-light dark:text-text-dark">
                        개인정보 수집 및 이용에 동의합니다. <span className="text-red-500">*</span>
                      </label>
                      {errors.consent_privacy && (
                        <p id="consent-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                          {errors.consent_privacy}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        id="consent_marketing"
                        name="consent_marketing"
                        type="checkbox"
                        checked={formData.consent_marketing}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="consent_marketing" className="font-medium text-text-light dark:text-text-dark">
                        마케팅 정보 수신에 동의합니다. (선택)
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary h-14 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={isSubmitting}
                  aria-label={isSubmitting ? '제출 중...' : '신청하기'}
                >
                  {isSubmitting ? '처리 중...' : '신청하기'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
