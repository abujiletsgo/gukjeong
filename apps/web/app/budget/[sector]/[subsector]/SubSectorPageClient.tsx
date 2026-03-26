'use client';

import Link from 'next/link';
import type { SectorDetail, SubSectorDetail } from '@/lib/types';

const SECTOR_BASE_COLORS: Record<string, string> = {
  '보건·복지·고용': '#3b82f6',
  '교육': '#8b5cf6',
  '국방': '#ef4444',
  '일반·지방행정': '#f59e0b',
  '산업·중소기업·에너지': '#10b981',
  'R&D': '#06b6d4',
  '공공질서·안전': '#f43f5e',
  'SOC': '#84cc16',
  '농림·수산·식품': '#14b8a6',
  '환경': '#22c55e',
  '문화·체육·관광': '#a855f7',
};

interface SubSectorPageClientProps {
  sector: SectorDetail;
  subSector: SubSectorDetail;
}

export default function SubSectorPageClient({ sector, subSector }: SubSectorPageClientProps) {
  const baseColor = SECTOR_BASE_COLORS[sector.name] || '#6b7280';
  const maxBreakdownAmount = subSector.breakdown
    ? Math.max(...subSector.breakdown.map(b => b.amount), 0.01)
    : 0;

  return (
    <div className="container-page py-6 sm:py-8">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5 flex-wrap">
        <Link href="/budget" className="hover:text-gray-600 transition-colors">예산</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        <Link href={`/budget/${sector.id}`} className="hover:text-gray-600 transition-colors">{sector.name}</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        <span className="text-gray-700 font-medium">{subSector.name}</span>
      </nav>

      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{subSector.name}</h1>
        <div className="flex flex-wrap items-baseline gap-3 mb-3">
          <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            {subSector.amount.toFixed(1)}조원
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: `${baseColor}15`, color: baseColor }}
        >
          {sector.name}의 {subSector.percentage.toFixed(1)}%
        </span>
      </div>

      {/* 상세 섹션 */}
      <div className="space-y-5 mb-8">
        {/* 1. 이 예산이 하는 일 */}
        <div className="card">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            이 예산이 하는 일
          </h3>
          <p className="text-base text-gray-700 leading-relaxed">{subSector.description}</p>
        </div>

        {/* 2. 누가 받나 */}
        <div className="card">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            누가 받나
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{subSector.who_receives}</p>
        </div>

        {/* 3. 어떻게 집행되나 */}
        <div className="card">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            어떻게 집행되나
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{subSector.how_it_works}</p>
        </div>

        {/* 4. 시민 생활에 미치는 영향 */}
        <div className="card">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
            시민 생활에 미치는 영향
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{subSector.citizen_impact}</p>
        </div>

        {/* 5. 구체적 사례 */}
        <div className="card border-l-4" style={{ borderLeftColor: baseColor }}>
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            구체적 사례
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{subSector.real_example}&rdquo;</p>
        </div>

        {/* 6. 추세 */}
        <div className="card">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5"><path d="M2 20h20M6 20V12l4-4 4 4 4-8v16"/></svg>
            추세
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{subSector.trend}</p>
        </div>

        {/* 7. 문제점 (있는 경우) */}
        {subSector.issues && (
          <div className="card border-amber-200 bg-amber-50/50">
            <h3 className="flex items-center gap-2 font-bold text-amber-800 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
              문제점
            </h3>
            <p className="text-sm text-amber-700 leading-relaxed">{subSector.issues}</p>
          </div>
        )}

        {/* 8. 관련 법률 */}
        {subSector.related_laws && subSector.related_laws.length > 0 && (
          <div className="card">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
              관련 법률
            </h3>
            <div className="flex flex-wrap gap-2">
              {subSector.related_laws.map(law => (
                <span
                  key={law}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                >
                  {law}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3단계 세부 내역 (breakdown) */}
      {subSector.breakdown && subSector.breakdown.length > 0 && (
        <div className="card mb-8">
          <h2 className="flex items-center gap-2 font-bold text-lg text-gray-900 mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M3 15h18M9 3v18"/>
            </svg>
            세부 내역
          </h2>
          <p className="text-xs text-gray-400 mb-5">이 항목의 상세 집행 내역입니다</p>

          <div className="space-y-3">
            {subSector.breakdown.map((item, idx) => {
              const barWidth = Math.max(5, (item.amount / maxBreakdownAmount) * 100);
              return (
                <div key={idx} className="rounded-lg p-3 bg-gray-50/80">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-800 w-40 sm:w-52 shrink-0">
                      {item.name}
                    </span>
                    <div className="flex-1 h-5 bg-gray-200/60 rounded relative overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{ width: `${barWidth}%`, backgroundColor: baseColor, opacity: 0.7 }}
                      />
                    </div>
                    <div className="text-right shrink-0 w-20">
                      <span className="text-sm font-semibold text-gray-800">{item.amount.toFixed(1)}</span>
                      <span className="text-xs text-gray-400 ml-0.5">조</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed ml-0 sm:ml-0">
                    {item.description}
                  </p>
                  {item.recipient && (
                    <p className="text-xs text-gray-400 mt-1">
                      수혜 대상: {item.recipient}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-gray-300 mt-4">
            출처: 기획재정부 나라살림 예산개요 · 2026년 예산안 기준
          </p>
        </div>
      )}

      {/* 뒤로 가기 링크 */}
      <div className="flex items-center gap-4">
        <Link
          href={`/budget/${sector.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {sector.name} 전체 보기
        </Link>
        <Link
          href="/budget"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
          예산 시각화 홈
        </Link>
      </div>
    </div>
  );
}
