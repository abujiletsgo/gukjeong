import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 감사관',
  description: '나라장터 계약 데이터에서 AI가 10가지 의심 패턴을 자동 탐지합니다.',
};

export default function AuditPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">AI 감사관</h1>
      <p className="text-gray-600 mb-2">
        나라장터 공개 계약 데이터에서 AI가 의심 패턴을 자동으로 탐지합니다.
      </p>
      <p className="text-xs text-gray-400 mb-6">
        * 이 분석은 AI 기반 자동 탐지 결과이며, 의심 패턴일 뿐 비리 확정이 아닙니다.
      </p>
      <div className="card mb-6">
        <h2 className="font-bold text-lg mb-4">부처별 의심 점수 히트맵</h2>
        <p className="text-gray-400 text-center py-16">DepartmentHeatmap 준비 중</p>
      </div>
      <div className="card">
        <h2 className="font-bold text-lg mb-4">최근 감지된 패턴</h2>
        <p className="text-gray-400 text-center py-12">SuspicionCard 목록 준비 중</p>
      </div>
    </div>
  );
}
