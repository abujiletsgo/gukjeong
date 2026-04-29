#!/usr/bin/env python3
"""
국정투명 뉴스 토픽 클러스터링 — news-rss.json을 읽어 토픽별로 묶고
Claude API로 각 토픽을 분석합니다.

출력: apps/web/public/data/news-topics.json
"""
import hashlib
import json
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import anthropic

DATA_DIR = Path(__file__).parent.parent / 'apps' / 'web' / 'data'
OUT_DIR = Path(__file__).parent.parent / 'apps' / 'web' / 'public' / 'data'
OUT_DIR.mkdir(parents=True, exist_ok=True)

STOPWORDS = {
    '기자', '뉴스', '보도', '연합', '속보', '단독', '오전', '오후',
    '오늘', '내일', '어제', '이날', '지난', '관련', '관계', '지적',
    '강조', '주장', '밝혔', '전했', '말했', '했다', '했습', '있다',
    '있습', '이라고', '이라며',
}

CLAUDE_MODEL = os.environ.get('CLAUDE_MODEL', 'claude-haiku-4-5-20251001')


def topic_id(title: str) -> str:
    return 'topic-' + hashlib.sha1(title.encode()).hexdigest()[:12]


def extract_korean_tokens(text: str) -> set:
    """Extract Korean tokens (2+ chars, U+AC00–U+D7A3) from text, strip stopwords."""
    tokens = re.findall(r'[가-힣]{2,}', text)
    return {t for t in tokens if t not in STOPWORDS}


def spectrum_category(score: float) -> str:
    """Map spectrum_score to bucket string."""
    if score < 2.5:
        return 'progressive'
    elif score <= 3.5:
        return 'center'
    else:
        return 'conservative'


def cluster_articles(items: list) -> list:
    """Greedy keyword overlap clustering (mirrors clusterRSSArticles in NewsPageClient.tsx).

    Returns list of clusters, each a list of article dicts.
    """
    clusters = []   # list of (set_of_tokens, list_of_articles)

    for article in items:
        tokens = extract_korean_tokens(article.get('title', ''))
        merged = False
        for cluster_tokens, cluster_articles_list in clusters:
            if len(tokens & cluster_tokens) >= 2:
                cluster_articles_list.append(article)
                cluster_tokens.update(tokens)
                merged = True
                break
        if not merged:
            clusters.append((tokens, [article]))

    # Discard clusters with <2 articles
    clusters = [(t, a) for t, a in clusters if len(a) >= 2]

    # Extract just article lists, determine has_multiple_perspectives
    result = []
    for _, articles in clusters:
        cats = {spectrum_category(a.get('spectrum_score', 3.0)) for a in articles}
        has_multiple = 'progressive' in cats and 'conservative' in cats
        result.append({
            'articles': articles,
            'has_multiple_perspectives': has_multiple,
        })

    # Sort: has_multiple_perspectives first, then article_count desc
    result.sort(key=lambda c: (0 if c['has_multiple_perspectives'] else 1, -len(c['articles'])))

    # Cap at 15
    return result[:15]


def build_cluster_title(articles: list) -> str:
    """Use the title of the article with the most tokens as the cluster title."""
    best = max(articles, key=lambda a: len(extract_korean_tokens(a.get('title', ''))))
    return best.get('title', '').strip()


def call_claude(cluster_title: str, articles: list) -> dict:
    """Call Claude API once for a cluster. Returns AI fields dict or raises."""
    client = anthropic.Anthropic()

    progressive = [a for a in articles if spectrum_category(a.get('spectrum_score', 3.0)) == 'progressive']
    moderate = [a for a in articles if spectrum_category(a.get('spectrum_score', 3.0)) == 'center']
    conservative = [a for a in articles if spectrum_category(a.get('spectrum_score', 3.0)) == 'conservative']

    def fmt_articles(art_list: list, label: str) -> str:
        if not art_list:
            return f'[{label}] 보도 없음'
        lines = [f'[{label}]']
        for a in art_list:
            outlet = a.get('outlet_name', '')
            title = a.get('title', '')
            desc = a.get('description', '')
            lines.append(f'- {outlet}: {title}')
            if desc:
                lines.append(f'  {desc[:100]}')
        return '\n'.join(lines)

    user_prompt = f"""다음 뉴스 토픽에 대해 분석해주세요.

토픽 제목: {cluster_title}

{fmt_articles(progressive, '진보 언론')}

{fmt_articles(moderate, '중도 언론')}

{fmt_articles(conservative, '보수 언론')}

아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{{
  "ai_summary": "2-3문장 핵심 요약 (100자 이내)",
  "key_facts": ["사실1", "사실2", "사실3"],
  "progressive_frame": {{"emphasis": "진보 시각 설명 (50자)", "headline": "진보 매체 대표 헤드라인", "tone": "긍정적|비판적|우려|중립 중 하나"}},
  "moderate_frame": {{"emphasis": "중도 시각 설명 (50자)", "headline": "중도 매체 대표 헤드라인", "tone": "긍정적|비판적|우려|중립 중 하나"}},
  "conservative_frame": {{"emphasis": "보수 시각 설명 (50자)", "headline": "보수 매체 대표 헤드라인", "tone": "긍정적|비판적|우려|중립 중 하나"}},
  "citizen_takeaway": "시민이 알아야 할 핵심 (80자 이내)",
  "category": "경제|정치|사회|과학기술|복지|외교|환경|기타 중 가장 적합한 하나"
}}"""

    system_prompt = (
        '당신은 한국 정치·사회 뉴스를 분석하는 전문 저널리스트입니다.\n'
        '주어진 기사들을 바탕으로 각 정치 스펙트럼의 시각을 정확하고 공정하게 요약하세요.\n'
        '사실은 사실로, 주장은 주장으로 구분하세요.\n'
        '시민이 이해하기 쉬운 한국어로 작성하세요.'
    )

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=[{'role': 'user', 'content': user_prompt}],
    )

    raw = response.content[0].text.strip()
    # Strip markdown code fences if present
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    return json.loads(raw)


def null_frame() -> dict:
    return {'emphasis': None, 'headline': None, 'tone': None}


def null_ai_fields() -> dict:
    return {
        'ai_summary': None,
        'key_facts': None,
        'fact_check': None,
        'citizen_takeaway': None,
        'progressive_frame': null_frame(),
        'moderate_frame': null_frame(),
        'conservative_frame': null_frame(),
        'category': None,
    }


def analyze_cluster(cluster_title: str, articles: list) -> dict:
    """Call Claude with one retry. Return AI fields (null on 2nd failure)."""
    for attempt in range(2):
        try:
            result = call_claude(cluster_title, articles)
            ai_summary = result.get('ai_summary', None)
            return {
                'ai_summary': ai_summary,
                'key_facts': result.get('key_facts', None),
                'fact_check': ai_summary,
                'citizen_takeaway': result.get('citizen_takeaway', None),
                'progressive_frame': result.get('progressive_frame', null_frame()),
                'moderate_frame': result.get('moderate_frame', null_frame()),
                'conservative_frame': result.get('conservative_frame', null_frame()),
                'category': result.get('category', None),
            }
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            print(f'  [parse error attempt {attempt+1}] {cluster_title[:40]}: {e}')
            if attempt == 0:
                time.sleep(1)
        except Exception as e:
            print(f'  [api error attempt {attempt+1}] {cluster_title[:40]}: {e}')
            if attempt == 0:
                time.sleep(2)

    print(f'  [giving up] {cluster_title[:40]} — AI fields set to null')
    return null_ai_fields()


def process_cluster(cluster: dict, idx: int) -> dict:
    """Build a NewsTopic dict from a cluster."""
    articles = cluster['articles']
    has_multiple = cluster['has_multiple_perspectives']

    title = build_cluster_title(articles)

    # Determine event_date from most recent pubDate
    pub_dates = [a.get('pubDate', '') for a in articles if a.get('pubDate')]
    event_date = pub_dates[0][:10] if pub_dates else datetime.now(timezone.utc).date().isoformat()

    # category will be set by Claude; placeholder until AI fields are merged
    category = 'general'

    outlet_ids = {a.get('outlet_id', '') for a in articles}

    # Build articles list with correct category bucket
    topic_articles = []
    for a in articles:
        score = a.get('spectrum_score', 3.0)
        bucket = spectrum_category(score)
        topic_articles.append({
            'outlet_id': a.get('outlet_id', ''),
            'outlet_name': a.get('outlet_name', ''),
            'title': a.get('title', ''),
            'link': a.get('link'),
            'pubDate': a.get('pubDate'),
            'description': a.get('description'),
            'spectrum_score': score,
            'category': bucket,
        })

    print(f'  Analyzing cluster {idx+1}: {title[:50]}')
    ai_fields = analyze_cluster(title, articles)

    return {
        'id': topic_id(title),
        'title': title,
        'event_date': event_date,
        'category': ai_fields.get('category') or category,
        'article_count': len(articles),
        'outlet_count': len(outlet_ids),
        'has_multiple_perspectives': has_multiple,
        'ai_summary': ai_fields['ai_summary'],
        'key_facts': ai_fields['key_facts'],
        'fact_check': ai_fields['fact_check'],
        'citizen_takeaway': ai_fields['citizen_takeaway'],
        'progressive_frame': ai_fields['progressive_frame'],
        'conservative_frame': ai_fields['conservative_frame'],
        'moderate_frame': ai_fields['moderate_frame'],
        'articles': topic_articles,
    }


ARCHIVE_PATH = DATA_DIR / 'news-archive.json'


def load_archive() -> dict:
    """Load the historical topic archive, or return empty structure."""
    try:
        with open(ARCHIVE_PATH, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {'topics': [], 'updated_at': ''}


def save_archive(archive: dict) -> None:
    archive['updated_at'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    with open(ARCHIVE_PATH, 'w', encoding='utf-8') as f:
        json.dump(archive, f, ensure_ascii=False, indent=2)


def merge_into_archive(archive: dict, new_topics: list) -> list:
    """Merge new topics into archive. Returns the updated topic list.

    Rules:
    - Existing topic (same id): update article list, keep AI fields if already set.
    - New topic: add to front of archive.
    - Archive capped at 200 topics (oldest removed).
    """
    by_id = {t['id']: t for t in archive.get('topics', [])}

    for nt in new_topics:
        tid = nt['id']
        if tid in by_id:
            existing = by_id[tid]
            # Merge articles (deduplicate by link)
            seen_links = {a.get('link') for a in existing['articles']}
            for a in nt['articles']:
                if a.get('link') not in seen_links:
                    existing['articles'].append(a)
                    seen_links.add(a.get('link'))
            existing['article_count'] = len(existing['articles'])
            # Only overwrite AI fields if new topic has them and existing doesn't
            if nt.get('ai_summary') and not existing.get('ai_summary'):
                for field in ('ai_summary', 'key_facts', 'fact_check', 'citizen_takeaway',
                              'progressive_frame', 'moderate_frame', 'conservative_frame', 'category'):
                    existing[field] = nt.get(field, existing.get(field))
        else:
            by_id[tid] = nt

    # Re-sort: newest event_date first, then has_multiple_perspectives
    merged = sorted(by_id.values(),
                    key=lambda t: (t.get('event_date', ''), t['has_multiple_perspectives']),
                    reverse=True)
    return merged[:200]


def build_topic_from_cluster(cluster: dict, idx: int) -> dict:
    """Build a NewsTopic dict without AI analysis (for archive/fallback)."""
    articles = cluster['articles']
    title = build_cluster_title(articles)
    pub_dates = [a.get('pubDate', '') for a in articles if a.get('pubDate')]
    event_date = pub_dates[0][:10] if pub_dates else datetime.now(timezone.utc).date().isoformat()
    outlet_ids = {a.get('outlet_id', '') for a in articles}
    topic_articles = []
    for a in articles:
        score = a.get('spectrum_score', 3.0)
        topic_articles.append({
            'outlet_id': a.get('outlet_id', ''),
            'outlet_name': a.get('outlet_name', ''),
            'title': a.get('title', ''),
            'link': a.get('link'),
            'pubDate': a.get('pubDate'),
            'description': a.get('description'),
            'spectrum_score': score,
            'category': spectrum_category(score),
        })
    return {
        'id': topic_id(title),
        'title': title,
        'event_date': event_date,
        'category': 'general',
        'article_count': len(articles),
        'outlet_count': len(outlet_ids),
        'has_multiple_perspectives': cluster['has_multiple_perspectives'],
        **null_ai_fields(),
        'articles': topic_articles,
    }


def main():
    print('뉴스 토픽 생성기 시작')

    # Load input
    input_path = DATA_DIR / 'news-rss.json'
    with open(input_path, encoding='utf-8') as f:
        rss_data = json.load(f)

    items = rss_data.get('items', [])
    source_fetched_at = rss_data.get('fetched_at', '')
    print(f'  입력: {len(items)}개 기사 (fetched_at={source_fetched_at})')

    # Cluster
    clusters = cluster_articles(items)
    print(f'  클러스터: {len(clusters)}개 (2개 이상, 최대 15개)')

    # Analyze clusters in parallel (AI enrichment)
    topics = [None] * len(clusters)
    with ThreadPoolExecutor(max_workers=5) as pool:
        futs = {
            pool.submit(process_cluster, cluster, idx): idx
            for idx, cluster in enumerate(clusters)
        }
        for fut in as_completed(futs):
            idx = futs[fut]
            try:
                topics[idx] = fut.result()
            except Exception as e:
                print(f'  [fatal cluster error idx={idx}] {e}')
                topics[idx] = build_topic_from_cluster(clusters[idx], idx)

    topics = [t for t in topics if t is not None]
    topics.sort(key=lambda t: (0 if t['has_multiple_perspectives'] else 1, -t['article_count']))

    # ── Accumulate into archive ──
    archive = load_archive()
    merged = merge_into_archive(archive, topics)
    archive['topics'] = merged
    save_archive(archive)
    print(f'  아카이브: {len(merged)}개 토픽 누적 → {ARCHIVE_PATH}')

    # ── Write recent topics to public/data (top 20 for the web) ──
    recent = merged[:20]
    output = {
        'generated_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'source_file': 'news-rss.json',
        'source_fetched_at': source_fetched_at,
        'total_topics': len(recent),
        'topics': recent,
    }

    out_path = OUT_DIR / 'news-topics.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f'완료: 최신 {len(recent)}개 토픽 → {out_path}')


if __name__ == '__main__':
    main()
