'use client';

import { useEffect, useState, useCallback } from 'react';

interface Booking {
  id: number;
  lead_id: number;
  consultant_name: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
}

/**
 * Admin Bookings Page
 * 관리자 코칭 예약 관리 페이지
 * Tailwind CSS 기반
 */

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState<Partial<Booking>>({
    lead_id: 0,
    consultant_name: '',
    scheduled_at: '',
    duration_minutes: 30,
    notes: '',
    status: 'pending',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      const url = filterStatus === 'all' 
        ? '/api/admin/bookings'
        : `/api/admin/bookings?status=${filterStatus}`;
      
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
        console.error('[Admin Bookings] Failed to fetch bookings:', response.status);
        setLoading(false);
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('[Admin Bookings] JSON parse error:', parseError);
        setError('응답 처리 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      if (result.success && Array.isArray(result.data)) {
        setBookings(result.data);
      } else {
        const errorMessage = result.error || '예약을 불러오는데 실패했습니다.';
        setError(errorMessage);
        console.error('[Admin Bookings] Failed to fetch bookings:', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '예약을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('[Admin Bookings] Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const fetchLeads = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/leads');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setLeads(result.data);
        }
      }
    } catch (error) {
      console.error('[Admin Bookings] Error fetching leads:', error);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchLeads();
  }, [fetchBookings, fetchLeads]);

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingBooking(null);
    setFormData({
      lead_id: 0,
      consultant_name: '',
      scheduled_at: '',
      duration_minutes: 30,
      notes: '',
      status: 'pending',
    });
    setFormError(null);
  };

  const handleOpenCreateModal = () => {
    setFormData({
      lead_id: 0,
      consultant_name: '',
      scheduled_at: '',
      duration_minutes: 30,
      notes: '',
      status: 'pending',
    });
    setFormError(null);
    setShowCreateModal(true);
    setEditingBooking(null);
  };

  const handleOpenEditModal = (booking: Booking) => {
    setFormData({
      lead_id: booking.lead_id,
      consultant_name: booking.consultant_name,
      scheduled_at: booking.scheduled_at.substring(0, 16), // datetime-local 형식
      duration_minutes: booking.duration_minutes,
      notes: booking.notes || '',
      status: booking.status,
    });
    setFormError(null);
    setEditingBooking(booking);
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    // 필수 필드 검증
    if (!formData.lead_id || !formData.consultant_name || !formData.scheduled_at) {
      setFormError('리드, 상담사명, 예약 일시는 필수 입력 항목입니다.');
      setFormLoading(false);
      return;
    }

    try {
      const url = editingBooking
        ? `/api/admin/bookings?id=${editingBooking.id}`
        : '/api/admin/bookings';
      const method = editingBooking ? 'PUT' : 'POST';

      // datetime-local 형식을 ISO 형식으로 변환
      const scheduledAtISO = formData.scheduled_at 
        ? new Date(formData.scheduled_at).toISOString()
        : '';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          scheduled_at: scheduledAtISO,
        }),
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
        alert(editingBooking ? '예약이 성공적으로 수정되었습니다.' : '예약이 성공적으로 생성되었습니다.');
        handleCloseModal();
        fetchBookings();
      } else {
        setFormError(result.error || '예약 저장에 실패했습니다.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setFormError('예약 저장 중 오류가 발생했습니다: ' + errorMessage);
      console.error('Error saving booking:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (bookingId: number) => {
    if (!confirm('정말로 이 예약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/bookings?id=${bookingId}`, {
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
        alert('예약 삭제에 실패했습니다: ' + errorMessage);
        return;
      }

      const result = await response.json();
      if (result.success) {
        alert('예약이 성공적으로 삭제되었습니다.');
        fetchBookings();
      } else {
        alert('예약 삭제에 실패했습니다: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('Error deleting booking:', error);
      alert('예약 삭제 중 오류가 발생했습니다: ' + errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-semibold';
    if (status === 'confirmed') {
      return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200`;
    } else if (status === 'completed') {
      return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200`;
    } else if (status === 'cancelled') {
      return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200`;
    }
    return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200`;
  };

  const getLeadName = (leadId: number) => {
    const lead = leads.find((l) => l.id === leadId);
    return lead ? lead.name : `리드 #${leadId}`;
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-text-light dark:text-text-dark">예약 목록을 불러오는 중...</p>
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
              fetchBookings();
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
                코칭 예약 관리
              </h1>
              <p className="text-text-light/70 dark:text-text-dark/70">
                리드와의 코칭 상담 예약을 관리합니다.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 예약 생성
            </button>
          </div>

          {/* 필터 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center gap-4">
              <label htmlFor="filter-status" className="text-sm font-medium text-text-light dark:text-text-dark">
                상태 필터:
              </label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="pending">대기 중</option>
                <option value="confirmed">확정</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
          </div>

          {/* 예약 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {filteredBookings.length === 0 ? (
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">예약이 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  새 예약을 생성하여 시작하세요.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    첫 예약 생성
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        리드
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        상담사
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        예약 일시
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        상담 시간
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
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {getLeadName(booking.lead_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {booking.consultant_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(booking.scheduled_at).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {booking.duration_minutes}분
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={getStatusBadge(booking.status)}>
                            {booking.status === 'pending' ? '대기 중' :
                             booking.status === 'confirmed' ? '확정' :
                             booking.status === 'completed' ? '완료' : '취소'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(booking)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                            aria-label="예약 수정"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                            aria-label="예약 삭제"
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
        </div>
      </div>

      {/* 생성/수정 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
                    {editingBooking ? '예약 수정' : '새 예약 생성'}
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
                  {/* 리드 선택 */}
                  <div>
                    <label htmlFor="lead_id" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      리드 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="lead_id"
                      required
                      value={formData.lead_id || 0}
                      onChange={(e) => setFormData({ ...formData, lead_id: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="0">선택하세요</option>
                      {leads.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.name} ({lead.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 상담사 이름 */}
                  <div>
                    <label htmlFor="consultant_name" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      상담사 이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="consultant_name"
                      type="text"
                      required
                      value={formData.consultant_name || ''}
                      onChange={(e) => setFormData({ ...formData, consultant_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="예: 홍길동"
                    />
                  </div>

                  {/* 예약 일시 및 상담 시간 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="scheduled_at" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        예약 일시 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="scheduled_at"
                        type="datetime-local"
                        required
                        value={formData.scheduled_at || ''}
                        onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="duration_minutes" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        상담 시간 (분) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="duration_minutes"
                        type="number"
                        required
                        min="15"
                        step="15"
                        value={formData.duration_minutes || 30}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* 상태 (수정 시에만) */}
                  {editingBooking && (
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        상태
                      </label>
                      <select
                        id="status"
                        value={formData.status || 'pending'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="pending">대기 중</option>
                        <option value="confirmed">확정</option>
                        <option value="completed">완료</option>
                        <option value="cancelled">취소</option>
                      </select>
                    </div>
                  )}

                  {/* 메모 */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      메모
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="예약 관련 메모를 입력하세요..."
                    />
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingBooking(null);
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
                      editingBooking ? '수정' : '생성'
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

