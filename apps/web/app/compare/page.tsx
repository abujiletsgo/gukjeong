import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '국제 비교',
  description: 'OECD 국가와 비교한 대한민국의 재정 지표',
};

export default function ComparePage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">국제 비교</h1>
      <p className="text-gray-600 mb-6">OECD 국가와 비교한 대한민국의 재정 건전성 지표</p>
      <div className="card">
        <p className="text-gray-400 text-center py-16">BubbleChart 준비 중</p>
      </div>
    </div>
  );
}
