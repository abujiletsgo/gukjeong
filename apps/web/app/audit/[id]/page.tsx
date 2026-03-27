import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAuditFlagById, getAuditFlags } from '@/lib/data';
import AuditDetailClient from './AuditDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const flag = getAuditFlagById(id);
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

export function generateStaticParams() {
  return getAuditFlags().map(f => ({ id: f.id }));
}

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flag = getAuditFlagById(id);
  if (!flag) {
    notFound();
  }
  return <AuditDetailClient flag={flag} />;
}
