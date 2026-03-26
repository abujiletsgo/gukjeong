import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '숙의 설문',
  description: '데이터를 먼저 보고, 생각한 후 의견을 나누는 시민 참여 설문',
};

export default function SurveyPage() {
  return (
    <div className="container-page py-8">
      <h1 className="section-title">숙의 설문</h1>
      <p className="text-gray-600 mb-6">
        데이터를 먼저 살펴보고, 충분히 생각한 후 의견을 공유하세요.
      </p>
      <div className="card">
        <p className="text-gray-400 text-center py-12">진행 중인 설문 목록 준비 중</p>
      </div>
    </div>
  );
}
