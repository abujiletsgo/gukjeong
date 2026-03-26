import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '법안 추적',
  description: '국회 발의 법안의 현황, AI 요약, 시민 영향 분석을 확인하세요.',
  openGraph: {
    title: '법안 추적 | 국정투명',
    description: '국회 발의 법안을 AI가 요약하고, 시민에게 미치는 영향을 분석합니다.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function BillsPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">법안 추적</h1>
      <p className="text-gray-600 mb-6">국회에서 발의된 법안을 AI가 요약하고, 시민에게 미치는 영향을 분석합니다.</p>
      <div className="card">
        <p className="text-gray-400 text-center py-12">법안 목록 및 필터 준비 중</p>
      </div>
    </div>
  );
}
