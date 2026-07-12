import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAuditFlagById } from '@/lib/data';
import { getAuditFindingFull, getTopFindingIdsFromIndex } from '@/lib/audit/full';
import AuditDetailClient from './AuditDetailClient';

const OG_PATTERN_LABELS: Record<string, string> = {
  ghost_company: '유령업체 의심', zero_competition: '경쟁 부재', bid_rate_anomaly: '예정가격 유출 의심',
  new_company_big_win: '신생업체 고액수주', vendor_concentration: '업체 집중', repeated_sole_source: '반복 수의계약',
  contract_splitting: '계약 분할 의심', low_bid_competition: '과소 경쟁', high_value_sole_source: '고액 수의계약',
  yearend_spike: '연말 지출 급증', bid_rigging: '입찰 담합', cross_pattern: '복합 패턴',
  systemic_risk: '체계적 비리 위험', related_companies: '동일 대표/주소 업체', amount_spike: '계약금액 급증',
  contract_inflation: '계약 금액 부풀리기', price_clustering: '투찰가 군집', network_collusion: '네트워크 담합',
  sanctioned_vendor: '제재 업체 재수주', same_winner_repeat: '동일업체 반복수주',
  rapid_sole_source_burst: '단기 수의계약 연속', geographic_concentration: '원거리 집중 수주',
  threshold_avoidance: '한도 회피', short_bid_window: '초단기 공고', ceo_rotation: '대표 교체 반복',
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const flag = await getAuditFindingFull(id) ?? getAuditFlagById(id);
  if (!flag) {
    return { title: '감사 플래그를 찾을 수 없습니다' };
  }
  const label = OG_PATTERN_LABELS[flag.pattern_type] || flag.pattern_type;
  const inst = flag.target_institution || flag.target_id || '';
  const desc = (flag.summary || `${inst}에서 감지된 의심 패턴 상세 분석`).slice(0, 120);
  // 카카오톡/트위터 공유용 finding별 동적 OG 카드
  const og = `/og?score=${flag.suspicion_score}&pattern=${encodeURIComponent(label)}&title=${encodeURIComponent(inst.slice(0, 40))}&desc=${encodeURIComponent(desc.slice(0, 90))}`;
  return {
    title: `${inst} — ${label}`,
    description: desc,
    openGraph: {
      title: `${inst} — ${label} | 국정투명 AI 감사`,
      description: desc,
      images: [{ url: og, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [og] },
  };
}

// Pre-render only top 200 findings; the rest are generated on first request (ISR)
export const dynamicParams = true;

export async function generateStaticParams() {
  // 인덱스(adjusted_score 내림차순)에서 상위 200개 — 빌드 시 fs로 읽는다
  return getTopFindingIdsFromIndex(200).map(id => ({ id }));
}

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // DB → 정적 샤드(fs/CDN) → 시드 순 폴백
  const flag = await getAuditFindingFull(id) ?? getAuditFlagById(id);
  if (!flag) {
    notFound();
  }
  return <AuditDetailClient flag={flag} />;
}
