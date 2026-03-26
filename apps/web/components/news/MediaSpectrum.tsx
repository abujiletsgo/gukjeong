'use client';

import { useMemo } from 'react';
import type { MediaOutlet, NewsArticle } from '@/lib/types';

interface MediaSpectrumProps {
  outlets: MediaOutlet[];
  coverage?: NewsArticle[];
}

/** Map a spectrum_score (1-5) to a percentage position (0-100) */
function scoreToPercent(score: number): number {
  return ((score - 1) / 4) * 100;
}

/** Get dot size class based on article relevance */
function getDotSize(outletId: string, coverage?: NewsArticle[]): string {
  if (!coverage) return 'w-3 h-3';
  const count = coverage.filter((c) => c.outlet_id === outletId).length;
  if (count >= 3) return 'w-5 h-5';
  if (count >= 2) return 'w-4 h-4';
  if (count >= 1) return 'w-3.5 h-3.5';
  return 'w-2.5 h-2.5 opacity-40';
}

/** Get dot color based on category */
function getDotColor(category: string): string {
  switch (category) {
    case 'progressive':
      return 'bg-blue-600 ring-blue-300';
    case 'conservative':
      return 'bg-red-600 ring-red-300';
    case 'center':
    default:
      return 'bg-gray-500 ring-gray-300';
  }
}

export default function MediaSpectrum({ outlets, coverage }: MediaSpectrumProps) {
  const displayOutlets = useMemo(() => {
    if (coverage && coverage.length > 0) {
      // When coverage is provided, only show outlets that appear in coverage
      const covOutletIds = new Set(coverage.map((c) => c.outlet_id));
      return outlets.filter((o) => covOutletIds.has(o.id));
    }
    return outlets;
  }, [outlets, coverage]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, MediaOutlet[]> = {
      progressive: [],
      center: [],
      conservative: [],
    };
    for (const outlet of displayOutlets) {
      const cat = outlet.category as keyof typeof groups;
      if (groups[cat]) {
        groups[cat].push(outlet);
      } else {
        groups.center.push(outlet);
      }
    }
    return groups;
  }, [displayOutlets]);

  return (
    <div className="w-full">
      {/* Spectrum Bar */}
      <div className="relative w-full h-16 sm:h-20 mb-2">
        {/* Gradient background */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full bg-gradient-to-r from-blue-500 via-gray-300 to-red-500 opacity-80" />

        {/* Outlet dots */}
        {displayOutlets.map((outlet) => {
          const pct = scoreToPercent(outlet.spectrum_score);
          const dotSize = getDotSize(outlet.id, coverage);
          const dotColor = getDotColor(outlet.category);

          return (
            <div
              key={outlet.id}
              className="absolute flex flex-col items-center group"
              style={{
                left: `${pct}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Tooltip */}
              <div className="absolute -top-8 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none z-10">
                {outlet.name} ({outlet.spectrum_score})
              </div>
              {/* Dot */}
              <div
                className={`${dotSize} ${dotColor} rounded-full ring-2 ring-offset-1 ring-offset-white shadow-sm transition-transform group-hover:scale-125 cursor-default`}
              />
              {/* Label below */}
              <span className="mt-4 text-[10px] sm:text-xs text-gray-600 font-medium whitespace-nowrap">
                {outlet.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Group labels */}
      <div className="flex justify-between px-1 mt-4 text-xs font-semibold">
        <div className="text-blue-600 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          진보 ({groupedByCategory.progressive.length})
        </div>
        <div className="text-gray-500 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          중도 ({groupedByCategory.center.length})
        </div>
        <div className="text-red-600 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-600" />
          보수 ({groupedByCategory.conservative.length})
        </div>
      </div>
    </div>
  );
}
