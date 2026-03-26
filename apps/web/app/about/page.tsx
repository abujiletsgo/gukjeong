import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '소개',
  description: '국정투명 프로젝트 소개 — 수치로 보는 대한민국 정부',
  openGraph: {
    title: '소개 | 국정투명',
    description: '대한민국 시민이 정부의 운영을 수치 기반으로 투명하게 볼 수 있는 AI 기반 시민 투명성 플랫폼',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

const DATA_SOURCES = [
  {
    name: '기획재정부',
    what: '정부 예산, 세입/세출, 국가채무',
    url: 'https://www.moef.go.kr',
    verified: true,
    fields: ['총지출', '국가채무', '세수', 'GDP 대비 채무비율'],
  },
  {
    name: '한국은행 ECOS',
    what: 'GDP, 성장률, 물가지수, 고용통계',
    url: 'https://ecos.bok.or.kr',
    verified: true,
    fields: ['GDP 성장률', '실업률', '소비자물가지수'],
  },
  {
    name: '열린국회정보',
    what: '국회의원 활동, 법안 발의/처리, 투표기록',
    url: 'https://open.assembly.go.kr',
    verified: true,
    fields: ['출석률', '법안 발의', '투표 기록', '위원회 활동'],
  },
  {
    name: '나라장터 (조달청)',
    what: '정부 계약 데이터, 입찰 현황',
    url: 'https://www.g2b.go.kr',
    verified: true,
    fields: ['계약 금액', '업체', '입찰 방식', '부처별 지출'],
  },
  {
    name: '공공데이터포털',
    what: '정부 공개 데이터 통합 제공',
    url: 'https://www.data.go.kr',
    verified: true,
    fields: ['재정 데이터', '국회 데이터', '지방자치 데이터'],
  },
  {
    name: '열린재정',
    what: '재정 집행 현황, 부처별 세출',
    url: 'https://www.openfiscaldata.go.kr',
    verified: true,
    fields: ['부처별 예산', '집행률', '분야별 지출'],
  },
  {
    name: '감사원',
    what: '감사 보고서, 시정 요구 사례',
    url: 'https://www.bai.go.kr',
    verified: true,
    fields: ['감사 결과', '시정 조치', '지적 사항'],
  },
  {
    name: 'KB부동산',
    what: '주택가격 동향',
    url: 'https://kbland.kr',
    verified: true,
    fields: ['서울 아파트 중위가격', '주택가격 변동률'],
  },
  {
    name: '통계청 KOSIS',
    what: '인구, 고용, 물가 통계',
    url: 'https://kosis.kr',
    verified: true,
    fields: ['합계출산율', '고용률', '가계부채'],
  },
];

const METHODOLOGY = [
  {
    feature: '대통령 비교',
    method: '기획재정부·한국은행 발표 수치를 동일 기준(본예산, 조원)으로 비교합니다. 모든 대통령에 같은 데이터 소스와 계산 방식이 적용됩니다.',
    aiRole: '없음 — 원시 데이터만 시각화',
  },
  {
    feature: '예산 시각화',
    method: '기획재정부 발표 예산안을 분야별·연도별로 분류합니다. Sankey 흐름도는 세입 구성과 세출 분야의 비례 관계를 보여줍니다.',
    aiRole: '없음 — 원시 데이터만 시각화',
  },
  {
    feature: 'AI 감사관',
    method: '나라장터 공개 계약 데이터에서 10가지 통계적 이상 패턴(연말급증, 업체집중, 계약분할 등)을 감사원 감사기법 기준으로 자동 탐지합니다.',
    aiRole: 'AI가 패턴 분석 및 위험 점수를 산출합니다. 의심 패턴일 뿐 비리 확정이 아닙니다.',
  },
  {
    feature: '법안 추적',
    method: '열린국회정보에서 법안 현황·투표 결과를 수집하고, AI가 법안 내용을 요약하고 시민 영향을 분석합니다.',
    aiRole: 'AI가 법안 요약과 시민 영향 분석을 생성합니다. 공식 법률 해석이 아닙니다.',
  },
  {
    feature: '뉴스 프레임 비교',
    method: '15개 매체의 보도를 수집하고, 같은 사건에 대한 프레임 차이를 분석합니다. 매체 분류는 학술 연구(미디어연구, 한국언론학보 등)를 참고합니다.',
    aiRole: 'AI가 프레임 분석을 수행합니다. 학술 연구 기반 참고 분류이며 절대적 기준이 아닙니다.',
  },
  {
    feature: '국회의원 성적표',
    method: '열린국회정보에서 출석·발의·투표 데이터를 수집하고, AI가 발언과 투표의 일관성을 분석합니다.',
    aiRole: 'AI가 활동 점수와 일관성 분석을 산출합니다. 참고 지표이며 공식 평가가 아닙니다.',
  },
];

export default function AboutPage() {
  return (
    <div className="container-page py-8 max-w-4xl mx-auto">
      <h1 className="section-title">국정투명 소개</h1>

      <div className="card mb-8">
        <p className="text-lg text-gray-700 leading-relaxed">
          국정투명은 대한민국 시민이 정부의 운영을 <strong>수치 기반</strong>으로 투명하게 볼 수 있도록
          설계된 시민 투명성 플랫폼입니다. 의견이 아닌 데이터, 같은 기준으로 모든 정부를 봅니다.
        </p>
      </div>

      {/* 핵심 원칙 */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">핵심 원칙</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { title: '데이터 > 의견', desc: '모든 수치는 정부 공개 데이터로 뒷받침됩니다. 출처가 없는 주장은 싣지 않습니다.' },
            { title: '정치적 중립', desc: '김영삼부터 이재명까지 모든 정부에 동일한 기준을 적용합니다.' },
            { title: 'AI는 도구', desc: 'AI 분석은 참고 자료이며, 원시 데이터를 항상 함께 제공합니다.' },
            { title: '검증 가능', desc: '모든 데이터의 출처를 명시하고, 원본 데이터에 직접 접근할 수 있는 링크를 제공합니다.' },
          ].map(p => (
            <div key={p.title} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-1">{p.title}</h3>
              <p className="text-sm text-gray-600">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 데이터 출처 */}
      <section id="data" className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-2">데이터 출처</h2>
        <p className="text-sm text-gray-500 mb-4">
          모든 데이터는 공공데이터법(2013)에 따라 자유롭게 이용 가능한 정부 공개 데이터입니다.
          아래 출처를 직접 클릭하여 원본 데이터를 확인할 수 있습니다.
        </p>
        <div className="space-y-3">
          {DATA_SOURCES.map(src => (
            <div key={src.name} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{src.name}</h3>
                    {src.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                        검증됨
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{src.what}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {src.fields.map(f => (
                      <span key={f} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs text-accent hover:underline flex items-center gap-1"
                >
                  원본 확인
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 분석 방법론 */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-2">분석 방법론</h2>
        <p className="text-sm text-gray-500 mb-4">
          각 기능별로 어떤 데이터를 어떻게 분석하는지, AI가 어떤 역할을 하는지 투명하게 공개합니다.
        </p>
        <div className="space-y-3">
          {METHODOLOGY.map(m => (
            <div key={m.feature} className="card p-4">
              <h3 className="font-bold text-gray-900 mb-2">{m.feature}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400 text-xs font-semibold">방법</span>
                  <p className="text-gray-700">{m.method}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs font-semibold">AI 역할</span>
                  <p className={m.aiRole.startsWith('없음') ? 'text-green-700' : 'text-amber-700'}>{m.aiRole}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 시범 운영 안내 */}
      <section className="mb-10">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-amber-900 mb-2">시범 운영 안내</h2>
          <p className="text-sm text-amber-800 leading-relaxed">
            현재 국정투명은 <strong>시범 운영 단계</strong>입니다. 표시된 데이터는 정부 공개 데이터를 기반으로
            구성한 시범 데이터이며, 실시간 정부 API 연동이 완료되면 자동으로 업데이트됩니다.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-amber-700">
            <li className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              대통령 비교 재정 데이터: 기획재정부·한국은행 발표 실제 수치
            </li>
            <li className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              예산 분야별 배분: 기획재정부 발표 실제 예산안 수치
            </li>
            <li className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>
              AI 감사 계약 상세: 패턴은 실제 감사기법, 개별 계약은 시범 데이터
            </li>
            <li className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>
              뉴스 프레임: 보도 경향은 실제 기반, 개별 기사는 시범 데이터
            </li>
          </ul>
        </div>
      </section>

      {/* 문의 */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">문의</h2>
        <p className="text-sm text-gray-600">
          데이터 정확성에 대한 의문이나 수정 요청은 언제든 환영합니다.
        </p>
      </section>
    </div>
  );
}
