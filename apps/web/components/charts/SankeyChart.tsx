'use client';
// Sankey 다이어그램 — 세입 → 지출 흐름 (SVG 기반)
import { useRef, useEffect, useState } from 'react';

interface SankeyNode {
  name: string;
  type: 'revenue' | 'spending';
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SankeyChartProps {
  data?: SankeyData;
  height?: number;
}

const REVENUE_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#06b6d4'];
const SPENDING_COLORS = [
  '#f97316', '#ef4444', '#10b981', '#ec4899', '#d97706',
  '#84cc16', '#14b8a6', '#6366f1', '#f43f5e', '#0ea5e9', '#a855f7',
];

export default function SankeyChart({ data, height = 500 }: SankeyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height });

  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      setDims({ width: w, height });
    }
  }, [height]);

  if (!data || !data.nodes.length) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400" style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2">🔀</div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const { width: W, height: H } = dims;
  const margin = { top: 20, right: 140, bottom: 20, left: 120 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  // Separate nodes by type
  const revenueNodes = data.nodes.filter(n => n.type === 'revenue');
  const spendingNodes = data.nodes.filter(n => n.type === 'spending');

  // Calculate totals for sizing
  const revTotal = data.links
    .filter(l => revenueNodes.some(n => n.name === l.source))
    .reduce((sum, l) => {
      if (!revenueNodes.find(rn => rn.name === l.source)) return sum;
      return sum;
    }, 0);

  // Group links by source to get source totals
  const sourceTotals: Record<string, number> = {};
  const targetTotals: Record<string, number> = {};
  for (const link of data.links) {
    sourceTotals[link.source] = (sourceTotals[link.source] || 0) + link.value;
    targetTotals[link.target] = (targetTotals[link.target] || 0) + link.value;
  }

  const totalFlow = Object.values(sourceTotals).reduce((s, v) => s + v, 0);
  const nodeGap = 6;

  // Position source nodes (left side)
  const sourceNodeHeights = revenueNodes.map(n => ({
    ...n,
    h: Math.max(16, (sourceTotals[n.name] || 0) / totalFlow * (innerH - nodeGap * (revenueNodes.length - 1))),
  }));
  let sourceY = margin.top;
  const sourcePositions: Record<string, { x: number; y: number; h: number }> = {};
  for (const node of sourceNodeHeights) {
    sourcePositions[node.name] = { x: margin.left, y: sourceY, h: node.h };
    sourceY += node.h + nodeGap;
  }

  // Position target nodes (right side)
  const targetNodeHeights = spendingNodes.map(n => ({
    ...n,
    h: Math.max(14, (targetTotals[n.name] || 0) / totalFlow * (innerH - nodeGap * (spendingNodes.length - 1))),
  }));
  let targetY = margin.top;
  const targetPositions: Record<string, { x: number; y: number; h: number }> = {};
  for (const node of targetNodeHeights) {
    targetPositions[node.name] = { x: margin.left + innerW, y: targetY, h: node.h };
    targetY += node.h + nodeGap;
  }

  // Build flow paths
  const sourceOffsets: Record<string, number> = {};
  const targetOffsets: Record<string, number> = {};
  for (const name in sourcePositions) sourceOffsets[name] = 0;
  for (const name in targetPositions) targetOffsets[name] = 0;

  const flows = data.links
    .sort((a, b) => b.value - a.value)
    .map((link, i) => {
      const sp = sourcePositions[link.source];
      const tp = targetPositions[link.target];
      if (!sp || !tp) return null;

      const linkH = Math.max(1, (link.value / totalFlow) * (innerH - nodeGap * Math.max(revenueNodes.length, spendingNodes.length)));

      const sy = sp.y + (sourceOffsets[link.source] || 0);
      const ty = tp.y + (targetOffsets[link.target] || 0);

      sourceOffsets[link.source] = (sourceOffsets[link.source] || 0) + linkH;
      targetOffsets[link.target] = (targetOffsets[link.target] || 0) + linkH;

      const x1 = sp.x + 16;
      const x2 = tp.x;
      const mx = (x1 + x2) / 2;

      const path = `M${x1},${sy} C${mx},${sy} ${mx},${ty} ${x2},${ty} L${x2},${ty + linkH} C${mx},${ty + linkH} ${mx},${sy + linkH} ${x1},${sy + linkH} Z`;

      const sourceIdx = revenueNodes.findIndex(n => n.name === link.source);
      const color = REVENUE_COLORS[sourceIdx % REVENUE_COLORS.length];

      return { path, color, link, sy, ty, linkH };
    })
    .filter(Boolean);

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg width={W} height={H}>
        {/* Flow paths */}
        {flows.map((flow, i) => (
          <path
            key={i}
            d={flow!.path}
            fill={flow!.color}
            fillOpacity={0.2}
            stroke={flow!.color}
            strokeOpacity={0.3}
            strokeWidth={0.5}
          />
        ))}

        {/* Source nodes (left) */}
        {revenueNodes.map((node, i) => {
          const pos = sourcePositions[node.name];
          const color = REVENUE_COLORS[i % REVENUE_COLORS.length];
          return (
            <g key={`src-${node.name}`}>
              <rect x={pos.x} y={pos.y} width={16} height={pos.h} fill={color} rx={3} />
              <text
                x={pos.x - 6}
                y={pos.y + pos.h / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="#374151"
                fontWeight="500"
              >
                {node.name}
              </text>
              <text
                x={pos.x - 6}
                y={pos.y + pos.h / 2 + 14}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={9}
                fill="#9ca3af"
              >
                {(sourceTotals[node.name] || 0).toFixed(0)}조
              </text>
            </g>
          );
        })}

        {/* Target nodes (right) */}
        {spendingNodes.map((node, i) => {
          const pos = targetPositions[node.name];
          const color = SPENDING_COLORS[i % SPENDING_COLORS.length];
          return (
            <g key={`tgt-${node.name}`}>
              <rect x={pos.x} y={pos.y} width={16} height={pos.h} fill={color} rx={3} />
              <text
                x={pos.x + 22}
                y={pos.y + pos.h / 2}
                textAnchor="start"
                dominantBaseline="middle"
                fontSize={11}
                fill="#374151"
                fontWeight="500"
              >
                {node.name}
              </text>
              <text
                x={pos.x + 22}
                y={pos.y + pos.h / 2 + 14}
                textAnchor="start"
                dominantBaseline="middle"
                fontSize={9}
                fill="#9ca3af"
              >
                {(targetTotals[node.name] || 0).toFixed(1)}조
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
