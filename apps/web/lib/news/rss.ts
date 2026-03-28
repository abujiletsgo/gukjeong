/**
 * RSS Feed Client — 실시간 뉴스 피드
 *
 * 6개 한국 주요 언론사의 RSS 피드에서 실제 기사를 가져옵니다.
 * 외부 XML 라이브러리 없이 직접 파싱합니다.
 */

export interface RSSFeedSource {
  id: string;
  name: string;
  url: string;
  spectrum: number; // 1.0 (진보) ~ 5.0 (보수)
  category: 'progressive' | 'center' | 'conservative';
}

export const WORKING_FEEDS: RSSFeedSource[] = [
  { id: 'hankyoreh', name: '한겨레', url: 'https://www.hani.co.kr/rss/', spectrum: 1.2, category: 'progressive' },
  { id: 'khan', name: '경향신문', url: 'https://www.khan.co.kr/rss/rssdata/total_news.xml', spectrum: 1.5, category: 'progressive' },
  { id: 'donga', name: '동아일보', url: 'https://rss.donga.com/total.xml', spectrum: 4.0, category: 'conservative' },
  { id: 'sbs', name: 'SBS', url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=RSSREADER', spectrum: 2.8, category: 'center' },
  { id: 'jtbc', name: 'JTBC', url: 'https://fs.jtbc.co.kr/RSS/newsflash.xml', spectrum: 2.2, category: 'progressive' },
  { id: 'segye', name: '세계일보', url: 'https://www.segye.com/Articles/RSSList/segye_recent.xml', spectrum: 3.2, category: 'conservative' },
];

export interface RealNewsArticle {
  outlet_id: string;
  outlet_name: string;
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  spectrum_score: number;
  category: string;
}

// ---------------------------------------------------------------------------
// XML Parsing Utilities (no external dependencies)
// ---------------------------------------------------------------------------

/**
 * CDATA 섹션을 포함한 태그 내용 추출
 * <![CDATA[...]]> 패턴과 일반 텍스트 모두 처리
 */
function extractTagContent(xml: string, tagName: string): string {
  // Try self-closing variants and namespaced tags too
  const patterns = [
    // Standard tag with CDATA
    new RegExp(`<${tagName}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tagName}>`, 'i'),
    // Standard tag with content
    new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = xml.match(pattern);
    if (match?.[1]) {
      return decodeHTMLEntities(match[1].trim());
    }
  }

  return '';
}

/**
 * HTML 엔티티 디코딩
 */
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * HTML 태그 제거 (description 정리용)
 */
function stripHTML(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * RSS XML에서 모든 <item> 블록 추출
 */
function extractItems(xml: string): string[] {
  const items: string[] = [];
  let searchFrom = 0;

  while (true) {
    const startIdx = xml.indexOf('<item', searchFrom);
    if (startIdx === -1) break;

    const endIdx = xml.indexOf('</item>', startIdx);
    if (endIdx === -1) break;

    items.push(xml.substring(startIdx, endIdx + '</item>'.length));
    searchFrom = endIdx + '</item>'.length;
  }

  return items;
}

/**
 * pubDate 문자열을 ISO 형식으로 정규화
 */
function normalizePubDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {
    // Fall through
  }

  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Feed Fetching
// ---------------------------------------------------------------------------

/**
 * 단일 RSS 피드를 가져와 파싱
 * - 10초 타임아웃
 * - 실패 시 빈 배열 반환 (다른 피드에 영향 없음)
 */
async function fetchSingleFeed(source: RSSFeedSource): Promise<RealNewsArticle[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GukjeongTumyeong/1.0 RSS Reader',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 300 }, // 5분 캐시 (Next.js)
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[RSS] ${source.name} responded with ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const items = extractItems(xml);

    return items.map((itemXml) => {
      const title = extractTagContent(itemXml, 'title');
      const link = extractTagContent(itemXml, 'link');
      const pubDate = extractTagContent(itemXml, 'pubDate');
      const rawDesc = extractTagContent(itemXml, 'description');
      const description = stripHTML(rawDesc).slice(0, 300); // 최대 300자

      return {
        outlet_id: source.id,
        outlet_name: source.name,
        title,
        link,
        pubDate: normalizePubDate(pubDate),
        description: description || undefined,
        spectrum_score: source.spectrum,
        category: source.category,
      };
    }).filter((article) => article.title && article.link); // 제목/링크 없는 항목 제거

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[RSS] ${source.name} fetch failed: ${errMsg}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 모든 RSS 피드를 병렬로 가져와 최신순 정렬
 */
export async function fetchAllRSSFeeds(): Promise<RealNewsArticle[]> {
  const results = await Promise.allSettled(
    WORKING_FEEDS.map((source) => fetchSingleFeed(source)),
  );

  const articles: RealNewsArticle[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  }

  // 정치/경제/정부 관련 기사만 필터링
  const RELEVANT_KEYWORDS = [
    '국회', '의원', '법안', '예산', '재정', '세금', '세수', '감사', '비리', '부정', '횡령',
    '수의계약', '입찰', '담합', '대통령', '정부', '장관', '부처', '청와대', '용산',
    '더불어민주당', '민주당', '국민의힘', '조국혁신당', '진보당',
    '검찰', '경찰', '수사', '기소', '재판', '판결', '탄핵', '계엄',
    '지자체', '시장', '도지사', '군수', '구청장',
    '경제', 'GDP', '물가', '고용', '실업', '부동산', '금리', '환율', '국채', '주가',
    '복지', '연금', '보험', '교육', '국방', '외교', '통일', '북한', '남북',
    '개혁', '규제', '공정', '부패', '투명', '청문회', '국정감사', '인사', '임명',
    '조달', '나라장터', '계약', '공사', '용역',
  ];

  const filtered = articles.filter(a =>
    RELEVANT_KEYWORDS.some(kw => a.title.includes(kw) || (a.description || '').includes(kw))
  );

  // 최신순 정렬
  filtered.sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime();
    const dateB = new Date(b.pubDate).getTime();
    return dateB - dateA;
  });

  return filtered;
}

/**
 * 특정 언론사의 RSS 피드만 가져오기
 */
export async function fetchFeedByOutlet(outletId: string): Promise<RealNewsArticle[]> {
  const source = WORKING_FEEDS.find((f) => f.id === outletId);
  if (!source) {
    console.warn(`[RSS] Unknown outlet: ${outletId}`);
    return [];
  }

  return fetchSingleFeed(source);
}

/**
 * 피드 소스 목록 반환 (UI에서 필터 구성용)
 */
export function getFeedSources(): RSSFeedSource[] {
  return WORKING_FEEDS;
}
