import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getLocalNewsTopics } from '@/lib/local-data';
import type { NewsTopic, NewsTopicFrame } from '@/lib/types';

export const dynamic = 'force-dynamic';

// ── In-memory cache (1-hour TTL per serverless function lifetime) ──
let cache: { enriched: NewsTopic[]; ts: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

function nullFrame(): NewsTopicFrame {
  return { emphasis: null, headline: null, tone: null };
}

function spectrumBucket(score: number): 'progressive' | 'center' | 'conservative' {
  if (score < 2.5) return 'progressive';
  if (score <= 3.5) return 'center';
  return 'conservative';
}

async function enrichTopic(
  topic: NewsTopic,
  client: Anthropic,
): Promise<NewsTopic> {
  const progressive = topic.articles.filter(a => spectrumBucket(a.spectrum_score) === 'progressive');
  const moderate   = topic.articles.filter(a => spectrumBucket(a.spectrum_score) === 'center');
  const conservative = topic.articles.filter(a => spectrumBucket(a.spectrum_score) === 'conservative');

  const fmt = (arts: typeof topic.articles, label: string) => {
    if (!arts.length) return `[${label}] 보도 없음`;
    return [`[${label}]`, ...arts.map(a => `- ${a.outlet_name}: ${a.title}${a.description ? '\n  ' + a.description.slice(0, 120) : ''}`)].join('\n');
  };

  const userPrompt = `다음 뉴스 토픽에 대해 분석해주세요.

토픽 제목: ${topic.title}

${fmt(progressive, '진보 언론')}

${fmt(moderate, '중도 언론')}

${fmt(conservative, '보수 언론')}

아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "ai_summary": "2-3문장 핵심 요약 (100자 이내)",
  "key_facts": ["사실1", "사실2", "사실3"],
  "progressive_frame": {"emphasis": "진보 시각 설명 (50자)", "headline": "진보 매체 대표 헤드라인", "tone": "긍정적|비판적|우려|중립 중 하나"},
  "moderate_frame": {"emphasis": "중도 시각 설명 (50자)", "headline": "중도 매체 대표 헤드라인", "tone": "긍정적|비판적|우려|중립 중 하나"},
  "conservative_frame": {"emphasis": "보수 시각 설명 (50자)", "headline": "보수 매체 대표 헤드라인", "tone": "긍정적|비판적|우려|중립 중 하나"},
  "citizen_takeaway": "시민이 알아야 할 핵심 (80자 이내)",
  "category": "경제|정치|사회|과학기술|복지|외교|환경|기타 중 가장 적합한 하나"
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: '당신은 한국 정치·사회 뉴스를 분석하는 전문 저널리스트입니다. 주어진 기사들을 바탕으로 각 정치 스펙트럼의 시각을 정확하고 공정하게 요약하세요. 사실은 사실로, 주장은 주장으로 구분하세요. 시민이 이해하기 쉬운 한국어로 작성하세요.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    let raw = (response.content[0] as { text: string }).text.trim();
    raw = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '');
    const result = JSON.parse(raw);

    return {
      ...topic,
      category: result.category || topic.category,
      ai_summary: result.ai_summary ?? null,
      key_facts: result.key_facts ?? null,
      fact_check: result.ai_summary ?? null,
      citizen_takeaway: result.citizen_takeaway ?? null,
      progressive_frame: result.progressive_frame ?? nullFrame(),
      moderate_frame: result.moderate_frame ?? nullFrame(),
      conservative_frame: result.conservative_frame ?? nullFrame(),
    };
  } catch {
    return topic;
  }
}

export async function GET() {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    const base = getLocalNewsTopics();
    return NextResponse.json({
      ...base,
      total_topics: cache.enriched.length,
      topics: cache.enriched,
    });
  }

  const base = getLocalNewsTopics();
  const topics = base.topics;

  if (!topics.length) {
    return NextResponse.json(base);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_key_here') {
    return NextResponse.json(base);
  }

  try {
    const client = new Anthropic({ apiKey });

    // Enrich topics that are missing AI analysis, max 5 concurrent
    const needsEnrichment = topics.filter(t => !t.ai_summary);
    const alreadyDone = topics.filter(t => t.ai_summary);

    const CONCURRENCY = 5;
    const enriched: NewsTopic[] = [...alreadyDone];

    for (let i = 0; i < needsEnrichment.length; i += CONCURRENCY) {
      const batch = needsEnrichment.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(t => enrichTopic(t, client)));
      enriched.push(...results);
    }

    // Re-sort: has_multiple_perspectives first, then article_count desc
    enriched.sort((a, b) =>
      (b.has_multiple_perspectives ? 1 : 0) - (a.has_multiple_perspectives ? 1 : 0) ||
      b.article_count - a.article_count,
    );

    cache = { enriched, ts: Date.now() };

    return NextResponse.json({
      ...base,
      total_topics: enriched.length,
      topics: enriched,
    });
  } catch {
    return NextResponse.json(base);
  }
}
