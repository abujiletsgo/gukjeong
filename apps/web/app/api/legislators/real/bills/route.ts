import { NextResponse } from 'next/server';
import { fetchBillsByLegislator } from '@/lib/assembly/client';

export const revalidate = 21600; // 6시간

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
    const { bills, totalCount } = await fetchBillsByLegislator(name, page, size);

    // Map to a cleaner format
    const formattedBills = bills.map((b) => ({
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
      source: '열린국회정보 API (nzmimeepazxkubdpn)',
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
      { status: 502 },
    );
  }
}
