// 국정투명 -- 뉴스 RSS 스크래퍼
//
// Scrapes RSS feeds from Korean media outlets defined in seed data.
// After fetching, clusters articles by topic similarity and
// prepares frame analysis data (Claude API call placeholder).

import type { ScrapeResult } from './types';
import { fetchWithRetry, logSyncResult, parseXmlRows } from './types';

// ── Media outlets with RSS URLs ────────────────────────────────────
// Matches the MEDIA_OUTLETS_DATA in lib/data.ts
const RSS_SOURCES: {
  id: string;
  name: string;
  rss_url: string;
  spectrum_score: number;
  category: string;
}[] = [
  { id: 'chosun', name: '조선일보', rss_url: 'https://www.chosun.com/arc/outboundfeeds/rss/', spectrum_score: 4.5, category: 'conservative' },
  { id: 'joongang', name: '중앙일보', rss_url: 'https://rss.joins.com/joins_news_list.xml', spectrum_score: 3.8, category: 'conservative' },
  { id: 'donga', name: '동아일보', rss_url: 'https://rss.donga.com/total.xml', spectrum_score: 4.0, category: 'conservative' },
  { id: 'hankyoreh', name: '한겨레', rss_url: 'https://www.hani.co.kr/rss/', spectrum_score: 1.2, category: 'progressive' },
  { id: 'khan', name: '경향신문', rss_url: 'https://www.khan.co.kr/rss/rssdata/total_news.xml', spectrum_score: 1.5, category: 'progressive' },
  { id: 'yonhap', name: '연합뉴스', rss_url: 'https://www.yonhapnewstv.co.kr/browse/feed/', spectrum_score: 2.5, category: 'center' },
  { id: 'kbs', name: 'KBS', rss_url: 'https://news.kbs.co.kr/api/rss/rss.html', spectrum_score: 2.5, category: 'center' },
  { id: 'mbc', name: 'MBC', rss_url: 'https://imnews.imbc.com/rss/', spectrum_score: 2.0, category: 'progressive' },
  { id: 'sbs', name: 'SBS', rss_url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?recSectionId=01', spectrum_score: 2.8, category: 'center' },
  { id: 'jtbc', name: 'JTBC', rss_url: 'https://fs.jtbc.co.kr/RSS/newsflash.xml', spectrum_score: 2.2, category: 'progressive' },
  { id: 'ytn', name: 'YTN', rss_url: 'https://www.ytn.co.kr/rss/', spectrum_score: 2.5, category: 'center' },
];

// ── RSS parser (lightweight, no external dependency) ───────────────
interface RssArticle {
  outlet_id: string;
  outlet_name: string;
  spectrum_score: number;
  category: string;
  title: string;
  link: string;
  description: string;
  pub_date: string;
  pub_timestamp: number;
}

function parseRssFeed(xml: string, outlet: typeof RSS_SOURCES[number]): RssArticle[] {
  const articles: RssArticle[] = [];

  // Try parsing <item> tags (RSS 2.0) or <entry> tags (Atom)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;

  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    matches.push(match[1]);
  }
  if (matches.length === 0) {
    while ((match = entryRegex.exec(xml)) !== null) {
      matches.push(match[1]);
    }
  }

  for (const content of matches) {
    const title = extractTag(content, 'title');
    const link = extractTag(content, 'link') || extractAtomLink(content);
    const description = extractTag(content, 'description') || extractTag(content, 'summary') || '';
    const pubDate = extractTag(content, 'pubDate') || extractTag(content, 'published') || extractTag(content, 'updated') || '';

    if (title) {
      articles.push({
        outlet_id: outlet.id,
        outlet_name: outlet.name,
        spectrum_score: outlet.spectrum_score,
        category: outlet.category,
        title: stripHtml(title),
        link: link || '',
        description: stripHtml(description).substring(0, 500),
        pub_date: pubDate,
        pub_timestamp: pubDate ? new Date(pubDate).getTime() : 0,
      });
    }
  }

  return articles;
}

function extractTag(content: string, tag: string): string {
  // Handle CDATA: <tag><![CDATA[value]]></tag>
  const cdataRegex = new RegExp('<' + tag + '[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</' + tag + '>', 'i');
  const cdataMatch = cdataRegex.exec(content);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular: <tag>value</tag>
  const regex = new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i');
  const match = regex.exec(content);
  return match ? match[1].trim() : '';
}

function extractAtomLink(content: string): string {
  const match = /<link[^>]*href="([^"]*)"[^>]*>/i.exec(content);
  return match ? match[1] : '';
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Topic clustering (simple keyword-based) ────────────────────────
interface TopicCluster {
  topic: string;
  keywords: string[];
  articles: RssArticle[];
  progressive_count: number;
  conservative_count: number;
  center_count: number;
}

/**
 * Simple keyword-based topic clustering.
 * In production this would use embeddings or Claude for better clustering.
 */
function clusterByTopic(articles: RssArticle[]): TopicCluster[] {
  // Korean political topic keywords
  const topicKeywords: Record<string, string[]> = {
    '경제': ['경제', 'GDP', '성장률', '물가', '인플레', '금리', '환율', '주가', '코스피', '부동산', '집값'],
    '정치': ['대통령', '국회', '여당', '야당', '의원', '정당', '탄핵', '선거', '투표', '정치'],
    '외교안보': ['외교', '안보', '북한', '미국', '중국', '일본', '군사', '미사일', '핵', '방위'],
    '사회': ['사회', '복지', '교육', '의료', '건강', '범죄', '안전', '사고', '재해', '환경'],
    '기술': ['AI', '인공지능', '반도체', '기술', '디지털', '스타트업', '이노베이션', 'IT'],
    '노동': ['노동', '고용', '실업', '임금', '근로', '파업', '노조', '최저임금', '일자리'],
    '국방': ['국방', '군', '병사', '병역', '방산', '무기', '전투기', '해군', '육군', '공군'],
  };

  const clusters: Map<string, TopicCluster> = new Map();

  for (const article of articles) {
    const titleAndDesc = article.title + ' ' + article.description;
    let assigned = false;

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const matchCount = keywords.filter(kw => titleAndDesc.includes(kw)).length;

      if (matchCount >= 1) {
        if (!clusters.has(topic)) {
          clusters.set(topic, {
            topic,
            keywords,
            articles: [],
            progressive_count: 0,
            conservative_count: 0,
            center_count: 0,
          });
        }

        const cluster = clusters.get(topic)!;
        cluster.articles.push(article);

        if (article.category === 'progressive') cluster.progressive_count++;
        else if (article.category === 'conservative') cluster.conservative_count++;
        else cluster.center_count++;

        assigned = true;
        break; // assign to first matching topic
      }
    }

    if (!assigned) {
      if (!clusters.has('기타')) {
        clusters.set('기타', {
          topic: '기타',
          keywords: [],
          articles: [],
          progressive_count: 0,
          conservative_count: 0,
          center_count: 0,
        });
      }
      const cluster = clusters.get('기타')!;
      cluster.articles.push(article);
      if (article.category === 'progressive') cluster.progressive_count++;
      else if (article.category === 'conservative') cluster.conservative_count++;
      else cluster.center_count++;
    }
  }

  // Return only clusters with 2+ articles, sorted by article count
  return Array.from(clusters.values())
    .filter(c => c.articles.length >= 2)
    .sort((a, b) => b.articles.length - a.articles.length);
}

// ── Frame analysis placeholder ─────────────────────────────────────
/**
 * Placeholder for Claude API frame analysis.
 * When ANTHROPIC_API_KEY is set, this would call Claude to analyze
 * how different outlets frame the same topic.
 */
async function analyzeFrames(cluster: TopicCluster): Promise<{
  progressive_frame: string;
  conservative_frame: string;
  citizen_takeaway: string;
} | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  // TODO: Call Claude API for real frame analysis
  // Example prompt structure:
  // "다음 뉴스 기사들의 프레이밍을 분석해주세요.
  //  진보 매체 기사: [titles]
  //  보수 매체 기사: [titles]
  //  각 진영의 프레이밍과 시민이 알아야 할 핵심을 정리해주세요."

  console.log(`[news] Frame analysis placeholder for topic: ${cluster.topic} (${cluster.articles.length} articles)`);

  return null;
}

// ── DB write (guarded) ─────────────────────────────────────────────
async function upsertArticles(articles: RssArticle[]): Promise<number> {
  if (!process.env.DATABASE_URL) {
    console.log(`[news] DATABASE_URL not set -- skipping DB upsert for ${articles.length} articles`);
    return 0;
  }

  // TODO: Replace with actual DB client
  // Upsert into news_articles table, dedup by (outlet_id, link)
  console.log(`[news] Would upsert ${articles.length} articles into DB`);
  return articles.length;
}

async function upsertTopicClusters(clusters: TopicCluster[]): Promise<number> {
  if (!process.env.DATABASE_URL) {
    console.log(`[news] DATABASE_URL not set -- skipping DB upsert for ${clusters.length} topic clusters`);
    return 0;
  }

  // TODO: Replace with actual DB client
  // Upsert into news_events table with frame analysis results
  console.log(`[news] Would upsert ${clusters.length} topic clusters into DB`);
  return clusters.length;
}

// ── Main export ────────────────────────────────────────────────────
export async function scrapeNews(): Promise<ScrapeResult> {
  const startedAt = new Date().toISOString();
  const start = Date.now();

  try {
    // Fetch RSS from all sources in parallel (with concurrency limit)
    const allArticles: RssArticle[] = [];
    const errors: string[] = [];

    // Process in batches of 4 to avoid overwhelming servers
    const batchSize = 4;
    for (let i = 0; i < RSS_SOURCES.length; i += batchSize) {
      const batch = RSS_SOURCES.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (outlet) => {
          try {
            const response = await fetchWithRetry(outlet.rss_url, {
              headers: {
                'User-Agent': 'GukjeongTumyeong/1.0 (transparency monitor)',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
              },
            });
            const xml = await response.text();
            const articles = parseRssFeed(xml, outlet);
            console.log(`[news] ${outlet.name}: ${articles.length} articles`);
            return articles;
          } catch (err) {
            const msg = `${outlet.name}: ${err instanceof Error ? err.message : err}`;
            console.warn(`[news] Failed ${msg}`);
            errors.push(msg);
            return [];
          }
        }),
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allArticles.push(...result.value);
        }
      }
    }

    console.log(`[news] Total articles fetched: ${allArticles.length} from ${RSS_SOURCES.length} sources (${errors.length} errors)`);

    // Filter to last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentArticles = allArticles.filter(a => {
      if (!a.pub_timestamp || a.pub_timestamp <= 0) return true; // include if no date
      return a.pub_timestamp >= oneDayAgo;
    });

    console.log(`[news] Recent articles (last 24h): ${recentArticles.length}`);

    // Cluster articles by topic
    const clusters = clusterByTopic(recentArticles);
    console.log(`[news] Topic clusters: ${clusters.length}`);

    // Run frame analysis on top clusters
    for (const cluster of clusters.slice(0, 5)) {
      const frames = await analyzeFrames(cluster);
      if (frames) {
        console.log(`[news] Frame analysis for ${cluster.topic}: done`);
      }
    }

    // DB writes (no-op without DATABASE_URL)
    const articlesUpdated = await upsertArticles(recentArticles);
    const clustersUpdated = await upsertTopicClusters(clusters);
    const totalUpdated = articlesUpdated + clustersUpdated;

    const result: ScrapeResult = {
      status: 'success',
      records_fetched: allArticles.length,
      records_updated: totalUpdated,
      duration_ms: Date.now() - start,
    };

    logSyncResult({
      source: 'news',
      status: 'success',
      records_fetched: allArticles.length,
      records_updated: totalUpdated,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      duration_ms: result.duration_ms!,
    });

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - start;

    logSyncResult({
      source: 'news',
      status: 'error',
      records_fetched: 0,
      records_updated: 0,
      error_message: errorMessage,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      duration_ms: duration,
    });

    return {
      status: 'error',
      error: errorMessage,
      records_fetched: 0,
      records_updated: 0,
      duration_ms: duration,
    };
  }
}
