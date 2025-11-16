-- InsuranceGPT Offer Funnel MVP Database Schema
-- Cloudflare D1 전용 (SQLite 기반)

-- Offers 테이블 (확장)
CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT, -- SEO용 제목 (name과 다를 수 있음)
  description TEXT,
  thumbnail TEXT, -- 썸네일 이미지 URL
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'inactive'
  download_link TEXT,
  json_ld TEXT, -- JSON-LD 구조화 데이터 (JSON 문자열)
  ab_test_variant TEXT DEFAULT 'A', -- A/B 테스트 변형 ('A' 또는 'B')
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leads 테이블
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  organization TEXT,
  consent_privacy INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true
  consent_marketing INTEGER DEFAULT 0, -- 0 = false, 1 = true
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_slug) REFERENCES offers(slug)
);

-- Message Logs 테이블
CREATE TABLE IF NOT EXISTS message_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  channel TEXT NOT NULL, -- 'email' or 'sms'
  status TEXT NOT NULL, -- 'success' or 'failed'
  error_message TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Rate Limit Logs 테이블 (Rate Limiting용)
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT NOT NULL, -- IP 주소 또는 클라이언트 식별자
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Error Logs 테이블 (에러 로깅용)
CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL, -- 'error', 'warn', 'info'
  message TEXT NOT NULL,
  context TEXT, -- JSON 형식의 추가 컨텍스트
  stack TEXT, -- 에러 스택 트레이스
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Offer Metrics 테이블 (오퍼별 KPI 추적)
CREATE TABLE IF NOT EXISTS offer_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'all'
  period_date TEXT, -- 날짜 (YYYY-MM-DD) 또는 NULL (all의 경우)
  views INTEGER DEFAULT 0, -- 조회수
  leads INTEGER DEFAULT 0, -- 리드 수
  conversions INTEGER DEFAULT 0, -- 전환 수 (예: 다운로드 완료)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_id) REFERENCES offers(id),
  UNIQUE(offer_id, period, period_date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_leads_offer_slug ON leads(offer_slug);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_message_logs_lead_id ON message_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_channel ON message_logs(channel);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_identifier ON rate_limit_logs(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_at ON rate_limit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_slug ON offers(slug);
CREATE INDEX IF NOT EXISTS idx_offer_metrics_offer_id ON offer_metrics(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_metrics_period ON offer_metrics(period, period_date);

-- 초기 오퍼 데이터 (예시)
INSERT OR IGNORE INTO offers (slug, name, title, description, status, download_link, ab_test_variant) 
VALUES (
  'workbook',
  'AI 상담 워크북',
  'AI 상담 워크북 - 보험설계사를 위한 무료 가이드',
  '보험설계사를 위한 AI 상담 워크북 무료 제공',
  'active',
  'https://example.com/workbook.pdf',
  'A'
);

