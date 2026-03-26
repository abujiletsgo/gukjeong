'use client';
// 대통령 타임라인 — 인터랙티브 가로 스크롤 카드 타임라인
import type { President, FiscalYearly } from '@/lib/types';
import Sparkline from '@/components/charts/Sparkline';
import PresidentPortrait from '@/components/presidents/PresidentPortrait';
import { getPresidentColor, getPresidentBgColor, formatPercent } from '@/lib/utils';

interface PresidentTimelineProps {
  presidents: President[];
  fiscalData: FiscalYearly[];
}

export default function PresidentTimeline({ presidents, fiscalData }: PresidentTimelineProps) {
  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      {/* 타임라인 연결선 */}
      <div className="relative">
        <div className="absolute top-[60px] left-0 right-0 h-1 bg-gray-200 rounded-full z-0" />
        <div className="flex gap-3 sm:gap-4 min-w-max relative z-10">
          {presidents.map((p) => {
            // 해당 대통령 임기 중 재정 데이터
            const presidentFiscal = fiscalData.filter(f => f.president_id === p.id);
            const spendingData = presidentFiscal
              .map(f => f.total_spending || 0)
              .filter(v => v > 0);

            const initials = p.name.charAt(0);
            const partyColor = getPresidentColor(p.party);
            const bgColor = getPresidentBgColor(p.party);
            const isCurrentPresident = !p.term_end;

            return (
              <a
                key={p.id}
                href={`/presidents/${p.id}`}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 min-w-[180px] sm:min-w-[200px] flex-shrink-0 overflow-hidden"
              >
                {/* 상단 색상 바 */}
                <div className="h-1.5" style={{ backgroundColor: partyColor }} />

                <div className="p-4">
                  {/* 초상화 + 이름 */}
                  <div className="flex items-center gap-3 mb-3">
                    <PresidentPortrait id={p.id} name={p.name} party={p.party} size={48} />
                    <div>
                      <div className="font-bold text-base text-gray-900 group-hover:text-accent transition-colors">
                        {p.name}
                      </div>
                      <div className="text-xs text-gray-500">{p.era}</div>
                    </div>
                  </div>

                  {/* 정당 */}
                  <div className="text-xs text-gray-400 mb-2 truncate" title={p.party}>
                    {p.party}
                  </div>

                  {/* 임기 */}
                  <div className="text-xs text-gray-500 mb-3">
                    {p.term_start.substring(0, 7).replace('-', '.')}
                    {' ~ '}
                    {isCurrentPresident ? (
                      <span className="text-accent font-medium">현재</span>
                    ) : (
                      (p.term_end || '').substring(0, 7).replace('-', '.')
                    )}
                    {p.note && (
                      <span className="ml-1 text-red-400 text-[10px]">({p.note})</span>
                    )}
                  </div>

                  {/* GDP 성장률 */}
                  {p.gdp_growth_avg && (
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-500">평균 GDP 성장률</span>
                      <span className="font-semibold text-gray-800">
                        {formatPercent(p.gdp_growth_avg)}
                      </span>
                    </div>
                  )}

                  {/* 지출 스파크라인 */}
                  {spendingData.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-50">
                      <div className="text-[10px] text-gray-400 mb-1">정부 지출 추이</div>
                      <Sparkline
                        data={spendingData}
                        width={160}
                        height={28}
                        color={partyColor}
                        showArea
                      />
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
