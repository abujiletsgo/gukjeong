'use client';
// 다차원 결과 — 연령/직업/지역별 응답 분포
export default function MultidimensionalResult({ data }: { data?: any }) {
  return (
    <div className="card">
      <h3 className="font-bold mb-4">다차원 분석 결과</h3>
      <p className="text-gray-400 text-center py-8">K-익명성 보장 집계 결과 준비 중</p>
      <p className="text-xs text-gray-400">* 그룹당 최소 30명 미만인 경우 결과가 표시되지 않습니다.</p>
    </div>
  );
}
