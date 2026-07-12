import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '통합 검색',
  description: '대통령, 예산, 법안, 계약, 국회의원 데이터를 통합 검색합니다.',
  openGraph: {
    title: '통합 검색 | 국정투명',
    description: '정부 데이터를 통합 검색합니다. 예산, 법안, 계약, 국회의원.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

import SearchClient from './SearchClient';

export default function SearchPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">통합 검색</h1>
      <SearchClient />
    </div>
  );
}
