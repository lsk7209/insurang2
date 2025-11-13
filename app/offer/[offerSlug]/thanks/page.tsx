'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Thank You Page
 * 동적 라우팅: /offer/[offerSlug]/thanks
 * Tailwind CSS 기반
 */
export default function ThankYouPage() {
  const router = useRouter();
  const params = useParams();
  const offerSlug = params?.offerSlug as string;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            신청이 완료되었습니다!
          </h1>

          {/* Message */}
          <div className="space-y-4 mb-8">
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              입력하신 이메일로 워크북 다운로드 링크를 보내드렸습니다.
            </p>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              문자 메시지도 발송되었으니 확인해 주세요.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/offer/${offerSlug}`}
              className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              다시 보기
            </Link>
            <a
              href={process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              카카오 채널 문의
            </a>
          </div>

          {/* Disclaimer */}
          <p className="mt-12 text-xs text-gray-500 max-w-xl mx-auto leading-relaxed">
            ※ 본 자료는 AI가 생성한 예시를 포함하며, 실제 약관·상품 내용은 반드시 확인 바랍니다.
          </p>
        </div>
      </div>

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

