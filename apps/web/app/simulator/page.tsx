import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '예산 시뮬레이터',
  description: '예산을 직접 배분해보고, 정부 지출의 우선순위를 탐색하세요.',
};

export default function SimulatorPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">예산 시뮬레이터</h1>
      <p className="text-gray-600 mb-6">
        728조 예산을 직접 배분해 보세요. 내 세금 1만원은 어디로 가는지 확인할 수 있습니다.
      </p>
      <div className="card">
        <p className="text-gray-400 text-center py-16">인터랙티브 Sankey 시뮬레이터 준비 중</p>
      </div>
    </div>
  );
}
