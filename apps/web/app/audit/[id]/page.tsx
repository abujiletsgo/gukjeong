import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAuditFlagById } from '@/lib/data';
import { getAuditFindingFull, getTopFindingIdsFromIndex } from '@/lib/audit/full';
import AuditDetailClient from './AuditDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const flag = await getAuditFindingFull(id) ?? getAuditFlagById(id);
  if (!flag) {
    return { title: '감사 플래그를 찾을 수 없습니다' };
  }
  const patternLabels: Record<string, string> = {
    yearend_spike: '연말 지출 급증',
    vendor_concentration: '업체 집중도',
    contract_splitting: '계약 분할',
  };
  const patternType = flag.pattern_type;
  return {
    title: `감사 플래그: ${patternLabels[patternType] || patternType}`,
    description: `${flag.target_id}에서 감지된 의심 패턴 상세 분석`,
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
