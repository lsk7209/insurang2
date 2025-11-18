'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from '@/app/components/admin/Toast';
import ConfirmModal from '@/app/components/admin/ConfirmModal';
import { TableSkeleton } from '@/app/components/admin/Skeleton';
import EmptyState from '@/app/components/admin/EmptyState';

/**
 * Admin Offers Page
 * 관리� ��� 관리 ��지
 * Tailwind CSS 기�
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
  // ��지 ��츠 ��
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
  // �� ��지 ��츠 ��
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
    // ��지 ��츠 기본�
    hero_title: '',
    hero_subtitle: '',
    hero_badge_text: '무료 제공 · �� �운로�',
    hero_cta_text: '지� �로 무료로 �기',
    hero_background_image: '',
    hero_stats_text: '{"downloads": "1,247� �운로�", "rating": "4.9/5.0 만족�"}',
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
    form_badge_text: '100% 무료 · �� �운로�',
    form_description: '',
    // �� ��지 기본�
    thanks_title: '��� �청� �료��습��!',
    thanks_subtitle: '�청�� 주�� ������. ����� ���로 발��습��. �공� ��� � ���트로 가� 차 �으�, 지� �로 ���� 보��!',
    thanks_description: '',
    thanks_cta_text: '�으로',
    thanks_examples: '[{"title": "�� �뢰를 구��� 문�", "text": "�� 제 목�� 무�가를 �매�� �� ���, 고���� 가족� �� 최�� 결�� �리� � ��� ��� �보를 제공�� ����."}, {"title": "우��게 거�� 대��� 문�", "text": "�� ��� 고민����. 그 부�� �� ���고, � ��� 고��� ��를 충족��지 먼저 ���� 보�죠. 그�지 ��면 가격� 무�미��까�."}, {"title": "긴��� ��스�게 만�� 문�", "text": "� 보�� �보�기 가� �� �� �제�습��. ��으로 �� �� �로 지�, 건���고 가� 저렴� 보�료로 가��� � �� �����."}]',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; offerId: number; offerName: string } | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/offers');

      if (response.status === 401) {
        setError('��� ������. ��지를 �로고침�고 로그���주��.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage = `�� ��가 발��습��. (�� ��: ${response.status})`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          // JSON 파� �패 � �� �� 기� ��지 �용
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
        setError('�� �리 � ��가 발��습��.');
        setLoading(false);
        return;
      }

      if (result.success && Array.isArray(result.data)) {
        setOffers(result.data);
      } else {
        setError(result.error || '���를 ����� �패�습��.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '���를 ����� �패�습��.';
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
        toast.error('��� ������. ��지를 �로고침�고 로그���주��.');
        setDeleteConfirm(null);
        return;
      }

      if (!response.ok) {
        let errorMessage = `�� ��가 발��습��. (�� ��: ${response.status})`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          // JSON 파� �패 � �� �� 기� ��지 �용
        }
        toast.error('��� �제� �패�습��: ' + errorMessage);
        setDeleteConfirm(null);
        return;
      }

      const result = await response.json();
      if (result.success) {
        toast.success('���가 �공�으로 �제��습��.');
        fetchOffers();
      } else {
        toast.error('��� �제� �패�습��: ' + (result.error || '� � �� ��'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '� � �� ��';
      console.error('Error deleting offer:', error);
      toast.error('��� �제 � ��가 발��습��: ' + errorMessage);
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

  // 슬�그 �� �� (�글 � �문)
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // 모� �기
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
      hero_badge_text: '무료 제공 · �� �운로�',
      hero_cta_text: '지� �로 무료로 �기',
      hero_background_image: '',
      hero_stats_text: '{"downloads": "1,247� �운로�", "rating": "4.9/5.0 만족�"}',
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
      form_badge_text: '100% 무료 · �� �운로�',
      form_description: '',
      thanks_title: '��� �청� �료��습��!',
      thanks_subtitle: '�청�� 주�� ������. ����� ���로 발��습��. �공� ��� � ���트로 가� 차 �으�, 지� �로 ���� 보��!',
      thanks_description: '',
      thanks_cta_text: '�으로',
      thanks_examples: '[{"title": "�� �뢰를 구��� 문�", "text": "�� 제 목�� 무�가를 �매�� �� ���, 고���� 가족� �� 최�� 결�� �리� � ��� ��� �보를 제공�� ����."}, {"title": "우��게 거�� 대��� 문�", "text": "�� ��� 고민����. 그 부�� �� ���고, � ��� 고��� ��를 충족��지 먼저 ���� 보�죠. 그�지 ��면 가격� 무�미��까�."}, {"title": "긴��� ��스�게 만�� 문�", "text": "� 보�� �보�기 가� �� �� �제�습��. ��으로 �� �� �로 지�, 건���고 가� 저렴� 보�료로 가��� � �� �����."}]',
    });
    setFormError(null);
  };

  // 모� �기 (��)
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
      hero_badge_text: '무료 제공 · �� �운로�',
      hero_cta_text: '지� �로 무료로 �기',
      hero_background_image: '',
      hero_stats_text: '{"downloads": "1,247� �운로�", "rating": "4.9/5.0 만족�"}',
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
      form_badge_text: '100% 무료 · �� �운로�',
      form_description: '',
      thanks_title: '��� �청� �료��습��!',
      thanks_subtitle: '�청�� 주�� ������. ����� ���로 발��습��. �공� ��� � ���트로 가� 차 �으�, 지� �로 ���� 보��!',
      thanks_description: '',
      thanks_cta_text: '�으로',
      thanks_examples: '[{"title": "�� �뢰를 구��� 문�", "text": "�� 제 목�� 무�가를 �매�� �� ���, 고���� 가족� �� 최�� 결�� �리� � ��� ��� �보를 제공�� ����."}, {"title": "우��게 거�� 대��� 문�", "text": "�� ��� 고민����. 그 부�� �� ���고, � ��� 고��� ��를 충족��지 먼저 ���� 보�죠. 그�지 ��면 가격� 무�미��까�."}, {"title": "긴��� ��스�게 만�� 문�", "text": "� 보�� �보�기 가� �� �� �제�습��. ��으로 �� �� �로 지�, 건���고 가� 저렴� 보�료로 가��� � �� �����."}]',
    });
    setFormError(null);
    setActiveTab('basic');
    setShowCreateModal(true);
    setEditingOffer(null);
  };

  // 모� �기 (��)
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
      hero_badge_text: offer.hero_badge_text || '무료 제공 · �� �운로�',
      hero_cta_text: offer.hero_cta_text || '지� �로 무료로 �기',
      hero_background_image: offer.hero_background_image || '',
      hero_stats_text: offer.hero_stats_text || '{"downloads": "1,247� �운로�", "rating": "4.9/5.0 만족�"}',
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
      form_badge_text: offer.form_badge_text || '100% 무료 · �� �운로�',
      form_description: offer.form_description || '',
      thanks_title: offer.thanks_title || '��� �청� �료��습��!',
      thanks_subtitle: offer.thanks_subtitle || '�청�� 주�� ������. ����� ���로 발��습��. �공� ��� � ���트로 가� 차 �으�, 지� �로 ���� 보��!',
      thanks_description: offer.thanks_description || '',
      thanks_cta_text: offer.thanks_cta_text || '�으로',
      thanks_examples: offer.thanks_examples || '[{"title": "�� �뢰를 구��� 문�", "text": "�� 제 목�� 무�가를 �매�� �� ���, 고���� 가족� �� 최�� 결�� �리� � ��� ��� �보를 제공�� ����."}, {"title": "우��게 거�� 대��� 문�", "text": "�� ��� 고민����. 그 부�� �� ���고, � ��� 고��� ��를 충족��지 먼저 ���� 보�죠. 그�지 ��면 가격� 무�미��까�."}, {"title": "긴��� ��스�게 만�� 문�", "text": "� 보�� �보�기 가� �� �� �제�습��. ��으로 �� �� �로 지�, 건���고 가� 저렴� 보�료로 가��� � �� �����."}]',
    });
    setFormError(null);
    setActiveTab('basic');
    setEditingOffer(offer);
    setShowCreateModal(true);
  };

  // �� 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    // �� �� 검�
    if (!formData.name || !formData.slug) {
      setFormError('����과 슬�그� �� �력 ��목���.');
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
        setFormError('��� ������. ��지를 �로고침�고 로그���주��.');
        setFormLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage = `�� ��가 발��습��. (�� ��: ${response.status})`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          // JSON 파� �패 � �� �� 기� ��지 �용
        }
        setFormError(errorMessage);
        setFormLoading(false);
        return;
      }

      const result = await response.json();
      if (result.success) {
        toast.success(editingOffer ? '���가 �공�으로 ����습��.' : '���가 �공�으로 ����습��.');
        handleCloseModal();
        fetchOffers();
      } else {
        setFormError(result.error || '��� 저�� �패�습��.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '� � �� ��';
      setFormError('��� 저� � ��가 발��습��: ' + errorMessage);
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
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">�� 발�</h2>
            <p className="text-red-700 dark:text-red-300 mb-4" role="alert">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchOffers();
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              �� ��
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
          {/* ��� */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-text-light dark:text-text-dark mb-2">
                ��� 관리
              </h1>
              <p className="text-text-light/70 dark:text-text-dark/70">
                ���를 ��, ��, �제�고 ��율� ������.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              � ��� ��
            </button>
          </div>

          {/* ��� 목� */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {offers.length === 0 ? (
              <EmptyState
                title="���가 �습��"
                description="� ���를 ���� �����."
                actionLabel="첫 ��� ��"
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
                        ��
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        슬�그
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ��
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        A/B �스트
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ���
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ��
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
                            {offer.status === 'active' ? '��' : offer.status === 'draft' ? '��' : '���'}
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
                              aria-label={`${offer.name} �� ��지 보기`}
                            >
                              보기
                            </Link>
                            <button
                              onClick={() => handleOpenEditModal(offer)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                              aria-label={`${offer.name} ��`}
                            >
                              ��
                            </button>
                            <button
                              onClick={() => handleDeleteClick(offer.id, offer.name)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                              aria-label={`${offer.name} �제`}
                            >
                              �제
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

      {/* ��/�� 모� */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
                    {editingOffer ? '��� ��' : '� ��� ��'}
                  </h2>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                    aria-label="�기"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* �� ��게�� */}
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex gap-4 overflow-x-auto" aria-label="�� ��">
                    <button
                      type="button"
                      onClick={() => setActiveTab('basic')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'basic'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      기본 �보
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
                      �청 ��지
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
                      �� ��지
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
                        ��� ��
                      </button>
                    )}
                  </nav>
                </div>

                {formError && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 text-sm">{formError}</p>
                  </div>
                )}

                {/* 기본 �보 �� */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    {/* ��� �� */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        ��� �� <span className="text-red-500">*</span>
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
                        placeholder="�: AI �� ����"
                      />
                    </div>

                    {/* 슬�그 */}
                    <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      슬�그 (URL) <span className="text-red-500">*</span>
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
                      placeholder="�: ai-consulting-workbook"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      URL� �용� 고유 ������. �문, ��, ���만 �용 가능����.
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
                      placeholder="SEO� �용� 제목 (�����)"
                    />
                  </div>

                  {/* �� */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      ��
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="���� 대� ��� �력���"
                    />
                  </div>

                  {/* ��� */}
                  <div>
                    <label htmlFor="thumbnail" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      ��� �미지 URL
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

                  {/* �운로� ��� */}
                  <div>
                    <label htmlFor="download_link" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      �운로� ���
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

                  {/* �� � A/B �스트 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        ��
                      </label>
                      <select
                        id="status"
                        value={formData.status || 'draft'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'active' | 'inactive' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="draft">��</option>
                        <option value="active">��</option>
                        <option value="inactive">���</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="ab_test_variant" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        A/B �스트 변�
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

                {/* ��지 ��� �� */}
                {activeTab === 'content' && (
                  <div className="space-y-6">
                    {/* Hero �� */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Hero ��</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="hero_title" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            �� 제목
                          </label>
                          <input
                            id="hero_title"
                            type="text"
                            value={formData.hero_title || ''}
                            onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="�: �� �공률� 2배로 ��� AI ����"
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
                            placeholder="�: 매� �� ��� 지����? 고� 유�� �춤 ��으로 �� ��� ��으로, �� �공률� 2배로."
                          />
                        </div>
                        <div>
                          <label htmlFor="hero_badge_text" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            배지 �스트
                          </label>
                          <input
                            id="hero_badge_text"
                            type="text"
                            value={formData.hero_badge_text || ''}
                            onChange={(e) => setFormData({ ...formData, hero_badge_text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="�: 무료 제공 · �� �운로�"
                          />
                        </div>
                        <div>
                          <label htmlFor="hero_cta_text" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                          CTA �튼 �스트
                        </label>
                        <input
                          id="hero_cta_text"
                          type="text"
                          value={formData.hero_cta_text || ''}
                          onChange={(e) => setFormData({ ...formData, hero_cta_text: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="�: 지� �로 무료로 �기"
                        />
                        </div>
                        <div>
                          <label htmlFor="hero_background_image" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            배경 �미지 URL
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

                  {/* Preview �� */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Preview ��</h3>
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
                          placeholder="�: AI �� ����, �� �용� ��습��"
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
                          placeholder="�: 고�� 첫��부�� ��� ��까지, 모� ��를 체��으로 ���� �� 가�����."
                        />
                      </div>
                      <div>
                        <label htmlFor="preview_image" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                          미리보기 �미지 URL
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

                  {/* Value �� */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Value ��</h3>
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
                          placeholder="�: ���� ��로 ��� ��� �����"
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
                          placeholder="�: ��� 스��립트가 ����. 고�� ��� �고 ��으로 ��� 과��� �� �����."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trust �� */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Trust ��</h3>
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
                          placeholder="�: 먼저 경�� ����� ��� �기"
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
                          placeholder="�: �미 �� ��� INSURANG과 ��� 최고� �과를 만�고 �습��."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form �� */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Form ��</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="form_badge_text" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                          배지 �스트
                        </label>
                        <input
                          id="form_badge_text"
                          type="text"
                          value={formData.form_badge_text || ''}
                          onChange={(e) => setFormData({ ...formData, form_badge_text: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="�: 100% 무료 · �� �운로�"
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
                          placeholder="�: 지� �로 �����"
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
                          placeholder="�: ��과 ���만 �력�면 ����� �� 보��립��"
                        />
                      </div>
                      <div>
                        <label htmlFor="form_description" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                          ��
                        </label>
                        <textarea
                          id="form_description"
                          rows={2}
                          value={formData.form_description || ''}
                          onChange={(e) => setFormData({ ...formData, form_description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="�: �용카� ��� · 개��보 보�� · �제�지 구� 취� 가능"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* �� ��지 ��� �� */}
                {activeTab === 'thanks' && (
                  <div className="space-y-6">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">�� ��지 ��츠</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="thanks_title" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            �� 제목
                          </label>
                          <input
                            id="thanks_title"
                            type="text"
                            value={formData.thanks_title || ''}
                            onChange={(e) => setFormData({ ...formData, thanks_title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="�: ��� �청� �료��습��!"
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
                            placeholder="�: �청�� 주�� ������. ����� ���로 발��습��."
                          />
                        </div>
                        <div>
                          <label htmlFor="thanks_cta_text" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            CTA �튼 �스트
                          </label>
                          <input
                            id="thanks_cta_text"
                            type="text"
                            value={formData.thanks_cta_text || ''}
                            onChange={(e) => setFormData({ ...formData, thanks_cta_text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="�: �으로"
                          />
                        </div>
                        <div>
                          <label htmlFor="thanks_examples" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                          �� 문� (JSON ��)
                        </label>
                        <textarea
                          id="thanks_examples"
                          rows={8}
                          value={formData.thanks_examples || ''}
                          onChange={(e) => setFormData({ ...formData, thanks_examples: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                          placeholder='JSON 배� ��으로 �력���'
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          JSON 배� ��으로 �력���.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ��� �� �� */}
                {activeTab === 'analytics' && editingOffer && (
                  <div className="space-y-6">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
                        {editingOffer.name} ��� ���
                      </h3>
                      <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          ��� �� 기능� �� ��지�� ���� � �습��.
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
                          ��� �� ��지로 ��
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* �튼 */}
                <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    disabled={formLoading}
                  >
                    취�
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
                        저� �...
                      </span>
                    ) : (
                      editingOffer ? '��' : '��'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* �제 �� 모� */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="��� �제 ��"
          message={`��로 "${deleteConfirm.offerName}" ���를 �제��겠습�까? � ��� ��릴 � �습��.`}
          confirmText="�제"
          cancelText="취�"
          type="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
        </div>
      </div>
    </div>
  );
}