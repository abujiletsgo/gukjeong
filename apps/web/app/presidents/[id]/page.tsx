import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `대통령 상세`,
    description: '대통령별 재정, 정책, 거버넌스 상세 분석',
  };
}

export default function PresidentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">대통령 상세 정보</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold text-lg mb-4">개요</h2>
          <p className="text-gray-400">KPI 및 정책 버블 차트 준비 중</p>
        </div>
        <div className="card">
          <h2 className="font-bold text-lg mb-4">예산</h2>
          <p className="text-gray-400">TreeMap 및 스택드 에리어 차트 준비 중</p>
        </div>
        <div className="card">
          <h2 className="font-bold text-lg mb-4">거버넌스</h2>
          <p className="text-gray-400">레이더 차트 준비 중</p>
        </div>
        <div className="card">
          <h2 className="font-bold text-lg mb-4">공약 이행</h2>
          <p className="text-gray-400">공약 추적 테이블 준비 중</p>
        </div>
      </div>
    </div>
  );
}
