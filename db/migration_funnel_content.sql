-- 오퍼 퍼널 콘텐츠 필드 추가 마이그레이션
-- 신청 페이지와 감사 페이지를 함께 관리할 수 있도록 필드 추가
-- SQLite는 ALTER TABLE ADD COLUMN IF NOT EXISTS를 지원하지 않으므로,
-- 각 컬럼을 개별적으로 추가합니다.
-- 이미 존재하는 컬럼을 추가하려고 하면 에러가 발생하므로,
-- 각 컬럼을 개별적으로 실행하거나, 이미 존재하는 경우를 확인해야 합니다.

-- 감사 페이지 콘텐츠 필드 추가
-- 각 컬럼이 이미 존재하는지 확인하기 위해 먼저 테이블 구조를 확인하는 것이 좋지만,
-- SQLite에서는 조건부 ALTER TABLE을 직접 지원하지 않으므로,
-- 각 컬럼을 추가하려고 시도합니다.

-- 주의: 이미 존재하는 컬럼을 추가하려고 하면 에러가 발생합니다.
-- 따라서 이 스크립트는 각 컬럼이 아직 존재하지 않을 때만 실행해야 합니다.

-- thanks_title 컬럼 추가 (이미 존재하면 에러 발생)
ALTER TABLE offers ADD COLUMN thanks_title TEXT;

-- thanks_subtitle 컬럼 추가
ALTER TABLE offers ADD COLUMN thanks_subtitle TEXT;

-- thanks_description 컬럼 추가
ALTER TABLE offers ADD COLUMN thanks_description TEXT;

-- thanks_cta_text 컬럼 추가 (기본값 포함)
ALTER TABLE offers ADD COLUMN thanks_cta_text TEXT DEFAULT '홈으로';

-- thanks_examples 컬럼 추가 (JSON 형식: [{"title": "...", "text": "..."}])
ALTER TABLE offers ADD COLUMN thanks_examples TEXT;

-- 기존 오퍼에 기본값 설정
UPDATE offers SET
  thanks_title = '오퍼 신청이 완료되었습니다!',
  thanks_subtitle = '신청해 주셔서 감사합니다. 워크북을 이메일로 발송했습니다. 성공에 도움이 될 인사이트로 가득 차 있으니, 지금 바로 확인해 보세요!',
  thanks_description = '',
  thanks_cta_text = '홈으로',
  thanks_examples = '[{"title": "즉시 신뢰를 구축하는 문장", "text": "오늘 제 목표는 무언가를 판매하는 것이 아니라, 고객님께서 가족을 위한 최선의 결정을 내리실 수 있도록 명확한 정보를 제공하는 것입니다."}, {"title": "우아하게 거절에 대처하는 문장", "text": "정말 타당한 고민이십니다. 그 부분은 잠시 접어두고, 이 플랜이 고객님의 필요를 충족하는지 먼저 확인해 보시죠. 그렇지 않다면 가격은 무의미하니까요."}, {"title": "긴급성을 자연스럽게 만드는 문장", "text": "이 보장을 확보하기 가장 좋은 때는 어제였습니다. 다음으로 좋은 때는 바로 지금, 건강하시고 가장 저렴한 보험료로 가입할 수 있는 순간입니다."}]'
WHERE thanks_title IS NULL;
