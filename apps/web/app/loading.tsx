// 글로벌 로딩 스켈레톤
export default function Loading() {
  return (
    <div className="container-page py-8 animate-pulse" aria-busy="true" aria-label="페이지 로딩 중">
      {/* KPI 카드 스켈레톤 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-28 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
        ))}
      </div>

      {/* 메인 콘텐츠 스켈레톤 */}
      <div className="card mb-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>

      {/* 카드 그리드 스켈레톤 */}
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="h-5 bg-gray-200 rounded w-40 mb-3" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
