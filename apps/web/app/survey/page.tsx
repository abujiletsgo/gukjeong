import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '숙의 설문',
  description: '데이터를 먼저 보고, 생각한 후 의견을 나누는 시민 참여 설문',
  openGraph: {
    title: '숙의 설문 | 국정투명',
    description: '데이터를 먼저 보고, 생각한 후 의견을 나누는 시민 참여 설문',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function SurveyPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">숙의 설문</h1>
      <p className="text-gray-600 mb-6">
        데이터를 먼저 살펴보고, 충분히 생각한 후 의견을 공유하세요.
      </p>
      <div className="card">
        <p className="text-gray-400 text-center pt-12 pb-6">진행 중인 설문 목록 준비 중</p>
        <div className="text-center pb-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            뉴스 프레임 비교 둘러보기
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
