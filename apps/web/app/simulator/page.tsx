import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '예산 시뮬레이터',
  description: '예산을 직접 배분해보고, 정부 지출의 우선순위를 탐색하세요.',
  openGraph: {
    title: '예산 시뮬레이터 | 국정투명',
    description: '728조 예산을 직접 배분해 보세요. 내 세금이 어디로 가는지 확인하세요.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function SimulatorPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">예산 시뮬레이터</h1>
      <p className="text-gray-600 mb-6">
        728조 예산을 직접 배분해 보세요. 내 세금 1만원은 어디로 가는지 확인할 수 있습니다.
      </p>
      <div className="card">
        <p className="text-gray-400 text-center pt-16 pb-6">인터랙티브 Sankey 시뮬레이터 준비 중</p>
        <div className="text-center pb-10">
          <Link
            href="/budget"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            예산 데이터 먼저 둘러보기
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
