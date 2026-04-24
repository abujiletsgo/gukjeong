'use client';

import { useState } from 'react';
import type { NewsTopicArticle } from '@/lib/types';

/* ================================================================
   OutletBadge
   ================================================================ */

function OutletBadge({ outletName }: { outletName: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold border bg-gray-100 text-gray-700 border-gray-200">
      {outletName}
    </span>
  );
}

/* ================================================================
   ArticleRow
   ================================================================ */

function ArticleRow({ article }: { article: NewsTopicArticle }) {
  return (
    <div className="px-3 py-2.5">
      <div className="mb-1.5">
        <OutletBadge outletName={article.outlet_name} />
      </div>
      {article.link ? (
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-gray-800 leading-snug hover:text-blue-600 transition-colors"
        >
          {article.title}
        </a>
      ) : (
        <p className="text-sm text-gray-800 leading-snug">{article.title}</p>
      )}
      {article.link && (
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-1 text-[10px] text-blue-500 hover:text-blue-700 font-medium"
        >
          원문 보기 &#x2197;
        </a>
      )}
    </div>
  );
}

/* ================================================================
   SpectrumColumn
   ================================================================ */

interface SpectrumColumnProps {
  title: string;
  articles: NewsTopicArticle[];
  colorClass: string;
  emptyLabel: string;
}

export default function SpectrumColumn({
  title,
  articles,
  colorClass,
  emptyLabel,
}: SpectrumColumnProps) {
  const [expanded, setExpanded] = useState(false);

  const displayed = expanded ? articles : articles.slice(0, 2);
  const remaining = articles.length - 2;

  // Derive border color from colorClass (e.g. "bg-blue-50 border-blue-200" → "border-blue-200")
  const borderColor = colorClass.split(' ').find(c => c.startsWith('border-')) ?? 'border-gray-200';
  const bgColor = colorClass.split(' ').find(c => c.startsWith('bg-')) ?? 'bg-gray-50';

  return (
    <div className={`rounded-lg border ${borderColor} overflow-hidden`}>
      <div className={`px-3 py-2 ${bgColor} border-b ${borderColor}`}>
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <span className="ml-1.5 text-xs opacity-70 text-gray-500">({articles.length})</span>
      </div>
      <div className="divide-y divide-gray-100">
        {articles.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">{emptyLabel}</p>
        ) : (
          <>
            {displayed.map((article, ai) => (
              <ArticleRow key={`${article.outlet_id}-${ai}`} article={article} />
            ))}
            {!expanded && remaining > 0 && (
              <button
                onClick={() => setExpanded(true)}
                className="w-full px-3 py-2 text-xs text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors text-left"
              >
                더 보기 ({remaining}건)
              </button>
            )}
            {expanded && articles.length > 2 && (
              <button
                onClick={() => setExpanded(false)}
                className="w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-left"
              >
                접기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
