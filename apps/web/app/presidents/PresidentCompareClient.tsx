'use client';
import { useState, useMemo } from 'react';
import type { FiscalYearly, PresidentComparisonMetrics } from '@/lib/types';
import PresidentPortrait from '@/components/presidents/PresidentPortrait';
import { getPresidentColor } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────
interface PresidentCompareClientProps {
  metrics: PresidentComparisonMetrics[];
  fiscalData: FiscalYearly[];
}

type MetricGroup = 'economy' | 'social' | 'governance';

interface MetricDef {
  key: keyof PresidentComparisonMetrics;
  label: string;
  unit: string;
  lowerIsBetter: boolean;
  note?: string;
}

const METRIC_GROUPS: Record<MetricGroup, { label: string; metrics: MetricDef[] }> = {
  economy: {
    label: '경제',
    metrics: [
      { key: 'gdp_growth_avg', label: 'GDP 성장률', unit: '%', lowerIsBetter: false },
      { key: 'avg_spending', label: '평균 재정지출', unit: '조원', lowerIsBetter: false },
      { key: 'spending_growth_pct', label: '지출 증가율', unit: '%', lowerIsBetter: true },
      { key: 'debt_growth_pct', label: '채무 증가율', unit: '%', lowerIsBetter: true },
      { key: 'avg_debt_to_gdp', label: '평균 부채/GDP', unit: '%', lowerIsBetter: true },
    ],
  },
  social: {
    label: '사회',
    metrics: [
      { key: 'unemployment_avg', label: '평균 실업률', unit: '%', lowerIsBetter: true },
      { key: 'housing_price_change', label: '주택가격 변동', unit: '%', lowerIsBetter: true },
      { key: 'birth_rate_end', label: '임기말 출산율', unit: '', lowerIsBetter: false, note: '출산율 하락은 전 세계적 추세이며, 특정 대통령에게만 귀속할 수 없습니다.' },
      { key: 'approval_avg', label: '평균 지지율', unit: '%', lowerIsBetter: false },
    ],
  },
  governance: {
    label: '거버넌스',
    metrics: [
      { key: 'approval_avg', label: '평균 지지율', unit: '%', lowerIsBetter: false },
      { key: 'policies_count', label: '주요 정책 수', unit: '개', lowerIsBetter: false },
      { key: 'pledge_fulfillment_avg', label: '공약 이행률', unit: '%', lowerIsBetter: false },
      { key: 'corruption_index_end', label: '투명성 지수(CPI)', unit: '점', lowerIsBetter: false },
      { key: 'key_events_count', label: '주요 사건 수', unit: '건', lowerIsBetter: false },
    ],
  },
};

// Radar chart axes (normalized 0-100)
const RADAR_AXES = [
  { key: 'gdp_growth_avg' as const, label: 'GDP성장', maxVal: 8, lowerIsBetter: false },
  { key: 'avg_debt_to_gdp' as const, label: '재정건전성', maxVal: 60, lowerIsBetter: true },
  { key: 'unemployment_avg' as const, label: '고용', maxVal: 6, lowerIsBetter: true },
  { key: 'housing_price_change' as const, label: '부동산안정', maxVal: 60, lowerIsBetter: true },
  { key: 'birth_rate_end' as const, label: '출산율', maxVal: 2, lowerIsBetter: false },
  { key: 'corruption_index_end' as const, label: '투명성', maxVal: 70, lowerIsBetter: false },
];

// ── Helpers ────────────────────────────────────────────
function getVal(m: PresidentComparisonMetrics, key: keyof PresidentComparisonMetrics): number {
  const v = m[key];
  return typeof v === 'number' ? v : 0;
}

function normalize(value: number, maxVal: number, lowerIsBetter: boolean): number {
  const ratio = Math.min(Math.abs(value) / maxVal, 1);
  return lowerIsBetter ? (1 - ratio) * 100 : ratio * 100;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ── Component ──────────────────────────────────────────
export default function PresidentCompareClient({ metrics, fiscalData }: PresidentCompareClientProps) {
  // 최근 4명만 기본 선택 (최대 4명 비교)
  const MAX_COMPARE = 4;
  const recentFour = metrics.slice(-MAX_COMPARE).map(m => m.id);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(recentFour));
  const [group, setGroup] = useState<MetricGroup>('economy');
  const [activeMetricIdx, setActiveMetricIdx] = useState(0);

  const groupDef = METRIC_GROUPS[group];
  const activeDef = groupDef.metrics[activeMetricIdx] || groupDef.metrics[0];

  const selected = useMemo(
    () => metrics.filter(m => selectedIds.has(m.id)),
    [metrics, selectedIds],
  );

  // Sort for bar chart
  const sorted = useMemo(() => {
    const arr = [...selected];
    arr.sort((a, b) => {
      const va = getVal(a, activeDef.key);
      const vb = getVal(b, activeDef.key);
      return activeDef.lowerIsBetter ? va - vb : vb - va;
    });
    return arr;
  }, [selected, activeDef]);

  // Best/worst per category
  const rankings = useMemo(() => {
    const results: { label: string; best: PresidentComparisonMetrics; worst: PresidentComparisonMetrics; bestVal: number; worstVal: number; unit: string }[] = [];
    for (const md of groupDef.metrics) {
      if (!selected.length) continue;
      const arr = [...selected].sort((a, b) => getVal(a, md.key) - getVal(b, md.key));
      const best = md.lowerIsBetter ? arr[0] : arr[arr.length - 1];
      const worst = md.lowerIsBetter ? arr[arr.length - 1] : arr[0];
      results.push({
        label: md.label,
        best,
        worst,
        bestVal: getVal(best, md.key),
        worstVal: getVal(worst, md.key),
        unit: md.unit,
      });
    }
    return results;
  }, [selected, groupDef]);

  // Spending timeline data: year 1-5 per president
  const timelineData = useMemo(() => {
    return selected.map(p => {
      const pFiscal = fiscalData
        .filter(f => f.president_id === p.id && f.total_spending)
        .sort((a, b) => a.year - b.year)
        .slice(0, 5);
      return {
        id: p.id,
        name: p.name,
        party: p.party,
        values: pFiscal.map((f, i) => ({ year: i + 1, spending: f.total_spending || 0 })),
      };
    }).filter(d => d.values.length > 0);
  }, [selected, fiscalData]);

  // ── Toggle helpers ──
  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 2) next.delete(id);
      } else if (next.size < MAX_COMPARE) {
        next.add(id);
      }
      return next;
    });
  };
  const selectRecent = () => setSelectedIds(new Set(recentFour));
  const deselectAll = () => setSelectedIds(new Set(metrics.slice(-2).map(m => m.id)));

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* A. President Selector Bar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-sm font-medium text-gray-600">비교 대상 선택 (최대 {MAX_COMPARE}명)</span>
          <div className="flex gap-2">
            <button onClick={selectRecent} className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
              최근 4명
            </button>
            <button onClick={deselectAll} className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
              전체 해제
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {metrics.map(m => {
            const on = selectedIds.has(m.id);
            const color = getPresidentColor(m.party);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  on
                    ? 'border-current shadow-sm'
                    : 'border-gray-200 opacity-40 grayscale'
                }`}
                style={on ? { color, borderColor: color, backgroundColor: `${color}10` } : undefined}
              >
                <PresidentPortrait id={m.id} name={m.name} party={m.party} size={22} />
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* B. Metric Group Tabs + Metric Selector */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {(Object.keys(METRIC_GROUPS) as MetricGroup[]).map(g => (
            <button
              key={g}
              onClick={() => { setGroup(g); setActiveMetricIdx(0); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                g === group
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {METRIC_GROUPS[g].label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {groupDef.metrics.map((md, i) => (
            <button
              key={md.key + i}
              onClick={() => setActiveMetricIdx(i)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                i === activeMetricIdx
                  ? 'bg-violet-100 text-violet-700 font-semibold'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {md.label}
            </button>
          ))}
        </div>
        {activeDef.note && (
          <p className="text-[10px] text-amber-600 mt-2 flex items-start gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            {activeDef.note}
          </p>
        )}
      </div>

      {/* C. Horizontal Bar Chart */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">{activeDef.label} 비교</h3>
        <p className="text-[10px] text-gray-400 mb-3">
          {activeDef.lowerIsBetter ? '낮을수록 좋음 (녹색 = 양호)' : '높을수록 좋음 (녹색 = 양호)'}
        </p>
        <div className="space-y-2">
          {sorted.map((m, idx) => {
            const val = getVal(m, activeDef.key);
            const maxAbs = Math.max(...sorted.map(s => Math.abs(getVal(s, activeDef.key))), 1);
            const pct = (Math.abs(val) / maxAbs) * 100;
            const isNeg = val < 0;
            const color = getPresidentColor(m.party);
            // Color bar by quality
            const isBest = idx === 0;
            const isWorst = idx === sorted.length - 1;
            const barBg = isBest ? 'bg-emerald-100' : isWorst ? 'bg-red-50' : 'bg-gray-50';

            return (
              <div key={m.id} className={`flex items-center gap-2 p-2 rounded-lg ${barBg} transition-colors`}>
                <div className="flex items-center gap-1.5 w-20 sm:w-24 shrink-0">
                  <PresidentPortrait id={m.id} name={m.name} party={m.party} size={24} />
                  <span className="text-xs font-medium text-gray-700 truncate">{m.name}</span>
                </div>
                <div className="flex-1 h-5 bg-white/60 rounded overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      backgroundColor: color,
                      opacity: 0.75,
                    }}
                  />
                </div>
                <span className="text-xs font-mono font-semibold w-16 text-right shrink-0" style={{ color }}>
                  {isNeg ? '' : val > 0 && activeDef.key === 'housing_price_change' ? '+' : ''}
                  {typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(1)) : val}
                  {activeDef.unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* D. Radar Chart */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">종합 레이더 차트</h3>
        <p className="text-[10px] text-gray-400 mb-3">6개 핵심 지표를 0~100 정규화 점수로 비교합니다.</p>
        <RadarChartSVG selected={selected} />
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
          {selected.map(m => (
            <div key={m.id} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: getPresidentColor(m.party), opacity: 0.8 }} />
              <span className="text-[10px] text-gray-600">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* E. Ranking Cards */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{groupDef.label} 지표별 순위</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rankings.map(r => (
            <div key={r.label} className="border border-gray-100 rounded-lg p-3">
              <p className="text-xs text-gray-500 font-medium mb-2">{r.label}</p>
              <div className="flex items-center justify-between">
                {/* Best */}
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-600 font-bold">1</div>
                  <PresidentPortrait id={r.best.id} name={r.best.name} party={r.best.party} size={22} />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{r.best.name}</p>
                    <p className="text-[10px] text-emerald-600 font-mono">
                      {typeof r.bestVal === 'number' ? (Number.isInteger(r.bestVal) ? r.bestVal : r.bestVal.toFixed(1)) : r.bestVal}{r.unit}
                    </p>
                  </div>
                </div>
                {/* Worst */}
                <div className="flex items-center gap-1.5">
                  <div>
                    <p className="text-xs font-semibold text-gray-800 text-right">{r.worst.name}</p>
                    <p className="text-[10px] text-red-500 font-mono text-right">
                      {typeof r.worstVal === 'number' ? (Number.isInteger(r.worstVal) ? r.worstVal : r.worstVal.toFixed(1)) : r.worstVal}{r.unit}
                    </p>
                  </div>
                  <PresidentPortrait id={r.worst.id} name={r.worst.name} party={r.worst.party} size={22} />
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-[10px] text-red-500 font-bold">
                    {selected.length}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* F. Timeline Overlay Chart */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">임기별 재정지출 궤적</h3>
        <p className="text-[10px] text-gray-400 mb-3">대통령 임기 1~5년차 재정지출(조원)을 겹쳐 비교합니다.</p>
        <TimelineChart data={timelineData} />
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
          {timelineData.map(d => (
            <div key={d.id} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: getPresidentColor(d.party), opacity: 0.8 }} />
              <span className="text-[10px] text-gray-600">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-gray-300 text-center">
        동일한 데이터 기준으로 모든 대통령에 적용됩니다. 출처: 기획재정부, 한국은행, 통계청, Transparency International
      </p>
    </div>
  );
}

// ── Radar Chart SVG Sub-component ──────────────────────
function RadarChartSVG({ selected }: { selected: PresidentComparisonMetrics[] }) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const n = RADAR_AXES.length;
  const step = 360 / n;

  // Grid rings
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Axis label positions
  const axisPoints = RADAR_AXES.map((_, i) => {
    const angle = i * step;
    return polarToCartesian(cx, cy, maxR + 16, angle);
  });

  // Build polygon paths per president
  const polygons = selected.map(m => {
    const points = RADAR_AXES.map((ax, i) => {
      const raw = getVal(m, ax.key);
      const norm = normalize(raw, ax.maxVal, ax.lowerIsBetter);
      const r = (norm / 100) * maxR;
      const angle = i * step;
      return polarToCartesian(cx, cy, r, angle);
    });
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
    return { id: m.id, party: m.party, d };
  });

  return (
    <div className="flex justify-center overflow-x-auto">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full">
        {/* Grid rings */}
        {rings.map(r => {
          const pts = Array.from({ length: n }, (_, i) => {
            const angle = i * step;
            return polarToCartesian(cx, cy, maxR * r, angle);
          });
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
          return <path key={r} d={d} stroke="#e5e7eb" strokeWidth="0.5" fill="none" />;
        })}

        {/* Axes */}
        {RADAR_AXES.map((_, i) => {
          const end = polarToCartesian(cx, cy, maxR, i * step);
          return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#d1d5db" strokeWidth="0.5" />;
        })}

        {/* President polygons */}
        {polygons.map(pg => {
          const color = getPresidentColor(pg.party);
          return (
            <g key={pg.id}>
              <path d={pg.d} fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.5" strokeOpacity="0.8" />
            </g>
          );
        })}

        {/* Axis labels */}
        {RADAR_AXES.map((ax, i) => (
          <text
            key={ax.key}
            x={axisPoints[i].x}
            y={axisPoints[i].y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[10px]"
            fill="#6b7280"
          >
            {ax.label}
          </text>
        ))}

        {/* Ring value labels */}
        {rings.map(r => {
          const pt = polarToCartesian(cx, cy, maxR * r, 0);
          return (
            <text key={r} x={pt.x + 4} y={pt.y - 2} className="text-[8px]" fill="#d1d5db">
              {Math.round(r * 100)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ── Timeline Chart SVG Sub-component ───────────────────
function TimelineChart({ data }: { data: { id: string; name: string; party?: string; values: { year: number; spending: number }[] }[] }) {
  if (!data.length) return <p className="text-xs text-gray-400 text-center py-4">선택된 대통령의 재정 데이터가 없습니다.</p>;

  const W = 600;
  const H = 260;
  const pad = { top: 20, right: 16, bottom: 30, left: 50 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const allSpending = data.flatMap(d => d.values.map(v => v.spending));
  const minS = Math.min(...allSpending) * 0.9;
  const maxS = Math.max(...allSpending) * 1.05;
  const maxYear = Math.max(...data.map(d => d.values.length));

  const xScale = (yr: number) => pad.left + ((yr - 1) / Math.max(maxYear - 1, 1)) * plotW;
  const yScale = (val: number) => pad.top + plotH - ((val - minS) / (maxS - minS)) * plotH;

  // Y-axis ticks
  const yTicks = Array.from({ length: 5 }, (_, i) => minS + ((maxS - minS) * i) / 4);

  return (
    <div className="overflow-x-auto -mx-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[400px]" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map(t => (
          <g key={t}>
            <line x1={pad.left} y1={yScale(t)} x2={W - pad.right} y2={yScale(t)} stroke="#f3f4f6" strokeWidth="0.5" />
            <text x={pad.left - 4} y={yScale(t) + 3} textAnchor="end" className="text-[9px]" fill="#9ca3af">
              {Math.round(t)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {Array.from({ length: maxYear }, (_, i) => (
          <text key={i} x={xScale(i + 1)} y={H - pad.bottom + 16} textAnchor="middle" className="text-[9px]" fill="#9ca3af">
            {i + 1}년차
          </text>
        ))}

        {/* Lines */}
        {data.map(d => {
          const color = getPresidentColor(d.party);
          if (d.values.length < 2) return null;
          const pathD = d.values
            .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(v.year).toFixed(1)} ${yScale(v.spending).toFixed(1)}`)
            .join(' ');
          return (
            <g key={d.id}>
              <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.8" strokeLinejoin="round" />
              {d.values.map(v => (
                <circle key={v.year} cx={xScale(v.year)} cy={yScale(v.spending)} r="3" fill={color} fillOpacity="0.9" stroke="white" strokeWidth="1" />
              ))}
            </g>
          );
        })}

        {/* Y-axis title */}
        <text x={12} y={pad.top + plotH / 2} textAnchor="middle" transform={`rotate(-90, 12, ${pad.top + plotH / 2})`} className="text-[9px]" fill="#9ca3af">
          조원
        </text>
      </svg>
    </div>
  );
}
