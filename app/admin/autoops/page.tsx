'use client';

import { useEffect, useState, useCallback } from 'react';

interface MonitoringData {
  cronStatus: {
    status: string;
    lastChecked: string;
    recentErrors?: number;
    error?: string;
  };
  queueBacklog: {
    pending: number;
    overdue: number;
    status: string;
    error?: string;
  };
  errorCount: {
    errors: number;
    warnings: number;
    status: string;
    error?: string;
  };
  leadTrend: {
    days: Array<{ date: string; count: number }>;
    total: number;
    average: number;
    today: number;
    trend: string;
    error?: string;
  };
  sequenceSuccessRate: {
    total: number;
    sent: number;
    failed: number;
    successRate: number;
    status: string;
    error?: string;
  };
  timestamp: string;
}

/**
 * Admin AutoOps Page
 * 관리자 AutoOps 모니터링 페이지
 * Tailwind CSS 기반
 */

export default function AdminAutoOpsPage() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitoringData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/autoops');

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
        console.error('[Admin AutoOps] Failed to fetch monitoring data:', response.status);
        setLoading(false);
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('[Admin AutoOps] JSON parse error:', parseError);
        setError('응답 처리 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      if (result.success && result.data) {
        setMonitoringData(result.data);
      } else {
        const errorMessage = result.error || '모니터링 데이터를 불러오는데 실패했습니다.';
        setError(errorMessage);
        console.error('[Admin AutoOps] Failed to fetch monitoring data:', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '모니터링 데이터를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('[Admin AutoOps] Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoringData();

    // 자동 새로고침 (30초마다)
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMonitoringData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [fetchMonitoringData, autoRefresh]);

  const getStatusColor = (status: string) => {
    if (status === 'ok') {
      return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-200';
    } else if (status === 'warning') {
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-200';
    } else if (status === 'error') {
      return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-200';
    }
    return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-200';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'ok') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (status === 'warning') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  if (loading && !monitoringData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-text-light dark:text-text-dark">모니터링 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !monitoringData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-4">오류 발생</h2>
          <p className="text-red-700 dark:text-red-300 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchMonitoringData();
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
                AutoOps 모니터링
              </h1>
              <p className="text-text-light/70 dark:text-text-dark/70">
                시스템 상태를 실시간으로 모니터링합니다.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-text-light dark:text-text-dark">자동 새로고침 (30초)</span>
              </label>
              <button
                onClick={fetchMonitoringData}
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '새로고침 중...' : '새로고침'}
              </button>
            </div>
          </div>

          {monitoringData && (
            <>
              {/* 상태 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cron 상태 */}
                <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${getStatusColor(monitoringData.cronStatus.status)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Cron 상태</h3>
                    {getStatusIcon(monitoringData.cronStatus.status)}
                  </div>
                  {monitoringData.cronStatus.error ? (
                    <p className="text-sm">{monitoringData.cronStatus.error}</p>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold mb-1">
                        {monitoringData.cronStatus.recentErrors || 0}
                      </p>
                      <p className="text-sm opacity-75">최근 1시간 에러</p>
                    </div>
                  )}
                </div>

                {/* Queue 백로그 */}
                <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${getStatusColor(monitoringData.queueBacklog.status)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Queue 백로그</h3>
                    {getStatusIcon(monitoringData.queueBacklog.status)}
                  </div>
                  {monitoringData.queueBacklog.error ? (
                    <p className="text-sm">{monitoringData.queueBacklog.error}</p>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold mb-1">
                        {monitoringData.queueBacklog.pending}
                      </p>
                      <p className="text-sm opacity-75">
                        대기 중 ({monitoringData.queueBacklog.overdue}개 지연)
                      </p>
                    </div>
                  )}
                </div>

                {/* 에러 카운트 */}
                <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${getStatusColor(monitoringData.errorCount.status)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">에러 카운트</h3>
                    {getStatusIcon(monitoringData.errorCount.status)}
                  </div>
                  {monitoringData.errorCount.error ? (
                    <p className="text-sm">{monitoringData.errorCount.error}</p>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold mb-1">
                        {monitoringData.errorCount.errors}
                      </p>
                      <p className="text-sm opacity-75">
                        에러 / {monitoringData.errorCount.warnings} 경고 (24시간)
                      </p>
                    </div>
                  )}
                </div>

                {/* 시퀀스 성공률 */}
                <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${getStatusColor(monitoringData.sequenceSuccessRate.status)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">시퀀스 성공률</h3>
                    {getStatusIcon(monitoringData.sequenceSuccessRate.status)}
                  </div>
                  {monitoringData.sequenceSuccessRate.error ? (
                    <p className="text-sm">{monitoringData.sequenceSuccessRate.error}</p>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold mb-1">
                        {monitoringData.sequenceSuccessRate.successRate.toFixed(1)}%
                      </p>
                      <p className="text-sm opacity-75">
                        {monitoringData.sequenceSuccessRate.sent}/{monitoringData.sequenceSuccessRate.total} 성공 (24시간)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 리드 트렌드 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">
                    리드 트렌드 (최근 7일)
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-text-light/70 dark:text-text-dark/70">
                      총: {monitoringData.leadTrend.total} | 평균: {monitoringData.leadTrend.average.toFixed(1)}/일
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      monitoringData.leadTrend.trend === 'up'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                        : monitoringData.leadTrend.trend === 'down'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {monitoringData.leadTrend.trend === 'up' ? '↑ 증가' :
                       monitoringData.leadTrend.trend === 'down' ? '↓ 감소' : '→ 유지'}
                    </span>
                  </div>
                </div>
                {monitoringData.leadTrend.error ? (
                  <p className="text-red-600 dark:text-red-400">{monitoringData.leadTrend.error}</p>
                ) : (
                  <div className="space-y-2">
                    {monitoringData.leadTrend.days.map((day, index) => {
                      const maxCount = Math.max(...monitoringData.leadTrend.days.map(d => d.count), 1);
                      const percentage = (day.count / maxCount) * 100;
                      const isToday = index === monitoringData.leadTrend.days.length - 1;
                      
                      return (
                        <div key={day.date} className="flex items-center gap-4">
                          <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            {isToday && <span className="ml-1 text-primary">(오늘)</span>}
                          </div>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isToday ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200">
                              {day.count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 마지막 업데이트 시간 */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                마지막 업데이트: {new Date(monitoringData.timestamp).toLocaleString('ko-KR')}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

