import Link from 'next/link';
import { getPresidents, getFiscalData, getDepartmentScores, getAuditFlags, getBills, getNewsEvents, getMediaOutlets, getLegislators } from '@/lib/data';
import { getRealStats } from '@/lib/real-stats';

// ISR: 홈페이지는 1시간마다 재생성
export const revalidate = 3600;
import Sparkline from '@/components/charts/Sparkline';
import PresidentPortrait from '@/components/presidents/PresidentPortrait';
import HomeRealDataOverlay from './HomeRealDataOverlay';
import HomeSearchBox from './HomeSearchBox';
import RegionQuickFinder from './RegionQuickFinder';

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
  const seedPassed = bills.filter(b => b.status === '가결').length;
  const seedPending = bills.filter(b => b.status === '계류').length;
  const recentPresidents = presidents.slice(-4);
  const avgAttendance = Math.round(legislators.reduce((s, l) => s + (l.attendance_rate || 0), 0) / legislators.length);

  // 실데이터 통계 (파이프라인 산출물 기준) — 없으면 시드로 폴백
  const real = getRealStats();
  const auditCount = real?.audit_findings ?? auditFlags.length;
  const highFlags = real?.audit_high ?? auditFlags.filter(f => f.severity === 'HIGH').length;
  const billCount = real?.bills_total || bills.length;
  const passedBills = real?.bills_passed || seedPassed;
  const pendingBills = real?.bills_pending || seedPending;
  const legislatorCount = real?.legislators_total || legislators.length;

  return (
    <div>
      {/* ━━━ HERO ━━━ */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0f6ff 50%, #e8f2ff 100%)' }}
      >
        {/* Subtle radial highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,122,255,0.07) 0%, transparent 70%)',
          }}
        />
        {/* Dot mesh pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%"><defs><pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="16" cy="16" r="1" fill="#007AFF"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>
        </div>
        <div className="container-page relative py-16 sm:py-24 md:py-32">
          <p
            className="text-sm font-semibold tracking-widest uppercase mb-4"
            style={{ color: 'var(--apple-blue, #007AFF)' }}
          >
            공공데이터 + AI 분석
          </p>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.08] -tracking-tight max-w-3xl"
            style={{ color: 'var(--color-label, #000)' }}
          >
            숫자로 보는<br />대한민국 정부
          </h1>
          <p
            className="text-base sm:text-lg mt-6 max-w-xl leading-relaxed"
            style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}
          >
            의견이 아닌 데이터. 같은 기준, 모든 정부.
          </p>
          <HomeSearchBox />
          <RegionQuickFinder />
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/presidents" className="btn-primary">대통령 비교 보기</Link>
            <Link href="/budget" className="btn-secondary">예산 흐름 보기</Link>
            <Link href="/popular" className="btn-secondary">화제의 감사 보기</Link>
          </div>
        </div>
      </section>

      {/* ━━━ REAL DATA OVERLAY (client component) ━━━ */}
      <HomeRealDataOverlay
        seedAuditCount={auditCount}
        seedLegislatorCount={legislatorCount}
      />

      {/* ━━━ NUMBERS BAR (각 수치는 해당 섹션으로 연결) ━━━ */}
      <section style={{ backgroundColor: 'var(--apple-gray-6, #F2F2F7)' }}>
        <div className="container-page py-6 sm:py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8">
            {([
              [`${latest?.total_spending || 728}`, '조', '2026 정부 지출', '/budget', ''],
              [`${latest2024?.national_debt || 1175}`, '조', '국가채무', '/budget', ''],
              [`${presidents.length}`, '명', '역대 대통령', '/presidents', ''],
              [`${legislatorCount}`, '명', '국회의원 추적', '/legislators', ''],
              [`${billCount.toLocaleString()}`, '건', '법안 분석', '/bills', 'hidden lg:block'],
              [`${auditCount.toLocaleString()}`, '건', 'AI 감지 패턴', '/audit', 'hidden lg:block'],
            ] as [string, string, string, string, string][]).map(([num, unit, label, href, cls]) => (
              <Link key={label} href={href} className={`${cls} group`}>
                <div
                  className="text-3xl sm:text-4xl font-black tabular-nums group-hover:text-blue-600 transition-colors"
                  style={{ color: 'var(--color-label, #000)' }}
                >
                  {num}
                  <span
                    className="text-lg font-bold ml-0.5"
                    style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}
                  >{unit}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>
                  {label} <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FEATURES GRID ━━━ */}
      <section className="container-page py-12 sm:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

          {/* 대통령 비교 */}
          <Link href="/presidents" className="card group relative p-6 block hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ color: 'var(--apple-blue, #007AFF)', backgroundColor: 'rgba(0,122,255,0.1)' }}
              >대통령</span>
              <svg
                className="w-4 h-4 transition-all group-hover:translate-x-1"
                style={{ color: 'var(--apple-blue, #007AFF)', opacity: 0 }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              ><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-label, #000)' }}>역대 대통령 비교</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>동일 기준, 동일 데이터로 8명의 대통령을 비교합니다.</p>
            {/* Mini portraits row */}
            <div className="flex items-center -space-x-2 mb-4">
              {recentPresidents.map(p => (
                <PresidentPortrait key={p.id} id={p.id} name={p.name} party={p.party} size={36} />
              ))}
              <span className="text-xs ml-3" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>외 {presidents.length - 4}명</span>
            </div>
            <Sparkline data={spendingTrend} width={280} height={36} color="#007AFF" showArea />
          </Link>

          {/* 예산 */}
          <Link href="/budget" className="card group relative p-6 block hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ color: 'var(--apple-green, #34C759)', backgroundColor: 'rgba(52,199,89,0.12)' }}
              >예산</span>
              <svg
                className="w-4 h-4 transition-all group-hover:translate-x-1"
                style={{ color: 'var(--apple-blue, #007AFF)', opacity: 0 }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              ><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-label, #000)' }}>예산 시각화</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>728조가 어디서 오고 어디로 가는지 한눈에.</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg py-2.5" style={{ backgroundColor: 'var(--apple-gray-6, #F2F2F7)' }}>
                <div className="text-base font-bold" style={{ color: 'var(--color-label, #000)' }}>11</div>
                <div className="text-[10px]" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>분야</div>
              </div>
              <div className="rounded-lg py-2.5" style={{ backgroundColor: 'var(--apple-gray-6, #F2F2F7)' }}>
                <div className="text-base font-bold" style={{ color: 'var(--color-label, #000)' }}>29</div>
                <div className="text-[10px]" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>연도</div>
              </div>
              <div className="rounded-lg py-2.5" style={{ backgroundColor: 'var(--apple-gray-6, #F2F2F7)' }}>
                <div className="text-base font-bold" style={{ color: 'var(--color-label, #000)' }}>46.8%</div>
                <div className="text-[10px]" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>채무/GDP</div>
              </div>
            </div>
            <div className="mt-4">
              <Sparkline data={debtTrend} width={280} height={36} color="#34C759" showArea />
            </div>
          </Link>

          {/* AI 감사 */}
          <Link href="/audit" className="card group relative p-6 block hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ color: 'var(--apple-red, #FF3B30)', backgroundColor: 'rgba(255,59,48,0.1)' }}
              >AI 감사</span>
              <svg
                className="w-4 h-4 transition-all group-hover:translate-x-1"
                style={{ color: 'var(--apple-blue, #007AFF)', opacity: 0 }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              ><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-label, #000)' }}>AI 감사관</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>정부 계약에서 의심 패턴을 AI가 자동 탐지합니다.</p>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <div className="text-2xl font-black" style={{ color: 'var(--color-label, #000)' }}>{auditCount.toLocaleString()}</div>
                <div className="text-[10px]" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>탐지 건수</div>
              </div>
              <div>
                <div className="text-2xl font-black" style={{ color: 'var(--apple-red, #FF3B30)' }}>{highFlags.toLocaleString()}</div>
                <div className="text-[10px]" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>높은 심각도</div>
              </div>
              <div>
                <div className="text-2xl font-black" style={{ color: 'var(--color-label, #000)' }}>{(real?.audit_institutions ?? departmentScores.length).toLocaleString()}</div>
                <div className="text-[10px]" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>기관 모니터링</div>
              </div>
            </div>
            {/* Mini heatmap */}
            <div className="flex gap-1 flex-wrap">
              {departmentScores.slice(0, 12).map(d => (
                <div
                  key={d.department}
                  className="w-5 h-5 rounded-sm"
                  style={{
                    backgroundColor: d.suspicion_score > 50 ? '#FF3B30' :
                      d.suspicion_score > 30 ? '#FF9500' :
                      d.suspicion_score > 15 ? '#FFCC00' : '#34C759',
                    opacity: Math.max(0.4, d.suspicion_score / 80),
                  }}
                  title={`${d.department}: ${d.suspicion_score}`}
                />
              ))}
            </div>
          </Link>

          {/* 법안 */}
          <Link href="/bills" className="card group relative p-6 block hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ color: '#FF9500', backgroundColor: 'rgba(255,149,0,0.1)' }}
              >법안</span>
              <svg
                className="w-4 h-4 transition-all group-hover:translate-x-1"
                style={{ color: 'var(--apple-blue, #007AFF)', opacity: 0 }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              ><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-label, #000)' }}>법안 추적</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>국회 법안의 AI 요약, 투표 결과, 시민 영향 분석.</p>
            <div className="flex items-center gap-6 mb-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black" style={{ color: 'var(--apple-green, #34C759)' }}>{passedBills}</span>
                <span className="text-xs" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>가결</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black" style={{ color: '#FF9500' }}>{pendingBills}</span>
                <span className="text-xs" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>계류</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>{billCount.toLocaleString()}</span>
                <span className="text-xs" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>전체</span>
              </div>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--apple-gray-6, #F2F2F7)' }}>
              <div className="transition-all" style={{ backgroundColor: 'var(--apple-green, #34C759)', width: `${(passedBills / billCount) * 100}%` }} />
              <div className="transition-all" style={{ backgroundColor: '#FF9500', width: `${(pendingBills / billCount) * 100}%` }} />
              <div className="transition-all" style={{ backgroundColor: 'var(--apple-red, #FF3B30)', width: `${Math.max(0, ((billCount - passedBills - pendingBills) / billCount) * 100)}%` }} />
            </div>
          </Link>

          {/* 국회의원 */}
          <Link href="/legislators" className="card group relative p-6 block hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ color: '#5856D6', backgroundColor: 'rgba(88,86,214,0.1)' }}
              >국회의원</span>
              <svg
                className="w-4 h-4 transition-all group-hover:translate-x-1"
                style={{ color: 'var(--apple-blue, #007AFF)', opacity: 0 }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              ><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-label, #000)' }}>국회의원 활동 현황</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>출석, 발의, 발언, 말과 행동 일치도 종합 평가.</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg py-2.5" style={{ backgroundColor: 'var(--apple-gray-6, #F2F2F7)' }}>
                <div className="text-base font-bold" style={{ color: 'var(--color-label, #000)' }}>{legislators.length}명</div>
                <div className="text-[10px]" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>추적 중</div>
              </div>
              <div className="rounded-lg py-2.5" style={{ backgroundColor: 'var(--apple-gray-6, #F2F2F7)' }}>
                <div className="text-base font-bold" style={{ color: 'var(--color-label, #000)' }}>{avgAttendance}%</div>
                <div className="text-[10px]" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>평균 출석률</div>
              </div>
              <div className="rounded-lg py-2.5" style={{ backgroundColor: 'var(--apple-gray-6, #F2F2F7)' }}>
                <div className="text-base font-bold" style={{ color: 'var(--color-label, #000)' }}>5</div>
                <div className="text-[10px]" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>정당</div>
              </div>
            </div>
          </Link>

          {/* 뉴스 프레임 */}
          <Link href="/news" className="card group relative p-6 block hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))', backgroundColor: 'var(--apple-gray-6, #F2F2F7)' }}
              >뉴스</span>
              <svg
                className="w-4 h-4 transition-all group-hover:translate-x-1"
                style={{ color: 'var(--apple-blue, #007AFF)', opacity: 0 }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              ><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-label, #000)' }}>뉴스 프레임 비교</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>같은 사건, 다른 보도. {outlets.length}개 매체 프레임 분석.</p>
            {/* Mini spectrum */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>
                <span>진보</span>
                <span>중도</span>
                <span>보수</span>
              </div>
              <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-gray-300 to-red-500 relative">
                {outlets.slice(0, 8).map(o => (
                  <div
                    key={o.id}
                    className="absolute w-2.5 h-2.5 bg-white rounded-full top-0.5"
                    style={{
                      border: '2px solid rgba(60,60,67,0.4)',
                      left: `${((o.spectrum_score - 1) / 4) * 100}%`,
                      transform: 'translateX(-50%)',
                    }}
                    title={o.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>
              <span>{newsEvents.length}개 이벤트</span>
              <span>{newsEvents.reduce((s, e) => s + (e.article_count || 0), 0).toLocaleString()}건 기사</span>
            </div>
          </Link>

          {/* 화제의 감사 */}
          <Link href="/popular" className="card group relative p-6 block hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ color: '#FF2D55', backgroundColor: 'rgba(255,45,85,0.1)' }}
              >화제</span>
              <svg
                className="w-4 h-4 transition-all group-hover:translate-x-1"
                style={{ color: 'var(--apple-blue, #007AFF)', opacity: 0 }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              ><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-label, #000)' }}>화제의 감사</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>
              지금 뉴스를 달구는 이슈를 실제 감사 데이터와 교차 검증합니다.
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#FF2D55' }} />
              <span>이번 주 화제 뉴스 × 조달 계약 기록 대조</span>
            </div>
          </Link>

          {/* 지역 재정 */}
          <Link href="/local" className="card group relative p-6 block hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ color: '#00C7BE', backgroundColor: 'rgba(0,199,190,0.1)' }}
              >지역</span>
              <svg
                className="w-4 h-4 transition-all group-hover:translate-x-1"
                style={{ color: 'var(--apple-blue, #007AFF)', opacity: 0 }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              ><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-label, #000)' }}>내 지역 재정</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>
              우리 동네 재정자립도, 채무, 인구 변화를 17개 시도별로 봅니다.
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#00C7BE' }} />
              <span>17개 시도 · 재정자립도 · 소멸위험</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ━━━ DATA SOURCES ━━━ */}
      <section style={{ borderTop: '1px solid var(--apple-gray-6, #F2F2F7)' }}>
        <div className="container-page py-10 sm:py-12">
          <div
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm"
            style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}
          >
            <span>기획재정부</span>
            <span className="hidden sm:inline" style={{ color: 'rgba(60,60,67,0.2)' }}>|</span>
            <span>한국은행 ECOS</span>
            <span className="hidden sm:inline" style={{ color: 'rgba(60,60,67,0.2)' }}>|</span>
            <span>나라장터</span>
            <span className="hidden sm:inline" style={{ color: 'rgba(60,60,67,0.2)' }}>|</span>
            <span>열린국회정보</span>
            <span className="hidden sm:inline" style={{ color: 'rgba(60,60,67,0.2)' }}>|</span>
            <span>공공데이터포털</span>
          </div>
          <p className="text-center text-[11px] mt-4 max-w-lg mx-auto" style={{ color: 'rgba(60,60,67,0.35)' }}>
            모든 수치는 정부 공개 데이터 기반. 미디어 분류는 학술 연구 참고 분류. AI 분석은 참고용이며 공식 판단이 아닙니다.
          </p>
        </div>
      </section>
    </div>
  );
}
