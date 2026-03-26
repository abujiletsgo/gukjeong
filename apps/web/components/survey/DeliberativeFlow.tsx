'use client';
// 숙의 설문 플로우 — 사전/사후 비교
export default function DeliberativeFlow({ surveyId }: { surveyId: string }) {
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-bold">1단계: 사전 의견</h3>
        <p className="text-gray-400 text-sm mt-2">설문 문항 준비 중</p>
      </div>
      <div className="card bg-blue-50">
        <h3 className="font-bold text-blue-700">데이터 패널</h3>
        <p className="text-gray-600 text-sm mt-2">관련 데이터를 살펴보세요</p>
      </div>
      <div className="card">
        <h3 className="font-bold">2단계: 사후 의견</h3>
        <p className="text-gray-400 text-sm mt-2">데이터를 본 후 다시 응답합니다</p>
      </div>
    </div>
  );
}
