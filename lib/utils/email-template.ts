/**
 * Email Template Utilities
 * 이메일 템플릿 생성 및 HTML 이스케이프 유틸리티
 */

/**
 * HTML 이스케이프 함수 (XSS 방지)
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * 이메일 템플릿 생성
 * @param name 사용자 이름
 * @param downloadLink 다운로드 링크
 * @returns HTML 이메일 템플릿
 */
export function generateEmailTemplate(name: string, downloadLink: string): string {
  const escapedName = escapeHtml(name);
  const escapedLink = escapeHtml(downloadLink);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Pretendard, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1A202C; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #F7FAFC; padding: 30px; border-radius: 8px;">
    <h1 style="color: #002C5F; margin-top: 0;">안녕하세요, ${escapedName}님.</h1>
    
    <p>AI 상담 워크북 신청이 완료되었습니다.</p>
    
    <p>자료는 아래 링크에서 확인하실 수 있습니다:</p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${escapedLink}" 
         style="display: inline-block; background-color: #FF9F4A; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        워크북 다운로드
      </a>
    </div>
    
    <p>문의가 필요하시면 회신 주세요.</p>
    
    <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #718096;">
      ※ 본 내용은 AI가 생성한 예시를 포함하며, 실제 약관·상품 내용은 반드시 확인 바랍니다.
    </p>
  </div>
</body>
</html>
  `.trim();
}

