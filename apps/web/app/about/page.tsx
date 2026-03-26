import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '소개',
  description: '국정투명 프로젝트 소개 — 수치로 보는 대한민국 정부',
  openGraph: {
    title: '소개 | 국정투명',
    description: '대한민국 시민이 정부의 운영을 수치 기반으로 투명하게 볼 수 있는 AI 기반 시민 투명성 플랫폼',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function AboutPage() {
  return (
    <div className="container-page py-8 max-w-3xl mx-auto">
      <h1 className="section-title">국정투명 소개</h1>
      <div className="prose prose-gray">
        <p className="text-lg text-gray-700 mb-6">
          국정투명은 대한민국 시민이 정부의 운영을 수치 기반으로 투명하게 볼 수 있도록
          설계된 AI 기반 시민 투명성 플랫폼입니다.
        </p>
        <h2 className="text-xl font-bold mt-8 mb-4">핵심 원칙</h2>
        <ul className="space-y-3 text-gray-700">
          <li><strong>데이터 &gt; 의견</strong> — 모든 주장은 공공데이터와 출처로 뒷받침합니다.</li>
          <li><strong>정치적 중립</strong> — 모든 정부에 동일한 기준을 적용합니다.</li>
          <li><strong>무료 핵심</strong> — 시민의 알 권리는 항상 무료입니다.</li>
          <li><strong>프라이버시</strong> — 실명을 저장하지 않으며, 익명 ID만 사용합니다.</li>
          <li><strong>오픈소스</strong> — 코드를 공개하여 누구나 검증할 수 있습니다.</li>
        </ul>
        <h2 className="text-xl font-bold mt-8 mb-4">데이터 출처</h2>
        <p className="text-gray-700">
          모든 데이터는 공공데이터법(2013)에 따라 자유롭게 이용 가능한
          정부 공개 데이터를 사용합니다.
        </p>
      </div>
    </div>
  );
}
