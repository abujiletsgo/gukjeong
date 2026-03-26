export default function LegislatorDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">국회의원 상세 성적표</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold text-lg mb-4">활동 점수</h2>
          <p className="text-gray-400">레이더 차트 (출석, 발의, 발언, 투표) 준비 중</p>
        </div>
        <div className="card">
          <h2 className="font-bold text-lg mb-4">말과 행동</h2>
          <p className="text-gray-400">WordsVsActions 컴포넌트 준비 중</p>
        </div>
      </div>
    </div>
  );
}
