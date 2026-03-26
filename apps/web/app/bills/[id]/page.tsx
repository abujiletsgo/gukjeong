export default function BillDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">법안 상세</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card md:col-span-2">
          <h2 className="font-bold text-lg mb-4">AI 요약</h2>
          <p className="text-gray-400">법안 요약 및 시민 영향 분석 준비 중</p>
          <div className="ai-badge mt-4">AI 분석</div>
        </div>
        <div className="card">
          <h2 className="font-bold text-lg mb-4">투표 결과</h2>
          <p className="text-gray-400">투표 현황 준비 중</p>
        </div>
      </div>
    </div>
  );
}
