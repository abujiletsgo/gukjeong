import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '역대 대통령 비교',
  description: '김영삼부터 현재까지 역대 대통령의 재정, 정책, 거버넌스 지표를 동일 기준으로 비교합니다.',
};

export default function PresidentsPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">역대 대통령 비교</h1>
      <p className="text-gray-600 mb-8">
        김영삼 대통령(1993)부터 현재까지 동일 기준으로 비교합니다.
      </p>
      {/* PresidentTimeline 컴포넌트 위치 */}
      <div className="card">
        <p className="text-gray-400 text-center py-12">타임라인 차트 준비 중</p>
      </div>
    </div>
  );
}
