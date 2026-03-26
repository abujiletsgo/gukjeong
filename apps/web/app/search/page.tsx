import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '통합 검색',
  description: '대통령, 예산, 법안, 계약, 국회의원 데이터를 통합 검색합니다.',
};

export default function SearchPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">통합 검색</h1>
      <div className="max-w-2xl mx-auto mb-8">
        <input
          type="search"
          placeholder="검색어를 입력하세요 (예: 국방예산, 교육정책, 의원 이름)"
          className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-lg"
        />
        <p className="text-xs text-gray-400 mt-2 text-center">
          비회원: 1일 5회 | 무료 회원: 1일 15회 | Pro: 무제한
        </p>
      </div>
      <div className="card">
        <p className="text-gray-400 text-center py-12">검색 결과 영역</p>
      </div>
    </div>
  );
}
