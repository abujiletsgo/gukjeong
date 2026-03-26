'use client';

import Link from 'next/link';
import type { SectorDetail } from '@/lib/types';

// 분야별 색상 (base + gradient)
const SECTOR_COLORS: Record<string, { base: string; gradient: string[] }> = {
  '보건·복지·고용': { base: '#3b82f6', gradient: ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93bbfd', '#bfdbfe', '#dbeafe', '#eff6ff', '#c7d9f7', '#a5c4f3', '#93bbfd', '#7eaaf0', '#6b9ae5', '#5889d9', '#4a7ace', '#3e6bc3', '#325db8', '#2750ad', '#1d44a3'] },
  '교육': { base: '#8b5cf6', gradient: ['#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff', '#d8d0f9', '#c0b5f3', '#a99bec', '#9282e5', '#7b69de'] },
  '국방': { base: '#ef4444', gradient: ['#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5'] },
  '일반·지방행정': { base: '#f59e0b', gradient: ['#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fde68a'] },
  '산업·중소기업·에너지': { base: '#10b981', gradient: ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'] },
  'R&D': { base: '#06b6d4', gradient: ['#0e7490', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'] },
  '공공질서·안전': { base: '#f43f5e', gradient: ['#be123c', '#e11d48', '#f43f5e', '#fb7185', '#fda4af'] },
  'SOC': { base: '#84cc16', gradient: ['#4d7c0f', '#65a30d', '#84cc16', '#a3e635', '#bef264', '#d9f99d'] },
  '농림·수산·식품': { base: '#14b8a6', gradient: ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'] },
  '환경': { base: '#22c55e', gradient: ['#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'] },
  '문화·체육·관광': { base: '#a855f7', gradient: ['#7e22ce', '#9333ea', '#a855f7', '#c084fc', '#d8b4fe'] },
};

function getSectorColor(sector: string, index: number): string {
  const colors = SECTOR_COLORS[sector];
  if (!colors) return '#6b7280';
  return colors.gradient[Math.min(index, colors.gradient.length - 1)];
}

function getSectorBaseColor(sector: string): string {
  return SECTOR_COLORS[sector]?.base || '#6b7280';
}

interface SectorPageClientProps {
  sector: SectorDetail;
}

export default function SectorPageClient({ sector }: SectorPageClientProps) {
  const baseColor = getSectorBaseColor(sector.name);
  const maxSubAmount = Math.max(...sector.sub_items.map(s => s.amount), 1);
  const sortedSubs = [...sector.sub_items].sort((a, b) => b.amount - a.amount);

  return (
    <div className="container-page py-6 sm:py-8">
      {/* 뒤로 가기 */}
      <Link
        href="/budget"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        예산 시각화
      </Link>

      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-4 h-4 rounded-sm shrink-0"
            style={{ backgroundColor: baseColor }}
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{sector.name}</h1>
        </div>
        <div className="flex flex-wrap items-baseline gap-3 mb-3">
          <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            {sector.amount.toFixed(1)}조원
          </span>
          <span className="text-base sm:text-lg text-gray-500">
            전체 예산의 {sector.percentage.toFixed(1)}%
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              sector.yoy_change >= 0
                ? 'bg-red-50 text-red-600'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            전년 대비 {sector.yoy_change >= 0 ? '+' : ''}{sector.yoy_change.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-400">
            담당: {sector.related_ministry}
          </span>
        </div>
      </div>

      {/* 개요 카드 (2열) */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="card">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            이 분야가 하는 일
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{sector.description}</p>
        </div>

        <div className="card">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
            왜 중요한가
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{sector.why_it_matters}</p>
        </div>

        <div className="card">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            누가 혜택을 받나
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{sector.who_benefits}</p>
        </div>

        <div className="card">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5"><path d="M2 20h20M6 20V12l4-4 4 4 4-8v16"/></svg>
            지난 10년 추이
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{sector.historical_trend}</p>
        </div>

        {sector.controversy && (
          <div className="card md:col-span-2 border-amber-200 bg-amber-50/50">
            <h3 className="flex items-center gap-2 font-bold text-amber-800 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
              논란
            </h3>
            <p className="text-sm text-amber-700 leading-relaxed">{sector.controversy}</p>
          </div>
        )}
      </div>

      {/* 하위 항목 바 차트 */}
      <div className="card mb-8">
        <h2 className="flex items-center gap-2 font-bold text-lg text-gray-900 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
          세부 항목별 예산
        </h2>
        <p className="text-xs text-gray-400 mb-5">금액 기준 정렬 · 2026년 예산안 기준</p>

        <div className="space-y-1.5">
          {sortedSubs.map((sub, idx) => {
            const barWidth = Math.max(3, (sub.amount / maxSubAmount) * 100);
            const barColor = getSectorColor(sector.name, idx);
            return (
              <Link
                key={sub.id}
                href={`/budget/${sector.id}/${sub.id}`}
                className="block rounded-lg px-2 py-2 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-40 sm:w-52 shrink-0 truncate group-hover:text-gray-900" title={sub.name}>
                    {sub.name}
                  </span>
                  <div className="flex-1 h-7 bg-gray-100 rounded relative overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-500 ease-out"
                      style={{ width: `${barWidth}%`, backgroundColor: barColor, opacity: 0.85 }}
                    />
                    {barWidth > 20 && (
                      <span className="absolute left-2 top-0 h-full flex items-center text-[11px] font-medium text-white/90">
                        {sub.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0 w-20">
                    <span className="text-sm font-semibold text-gray-800">{sub.amount.toFixed(1)}</span>
                    <span className="text-xs text-gray-400 ml-0.5">조</span>
                  </div>
                  {barWidth <= 20 && (
                    <span className="text-[11px] text-gray-400 w-12 text-right shrink-0">
                      {sub.percentage.toFixed(1)}%
                    </span>
                  )}
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors"
                  >
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="text-[10px] text-gray-300 mt-4">
          출처: 기획재정부 나라살림 예산개요 · 2026년 예산안 기준
        </p>
      </div>

      {/* 하위 항목 카드 그리드 */}
      <div className="mb-6">
        <h2 className="flex items-center gap-2 font-bold text-lg text-gray-900 mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={baseColor} strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          항목별 상세
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSubs.map((sub, idx) => (
            <Link
              key={sub.id}
              href={`/budget/${sector.id}/${sub.id}`}
              className="card hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: getSectorColor(sector.name, idx) }}
                />
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-gray-700 truncate">
                  {sub.name}
                </h3>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-lg font-bold text-gray-900">{sub.amount.toFixed(1)}조원</span>
                <span className="text-xs text-gray-400">{sub.percentage.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                {sub.description}
              </p>
              <span className="text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors flex items-center gap-1">
                상세 보기
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
