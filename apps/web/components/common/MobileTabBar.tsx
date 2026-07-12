'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  {
    href: '/', label: '홈',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
        <path d="M3 12l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v10h4v-6h6v6h4V10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/audit', label: '감사',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
        <circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/legislators', label: '의원',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/budget', label: '예산',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 9h18M9 21V9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/news', label: '뉴스',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
        <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const;

const MORE_SECTIONS: { title: string; links: { href: string; label: string; badge?: string }[] }[] = [
  {
    title: '데이터',
    links: [
      { href: '/presidents', label: '대통령 비교' },
      { href: '/bills', label: '법안 추적' },
      { href: '/legislators/ranking', label: '의원 랭킹' },
      { href: '/local', label: '지역 재정' },
      { href: '/compare', label: '국제 비교' },
    ],
  },
  {
    title: '분석',
    links: [
      { href: '/popular', label: '화제의 감사' },
      { href: '/news/live', label: '실시간 뉴스 분석' },
      { href: '/search', label: '통합 검색' },
      { href: '/simulator', label: '예산 시뮬레이터', badge: '준비 중' },
    ],
  },
  {
    title: '정보',
    links: [
      { href: '/about', label: '소개' },
      { href: '/pricing', label: '요금제' },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileTabBar() {
  const pathname = usePathname() ?? '';
  const [moreOpen, setMoreOpen] = useState(false);

  // 시트가 열려 있을 때 배경 스크롤 잠금 + Esc로 닫기
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  // 페이지 이동 시 시트 자동 닫힘
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const tabInMore = MORE_SECTIONS.some((s) => s.links.some((l) => isActive(pathname, l.href)))
    && !TABS.some((t) => isActive(pathname, t.href));

  return (
    <>
      {/* 더보기 시트 */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="전체 메뉴">
          <button
            className="absolute inset-0 bg-black/30"
            aria-label="메뉴 닫기"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-5 pb-8 max-h-[70vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">전체 메뉴</h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-black/5"
                aria-label="닫기"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {MORE_SECTIONS.map(({ title, links }) => (
              <div key={title} className="mb-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {links.map(({ href, label, badge }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm ${
                          isActive(pathname, href)
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {label}
                        {badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500">{badge}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 탭바 */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        aria-label="모바일 메뉴"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          borderTop: '0.5px solid rgba(60, 60, 67, 0.12)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex justify-around py-2">
          {TABS.map(({ href, label, icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${
                  active ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
                }`}
                style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
              >
                {icon}
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: '0.2px' }}>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${
              tabInMore ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
            }`}
            style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
              <circle cx="5" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="19" cy="12" r="1.5" fill="currentColor" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: tabInMore ? 700 : 500, letterSpacing: '0.2px' }}>더보기</span>
          </button>
        </div>
      </nav>
    </>
  );
}
