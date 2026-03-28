'use client';

import { useEffect, useState } from 'react';

interface EconomicIndicator {
  name: string;
  value: number;
  unit: string;
  formatted: string;
  period?: string;
  code?: string;
}

// ---------------------------------------------------------------------------
// Icon mapping for known indicators
// ---------------------------------------------------------------------------

function getIndicatorIcon(name: string): string {
  if (name.includes('GDP')) return 'chart-bar';
  if (name.includes('성장률')) return 'trending-up';
  if (name.includes('물가')) return 'tag';
  if (name.includes('실업') || name.includes('취업') || name.includes('고용')) return 'users';
  if (name.includes('금리')) return 'percent';
  if (name.includes('환율') || name.includes('달러')) return 'dollar';
  if (name.includes('수출') || name.includes('수입') || name.includes('경상수지')) return 'globe';
  return 'activity';
}

function IconSvg({ type }: { type: string }) {
  switch (type) {
    case 'chart-bar':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="7" width="4" height="14" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" />
        </svg>
      );
    case 'trending-up':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case 'tag':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case 'users':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case 'percent':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
      );
    case 'dollar':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      );
    case 'globe':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EconomyDashboardProps {
  /** 표시할 최대 지표 수 */
  maxItems?: number;
  /** 컴팩트 모드 (홈페이지 삽입용) */
  compact?: boolean;
}

export default function EconomyDashboard({ maxItems = 10, compact = false }: EconomyDashboardProps) {
  const [stats, setStats] = useState<EconomicIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/economy?mode=highlights');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setStats(data.stats || []);
        setTimestamp(data.timestamp || '');
      } catch (e) {
        setError(e instanceof Error ? e.message : '데이터 로드 실패');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className={compact ? '' : 'card'}>
        <div className="animate-pulse space-y-3">
          {compact ? null : (
            <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: compact ? 5 : maxItems }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? '' : 'card'} text-center py-6`}>
        <p className="text-sm text-gray-500">경제 지표를 불러오지 못했습니다.</p>
        <p className="text-xs text-gray-400 mt-1">{error}</p>
      </div>
    );
  }

  const displayStats = stats.slice(0, maxItems);

  return (
    <div className={compact ? '' : 'card'}>
      {!compact && (
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              주요 경제 지표
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              한국은행 ECOS 실시간 데이터
              {timestamp && ` | ${new Date(timestamp).toLocaleDateString('ko-KR')}`}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            실제 데이터
          </span>
        </div>
      )}

      <div className={`grid gap-3 ${
        compact
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      }`}>
        {displayStats.map((stat, idx) => {
          const iconType = getIndicatorIcon(stat.name);

          return (
            <div
              key={idx}
              className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-gray-400 group-hover:text-accent transition-colors">
                  <IconSvg type={iconType} />
                </span>
                <span className="text-xs text-gray-500 font-medium truncate">
                  {stat.name}
                </span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                {stat.formatted}
              </div>
              {stat.period && (
                <div className="text-[10px] text-gray-400 mt-1">
                  {stat.period} 기준
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!compact && (
        <p className="text-[10px] text-gray-400 mt-4 text-right">
          출처: 한국은행 경제통계시스템(ECOS) | API Key: 공개 시범 키
        </p>
      )}
    </div>
  );
}
