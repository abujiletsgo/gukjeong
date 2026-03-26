import type { Metadata } from 'next';
import { getDepartmentScores, getAuditFlags } from '@/lib/data';
import AuditPageClient from './AuditPageClient';

export const metadata: Metadata = {
  title: 'AI 감사관',
  description: '나라장터 계약 데이터에서 AI가 10가지 의심 패턴을 자동 탐지합니다.',
  openGraph: {
    title: 'AI 감사관 | 국정투명',
    description: '정부 계약에서 AI가 자동으로 의심 패턴을 탐지합니다. 연말 급증, 업체 집중, 계약 분할 등.',
    images: [{ url: '/og/audit.png', width: 1200, height: 630 }],
  },
};

export default function AuditPage() {
  const departmentScores = getDepartmentScores();
  const auditFlags = getAuditFlags();

  // KPI 계산
  const totalFlags = auditFlags.length;
  const highSeverity = auditFlags.filter(f => f.severity === 'HIGH').length;
  const departmentsMonitored = new Set(departmentScores.map(d => d.department)).size;
  const avgScore = Math.round(departmentScores.reduce((s, d) => s + d.suspicion_score, 0) / departmentScores.length);

  return (
    <AuditPageClient
      departmentScores={departmentScores}
      auditFlags={auditFlags}
      kpis={{
        totalFlags,
        highSeverity,
        departmentsMonitored,
        avgScore,
      }}
    />
  );
}
