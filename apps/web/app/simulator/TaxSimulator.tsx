'use client';
// 내 세금 어디로? — 연소득 → 대략적 소득세+지방세 추정 → 2026 예산 분야별 배분 시각화.
// 근로소득 간이 추정(공제 단순화)이므로 "대략적인 감"을 주는 도구임을 명시한다.
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useUrlState } from '@/lib/hooks/useUrlState';

interface Sector { sector: string; percentage: number; slug: string }

const SECTOR_COLORS: Record<string, string> = {
  '보건·복지·고용': '#FF6B6B', '일반·지방행정': '#8E8E93', '교육': '#5AC8FA',
  '국방': '#5856D6', '산업·중소기업·에너지': '#FF9500', 'R&D': '#AF52DE',
  '공공질서·안전': '#007AFF', 'SOC': '#A2845E', '농림·수산·식품': '#34C759',
  '환경': '#00C7BE', '문화·체육·관광': '#FF2D55',
};

// 간이 근로소득세 추정: 근로소득공제 + 기본공제(150만) 후 기본세율표 적용, 지방소득세 10% 가산
function estimateTax(grossManwon: number): number {
  const gross = grossManwon * 10_000; // 원
  // 근로소득공제 (간이)
  let ded: number;
  if (gross <= 5_000_000) ded = gross * 0.7;
  else if (gross <= 15_000_000) ded = 3_500_000 + (gross - 5_000_000) * 0.4;
  else if (gross <= 45_000_000) ded = 7_500_000 + (gross - 15_000_000) * 0.15;
  else if (gross <= 100_000_000) ded = 12_000_000 + (gross - 45_000_000) * 0.05;
  else ded = 14_750_000 + (gross - 100_000_000) * 0.02;
  const base = Math.max(0, gross - ded - 1_500_000); // 기본공제 1인
  // 2024~ 기본세율표
  const brackets: [number, number, number][] = [
    [14_000_000, 0.06, 0],
    [50_000_000, 0.15, 1_260_000],
    [88_000_000, 0.24, 5_760_000],
    [150_000_000, 0.35, 15_440_000],
    [300_000_000, 0.38, 19_940_000],
    [500_000_000, 0.40, 25_940_000],
    [1_000_000_000, 0.42, 35_940_000],
    [Infinity, 0.45, 65_940_000],
  ];
  let tax = 0;
  for (const [cap, rate, minus] of brackets) {
    if (base <= cap) { tax = base * rate - minus; break; }
  }
  tax = Math.max(0, tax);
  return Math.round(tax * 1.1); // 지방소득세 10%
}

function fmt(won: number): string {
  if (won >= 100_000_000) return `${(won / 100_000_000).toFixed(1)}억원`;
  if (won >= 10_000) return `${Math.round(won / 10_000).toLocaleString()}만원`;
  return `${won.toLocaleString()}원`;
}

export default function TaxSimulator({ sectors }: { sectors: Sector[] }) {
  const [incomeStr, setIncomeStr] = useUrlState('income', '4000');
  const income = Math.max(0, Math.min(1_000_000, Number(incomeStr) || 0)); // 만원 단위
  const [touched, setTouched] = useState(false);

  const tax = useMemo(() => estimateTax(income), [income]);

  return (
    <div>
      <div className="card mb-6">
        <label htmlFor="income" className="block text-sm font-bold text-gray-900 mb-1">연소득 (세전, 만원)</label>
        <p className="text-xs text-gray-400 mb-3">근로소득 1인 가구 기준 간이 추정입니다. 실제 세액과 다를 수 있습니다.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            id="income"
            type="number"
            min={0}
            max={1000000}
            step={100}
            value={incomeStr}
            onChange={(e) => { setIncomeStr(e.target.value); setTouched(true); }}
            className="w-40 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-lg font-bold tabular-nums"
          />
          <span className="text-sm text-gray-500">만원</span>
          <div className="flex gap-1.5 flex-wrap">
            {[3000, 4000, 6000, 10000].map(v => (
              <button
                key={v}
                onClick={() => { setIncomeStr(String(v)); setTouched(true); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${income === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {v >= 10000 ? `${v / 10000}억` : `${v.toLocaleString()}만`}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-baseline gap-2 flex-wrap">
          <span className="text-sm text-gray-500">추정 연간 소득세(지방세 포함)</span>
          <span className="text-2xl font-black text-gray-900 tabular-nums">{fmt(tax)}</span>
          {income > 0 && <span className="text-xs text-gray-400">실효세율 약 {((tax / (income * 10_000)) * 100).toFixed(1)}%</span>}
        </div>
      </div>

      {tax > 0 && (
        <div className="card">
          <h2 className="font-bold text-lg mb-1">내 세금 {fmt(tax)}, 이렇게 나뉩니다</h2>
          <p className="text-xs text-gray-400 mb-4">2026년 정부 예산 분야별 비중 기준 · 분야를 클릭하면 상세 예산으로 이동</p>
          <div className="space-y-2">
            {sectors.map(({ sector, percentage, slug }) => {
              const share = Math.round(tax * (percentage / 100));
              return (
                <Link
                  key={sector}
                  href={`/budget/${slug}`}
                  className="flex items-center gap-3 group"
                >
                  <span className="text-xs text-gray-600 w-36 shrink-0 group-hover:text-blue-600 transition-colors">{sector}</span>
                  <div className="flex-1 h-6 rounded-lg bg-gray-50 overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-500 flex items-center"
                      style={{ width: `${Math.max(percentage, 2)}%`, backgroundColor: SECTOR_COLORS[sector] ?? '#8E8E93', opacity: 0.85 }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-800 tabular-nums w-20 text-right shrink-0">{fmt(share)}</span>
                  <span className="text-[10px] text-gray-400 tabular-nums w-10 text-right shrink-0">{percentage}%</span>
                </Link>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-300 mt-4">
            {touched ? '' : 'URL을 공유하면 같은 소득 기준으로 열립니다. '}
            국세 전체가 아닌 예산 총지출 비중 기준의 단순 배분이며, 실제 재원 구성(세목·기금)과는 차이가 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
