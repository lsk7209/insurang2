-- 기존 테이블에 컬럼 추가 마이그레이션
-- offers 테이블 확장

-- title 컬럼 추가
ALTER TABLE offers ADD COLUMN title TEXT;

-- thumbnail 컬럼 추가
ALTER TABLE offers ADD COLUMN thumbnail TEXT;

-- status 컬럼 추가 (기본값 'draft')
ALTER TABLE offers ADD COLUMN status TEXT DEFAULT 'draft';

-- download_link 컬럼 추가
ALTER TABLE offers ADD COLUMN download_link TEXT;

-- json_ld 컬럼 추가
ALTER TABLE offers ADD COLUMN json_ld TEXT;

-- ab_test_variant 컬럼 추가 (기본값 'A')
ALTER TABLE offers ADD COLUMN ab_test_variant TEXT DEFAULT 'A';

-- updated_at 컬럼이 없으면 추가
-- SQLite는 ALTER TABLE로 컬럼 추가 시 기본값을 설정할 수 없으므로, 
-- 이미 존재하는 경우는 무시됩니다.

-- 나머지 테이블 생성 (이미 존재하는 경우 무시)
-- Sequences 테이블
CREATE TABLE IF NOT EXISTS sequences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  day_offset INTEGER NOT NULL,
  channel TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  quiet_hour_start INTEGER DEFAULT 22,
  quiet_hour_end INTEGER DEFAULT 8,
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_slug) REFERENCES offers(slug)
);

-- Sequence Logs 테이블
CREATE TABLE IF NOT EXISTS sequence_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sequence_id INTEGER NOT NULL,
  lead_id INTEGER NOT NULL,
  scheduled_at DATETIME NOT NULL,
  sent_at DATETIME,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sequence_id) REFERENCES sequences(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Offer Metrics 테이블
CREATE TABLE IF NOT EXISTS offer_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL,
  period TEXT NOT NULL,
  period_date TEXT,
  views INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_id) REFERENCES offers(id),
  UNIQUE(offer_id, period, period_date)
);

-- Bookings 테이블
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  consultant_name TEXT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Consultant Schedules 테이블
CREATE TABLE IF NOT EXISTS consultant_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consultant_name TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Content Articles 테이블
CREATE TABLE IF NOT EXISTS content_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author TEXT,
  category TEXT,
  tags TEXT,
  featured_image TEXT,
  published_at DATETIME,
  status TEXT DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Content CTAs 테이블
CREATE TABLE IF NOT EXISTS content_ctas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  offer_slug TEXT,
  cta_text TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES content_articles(id),
  FOREIGN KEY (offer_slug) REFERENCES offers(slug)
);

-- AutoOps Monitoring 테이블
CREATE TABLE IF NOT EXISTS autoops_monitoring (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  status TEXT DEFAULT 'ok',
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 페이지뷰 추적 테이블
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  offer_slug TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 퍼널 이벤트 테이블
CREATE TABLE IF NOT EXISTS funnel_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  page_path TEXT NOT NULL,
  offer_slug TEXT,
  lead_id INTEGER,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- 인덱스 생성
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
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_consultant_schedules_consultant ON consultant_schedules(consultant_name);
CREATE INDEX IF NOT EXISTS idx_consultant_schedules_day ON consultant_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_content_articles_slug ON content_articles(slug);
CREATE INDEX IF NOT EXISTS idx_content_articles_status ON content_articles(status);
CREATE INDEX IF NOT EXISTS idx_content_articles_published_at ON content_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_content_ctas_article_id ON content_ctas(article_id);
CREATE INDEX IF NOT EXISTS idx_content_ctas_offer_slug ON content_ctas(offer_slug);
CREATE INDEX IF NOT EXISTS idx_autoops_monitoring_metric_name ON autoops_monitoring(metric_name);
CREATE INDEX IF NOT EXISTS idx_autoops_monitoring_checked_at ON autoops_monitoring(checked_at);
CREATE INDEX IF NOT EXISTS idx_autoops_monitoring_status ON autoops_monitoring(status);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_offer_slug ON page_views(offer_slug);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session_id ON funnel_events(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_event_type ON funnel_events(event_type);
CREATE INDEX IF NOT EXISTS idx_funnel_events_page_path ON funnel_events(page_path);
CREATE INDEX IF NOT EXISTS idx_funnel_events_created_at ON funnel_events(created_at);
CREATE INDEX IF NOT EXISTS idx_funnel_events_offer_slug ON funnel_events(offer_slug);

