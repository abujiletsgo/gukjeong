import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '예산 시각화',
  description: '대한민국 정부 예산의 세입, 세출, 국가채무를 인터랙티브 차트로 확인하세요.',
};

export default function BudgetPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">예산 시각화</h1>
      {/* KPI 히어로 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '총지출 (2026)', value: '728조' },
          { label: '국가채무', value: '1,222조' },
          { label: '세수', value: '336.5조' },
          { label: 'GDP 대비 채무', value: '46.8%' },
        ].map((kpi, i) => (
          <div key={i} className="card text-center">
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>
      {/* 차트 영역 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold text-lg mb-4">세출 추이 (1998-2026)</h2>
          <p className="text-gray-400 text-center py-16">StackedArea 차트 준비 중</p>
        </div>
        <div className="card">
          <h2 className="font-bold text-lg mb-4">2026 분야별 예산</h2>
          <p className="text-gray-400 text-center py-16">TreeMap 준비 중</p>
        </div>
        <div className="card md:col-span-2">
          <h2 className="font-bold text-lg mb-4">세입 → 부처 → 사업 흐름</h2>
          <p className="text-gray-400 text-center py-16">Sankey 다이어그램 준비 중</p>
        </div>
        <div className="card">
          <h2 className="font-bold text-lg mb-4">국가채무 궤적</h2>
          <p className="text-gray-400 text-center py-16">DebtChart 준비 중</p>
        </div>
        <div className="card">
          <h2 className="font-bold text-lg mb-4">국제 비교</h2>
          <p className="text-gray-400 text-center py-16">수평 바 차트 준비 중</p>
        </div>
      </div>
    </div>
  );
}
