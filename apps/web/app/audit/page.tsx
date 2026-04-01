import type { Metadata } from 'next';
import { getDepartmentScores, getAuditFlags } from '@/lib/data';

// ISR: 감사 데이터는 6시간마다 재생성
export const revalidate = 21600;
import AuditPageClient from './AuditPageClient';

export const metadata: Metadata = {
  title: 'AI 감사관',
  description: '나라장터 계약 데이터에서 AI가 20가지 의심 패턴을 자동 탐지합니다.',
  openGraph: {
    title: 'AI 감사관 | 국정투명',
    description: '정부 계약에서 AI가 자동으로 의심 패턴을 탐지합니다. 유령업체, 경쟁 부재, 입찰담합, 복합 의심 등 20가지.',
    images: [{ url: '/og/audit.png', width: 1200, height: 630 }],
  },
};

export default function AuditPage() {
  // getAuditFlags() now loads real 나라장터 data from public/data/audit-results.json
  // Falls back to seed data if the file doesn't exist
  const auditFlags = getAuditFlags();

  // Compute department scores from live audit flags
  const deptMap: Record<string, { max: number; count: number }> = {};
  for (const f of auditFlags) {
    const dept = f.target_id || '';
    if (!dept) continue;
    if (!deptMap[dept]) deptMap[dept] = { max: 0, count: 0 };
    deptMap[dept].max = Math.max(deptMap[dept].max, f.suspicion_score);
    deptMap[dept].count++;
  }
  const departmentScores = Object.entries(deptMap)
    .map(([department, { max, count }]) => ({
      department,
      suspicion_score: max,
      flag_count: count,
    }))
    .sort((a, b) => b.suspicion_score - a.suspicion_score);

  // KPI 계산
  const totalFlags = auditFlags.length;
  const highSeverity = auditFlags.filter(f => f.severity === 'HIGH').length;
  const departmentsMonitored = departmentScores.length;
  const avgScore = departmentScores.length > 0
    ? Math.round(departmentScores.reduce((s, d) => s + d.suspicion_score, 0) / departmentScores.length)
    : 0;

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
