// 나라장터 공공데이터 API 클라이언트
// https://apis.data.go.kr/1230000/ao/PubDataOpnStdService
//
// 공공데이터포털 조달청 개방표준 API를 통해
// 입찰공고, 낙찰정보, 계약정보를 조회합니다.
//
// 환경변수: DATA_GO_KR_API_KEY

const BASE_URL =
  'https://apis.data.go.kr/1230000/ao/PubDataOpnStdService';

const USR_INFO_URL =
  'https://apis.data.go.kr/1230000/ao/UsrInfoService02';

// ── Types ───────────────────────────────────────────────────────────

/** 입찰공고 정보 */
export interface G2BBidInfo {
  bidNtceNo: string;           // 입찰공고번호
  bidNtceOrd: string;          // 입찰공고차수
  bidNtceNm: string;           // 공고명
  ntceInsttNm: string;         // 공고기관명
  dminsttNm: string;           // 수요기관명
  presmptPrce: number;         // 추정가격
  bidNtceDt: string;           // 공고일시
  bidClseDt: string;           // 입찰마감일시
  cntrctMthdNm: string;        // 계약방법명 (일반경쟁, 제한경쟁, 수의계약 등)
  ntceKindNm?: string;         // 공고종류명
  intrbidYn?: string;          // 국제입찰여부
  bidMethdNm?: string;         // 입찰방식명 (전자입찰 등)
  sucsfbidMthdNm?: string;     // 낙찰방법명
  rgstDt?: string;             // 등록일시
  asignBdgtAmt?: number;       // 배정예산금액
  dminsttCd?: string;          // 수요기관코드
  ntceInsttCd?: string;        // 공고기관코드
  refNo?: string;              // 참조번호
  bidNtceUrl?: string;         // 입찰공고 URL
}

/** 낙찰 정보 */
export interface G2BScsbidInfo {
  bidNtceNo: string;           // 입찰공고번호
  bidNtceOrd?: string;         // 입찰공고차수
  bidNtceNm?: string;          // 공고명
  ntceInsttNm?: string;        // 공고기관명
  dminsttNm?: string;          // 수요기관명
  sucsfbidAmt: number;         // 낙찰금액
  sucsfbidRate?: number;       // 낙찰률
  sucsfbidMthdNm?: string;     // 낙찰방법명
  bidwinrBizno: string;        // 낙찰자 사업자번호
  bidwinrNm: string;           // 낙찰자명
  bidwinrCeoNm?: string;       // 낙찰자 대표자명
  opengDt?: string;            // 개찰일시
  rgstDt?: string;             // 등록일시
}

/** 계약 정보 */
export interface G2BContractInfo {
  cntrctNo: string;            // 계약번호
  cntrctNm: string;            // 계약명
  dminsttNm: string;           // 수요기관명
  cntrctAmt: number;           // 계약금액
  cntrctCnclsDt: string;       // 계약체결일
  cntrctMthdNm?: string;       // 계약방법명
  sucsfbidMthdNm?: string;     // 낙찰방법명
  cntrctorBizno?: string;      // 계약업체 사업자번호
  cntrctorNm?: string;         // 계약업체명
  cntrctorCeoNm?: string;      // 계약업체 대표자명
  ntceInsttNm?: string;        // 공고기관명
  bidNtceNo?: string;          // 입찰공고번호
  cntrctBgnDt?: string;        // 계약시작일
  cntrctEndDt?: string;        // 계약종료일
  rgstDt?: string;             // 등록일시
}

/** 조달업체 기본정보 */
export interface G2BCorpInfo {
  bizno: string;               // 사업자등록번호
  corpNm: string;              // 업체명
  engCorpNm?: string;          // 영문업체명
  ceoNm: string;               // 대표자명
  opbizDt?: string;            // 개업일
  rgnNm?: string;              // 지역명
  adrs?: string;               // 주소
  dtlAdrs?: string;            // 상세주소
  telNo?: string;              // 전화번호
  emplyeNum: number;           // 종업원수
  corpBsnsDivNm?: string;      // 업체사업구분명 (물품,공사,용역 등)
  hdoffceDivNm?: string;       // 본사구분명
  rgstDt?: string;             // 등록일시
  chgDt?: string;              // 변경일시
}

/** 부정당제재업체 정보 */
export interface G2BSanctionedCorp {
  bizno: string;               // 사업자등록번호
  corpNm: string;              // 업체명
  ceoNm?: string;              // 대표자명
  rsttBgnDt?: string;          // 제재시작일
  rsttEndDt?: string;          // 제재종료일
  rsttRsnCntnts?: string;      // 제재사유
  rsttDivNm?: string;          // 제재구분명
}

/** 페이지네이션 응답 공통 */
export interface G2BPagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNo: number;
  numOfRows: number;
}

// ── Internal helpers ────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.DATA_GO_KR_API_KEY;
  if (!key) {
    throw new Error(
      '[G2B] DATA_GO_KR_API_KEY 환경변수가 설정되지 않았습니다.',
    );
  }
  return key;
}

/**
 * data.go.kr JSON 응답은 아래 형태:
 * {
 *   response: {
 *     header: { resultCode, resultMsg },
 *     body: {
 *       items: [...],        // array or single item
 *       totalCount: number,
 *       numOfRows: number,
 *       pageNo: number
 *     }
 *   }
 * }
 */
interface DataGoKrJsonResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: unknown[] | Record<string, unknown> | null;
      totalCount: number;
      numOfRows: number;
      pageNo: number;
    };
  };
}

function buildUrl(
  endpoint: string,
  params: Record<string, string | number>,
  baseUrl: string = BASE_URL,
): string {
  // serviceKey는 이미 인코딩된 상태로 전달되므로 수동으로 URL을 구성합니다.
  // data.go.kr는 serviceKey를 decoding된 상태 또는 encoding된 상태
  // 둘 다 받으므로 URLSearchParams를 사용해도 무방합니다.
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }
  return `${baseUrl}/${endpoint}?${searchParams.toString()}`;
}

function parseItems<T>(body: DataGoKrJsonResponse['response']['body']): {
  items: T[];
  totalCount: number;
} {
  const totalCount = body.totalCount ?? 0;

  let rawItems: unknown[] = [];
  if (Array.isArray(body.items)) {
    rawItems = body.items;
  } else if (body.items && typeof body.items === 'object') {
    // 단건 응답인 경우 배열로 감쌈
    rawItems = [body.items];
  }

  // 숫자 필드를 실제 number로 변환
  const items = rawItems.map((item) => {
    const obj = item as Record<string, unknown>;
    const converted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (isNumericField(key) && val != null && val !== '') {
        converted[key] = Number(val);
      } else {
        converted[key] = val ?? '';
      }
    }
    return converted as T;
  });

  return { items, totalCount };
}

/** 숫자로 변환해야 하는 필드 판별 */
function isNumericField(fieldName: string): boolean {
  const numericSuffixes = [
    'Prce', 'Amt', 'Rate', 'Cnt', 'Num',
  ];
  const exactFields = [
    'presmptPrce', 'asignBdgtAmt', 'sucsfbidAmt', 'sucsfbidRate',
    'cntrctAmt', 'totalCount',
  ];
  if (exactFields.includes(fieldName)) return true;
  return numericSuffixes.some((s) => fieldName.endsWith(s));
}

async function fetchFromG2B<T>(
  endpoint: string,
  params: { numOfRows?: number; pageNo?: number; [key: string]: string | number | undefined },
  baseUrl: string = BASE_URL,
): Promise<G2BPagedResponse<T>> {
  const apiKey = getApiKey();
  const numOfRows = params.numOfRows ?? 10;
  const pageNo = params.pageNo ?? 1;

  const queryParams: Record<string, string | number> = {
    serviceKey: apiKey,
    numOfRows,
    pageNo,
    type: 'json',
  };
  // Forward extra params (e.g. bizno for company lookup)
  for (const [key, val] of Object.entries(params)) {
    if (key !== 'numOfRows' && key !== 'pageNo' && val != null) {
      queryParams[key] = val;
    }
  }

  const url = buildUrl(endpoint, queryParams, baseUrl);

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(
      `[G2B] HTTP ${response.status} from ${endpoint}`,
    );
  }

  const json = (await response.json()) as DataGoKrJsonResponse;

  const header = json?.response?.header;
  if (header && header.resultCode !== '00') {
    throw new Error(
      `[G2B] API error: ${header.resultCode} - ${header.resultMsg}`,
    );
  }

  const body = json?.response?.body;
  if (!body) {
    return { items: [], totalCount: 0, pageNo, numOfRows };
  }

  const { items, totalCount } = parseItems<T>(body);
  return { items, totalCount, pageNo, numOfRows };
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * 입찰공고 목록 조회
 * endpoint: getDataSetOpnStdBidPblancInfo
 */
export async function fetchBidAnnouncements(params: {
  numOfRows?: number;
  pageNo?: number;
} = {}): Promise<{ items: G2BBidInfo[]; totalCount: number }> {
  try {
    const result = await fetchFromG2B<G2BBidInfo>(
      'getDataSetOpnStdBidPblancInfo',
      params,
    );
    return { items: result.items, totalCount: result.totalCount };
  } catch (error) {
    console.error('[G2B] 입찰공고 조회 실패:', error);
    return { items: [], totalCount: 0 };
  }
}

/**
 * 낙찰정보 조회
 * endpoint: getDataSetOpnStdScsbidInfo
 */
export async function fetchSuccessfulBids(params: {
  numOfRows?: number;
  pageNo?: number;
} = {}): Promise<{ items: G2BScsbidInfo[]; totalCount: number }> {
  try {
    const result = await fetchFromG2B<G2BScsbidInfo>(
      'getDataSetOpnStdScsbidInfo',
      params,
    );
    return { items: result.items, totalCount: result.totalCount };
  } catch (error) {
    console.error('[G2B] 낙찰정보 조회 실패:', error);
    return { items: [], totalCount: 0 };
  }
}

/**
 * 계약정보 조회
 * endpoint: getDataSetOpnStdCntrctInfo
 */
export async function fetchContracts(params: {
  numOfRows?: number;
  pageNo?: number;
} = {}): Promise<{ items: G2BContractInfo[]; totalCount: number }> {
  try {
    const result = await fetchFromG2B<G2BContractInfo>(
      'getDataSetOpnStdCntrctInfo',
      params,
    );
    return { items: result.items, totalCount: result.totalCount };
  } catch (error) {
    console.error('[G2B] 계약정보 조회 실패:', error);
    return { items: [], totalCount: 0 };
  }
}

// ── UsrInfoService02 — 조달업체 정보 ────────────────────────────────

/**
 * 조달업체 기본정보 조회
 * 사업자등록번호(bizno)로 업체의 대표자, 종업원수, 업종, 주소 등을 조회합니다.
 * endpoint: getPrcrmntCorpBasicInfo02
 */
export async function fetchCorpInfo(bizno: string): Promise<G2BCorpInfo | null> {
  try {
    const result = await fetchFromG2B<G2BCorpInfo>(
      'getPrcrmntCorpBasicInfo02',
      { bizno, inqryDiv: '3', numOfRows: 1 },
      USR_INFO_URL,
    );
    return result.items[0] ?? null;
  } catch (error) {
    console.error('[G2B] 조달업체 기본정보 조회 실패:', error);
    return null;
  }
}

/**
 * 부정당제재업체 정보 조회
 * 제재된 업체 목록을 페이지 단위로 조회합니다.
 * endpoint: getUnptRsttCorpInfo02
 */
export async function fetchSanctionedCorps(params: {
  numOfRows?: number;
  pageNo?: number;
} = {}): Promise<{ items: G2BSanctionedCorp[]; totalCount: number }> {
  try {
    const result = await fetchFromG2B<G2BSanctionedCorp>(
      'getUnptRsttCorpInfo02',
      { ...params, inqryDiv: '3' },
      USR_INFO_URL,
    );
    return { items: result.items, totalCount: result.totalCount };
  } catch (error) {
    console.error('[G2B] 부정당제재업체 조회 실패:', error);
    return { items: [], totalCount: 0 };
  }
}

// ── Utilities ───────────────────────────────────────────────────────

/**
 * 전체 페이지 순회하여 모든 데이터를 가져오는 유틸리티.
 * maxPages로 최대 페이지 수를 제한할 수 있습니다.
 */
export async function fetchAllPages<T>(
  fetcher: (params: {
    numOfRows?: number;
    pageNo?: number;
  }) => Promise<{ items: T[]; totalCount: number }>,
  options: { numOfRows?: number; maxPages?: number } = {},
): Promise<{ items: T[]; totalCount: number }> {
  const numOfRows = options.numOfRows ?? 100;
  const maxPages = options.maxPages ?? 10;
  const allItems: T[] = [];
  let totalCount = 0;

  for (let page = 1; page <= maxPages; page++) {
    const result = await fetcher({ numOfRows, pageNo: page });
    totalCount = result.totalCount;
    allItems.push(...result.items);

    // 마지막 페이지이면 중단
    if (result.items.length < numOfRows) break;
    if (allItems.length >= totalCount) break;
  }

  return { items: allItems, totalCount };
}
