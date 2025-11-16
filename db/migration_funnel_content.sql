-- 오퍼 퍼널 콘텐츠 필드 추가 마이그레이션
-- 신청 페이지와 감사 페이지를 함께 관리할 수 있도록 필드 추가

-- 감사 페이지 콘텐츠 필드 추가
ALTER TABLE offers ADD COLUMN IF NOT EXISTS thanks_title TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS thanks_subtitle TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS thanks_description TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS thanks_cta_text TEXT DEFAULT '홈으로';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS thanks_examples TEXT; -- JSON 형식: [{"title": "...", "text": "..."}]

-- 기존 오퍼에 기본값 설정
UPDATE offers SET
  thanks_title = '오퍼 신청이 완료되었습니다!',
  thanks_subtitle = '신청해 주셔서 감사합니다. 워크북을 이메일로 발송했습니다. 성공에 도움이 될 인사이트로 가득 차 있으니, 지금 바로 확인해 보세요!',
  thanks_description = '',
  thanks_cta_text = '홈으로',
  thanks_examples = '[{"title": "즉시 신뢰를 구축하는 문장", "text": "오늘 제 목표는 무언가를 판매하는 것이 아니라, 고객님께서 가족을 위한 최선의 결정을 내리실 수 있도록 명확한 정보를 제공하는 것입니다."}, {"title": "우아하게 거절에 대처하는 문장", "text": "정말 타당한 고민이십니다. 그 부분은 잠시 접어두고, 이 플랜이 고객님의 필요를 충족하는지 먼저 확인해 보시죠. 그렇지 않다면 가격은 무의미하니까요."}, {"title": "긴급성을 자연스럽게 만드는 문장", "text": "이 보장을 확보하기 가장 좋은 때는 어제였습니다. 다음으로 좋은 때는 바로 지금, 건강하시고 가장 저렴한 보험료로 가입할 수 있는 순간입니다."}]'
WHERE thanks_title IS NULL;

