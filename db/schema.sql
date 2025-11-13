-- InsuranceGPT Offer Funnel MVP Database Schema
-- Cloudflare D1 또는 Supabase Postgres용

-- Offers 테이블
CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  download_link VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leads 테이블
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_slug VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  organization VARCHAR(255),
  consent_privacy BOOLEAN NOT NULL DEFAULT 0,
  consent_marketing BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_slug) REFERENCES offers(slug)
);

-- Message Logs 테이블
CREATE TABLE IF NOT EXISTS message_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  channel VARCHAR(50) NOT NULL, -- 'email' or 'sms'
  status VARCHAR(50) NOT NULL, -- 'success' or 'failed'
  error_message TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_leads_offer_slug ON leads(offer_slug);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_message_logs_lead_id ON message_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_channel ON message_logs(channel);

-- 초기 오퍼 데이터 (예시)
INSERT OR IGNORE INTO offers (slug, name, description, status, download_link) 
VALUES (
  'workbook',
  'AI 상담 워크북',
  '보험설계사를 위한 AI 상담 워크북 무료 제공',
  'active',
  'https://example.com/workbook.pdf'
);

