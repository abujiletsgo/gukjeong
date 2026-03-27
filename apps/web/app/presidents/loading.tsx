// 대통령 페이지 로딩 스켈레톤
export default function PresidentsLoading() {
  return (
    <div className="container-page py-8 animate-pulse" aria-busy="true" aria-label="대통령 데이터 로딩 중">
      <div className="h-8 bg-gray-200 rounded w-48 mb-8" />

      {/* 타임라인 스켈레톤 */}
      <div className="flex gap-4 overflow-hidden mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-32">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-2" />
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto mb-1" />
            <div className="h-3 bg-gray-100 rounded w-24 mx-auto" />
          </div>
        ))}
      </div>

      {/* 비교 테이블 스켈레톤 */}
      <div className="card">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
