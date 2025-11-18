'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateLeadForm, normalizePhone } from '@/lib/utils/validation';
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
      offer_slug: 'workbook',
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      organization: formData.organization || null,
      consent_privacy: formData.consent_privacy,
      consent_marketing: formData.consent_marketing,
    });

    setErrors(validation.errors);
    return validation.valid;
  }, [formData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    let cancelled = false;

    const fetchOffer = async () => {
      try {
        const response = await fetch('/api/offers?slug=workbook');
        if (cancelled) return;

        const result = await response.json();
        if (cancelled) return;

        if (result.success && result.data) {
          setOfferData(result.data);
        } else {
          console.warn('[Workbook Page] Offer not found, using default values');
        }
      } catch (error) {
        if (cancelled) return;
        console.error('[Workbook Page] Failed to fetch offer:', error);
      } finally {
        if (!cancelled) {
          setIsLoadingOffer(false);
        }
      }
    };

    fetchOffer();

    return () => {
      cancelled = true;
    };
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
                    required
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
