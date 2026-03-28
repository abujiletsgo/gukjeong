import { NextResponse } from 'next/server';
import { getLocalBills } from '@/lib/local-data';

export const dynamic = 'force-static';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name');
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const size = Math.min(parseInt(url.searchParams.get('size') || '20', 10), 100);

  if (!name) {
    return NextResponse.json(
      { error: true, message: 'name 파라미터가 필요합니다 (예: ?name=강대식)' },
      { status: 400 },
    );
  }

  const startTime = Date.now();

  try {
    const { items: allBills, fetched_at } = getLocalBills();

    // Filter bills where this legislator is proposer or co-proposer
    const matched = (allBills as any[]).filter(
      (b) =>
        b.RST_PROPOSER === name ||
        (b.PROPOSER && b.PROPOSER.includes(name)) ||
        (b.PUBL_PROPOSER && b.PUBL_PROPOSER.includes(name))
    );

    const totalCount = matched.length;
    const startIdx = (page - 1) * size;
    const bills = matched.slice(startIdx, startIdx + size);

    const formattedBills = bills.map((b: any) => ({
      id: b.BILL_ID,
      billNo: b.BILL_NO,
      name: b.BILL_NAME,
      proposer: b.PROPOSER,
      representativeProposer: b.RST_PROPOSER,
      coProposers: b.PUBL_PROPOSER
        ? b.PUBL_PROPOSER.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      coProposerCount: b.PUBL_PROPOSER
        ? b.PUBL_PROPOSER.split(',').filter(Boolean).length
        : 0,
      proposeDate: b.PROPOSE_DT,
      committee: b.COMMITTEE,
      committeeDate: b.COMMITTEE_DT,
      procResult: b.PROC_RESULT,
      procDate: b.PROC_DT,
      detailLink: b.DETAIL_LINK,
      memberListLink: b.MEMBER_LIST,
    }));

    return NextResponse.json({
      legislator: name,
      page,
      size,
      totalCount,
      totalPages: Math.ceil(totalCount / size),
      source: '로컬 데이터 (열린국회정보 스냅샷)',
      fetched_at,
      timestamp: new Date().toISOString(),
      elapsed_ms: Date.now() - startTime,
      bills: formattedBills,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: true,
        message,
        legislator: name,
        timestamp: new Date().toISOString(),
        elapsed_ms: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}
