'use client';
// 뉴스 프레임 비교 — 클라이언트 컴포넌트
// Live mode: /api/news/live (real RSS articles)
// Demo mode: seed data passed as props

import { useState, useMemo, useEffect } from 'react';
import { useDataMode } from '@/lib/context/DataModeContext';
import type { NewsEvent, MediaOutlet } from '@/lib/types';
import KPI from '@/components/common/KPI';
import MediaSpectrum from '@/components/news/MediaSpectrum';
import FrameComparison from '@/components/news/FrameComparison';
import NewsCluster from '@/components/news/NewsCluster';

/* ================================================================
   Shared constants / types
   ================================================================ */

const CATEGORIES = ['전체', '경제', '정치', '사회', '과학기술', '복지'] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'articles', label: '기사수 많은순' },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]['value'];

/* ================================================================
   Real RSS article types
   ================================================================ */

interface RealRSSArticle {
  outlet_id: string;
  outlet_name: string;
  title: string;
  link?: string;
  pubDate?: string;
  description?: string;
  spectrum_score?: number;
  category?: string;
}

interface RealNewsData {
  total: number;
  outlets: number;
  outlet_counts: Record<string, number>;
  timestamp: string;
  articles: RealRSSArticle[];
  error?: string;
}

/* ================================================================
   Topic grouping types
   ================================================================ */

interface TopicGroup {
  topic: string;
  articles: RealRSSArticle[];
  isMultiOutlet: boolean;
  outletCount: number;
  summary?: string;           // auto-generated from descriptions
  progressiveTake?: string;   // what progressive outlets emphasize
  conservativeTake?: string;  // what conservative outlets emphasize
  whyItMatters?: string;      // why this matters to citizens
}

/* ================================================================
   Outlet metadata for spectrum coloring
   ================================================================ */

const OUTLET_META: Record<
  string,
  { name: string; spectrum: number; category: string; color: string; bgColor: string; borderColor: string }
> = {
  hankyoreh: { name: '한겨레',   spectrum: 1.2, category: 'progressive',  color: 'text-blue-700', bgColor: 'bg-blue-50',  borderColor: 'border-blue-200' },
  khan:      { name: '경향신문', spectrum: 1.5, category: 'progressive',  color: 'text-blue-700', bgColor: 'bg-blue-50',  borderColor: 'border-blue-200' },
  jtbc:      { name: 'JTBC',     spectrum: 2.2, category: 'progressive',  color: 'text-blue-700', bgColor: 'bg-sky-50',   borderColor: 'border-sky-200' },
  sbs:       { name: 'SBS',      spectrum: 2.8, category: 'center',       color: 'text-gray-700', bgColor: 'bg-gray-50',  borderColor: 'border-gray-200' },
  segye:     { name: '세계일보', spectrum: 3.2, category: 'conservative', color: 'text-rose-700', bgColor: 'bg-rose-50',  borderColor: 'border-rose-200' },
  donga:     { name: '동아일보', spectrum: 4.0, category: 'conservative', color: 'text-rose-700', bgColor: 'bg-rose-50',  borderColor: 'border-rose-200' },
};

const ALL_OUTLETS = ['전체', '한겨레', '경향신문', 'JTBC', 'SBS', '세계일보', '동아일보'] as const;

/* ================================================================
   Topic-grouping utilities
   ================================================================ */

/** Extract meaningful Korean keywords (2+ chars, no particles/common words) */
function extractKeywords(title: string): string[] {
  const STOP_WORDS = new Set([
    '대한', '통해', '위해', '관련', '대해', '이번', '하는', '있는', '없는', '되는',
    '에서', '으로', '에게', '부터', '까지', '이다', '한다', '했다', '된다',
    '것으로', '가능', '필요', '주요', '오늘', '내일', '어제', '올해', '내년', '지난',
    '하며', '했으며', '라며', '있다', '없다', '됐다', '밝혔', '전했', '보도', '속보',
    '뉴스', '기자', '특파원', '취재', '단독', '종합', '사진', '영상',
  ]);
  const matches = title.match(/[가-힣]{2,}/g) || [];
  return matches.filter(w => !STOP_WORDS.has(w) && w.length >= 2);
}

/** Find a representative topic label from a group of articles */
function findCommonTopic(articles: RealRSSArticle[]): string {
  if (articles.length === 1) {
    const t = articles[0].title;
    return t.length > 40 ? t.slice(0, 40) + '...' : t;
  }
  const freq: Record<string, number> = {};
  for (const article of articles) {
    const kws = extractKeywords(article.title);
    for (const kw of kws) {
      freq[kw] = (freq[kw] || 0) + 1;
    }
  }
  const sorted = Object.entries(freq)
    .filter(([, c]) => c >= 2)
    .sort(([, a], [, b]) => b - a);
  if (sorted.length >= 2) return sorted.slice(0, 3).map(([w]) => w).join(' ');
  if (sorted.length === 1) return sorted[0][0];
  const t = articles[0].title;
  return t.length > 40 ? t.slice(0, 40) + '...' : t;
}

/** Group articles by topic similarity (shared 2+ keywords) */
function groupArticlesByTopic(articles: RealRSSArticle[]): TopicGroup[] {
  const groups: TopicGroup[] = [];
  const used = new Set<number>();

  for (let i = 0; i < articles.length; i++) {
    if (used.has(i)) continue;
    const group: RealRSSArticle[] = [articles[i]];
    used.add(i);

    const words = extractKeywords(articles[i].title);

    for (let j = i + 1; j < articles.length; j++) {
      if (used.has(j)) continue;
      const otherWords = extractKeywords(articles[j].title);
      const shared = words.filter(w => otherWords.includes(w));
      if (shared.length >= 2) {
        group.push(articles[j]);
        used.add(j);
      }
    }

    const uniqueOutlets = new Set(group.map(a => a.outlet_id));
    const sorted = group.sort((a, b) => (a.spectrum_score ?? 3) - (b.spectrum_score ?? 3));

    // Generate context from available data
    const progArticles = sorted.filter(a => classifySpectrum(a.spectrum_score) === 'progressive');
    const consArticles = sorted.filter(a => classifySpectrum(a.spectrum_score) === 'conservative');

    // Build summary from the longest description available
    const descriptions = group.map(a => a.description || '').filter(d => d.length > 20);
    const bestDesc = descriptions.sort((a, b) => b.length - a.length)[0] || '';
    // Clean HTML tags from description
    const cleanDesc = bestDesc.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim();

    // Extract what each side emphasizes from their headlines
    const progTake = progArticles.length > 0
      ? progArticles.map(a => a.title).join(' · ')
      : undefined;
    const consTake = consArticles.length > 0
      ? consArticles.map(a => a.title).join(' · ')
      : undefined;

    groups.push({
      topic: findCommonTopic(group),
      articles: sorted,
      isMultiOutlet: uniqueOutlets.size >= 2,
      outletCount: uniqueOutlets.size,
      summary: cleanDesc.length > 10 ? cleanDesc.slice(0, 200) : undefined,
      progressiveTake: progTake,
      conservativeTake: consTake,
      whyItMatters: uniqueOutlets.size >= 2
        ? `${uniqueOutlets.size}개 매체가 이 사안을 다루고 있으며, 정치적 성향에 따라 다른 관점에서 보도하고 있습니다.`
        : undefined,
    });
  }

  // Multi-outlet groups first, then by article count
  return groups.sort((a, b) => {
    if (a.isMultiOutlet !== b.isMultiOutlet) return a.isMultiOutlet ? -1 : 1;
    return b.articles.length - a.articles.length;
  });
}

/** Classify spectrum score into progressive / center / conservative */
function classifySpectrum(score: number | undefined): 'progressive' | 'center' | 'conservative' {
  const s = score ?? 3;
  if (s < 2.5) return 'progressive';
  if (s < 3.5) return 'center';
  return 'conservative';
}

function getOutletBadge(outletId: string) {
  const meta = OUTLET_META[outletId];
  if (!meta) return { color: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-200', name: outletId };
  return meta;
}

/** Find the best "hero" group -- the multi-outlet group with the most outlets */
function findHeroGroup(groups: TopicGroup[]): TopicGroup | null {
  const multi = groups.filter(g => g.isMultiOutlet);
  if (multi.length === 0) return null;
  return multi.reduce((best, g) => (g.outletCount > best.outletCount ? g : best), multi[0]);
}

/* ================================================================
   Inline sub-components for LIVE mode
   ================================================================ */

/** Outlet badge pill */
function OutletBadge({ outletId, outletName }: { outletId: string; outletName?: string }) {
  const badge = getOutletBadge(outletId);
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bgColor} ${badge.color} ${badge.borderColor}`}
    >
      {outletName || badge.name}
    </span>
  );
}

/** Single article row with linked title + "원문 보기" */
function ArticleRow({ article, hoverColor }: { article: RealRSSArticle; hoverColor: string }) {
  return (
    <div className="px-3 py-2.5">
      <div className="mb-1.5">
        <OutletBadge outletId={article.outlet_id} outletName={article.outlet_name} />
      </div>
      {article.link ? (
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`block text-sm text-gray-800 leading-snug hover:${hoverColor} transition-colors`}
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

/** Spectrum column (진보 / 중도 / 보수) inside a topic group card */
function SpectrumColumn({
  label,
  articles,
  headerBg,
  headerText,
  headerBorder,
  divideColor,
  borderColor,
  hoverColor,
}: {
  label: string;
  articles: RealRSSArticle[];
  headerBg: string;
  headerText: string;
  headerBorder: string;
  divideColor: string;
  borderColor: string;
  hoverColor: string;
}) {
  return (
    <div className={`rounded-lg border ${borderColor} overflow-hidden`}>
      <div className={`px-3 py-2 ${headerBg} border-b ${headerBorder}`}>
        <span className={`text-sm font-semibold ${headerText}`}>{label}</span>
        <span className={`ml-1.5 text-xs opacity-70 ${headerText}`}>({articles.length})</span>
      </div>
      <div className={`divide-y ${divideColor}`}>
        {articles.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">해당 매체 보도 없음</p>
        ) : (
          articles.map((article, ai) => (
            <ArticleRow key={`${article.outlet_id}-${ai}`} article={article} hoverColor={hoverColor} />
          ))
        )}
      </div>
    </div>
  );
}

/* ================================================================
   Main component
   ================================================================ */

interface NewsPageClientProps {
  events: NewsEvent[];
  outlets: MediaOutlet[];
}

export default function NewsPageClient({ events, outlets }: NewsPageClientProps) {
  const { isDemo } = useDataMode();

  // ── Real data state ──
  const [realNews, setRealNews] = useState<RealNewsData | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [outletFilter, setOutletFilter] = useState<string>('전체');

  // ── Demo filter state ──
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('전체');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Fetch real news in live mode
  useEffect(() => {
    if (isDemo) return;
    setLiveLoading(true);
    fetch('/api/news/live')
      .then(r => r.json())
      .then((data: RealNewsData) => {
        setRealNews(data);
        setLiveLoading(false);
      })
      .catch(() => setLiveLoading(false));
  }, [isDemo]);

  /* ================================================================
     LIVE MODE
     ================================================================ */
  if (!isDemo) {
    const allArticles = realNews?.articles ?? [];
    const filteredArticles =
      outletFilter === '전체'
        ? allArticles
        : allArticles.filter(a => (a.outlet_name || OUTLET_META[a.outlet_id]?.name) === outletFilter);

    const totalArticles = allArticles.length;
    const outletCount = realNews?.outlets ?? 0;
    const outletCounts = realNews?.outlet_counts ?? {};

    // Topic grouping
    const topicGroups = groupArticlesByTopic(filteredArticles);
    const multiOutletGroups = topicGroups.filter(g => g.isMultiOutlet);
    const singleGroups = topicGroups.filter(g => !g.isMultiOutlet);

    // Hero: the best multi-outlet topic
    const heroGroup = findHeroGroup(topicGroups);
    // Remaining multi-outlet groups (excluding hero)
    const remainingMulti = multiOutletGroups.filter(g => g !== heroGroup);

    return (
      <div className="container-page py-8">
        {/* ── Header ── */}
        <h1 className="section-title">뉴스</h1>
        <p className="text-gray-600 mb-6">
          한국 주요 언론사의 정치·경제·정부 관련 실시간 기사
        </p>

        {/* Real data banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-semibold text-emerald-800">실시간 RSS 피드</p>
          </div>
          <p className="text-xs text-emerald-600 mt-1">
            {realNews?.timestamp
              ? new Date(realNews.timestamp).toLocaleString('ko-KR')
              : ''}{' '}
            기준 | {outletCount}개 언론사 모니터링 중
          </p>
        </div>

        {/* ── KPI Section ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPI label="수집된 기사" value={totalArticles.toLocaleString()} />
          <KPI label="모니터링 매체" value={String(outletCount)} />
          <KPI label="다른 시각 주제" value={`${multiOutletGroups.length}건`} />
          <KPI
            label="최신 수집"
            value={
              realNews?.timestamp
                ? new Date(realNews.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-'
            }
          />
        </div>

        {/* ── Media Spectrum Bar ── */}
        <div className="card mb-8">
          <h2 className="font-bold text-lg mb-2">미디어 스펙트럼</h2>
          <p className="text-sm text-gray-500 mb-4">
            각 매체의 정치적 성향을 학술 연구 기반으로 분류한 스펙트럼입니다.
          </p>
          <MediaSpectrum outlets={outlets} />
        </div>

        {/* ── Outlet Filter Pills ── */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-1">매체:</span>
            {ALL_OUTLETS.map(name => {
              const isActive = outletFilter === name;
              const count =
                name === '전체'
                  ? totalArticles
                  : Object.entries(outletCounts).find(
                      ([id]) => OUTLET_META[id]?.name === name,
                    )?.[1] ?? 0;
              return (
                <button
                  key={name}
                  onClick={() => setOutletFilter(name)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {name}
                  <span className={`ml-1 text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Loading ── */}
        {liveLoading && (
          <div className="text-center py-20 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-emerald-500 rounded-full mx-auto mb-4" />
            <p>실시간 뉴스 피드를 불러오는 중...</p>
          </div>
        )}

        {/* ── Hero: Today's Top Story ── */}
        {!liveLoading && heroGroup && (
          <div className="mb-8">
            <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden shadow-sm">
              {/* Hero header */}
              <div className="px-5 py-4 bg-amber-100/60 border-b border-amber-200">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
                    오늘의 주요 이슈
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/80 text-amber-800 border border-amber-300">
                    같은 사건, 다른 보도
                  </span>
                  <span className="text-xs text-amber-600 ml-auto">
                    {heroGroup.articles.length}개 기사 · {heroGroup.outletCount}개 매체
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-3">{heroGroup.topic}</h2>
              </div>

              {/* Context: what this is about + why it matters */}
              {(heroGroup.summary || heroGroup.whyItMatters) && (
                <div className="px-5 py-3 border-b border-amber-200 bg-white/50">
                  {heroGroup.summary && (
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{heroGroup.summary}</p>
                  )}
                  {heroGroup.whyItMatters && (
                    <p className="text-xs text-amber-700 font-medium">{heroGroup.whyItMatters}</p>
                  )}
                </div>
              )}

              {/* Hero split: progressive vs conservative */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-amber-200">
                {/* Left: Progressive */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-sm font-bold text-blue-700">진보 시각</span>
                  </div>
                  <div className="space-y-3">
                    {heroGroup.articles
                      .filter(a => classifySpectrum(a.spectrum_score) === 'progressive')
                      .map((article, i) => (
                        <div key={`hero-p-${i}`}>
                          <OutletBadge outletId={article.outlet_id} outletName={article.outlet_name} />
                          {article.link ? (
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-gray-800 leading-snug mt-1 hover:text-blue-600 transition-colors font-medium"
                            >
                              {article.title}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-800 leading-snug mt-1 font-medium">
                              {article.title}
                            </p>
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
                      ))}
                    {heroGroup.articles.filter(a => classifySpectrum(a.spectrum_score) === 'progressive')
                      .length === 0 && (
                      <p className="text-xs text-gray-400 py-2">진보 매체 보도 없음</p>
                    )}
                  </div>
                </div>

                {/* Right: Conservative */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-rose-600" />
                    <span className="text-sm font-bold text-rose-700">보수 시각</span>
                  </div>
                  <div className="space-y-3">
                    {heroGroup.articles
                      .filter(a => classifySpectrum(a.spectrum_score) === 'conservative')
                      .map((article, i) => (
                        <div key={`hero-c-${i}`}>
                          <OutletBadge outletId={article.outlet_id} outletName={article.outlet_name} />
                          {article.link ? (
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-gray-800 leading-snug mt-1 hover:text-rose-600 transition-colors font-medium"
                            >
                              {article.title}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-800 leading-snug mt-1 font-medium">
                              {article.title}
                            </p>
                          )}
                          {article.link && (
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-1 text-[10px] text-rose-500 hover:text-rose-700 font-medium"
                            >
                              원문 보기 &#x2197;
                            </a>
                          )}
                        </div>
                      ))}
                    {heroGroup.articles.filter(a => classifySpectrum(a.spectrum_score) === 'conservative')
                      .length === 0 && (
                      <p className="text-xs text-gray-400 py-2">보수 매체 보도 없음</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Center articles if any */}
              {heroGroup.articles.filter(a => classifySpectrum(a.spectrum_score) === 'center').length > 0 && (
                <div className="px-5 py-3 bg-gray-50/60 border-t border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                    <span className="text-xs font-semibold text-gray-600">중도 시각</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {heroGroup.articles
                      .filter(a => classifySpectrum(a.spectrum_score) === 'center')
                      .map((article, i) => (
                        <div key={`hero-m-${i}`} className="flex items-center gap-2">
                          <OutletBadge outletId={article.outlet_id} outletName={article.outlet_name} />
                          {article.link ? (
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                            >
                              {article.title.length > 50
                                ? article.title.slice(0, 50) + '...'
                                : article.title}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-700">
                              {article.title.length > 50
                                ? article.title.slice(0, 50) + '...'
                                : article.title}
                            </span>
                          )}
                          {article.link && (
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-gray-500 hover:text-gray-700 font-medium shrink-0"
                            >
                              원문 보기 &#x2197;
                            </a>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* "시민이 주목해야 할 점" box */}
              <div className="px-5 py-4 bg-amber-50/80 border-t border-amber-200">
                <h3 className="text-sm font-bold text-amber-900 mb-2">이 이슈를 읽는 법</h3>
                <div className="space-y-2 text-xs text-amber-800">
                  <p>같은 사건을 {heroGroup.outletCount}개 매체가 서로 다른 제목으로 보도하고 있습니다. 제목만 봐도 각 매체가 무엇을 강조하는지 알 수 있습니다.</p>
                  {heroGroup.progressiveTake && heroGroup.conservativeTake && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <p className="font-semibold text-blue-800 mb-1">진보 매체가 강조하는 것</p>
                        <p className="text-blue-700 text-[11px] leading-relaxed">{heroGroup.progressiveTake}</p>
                      </div>
                      <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
                        <p className="font-semibold text-rose-800 mb-1">보수 매체가 강조하는 것</p>
                        <p className="text-rose-700 text-[11px] leading-relaxed">{heroGroup.conservativeTake}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-amber-600 mt-2">두 시각을 모두 읽고 직접 판단해 보세요. 원문 링크를 클릭하면 각 매체의 기사를 확인할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Topic-grouped articles (multi-outlet, excluding hero) ── */}
        {!liveLoading && remainingMulti.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-bold text-lg text-gray-900">같은 사건, 다른 보도</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                다른 시각 {remainingMulti.length}건
              </span>
            </div>

            <div className="space-y-6">
              {remainingMulti.map((group, gi) => {
                const progressive = group.articles.filter(
                  a => classifySpectrum(a.spectrum_score) === 'progressive',
                );
                const center = group.articles.filter(
                  a => classifySpectrum(a.spectrum_score) === 'center',
                );
                const conservative = group.articles.filter(
                  a => classifySpectrum(a.spectrum_score) === 'conservative',
                );

                return (
                  <article key={`multi-${gi}`} className="card border-l-4 border-l-amber-400">
                    {/* Topic header */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        다른 시각
                      </span>
                      <span className="text-xs text-gray-400">
                        {group.articles.length}개 기사 · {group.outletCount}개 매체
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{group.topic}</h3>

                    {/* Context: what this is about */}
                    {group.summary && (
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">{group.summary}</p>
                    )}
                    {group.whyItMatters && (
                      <p className="text-xs text-amber-700 font-medium mb-4">{group.whyItMatters}</p>
                    )}

                    {/* 3-column: 진보 | 중도 | 보수 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <SpectrumColumn
                        label="진보"
                        articles={progressive}
                        headerBg="bg-blue-50"
                        headerText="text-blue-700"
                        headerBorder="border-blue-100"
                        divideColor="divide-blue-50"
                        borderColor="border-blue-100"
                        hoverColor="text-blue-600"
                      />
                      <SpectrumColumn
                        label="중도"
                        articles={center}
                        headerBg="bg-gray-50"
                        headerText="text-gray-700"
                        headerBorder="border-gray-200"
                        divideColor="divide-gray-100"
                        borderColor="border-gray-200"
                        hoverColor="text-gray-600"
                      />
                      <SpectrumColumn
                        label="보수"
                        articles={conservative}
                        headerBg="bg-rose-50"
                        headerText="text-rose-700"
                        headerBorder="border-rose-100"
                        divideColor="divide-rose-50"
                        borderColor="border-rose-100"
                        hoverColor="text-rose-600"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Single articles (not in any multi-outlet group) ── */}
        {!liveLoading && singleGroups.length > 0 && (
          <div className="mb-8">
            {(multiOutletGroups.length > 0) && (
              <h2 className="font-bold text-lg text-gray-900 mb-4">개별 기사</h2>
            )}
            <div className="space-y-3">
              {singleGroups.map((group, gi) => {
                const article = group.articles[0];
                const badge = getOutletBadge(article.outlet_id);
                return (
                  <article key={`single-${gi}`} className="card">
                    <div className="flex items-start gap-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 mt-0.5 ${badge.bgColor} ${badge.color} ${badge.borderColor}`}
                      >
                        {article.outlet_name || badge.name}
                      </span>
                      <div className="flex-1 min-w-0">
                        {article.link ? (
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors leading-snug"
                          >
                            {article.title}
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-gray-800 leading-snug">
                            {article.title}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {article.pubDate && (
                            <time className="text-[10px] text-gray-400">
                              {new Date(article.pubDate).toLocaleString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </time>
                          )}
                          {article.link && (
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
                            >
                              원문 보기 &#x2197;
                            </a>
                          )}
                        </div>
                        {article.description && (
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                            {article.description.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!liveLoading && topicGroups.length === 0 && (
          <div className="card text-center py-16">
            <p className="text-gray-400">
              {outletFilter !== '전체'
                ? `${outletFilter}의 정치·경제 관련 기사가 없습니다.`
                : '실시간 뉴스 피드를 불러올 수 없습니다.'}
            </p>
          </div>
        )}

        {/* ── Disclaimer ── */}
        <p className="text-xs text-gray-400 mt-8">
          * 미디어 분류는 학술 연구 기반 참고 분류입니다.
        </p>
      </div>
    );
  }

  /* ================================================================
     DEMO MODE (original full experience preserved)
     ================================================================ */

  const totalArticles = useMemo(
    () => events.reduce((sum, e) => sum + (e.article_count ?? 0), 0),
    [events],
  );

  const uniqueOutletCount = useMemo(() => outlets.length, [outlets]);

  const latestEvent = useMemo(() => {
    const sorted = [...events].sort((a, b) =>
      (b.event_date ?? '').localeCompare(a.event_date ?? ''),
    );
    return sorted[0];
  }, [events]);

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (categoryFilter !== '전체') {
      result = result.filter(e => e.category === categoryFilter);
    }

    if (sortBy === 'latest') {
      result.sort((a, b) => (b.event_date ?? '').localeCompare(a.event_date ?? ''));
    } else {
      result.sort((a, b) => (b.article_count ?? 0) - (a.article_count ?? 0));
    }

    return result;
  }, [events, categoryFilter, sortBy]);

  const toggleExpand = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const truncate = (text: string, maxLen: number) =>
    text.length > maxLen ? text.slice(0, maxLen) + '...' : text;

  return (
    <div className="container-page py-8">
      {/* Page Header */}
      <h1 className="section-title">뉴스 프레임 비교</h1>
      <p className="text-gray-600 mb-8">
        같은 사건에 대한 서로 다른 미디어의 보도 프레임을 비교합니다.
      </p>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPI label="분석된 이벤트" value={String(events.length)} />
        <KPI label="총 기사 수" value={totalArticles.toLocaleString()} />
        <KPI label="모니터링 매체 수" value={String(uniqueOutletCount)} />
        <KPI
          label="오늘의 주요 이슈"
          value={latestEvent ? truncate(latestEvent.title, 16) : '-'}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Global Media Spectrum Bar */}
      <div className="card mb-8">
        <h2 className="font-bold text-lg mb-4">미디어 스펙트럼</h2>
        <p className="text-sm text-gray-500 mb-4">
          각 매체의 정치적 성향을 학술 연구 기반으로 분류한 스펙트럼입니다.
        </p>
        <MediaSpectrum outlets={outlets} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center mr-1">분야:</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="sm:ml-auto flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">정렬:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-4">{filteredEvents.length}건의 뉴스 이벤트</p>

      {/* News Event Cards */}
      <div className="space-y-8">
        {filteredEvents.map(event => {
          const isExpanded = expandedEvents.has(event.id);
          return (
            <article key={event.id} className="card">
              {/* Header: date + category */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {event.event_date && (
                  <time className="text-sm text-gray-500">{event.event_date}</time>
                )}
                {event.category && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {event.category}
                  </span>
                )}
                {event.article_count != null && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    기사 {event.article_count.toLocaleString()}건
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{event.title}</h2>

              {/* AI Summary */}
              {event.ai_summary && (
                <div className="flex items-start gap-2 mb-4">
                  <span className="ai-badge shrink-0 mt-0.5">AI 요약</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{event.ai_summary}</p>
                </div>
              )}

              {/* Key Facts */}
              {event.key_facts && event.key_facts.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-5">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">핵심 사실</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {event.key_facts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Frame Comparison */}
              <FrameComparison event={event} />

              {/* Citizen Takeaway */}
              {event.citizen_takeaway && (
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-amber-800 mb-1">
                    시민이 알아야 할 것
                  </h3>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {event.citizen_takeaway}
                  </p>
                </div>
              )}

              {/* Expand/Collapse for Coverage */}
              {event.coverage && event.coverage.length > 0 && (
                <div className="mt-5">
                  <button
                    onClick={() => toggleExpand(event.id)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    매체별 보도 비교 ({event.coverage.length}개 매체)
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      <MediaSpectrum outlets={outlets} coverage={event.coverage} />
                      <NewsCluster coverage={event.coverage} />
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-gray-400">해당 분야의 뉴스 이벤트가 없습니다.</p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 mt-8">
        * 미디어 분류는 학술 연구 기반 참고 분류입니다.
      </p>
    </div>
  );
}
