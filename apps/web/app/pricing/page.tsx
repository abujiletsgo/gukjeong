import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '요금제',
  description: '국정투명의 무료 및 유료 요금제를 확인하세요.',
  openGraph: {
    title: '요금제 | 국정투명',
    description: '시민의 알 권리는 항상 무료. 더 깊은 분석이 필요하면 Pro를 선택하세요.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

export default function PricingPage() {
  const tiers = [
    {
      name: '무료',
      price: '무료',
      features: ['검색 1일 5회', '기본 데이터 조회', '대통령/예산 페이지'],
      cta: '시작하기',
      highlighted: false,
    },
    {
      name: '무료 회원',
      price: '무료',
      features: ['검색 1일 15회', '+ 부처별 필터', '설문 참여', '크레딧 적립'],
      cta: '가입하기',
      highlighted: false,
    },
    {
      name: '시민 Pro',
      price: '월 3,900원',
      features: ['무제한 검색', '모든 필터', 'CSV 다운로드 (월 10회)', '국회의원 상세 분석', '말과 행동 일치도'],
      cta: '구독하기',
      highlighted: true,
    },
    {
      name: '기관',
      price: '월 190,000원',
      features: ['모든 Pro 기능', 'API 월 100,000회', '벌크 JSON 내보내기', '설문 집계 데이터', '맞춤 설문 생성'],
      cta: '문의하기',
      highlighted: false,
    },
  ];

  return (
    <div className="container-page py-8">
      <h1 className="section-title text-center">요금제</h1>
      <p className="text-gray-600 text-center mb-8">시민의 알 권리는 항상 무료. 더 깊은 분석이 필요하면 Pro를 선택하세요.</p>
      <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {tiers.map((tier, i) => (
          <div key={i} className={`card ${tier.highlighted ? 'border-accent border-2 relative' : ''}`}>
            {tier.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs px-3 py-1 rounded-full">
                인기
              </div>
            )}
            <h3 className="font-bold text-lg">{tier.name}</h3>
            <div className="text-2xl font-bold my-4">{tier.price}</div>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              {tier.features.map((f, j) => (
                <li key={j}>✓ {f}</li>
              ))}
            </ul>
            <button className={tier.highlighted ? 'btn-primary w-full' : 'btn-secondary w-full'}>
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center mt-8">
        500 크레딧 = 1개월 Pro 무료 전환. 설문 참여, 프로필 완성으로 크레딧을 모을 수 있습니다.
      </p>
    </div>
  );
}
