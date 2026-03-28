// 열린국회정보 API 클라이언트
// https://open.assembly.go.kr/portal/openapi/
//
// 22대 국회 의원 정보 및 법률안 데이터를 가져옵니다.

const API_KEY = process.env.ASSEMBLY_API_KEY || 'c5d3b64dc8d9419fac113114b6fb97c9';
const BASE_URL = 'https://open.assembly.go.kr/portal/openapi';

// 22대 국회 UNIT_CD
const UNIT_CD_22 = '100022';

// ── API 응답 타입 ──

export interface AssemblyMember {
  HG_NM: string;       // 이름 (한글)
  HJ_NM: string;       // 이름 (한자)
  ENG_NM: string;      // 이름 (영문)
  POLY_NM: string;     // 정당
  ORIG_NM: string;     // 지역구
  ELECT_GBN_NM: string;// 선출구분 (지역구/비례대표)
  CMIT_NM: string;     // 소속 위원회
  CMITS: string;       // 위원회 목록
  REELE_GBN_NM: string;// 당선 횟수 (초선/재선/3선...)
  SEX_GBN_NM: string;  // 성별
  BTH_DATE: string;    // 생년월일
  MONA_CD: string;     // 고유 코드
  MEM_TITLE: string;   // 약력
  TEL_NO: string;      // 전화번호
  E_MAIL: string;      // 이메일
  HOMEPAGE: string;     // 홈페이지
}

export interface AssemblyBill {
  BILL_ID: string;           // 의안 고유 ID
  BILL_NO: string;           // 의안번호
  BILL_NAME: string;         // 의안명
  PROPOSER: string;          // 제안자 (예: "강대식의원 등 10인")
  PROPOSE_DT: string;        // 제안일
  COMMITTEE: string;         // 소관위원회
  COMMITTEE_ID: string;      // 소관위원회 ID
  COMMITTEE_DT: string;      // 위원회 회부일
  PROC_RESULT: string | null;// 처리상태
  PROC_DT: string | null;    // 처리일
  AGE: string;               // 대수 (22)
  DETAIL_LINK: string;       // 상세 링크
  MEMBER_LIST: string;       // 공동발의자 목록 링크
  RST_PROPOSER: string;      // 대표발의자 이름
  RST_MONA_CD: string;       // 대표발의자 고유코드
  PUBL_PROPOSER: string;     // 공동발의자 이름 목록 (쉼표 구분)
  PUBL_MONA_CD: string;      // 공동발의자 코드 목록 (쉼표 구분)
  // 법사위/본회의 처리
  CMT_PROC_RESULT_CD: string | null;
  CMT_PROC_DT: string | null;
  CMT_PRESENT_DT: string | null;
  LAW_PROC_DT: string | null;
  LAW_PROC_RESULT_CD: string | null;
  LAW_PRESENT_DT: string | null;
  LAW_SUBMIT_DT: string | null;
}

// ── API 응답 구조 ──

interface AssemblyApiHead {
  list_total_count: number;
  RESULT: {
    CODE: string;
    MESSAGE: string;
  };
}

interface AssemblyApiResponse<T> {
  [key: string]: [
    { head: AssemblyApiHead[] },
    { row: T[] },
  ];
}

// ── 페이지네이션 헬퍼 ──

async function fetchPage<T>(
  endpoint: string,
  params: Record<string, string>,
  pageIndex: number,
  pageSize: number,
): Promise<{ rows: T[]; totalCount: number }> {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('KEY', API_KEY);
  url.searchParams.set('Type', 'json');
  url.searchParams.set('pIndex', String(pageIndex));
  url.searchParams.set('pSize', String(pageSize));

  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (gukjeong-web; +https://github.com/gukjeong)',
      },
      // Next.js fetch cache: revalidate every 6 hours
      next: { revalidate: 21600 },
    });

    if (!res.ok) {
      throw new Error(`Assembly API returned ${res.status}: ${res.statusText}`);
    }

    const json = await res.json() as AssemblyApiResponse<T>;

    // The response shape: { "endpointName": [{ head: [...] }, { row: [...] }] }
    const key = Object.keys(json)[0];
    if (!key || !json[key]) {
      throw new Error('Unexpected API response structure');
    }

    const data = json[key];
    const headBlock = data[0]?.head;
    const rowBlock = data[1]?.row;

    if (!headBlock || headBlock.length < 2) {
      throw new Error('Missing head block in API response');
    }

    const resultCode = headBlock[1]?.RESULT?.CODE;
    if (resultCode && resultCode !== 'INFO-000') {
      const msg = headBlock[1]?.RESULT?.MESSAGE || 'Unknown error';
      throw new Error(`Assembly API error: ${resultCode} — ${msg}`);
    }

    const totalCount = headBlock[0]?.list_total_count || 0;
    const rows = rowBlock || [];

    return { rows, totalCount };
  } finally {
    clearTimeout(timeout);
  }
}

// ── 의원 목록 전체 가져오기 (자동 페이지네이션) ──

export async function fetchAllLegislators(): Promise<AssemblyMember[]> {
  const PAGE_SIZE = 100;
  const allMembers: AssemblyMember[] = [];

  // First page to get total count
  const first = await fetchPage<AssemblyMember>(
    'nwvrqwxyaytdsfvhu',
    { UNIT_CD: UNIT_CD_22 },
    1,
    PAGE_SIZE,
  );

  allMembers.push(...first.rows);
  const totalCount = first.totalCount;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Fetch remaining pages in parallel (max 3 concurrent)
  if (totalPages > 1) {
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

    // Process in batches of 3 to avoid overwhelming the API
    for (let i = 0; i < remainingPages.length; i += 3) {
      const batch = remainingPages.slice(i, i + 3);
      const results = await Promise.all(
        batch.map(pageIdx =>
          fetchPage<AssemblyMember>(
            'nwvrqwxyaytdsfvhu',
            { UNIT_CD: UNIT_CD_22 },
            pageIdx,
            PAGE_SIZE,
          ),
        ),
      );
      for (const r of results) {
        allMembers.push(...r.rows);
      }
    }
  }

  return allMembers;
}

// ── 특정 의원의 발의 법안 가져오기 ──

export async function fetchBillsByLegislator(
  name: string,
  pageIndex = 1,
  pageSize = 20,
): Promise<{ bills: AssemblyBill[]; totalCount: number }> {
  try {
    const result = await fetchPage<AssemblyBill>(
      'nzmimeepazxkubdpn',
      { AGE: '22', PROPOSER: name },
      pageIndex,
      pageSize,
    );
    return { bills: result.rows, totalCount: result.totalCount };
  } catch (err) {
    // Bill API may not work for all legislators — return empty
    console.warn(`Failed to fetch bills for ${name}:`, err);
    return { bills: [], totalCount: 0 };
  }
}

// ── 의안 발의 현황 가져오기 ──

export async function fetchBillProposalStatus(
  pageIndex = 1,
  pageSize = 100,
): Promise<{ bills: AssemblyBill[]; totalCount: number }> {
  try {
    const result = await fetchPage<AssemblyBill>(
      'nojepdqqaweusdfbi',
      { AGE: '22' },
      pageIndex,
      pageSize,
    );
    return { bills: result.rows, totalCount: result.totalCount };
  } catch (err) {
    console.warn('Failed to fetch bill proposal status:', err);
    return { bills: [], totalCount: 0 };
  }
}

// ── 유틸리티 함수 ──

/** 당선횟수 문자열을 숫자로 변환: 초선→1, 재선→2, 3선→3 ... */
export function parseElectedCount(reeleGbnNm: string | null | undefined): number {
  if (!reeleGbnNm) return 1;
  const s = reeleGbnNm.trim();
  if (s === '초선') return 1;
  if (s === '재선') return 2;
  // "3선", "4선", "5선" ...
  const match = s.match(/^(\d+)선$/);
  if (match) return parseInt(match[1], 10);
  return 1;
}

/** 생년월일로 나이 계산 */
export function calculateAge(bthDate: string | null | undefined): number | undefined {
  if (!bthDate) return undefined;
  // Formats seen: "1960-01-15", "19600115", "1960.01.15"
  const cleaned = bthDate.replace(/[.\-/]/g, '');
  if (cleaned.length < 8) return undefined;

  const year = parseInt(cleaned.substring(0, 4), 10);
  const month = parseInt(cleaned.substring(4, 6), 10);
  const day = parseInt(cleaned.substring(6, 8), 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;

  const now = new Date();
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) {
    age--;
  }
  return age;
}

/** 지역구에서 광역시도 추출: "서울 강남구갑" → "서울" */
export function extractRegion(origNm: string | null | undefined): string {
  if (!origNm) return '비례대표';
  const first = origNm.trim().split(/\s+/)[0];
  return first || '비례대표';
}

/** 약력을 요약 (처음 3줄) */
export function summarizeCareer(memTitle: string | null | undefined): string {
  if (!memTitle) return '';
  const lines = memTitle.split(/[\n,]+/).map(l => l.trim()).filter(Boolean);
  return lines.slice(0, 3).join(', ');
}
