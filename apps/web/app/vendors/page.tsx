import type { Metadata } from 'next';
import VendorsClient from './VendorsClient';

export const metadata: Metadata = {
  title: '업체 프로필',
  description: '정부 조달에 참여한 업체별 감사 플래그, 계약 이력, 기업 정보를 한 곳에서 봅니다.',
  openGraph: {
    title: '업체 프로필 | 국정투명',
    description: '업체별 감사 플래그 · 계약 이력 · 기업 정보',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function VendorsPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">업체 프로필</h1>
      <p className="text-sm text-gray-500 mb-6 -mt-2">
        감사에서 의심 패턴이 감지된 업체를 사업자 단위로 모아 봅니다. 돈이 어디로 흘렀는지 업체 관점에서 추적하세요.
      </p>
      <VendorsClient />
    </div>
  );
}
