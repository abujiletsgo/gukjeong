'use client';
// Overlay component that fetches real audit data and shows real numbers
// when the user is in live mode (default).
import { useState, useEffect } from 'react';
import { useDataMode } from '@/lib/context/DataModeContext';

interface HomeRealDataOverlayProps {
  /** Seed data counts to show in demo mode (passed through from server) */
  seedAuditCount: number;
  seedLegislatorCount: number;
}

interface RealAuditSummary {
  findings_count: number;
  contracts_analyzed: number;
  summary: {
    sole_source_ratio: number;
    unique_institutions: number;
    unique_vendors: number;
  };
}

export default function HomeRealDataOverlay({ seedAuditCount, seedLegislatorCount }: HomeRealDataOverlayProps) {
  const { isDemo } = useDataMode();
  const [realData, setRealData] = useState<RealAuditSummary | null>(null);

  useEffect(() => {
    if (isDemo) return;
    fetch('/data/audit-results.json')
      .then(r => r.json())
      .then((data: RealAuditSummary) => setRealData(data))
      .catch(() => {});
  }, [isDemo]);

  // In demo mode or before data loads, show nothing (server-rendered seed data shows through)
  if (isDemo || !realData) return null;

  // Overlay real numbers on the NUMBERS BAR section
  return (
    <div
      style={{
        backgroundColor: 'rgba(0,122,255,0.06)',
        borderBottom: '1px solid rgba(0,122,255,0.12)',
      }}
    >
      <div className="container-page py-3 flex flex-wrap items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--apple-blue, #007AFF)' }}
          />
          <span className="font-medium" style={{ color: 'var(--apple-blue, #007AFF)' }}>실제 데이터 요약</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold" style={{ color: 'var(--color-label, #000)' }}>{realData.findings_count}건</span>
          <span style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>의심 패턴 탐지</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold" style={{ color: 'var(--color-label, #000)' }}>{realData.contracts_analyzed.toLocaleString()}건</span>
          <span style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>계약 분석</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold" style={{ color: 'var(--color-label, #000)' }}>{realData.summary.sole_source_ratio}%</span>
          <span style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>수의계약 비율</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold" style={{ color: 'var(--color-label, #000)' }}>{realData.summary.unique_institutions.toLocaleString()}개</span>
          <span style={{ color: 'var(--color-label-secondary, rgba(60,60,67,0.6))' }}>기관</span>
        </div>
      </div>
    </div>
  );
}
