import { NextResponse } from 'next/server';
import { fetchContracts, fetchAllPages, type G2BContractInfo } from '@/lib/g2b/client';
import { runAuditAnalysis } from '@/lib/audit/patterns';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: 'API 키가 설정되지 않았습니다. DATA_GO_KR_API_KEY 환경변수를 설정해주세요.',
      demo: true,
    }, { status: 200 });
  }

  try {
    // 최근 계약 데이터 수집 (최대 1000건, 10페이지)
    const { items: contracts, totalCount } = await fetchAllPages<G2BContractInfo>(
      fetchContracts,
      { numOfRows: 100, maxPages: 10 },
    );

    // 패턴 탐지 실행
    const findings = await runAuditAnalysis(contracts);

    return NextResponse.json({
      demo: false,
      timestamp: new Date().toISOString(),
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
