// 예산 페이지 로딩 스켈레톤
export default function BudgetLoading() {
  return (
    <div className="container-page py-8 animate-pulse" aria-busy="true" aria-label="예산 데이터 로딩 중">
      <div className="h-8 bg-gray-200 rounded w-48 mb-6" />

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-28" />
          </div>
        ))}
      </div>

      {/* 차트 영역 */}
      <div className="card mb-6">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
        <div className="h-80 bg-gray-100 rounded" />
      </div>

      {/* 분야별 카드 */}
      <div className="grid md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card">
            <div className="h-5 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-full mb-1" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
