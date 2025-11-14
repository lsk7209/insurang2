'use client';

import { useState, useEffect } from 'react';

interface Settings {
  // SMTP 설정
  smtp_host: string;
  smtp_port: string;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  
  // 솔라피 API 설정
  solapi_api_key: string;
  solapi_api_secret: string;
  solapi_sender_phone: string;
}

/**
 * Admin Settings Page
 * 관리자 설정 페이지
 * Tailwind CSS 기반
 */
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: false,
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
    solapi_api_key: '',
    solapi_api_secret: '',
    solapi_sender_phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoadError(null);
        const response = await fetch('/api/admin/settings');
        
        if (response.status === 401) {
          setLoadError('인증이 필요합니다. 페이지를 새로고침하고 로그인해주세요.');
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
          setLoadError(errorMessage);
          console.error('Failed to load settings:', response.status);
          return;
        }

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          setLoadError('응답 처리 중 오류가 발생했습니다.');
          return;
        }
        
        if (result.success && result.data) {
          setSettings(result.data);
        } else {
          setLoadError(result.error || '설정을 불러오는데 실패했습니다.');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '설정을 불러오는데 실패했습니다.';
        setLoadError(errorMessage);
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (field: keyof Settings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'smtp_secure' ? event.target.checked : event.target.value;
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.status === 401) {
        setSaveError('인증이 필요합니다. 페이지를 새로고침하고 로그인해주세요.');
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
        setSaveError(errorMessage);
        setLoading(false);
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setSaveError('응답 처리 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.error || '설정 저장에 실패했습니다.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '설정 저장 중 오류가 발생했습니다.';
      setSaveError(errorMessage);
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 헤더 */}
          <div>
            <h1 className="text-4xl font-bold text-text-light dark:text-text-dark mb-2">
              설정 관리
            </h1>
            <p className="text-text-light/70 dark:text-text-dark/70">
              SMTP 및 API 키 등 시스템 설정을 관리합니다.
            </p>
          </div>

          {/* 성공/에러 메시지 */}
          {loadError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{loadError}</p>
            </div>
          )}
          {saveSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center justify-between">
              <p className="text-green-800 dark:text-green-200">설정이 성공적으로 저장되었습니다.</p>
              <button
                onClick={() => setSaveSuccess(false)}
                className="text-green-800 dark:text-green-200 hover:text-green-900 dark:hover:text-green-100"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {saveError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
              <p className="text-red-800 dark:text-red-200">{saveError}</p>
              <button
                onClick={() => setSaveError(null)}
                className="text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* SMTP 설정 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="text-primary">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">
                    SMTP 설정
                  </h2>
                  <p className="text-sm text-text-light/70 dark:text-text-dark/70">
                    이메일 발송을 위한 SMTP 서버 설정
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="smtp_host" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    SMTP 호스트 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="smtp_host"
                    name="smtp_host"
                    type="text"
                    value={settings.smtp_host}
                    onChange={handleChange('smtp_host')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="smtp.example.com"
                    required
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    예: smtp.gmail.com, smtp.naver.com
                  </p>
                </div>
                <div>
                  <label htmlFor="smtp_port" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    SMTP 포트 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="smtp_port"
                    name="smtp_port"
                    type="number"
                    value={settings.smtp_port}
                    onChange={handleChange('smtp_port')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    일반: 587, SSL: 465
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.smtp_secure}
                      onChange={handleChange('smtp_secure')}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-text-light dark:text-text-dark">
                      SSL/TLS 사용 (포트 465인 경우 활성화)
                    </span>
                  </label>
                </div>
                <div>
                  <label htmlFor="smtp_user" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    SMTP 사용자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="smtp_user"
                    name="smtp_user"
                    type="email"
                    value={settings.smtp_user}
                    onChange={handleChange('smtp_user')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="your-email@example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="smtp_pass" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    SMTP 비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="smtp_pass"
                    name="smtp_pass"
                    type="password"
                    value={settings.smtp_pass}
                    onChange={handleChange('smtp_pass')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    Gmail의 경우 앱 비밀번호 사용
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="smtp_from" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    발신자 이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="smtp_from"
                    name="smtp_from"
                    type="email"
                    value={settings.smtp_from}
                    onChange={handleChange('smtp_from')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="noreply@example.com"
                    required
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    수신자에게 표시될 발신자 이메일 주소
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 솔라피 API 설정 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="text-yellow-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">
                    솔라피 API 설정
                  </h2>
                  <p className="text-sm text-text-light/70 dark:text-text-dark/70">
                    SMS 발송을 위한 솔라피 API 키 설정
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="solapi_api_key" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="solapi_api_key"
                    name="solapi_api_key"
                    type="text"
                    value={settings.solapi_api_key}
                    onChange={handleChange('solapi_api_key')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="NCSAYU7YDBXYORXC"
                    required
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    솔라피 콘솔에서 발급받은 API Key
                  </p>
                </div>
                <div>
                  <label htmlFor="solapi_api_secret" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    API Secret <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="solapi_api_secret"
                    name="solapi_api_secret"
                    type="password"
                    value={settings.solapi_api_secret}
                    onChange={handleChange('solapi_api_secret')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="API Secret"
                    required
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    솔라피 콘솔에서 발급받은 API Secret
                  </p>
                </div>
                <div>
                  <label htmlFor="solapi_sender_phone" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    발신자 번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="solapi_sender_phone"
                    name="solapi_sender_phone"
                    type="tel"
                    value={settings.solapi_sender_phone}
                    onChange={handleChange('solapi_sender_phone')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="01012345678"
                    required
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    SMS 발송 시 사용될 발신자 전화번호 (하이픈 없이 입력)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  저장 중...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  설정 저장
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
