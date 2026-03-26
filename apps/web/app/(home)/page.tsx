import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '국정투명 — 수치로 보는 대한민국 정부',
  description: '대한민국 정부의 예산, 정책, 입법 활동을 공공데이터 기반으로 투명하게',
};

export default function HomePage() {
  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="bg-header text-white py-16 md:py-24">
        <div className="container-page text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            수치로 보는 대한민국 정부
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            의견이 아닌 데이터, 추측이 아닌 공공데이터 기반의 분석.
            <br />
            시민의 알 권리를 위한 투명성 플랫폼.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/budget" className="btn-primary text-center">
              예산 살펴보기
            </a>
            <a href="/audit" className="bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors text-center">
              AI 감사 보기
            </a>
          </div>
        </div>
      </section>

      {/* KPI 요약 */}
      <section className="container-page -mt-8 md:-mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '2026 총지출', value: '728조', change: '+7.5%' },
            { label: '국가채무', value: '1,222조', change: '(2025 추정)' },
            { label: 'GDP 대비 채무', value: '46.8%', change: '(2024)' },
            { label: '역대 대통령', value: '8명', change: '김영삼~현재' },
          ].map((kpi, i) => (
            <div key={i} className="card text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-sm text-gray-500 mt-1">{kpi.label}</div>
              <div className="text-xs text-gray-400 mt-1">{kpi.change}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 주요 기능 */}
      <section className="container-page py-16">
        <h2 className="section-title text-center">주요 기능</h2>
        <div className="grid md:grid-cols-3 gap-8 mt-8">
          {[
            {
              title: '대통령 비교',
              description: '김영삼부터 현재까지 역대 대통령의 재정, 정책, 거버넌스 지표를 동일 기준으로 비교합니다.',
              href: '/presidents',
              icon: '📊',
            },
            {
              title: '예산 시각화',
              description: '세입, 세출, 국가채무를 인터랙티브 차트로 탐색하세요. 내 세금이 어디로 가는지 확인할 수 있습니다.',
              href: '/budget',
              icon: '💰',
            },
            {
              title: 'AI 감사관',
              description: '나라장터 계약 데이터에서 10가지 의심 패턴을 AI가 자동으로 탐지합니다.',
              href: '/audit',
              icon: '🔍',
            },
            {
              title: '뉴스 프레임 비교',
              description: '같은 사건을 진보와 보수 미디어가 어떻게 다르게 보도하는지 비교합니다.',
              href: '/news',
              icon: '📰',
            },
            {
              title: '국회의원 성적표',
              description: '출석률, 법안 발의, 공약 이행, 말과 행동의 일치도를 종합 평가합니다.',
              href: '/legislators',
              icon: '🏛️',
            },
            {
              title: '숙의 설문',
              description: '데이터를 먼저 보고, 생각한 후 의견을 나누는 새로운 시민 참여 방식입니다.',
              href: '/survey',
              icon: '🗳️',
            },
          ].map((feature, i) => (
            <a key={i} href={feature.href} className="card hover:shadow-md transition-shadow group">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-accent transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 mt-2">{feature.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* 데이터 출처 */}
      <section className="bg-gray-50 py-12">
        <div className="container-page text-center">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">데이터 출처</h2>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>열린재정 (기획재정부)</span>
            <span>나라장터 (조달청)</span>
            <span>열린국회 (국회사무처)</span>
            <span>ECOS (한국은행)</span>
            <span>공공데이터포털</span>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            모든 데이터는 공공데이터법에 따라 자유롭게 이용 가능한 정부 공개 데이터입니다.
          </p>
        </div>
      </section>
    </div>
  );
}
