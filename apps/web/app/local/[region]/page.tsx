import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params;
  const decodedRegion = decodeURIComponent(region);
  return {
    title: `지방정부 — ${decodedRegion}`,
    description: `${decodedRegion} 지방정부의 예산, 계약, 투명성 지표를 확인하세요.`,
    openGraph: {
      title: `${decodedRegion} 지방정부 | 국정투명`,
      description: `${decodedRegion} 지방정부 재정 데이터 분석`,
    },
  };
}

export default async function LocalPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  return (
    <div className="container-page py-8">
      <h1 className="section-title">지방정부 — {region}</h1>
      <div className="card">
        <p className="text-gray-400 text-center py-12">지방정부 데이터 준비 중</p>
      </div>
    </div>
  );
}
