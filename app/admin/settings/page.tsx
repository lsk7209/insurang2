'use client';

import { useState, useEffect } from 'react';

interface Settings {
  // SMTP 설정 (Cloudflare Workers에서는 사용 불가)
  smtp_host: string;
  smtp_port: string;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  
  // 이메일 서비스 API 키
  resend_api_key: string;
  sendgrid_api_key: string;
  
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
    resend_api_key: '',
    sendgrid_api_key: '',
    solapi_api_key: '',
    solapi_api_secret: '',
    solapi_sender_phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // 테스트 발송 상태
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testSmsLoading, setTestSmsLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);
  const [testSmsResult, setTestSmsResult] = useState<string | null>(null);

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
      // API Secret이 빈 문자열이거나 '***'인 경우, undefined로 전송 (서버에서 기존 값 유지)
      const saveData: Record<string, any> = { ...settings };
      if (!saveData.solapi_api_secret || saveData.solapi_api_secret === '***' || (typeof saveData.solapi_api_secret === 'string' && saveData.solapi_api_secret.trim() === '')) {
        delete saveData.solapi_api_secret; // 서버에서 기존 값 유지하도록 필드 제거
      }

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
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
        // 저장 성공 후 설정 다시 불러오기
        const loadResponse = await fetch('/api/admin/settings');
        if (loadResponse.ok) {
          const loadResult = await loadResponse.json();
          if (loadResult.success && loadResult.data) {
            setSettings(loadResult.data);
          }
        }
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

  // 테스트 이메일 발송
  const handleTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setTestEmailResult('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    setTestEmailLoading(true);
    setTestEmailResult(null);

    try {
      const response = await fetch('/api/admin/settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'email',
          email: testEmail,
        }),
      });

      if (response.status === 401) {
        setTestEmailResult('인증이 필요합니다. 페이지를 새로고침하고 로그인해주세요.');
        setTestEmailLoading(false);
        return;
      }

      const result = await response.json();
      if (result.success) {
        setTestEmailResult('✅ ' + (result.data?.message || '테스트 이메일이 발송되었습니다.'));
      } else {
        setTestEmailResult('❌ ' + (result.error || '이메일 발송에 실패했습니다.'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setTestEmailResult('❌ 이메일 발송 중 오류가 발생했습니다: ' + errorMessage);
    } finally {
      setTestEmailLoading(false);
    }
  };

  // 테스트 SMS 발송
  const handleTestSMS = async () => {
    if (!testPhone || testPhone.replace(/[^\d]/g, '').length < 10) {
      setTestSmsResult('올바른 전화번호를 입력해주세요.');
      return;
    }

    setTestSmsLoading(true);
    setTestSmsResult(null);

    try {
      const response = await fetch('/api/admin/settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'sms',
          phone: testPhone,
        }),
      });

      if (response.status === 401) {
        setTestSmsResult('인증이 필요합니다. 페이지를 새로고침하고 로그인해주세요.');
        setTestSmsLoading(false);
        return;
      }

      const result = await response.json();
      if (result.success) {
        setTestSmsResult('✅ ' + (result.data?.message || '테스트 SMS가 발송되었습니다.'));
      } else {
        setTestSmsResult('❌ ' + (result.error || 'SMS 발송에 실패했습니다.'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setTestSmsResult('❌ SMS 발송 중 오류가 발생했습니다: ' + errorMessage);
    } finally {
      setTestSmsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto">
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

          {/* 이메일 서비스 설정 */}
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
                    이메일 서비스 설정
                  </h2>
                  <p className="text-sm text-text-light/70 dark:text-text-dark/70">
                    Resend 또는 SendGrid API 키 설정 (Cloudflare Dashboard에서 환경 변수로 관리)
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 참고:</strong> 이메일/SMS 발송 설정은 Cloudflare Dashboard의 환경 변수에서 관리됩니다.
                  <br />
                  Pages 프로젝트 → Settings → Environment Variables에서 설정하세요.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="resend_api_key" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    Resend API Key
                  </label>
                  <input
                    id="resend_api_key"
                    name="resend_api_key"
                    type="text"
                    value={settings.resend_api_key || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none cursor-not-allowed font-mono text-sm"
                    placeholder="설정되지 않음"
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    Resend 서비스를 사용하는 경우 설정 (권장)
                  </p>
                </div>
                <div>
                  <label htmlFor="sendgrid_api_key" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    SendGrid API Key
                  </label>
                  <input
                    id="sendgrid_api_key"
                    name="sendgrid_api_key"
                    type="text"
                    value={settings.sendgrid_api_key || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none cursor-not-allowed font-mono text-sm"
                    placeholder="설정되지 않음"
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    SendGrid 서비스를 사용하는 경우 설정
                  </p>
                </div>
                <div>
                  <label htmlFor="smtp_from_readonly" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    발신자 이메일 (SMTP_FROM)
                  </label>
                  <input
                    id="smtp_from_readonly"
                    name="smtp_from"
                    type="email"
                    value={settings.smtp_from || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none cursor-not-allowed"
                    placeholder="noreply@example.com"
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    이메일 발송 시 사용될 발신자 이메일 주소
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SMTP 설정 (참고용 - Cloudflare Workers에서는 사용 불가) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 opacity-60">
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">
                    SMTP 설정 (사용 불가)
                  </h2>
                  <p className="text-sm text-text-light/70 dark:text-text-dark/70">
                    Cloudflare Workers에서는 직접 SMTP 연결을 지원하지 않습니다. Resend 또는 SendGrid API를 사용하세요.
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
                  <label htmlFor="smtp_from_editable" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    발신자 이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="smtp_from_editable"
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
                    SMS 서비스 설정 (솔라피)
                  </h2>
                  <p className="text-sm text-text-light/70 dark:text-text-dark/70">
                    SMS 발송을 위한 솔라피 API 키 설정 (환경설정에서 직접 입력)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="solapi_api_key" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    API Key
                  </label>
                  <input
                    id="solapi_api_key"
                    name="solapi_api_key"
                    type="text"
                    value={settings.solapi_api_key || ''}
                    onChange={handleChange('solapi_api_key')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                    placeholder="솔라피 API Key를 입력하세요"
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    솔라피 콘솔에서 발급받은 API Key
                  </p>
                </div>
                <div>
                  <label htmlFor="solapi_api_secret" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    API Secret
                  </label>
                  <input
                    id="solapi_api_secret"
                    name="solapi_api_secret"
                    type="password"
                    value={settings.solapi_api_secret === '***' ? '' : (settings.solapi_api_secret || '')}
                    onChange={handleChange('solapi_api_secret')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                    placeholder="솔라피 API Secret을 입력하세요"
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    솔라피 콘솔에서 발급받은 API Secret (보안상 마스킹됨)
                  </p>
                </div>
                <div>
                  <label htmlFor="solapi_sender_phone" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    발신자 번호
                  </label>
                  <input
                    id="solapi_sender_phone"
                    name="solapi_sender_phone"
                    type="tel"
                    value={settings.solapi_sender_phone || ''}
                    onChange={handleChange('solapi_sender_phone')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="01012345678"
                  />
                  <p className="mt-1 text-xs text-text-light/60 dark:text-text-dark/60">
                    SMS 발송 시 사용될 발신자 전화번호 (하이픈 없이 입력)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 테스트 발송 섹션 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="text-green-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">
                    테스트 발송
                  </h2>
                  <p className="text-sm text-text-light/70 dark:text-text-dark/70">
                    설정한 API 키로 테스트 이메일/SMS를 발송합니다
                  </p>
                </div>
              </div>

              {/* 이메일 테스트 */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="test-email" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    테스트 이메일 주소
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="test-email"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      onClick={handleTestEmail}
                      disabled={testEmailLoading || !testEmail}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {testEmailLoading ? '발송 중...' : '이메일 테스트'}
                    </button>
                  </div>
                  {testEmailResult && (
                    <p className={`mt-2 text-sm ${testEmailResult.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                      {testEmailResult}
                    </p>
                  )}
                </div>

                {/* SMS 테스트 */}
                <div>
                  <label htmlFor="test-phone" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    테스트 전화번호
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="test-phone"
                      type="tel"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="01012345678"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      onClick={handleTestSMS}
                      disabled={testSmsLoading || !testPhone}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                    >
                      {testSmsLoading ? '발송 중...' : 'SMS 테스트'}
                    </button>
                  </div>
                  {testSmsResult && (
                    <p className={`mt-2 text-sm ${testSmsResult.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                      {testSmsResult}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  설정 저장
                </>
              )}
            </button>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">설정 저장 안내</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  솔라피 API 설정은 위의 "설정 저장" 버튼을 클릭하여 데이터베이스에 저장됩니다.
                  <br />
                  이메일 서비스(Resend/SendGrid) 설정은 Cloudflare Dashboard의 환경 변수에서 관리됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
