'use client';

import { useMemo } from 'react';
import type { NewsArticle } from '@/lib/types';

interface NewsClusterProps {
  coverage?: NewsArticle[];
}

function getOutletBadgeClass(category: string): string {
  switch (category) {
    case 'progressive':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'conservative':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'center':
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getColumnHeaderClass(category: string): string {
  switch (category) {
    case 'progressive':
      return 'text-blue-700 border-blue-300 bg-blue-50';
    case 'conservative':
      return 'text-red-700 border-red-300 bg-red-50';
    case 'center':
    default:
      return 'text-gray-700 border-gray-300 bg-gray-50';
  }
}

const GROUPS = [
  { key: 'progressive', label: '진보' },
  { key: 'center', label: '중도' },
  { key: 'conservative', label: '보수' },
] as const;

export default function NewsCluster({ coverage }: NewsClusterProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, NewsArticle[]> = {
      progressive: [],
      center: [],
      conservative: [],
    };

    if (!coverage) return groups;

    for (const article of coverage) {
      const cat = article.category;
      if (groups[cat]) {
        groups[cat].push(article);
      } else {
        groups.center.push(article);
      }
    }

    return groups;
  }, [coverage]);

  if (!coverage || coverage.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-400 text-center py-4">보도 데이터 준비 중</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {GROUPS.map(({ key, label }) => {
        const articles = grouped[key];
        const headerClass = getColumnHeaderClass(key);

        return (
          <div key={key} className="rounded-lg border border-gray-200 overflow-hidden">
            {/* Column Header */}
            <div
              className={`px-3 py-2 border-b font-semibold text-sm ${headerClass}`}
            >
              {label}
              <span className="ml-1.5 text-xs font-normal opacity-70">
                ({articles.length}건)
              </span>
            </div>

            {/* Articles */}
            <div className="divide-y divide-gray-100">
              {articles.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-4">
                  해당 매체 보도 없음
                </p>
              ) : (
                articles.map((article, i) => {
                  const badgeClass = getOutletBadgeClass(article.category);
                  return (
                    <div key={`${article.outlet_id}-${i}`} className="px-3 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium border mb-1 ${badgeClass}`}
                      >
                        {article.outlet_name}
                      </span>
                      {article.url ? (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-gray-800 leading-snug hover:text-accent transition-colors"
                        >
                          {article.headline}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-800 leading-snug">
                          {article.headline}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
