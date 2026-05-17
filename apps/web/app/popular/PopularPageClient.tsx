'use client';
// 화제의 감사 — 화제 뉴스 → 실제 조달 데이터 흔적
// 데이터: apps/web/public/data/popular-report.json (scripts/generate-popular-report.py)

import { useState } from 'react';
import type { PopularReport, PopularEntry } from '@/lib/types';

const PATTERN_KR: Record<string, string> = {
  ghost_company: '유령회사 의심',
  zero_competition: '경쟁 부재',
  bid_rate_anomaly: '낙찰률 이상',
  new_company_big_win: '신설업체 대형 수주',
  vendor_concentration: '업체 집중',
  repeated_sole_source: '반복 수의계약',
  contract_splitting: '계약 분할',
  low_bid_competition: '과소 경쟁',
  yearend_new_vendor: '연말 신규업체 수의계약',
  related_companies: '동일 대표/주소 업체',
  high_value_sole_source: '고액 수의계약',
  same_winner_repeat: '동일업체 반복 수주',
  amount_spike: '계약액 급증',
  bid_rigging: '입찰담합',
  contract_inflation: '계약 부풀리기',
  cross_pattern: '복합 의심',
  systemic_risk: '체계적 위험',
  sanctioned_vendor: '제재업체 재수주',
  price_clustering: '가격 군집',
  network_collusion: '네트워크 담합',
  rebid_same_winner: '재공고 동일낙찰',
};

function won(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}조원`;
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억원`;
  if (n >= 1e4) return `${Math.round(n / 1e4).toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
}

const STRENGTH_STYLE: Record<string, { bg: string; fg: string }> = {
  강함: { bg: '#FFE5E5', fg: '#C62828' },
  중간: { bg: '#FFF1DB', fg: '#B26A00' },
  약함: { bg: '#EAEFF5', fg: '#5A6B7B' },
};

function EntryCard({ entry, index }: { entry: PopularEntry; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const t = entry.traces;
  const strength = STRENGTH_STYLE[entry.trace_strength] ?? STRENGTH_STYLE['약함'];

  return (
    <section
      className="rounded-2xl bg-white mb-5 overflow-hidden"
      style={{ border: '0.5px solid rgba(60,60,67,0.14)' }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-5 py-4 hover:bg-black/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: '#EEF2FF', color: '#3730A3' }}
          >
            {entry.category}
          </span>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: strength.bg, color: strength.fg }}
          >
            흔적 {entry.trace_strength}
          </span>
          {entry.popular_topic.from_archive && (
            <span className="text-[11px] text-gray-400">아카이브 화제</span>
          )}
          <span className="text-[11px] text-gray-400 ml-auto">
            {open ? '접기 ▲' : '자세히 ▼'}
          </span>
        </div>
        <h2 className="text-base font-bold text-gray-900 leading-snug">
          {entry.theme_label}
        </h2>
        <p className="text-[13px] text-gray-500 mt-1 leading-snug">
          📰 화제 뉴스: {entry.popular_topic.title}
        </p>
        {/* KPI strip */}
        <div className="flex gap-5 mt-3 text-[13px]">
          <span>
            <b className="text-red-600">{t.finding_count.toLocaleString()}</b>
            <span className="text-gray-400"> 의심 발견</span>
          </span>
          <span>
            <b className="text-gray-900">{won(t.flagged_evidence_total_won)}</b>
            <span className="text-gray-400"> 관련 계약</span>
          </span>
          <span>
            <b className="text-gray-900">{t.distinct_vendors.toLocaleString()}</b>
            <span className="text-gray-400"> 업체</span>
          </span>
          <span className="hidden sm:inline">
            <b className="text-gray-900">{t.distinct_institutions.toLocaleString()}</b>
            <span className="text-gray-400"> 기관</span>
          </span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: 'rgba(60,60,67,0.10)' }}>
          {/* Claude Code 분석 */}
          <div className="mt-4">
            <h3 className="text-xs font-bold text-gray-500 mb-1">왜 감사 대상인가</h3>
            <p className="text-[13.5px] text-gray-800 leading-relaxed">
              {entry.analysis.auditable_angle}
            </p>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-bold text-gray-500 mb-1">무엇을 확인해야 하나</h3>
            <ul className="space-y-1">
              {entry.analysis.what_to_check.map((q, i) => (
                <li key={i} className="text-[13.5px] text-gray-800 leading-relaxed flex gap-2">
                  <span className="text-blue-500">·</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 rounded-xl px-4 py-3" style={{ background: '#F7F8FA' }}>
            <h3 className="text-xs font-bold text-gray-500 mb-1">시민 영향</h3>
            <p className="text-[13.5px] text-gray-800 leading-relaxed">
              {entry.analysis.citizen_impact}
            </p>
          </div>

          {/* 패턴 분포 */}
          <div className="mt-5">
            <h3 className="text-xs font-bold text-gray-500 mb-2">
              탐지된 패턴 ({t.date_range ? `${t.date_range[0]} ~ ${t.date_range[1]}` : '기간 미상'})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {t.pattern_breakdown.map(p => (
                <span
                  key={p.pattern}
                  className="text-[12px] px-2 py-1 rounded-lg bg-gray-100 text-gray-700"
                >
                  {PATTERN_KR[p.pattern] ?? p.pattern}{' '}
                  <b className="text-gray-900">{p.count}</b>
                </span>
              ))}
            </div>
          </div>

          {/* 상위 발견 */}
          <div className="mt-5">
            <h3 className="text-xs font-bold text-gray-500 mb-2">
              가장 의심스러운 발견 (상위 {t.top_findings.length})
            </h3>
            <div className="space-y-2.5">
              {t.top_findings.map(f => (
                <a
                  key={f.id}
                  href={`/audit/${f.id}`}
                  className="block rounded-xl px-4 py-3 hover:bg-black/[0.02] transition-colors"
                  style={{ border: '0.5px solid rgba(60,60,67,0.12)' }}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{
                        background:
                          f.suspicion_score >= 90 ? '#C62828'
                          : f.suspicion_score >= 75 ? '#E8730C'
                          : '#8896A6',
                      }}
                    >
                      {f.suspicion_score}점
                    </span>
                    <span className="text-[12px] font-semibold text-gray-700">
                      {PATTERN_KR[f.pattern_type] ?? f.pattern_type}
                    </span>
                    <span className="text-[12px] text-gray-400">·</span>
                    <span className="text-[12px] text-gray-500">{f.target_institution}</span>
                  </div>
                  <p className="text-[13px] text-gray-800 leading-snug">{f.summary}</p>
                  {f.evidence_contracts.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {f.evidence_contracts.slice(0, 3).map((e, i) => (
                        <div key={i} className="text-[12px] text-gray-500 truncate">
                          • {e.name} <span className="text-gray-400">/</span>{' '}
                          {e.vendor} <span className="text-gray-400">/</span>{' '}
                          <b className="text-gray-700">{won(e.amount)}</b>{' '}
                          <span className="text-gray-400">/ {e.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {f.innocent_explanation && (
                    <p className="text-[12px] text-gray-400 mt-1.5 leading-snug">
                      ⚖️ 무죄 추정: {f.innocent_explanation}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* 한계 / caveat */}
          <p
            className="mt-5 text-[12px] text-gray-500 leading-relaxed rounded-xl px-4 py-3"
            style={{ background: '#FFF9F0', border: '0.5px solid rgba(178,106,0,0.18)' }}
          >
            <b className="text-[#B26A00]">데이터 한계 — </b>
            {entry.caveat}
          </p>

          {/* 원문 기사 */}
          {entry.popular_topic.articles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-bold text-gray-500 mb-1.5">관련 보도</h3>
              <div className="space-y-1">
                {entry.popular_topic.articles.map((a, i) => (
                  <a
                    key={i}
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[12.5px] text-blue-600 hover:underline truncate"
                  >
                    [{a.outlet}] {a.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function PopularPageClient({ report }: { report: PopularReport }) {
  const empty = report.entries.length === 0;

  return (
    <div className="container-page py-8 max-w-3xl">
      {/* Hero */}
      <header className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {report.title}
        </h1>
        <p className="text-[14px] text-gray-500 mt-1.5 leading-relaxed">
          {report.subtitle}
        </p>
        <div className="mt-3 text-[12px] text-gray-400">
          뉴스 수집 {report.news_source_fetched_at?.slice(0, 10)} · 감사 발견{' '}
          {report.audit_findings_total.toLocaleString()}건 교차 확인 · 생성{' '}
          {report.generated_at?.slice(0, 10)}
        </div>
        <p
          className="mt-4 text-[12.5px] text-gray-600 leading-relaxed rounded-xl px-4 py-3"
          style={{ background: '#F7F8FA' }}
        >
          {report.method}
        </p>
      </header>

      {empty ? (
        <div className="rounded-2xl bg-white px-5 py-12 text-center text-gray-400 text-sm"
          style={{ border: '0.5px solid rgba(60,60,67,0.14)' }}>
          리포트 데이터가 아직 생성되지 않았습니다.
          <br />
          <code className="text-[12px]">uv run scripts/generate-popular-report.py</code>
        </div>
      ) : (
        report.entries.map((e, i) => <EntryCard key={e.theme_id} entry={e} index={i} />)
      )}

      {/* 화제이나 조달 무관 */}
      {report.popular_but_not_procurement.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold text-gray-500 mb-2">
            화제이지만 조달 데이터 흔적 없음 (정직하게 표기)
          </h2>
          <p className="text-[12px] text-gray-400 mb-3">
            아래 뉴스는 지금 화제지만 정부 조달·예산과 직접 연결되는 데이터 흔적이
            없어 감사 대상에서 제외했습니다.
          </p>
          <div className="rounded-2xl bg-white divide-y"
            style={{ border: '0.5px solid rgba(60,60,67,0.14)', borderColor: 'rgba(60,60,67,0.10)' }}>
            {report.popular_but_not_procurement.map((w, i) => (
              <div key={i} className="px-4 py-3">
                <p className="text-[13px] text-gray-700">{w.title}</p>
                <p className="text-[11.5px] text-gray-400 mt-0.5">
                  {w.article_count}개 기사 · {w.outlet_count}개 매체 — {w.reason}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-[11.5px] text-gray-400 leading-relaxed">
        ※ 모든 수치는 무죄 추정 원칙 하에 &lsquo;의심 정황&rsquo;으로 해석해야 하며,
        법적 판단이 아닙니다. 분석 서술은 Claude Code가 직접 작성했습니다.
      </p>
    </div>
  );
}
