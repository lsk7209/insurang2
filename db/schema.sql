-- InsuranceGPT Offer Funnel MVP Database Schema
-- Cloudflare D1 전용 (SQLite 기반)

-- Offers 테이블
CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  download_link TEXT,
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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_leads_offer_slug ON leads(offer_slug);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_message_logs_lead_id ON message_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_channel ON message_logs(channel);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_identifier ON rate_limit_logs(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_at ON rate_limit_logs(created_at);

-- 초기 오퍼 데이터 (예시)
INSERT OR IGNORE INTO offers (slug, name, description, status, download_link) 
VALUES (
  'workbook',
  'AI 상담 워크북',
  '보험설계사를 위한 AI 상담 워크북 무료 제공',
  'active',
  'https://example.com/workbook.pdf'
);

