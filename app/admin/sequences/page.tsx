'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Sequence {
  id: number;
  offer_slug: string;
  name: string;
  day_offset: number;
  channel: 'email' | 'sms';
  subject: string | null;
  message: string;
  quiet_hour_start: number;
  quiet_hour_end: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface Offer {
  id: number;
  slug: string;
  name: string;
}

/**
 * Admin Sequences Page
 * 관리자 시퀀스 메시지 관리 페이지
 * Tailwind CSS 기반
 */

interface SequenceLog {
  id: number;
  sequence_id: number;
  lead_id: number;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  sequence_name: string;
  channel: string;
  offer_slug: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string;
}

export default function AdminSequencesPage() {
  const [activeTab, setActiveTab] = useState<'sequences' | 'logs'>('sequences');
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [filterOffer, setFilterOffer] = useState<string>('all');
  const [formData, setFormData] = useState<Partial<Sequence>>({
    offer_slug: '',
    name: '',
    day_offset: 0,
    channel: 'email',
    subject: '',
    message: '',
    quiet_hour_start: 22,
    quiet_hour_end: 8,
    enabled: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // 로그 관련 상태
  const [logs, setLogs] = useState<SequenceLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<{ status?: string; sequence_id?: string }>({});
  const [logsTotal, setLogsTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLogsError(null);
      setLogsLoading(true);
      
      const params = new URLSearchParams();
      if (logFilter.status) params.append('status', logFilter.status);
      if (logFilter.sequence_id) params.append('sequence_id', logFilter.sequence_id);
      params.append('limit', '100');
      
      const response = await fetch(`/api/admin/sequences/logs?${params.toString()}`);

      if (response.status === 401) {
        setLogsError('인증이 필요합니다. 페이지를 새로고침하고 로그인해주세요.');
        setLogsLoading(false);
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
        setLogsError(errorMessage);
        setLogsLoading(false);
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('[Admin Sequences] JSON parse error:', parseError);
        setLogsError('응답 처리 중 오류가 발생했습니다.');
        setLogsLoading(false);
        return;
      }

      if (result.success && result.data) {
        setLogs(result.data.logs || []);
        setLogsTotal(result.data.total || 0);
      } else {
        const errorMessage = result.error || '로그를 불러오는데 실패했습니다.';
        setLogsError(errorMessage);
        console.error('[Admin Sequences] Failed to fetch logs:', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그를 불러오는데 실패했습니다.';
      setLogsError(errorMessage);
      console.error('[Admin Sequences] Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }, [logFilter]);

  const handleResend = async (logId: number) => {
    if (!confirm('이 시퀀스를 재발송하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/sequences/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ log_id: logId }),
      });

      if (response.status === 401) {
        alert('인증이 필요합니다. 페이지를 새로고침하고 로그인해주세요.');
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
        alert('재발송에 실패했습니다: ' + errorMessage);
        return;
      }

      const result = await response.json();
      if (result.success) {
        alert('재발송 대기열에 추가되었습니다. 다음 Cron 실행 시 발송됩니다.');
        fetchLogs();
      } else {
        alert('재발송에 실패했습니다: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('Error resending sequence:', error);
      alert('재발송 중 오류가 발생했습니다: ' + errorMessage);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  const fetchSequences = useCallback(async () => {
    try {
      setError(null);
      const url = filterOffer === 'all' 
        ? '/api/admin/sequences'
        : `/api/admin/sequences?offer_slug=${filterOffer}`;
      
      const response = await fetch(url);

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
        console.error('[Admin Sequences] Failed to fetch sequences:', response.status);
        setLoading(false);
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('[Admin Sequences] JSON parse error:', parseError);
        setError('응답 처리 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      if (result.success && Array.isArray(result.data)) {
        setSequences(result.data);
      } else {
        const errorMessage = result.error || '시퀀스를 불러오는데 실패했습니다.';
        setError(errorMessage);
        console.error('[Admin Sequences] Failed to fetch sequences:', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '시퀀스를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('[Admin Sequences] Error fetching sequences:', error);
    } finally {
      setLoading(false);
    }
  }, [filterOffer]);

  const fetchOffers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/offers');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setOffers(result.data);
        }
      }
    } catch (error) {
      console.error('[Admin Sequences] Error fetching offers:', error);
    }
  }, []);

  useEffect(() => {
    fetchSequences();
    fetchOffers();
  }, [fetchSequences, fetchOffers]);

  const handleOpenCreateModal = () => {
    setFormData({
      offer_slug: filterOffer !== 'all' ? filterOffer : '',
      name: '',
      day_offset: 0,
      channel: 'email',
      subject: '',
      message: '',
      quiet_hour_start: 22,
      quiet_hour_end: 8,
      enabled: true,
    });
    setFormError(null);
    setShowCreateModal(true);
    setEditingSequence(null);
  };

  const handleOpenEditModal = (sequence: Sequence) => {
    setFormData({
      offer_slug: sequence.offer_slug,
      name: sequence.name,
      day_offset: sequence.day_offset,
      channel: sequence.channel,
      subject: sequence.subject || '',
      message: sequence.message,
      quiet_hour_start: sequence.quiet_hour_start,
      quiet_hour_end: sequence.quiet_hour_end,
      enabled: sequence.enabled,
    });
    setFormError(null);
    setEditingSequence(sequence);
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const url = editingSequence
        ? `/api/admin/sequences?id=${editingSequence.id}`
        : '/api/admin/sequences';
      const method = editingSequence ? 'PUT' : 'POST';

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
        alert(editingSequence ? '시퀀스가 성공적으로 수정되었습니다.' : '시퀀스가 성공적으로 생성되었습니다.');
        setShowCreateModal(false);
        setEditingSequence(null);
        fetchSequences();
      } else {
        setFormError(result.error || '시퀀스 저장에 실패했습니다.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setFormError('시퀀스 저장 중 오류가 발생했습니다: ' + errorMessage);
      console.error('Error saving sequence:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (sequenceId: number, sequenceName: string) => {
    if (!confirm(`정말로 "${sequenceName}" 시퀀스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/sequences?id=${sequenceId}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        alert('인증이 필요합니다. 페이지를 새로고침하고 로그인해주세요.');
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
        alert('시퀀스 삭제에 실패했습니다: ' + errorMessage);
        return;
      }

      const result = await response.json();
      if (result.success) {
        alert('시퀀스가 성공적으로 삭제되었습니다.');
        fetchSequences();
      } else {
        alert('시퀀스 삭제에 실패했습니다: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('Error deleting sequence:', error);
      alert('시퀀스 삭제 중 오류가 발생했습니다: ' + errorMessage);
    }
  };

  const getChannelBadge = (channel: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-semibold';
    if (channel === 'email') {
      return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200`;
    } else if (channel === 'sms') {
      return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200`;
    }
    return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
  };

  const filteredSequences = sequences.filter((seq) => {
    if (filterOffer === 'all') return true;
    return seq.offer_slug === filterOffer;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-text-light dark:text-text-dark">시퀀스 목록을 불러오는 중...</p>
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
              fetchSequences();
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
                시퀀스 관리
              </h1>
              <p className="text-text-light/70 dark:text-text-dark/70">
                리드 유입 후 자동 발송되는 메시지 시퀀스를 관리합니다.
              </p>
            </div>
            {activeTab === 'sequences' && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                새 시퀀스 생성
              </button>
            )}
          </div>

          {/* 탭 */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('sequences')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sequences'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                시퀀스 목록
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'logs'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                발송 로그 ({logsTotal})
              </button>
            </nav>
          </div>

          {activeTab === 'sequences' ? (
            <>
              {/* 필터 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center gap-4">
                  <label htmlFor="filter-offer" className="text-sm font-medium text-text-light dark:text-text-dark">
                    오퍼 필터:
                  </label>
                  <select
                    id="filter-offer"
                    value={filterOffer}
                    onChange={(e) => setFilterOffer(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">전체</option>
                    {offers.map((offer) => (
                      <option key={offer.id} value={offer.slug}>
                        {offer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 시퀀스 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {filteredSequences.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">시퀀스가 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  새 시퀀스를 생성하여 시작하세요.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    첫 시퀀스 생성
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        오퍼
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        발송일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        채널
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Quiet Hour
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSequences.map((sequence) => (
                      <tr key={sequence.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {sequence.offer_slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {sequence.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          D+{sequence.day_offset}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={getChannelBadge(sequence.channel)}>{sequence.channel}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            sequence.enabled
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {sequence.enabled ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {sequence.quiet_hour_start}시 ~ {sequence.quiet_hour_end}시
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(sequence)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                            aria-label={`${sequence.name} 수정`}
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(sequence.id, sequence.name)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                            aria-label={`${sequence.name} 삭제`}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </>
          ) : (
            <>
              {/* 로그 필터 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <label htmlFor="log-filter-status" className="text-sm font-medium text-text-light dark:text-text-dark">
                    상태 필터:
                  </label>
                  <select
                    id="log-filter-status"
                    value={logFilter.status || 'all'}
                    onChange={(e) => setLogFilter({ ...logFilter, status: e.target.value === 'all' ? undefined : e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">전체</option>
                    <option value="pending">대기 중</option>
                    <option value="sent">발송 완료</option>
                    <option value="failed">실패</option>
                    <option value="skipped">건너뜀</option>
                  </select>
                  <label htmlFor="log-filter-sequence" className="text-sm font-medium text-text-light dark:text-text-dark">
                    시퀀스 필터:
                  </label>
                  <select
                    id="log-filter-sequence"
                    value={logFilter.sequence_id || 'all'}
                    onChange={(e) => setLogFilter({ ...logFilter, sequence_id: e.target.value === 'all' ? undefined : e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">전체</option>
                    {sequences.map((seq) => (
                      <option key={seq.id} value={seq.id.toString()}>
                        {seq.name} ({seq.offer_slug})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={fetchLogs}
                    disabled={logsLoading}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {logsLoading ? '새로고침 중...' : '새로고침'}
                  </button>
                </div>
              </div>

              {/* 로그 목록 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {logsLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg text-text-light dark:text-text-dark">로그를 불러오는 중...</p>
                  </div>
                ) : logsError ? (
                  <div className="p-6 text-center">
                    <p className="text-red-600 dark:text-red-400">{logsError}</p>
                    <button
                      onClick={fetchLogs}
                      className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="p-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">로그가 없습니다</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      아직 발송된 시퀀스가 없습니다.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            시퀀스
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            리드
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            채널
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            예약 시간
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            발송 시간
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            상태
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            작업
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {log.sequence_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {log.offer_slug}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {log.lead_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {log.channel === 'email' ? log.lead_email : log.lead_phone}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={getChannelBadge(log.channel)}>{log.channel}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(log.scheduled_at).toLocaleString('ko-KR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {log.sent_at ? new Date(log.sent_at).toLocaleString('ko-KR') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                log.status === 'sent'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                                  : log.status === 'failed'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                                  : log.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {log.status === 'sent' ? '발송 완료' :
                                 log.status === 'failed' ? '실패' :
                                 log.status === 'pending' ? '대기 중' : '건너뜀'}
                              </span>
                              {log.error_message && (
                                <div className="mt-1 text-xs text-red-600 dark:text-red-400" title={log.error_message}>
                                  {log.error_message.substring(0, 50)}...
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {log.status === 'failed' && (
                                <button
                                  onClick={() => handleResend(log.id)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                  aria-label="재발송"
                                >
                                  재발송
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
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
                    {editingSequence ? '시퀀스 수정' : '새 시퀀스 생성'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingSequence(null);
                      setFormError(null);
                    }}
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
                  {/* 오퍼 선택 */}
                  <div>
                    <label htmlFor="offer_slug" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      오퍼 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="offer_slug"
                      required
                      value={formData.offer_slug || ''}
                      onChange={(e) => setFormData({ ...formData, offer_slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">선택하세요</option>
                      {offers.map((offer) => (
                        <option key={offer.id} value={offer.slug}>
                          {offer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 시퀀스 이름 */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      시퀀스 이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="예: 환영 이메일"
                    />
                  </div>

                  {/* 발송일 및 채널 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="day_offset" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        발송일 (D+N) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="day_offset"
                        type="number"
                        required
                        min="0"
                        value={formData.day_offset || 0}
                        onChange={(e) => setFormData({ ...formData, day_offset: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        리드 생성 후 N일째에 발송됩니다. (0 = 당일)
                      </p>
                    </div>
                    <div>
                      <label htmlFor="channel" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        채널 <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="channel"
                        required
                        value={formData.channel || 'email'}
                        onChange={(e) => setFormData({ ...formData, channel: e.target.value as 'email' | 'sms' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="email">이메일</option>
                        <option value="sms">SMS</option>
                      </select>
                    </div>
                  </div>

                  {/* 이메일 제목 (이메일인 경우) */}
                  {formData.channel === 'email' && (
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        이메일 제목
                      </label>
                      <input
                        id="subject"
                        type="text"
                        value={formData.subject || ''}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="예: [인슈랑] 환영합니다!"
                      />
                    </div>
                  )}

                  {/* 메시지 내용 */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      메시지 내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      required
                      value={formData.message || ''}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="메시지 내용을 입력하세요..."
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formData.channel === 'sms' ? 'SMS는 90바이트(약 45자)를 권장합니다.' : '이메일은 HTML 형식을 지원합니다.'}
                    </p>
                  </div>

                  {/* Quiet Hour */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="quiet_hour_start" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Quiet Hour 시작 시간
                      </label>
                      <input
                        id="quiet_hour_start"
                        type="number"
                        min="0"
                        max="23"
                        value={formData.quiet_hour_start || 22}
                        onChange={(e) => setFormData({ ...formData, quiet_hour_start: parseInt(e.target.value) || 22 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="quiet_hour_end" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Quiet Hour 종료 시간
                      </label>
                      <input
                        id="quiet_hour_end"
                        type="number"
                        min="0"
                        max="23"
                        value={formData.quiet_hour_end || 8}
                        onChange={(e) => setFormData({ ...formData, quiet_hour_end: parseInt(e.target.value) || 8 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Quiet Hour 동안에는 메시지가 발송되지 않으며, 종료 시간 이후로 자동 재스케줄됩니다.
                  </p>

                  {/* 활성화 상태 */}
                  <div className="flex items-center">
                    <input
                      id="enabled"
                      type="checkbox"
                      checked={formData.enabled !== false}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="enabled" className="ml-2 text-sm font-medium text-text-light dark:text-text-dark">
                      시퀀스 활성화
                    </label>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingSequence(null);
                      setFormError(null);
                    }}
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
                      editingSequence ? '수정' : '생성'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

