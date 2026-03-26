export default function LocalPage({ params }: { params: { region: string } }) {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">지방정부 — {params.region}</h1>
      <div className="card">
        <p className="text-gray-400 text-center py-12">지방정부 데이터 준비 중</p>
      </div>
    </div>
  );
}
