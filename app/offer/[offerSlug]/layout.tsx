/**
 * Layout for dynamic offer routes
 * Generates static params for static export
 */
export async function generateStaticParams() {
  // 기본 오퍼 슬러그 반환
  return [{ offerSlug: 'workbook' }];
}

export default function OfferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

