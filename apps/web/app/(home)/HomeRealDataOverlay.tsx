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
    <div className="bg-emerald-50 border-b border-emerald-100">
      <div className="container-page py-3 flex flex-wrap items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-800 font-medium">실제 데이터 요약</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-emerald-900">{realData.findings_count}건</span>
          <span className="text-emerald-700">의심 패턴 탐지</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-emerald-900">{realData.contracts_analyzed.toLocaleString()}건</span>
          <span className="text-emerald-700">계약 분석</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-emerald-900">{realData.summary.sole_source_ratio}%</span>
          <span className="text-emerald-700">수의계약 비율</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-emerald-900">{realData.summary.unique_institutions.toLocaleString()}개</span>
          <span className="text-emerald-700">기관</span>
        </div>
      </div>
    </div>
  );
}
