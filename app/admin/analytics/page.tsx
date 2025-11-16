'use client';

import { useEffect, useState, useCallback } from 'react';

interface TrafficData {
  totalViews: number;
  uniqueSessions: number;
  pageViews: Array<{ page_path: string; views: number; unique_visitors: number }>;
  dailyTraffic: Array<{ date: string; views: number; unique_visitors: number }>;
  offerTraffic: Array<{ offer_slug: string; views: number; unique_visitors: number }>;
}

interface FunnelData {
  funnelSteps: Array<{ event_type: string; sessions: number; events: number }>;
  sessionFunnels: Array<{ session_id: string; funnel_path: string; steps_completed: number; last_event_at: string }>;
  conversionRates: {
    pageViewToFormStart: number;
    formStartToSubmit: number;
    formSubmitToThankYou: number;
    overall: number;
  };
  counts: {
    pageViews: number;
    formStarts: number;
    formSubmits: number;
    thankYous: number;
  };
}

/**
 * Admin Analytics Page
 * 관리자 트래픽 통계 및 퍼널 분석 페이지
 * Tailwind CSS 기반
 */

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'traffic' | 'funnel'>('traffic');
  const [period, setPeriod] = useState<string>('7d');
  const [offerSlug, setOfferSlug] = useState<string>('all');
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrafficData = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      params.append('type', 'traffic');
      params.append('period', period);
      if (offerSlug !== 'all') params.append('offer_slug', offerSlug);

      const response = await fetch(`/api/admin/analytics?${params.toString()}`);

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
        setLoading(false);
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('[Admin Analytics] JSON parse error:', parseError);
        setError('응답 처리 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      if (result.success && result.data) {
        setTrafficData(result.data);
      } else {
        const errorMessage = result.error || '트래픽 데이터를 불러오는데 실패했습니다.';
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '트래픽 데이터를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('[Admin Analytics] Error fetching traffic data:', error);
    } finally {
      setLoading(false);
    }
  }, [period, offerSlug]);

  const fetchFunnelData = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      params.append('type', 'funnel');
      params.append('period', period);
      if (offerSlug !== 'all') params.append('offer_slug', offerSlug);

      const response = await fetch(`/api/admin/analytics?${params.toString()}`);

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
        setLoading(false);
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('[Admin Analytics] JSON parse error:', parseError);
        setError('응답 처리 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      if (result.success && result.data) {
        setFunnelData(result.data);
      } else {
        const errorMessage = result.error || '퍼널 데이터를 불러오는데 실패했습니다.';
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '퍼널 데이터를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('[Admin Analytics] Error fetching funnel data:', error);
    } finally {
      setLoading(false);
    }
  }, [period, offerSlug]);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'traffic') {
      fetchTrafficData();
    } else {
      fetchFunnelData();
    }
  }, [activeTab, fetchTrafficData, fetchFunnelData]);

  if (loading && !trafficData && !funnelData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-text-light dark:text-text-dark">데이터를 불러오는 중...</p>
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
                트래픽 통계 & 퍼널 분석
              </h1>
              <p className="text-text-light/70 dark:text-text-dark/70">
                사이트 방문자 통계와 전환 퍼널을 분석합니다.
              </p>
            </div>
          </div>

          {/* 필터 및 탭 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center gap-4 flex-wrap mb-4">
              <label htmlFor="period" className="text-sm font-medium text-text-light dark:text-text-dark">
                기간:
              </label>
              <select
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="1d">최근 1일</option>
                <option value="7d">최근 7일</option>
                <option value="30d">최근 30일</option>
                <option value="all">전체</option>
              </select>
              <label htmlFor="offer-slug" className="text-sm font-medium text-text-light dark:text-text-dark">
                오퍼:
              </label>
              <select
                id="offer-slug"
                value={offerSlug}
                onChange={(e) => setOfferSlug(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="workbook">워크북</option>
              </select>
            </div>

            {/* 탭 */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('traffic')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'traffic'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  트래픽 통계
                </button>
                <button
                  onClick={() => setActiveTab('funnel')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'funnel'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  퍼널 분석
                </button>
              </nav>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {activeTab === 'traffic' && trafficData && (
            <div className="space-y-6">
              {/* 요약 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">총 페이지뷰</h3>
                  <p className="text-3xl font-bold text-primary">{trafficData.totalViews.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">고유 세션</h3>
                  <p className="text-3xl font-bold text-primary">{trafficData.uniqueSessions.toLocaleString()}</p>
                </div>
              </div>

              {/* 일별 트래픽 추이 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4">일별 트래픽 추이</h3>
                <div className="space-y-2">
                  {trafficData.dailyTraffic.map((day) => {
                    const maxViews = Math.max(...trafficData.dailyTraffic.map(d => d.views), 1);
                    const percentage = (day.views / maxViews) * 100;
                    
                    return (
                      <div key={day.date} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200">
                            {day.views} ({day.unique_visitors}명)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 페이지별 뷰 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4">페이지별 뷰</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">페이지</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">뷰</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">고유 방문자</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {trafficData.pageViews.map((page) => (
                        <tr key={page.page_path} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {page.page_path}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {page.views.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {page.unique_visitors.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'funnel' && funnelData && (
            <div className="space-y-6">
              {/* 전환율 요약 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-medium text-text-light/70 dark:text-text-dark/70 mb-1">페이지뷰 → 폼 시작</h3>
                  <p className="text-2xl font-bold text-primary">{funnelData.conversionRates.pageViewToFormStart.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {funnelData.counts.formStarts} / {funnelData.counts.pageViews}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-medium text-text-light/70 dark:text-text-dark/70 mb-1">폼 시작 → 제출</h3>
                  <p className="text-2xl font-bold text-primary">{funnelData.conversionRates.formStartToSubmit.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {funnelData.counts.formSubmits} / {funnelData.counts.formStarts}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-medium text-text-light/70 dark:text-text-dark/70 mb-1">제출 → 감사 페이지</h3>
                  <p className="text-2xl font-bold text-primary">{funnelData.conversionRates.formSubmitToThankYou.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {funnelData.counts.thankYous} / {funnelData.counts.formSubmits}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-medium text-text-light/70 dark:text-text-dark/70 mb-1">전체 전환율</h3>
                  <p className="text-2xl font-bold text-primary">{funnelData.conversionRates.overall.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {funnelData.counts.thankYous} / {funnelData.counts.pageViews}
                  </p>
                </div>
              </div>

              {/* 퍼널 시각화 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4">퍼널 단계별 전환</h3>
                <div className="space-y-4">
                  {[
                    { label: '페이지뷰', count: funnelData.counts.pageViews, color: 'bg-blue-500' },
                    { label: '폼 시작', count: funnelData.counts.formStarts, color: 'bg-yellow-500' },
                    { label: '폼 제출', count: funnelData.counts.formSubmits, color: 'bg-orange-500' },
                    { label: '감사 페이지', count: funnelData.counts.thankYous, color: 'bg-green-500' },
                  ].map((step, index, array) => {
                    const maxCount = array[0].count;
                    const percentage = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
                    const prevStep = index > 0 ? array[index - 1] : null;
                    const conversionRate = prevStep && prevStep.count > 0 
                      ? ((step.count / prevStep.count) * 100).toFixed(1)
                      : null;

                    return (
                      <div key={step.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text-light dark:text-text-dark">{step.label}</span>
                          <div className="flex items-center gap-4">
                            {conversionRate && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                전환율: {conversionRate}%
                              </span>
                            )}
                            <span className="text-sm font-semibold text-text-light dark:text-text-dark">
                              {step.count.toLocaleString()}명
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative overflow-hidden">
                          <div
                            className={`h-full ${step.color} rounded-full transition-all flex items-center justify-end pr-2`}
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 10 && (
                              <span className="text-xs font-medium text-white">
                                {percentage.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 퍼널 단계별 상세 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4">퍼널 단계별 상세</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">이벤트 타입</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">세션 수</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">이벤트 수</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {funnelData.funnelSteps.map((step) => (
                        <tr key={step.event_type} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {step.event_type === 'page_view' ? '페이지뷰' :
                             step.event_type === 'form_start' ? '폼 시작' :
                             step.event_type === 'form_submit' ? '폼 제출' :
                             step.event_type === 'thank_you' ? '감사 페이지' :
                             step.event_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {step.sessions.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {step.events.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

