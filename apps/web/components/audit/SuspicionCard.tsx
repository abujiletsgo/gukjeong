'use client';
// 의심 패턴 카드
import type { AuditFlag } from '@/lib/types';
import { getSeverityColor } from '@/lib/utils';

export default function SuspicionCard({ flag }: { flag: AuditFlag }) {
  const patternLabels: Record<string, string> = {
    yearend_spike: '연말 지출 급증',
    vendor_concentration: '업체 집중도',
    inflated_pricing: '고가 계약',
    contract_splitting: '계약 분할',
    zombie_project: '좀비 사업',
    revolving_door: '전관예우',
    paper_company: '페이퍼 컴퍼니',
    unnecessary_renovation: '불필요 개보수',
    poor_roi: '낮은 ROI',
    bid_rigging: '입찰 담합',
  };

  return (
    <div className="card border-l-4" style={{ borderLeftColor: getSeverityColor(flag.suspicionScore) }}>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-sm font-semibold text-gray-700">
            {patternLabels[flag.patternType] || flag.patternType}
          </span>
          <div className="text-xs text-gray-500 mt-1">{flag.targetId}</div>
        </div>
        <div
          className="text-lg font-bold"
          style={{ color: getSeverityColor(flag.suspicionScore) }}
        >
          {flag.suspicionScore}
        </div>
      </div>
      {flag.aiAnalysis && (
        <div className="mt-3 text-sm text-gray-600">
          <span className="ai-badge mr-2">AI 분석</span>
          {flag.aiAnalysis}
        </div>
      )}
    </div>
  );
}
