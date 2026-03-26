import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAuditFlagById, getAuditFlags } from '@/lib/data';
import AuditDetailClient from './AuditDetailClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const flag = getAuditFlagById(params.id);
  if (!flag) {
    return { title: '감사 플래그를 찾을 수 없습니다' };
  }
  const patternLabels: Record<string, string> = {
    yearend_spike: '연말 지출 급증',
    vendor_concentration: '업체 집중도',
    contract_splitting: '계약 분할',
  };
  const patternType = flag.patternType || flag.pattern_type || '';
  return {
    title: `감사 플래그: ${patternLabels[patternType] || patternType}`,
    description: `${flag.targetId || flag.target_id}에서 감지된 의심 패턴 상세 분석`,
  };
}

export function generateStaticParams() {
  return getAuditFlags().map(f => ({ id: f.id }));
}

export default function AuditDetailPage({ params }: { params: { id: string } }) {
  const flag = getAuditFlagById(params.id);
  if (!flag) {
    notFound();
  }
  return <AuditDetailClient flag={flag} />;
}
