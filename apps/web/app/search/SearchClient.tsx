'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useUrlState } from '@/lib/hooks/useUrlState';

type Item = [string, string, string, string]; // [type, name, sub, url]

const TYPE_LABEL: Record<string, string> = {
  page: '메뉴',
  leg: '국회의원',
  inst: '감사 대상 기관',
  bill: '법안',
  pres: '대통령',
  local: '지역',
};
const TYPE_ORDER = ['page', 'leg', 'pres', 'local', 'inst', 'bill'];

// 정적 섹션(라우트) 인덱스 — 데이터 파일 없이도 항상 검색됨
const PAGES: Item[] = [
  ['page', 'AI 감사', '조달 계약 의심 패턴 분석', '/audit'],
  ['page', '화제의 감사', '뉴스 이슈와 감사 결과 교차 분석', '/popular'],
  ['page', '국회의원 활동', '295명 의정활동', '/legislators'],
  ['page', '의원 랭킹', '활동 점수 순위', '/legislators/ranking'],
  ['page', '법안 추적', '22대 국회 법안 16,914건', '/bills'],
  ['page', '예산 시각화', '분야별 국가 예산', '/budget'],
  ['page', '대통령 비교', '역대 대통령 재정·정책 비교', '/presidents'],
  ['page', '지역 재정', '17개 시도 재정자립도', '/local'],
  ['page', '뉴스 프레임 비교', '같은 사건, 다른 보도', '/news'],
  ['page', '실시간 뉴스 분석', 'RSS 기반 실시간 분석', '/news/live'],
  ['page', '국제 비교', 'OECD 재정 지표 비교', '/compare'],
  ['page', '소개', '국정투명이 하는 일', '/about'],
];

function urlFor([t, n, , u]: Item): string {
  if (t === 'inst') return `/audit?q=${encodeURIComponent(n)}`;
  return u;
}

function matches(item: Item, q: string): boolean {
  return item[1].toLowerCase().includes(q) || item[2].toLowerCase().includes(q);
}

export default function SearchClient() {
  const [q, setQ] = useUrlState('q', '');
  const [core, setCore] = useState<Item[] | null>(null);
  const [bills, setBills] = useState<Item[] | null>(null);
  const [coreError, setCoreError] = useState(false);
  const billsRequested = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 코어 인덱스(의원/기관/대통령/지역)는 즉시 로드
  useEffect(() => {
    fetch('/data/search-index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => setCore(d.items))
      .catch(() => setCoreError(true));
    inputRef.current?.focus();
  }, []);

  // 법안 청크(2.3MB)는 검색어가 생겼을 때 한 번만 지연 로드
  useEffect(() => {
    if (q.trim().length < 2 || billsRequested.current) return;
    billsRequested.current = true;
    fetch('/data/search-index-bills.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => setBills(d.items))
      .catch(() => setBills([]));
  }, [q]);

  const query = q.trim().toLowerCase();

  const grouped = useMemo(() => {
    if (query.length < 2) return null;
    const all = [...PAGES, ...(core ?? []), ...(bills ?? [])];
    const hits = all.filter((it) => matches(it, query));
    const byType = new Map<string, Item[]>();
    for (const it of hits) {
      const arr = byType.get(it[0]) ?? [];
      if (arr.length < 50) arr.push(it);
      byType.set(it[0], arr);
    }
    return { byType, total: hits.length };
  }, [query, core, bills]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="의원 이름, 법안, 기관, 지역을 검색하세요"
          className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-lg"
          aria-label="통합 검색"
        />
        <p className="text-xs text-gray-400 mt-2 text-center">
          국회의원 295명 · 법안 16,914건 · 감사 대상 기관 5,869곳 · 대통령 · 지역 재정
        </p>
      </div>

      {coreError && (
        <div className="card text-center py-8 mb-4">
          <p className="text-gray-500 text-sm mb-3">검색 데이터를 불러오지 못했습니다.</p>
          <button onClick={() => window.location.reload()} className="btn-primary">다시 시도</button>
        </div>
      )}

      {query.length >= 2 && grouped && (
        <div className="space-y-6">
          {grouped.total === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-2">‘{q.trim()}’에 대한 결과가 없습니다.</p>
              <p className="text-xs text-gray-400">
                {bills === null && billsRequested.current ? '법안 데이터를 불러오는 중입니다…' : '다른 검색어로 시도해 보세요.'}
              </p>
            </div>
          ) : (
            TYPE_ORDER.filter((t) => grouped.byType.has(t)).map((t) => {
              const items = grouped.byType.get(t)!;
              return (
                <section key={t}>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {TYPE_LABEL[t]} <span className="text-gray-300">{items.length}{items.length === 50 ? '+' : ''}</span>
                  </h2>
                  <ul className="card divide-y divide-gray-100 !p-0 overflow-hidden">
                    {items.map((it, i) => (
                      <li key={`${it[3]}-${i}`}>
                        <Link href={urlFor(it)} className="flex items-baseline justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                          <span className="text-sm text-gray-900 font-medium truncate">{it[1]}</span>
                          <span className="text-xs text-gray-400 shrink-0">{it[2]}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}
          {query.length >= 2 && bills === null && billsRequested.current && grouped.total > 0 && (
            <p className="text-xs text-gray-400 text-center">법안 데이터 불러오는 중… 잠시 후 결과에 반영됩니다.</p>
          )}
        </div>
      )}

      {query.length < 2 && !coreError && (
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">바로가기</p>
          <div className="grid grid-cols-2 gap-2">
            {PAGES.slice(0, 8).map(([, n, s, u]) => (
              <Link key={u} href={u} className="px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="block text-sm font-medium text-gray-900">{n}</span>
                <span className="block text-xs text-gray-400 truncate">{s}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
