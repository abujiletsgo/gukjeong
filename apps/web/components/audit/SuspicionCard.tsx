'use client';
// 의심 패턴 카드 — 감사 플래그 표시
import type { AuditFlag } from '@/lib/types';
import { getSeverityColor, getSeverityLabel, formatKRW } from '@/lib/utils';
import PatternBadge from './PatternBadge';

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

  const score = flag.suspicionScore || flag.suspicion_score || 0;
  const patternType = flag.patternType || flag.pattern_type || '';
  const targetId = flag.targetId || flag.target_id || '';
  const aiAnalysis = flag.aiAnalysis || flag.ai_analysis || '';
  const severityColor = getSeverityColor(score);

  return (
    <a
      href={`/audit/${flag.id}`}
      className="block card border-l-4 hover:shadow-md transition-all duration-200 group"
      style={{ borderLeftColor: severityColor }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <PatternBadge pattern={patternType} score={score} />
            <span className="text-xs text-gray-400">{flag.severity}</span>
          </div>
          <div className="font-semibold text-sm text-gray-800 group-hover:text-accent transition-colors mt-1">
            {patternLabels[patternType] || patternType}
          </div>
          <div className="text-xs text-gray-500 mt-1">{targetId}</div>
        </div>

        {/* 점수 */}
        <div className="text-right flex-shrink-0">
          <div
            className="text-2xl font-bold"
            style={{ color: severityColor }}
          >
            {score}
          </div>
          <div className="text-[10px] text-gray-400">{getSeverityLabel(score)}</div>
        </div>
      </div>

      {/* AI 분석 */}
      {aiAnalysis && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-start gap-2">
            <span className="ai-badge flex-shrink-0 mt-0.5">AI 분석</span>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
              {aiAnalysis}
            </p>
          </div>
        </div>
      )}

      {/* 증거 요약 */}
      {flag.evidence && typeof flag.evidence === 'object' && (flag.evidence as any).description && (
        <div className="mt-2 text-[10px] text-gray-400 bg-gray-50 rounded px-2 py-1">
          {(flag.evidence as any).description}
        </div>
      )}
    </a>
  );
}
