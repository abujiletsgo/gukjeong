/**
 * 한국은행 ECOS API Client — 경제 지표 데이터
 *
 * 한국은행 경제통계시스템(ECOS)의 주요 경제 지표를 가져옵니다.
 * API: https://ecos.bok.or.kr/api/KeyStatisticList/{API_KEY}/json/kr/1/50
 */

const ECOS_API_KEY = process.env.ECOS_API_KEY || 'UTL8M4BXGPPLQAQE2W9T';
const ECOS_BASE_URL = 'https://ecos.bok.or.kr/api';

export interface EconomicIndicator {
  /** 지표명 (예: "GDP(명목, 계절조정)") */
  name: string;
  /** 수치 값 */
  value: number;
  /** 원래 단위 (예: "십억원", "%") */
  unit: string;
  /** 사람이 읽기 쉬운 형식 (예: "690.6조원") */
  formatted: string;
  /** 기준 시점 (예: "2024 4/4") */
  period?: string;
  /** 데이터 코드 */
  code?: string;
}

/**
 * ECOS API 응답 타입
 */
interface ECOSResponse {
  KeyStatisticList?: {
    list_total_count?: number;
    row?: ECOSRow[];
  };
  RESULT?: {
    CODE: string;
    MESSAGE: string;
  };
}

interface ECOSRow {
  CLASS_NAME?: string;     // 통계명
  KEYSTAT_NAME?: string;   // 지표명
  DATA_VALUE?: string;     // 값
  UNIT_NAME?: string;      // 단위
  CYCLE?: string;          // 주기 (M: 월, Q: 분기, A: 연)
  TIME?: string;           // 기준 시점
}

// ---------------------------------------------------------------------------
// Formatting Utilities
// ---------------------------------------------------------------------------

/**
 * 큰 숫자를 한국식 단위로 포맷
 * - 십억원 단위 값을 조원으로 변환
 * - 퍼센트는 그대로 표시
 */
function formatKoreanNumber(value: number, unit: string): string {
  // 퍼센트 단위
  if (unit === '%' || unit === '%p' || unit.includes('퍼센트') || unit.includes('%')) {
    return `${value.toFixed(1)}%`;
  }

  // 원화 (십억원 → 조원)
  if (unit === '십억원' || unit.includes('십억')) {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}조원`;
    }
    return `${value.toFixed(1)}십억원`;
  }

  // 원화 (억원)
  if (unit === '억원' || unit.includes('억원')) {
    if (Math.abs(value) >= 10000) {
      return `${(value / 10000).toFixed(1)}조원`;
    }
    return `${value.toLocaleString('ko-KR')}억원`;
  }

  // 달러
  if (unit.includes('달러') || unit.includes('USD') || unit === '원/달러') {
    return `${value.toLocaleString('ko-KR')}원`;
  }

  // 만명
  if (unit === '만명' || unit.includes('만명')) {
    return `${value.toLocaleString('ko-KR')}만명`;
  }

  // 천명
  if (unit === '천명' || unit.includes('천명')) {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}만명`;
    }
    return `${value.toLocaleString('ko-KR')}천명`;
  }

  // 기본: 소수점 1자리 + 단위
  if (Number.isInteger(value)) {
    return `${value.toLocaleString('ko-KR')}${unit}`;
  }
  return `${value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}${unit}`;
}

/**
 * 시점 문자열 정규화
 */
function formatPeriod(time: string | undefined, cycle: string | undefined): string {
  if (!time) return '';

  // "202404" → "2024 4/4", "202403" → "2024.03" 등
  if (time.length === 6) {
    const year = time.slice(0, 4);
    const monthOrQuarter = time.slice(4, 6);

    if (cycle === 'Q') {
      const qMap: Record<string, string> = { '01': '1/4', '02': '2/4', '03': '3/4', '04': '4/4' };
      return `${year} ${qMap[monthOrQuarter] || monthOrQuarter}`;
    }

    return `${year}.${monthOrQuarter}`;
  }

  if (time.length === 4) {
    return `${time}년`;
  }

  return time;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * ECOS 주요 경제 지표 가져오기
 *
 * 10초 타임아웃, 실패 시 빈 배열 반환
 */
export async function fetchKeyEconomicStats(): Promise<EconomicIndicator[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const url = `${ECOS_BASE_URL}/KeyStatisticList/${ECOS_API_KEY}/json/kr/1/50`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 }, // 30분 캐시
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[ECOS] API responded with ${response.status}`);
      return [];
    }

    const data: ECOSResponse = await response.json();

    // 에러 응답 처리
    if (data.RESULT && data.RESULT.CODE !== 'INFO-000') {
      console.warn(`[ECOS] API error: ${data.RESULT.CODE} - ${data.RESULT.MESSAGE}`);
      return [];
    }

    const rows = data.KeyStatisticList?.row;
    if (!rows || rows.length === 0) {
      console.warn('[ECOS] No data rows returned');
      return [];
    }

    return rows
      .filter((row) => row.DATA_VALUE && row.DATA_VALUE !== '-')
      .map((row) => {
        const rawValue = parseFloat(row.DATA_VALUE!.replace(/,/g, ''));
        const unit = row.UNIT_NAME || '';
        const name = row.KEYSTAT_NAME || row.CLASS_NAME || '알 수 없음';

        return {
          name,
          value: isNaN(rawValue) ? 0 : rawValue,
          unit,
          formatted: isNaN(rawValue) ? '-' : formatKoreanNumber(rawValue, unit),
          period: formatPeriod(row.TIME, row.CYCLE),
          code: row.CLASS_NAME,
        };
      });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[ECOS] Fetch failed: ${errMsg}`);
    return [];
  }
}

/**
 * 주요 지표만 필터링 (GDP, 경제성장률, 실업률, 환율, 소비자물가 등)
 */
export async function fetchHighlightStats(): Promise<EconomicIndicator[]> {
  const all = await fetchKeyEconomicStats();

  // 주요 키워드로 필터 (있는 것만 반환)
  const keywords = [
    'GDP',
    '경제성장률',
    '소비자물가',
    '실업률',
    '기준금리',
    '환율',
    '경상수지',
    '수출',
    '수입',
    '취업자',
  ];

  const highlights: EconomicIndicator[] = [];

  for (const keyword of keywords) {
    const match = all.find((item) =>
      item.name.includes(keyword),
    );
    if (match) {
      highlights.push(match);
    }
  }

  // 키워드 매칭이 너무 적으면 전체에서 앞 10개 반환
  if (highlights.length < 3) {
    return all.slice(0, 10);
  }

  return highlights;
}
