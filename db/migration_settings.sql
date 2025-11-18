-- Settings 테이블 생성 (솔라피 API 등 환경설정 저장)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL, -- 'solapi_api_key', 'solapi_api_secret', 'solapi_sender_phone' 등
  value TEXT NOT NULL, -- 암호화된 값 또는 평문 값
  encrypted INTEGER DEFAULT 0, -- 0 = 평문, 1 = 암호화됨 (현재는 평문 저장)
  description TEXT, -- 설정 설명
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- 초기 설정값 (환경 변수에서 가져온 값으로 초기화 가능)
-- 실제 값은 환경설정 페이지에서 입력받아 저장

