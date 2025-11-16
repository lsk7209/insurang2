-- 오퍼 페이지 콘텐츠 필드 추가 마이그레이션
-- 랜딩 페이지의 텍스트, 이미지 등을 관리할 수 있도록 필드 추가

-- offers 테이블에 페이지 콘텐츠 필드 추가
ALTER TABLE offers ADD COLUMN IF NOT EXISTS hero_title TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS hero_badge_text TEXT DEFAULT '무료 제공 · 즉시 다운로드';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS hero_cta_text TEXT DEFAULT '지금 바로 무료로 받기';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS hero_background_image TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS hero_stats_text TEXT; -- JSON 형식: {"downloads": "1,247명 다운로드", "rating": "4.9/5.0 만족도"}

ALTER TABLE offers ADD COLUMN IF NOT EXISTS preview_title TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS preview_subtitle TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS preview_image TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS preview_features TEXT; -- JSON 형식: [{"icon": "...", "title": "...", "description": "..."}]

ALTER TABLE offers ADD COLUMN IF NOT EXISTS value_title TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS value_subtitle TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS value_cards TEXT; -- JSON 형식: [{"icon": "...", "title": "...", "description": "..."}]

ALTER TABLE offers ADD COLUMN IF NOT EXISTS trust_title TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS trust_subtitle TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS testimonials TEXT; -- JSON 형식: [{"name": "...", "company": "...", "image": "...", "review": "..."}]

ALTER TABLE offers ADD COLUMN IF NOT EXISTS form_title TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS form_subtitle TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS form_badge_text TEXT DEFAULT '100% 무료 · 즉시 다운로드';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS form_description TEXT;

-- 기존 오퍼에 기본값 설정
UPDATE offers SET
  hero_title = '상담 성공률을 2배로 높이는 AI 워크북',
  hero_subtitle = '매일 같은 상담에 지치셨나요? 고객 유형별 맞춤 전략으로 상담 시간은 절반으로, 계약 성공률은 2배로.',
  hero_badge_text = '무료 제공 · 즉시 다운로드',
  hero_cta_text = '지금 바로 무료로 받기',
  preview_title = 'AI 상담 워크북, 이런 내용을 담았습니다',
  preview_subtitle = '고객의 첫마디부터 계약서 사인까지, 모든 단계를 체계적으로 안내하는 실전 가이드입니다.',
  value_title = '워크북 하나로 당신의 상담이 달라집니다',
  value_subtitle = '단순한 스크립트가 아닙니다. 고객의 마음을 열고 계약으로 이끄는 과학적인 상담 전략입니다.',
  trust_title = '먼저 경험한 설계사들의 생생한 후기',
  trust_subtitle = '이미 많은 분들이 INSURANG과 함께 최고의 성과를 만들고 있습니다.',
  form_title = '지금 바로 시작하세요',
  form_subtitle = '이름과 이메일만 입력하면 워크북을 즉시 보내드립니다',
  form_badge_text = '100% 무료 · 즉시 다운로드',
  form_description = '신용카드 불필요 · 개인정보 보호 · 언제든지 구독 취소 가능'
WHERE hero_title IS NULL;

