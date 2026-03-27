import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  await params;
  return {
    title: `설문 참여`,
    description: `데이터를 먼저 보고, 생각한 후 의견을 나누는 숙의 설문에 참여하세요.`,
    openGraph: {
      title: `숙의 설문 참여 | 국정투명`,
      description: `시민 참여 기반 숙의 설문`,
    },
  };
}

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return (
    <div className="container-page py-8">
      <h1 className="section-title">설문 참여</h1>
      <div className="card">
        <p className="text-gray-400 text-center py-12">DeliberativeFlow 컴포넌트 준비 중</p>
      </div>
    </div>
  );
}
