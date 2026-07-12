import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAuditFlagById, getAuditFlags } from '@/lib/data';
import { getAuditFlagsFromDB, getAuditFlagByIdFromDB } from '@/lib/db/queries';
import AuditDetailClient from './AuditDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const flag = await getAuditFlagByIdFromDB(id) ?? getAuditFlagById(id);
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
  const { flags: dbFlags } = await getAuditFlagsFromDB({ pageSize: 200 });
  const flags = dbFlags.length > 0
    ? dbFlags
    : getAuditFlags()
        .sort((a, b) => (b.suspicion_score ?? 0) - (a.suspicion_score ?? 0))
        .slice(0, 200);

  return flags
    .sort((a, b) => (b.suspicion_score ?? 0) - (a.suspicion_score ?? 0))
    .slice(0, 200)
    .map(f => ({ id: f.id }));
}

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flag = await getAuditFlagByIdFromDB(id) ?? getAuditFlagById(id);
  if (!flag) {
    notFound();
  }
  return <AuditDetailClient flag={flag} />;
}
