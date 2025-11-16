'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { LeadListItem, LeadDetail } from '@/types/api';

/**
 * Admin Leads Page
 * 관리자 리드 목록 조회 페이지
 * Tailwind CSS 기반
 */

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // 검색 및 필터링 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOffer, setFilterOffer] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof LeadListItem>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchLeads = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/leads');
      
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
        console.error('Failed to fetch leads:', response.status);
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
        setLeads(result.data);
      } else {
        const errorMessage = result.error || '리드를 불러오는데 실패했습니다.';
        setError(errorMessage);
        console.error('Failed to fetch leads:', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '리드를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeadDetail = useCallback(async (leadId: number) => {
    try {
      setDetailLoading(true);
      const response = await fetch(`/api/admin/leads?id=${leadId}`);
      
      if (response.status === 401) {
        setError('인증이 필요합니다. 페이지를 새로고침하고 로그인해주세요.');
        setDetailLoading(false);
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
        console.error('Failed to fetch lead detail:', response.status);
        alert('리드 상세 정보를 불러오는데 실패했습니다: ' + errorMessage);
        setDetailLoading(false);
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        alert('응답 처리 중 오류가 발생했습니다.');
        setDetailLoading(false);
        return;
      }

      if (result.success && result.data) {
        setSelectedLead(result.data as LeadDetail);
        setDetailOpen(true);
      } else {
        const errorMessage = result.error || '알 수 없는 오류';
        console.error('Failed to fetch lead detail:', errorMessage);
        alert('리드 상세 정보를 불러오는데 실패했습니다: ' + errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('Error fetching lead detail:', error);
      alert('리드 상세 정보를 불러오는데 실패했습니다: ' + errorMessage);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-semibold';
    if (status === 'success') {
      return `${baseClasses} bg-green-100 text-green-800`;
    } else if (status === 'failed') {
      return `${baseClasses} bg-red-100 text-red-800`;
    }
    return `${baseClasses} bg-gray-100 text-gray-800`;
  };

  // 필터링 및 정렬된 리드 목록
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = [...leads];

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.phone.includes(query) ||
          lead.offer_slug.toLowerCase().includes(query) ||
          (lead.organization && lead.organization.toLowerCase().includes(query))
      );
    }

    // 오퍼 필터
    if (filterOffer !== 'all') {
      filtered = filtered.filter((lead) => lead.offer_slug === filterOffer);
    }

    // 정렬
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [leads, searchQuery, filterOffer, sortField, sortDirection]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage);
  const paginatedLeads = filteredAndSortedLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 고유한 오퍼 목록
  const uniqueOffers = useMemo(() => {
    const offers = new Set(leads.map((lead) => lead.offer_slug));
    return Array.from(offers).sort();
  }, [leads]);

  // CSV 내보내기
  const exportToCSV = () => {
    const headers = ['ID', '오퍼', '이름', '이메일', '휴대폰', '소속', '이메일 상태', 'SMS 상태', '신청일'];
    const rows = filteredAndSortedLeads.map((lead) => [
      lead.id,
      lead.offer_slug,
      lead.name,
      lead.email,
      lead.phone,
      lead.organization || '',
      lead.email_status,
      lead.sms_status,
      formatDate(lead.created_at),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSort = (field: keyof LeadListItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" aria-label="로딩 중"></div>
          <p className="text-gray-600" aria-live="polite">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-700 mb-4" role="alert">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchLeads();
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">리드 관리</h1>
              <p className="text-gray-600 dark:text-gray-400">
                총 <span className="font-semibold">{leads.length}</span>건의 리드 중{' '}
                <span className="font-semibold">{filteredAndSortedLeads.length}</span>건이 표시됩니다.
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV 내보내기
            </button>
          </div>

          {/* 검색 및 필터 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 검색 */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  검색
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="이름, 이메일, 전화번호로 검색..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* 오퍼 필터 */}
              <div>
                <label htmlFor="filter-offer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  오퍼 필터
                </label>
                <select
                  id="filter-offer"
                  value={filterOffer}
                  onChange={(e) => {
                    setFilterOffer(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">전체</option>
                  {uniqueOffers.map((offer) => (
                    <option key={offer} value={offer}>
                      {offer}
                    </option>
                  ))}
                </select>
              </div>

              {/* 정렬 */}
              <div>
                <label htmlFor="sort-field" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  정렬 기준
                </label>
                <select
                  id="sort-field"
                  value={sortField}
                  onChange={(e) => {
                    setSortField(e.target.value as keyof LeadListItem);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="created_at">신청일</option>
                  <option value="id">ID</option>
                  <option value="name">이름</option>
                  <option value="email">이메일</option>
                  <option value="offer_slug">오퍼</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="리드 목록">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">
                      ID
                      {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('offer_slug')}>
                    <div className="flex items-center gap-1">
                      오퍼
                      {sortField === 'offer_slug' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      이름
                      {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('email')}>
                    <div className="flex items-center gap-1">
                      이메일
                      {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    휴대폰
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    소속
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일 상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SMS 상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center gap-1">
                      신청일
                      {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상세
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500" role="status" aria-live="polite">
                      {leads.length === 0 ? '등록된 리드가 없습니다.' : '검색 결과가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.offer_slug}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.organization || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(lead.email_status)}>{lead.email_status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(lead.sms_status)}>{lead.sms_status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => fetchLeadDetail(lead.id)}
                          disabled={detailLoading}
                          aria-label={`리드 ${lead.id} 상세 정보 보기`}
                          className="text-primary hover:text-primary-dark font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                        >
                          {detailLoading ? '로딩...' : '보기'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {((currentPage - 1) * itemsPerPage + 1).toLocaleString()} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredAndSortedLeads.length).toLocaleString()} /{' '}
              {filteredAndSortedLeads.length.toLocaleString()}건
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, idx, arr) => {
                  if (idx > 0 && arr[idx - 1] !== page - 1) {
                    return (
                      <span key={`ellipsis-${page}`} className="px-2 py-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-primary text-white'
                          : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailOpen && selectedLead && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                  리드 상세 정보
                </h2>
                <button
                  onClick={() => setDetailOpen(false)}
                  aria-label="모달 닫기"
                  className="text-gray-400 hover:text-gray-600 text-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">기본 정보</h3>
                  <dl className="grid grid-cols-1 gap-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-700">ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedLead.id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-700">오퍼</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedLead.offer_slug}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-700">이름</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedLead.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-700">이메일</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedLead.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-700">휴대폰</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedLead.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-700">소속</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedLead.organization || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-700">개인정보 동의</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedLead.consent_privacy ? '동의' : '미동의'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-700">마케팅 동의</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedLead.consent_marketing ? '동의' : '미동의'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-700">신청일</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedLead.created_at)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Message Logs */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">메시지 발송 로그</h3>
                  {selectedLead.logs.length === 0 ? (
                    <p className="text-sm text-gray-500">발송 로그가 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedLead.logs.map((log) => (
                        <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {log.channel}
                            </span>
                            <span className={getStatusBadge(log.status)}>{log.status}</span>
                            <span className="text-xs text-gray-500">{formatDate(log.sent_at)}</span>
                          </div>
                          {log.error_message && (
                            <p className="text-xs text-red-600 mt-1">오류: {log.error_message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setDetailOpen(false)}
                  aria-label="모달 닫기"
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
