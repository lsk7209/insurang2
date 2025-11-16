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

-- Sequences 테이블 (시퀀스 메시지 자동화)
CREATE TABLE IF NOT EXISTS sequences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_slug TEXT NOT NULL,
  name TEXT NOT NULL, -- 시퀀스 이름
  day_offset INTEGER NOT NULL, -- D+0, D+2, D+5, D+7 등
  channel TEXT NOT NULL, -- 'email' or 'sms'
  subject TEXT, -- 이메일 제목 (email인 경우)
  message TEXT NOT NULL, -- 메시지 내용
  quiet_hour_start INTEGER DEFAULT 22, -- Quiet Hour 시작 시간 (0-23)
  quiet_hour_end INTEGER DEFAULT 8, -- Quiet Hour 종료 시간 (0-23)
  enabled INTEGER DEFAULT 1, -- 0 = 비활성, 1 = 활성
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_slug) REFERENCES offers(slug)
);

-- Sequence Logs 테이블 (시퀀스 발송 로그)
CREATE TABLE IF NOT EXISTS sequence_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sequence_id INTEGER NOT NULL,
  lead_id INTEGER NOT NULL,
  scheduled_at DATETIME NOT NULL, -- 예약 발송 시간
  sent_at DATETIME, -- 실제 발송 시간 (NULL이면 아직 발송 안됨)
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'skipped'
  error_message TEXT, -- 실패 시 에러 메시지
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sequence_id) REFERENCES sequences(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
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
CREATE INDEX IF NOT EXISTS idx_sequences_offer_slug ON sequences(offer_slug);
CREATE INDEX IF NOT EXISTS idx_sequences_enabled ON sequences(enabled);
CREATE INDEX IF NOT EXISTS idx_sequence_logs_sequence_id ON sequence_logs(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_logs_lead_id ON sequence_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequence_logs_status ON sequence_logs(status);
CREATE INDEX IF NOT EXISTS idx_sequence_logs_scheduled_at ON sequence_logs(scheduled_at);

-- Bookings 테이블 (코칭 예약)
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  consultant_name TEXT NOT NULL, -- 상담사 이름
  scheduled_at DATETIME NOT NULL, -- 예약 일시
  duration_minutes INTEGER DEFAULT 30, -- 상담 시간 (분)
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  notes TEXT, -- 메모
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Consultant Schedules 테이블 (상담사 일정)
CREATE TABLE IF NOT EXISTS consultant_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consultant_name TEXT NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=일요일, 1=월요일, ..., 6=토요일
  start_time TEXT NOT NULL, -- HH:MM 형식
  end_time TEXT NOT NULL, -- HH:MM 형식
  enabled INTEGER DEFAULT 1, -- 0 = 비활성, 1 = 활성
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_consultant_schedules_consultant ON consultant_schedules(consultant_name);
CREATE INDEX IF NOT EXISTS idx_consultant_schedules_day ON consultant_schedules(day_of_week);

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

