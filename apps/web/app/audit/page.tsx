import type { Metadata } from 'next';
import { getAuditFlags } from '@/lib/data';
import { getAuditFlagsFromDB } from '@/lib/db/queries';

export const revalidate = 3600;
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

export default async function AuditPage() {
  // Try DB first; fall back to JSON if DB is empty or unavailable
  const { flags: dbFlags } = await getAuditFlagsFromDB({ pageSize: 500 });
  // Mirror the DB pageSize on the JSON fallback. Without this cap the page
  // serializes all ~39.5k findings into the client payload (~216MB HTML),
  // which makes the browser unable to render the page.
  const auditFlags = dbFlags.length > 0 ? dbFlags : getAuditFlags().slice(0, 500);

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
