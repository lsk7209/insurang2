# Tailwind CSS 전환 진행 상황

## ✅ 완료된 컴포넌트

1. **Footer** (`components/layout/Footer.tsx`)
   - ✅ Tailwind CSS 전환 완료
   - ✅ MUI 의존성 제거

2. **MainHeroSection** (`components/landing/MainHeroSection.tsx`)
   - ✅ Tailwind CSS 전환 완료
   - ✅ MUI 아이콘을 SVG로 대체
   - ✅ 반응형 디자인 유지

3. **WhyNeededSection** (`components/landing/WhyNeededSection.tsx`)
   - ✅ Tailwind CSS 전환 완료
   - ✅ 스크롤 애니메이션 로직을 컴포넌트 내부로 이동
   - ✅ MUI 아이콘을 SVG로 대체

4. **메인 페이지** (`app/page.tsx`)
   - ✅ Tailwind CSS 전환 완료
   - ✅ MUI Box 제거

## 🔄 진행 중인 작업

- 랜딩 컴포넌트 Tailwind 전환

## 📋 남은 컴포넌트

1. **FeaturesSection** (`components/landing/FeaturesSection.tsx`)
   - MUI 사용 중
   - useScrollAnimation 훅 사용

2. **BeforeAfterSection** (`components/landing/BeforeAfterSection.tsx`)
   - MUI 사용 중
   - useScrollAnimation 훅 사용

3. **BenefitsSection** (`components/landing/BenefitsSection.tsx`)
   - MUI 사용 중
   - useScrollAnimation 훅 사용

4. **TrustSection** (`components/landing/TrustSection.tsx`)
   - MUI 사용 중
   - useScrollAnimation 훅 사용

5. **FreeOfferSection** (`components/landing/FreeOfferSection.tsx`)
   - MUI 사용 중

6. **FinalCTASection** (`components/landing/FinalCTASection.tsx`)
   - MUI 사용 중

## 📝 전환 가이드라인

### 공통 작업
1. MUI 컴포넌트를 HTML 요소로 변경
2. `sx` prop을 Tailwind 클래스로 변환
3. MUI 아이콘을 SVG로 대체
4. `useScrollAnimation` 훅을 컴포넌트 내부 로직으로 이동 (선택사항)
5. 반응형 디자인 유지 (sm:, md:, lg: 브레이크포인트)

### 스타일 변환 예시
- `bgcolor: 'neutral.50'` → `bg-gray-50`
- `py: { xs: 8, md: 16 }` → `py-16 md:py-20 lg:py-24`
- `maxWidth: 'lg'` → `max-w-6xl mx-auto`
- `spacing: { xs: 4, md: 6 }` → `space-y-8 md:space-y-10 lg:space-y-12`

### 접근성 유지
- `role`, `aria-label` 속성 유지
- 시맨틱 HTML 요소 사용
- 키보드 접근성 유지

---

**최종 업데이트**: 2025-01-13  
**상태**: 진행 중

