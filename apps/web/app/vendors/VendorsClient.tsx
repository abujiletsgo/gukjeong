'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { formatKRW } from '@/lib/utils';

type Row = [string, string, number, number, number, number, string]; // key, name, flags, maxScore, total, insts, bizno

export default function VendorsClient() {
  const [q, setQ] = useUrlState('q', '');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/data/vendors-index.json')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(d => setRows(d.vendors))
      .catch(() => setError(true));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const query = q.trim().toLowerCase();
    const base = query ? rows.filter(r => r[1].toLowerCase().includes(query) || r[6].includes(query)) : rows;
    return base.slice(0, 100);
  }, [rows, q]);

  return (
    <div>
      <div className="mb-6">
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="업체명 또는 사업자등록번호 검색"
          className="w-full max-w-md px-5 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm"
          aria-label="업체 검색"
        />
        {rows && (
          <p className="text-xs text-gray-400 mt-2">
            감사 플래그가 있는 업체 {rows.length.toLocaleString()}곳 {q.trim() && `· 검색 결과 상위 ${filtered.length}곳`}
          </p>
        )}
      </div>

      {error && (
        <div className="card text-center py-10">
          <p className="text-sm text-gray-500 mb-3">업체 데이터를 불러오지 못했습니다.</p>
          <button onClick={() => window.location.reload()} className="btn-primary">다시 시도</button>
        </div>
      )}

      {!rows && !error && (
        <div className="card animate-pulse h-64" aria-busy="true" />
      )}

      {rows && filtered.length === 0 && (
        <div className="card text-center py-10 text-gray-400 text-sm">‘{q.trim()}’에 해당하는 업체가 없습니다.</div>
      )}

      {filtered.length > 0 && (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="py-3 px-4 font-medium">업체</th>
                <th className="py-3 px-3 font-medium text-right">감사 플래그</th>
                <th className="py-3 px-3 font-medium text-right">최고 점수</th>
                <th className="py-3 px-3 font-medium text-right hidden sm:table-cell">거래 기관</th>
                <th className="py-3 px-4 font-medium text-right hidden md:table-cell">관련 계약 총액</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(([key, name, flags, maxScore, total, insts]) => (
                <tr key={key} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-4">
                    <Link href={`/vendors/${key}`} className="font-medium text-gray-900 hover:text-blue-600 hover:underline">
                      {name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">{flags}건</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold" style={{ color: maxScore >= 60 ? '#FF3B30' : maxScore >= 35 ? '#FF9500' : '#34C759' }}>
                    {maxScore}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-gray-500 hidden sm:table-cell">{insts}곳</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-gray-500 hidden md:table-cell">{total > 0 ? formatKRW(total) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
