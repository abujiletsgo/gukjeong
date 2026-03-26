import { getPresidents, getFiscalData, getDepartmentScores, getAuditFlags, getBills, getNewsEvents, getMediaOutlets } from '@/lib/data';
import { formatTrillions } from '@/lib/utils';
import Sparkline from '@/components/charts/Sparkline';

export default function HomePage() {
  const presidents = getPresidents();
  const fiscalData = getFiscalData();
  const departmentScores = getDepartmentScores();
  const auditFlags = getAuditFlags();
  const bills = getBills();
  const newsEvents = getNewsEvents();
  const outlets = getMediaOutlets();

  const latest = fiscalData[fiscalData.length - 1];
  const latest2024 = fiscalData.find(f => f.year === 2024);
  const spendingTrend = fiscalData.map(f => f.total_spending || 0).filter(v => v > 0);
  const debtTrend = fiscalData.map(f => f.national_debt || 0).filter(v => v > 0);

  const highSeverityFlags = auditFlags.filter(f => f.severity === 'HIGH').length;
  const passedBills = bills.filter(b => b.status === '가결').length;
  const totalArticles = newsEvents.reduce((sum, e) => sum + (e.article_count || 0), 0);

  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="bg-header text-white py-12 sm:py-16 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)"/></svg>
        </div>
        <div className="container-page text-center relative">
          {/* Logo icon */}
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 2L3 9v14l13 7 13-7V9L16 2z" stroke="#ff6b35" strokeWidth="2" fill="none"/><path d="M16 2v28M3 9l13 7 13-7" stroke="#ff6b35" strokeWidth="1.5" fill="none" opacity="0.5"/><circle cx="16" cy="16" r="4" fill="#ff6b35" opacity="0.8"/></svg>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            수치로 보는 대한민국 정부
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            공공데이터와 AI 분석으로 정부의 예산, 정책, 계약을 투명하게 보여주는 시민 플랫폼
          </p>

          {/* 핵심 수치 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              <div className="text-2xl sm:text-3xl font-bold">{latest?.total_spending || 728}조</div>
              <div className="text-xs text-gray-300 mt-1">2026 총지출(안)</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 20h20M5 20V10l4-6 4 4 4-7 3 3v16"/></svg>
              <div className="text-2xl sm:text-3xl font-bold">{latest2024?.national_debt || 1175}조</div>
              <div className="text-xs text-gray-300 mt-1">국가채무 (2024)</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21V7l9-5 9 5v14"/><path d="M9 21V12h6v9"/></svg>
              <div className="text-2xl sm:text-3xl font-bold">{presidents.length}명</div>
              <div className="text-xs text-gray-300 mt-1">역대 대통령</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>
              <div className="text-2xl sm:text-3xl font-bold">{auditFlags.length}건</div>
              <div className="text-xs text-gray-300 mt-1">AI 감지 의심 패턴</div>
            </div>
          </div>
        </div>
      </section>

      {/* 핵심 기능 카드 — 5개 기능 */}
      <section className="container-page py-10 sm:py-14">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">주요 기능</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* 대통령 비교 */}
          <a href="/presidents" className="card group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5"><path d="M3 21V7l9-5 9 5v14"/><path d="M9 21V12h6v9"/><circle cx="12" cy="4" r="1" fill="#2563eb"/></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-accent transition-colors mb-2">
              역대 대통령 비교
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              김영삼부터 현재까지 동일한 경제 지표로 비교합니다.
              GDP 성장률, 정부 지출, 국가채무 변화를 한눈에.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{presidents.length}명의 대통령</span>
              <span>·</span>
              <span>{fiscalData.length}년의 재정 데이터</span>
            </div>
            <div className="mt-4">
              <Sparkline data={spendingTrend} width={200} height={32} color="#3b82f6" showArea label="정부 지출 추이" />
            </div>
          </a>

          {/* 예산 시각화 */}
          <a href="/budget" className="card group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h0M18 12h0"/></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-accent transition-colors mb-2">
              예산 시각화
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              세입에서 세출까지의 자금 흐름, 분야별 예산 비중,
              국가채무 궤적을 인터랙티브 차트로 확인하세요.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>11개 분야</span>
              <span>·</span>
              <span>Sankey · TreeMap · 스택드 에리어</span>
            </div>
            <div className="mt-4">
              <Sparkline data={debtTrend} width={200} height={32} color="#ef4444" showArea label="국가채무 추이" />
            </div>
          </a>

          {/* AI 감사관 */}
          <a href="/audit" className="card group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-accent transition-colors mb-2">
              AI 감사관
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              나라장터 계약 데이터에서 AI가 연말 급증, 업체 집중,
              계약 분할 등 의심 패턴을 자동으로 탐지합니다.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{auditFlags.length}건 탐지</span>
              <span>·</span>
              <span>{highSeverityFlags}건 높은 심각도</span>
            </div>
            <div className="mt-4 flex gap-1">
              {departmentScores.slice(0, 8).map(d => (
                <div
                  key={d.department}
                  className="w-6 h-6 rounded text-[6px] flex items-center justify-center text-white font-bold"
                  style={{
                    backgroundColor: d.suspicion_score > 50 ? '#ef4444' :
                      d.suspicion_score > 30 ? '#f97316' :
                      d.suspicion_score > 15 ? '#eab308' : '#22c55e',
                    opacity: Math.max(0.5, d.suspicion_score / 80),
                  }}
                  title={d.department}
                >
                  {d.suspicion_score}
                </div>
              ))}
            </div>
          </a>
        </div>

        {/* Phase 2: 법안 + 뉴스 */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* 법안 추적 */}
          <a href="/bills" className="card group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6M8 9h2"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-accent transition-colors mb-2">
                  법안 추적
                </h2>
                <p className="text-sm text-gray-500 mb-3">
                  국회에서 발의된 법안의 현황, AI 요약, 투표 결과, 시민 영향 분석을 실시간으로 추적합니다.
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700">{passedBills}건 가결</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{bills.filter(b => b.status === '계류').length}건 계류</span>
                  <span className="text-gray-400">총 {bills.length}건</span>
                </div>
                {/* Mini bill status bar */}
                <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-gray-100">
                  <div className="bg-green-500" style={{ width: `${(passedBills / bills.length) * 100}%` }} />
                  <div className="bg-amber-400" style={{ width: `${(bills.filter(b => b.status === '계류').length / bills.length) * 100}%` }} />
                  <div className="bg-red-400" style={{ width: `${(bills.filter(b => b.status === '폐기').length / bills.length) * 100}%` }} />
                </div>
              </div>
            </div>
          </a>

          {/* 뉴스 프레임 비교 */}
          <a href="/news" className="card group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M10 6h8M10 10h4M10 14h8M10 18h5"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-accent transition-colors mb-2">
                  뉴스 프레임 비교
                </h2>
                <p className="text-sm text-gray-500 mb-3">
                  같은 사건을 진보와 보수 미디어가 어떻게 다르게 보도하는지 프레임을 비교합니다.
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400">{newsEvents.length}개 이벤트</span>
                  <span className="text-gray-400">{totalArticles.toLocaleString()}건 기사</span>
                  <span className="text-gray-400">{outlets.length}개 매체</span>
                </div>
                {/* Mini spectrum bar */}
                <div className="mt-3 h-2 rounded-full bg-gradient-to-r from-blue-500 via-gray-300 to-red-500 relative">
                  {outlets.slice(0, 6).map((o, i) => (
                    <div
                      key={o.id}
                      className="absolute w-2 h-2 bg-white rounded-full border border-gray-400 -top-0"
                      style={{ left: `${((o.spectrum_score - 1) / 4) * 100}%` }}
                      title={o.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* 데이터 출처 */}
      <section className="bg-gray-50 py-10 border-t border-gray-100">
        <div className="container-page text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-4">공공데이터 기반</h2>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              기획재정부
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 20h20M5 20V10l4-6 4 4 4-7 3 3v16"/></svg>
              한국은행 ECOS
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
              나라장터 (조달청)
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/></svg>
              열린국회정보
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
              공공데이터포털
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-4 max-w-xl mx-auto">
            모든 데이터는 대한민국 정부가 공개한 공공데이터를 기반으로 합니다.
            미디어 분류는 학술 연구 기반 참고 분류이며, 감사 분석은 AI 기반 의심 패턴 탐지 결과입니다.
          </p>
        </div>
      </section>
    </div>
  );
}
