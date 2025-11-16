'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateLeadForm, normalizePhone } from '@/lib/utils/validation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

/**
 * Main Landing Page
 * 메인페이지 - 보험설계사 대상 AI 마케팅 플랫폼 소개
 * 제공된 디자인 반영 (variant_3_of_3)
 */
export default function MainPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    consent_privacy: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCtaClick = useCallback(() => {
    const offerSection = document.getElementById('offer-section');
    if (offerSection) {
      offerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      router.push('/offer/workbook');
    }
  }, [router]);

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
      offer_slug: 'workbook',
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      organization: null,
      consent_privacy: formData.consent_privacy,
      consent_marketing: false,
    });

    setErrors(validation.errors);
    return validation.valid;
  }, [formData]);

  // 입력 핸들러
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    if (name === 'phone' && type === 'text') {
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: fieldValue }));
    }

    // 에러 초기화
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors, formatPhoneNumber]);

  // 폼 제출 핸들러
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
          organization: null,
          consent_privacy: formData.consent_privacy,
          consent_marketing: false,
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
        console.log('[Main Page] API Response:', result);
      } catch (parseError) {
        console.error('[Main Page] JSON parse error:', parseError);
        alert('응답 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }

      if (result.success) {
        console.log('[Main Page] Form submission successful, redirecting to thanks page...');
        // 정적 빌드 환경에서도 안정적으로 작동하도록 window.location.href 직접 사용
        // router.push는 정적 빌드 환경에서 제대로 작동하지 않을 수 있음
        window.location.href = '/offer/workbook/thanks';
      } else {
        const errorMessage = result.error || '신청 처리 중 오류가 발생했습니다.';
        console.error('[Main Page] API returned success: false', { error: errorMessage, result });
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

  return (
    <div className="relative w-full flex flex-col items-center bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans">
      <Header onCtaClick={handleCtaClick} ctaText="무료 혜택 받기" />

      <main className="w-full max-w-7xl flex flex-col items-center px-6 sm:px-10">
        {/* Hero Section */}
        <section
          className="w-full py-20 sm:py-28 text-center relative overflow-hidden"
          id="hero-section"
          role="region"
          aria-label="히어로 섹션"
        >
          <div
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(0,82,255,0.05)_0%,rgba(252,252,252,0)_35%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(0,82,255,0.1)_0%,rgba(29,29,31,0)_35%)]"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-5 sm:gap-6 items-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black !leading-tight tracking-tight font-display">
              고객은 똑똑해졌고,
              <br />
              보험 영업은 어려워졌습니다.
            </h1>
            <p className="text-base sm:text-lg font-normal leading-relaxed text-text-light/70 dark:text-text-dark/70 max-w-2xl">
              인슈랑은 AI 시대를 살아가는 보험 설계사님들의 고민을 가장 깊이 이해하고, 실질적인 해결책을 제공합니다.
            </p>
            <button
              onClick={handleCtaClick}
              className="flex mt-6 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="AI 워크북 무료로 받기"
            >
              <span className="truncate">AI 워크북 무료로 받기</span>
            </button>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="w-full py-16 sm:py-24" id="pain-section" role="region" aria-label="페인 포인트 섹션">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold !leading-tight tracking-tight font-display">
              혼자서는 버거운, 오늘의 보험 영업
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-light/70 dark:text-text-dark/70 leading-relaxed">
              설계사님, 이런 어려움을 겪고 계신가요?
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                label: '어려움 #1',
                title: '신규 고객 발굴의 한계',
                description: '지인 영업은 끝났고, 새로운 잠재고객을 찾는 것은 막막하기만 합니다.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                label: '어려움 #2',
                title: '과도한 행정 업무 부담',
                description: '수많은 서류 작업과 고객 관리, 정작 중요한 영업에 집중할 시간이 부족합니다.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                label: '어려움 #3',
                title: '낮아지는 계약 성공률',
                description: '고객들은 더 많은 정보를 원하고, 기존의 상담 방식으로는 마음을 얻기 어렵습니다.',
              },
            ].map((pain, index) => (
              <div
                key={index}
                className="flex flex-col items-start justify-start rounded-xl p-6 sm:p-8 bg-white dark:bg-background-dark border border-subtle-light dark:border-subtle-dark shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {pain.icon}
                </div>
                <p className="text-primary text-sm font-bold leading-normal">{pain.label}</p>
                <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] mt-1 font-display">{pain.title}</h3>
                <p className="text-text-light/70 dark:text-text-dark/70 text-base font-normal leading-relaxed mt-3">
                  {pain.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust/Philosophy Section */}
        <section className="w-full py-16 sm:py-24" id="trust-section" role="region" aria-label="철학 섹션">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-primary font-bold text-base">우리의 철학</h3>
              <p className="mt-4 text-3xl sm:text-4xl font-bold !leading-tight tracking-tight font-display">
                "우리는 AI를 통해 설계사님의 '시간'을 되찾고,
                <br />
                고객과의 '관계'에 집중하게 만듭니다."
              </p>
              <p className="mt-6 text-base sm:text-lg text-text-light/70 dark:text-text-dark/70 leading-relaxed">
                인슈랑은 기술이 사람을 대체하는 것이 아니라, 사람을 더욱 사람답게 만들기 위해 존재해야 한다고 믿습니다. 우리는 AI를 윤리적으로 활용하여 설계사님의 전문성을 극대화하고, 인간적인 가치를 높이는 교육을 제공합니다.
              </p>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <img
                alt="AI와 인간의 연결을 나타내는 추상 이미지"
                className="rounded-xl w-full max-w-md lg:max-w-none"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWe3VfB1U0VU6alPN667h-jFcWXsalJbFTTH4Io-5iVYNRUVlH3a0DwPCobI_lt5qa_IoI_SjRTNdZM9af34fAJ2NCkYzQGcmDmAUvPh-vsjSTqDLmyYDfQLgvDP9ZIkfC44TYJXL3Y-bWOq0oKOhw_qX63-tYtl4Z9l21o7J-HRsSjO8udxYpJ6kD0WFNmaM_mAB4opFx4smkMiKAeM0HQ6UKP2cVXymruZNpdo7JKGzkYJuKj7lIW-FqGLdmvmhbGzEIAEEjbBIN"
              />
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="w-full py-16 sm:py-24" id="solution-section" role="region" aria-label="해결책 섹션">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold !leading-tight tracking-tight font-display">
              INSURANG이 제안하는 AI 기반 해결책
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-light/70 dark:text-text-dark/70 leading-relaxed">
              AI를 당신의 가장 강력한 비서로 만드세요.
            </p>
          </div>
          <div className="space-y-10 max-w-3xl mx-auto">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                ),
                title: 'AI 콘텐츠 자동 생성',
                description:
                  '블로그 포스팅, 고객 맞춤형 정보, SNS 게시물을 AI가 순식간에 만들어 드립니다. 더 이상 콘텐츠 고민에 시간을 낭비하지 마세요.',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: '잠재고객 발굴 및 분석',
                description:
                  'AI를 활용해 온라인에서 당신의 가망 고객을 찾아내고, 고객의 니즈를 미리 파악하여 정확한 제안을 할 수 있도록 돕습니다.',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: '업무 자동화 및 효율 증대',
                description:
                  '반복적인 행정 업무와 고객 응대를 AI에게 맡기고, 설계사님은 오직 고객과의 깊이 있는 상담에만 집중하세요.',
              },
            ].map((solution, index) => (
              <div key={index} className="flex items-start gap-4 sm:gap-6">
                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white mt-1">
                  {solution.icon}
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-bold font-display">{solution.title}</h4>
                  <p className="mt-2 text-base sm:text-lg text-text-light/70 dark:text-text-dark/70 leading-relaxed">
                    {solution.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mobile Sticky CTA */}
        <div className="sticky bottom-4 z-40 w-full px-4 md:hidden" aria-hidden="true">
          <button
            onClick={handleCtaClick}
            className="flex w-full max-w-md mx-auto items-center justify-center rounded-lg h-14 px-5 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="무료 AI 가이드북 신청"
          >
            <span className="truncate">무료 AI 가이드북 신청</span>
          </button>
        </div>

        {/* Offer Section */}
        <section className="w-full py-16 sm:py-24" id="offer-section" role="region" aria-label="오퍼 섹션">
          <div className="max-w-xl mx-auto p-6 sm:p-10 rounded-xl bg-white dark:bg-background-dark border border-subtle-light dark:border-subtle-dark shadow-2xl">
            <div className="flex flex-col justify-center">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl font-bold font-display">지금 바로 시작하세요</h2>
                <p className="mt-4 text-base sm:text-lg text-text-light/70 dark:text-text-dark/70 leading-relaxed">
                  AI를 활용한 보험 영업, 더 이상 미룰 수 없습니다.
                  <br />
                  핵심만 담은 <span className="font-bold text-primary">AI 활용 워크북 & 가이드북</span>을 무료로 받아보세요.
                </p>
              </div>
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
              <form className="mt-10 space-y-6" onSubmit={handleSubmit} noValidate>
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
                <button
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary h-14 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={isSubmitting}
                  aria-label={isSubmitting ? '제출 중...' : '무료 혜택 신청하기'}
                >
                  {isSubmitting ? '처리 중...' : '무료 혜택 신청하기'}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Closing Section */}
        <section className="w-full py-16 sm:py-24 text-center" id="closing-section" role="region" aria-label="마무리 섹션">
          <div className="max-w-3xl mx-auto">
            <p className="text-2xl sm:text-4xl font-bold !leading-tight font-display">
              변화는 이미 시작되었습니다.
              <br />
              인슈랑과 함께 AI 시대의 주인공이 되십시오.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
