'use client';
// 공약 이행 흐름도 — 수평 퍼널 시각화 (SVG)
import { useMemo, useRef, useEffect, useState } from 'react';

interface PledgeFlowProps {
  total: number;
  pursued: number;
  fulfilled: number;
  partial: number;
  notPursued: number;
  dropped: number;
  deferred: number;
}

interface FlowNode {
  id: string;
  label: string;
  count: number;
  color: string;
  x: number;
  y: number;
  height: number;
}

const MIN_NODE_H = 18;

export default function PledgeFlow({
  total,
  pursued,
  fulfilled,
  partial,
  notPursued,
  dropped,
  deferred,
}: PledgeFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(700);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const svgWidth = Math.max(containerWidth, 500);
  const svgHeight = 300;
  const margin = { top: 30, right: 20, bottom: 20, left: 20 };
  const innerW = svgWidth - margin.left - margin.right;
  const innerH = svgHeight - margin.top - margin.bottom;

  const nodes = useMemo<FlowNode[]>(() => {
    if (total === 0) return [];

    const colX = [0, 0.3, 0.65, 0.65, 1, 1];
    const nodeWidth = 14;

    const scale = (count: number) => Math.max(MIN_NODE_H, (count / total) * innerH * 0.85);

    // Column 0: total
    const totalH = scale(total);
    const totalY = (innerH - totalH) / 2 + margin.top;

    // Column 1: pursued / notPursued
    const pursuedH = scale(pursued);
    const notPursuedH = scale(notPursued);
    const col1Gap = 12;
    const col1Total = pursuedH + notPursuedH + col1Gap;
    const col1Start = (innerH - col1Total) / 2 + margin.top;

    // Column 2: fulfilled / partial (from pursued)
    const fulfilledH = scale(fulfilled);
    const partialH = scale(partial);
    const col2Gap = 10;
    const col2Total = fulfilledH + partialH + col2Gap;
    const col2Start = col1Start;

    // Column 3: dropped / deferred (from notPursued)
    const droppedH = scale(dropped);
    const deferredH = scale(deferred);
    const col3Gap = 10;
    const col3Total = droppedH + deferredH + col3Gap;
    const col3Start = col1Start + pursuedH + col1Gap;

    return [
      { id: 'total', label: `총 공약`, count: total, color: '#0f172a', x: margin.left + colX[0] * innerW, y: totalY, height: totalH },
      { id: 'pursued', label: '추진', count: pursued, color: '#3b82f6', x: margin.left + colX[1] * innerW, y: col1Start, height: pursuedH },
      { id: 'notPursued', label: '미추진', count: notPursued, color: '#9ca3af', x: margin.left + colX[1] * innerW, y: col1Start + pursuedH + col1Gap, height: notPursuedH },
      { id: 'fulfilled', label: '이행완료', count: fulfilled, color: '#22c55e', x: margin.left + colX[2] * innerW, y: col2Start, height: fulfilledH },
      { id: 'partial', label: '일부이행', count: partial, color: '#f59e0b', x: margin.left + colX[2] * innerW, y: col2Start + fulfilledH + col2Gap, height: partialH },
      { id: 'dropped', label: '폐기', count: dropped, color: '#ef4444', x: margin.left + colX[4] * innerW - 14, y: col3Start, height: droppedH },
      { id: 'deferred', label: '보류', count: deferred, color: '#6b7280', x: margin.left + colX[4] * innerW - 14, y: col3Start + droppedH + col3Gap, height: deferredH },
    ];
  }, [total, pursued, fulfilled, partial, notPursued, dropped, deferred, innerW, innerH]);

  const flowPaths = useMemo(() => {
    if (nodes.length === 0) return [];
    const find = (id: string) => nodes.find(n => n.id === id)!;
    const nodeW = 14;

    const makeFlow = (from: FlowNode, to: FlowNode, fromOffsetPct: number, thickness: number, color: string) => {
      const x1 = from.x + nodeW;
      const x2 = to.x;
      const y1 = from.y + from.height * fromOffsetPct;
      const y2 = to.y;
      const mx = (x1 + x2) / 2;
      const h = thickness;

      const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2} L${x2},${y2 + h} C${mx},${y2 + h} ${mx},${y1 + h} ${x1},${y1 + h} Z`;
      return { d, color };
    };

    const t = find('total');
    const p = find('pursued');
    const np = find('notPursued');
    const f = find('fulfilled');
    const pa = find('partial');
    const dr = find('dropped');
    const de = find('deferred');

    const flows = [];

    // total -> pursued
    flows.push(makeFlow(t, p, 0, p.height, '#3b82f6'));
    // total -> notPursued
    flows.push(makeFlow(t, np, p.height / t.height, np.height, '#9ca3af'));
    // pursued -> fulfilled
    flows.push(makeFlow(p, f, 0, f.height, '#22c55e'));
    // pursued -> partial
    flows.push(makeFlow(p, pa, f.height / p.height, pa.height, '#f59e0b'));
    // notPursued -> dropped
    flows.push(makeFlow(np, dr, 0, dr.height, '#ef4444'));
    // notPursued -> deferred
    flows.push(makeFlow(np, de, dr.height / np.height, de.height, '#6b7280'));

    return flows;
  }, [nodes]);

  if (total === 0) {
    return (
      <div className="w-full flex items-center justify-center text-gray-400 py-12">
        <div className="text-center">
          <div className="text-4xl mb-2">--</div>
          <p className="text-sm">공약 흐름 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full overflow-x-auto animate-fade-in">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="min-w-[500px]"
      >
        <defs>
          {/* Gradient for flow animation */}
          <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {/* Flow paths */}
        {flowPaths.map((flow, i) => (
          <path
            key={i}
            d={flow.d}
            fill={flow.color}
            fillOpacity={0.15}
            stroke={flow.color}
            strokeOpacity={0.3}
            strokeWidth={0.5}
            className="transition-all duration-700 ease-out"
          />
        ))}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={14}
              height={node.height}
              fill={node.color}
              rx={4}
              className="transition-all duration-500 ease-out"
            />
            {/* Label above node */}
            <text
              x={node.x + 7}
              y={node.y - 8}
              textAnchor="middle"
              fontSize={11}
              fontWeight="600"
              fill="#374151"
            >
              {node.label}
            </text>
            {/* Count inside/below */}
            <text
              x={node.x + 7}
              y={node.y + node.height + 16}
              textAnchor="middle"
              fontSize={12}
              fontWeight="700"
              fill={node.color}
            >
              {node.count}개
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
