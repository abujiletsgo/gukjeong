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

const TIERS = [
  {
    id: 'free',
    name: '무료',
    desc: '기본 시민 정보',
    price: '0',
    period: '',
    features: [
      { text: '대통령 비교 전체', included: true },
      { text: '예산 시각화 전체', included: true },
      { text: '법안 목록 조회', included: true },
      { text: '뉴스 프레임 비교', included: true },
      { text: '검색 1일 5회', included: true },
      { text: 'AI 감사 요약 보기', included: true },
      { text: 'AI 감사 상세 (계약·타임라인)', included: false },
      { text: '국회의원 상세 분석', included: false },
      { text: 'CSV 다운로드', included: false },
      { text: 'API 접근', included: false },
    ],
    cta: '무료로 시작',
    highlighted: false,
    color: '#6b7280',
  },
  {
    id: 'member',
    name: '무료 회원',
    desc: '가입만으로 더 많은 기능',
    price: '0',
    period: '',
    badge: '가입 필요',
    features: [
      { text: '무료 플랜의 모든 기능', included: true },
      { text: '검색 1일 15회', included: true },
      { text: '부처별·위원회별 필터', included: true },
      { text: '설문 참여 + 크레딧 적립', included: true },
      { text: 'AI 감사 상세 보기', included: true },
      { text: '국회의원 기본 성적표', included: true },
      { text: '말과 행동 일치도 분석', included: false },
      { text: 'CSV 다운로드', included: false },
      { text: 'API 접근', included: false },
      { text: '맞춤 알림', included: false },
    ],
    cta: '무료 가입',
    highlighted: false,
    color: '#2563eb',
  },
  {
    id: 'pro',
    name: '시민 Pro',
    desc: '진지한 시민을 위한 도구',
    price: '3,900',
    period: '/월',
    badge: '인기',
    features: [
      { text: '무료 회원의 모든 기능', included: true },
      { text: '무제한 검색', included: true },
      { text: '국회의원 상세 분석', included: true },
      { text: '말과 행동 일치도 분석', included: true },
      { text: 'AI 감사 전체 상세 (계약·링크·타임라인)', included: true },
      { text: 'CSV 다운로드 (월 30회)', included: true },
      { text: '맞춤 알림 (법안·감사·뉴스)', included: true },
      { text: '광고 없음', included: true },
      { text: 'API 접근', included: false },
      { text: '벌크 데이터 내보내기', included: false },
    ],
    cta: '구독하기',
    highlighted: true,
    color: '#ff6b35',
  },
  {
    id: 'institution',
    name: '기관·언론',
    desc: '연구·보도·정책 분석',
    price: '190,000',
    period: '/월',
    features: [
      { text: 'Pro의 모든 기능', included: true },
      { text: 'API 월 100,000회', included: true },
      { text: '벌크 JSON/CSV 내보내기', included: true },
      { text: '설문 집계 원시 데이터', included: true },
      { text: '맞춤 설문 생성', included: true },
      { text: '임베드 위젯 (iframe)', included: true },
      { text: '전담 지원', included: true },
      { text: 'SLA 보장', included: true },
      { text: '맞춤 데이터 분석 요청', included: true },
      { text: '화이트라벨 옵션', included: true },
    ],
    cta: '문의하기',
    highlighted: false,
    color: '#7c3aed',
  },
];

const FAQ = [
  {
    q: '무료로 뭘 볼 수 있나요?',
    a: '대통령 비교, 예산 시각화, 법안 목록, 뉴스 프레임 비교 등 핵심 시민 정보는 모두 무료입니다. 가입 없이도 볼 수 있습니다.',
  },
  {
    q: '시민 Pro는 왜 유료인가요?',
    a: 'AI 분석, 대량 데이터 처리, 서버 운영에 비용이 듭니다. 핵심 시민 정보는 무료로 유지하면서, 심층 분석 도구를 Pro로 제공합니다.',
  },
  {
    q: '크레딧으로 Pro를 이용할 수 있나요?',
    a: '네. 설문 참여, 프로필 완성 등 활동으로 크레딧을 쌓으면 Pro를 무료로 전환할 수 있습니다. 500 크레딧 = 1개월 Pro.',
  },
  {
    q: '기관 요금제는 어떤 곳에서 쓰나요?',
    a: '언론사(기사 작성용 데이터), 연구기관(정책 분석), 시민단체(감시 활동), 국회 보좌관실 등에서 사용합니다.',
  },
  {
    q: '결제는 어떻게 하나요?',
    a: '토스페이먼츠(카드·계좌이체·간편결제)와 Stripe(해외 결제)를 지원합니다. 곧 연동됩니다.',
  },
  {
    q: '환불이 가능한가요?',
    a: '구독 후 7일 이내 환불 가능합니다. 이후에는 다음 결제일부터 해지됩니다.',
  },
];

const USE_CASES = [
  { icon: '📱', role: '일반 시민', plan: '무료', use: '대통령 비교, 예산 확인, 뉴스 프레임 비교' },
  { icon: '🎓', role: '대학생·연구자', plan: 'Pro', use: '법안 분석, 국회의원 성적표, CSV 데이터' },
  { icon: '📰', role: '기자·언론인', plan: 'Pro / 기관', use: '감사 데이터, API로 팩트체크' },
  { icon: '🏛️', role: '시민단체·NGO', plan: '기관', use: '벌크 데이터, 맞춤 설문, 임베드 위젯' },
  { icon: '⚖️', role: '국회 보좌관', plan: '기관', use: '정책 비교 데이터, 법안 영향 분석' },
];

export default function PricingPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      {/* 헤더 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">요금제</h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          시민의 알 권리는 항상 무료. 더 깊은 분석이 필요하면 Pro를 선택하세요.
        </p>
      </div>

      {/* 요금제 카드 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-6xl mx-auto mb-12">
        {TIERS.map(tier => (
          <div
            key={tier.id}
            className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
              tier.highlighted
                ? 'border-accent shadow-lg shadow-accent/10 scale-[1.02]'
                : 'border-gray-100'
            }`}
          >
            {tier.badge && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[11px] font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: tier.color }}
              >
                {tier.badge}
              </div>
            )}

            {/* Tier header */}
            <div className="mb-5">
              <h3 className="font-bold text-lg text-gray-900">{tier.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{tier.desc}</p>
            </div>

            {/* Price */}
            <div className="mb-6">
              {tier.price === '0' ? (
                <div className="text-3xl font-black text-gray-900">무료</div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">₩{tier.price}</span>
                  <span className="text-sm text-gray-400">{tier.period}</span>
                </div>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-6 flex-1">
              {tier.features.map((f, j) => (
                <li key={j} className={`flex items-start gap-2 text-sm ${f.included ? 'text-gray-700' : 'text-gray-300'}`}>
                  {f.included ? (
                    <svg className="w-4 h-4 mt-0.5 shrink-0 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  ) : (
                    <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  )}
                  {f.text}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                tier.highlighted
                  ? 'bg-accent text-white hover:bg-orange-600 shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>

      {/* 크레딧 안내 */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 text-center">
          <h3 className="font-bold text-amber-900 mb-2">돈 없이 Pro 이용하기</h3>
          <p className="text-sm text-amber-800 mb-4">
            설문 참여, 프로필 완성, 데이터 오류 신고 등 활동으로 크레딧을 모을 수 있습니다.
          </p>
          <div className="flex justify-center gap-6 text-center">
            <div>
              <div className="text-2xl font-black text-amber-700">50</div>
              <div className="text-[10px] text-amber-600">설문 1회 참여</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-700">100</div>
              <div className="text-[10px] text-amber-600">프로필 완성</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-700">30</div>
              <div className="text-[10px] text-amber-600">오류 신고</div>
            </div>
            <div>
              <div className="text-2xl font-black text-accent">500</div>
              <div className="text-[10px] text-gray-600">= 1개월 Pro</div>
            </div>
          </div>
        </div>
      </div>

      {/* 누가 어떤 플랜을 쓰나요 */}
      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-6">누가 어떤 플랜을 쓰나요?</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {USE_CASES.map(uc => (
            <div key={uc.role} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4">
              <span className="text-2xl">{uc.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">{uc.role}</span>
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{uc.plan}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{uc.use}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 기능 비교표 */}
      <div className="max-w-4xl mx-auto mb-12 overflow-x-auto">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-6">기능 비교</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-3 font-semibold text-gray-600">기능</th>
              {TIERS.map(t => (
                <th key={t.id} className="text-center py-3 px-3 font-semibold" style={{ color: t.color }}>{t.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { feature: '대통령 비교', free: true, member: true, pro: true, inst: true },
              { feature: '예산 시각화', free: true, member: true, pro: true, inst: true },
              { feature: '법안 목록', free: true, member: true, pro: true, inst: true },
              { feature: '뉴스 프레임', free: true, member: true, pro: true, inst: true },
              { feature: 'AI 감사 요약', free: true, member: true, pro: true, inst: true },
              { feature: 'AI 감사 상세 (계약·타임라인)', free: false, member: true, pro: true, inst: true },
              { feature: '국회의원 기본 성적표', free: false, member: true, pro: true, inst: true },
              { feature: '말과 행동 일치도', free: false, member: false, pro: true, inst: true },
              { feature: '검색', free: '5/일', member: '15/일', pro: '무제한', inst: '무제한' },
              { feature: 'CSV 다운로드', free: false, member: false, pro: '30/월', inst: '무제한' },
              { feature: '맞춤 알림', free: false, member: false, pro: true, inst: true },
              { feature: 'API 접근', free: false, member: false, pro: false, inst: '10만/월' },
              { feature: '임베드 위젯', free: false, member: false, pro: false, inst: true },
              { feature: '벌크 내보내기', free: false, member: false, pro: false, inst: true },
            ].map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-2.5 px-3 text-gray-700">{row.feature}</td>
                {(['free', 'member', 'pro', 'inst'] as const).map(plan => {
                  const val = row[plan];
                  return (
                    <td key={plan} className="text-center py-2.5 px-3">
                      {val === true ? (
                        <svg className="w-4 h-4 mx-auto text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      ) : val === false ? (
                        <span className="text-gray-200">—</span>
                      ) : (
                        <span className="text-xs font-medium text-gray-600">{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-6">자주 묻는 질문</h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-bold text-sm text-gray-900 mb-1.5">{item.q}</h3>
              <p className="text-sm text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <p className="text-xs text-gray-400">
          결제: 토스페이먼츠 (카드·계좌이체·간편결제) + Stripe (해외) · 부가세 포함 · 언제든 해지 가능
        </p>
      </div>
    </div>
  );
}
