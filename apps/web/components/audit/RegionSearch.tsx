'use client';

import { useState, useEffect } from 'react';
import type { AuditFlag } from '@/lib/types';

interface RegionSearchProps {
  findings: AuditFlag[];
  onFilter: (filtered: AuditFlag[]) => void;
}

export default function RegionSearch({ findings, onFilter }: RegionSearchProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      onFilter(findings);
      return;
    }
    const q = query.trim().toLowerCase();
    const filtered = findings.filter(
      (f) =>
        (f.target_institution ?? '').toLowerCase().includes(q) ||
        (f.target_id ?? '').toLowerCase().includes(q)
    );
    onFilter(filtered);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, findings]);

  const matchCount = query.trim()
    ? findings.filter(
        (f) =>
          (f.target_institution ?? '').toLowerCase().includes(query.trim().toLowerCase()) ||
          (f.target_id ?? '').toLowerCase().includes(query.trim().toLowerCase())
      ).length
    : findings.length;

  const institutionCount = query.trim()
    ? new Set(
        findings
          .filter(
            (f) =>
              (f.target_institution ?? '').toLowerCase().includes(query.trim().toLowerCase()) ||
              (f.target_id ?? '').toLowerCase().includes(query.trim().toLowerCase())
          )
          .map((f) => f.target_institution)
      ).size
    : new Set(findings.map((f) => f.target_institution)).size;

  return (
    <div className="mb-4">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--apple-gray-1)' }}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="기관명 또는 지역 검색 (예: 부산, 경기도교육청)"
          className="w-full text-sm border rounded-xl pl-9 pr-3 py-2.5 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          style={{ borderColor: 'var(--apple-gray-4)' }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--apple-gray-1)' }}>
        {query.trim() ? (
          <>
            <span className="font-semibold" style={{ color: 'var(--apple-blue)' }}>
              {institutionCount}개 기관
            </span>
            에서 의심 계약 발견 ({matchCount}건)
          </>
        ) : (
          <>
            전체{' '}
            <span className="font-semibold" style={{ color: 'var(--apple-blue)' }}>
              {institutionCount}개 기관
            </span>
            에서 의심 계약 발견
          </>
        )}
      </p>
    </div>
  );
}
