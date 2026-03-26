import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '뉴스 프레임 비교',
  description: '같은 사건을 진보와 보수 미디어가 어떻게 다르게 보도하는지 비교합니다.',
  openGraph: {
    title: '뉴스 프레임 비교 | 국정투명',
    description: '같은 사건에 대한 서로 다른 미디어의 보도 프레임을 비교합니다.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function NewsPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">뉴스 프레임 비교</h1>
      <p className="text-gray-600 mb-2">같은 사건에 대한 서로 다른 미디어의 보도 프레임을 비교합니다.</p>
      <p className="text-xs text-gray-400 mb-6">
        * 미디어 분류는 학술 연구 기반 참고 분류입니다.
      </p>
      <div className="card">
        <p className="text-gray-400 text-center py-16">FrameComparison 컴포넌트 준비 중</p>
      </div>
    </div>
  );
}
