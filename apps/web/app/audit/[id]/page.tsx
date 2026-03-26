export default function AuditDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">감사 플래그 상세</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
        이 분석은 AI 기반 자동 탐지 결과이며, 의심 패턴일 뿐 비리 확정이 아닙니다.
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold text-lg mb-4">탐지된 패턴</h2>
          <p className="text-gray-400">패턴 상세 및 증거 준비 중</p>
        </div>
        <div className="card">
          <h2 className="font-bold text-lg mb-4">AI 분석</h2>
          <p className="text-gray-400">AI 분석 결과 준비 중</p>
          <div className="ai-badge mt-4">AI 분석</div>
        </div>
      </div>
    </div>
  );
}
