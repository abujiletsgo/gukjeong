import { getPresidents, getFiscalData, getDepartmentScores, getAuditFlags, getBills, getNewsEvents, getMediaOutlets, getLegislators } from '@/lib/data';

// ISR: 홈페이지는 1시간마다 재생성
export const revalidate = 3600;
import Sparkline from '@/components/charts/Sparkline';
import PresidentPortrait from '@/components/presidents/PresidentPortrait';

export default function HomePage() {
  const presidents = getPresidents();
  const fiscalData = getFiscalData();
  const departmentScores = getDepartmentScores();
  const auditFlags = getAuditFlags();
  const bills = getBills();
  const newsEvents = getNewsEvents();
  const outlets = getMediaOutlets();
  const legislators = getLegislators();

  const latest = fiscalData[fiscalData.length - 1];
  const latest2024 = fiscalData.find(f => f.year === 2024);
  const spendingTrend = fiscalData.map(f => f.total_spending || 0).filter(v => v > 0);
  const debtTrend = fiscalData.map(f => f.national_debt || 0).filter(v => v > 0);
  const highFlags = auditFlags.filter(f => f.severity === 'HIGH').length;
  const passedBills = bills.filter(b => b.status === '가결').length;
  const pendingBills = bills.filter(b => b.status === '계류').length;
  const recentPresidents = presidents.slice(-4);
  const avgAttendance = Math.round(legislators.reduce((s, l) => s + (l.attendance_rate || 0), 0) / legislators.length);

  return (
    <div>
      {/* ━━━ HERO ━━━ */}
      <section className="bg-header text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%"><defs><pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="16" cy="16" r="1" fill="white"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>
        </div>
        <div className="container-page relative py-16 sm:py-24 md:py-32">
          <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">공공데이터 + AI 분석</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight max-w-3xl">
            숫자로 보는<br />대한민국 정부
          </h1>
          <p className="text-gray-400 text-base sm:text-lg mt-6 max-w-xl leading-relaxed">
            의견이 아닌 데이터. 같은 기준, 모든 정부.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <a href="/presidents" className="btn-primary">대통령 비교 보기</a>
            <a href="/budget" className="bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm">예산 흐름 보기</a>
          </div>
        </div>
      </section>

      {/* ━━━ NUMBERS BAR ━━━ */}
      <section className="bg-white border-b border-gray-100">
        <div className="container-page py-6 sm:py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 tabular-nums">{latest?.total_spending || 728}<span className="text-lg font-bold text-gray-400">조</span></div>
              <div className="text-xs text-gray-400 mt-1">2026 정부 지출</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 tabular-nums">{latest2024?.national_debt || 1175}<span className="text-lg font-bold text-gray-400">조</span></div>
              <div className="text-xs text-gray-400 mt-1">국가채무</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 tabular-nums">{presidents.length}<span className="text-lg font-bold text-gray-400">명</span></div>
              <div className="text-xs text-gray-400 mt-1">역대 대통령</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 tabular-nums">{legislators.length}<span className="text-lg font-bold text-gray-400">명</span></div>
              <div className="text-xs text-gray-400 mt-1">국회의원 추적</div>
            </div>
            <div className="hidden lg:block">
              <div className="text-3xl sm:text-4xl font-black text-gray-900 tabular-nums">{bills.length}<span className="text-lg font-bold text-gray-400">건</span></div>
              <div className="text-xs text-gray-400 mt-1">법안 분석</div>
            </div>
            <div className="hidden lg:block">
              <div className="text-3xl sm:text-4xl font-black text-gray-900 tabular-nums">{auditFlags.length}<span className="text-lg font-bold text-gray-400">건</span></div>
              <div className="text-xs text-gray-400 mt-1">AI 감지 패턴</div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FEATURES GRID ━━━ */}
      <section className="container-page py-12 sm:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

          {/* 대통령 비교 */}
          <a href="/presidents" className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">대통령</span>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-accent group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">역대 대통령 비교</h3>
            <p className="text-sm text-gray-500 mb-5">동일 기준, 동일 데이터로 8명의 대통령을 비교합니다.</p>
            {/* Mini portraits row */}
            <div className="flex items-center -space-x-2 mb-4">
              {recentPresidents.map(p => (
                <PresidentPortrait key={p.id} id={p.id} name={p.name} party={p.party} size={36} />
              ))}
              <span className="text-xs text-gray-400 ml-3">외 {presidents.length - 4}명</span>
            </div>
            <Sparkline data={spendingTrend} width={280} height={36} color="#3b82f6" showArea />
          </a>

          {/* 예산 */}
          <a href="/budget" className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">예산</span>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-accent group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">예산 시각화</h3>
            <p className="text-sm text-gray-500 mb-5">728조가 어디서 오고 어디로 가는지 한눈에.</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg py-2.5">
                <div className="text-base font-bold text-gray-900">11</div>
                <div className="text-[10px] text-gray-400">분야</div>
              </div>
              <div className="bg-gray-50 rounded-lg py-2.5">
                <div className="text-base font-bold text-gray-900">29</div>
                <div className="text-[10px] text-gray-400">연도</div>
              </div>
              <div className="bg-gray-50 rounded-lg py-2.5">
                <div className="text-base font-bold text-red-500">46.8%</div>
                <div className="text-[10px] text-gray-400">채무/GDP</div>
              </div>
            </div>
            <div className="mt-4">
              <Sparkline data={debtTrend} width={280} height={36} color="#ef4444" showArea />
            </div>
          </a>

          {/* AI 감사 */}
          <a href="/audit" className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">AI 감사</span>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-accent group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">AI 감사관</h3>
            <p className="text-sm text-gray-500 mb-5">정부 계약에서 의심 패턴을 AI가 자동 탐지합니다.</p>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <div className="text-2xl font-black text-gray-900">{auditFlags.length}</div>
                <div className="text-[10px] text-gray-400">탐지 건수</div>
              </div>
              <div>
                <div className="text-2xl font-black text-red-500">{highFlags}</div>
                <div className="text-[10px] text-gray-400">높은 심각도</div>
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">{departmentScores.length}</div>
                <div className="text-[10px] text-gray-400">부처 모니터링</div>
              </div>
            </div>
            {/* Mini heatmap */}
            <div className="flex gap-1 flex-wrap">
              {departmentScores.slice(0, 12).map(d => (
                <div
                  key={d.department}
                  className="w-5 h-5 rounded-sm"
                  style={{
                    backgroundColor: d.suspicion_score > 50 ? '#ef4444' :
                      d.suspicion_score > 30 ? '#f97316' :
                      d.suspicion_score > 15 ? '#eab308' : '#22c55e',
                    opacity: Math.max(0.4, d.suspicion_score / 80),
                  }}
                  title={`${d.department}: ${d.suspicion_score}`}
                />
              ))}
            </div>
          </a>

          {/* 법안 */}
          <a href="/bills" className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">법안</span>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-accent group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">법안 추적</h3>
            <p className="text-sm text-gray-500 mb-5">국회 법안의 AI 요약, 투표 결과, 시민 영향 분석.</p>
            <div className="flex items-center gap-6 mb-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-green-600">{passedBills}</span>
                <span className="text-xs text-gray-400">가결</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-500">{pendingBills}</span>
                <span className="text-xs text-gray-400">계류</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-400">{bills.length}</span>
                <span className="text-xs text-gray-400">전체</span>
              </div>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
              <div className="bg-green-500 transition-all" style={{ width: `${(passedBills / bills.length) * 100}%` }} />
              <div className="bg-amber-400 transition-all" style={{ width: `${(pendingBills / bills.length) * 100}%` }} />
              <div className="bg-red-400 transition-all" style={{ width: `${(bills.filter(b => b.status === '폐기').length / bills.length) * 100}%` }} />
            </div>
          </a>

          {/* 국회의원 */}
          <a href="/legislators" className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">국회의원</span>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-accent group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">국회의원 활동 현황</h3>
            <p className="text-sm text-gray-500 mb-5">출석, 발의, 발언, 말과 행동 일치도 종합 평가.</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg py-2.5">
                <div className="text-base font-bold text-gray-900">{legislators.length}명</div>
                <div className="text-[10px] text-gray-400">추적 중</div>
              </div>
              <div className="bg-gray-50 rounded-lg py-2.5">
                <div className="text-base font-bold text-gray-900">{avgAttendance}%</div>
                <div className="text-[10px] text-gray-400">평균 출석률</div>
              </div>
              <div className="bg-gray-50 rounded-lg py-2.5">
                <div className="text-base font-bold text-gray-900">5</div>
                <div className="text-[10px] text-gray-400">정당</div>
              </div>
            </div>
          </a>

          {/* 뉴스 프레임 */}
          <a href="/news" className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">뉴스</span>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-accent group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">뉴스 프레임 비교</h3>
            <p className="text-sm text-gray-500 mb-5">같은 사건, 다른 보도. {outlets.length}개 매체 프레임 분석.</p>
            {/* Mini spectrum */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>진보</span>
                <span>중도</span>
                <span>보수</span>
              </div>
              <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-gray-300 to-red-500 relative">
                {outlets.slice(0, 8).map(o => (
                  <div
                    key={o.id}
                    className="absolute w-2.5 h-2.5 bg-white rounded-full border-2 border-gray-500 top-0.5"
                    style={{ left: `${((o.spectrum_score - 1) / 4) * 100}%`, transform: 'translateX(-50%)' }}
                    title={o.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{newsEvents.length}개 이벤트</span>
              <span>{newsEvents.reduce((s, e) => s + (e.article_count || 0), 0).toLocaleString()}건 기사</span>
            </div>
          </a>
        </div>
      </section>

      {/* ━━━ DATA SOURCES ━━━ */}
      <section className="border-t border-gray-100">
        <div className="container-page py-10 sm:py-12">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-400">
            <span>기획재정부</span>
            <span className="hidden sm:inline text-gray-200">|</span>
            <span>한국은행 ECOS</span>
            <span className="hidden sm:inline text-gray-200">|</span>
            <span>나라장터</span>
            <span className="hidden sm:inline text-gray-200">|</span>
            <span>열린국회정보</span>
            <span className="hidden sm:inline text-gray-200">|</span>
            <span>공공데이터포털</span>
          </div>
          <p className="text-center text-[11px] text-gray-300 mt-4 max-w-lg mx-auto">
            모든 수치는 정부 공개 데이터 기반. 미디어 분류는 학술 연구 참고 분류. AI 분석은 참고용이며 공식 판단이 아닙니다.
          </p>
        </div>
      </section>
    </div>
  );
}
