'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** 홈 히어로의 통합검색 진입점 — 제출 시 /search?q= 로 이동 */
export default function HomeSearchBox() {
  const [q, setQ] = useState('');
  const router = useRouter();

  return (
    <form
      className="flex max-w-xl mt-8 rounded-2xl overflow-hidden shadow-sm"
      style={{ border: '1px solid rgba(60,60,67,0.15)', background: '#fff' }}
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
      }}
      role="search"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="의원 이름, 법안, 기관을 검색해 보세요"
        className="flex-1 px-5 py-3.5 outline-none text-[15px] bg-transparent"
        aria-label="통합 검색"
      />
      <button
        type="submit"
        className="px-5 flex items-center justify-center text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--apple-blue, #007AFF)' }}
        aria-label="검색"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>
    </form>
  );
}
