'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LeadListItem } from '@/types/api';

interface DashboardStats {
  totalLeads: number;
  todayLeads: number;
  emailSuccess: number;
  smsSuccess: number;
}

/**
 * Admin Dashboard Page
 * 관리자 대시보드 페이지
 * Tailwind CSS 기반
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    todayLeads: 0,
    emailSuccess: 0,
    smsSuccess: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const response = await fetch('/api/admin/leads');
        
        if (response.status === 401) {
          setError('인증이 필요합니다. 페이지를 새로고침하고 로그인해주세요.');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          const errorMessage = `서버 오류가 발생했습니다. (상태 코드: ${response.status})`;
          setError(errorMessage);
          console.error('[Admin Dashboard] Failed to fetch stats:', response.status);
          setLoading(false);
          return;
        }

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          console.error('[Admin Dashboard] JSON parse error:', parseError);
          setError('응답 처리 중 오류가 발생했습니다.');
          setLoading(false);
          return;
        }

        if (result.success && Array.isArray(result.data)) {
          const leads = result.data;
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const todayLeads = leads.filter((lead: LeadListItem) => {
            const leadDate = new Date(lead.created_at);
            leadDate.setHours(0, 0, 0, 0);
            return leadDate.getTime() === today.getTime();
          });

          const emailSuccess = leads.filter((lead: LeadListItem) => lead.email_status === 'success').length;
          const smsSuccess = leads.filter((lead: LeadListItem) => lead.sms_status === 'success').length;

          setStats({
            totalLeads: leads.length,
            todayLeads: todayLeads.length,
            emailSuccess,
            smsSuccess,
          });
          setResult(result);
        } else {
          setError('데이터 형식이 올바르지 않습니다.');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        setError(errorMessage);
        console.error('[Admin Dashboard] Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: '전체 리드',
      value: stats.totalLeads,
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: '오늘 신청',
      value: stats.todayLeads,
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '이메일 발송 성공',
      value: stats.emailSuccess,
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'SMS 발송 성공',
      value: stats.smsSuccess,
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 헤더 */}
          <div>
            <h1 className="text-4xl font-bold text-text-light dark:text-text-dark mb-2">
              대시보드
            </h1>
            <p className="text-text-light/70 dark:text-text-dark/70">
              전체 현황을 한눈에 확인하세요.
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-center space-x-4">
                  <div className={`${card.bgColor} ${card.color} p-3 rounded-lg`}>
                    {card.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-light/70 dark:text-text-dark/70 mb-1">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-text-light dark:text-text-dark">
                      {loading ? '...' : card.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 최근 리드 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">
                최근 리드
              </h2>
              <Link
                href="/admin/leads"
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                전체 보기 →
              </Link>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">로딩 중...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        이메일
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        오퍼
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        신청일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {(() => {
                      const recentLeads = Array.isArray(result?.data) ? result.data.slice(0, 5) : [];
                      return recentLeads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            최근 리드가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        recentLeads.map((lead: LeadListItem, index: number) => (
                          <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {lead.id}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {lead.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {lead.email}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {lead.offer_slug}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(lead.created_at).toLocaleDateString('ko-KR')}
                            </td>
                          </tr>
                        ))
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 빠른 링크 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4">
              빠른 링크
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/admin/leads"
                className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors no-underline"
              >
                <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-1">
                  리드 관리
                </h3>
                <p className="text-sm text-text-light/70 dark:text-text-dark/70">
                  신청 리드 목록 확인
                </p>
              </Link>
              <Link
                href="/admin/settings"
                className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors no-underline"
              >
                <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-1">
                  설정 관리
                </h3>
                <p className="text-sm text-text-light/70 dark:text-text-dark/70">
                  SMTP, API 키 등 설정
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
