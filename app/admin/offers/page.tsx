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
  created_at: string;
  updated_at: string;
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState<Partial<Offer>>({
    name: '',
    slug: '',
    title: '',
    description: '',
    thumbnail: '',
    status: 'draft',
    download_link: '',
    ab_test_variant: 'A',
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
          // JSON 파싱 실패 시 상태 코드 기반 메시지 사용
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
          // JSON 파싱 실패 시 상태 코드 기반 메시지 사용
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

  // 슬러그 자동 생성 (한글 → 영문)
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
    setFormData({
      name: '',
      slug: '',
      title: '',
      description: '',
      thumbnail: '',
      status: 'draft',
      download_link: '',
      ab_test_variant: 'A',
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
    });
    setFormError(null);
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
    });
    setFormError(null);
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
          // JSON 파싱 실패 시 상태 코드 기반 메시지 사용
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
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <TableSkeleton rows={5} cols={6} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">오류 발생</h2>
            <p className="text-red-700 dark:text-red-300 mb-4" role="alert">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchOffers();
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-text-light dark:text-text-dark mb-2">
                오퍼 관리
              </h1>
              <p className="text-text-light/70 dark:text-text-dark/70">
                오퍼를 생성, 수정, 삭제하고 전환율을 추적합니다.
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
                description="새 오퍼를 생성하여 시작하세요."
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

                {formError && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 text-sm">{formError}</p>
                  </div>
                )}

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
                      URL에 사용될 고유 식별자입니다. 영문, 숫자, 하이픈만 사용 가능합니다.
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
                      placeholder="SEO에 사용될 제목 (선택사항)"
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
                      placeholder="오퍼에 대한 설명을 입력하세요"
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
          message={`정말로 "${deleteConfirm.offerName}" 오퍼를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
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

