import { NextResponse } from 'next/server';
import { getLocalG2BContracts } from '@/lib/local-data';
import { runAuditAnalysis } from '@/lib/audit/patterns';
import type { G2BContractInfo } from '@/lib/g2b/client';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const { items, totalCount, fetched_at } = getLocalG2BContracts();
    const contracts = items as unknown as G2BContractInfo[];

    const findings = await runAuditAnalysis(contracts);

    return NextResponse.json({
      demo: false,
      timestamp: new Date().toISOString(),
      fetched_at,
      contracts_analyzed: contracts.length,
      total_available: totalCount,
      findings_count: findings.length,
      findings,
    });
  } catch (error) {
    console.error('[audit/analyze] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      demo: true,
    }, { status: 500 });
  }
}
