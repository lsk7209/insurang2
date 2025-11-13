'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Admin Leads Page
 * 관리자 리드 목록 조회 페이지
 * Tailwind CSS 기반
 */
interface Lead {
  id: number;
  offer_slug: string;
  name: string;
  email: string;
  phone: string;
  organization: string | null;
  consent_privacy: boolean;
  consent_marketing: boolean;
  created_at: string;
  email_status: string;
  sms_status: string;
}

interface LeadDetail extends Lead {
  logs: Array<{
    id: number;
    channel: string;
    status: string;
    error_message: string | null;
    sent_at: string;
  }>;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/leads');
      const result = await response.json();

      if (result.success) {
        setLeads(result.data);
      } else {
        console.error('Failed to fetch leads:', result.error);
        alert('리드를 불러오는데 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      alert('리드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeadDetail = useCallback(async (leadId: number) => {
    try {
      const response = await fetch(`/api/admin/leads?id=${leadId}`);
      const result = await response.json();

      if (result.success) {
        setSelectedLead(result.data);
        setDetailOpen(true);
      }
    } catch (error) {
      console.error('Error fetching lead detail:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">리드 관리</h1>
          <p className="text-gray-600">총 {leads.length}건의 리드가 등록되었습니다.</p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    오퍼
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신청일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상세
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      등록된 리드가 없습니다.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
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
                          className="text-primary hover:text-primary-dark font-medium"
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailOpen && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">리드 상세 정보</h2>
                <button
                  onClick={() => setDetailOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
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
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
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
