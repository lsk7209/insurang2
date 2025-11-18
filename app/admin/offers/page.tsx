'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from '@/app/components/admin/Toast';
import ConfirmModal from '@/app/components/admin/ConfirmModal';
import { TableSkeleton } from '@/app/components/admin/Skeleton';
import EmptyState from '@/app/components/admin/EmptyState';

/**
 * Admin Offers Page
 * 관리자 오퍼 관리 페이지
 * Tailwind CSS 기반
 */

interface Offer {
  id: number;
  slug: string;
  name: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  status: 'draft' | 'active' | 'inactive';
  download_link: string | null;
  json_ld: string | null;
  ab_test_variant: 'A' | 'B';
  // 랜딩 페이지 컨텐츠 필드
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_badge_text: string | null;
  hero_cta_text: string | null;
  hero_background_image: string | null;
  hero_stats_text: string | null; // JSON
  preview_title: string | null;
  preview_subtitle: string | null;
  preview_image: string | null;
  preview_features: string | null; // JSON
  value_title: string | null;
  value_subtitle: string | null;
  value_cards: string | null; // JSON
  trust_title: string | null;
  trust_subtitle: string | null;
  testimonials: string | null; // JSON
  form_title: string | null;
  form_subtitle: string | null;
  form_badge_text: string | null;
  form_description: string | null;
  // 감사 페이지 컨텐츠 필드
  thanks_title: string | null;
  thanks_subtitle: string | null;
  thanks_description: string | null;
  thanks_cta_text: string | null;
  thanks_examples: string | null; // JSON
  created_at: string;
  updated_at: string;
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'thanks' | 'analytics'>('basic');
  const [formData, setFormData] = useState<Partial<Offer>>({
    name: '',
    slug: '',
    title: '',
    description: '',
    thumbnail: '',
    status: 'draft',
    download_link: '',
    ab_test_variant: 'A',
    // 랜딩 페이지 컨텐츠 기본값
    hero_title: '',
    hero_subtitle: '',
    hero_badge_text: '무료 제공 · 즉시 다운로드',
    hero_cta_text: '지금 바로 무료로 받기',
    hero_background_image: '',
    hero_stats_text: '{"downloads": "1,247명 다운로드", "rating": "4.9/5.0 만족도"}',
    preview_title: '',
    preview_subtitle: '',
    preview_image: '',
    preview_features: '[]',
    value_title: '',
    value_subtitle: '',
    value_cards: '[]',
    trust_title: '',
    trust_subtitle: '',
    testimonials: '[]',
    form_title: '',
    form_subtitle: '',
    form_badge_text: '100% 무료 · 즉시 다운로드',
    form_description: '',
    // 감사 페이지 기본값
    thanks_title: '신청이 완료되었습니다!',
    thanks_subtitle: '신청해 주셔서 감사합니다. 곧바로 이메일로 발송됩니다. 성공적인 보험을 위한 차트로 가서 차 있으면, 지금 바로 상담 받아보세요!',
    thanks_description: '',
    thanks_cta_text: '다음으로',
    thanks_examples: '[{"title": "보험 요청을 구체적으로 문의", "text": "보험 제 목적과 무료가를 구매하고 싶은 보험, 고객의 가족의 보험 최적 결제 방법을 제공하는 보험 정보를 제공하는 방법."}, {"title": "우선적으로 거래 대화 문의", "text": "보험에 고민이 있습니다. 그 부분을 확인하고, 보험 고객의 요구를 충족하는지 먼저 확인해 보겠습니다. 그렇지 않으면 가격이 무의미할까요."}, {"title": "긴급하게 스트레스 없게 만든 문의", "text": "보험 보험 정보를 가져오기 가격이 보험 제거합니다. 다음으로 보험 보험으로 지금, 건강하고 가격 저렴한 보험료로 가입하는 보험 방법."}]',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; offerId: number; offerName: string } | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/offers');

      if (response.status === 401) {
        setError('인증이 필요합니다. 페이지를 새로고침하고 로그인해주세요.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage = `서버 오류가 발생했습니다. (상태 코드: ${response.status})`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 오류 메시지 사용
        }
        setError(errorMessage);
        console.error('Failed to fetch offers:', response.status);
        setLoading(false);
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setError('응답 처리 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      if (result.success && Array.isArray(result.data)) {
        setOffers(result.data);
      } else {
        setError(result.error || '오퍼를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '오퍼를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleDeleteClick = (offerId: number, offerName: string) => {
    setDeleteConfirm({ isOpen: true, offerId, offerName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const { offerId, offerName } = deleteConfirm;

    try {
      const response = await fetch(`/api/admin/offers?id=${offerId}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        toast.error('인증이 필요합니다. 페이지를 새로고침하고 로그인해주세요.');
        setDeleteConfirm(null);
        return;
      }

      if (!response.ok) {
        let errorMessage = `서버 오류가 발생했습니다. (상태 코드: ${response.status})`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 오류 메시지 사용
        }
        toast.error('오퍼 삭제에 실패했습니다: ' + errorMessage);
        setDeleteConfirm(null);
        return;
      }

      const result = await response.json();
      if (result.success) {
        toast.success('오퍼가 성공적으로 삭제되었습니다.');
        fetchOffers();
      } else {
        toast.error('오퍼 삭제에 실패했습니다: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('Error deleting offer:', error);
      toast.error('오퍼 삭제 중 오류가 발생했습니다: ' + errorMessage);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-semibold';
    if (status === 'active') {
      return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
    } else if (status === 'draft') {
      return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
    }
    return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 슬러그 자동 생성 (영문 및 숫자)
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingOffer(null);
    setActiveTab('basic');
    setFormData({
      name: '',
      slug: '',
      title: '',
      description: '',
      thumbnail: '',
      status: 'draft',
      download_link: '',
      ab_test_variant: 'A',
      hero_title: '',
      hero_subtitle: '',
      hero_badge_text: '무료 제공 · 즉시 다운로드',
      hero_cta_text: '지금 바로 무료로 받기',
      hero_background_image: '',
      hero_stats_text: '{"downloads": "1,247명 다운로드", "rating": "4.9/5.0 만족도"}',
      preview_title: '',
      preview_subtitle: '',
      preview_image: '',
      preview_features: '[]',
      value_title: '',
      value_subtitle: '',
      value_cards: '[]',
      trust_title: '',
      trust_subtitle: '',
      testimonials: '[]',
      form_title: '',
      form_subtitle: '',
      form_badge_text: '100% 무료 · 즉시 다운로드',
      form_description: '',
      thanks_title: '신청이 완료되었습니다!',
      thanks_subtitle: '신청해 주셔서 감사합니다. 곧바로 이메일로 발송됩니다. 성공적인 보험을 위한 차트로 가서 차 있으면, 지금 바로 상담 받아보세요!',
      thanks_description: '',
      thanks_cta_text: '다음으로',
      thanks_examples: '[{"title": "보험 요청을 구체적으로 문의", "text": "보험 제 목적과 무료가를 구매하고 싶은 보험, 고객의 가족의 보험 최적 결제 방법을 제공하는 보험 정보를 제공하는 방법."}, {"title": "우선적으로 거래 대화 문의", "text": "보험에 고민이 있습니다. 그 부분을 확인하고, 보험 고객의 요구를 충족하는지 먼저 확인해 보겠습니다. 그렇지 않으면 가격이 무의미할까요."}, {"title": "긴급하게 스트레스 없게 만든 문의", "text": "보험 보험 정보를 가져오기 가격이 보험 제거합니다. 다음으로 보험 보험으로 지금, 건강하고 가격 저렴한 보험료로 가입하는 보험 방법."}]',
    });
    setFormError(null);
  };

  // 모달 열기 (생성)
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      slug: '',
      title: '',
      description: '',
      thumbnail: '',
      status: 'draft',
      download_link: '',
      ab_test_variant: 'A',
      hero_title: '',
      hero_subtitle: '',
      hero_badge_text: '무료 제공 · 즉시 다운로드',
      hero_cta_text: '지금 바로 무료로 받기',
      hero_background_image: '',
      hero_stats_text: '{"downloads": "1,247명 다운로드", "rating": "4.9/5.0 만족도"}',
      preview_title: '',
      preview_subtitle: '',
      preview_image: '',
      preview_features: '[]',
      value_title: '',
      value_subtitle: '',
      value_cards: '[]',
      trust_title: '',
      trust_subtitle: '',
      testimonials: '[]',
      form_title: '',
      form_subtitle: '',
      form_badge_text: '100% 무료 · 즉시 다운로드',
      form_description: '',
      thanks_title: '신청이 완료되었습니다!',
      thanks_subtitle: '신청해 주셔서 감사합니다. 곧바로 이메일로 발송됩니다. 성공적인 보험을 위한 차트로 가서 차 있으면, 지금 바로 상담 받아보세요!',
      thanks_description: '',
      thanks_cta_text: '다음으로',
      thanks_examples: '[{"title": "보험 요청을 구체적으로 문의", "text": "보험 제 목적과 무료가를 구매하고 싶은 보험, 고객의 가족의 보험 최적 결제 방법을 제공하는 보험 정보를 제공하는 방법."}, {"title": "우선적으로 거래 대화 문의", "text": "보험에 고민이 있습니다. 그 부분을 확인하고, 보험 고객의 요구를 충족하는지 먼저 확인해 보겠습니다. 그렇지 않으면 가격이 무의미할까요."}, {"title": "긴급하게 스트레스 없게 만든 문의", "text": "보험 보험 정보를 가져오기 가격이 보험 제거합니다. 다음으로 보험 보험으로 지금, 건강하고 가격 저렴한 보험료로 가입하는 보험 방법."}]',
    });
    setFormError(null);
    setActiveTab('basic');
    setShowCreateModal(true);
    setEditingOffer(null);
  };

  // 모달 열기 (수정)
  const handleOpenEditModal = (offer: Offer) => {
    setFormData({
      name: offer.name,
      slug: offer.slug,
      title: offer.title || '',
      description: offer.description || '',
      thumbnail: offer.thumbnail || '',
      status: offer.status,
      download_link: offer.download_link || '',
      ab_test_variant: offer.ab_test_variant,
      hero_title: offer.hero_title || '',
      hero_subtitle: offer.hero_subtitle || '',
      hero_badge_text: offer.hero_badge_text || '무료 제공 · 즉시 다운로드',
      hero_cta_text: offer.hero_cta_text || '지금 바로 무료로 받기',
      hero_background_image: offer.hero_background_image || '',
      hero_stats_text: offer.hero_stats_text || '{"downloads": "1,247명 다운로드", "rating": "4.9/5.0 만족도"}',
      preview_title: offer.preview_title || '',
      preview_subtitle: offer.preview_subtitle || '',
      preview_image: offer.preview_image || '',
      preview_features: offer.preview_features || '[]',
      value_title: offer.value_title || '',
      value_subtitle: offer.value_subtitle || '',
      value_cards: offer.value_cards || '[]',
      trust_title: offer.trust_title || '',
      trust_subtitle: offer.trust_subtitle || '',
      testimonials: offer.testimonials || '[]',
      form_title: offer.form_title || '',
      form_subtitle: offer.form_subtitle || '',
      form_badge_text: offer.form_badge_text || '100% 무료 · 즉시 다운로드',
      form_description: offer.form_description || '',
      thanks_title: offer.thanks_title || '신청이 완료되었습니다!',
      thanks_subtitle: offer.thanks_subtitle || '신청해 주셔서 감사합니다. 곧바로 이메일로 발송됩니다. 성공적인 보험을 위한 차트로 가서 차 있으면, 지금 바로 상담 받아보세요!',
      thanks_description: offer.thanks_description || '',
      thanks_cta_text: offer.thanks_cta_text || '다음으로',
      thanks_examples: offer.thanks_examples || '[{"title": "보험 요청을 구체적으로 문의", "text": "보험 제 목적과 무료가를 구매하고 싶은 보험, 고객의 가족의 보험 최적 결제 방법을 제공하는 보험 정보를 제공하는 방법."}, {"title": "우선적으로 거래 대화 문의", "text": "보험에 고민이 있습니다. 그 부분을 확인하고, 보험 고객의 요구를 충족하는지 먼저 확인해 보겠습니다. 그렇지 않으면 가격이 무의미할까요."}, {"title": "긴급하게 스트레스 없게 만든 문의", "text": "보험 보험 정보를 가져오기 가격이 보험 제거합니다. 다음으로 보험 보험으로 지금, 건강하고 가격 저렴한 보험료로 가입하는 보험 방법."}]',
    });
    setFormError(null);
    setActiveTab('basic');
    setEditingOffer(offer);
    setShowCreateModal(true);
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    // 필수 필드 검증
    if (!formData.name || !formData.slug) {
      setFormError('오퍼명과 슬러그는 필수 입력 항목입니다.');
      setFormLoading(false);
      return;
    }

    try {
      const url = editingOffer
        ? `/api/admin/offers?id=${editingOffer.id}`
        : '/api/admin/offers';
      const method = editingOffer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        setFormError('인증이 필요합니다. 페이지를 새로고침하고 로그인해주세요.');
        setFormLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage = `서버 오류가 발생했습니다. (상태 코드: ${response.status})`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 오류 메시지 사용
        }
        setFormError(errorMessage);
        setFormLoading(false);
        return;
      }

      const result = await response.json();
      if (result.success) {
        toast.success(editingOffer ? '오퍼가 성공적으로 수정되었습니다.' : '오퍼가 성공적으로 생성되었습니다.');
        handleCloseModal();
        fetchOffers();
      } else {
        setFormError(result.error || '오퍼 저장에 실패했습니다.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setFormError('오퍼 저장 중 오류가 발생했습니다: ' + errorMessage);
      console.error('Error saving offer:', error);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-text-light dark:text-text-dark">오퍼 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-4">오류 발생</h2>
          <p className="text-red-700 dark:text-red-300 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchOffers();
            }}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-text-light dark:text-text-dark mb-2">
                오퍼 관리
              </h1>
              <p className="text-text-light/70 dark:text-text-dark/70">
                오퍼를 생성, 수정, 삭제하고 전환율을 관리합니다.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 오퍼 생성
            </button>
          </div>

          {/* 오퍼 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {offers.length === 0 ? (
              <EmptyState
                title="오퍼가 없습니다"
                description="새 오퍼를 생성해보세요."
                actionLabel="첫 오퍼 생성"
                onAction={handleOpenCreateModal}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        슬러그
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        A/B 테스트
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        생성일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {offers.map((offer) => (
                      <tr key={offer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {offer.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {offer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            {offer.slug}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={getStatusBadge(offer.status)}>
                            {offer.status === 'active' ? '활성' : offer.status === 'draft' ? '초안' : '비활성'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {offer.ab_test_variant}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(offer.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/offer/${offer.slug}`}
                              target="_blank"
                              className="text-primary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                              aria-label={`${offer.name} 랜딩 페이지 보기`}
                            >
                              보기
                            </Link>
                            <button
                              onClick={() => handleOpenEditModal(offer)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                              aria-label={`${offer.name} 수정`}
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteClick(offer.id, offer.name)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                              aria-label={`${offer.name} 삭제`}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 생성/수정 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
                    {editingOffer ? '오퍼 수정' : '새 오퍼 생성'}
                  </h2>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                    aria-label="닫기"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 탭 네비게이션 */}
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex gap-4 overflow-x-auto" aria-label="탭 메뉴">
                    <button
                      type="button"
                      onClick={() => setActiveTab('basic')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'basic'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      기본 정보
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('content')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'content'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      랜딩 페이지
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('thanks')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'thanks'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      감사 페이지
                    </button>
                    {editingOffer && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'analytics'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        분석 통계
                      </button>
                    )}
                  </nav>
                </div>

                {formError && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 text-sm">{formError}</p>
                  </div>
                )}

                {/* 기본 정보 탭 */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    {/* 오퍼 이름 */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        오퍼 이름 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => {
                          const name = e.target.value;
                          setFormData({
                            ...formData,
                            name,
                            slug: formData.slug || generateSlug(name),
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="예: AI 상담 워크북"
                      />
                    </div>

                    {/* 슬러그 */}
                    <div>
                      <label htmlFor="slug" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        슬러그 (URL) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="slug"
                        type="text"
                        required
                        value={formData.slug || ''}
                        onChange={(e) => {
                          const slug = e.target.value
                            .toLowerCase()
                            .replace(/[^\w-]/g, '-')
                            .replace(/-+/g, '-')
                            .trim();
                          setFormData({ ...formData, slug });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                        placeholder="예: ai-consulting-workbook"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        URL에 사용할 고유 식별자입니다. 영문, 숫자, 하이픈만 사용 가능합니다.
                      </p>
                    </div>

                    {/* SEO 제목 */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        SEO 제목
                      </label>
                      <input
                        id="title"
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="SEO에 사용할 제목 (선택사항)"
                      />
                    </div>

                    {/* 설명 */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        설명
                      </label>
                      <textarea
                        id="description"
                        rows={3}
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="오퍼에 대한 대략적인 설명을 입력하세요"
                      />
                    </div>

                    {/* 썸네일 */}
                    <div>
                      <label htmlFor="thumbnail" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        썸네일 이미지 URL
                      </label>
                      <input
                        id="thumbnail"
                        type="url"
                        value={formData.thumbnail || ''}
                        onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    {/* 다운로드 링크 */}
                    <div>
                      <label htmlFor="download_link" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        다운로드 링크
                      </label>
                      <input
                        id="download_link"
                        type="url"
                        value={formData.download_link || ''}
                        onChange={(e) => setFormData({ ...formData, download_link: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="https://example.com/workbook.pdf"
                      />
                    </div>

                    {/* 상태 및 A/B 테스트 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                          상태
                        </label>
                        <select
                          id="status"
                          value={formData.status || 'draft'}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'active' | 'inactive' })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="draft">초안</option>
                          <option value="active">활성</option>
                          <option value="inactive">비활성</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="ab_test_variant" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                          A/B 테스트 변형
                        </label>
                        <select
                          id="ab_test_variant"
                          value={formData.ab_test_variant || 'A'}
                          onChange={(e) => setFormData({ ...formData, ab_test_variant: e.target.value as 'A' | 'B' })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 랜딩 페이지 컨텐츠 탭 */}
                {activeTab === 'content' && (
                  <div className="space-y-6">
                    {/* Hero 섹션 */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Hero 섹션</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="hero_title" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            메인 제목
                          </label>
                          <input
                            id="hero_title"
                            type="text"
                            value={formData.hero_title || ''}
                            onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 전환률을 2배로 높이는 AI 워크북"
                          />
                        </div>
                        <div>
                          <label htmlFor="hero_subtitle" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            부제목
                          </label>
                          <textarea
                            id="hero_subtitle"
                            rows={3}
                            value={formData.hero_subtitle || ''}
                            onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 매일 보험 상담 지루하신가요? 고객 유입을 높이는 방법으로 보험 상담으로, 전환률을 2배로."
                          />
                        </div>
                        <div>
                          <label htmlFor="hero_badge_text" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            배지 텍스트
                          </label>
                          <input
                            id="hero_badge_text"
                            type="text"
                            value={formData.hero_badge_text || ''}
                            onChange={(e) => setFormData({ ...formData, hero_badge_text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 무료 제공 · 즉시 다운로드"
                          />
                        </div>
                        <div>
                          <label htmlFor="hero_cta_text" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            CTA 버튼 텍스트
                          </label>
                          <input
                            id="hero_cta_text"
                            type="text"
                            value={formData.hero_cta_text || ''}
                            onChange={(e) => setFormData({ ...formData, hero_cta_text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 지금 바로 무료로 받기"
                          />
                        </div>
                        <div>
                          <label htmlFor="hero_background_image" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            배경 이미지 URL
                          </label>
                          <input
                            id="hero_background_image"
                            type="url"
                            value={formData.hero_background_image || ''}
                            onChange={(e) => setFormData({ ...formData, hero_background_image: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview 섹션 */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Preview 섹션</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="preview_title" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            제목
                          </label>
                          <input
                            id="preview_title"
                            type="text"
                            value={formData.preview_title || ''}
                            onChange={(e) => setFormData({ ...formData, preview_title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: AI 상담 워크북, 즉시 사용 가능합니다"
                          />
                        </div>
                        <div>
                          <label htmlFor="preview_subtitle" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            부제목
                          </label>
                          <textarea
                            id="preview_subtitle"
                            rows={2}
                            value={formData.preview_subtitle || ''}
                            onChange={(e) => setFormData({ ...formData, preview_subtitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 고객의 첫인상부터 보험 상담까지, 모든 단계를 체계적으로 관리하고 가이드합니다."
                          />
                        </div>
                        <div>
                          <label htmlFor="preview_image" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            미리보기 이미지 URL
                          </label>
                          <input
                            id="preview_image"
                            type="url"
                            value={formData.preview_image || ''}
                            onChange={(e) => setFormData({ ...formData, preview_image: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://example.com/preview.jpg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Value 섹션 */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Value 섹션</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="value_title" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            제목
                          </label>
                          <input
                            id="value_title"
                            type="text"
                            value={formData.value_title || ''}
                            onChange={(e) => setFormData({ ...formData, value_title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 워크북으로 얻을 수 있는 가치"
                          />
                        </div>
                        <div>
                          <label htmlFor="value_subtitle" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            부제목
                          </label>
                          <textarea
                            id="value_subtitle"
                            rows={2}
                            value={formData.value_subtitle || ''}
                            onChange={(e) => setFormData({ ...formData, value_subtitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 워크북 스크립트가 포함되어 있습니다. 고객의 상담을 고객으로 보험 과정을 관리할 수 있습니다."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Trust 섹션 */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Trust 섹션</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="trust_title" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            제목
                          </label>
                          <input
                            id="trust_title"
                            type="text"
                            value={formData.trust_title || ''}
                            onChange={(e) => setFormData({ ...formData, trust_title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 먼저 경험해보고 보험 가입하기"
                          />
                        </div>
                        <div>
                          <label htmlFor="trust_subtitle" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            부제목
                          </label>
                          <textarea
                            id="trust_subtitle"
                            rows={2}
                            value={formData.trust_subtitle || ''}
                            onChange={(e) => setFormData({ ...formData, trust_subtitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 이미 많은 고객이 INSURANG과 함께 최고의 결과를 만들어왔습니다."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form 섹션 */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Form 섹션</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="form_badge_text" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            배지 텍스트
                          </label>
                          <input
                            id="form_badge_text"
                            type="text"
                            value={formData.form_badge_text || ''}
                            onChange={(e) => setFormData({ ...formData, form_badge_text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 100% 무료 · 즉시 다운로드"
                          />
                        </div>
                        <div>
                          <label htmlFor="form_title" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            제목
                          </label>
                          <input
                            id="form_title"
                            type="text"
                            value={formData.form_title || ''}
                            onChange={(e) => setFormData({ ...formData, form_title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 지금 바로 신청하기"
                          />
                        </div>
                        <div>
                          <label htmlFor="form_subtitle" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            부제목
                          </label>
                          <textarea
                            id="form_subtitle"
                            rows={2}
                            value={formData.form_subtitle || ''}
                            onChange={(e) => setFormData({ ...formData, form_subtitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 이름과 전화만 입력하면 워크북을 바로 보내드립니다"
                          />
                        </div>
                        <div>
                          <label htmlFor="form_description" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            설명
                          </label>
                          <textarea
                            id="form_description"
                            rows={2}
                            value={formData.form_description || ''}
                            onChange={(e) => setFormData({ ...formData, form_description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 신용카드 불필요 · 개인정보 보호 · 언제든지 구독 취소 가능"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 감사 페이지 컨텐츠 탭 */}
                {activeTab === 'thanks' && (
                  <div className="space-y-6">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">감사 페이지 컨텐츠</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="thanks_title" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            메인 제목
                          </label>
                          <input
                            id="thanks_title"
                            type="text"
                            value={formData.thanks_title || ''}
                            onChange={(e) => setFormData({ ...formData, thanks_title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 신청이 완료되었습니다!"
                          />
                        </div>
                        <div>
                          <label htmlFor="thanks_subtitle" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            부제목
                          </label>
                          <textarea
                            id="thanks_subtitle"
                            rows={3}
                            value={formData.thanks_subtitle || ''}
                            onChange={(e) => setFormData({ ...formData, thanks_subtitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 신청해 주셔서 감사합니다. 곧바로 이메일로 발송됩니다."
                          />
                        </div>
                        <div>
                          <label htmlFor="thanks_cta_text" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            CTA 버튼 텍스트
                          </label>
                          <input
                            id="thanks_cta_text"
                            type="text"
                            value={formData.thanks_cta_text || ''}
                            onChange={(e) => setFormData({ ...formData, thanks_cta_text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="예: 다음으로"
                          />
                        </div>
                        <div>
                          <label htmlFor="thanks_examples" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            예시 문구 (JSON 형식)
                          </label>
                          <textarea
                            id="thanks_examples"
                            rows={8}
                            value={formData.thanks_examples || ''}
                            onChange={(e) => setFormData({ ...formData, thanks_examples: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                            placeholder='JSON 배열 형식으로 입력하세요'
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            JSON 배열 형식으로 입력하세요.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 분석 통계 탭 */}
                {activeTab === 'analytics' && editingOffer && (
                  <div className="space-y-6">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
                        {editingOffer.name} 분석 통계
                      </h3>
                      <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          분석 통계 기능은 별도 페이지에서 확인할 수 있습니다.
                        </p>
                        <a
                          href={`/admin/analytics?offer=${editingOffer.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          분석 통계 페이지로 이동
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* 버튼 */}
                <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    disabled={formLoading}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {formLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        저장 중...
                      </span>
                    ) : (
                      editingOffer ? '수정' : '생성'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="오퍼 삭제 확인"
          message={`정말 "${deleteConfirm.offerName}" 오퍼를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          confirmText="삭제"
          cancelText="취소"
          type="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
