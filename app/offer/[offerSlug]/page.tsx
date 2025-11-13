'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { validateEmail, validatePhone, normalizePhone } from '@/lib/utils/validation';

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '휴대폰 번호를 입력해주세요.';
    } else {
      const phoneNumbers = formData.phone.replace(/[^\d]/g, '');
      if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
        newErrors.phone = '올바른 휴대폰 번호 형식을 입력해주세요.';
      }
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

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
          offer_slug: offerSlug,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: phoneNumbers,
          organization: formData.organization.trim() || null,
          consent_privacy: formData.consent_privacy,
          consent_marketing: formData.consent_marketing,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push(`/offer/${offerSlug}/thanks`);
      } else {
        const errorMessage = result.error || '신청 처리 중 오류가 발생했습니다.';
        alert(errorMessage);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
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
    <main className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-gray-900 font-medium">신청 처리 중...</p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {isLoadingOffer ? (
            <div className="py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" aria-label="로딩 중"></div>
              <p className="text-gray-600" aria-live="polite">로딩 중...</p>
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {offerData?.name || 'AI 상담 워크북'}
              </h1>
              {offerData?.description && (
                <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                  {offerData.description}
                </p>
              )}
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                복잡한 입력 없이, 현장에서 바로 쓰는 보험설계사 전용 ChatGPT 자동화 도구.
              </p>
            </>
          )}
          <button
            onClick={handleCtaClick}
            aria-label="신청 폼으로 이동"
            className="bg-warning hover:bg-warning-dark text-white font-bold py-4 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            무료로 시작하기
          </button>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            설계사의 시간을 돌려주는 실무 중심 기능
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: '상담 준비 자동화', desc: '고객 시나리오 요약, 상담 흐름, 질문리스트 생성' },
              { title: '제안서 초안 생성', desc: '상품 비교표, 가입근거 문장, 이해하기 쉬운 요약' },
              { title: 'DM·문자·SNS 카피', desc: '응답률을 높이는 문장 자동 구성' },
              { title: '약관 핵심요약', desc: '고객 친화적 설명문 자동 생성' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="application-form-section" className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-center text-gray-600 mb-8 text-lg">
            아래 정보를 입력하시면 AI 상담 워크북을 무료로 받으실 수 있습니다.
          </p>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg" noValidate>
            {/* 에러 메시지 영역 (ARIA live) */}
            {Object.keys(errors).length > 0 && (
              <div
                role="alert"
                aria-live="polite"
                aria-atomic="true"
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm font-medium text-red-800 mb-2">입력 오류가 있습니다. 아래 항목을 확인해주세요.</p>
                <ul className="list-disc list-inside text-sm text-red-700">
                  {Object.values(errors).map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  이름 <span className="text-red-500" aria-label="필수 항목">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 <span className="text-red-500" aria-label="필수 항목">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  휴대폰 번호 <span className="text-red-500" aria-label="필수 항목">*</span>
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
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.phone ? (
                  <p id="phone-error" className="mt-1 text-sm text-red-500" role="alert">
                    {errors.phone}
                  </p>
                ) : (
                  <p id="phone-hint" className="mt-1 text-sm text-gray-500">예: 010-1234-5678</p>
                )}
              </div>

              {/* Organization */}
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                  소속 <span className="text-gray-500 text-xs">(선택)</span>
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange('organization')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Consent Checkboxes */}
              <fieldset className="space-y-3">
                <legend className="sr-only">동의 항목</legend>
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="consent_privacy"
                      name="consent_privacy"
                      checked={formData.consent_privacy}
                      onChange={handleChange('consent_privacy')}
                      aria-invalid={errors.consent_privacy ? 'true' : 'false'}
                      aria-describedby={errors.consent_privacy ? 'consent_privacy-error' : undefined}
                      className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className={`text-sm ${errors.consent_privacy ? 'text-red-500' : 'text-gray-700'}`}>
                      개인정보 수집 및 이용에 동의합니다. <span className="text-red-500" aria-label="필수 항목">(필수)</span>
                    </span>
                  </label>
                  {errors.consent_privacy && (
                    <p id="consent_privacy-error" className="ml-8 mt-1 text-sm text-red-500" role="alert">
                      {errors.consent_privacy}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="consent_marketing"
                      name="consent_marketing"
                      checked={formData.consent_marketing}
                      onChange={handleChange('consent_marketing')}
                      className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">
                      마케팅 정보 수신에 동의합니다. <span className="text-gray-500 text-xs">(선택)</span>
                    </span>
                  </label>
                </div>

                <p className="ml-8 text-xs text-gray-500">
                  ※ 수집된 정보는 워크북 제공 및 서비스 안내 목적으로만 사용됩니다.
                </p>
              </fieldset>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                aria-disabled={isSubmitting}
                className="w-full bg-warning hover:bg-warning-dark text-white font-bold py-4 px-6 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="sr-only">제출 중입니다</span>
                    <span aria-hidden="true">제출 중...</span>
                  </>
                ) : (
                  'AI 상담워크북 무료로 받기'
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-400">
            © 2025 INSURANG. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

