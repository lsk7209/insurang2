/**
 * 클라이언트 사이드 추적 유틸리티
 * 페이지뷰 및 퍼널 이벤트 추적
 */

/**
 * 세션 ID 생성 또는 가져오기
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  const STORAGE_KEY = 'insurang_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    // UUID v4 생성 (간단한 버전)
    sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem(STORAGE_KEY, sessionId);
  }

  return sessionId;
}

/**
 * 페이지뷰 추적
 */
export async function trackPageView(pagePath: string, offerSlug?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const sessionId = getOrCreateSessionId();
    const referrer = document.referrer || undefined;
    const userAgent = navigator.userAgent;

    await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'page_view',
        session_id: sessionId,
        page_path: pagePath,
        referrer,
        user_agent: userAgent,
        offer_slug: offerSlug,
      }),
    });
  } catch (error) {
    console.error('[Tracking] Failed to track page view:', error);
  }
}

/**
 * 퍼널 이벤트 추적
 */
export async function trackFunnelEvent(
  eventType: 'form_start' | 'form_submit' | 'thank_you' | 'download',
  pagePath: string,
  offerSlug?: string,
  leadId?: number,
  metadata?: Record<string, any>
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const sessionId = getOrCreateSessionId();

    await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'funnel_event',
        session_id: sessionId,
        page_path: pagePath,
        event_type: eventType,
        offer_slug: offerSlug,
        lead_id: leadId,
        metadata,
      }),
    });
  } catch (error) {
    console.error('[Tracking] Failed to track funnel event:', error);
  }
}

