import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '국회의원 성적표',
  description: '국회의원의 출석률, 법안 발의, 공약 이행, 말과 행동 일치도를 종합 평가합니다.',
};

export default function LegislatorsPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">국회의원 성적표</h1>
      <p className="text-gray-600 mb-6">공개 데이터 기반으로 국회의원의 활동을 종합 평가합니다.</p>
      <div className="card">
        <p className="text-gray-400 text-center py-12">랭킹 테이블 준비 중</p>
      </div>
    </div>
  );
}
