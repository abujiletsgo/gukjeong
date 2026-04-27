#!/usr/bin/env python3
"""
AI 감사 강화 스크립트 — Claude API를 사용하여 감사 결과를 보강합니다.

사용법:
  uv run scripts/enrich-audit.py             # 기본: score >= 65 상위 200건
  uv run scripts/enrich-audit.py --min-score 75 --max-findings 100
  uv run scripts/enrich-audit.py --anomaly-only   # AI 이상탐지 패턴만 실행
  uv run scripts/enrich-audit.py --news-only      # 뉴스 연관성만 업데이트

Claude가 하는 일:
  1. 각 고위험 감사 발견에 대해 실제 AI 분석 생성 (템플릿 X)
     - ai_headline: 기자가 쓸 수 있는 한 줄 헤드라인
     - ai_narrative: 2-3단락 조사 브리핑 (시민 눈높이)
     - ai_questions: 감사관/기자가 물어야 할 질문 3-5개
     - ai_comparable: 유사 한국 비리 사례 참조
  2. 뉴스 연관 분석 (news-rss.json 기사 매핑)
  3. AI 이상탐지: 고위험 기관의 계약 데이터에서 규칙이 못 잡는 패턴 탐지
"""

import anthropic
import json
import os
import ssl
import sys
import time
import xml.etree.ElementTree as ET
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from email.utils import parsedate_to_datetime
from pathlib import Path
from datetime import datetime, timezone

_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE

# ── Paths ──
ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / 'apps' / 'web' / 'data'
AUDIT_PATH = ROOT / 'apps' / 'web' / 'public' / 'data' / 'audit-results.json'

# ── Config ──
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
MODEL_STRONG = 'claude-sonnet-4-6'         # Sonnet for CRITICAL/HIGH findings
MODEL_FAST = 'claude-haiku-4-5-20251001'   # Haiku for MEDIUM/LOW (fast + cheap)
MAX_WORKERS = 5                             # parallel API calls
MIN_SCORE_DEFAULT = 65
MAX_FINDINGS_DEFAULT = 250

# Prompt caching: shared system prompt injected once per batch via cache_control
SYSTEM_PROMPT = """당신은 대한민국 정부 조달 전문 감사관입니다.
국가계약법, 지방계약법, 공정거래법, 부정청탁금지법에 정통하며 감사원 실무 경력 15년 이상의 전문가입니다.
아래 감사 발견 사항을 분석할 때는 다음 원칙을 따르세요:
1. 무죄 추정 원칙: 구조적으로 설명 가능한 패턴(혁신제품, 연구기관 위탁, 방위사업, 재해복구)은 낮게 평가
2. 증거 중심 분석: 데이터에 나타난 수치와 패턴에 근거하여 판단
3. 시민 가독성: 전문 용어를 쉬운 말로 설명
4. 실무 지향: 감사관이나 기자가 실제로 취할 수 있는 조사 방향 제시"""

PATTERN_LABELS_KR = {
    'ghost_company': '유령회사 의심',
    'zero_competition': '경쟁 부재',
    'bid_rate_anomaly': '낙찰률 이상',
    'new_company_big_win': '신설업체 대형 수주',
    'vendor_concentration': '업체 집중',
    'repeated_sole_source': '반복 수의계약',
    'contract_splitting': '계약 분할',
    'low_bid_competition': '과소 경쟁',
    'yearend_new_vendor': '연말 신규업체 수의계약',
    'related_companies': '동일 대표/주소 업체',
    'high_value_sole_source': '고액 수의계약',
    'same_winner_repeat': '동일업체 반복 수주',
    'amount_spike': '계약액 급증',
    'bid_rigging': '담합',
    'contract_inflation': '계약 금액 부풀리기',
    'cross_pattern': '복합 패턴',
    'systemic_risk': '체계적 비리 위험',
    'sanctioned_vendor': '제재 업체 재수주',
    'price_clustering': '가격 담합',
    'network_collusion': '네트워크 담합',
    'vendor_rotation': '업체 순번제',
    'threshold_avoidance': '입찰기준 직하 반복',
    'insider_bid_precision': '낙찰률 정밀도 이상',
    'ai_anomaly': 'AI 이상탐지',
}


def load_audit() -> dict:
    data = json.loads(AUDIT_PATH.read_text(encoding='utf-8'))
    if isinstance(data, list):
        return {'findings': data, 'metadata': {}}
    return data


def save_audit(data: dict):
    if 'metadata' not in data:
        data['metadata'] = {}
    data['metadata']['ai_enriched_at'] = datetime.now(timezone.utc).isoformat()
    AUDIT_PATH.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'  ✅ Saved {AUDIT_PATH} ({AUDIT_PATH.stat().st_size // 1024} KB)')


def build_finding_context(f: dict) -> str:
    """Build a concise context string for Claude from a finding."""
    pattern_kr = PATTERN_LABELS_KR.get(f.get('pattern_type', ''), f.get('pattern_type', ''))
    evidence = f.get('evidence_contracts', [])[:4]
    ev_lines = '\n'.join(
        f"  - {e.get('name','')[:50]} | {int(e.get('amount',0))//10000:,}만원 | {e.get('vendor','')[:20]} | {e.get('date','')[:10]}"
        for e in evidence
    )
    detail = f.get('detail', {})
    detail_lines = '\n'.join(f'  {k}: {v}' for k, v in list(detail.items())[:8])

    return f"""패턴: {pattern_kr}
기관: {f.get('target_institution', '')}
의심 점수: {f.get('suspicion_score', 0)}/100
요약: {f.get('summary', '')[:300]}

상세 지표:
{detail_lines}

증거 계약:
{ev_lines}

현재 무죄 해명: {f.get('innocent_explanation', '')[:200]}
"""


def enrich_finding(client: anthropic.Anthropic, f: dict) -> dict:
    """Call Claude to generate real AI analysis for one finding.
    Uses Sonnet for CRITICAL/HIGH, Haiku for MEDIUM/LOW.
    Injects shared system prompt with cache_control for token savings.
    """
    context = build_finding_context(f)
    severity = f.get('severity', 'MEDIUM')
    model = MODEL_STRONG if severity in ('CRITICAL', 'HIGH') else MODEL_FAST

    user_prompt = f"""아래 감사 발견에 대해 분석하세요.

{context}

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{{
  "ai_headline": "기자가 쓸 수 있는 강렬하고 구체적인 한 줄 헤드라인 (40자 이내, 기관명+핵심 의혹 포함)",
  "ai_narrative": "시민 눈높이에서 쓴 2-3단락 조사 브리핑. 무슨 일이 일어났는지, 왜 의심스러운지, 실제 세금 낭비 가능성을 구체적으로 설명. 총 300자 이내.",
  "ai_questions": ["감사관이나 기자가 물어야 할 구체적 질문 1", "질문 2", "질문 3"],
  "ai_risk_assessment": "LOW|MEDIUM|HIGH|CRITICAL 중 하나와 한 줄 이유",
  "ai_comparable": "유사한 실제 한국 조달 비리 사례 참조 (있으면). 없으면 null."
}}"""

    try:
        msg = client.messages.create(
            model=model,
            max_tokens=700,
            system=[{
                'type': 'text',
                'text': SYSTEM_PROMPT,
                'cache_control': {'type': 'ephemeral'},  # cache shared context across batch
            }],
            messages=[{'role': 'user', 'content': user_prompt}],
        )
        raw = msg.content[0].text.strip()
        if '```' in raw:
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        result = json.loads(raw)
        return {
            'ai_headline': result.get('ai_headline', ''),
            'ai_narrative': result.get('ai_narrative', ''),
            'ai_questions': result.get('ai_questions', []),
            'ai_risk_assessment': result.get('ai_risk_assessment', ''),
            'ai_comparable': result.get('ai_comparable'),
            'ai_model': model,
            'ai_enriched_at': datetime.now(timezone.utc).isoformat() + 'Z',
        }
    except Exception as e:
        print(f'  ⚠️  Enrichment failed for {f.get("id","?")}: {e}')
        return {}


def correlate_news(findings: list, news_path: Path) -> dict:
    """Map news articles to findings by institution name keyword match."""
    print('\n📰 뉴스 연관성 분석...')
    try:
        news_data = json.loads(news_path.read_text(encoding='utf-8'))
        articles = news_data.get('items', news_data.get('articles', news_data if isinstance(news_data, list) else []))
    except Exception as e:
        print(f'  ⚠️  뉴스 로드 실패: {e}')
        return {}

    # Build institution → [articles] map
    inst_news: dict[str, list] = {}
    for f in findings:
        inst = f.get('target_institution', '')
        if not inst or inst in inst_news:
            continue
        # Try matching by institution name keywords
        # Strip generic suffixes for better matching
        inst_key = inst.replace('특별자치시', '').replace('특별자치도', '').replace('광역시', '').strip()
        short = inst_key[:8]  # first 8 chars usually unique enough
        matched = []
        for art in articles:
            title = art.get('title', '')
            desc = art.get('description', '')
            if short in title or short in desc or inst_key in title or inst_key in desc:
                matched.append({
                    'title': title,
                    'link': art.get('link', ''),
                    'pubDate': art.get('pubDate', ''),
                    'outlet': art.get('outlet_name', ''),
                })
        if matched:
            inst_news[inst] = matched[:3]  # cap at 3 articles per institution

    total_matched = sum(1 for v in inst_news.values() if v)
    print(f'  {total_matched}개 기관에서 관련 뉴스 발견 (총 {len(articles)}건 기사 중)')
    return inst_news


def run_ai_anomaly_detection(client: anthropic.Anthropic, findings: list, contracts_path: Path, min_score: int = 70) -> list:
    """
    For top institutions by finding count, ask Claude to scan raw contract data
    for anomalies that rule-based patterns miss.
    Returns new findings of type 'ai_anomaly'.
    """
    print('\n🤖 AI 이상탐지 패턴 실행...')

    try:
        raw = json.loads(contracts_path.read_text(encoding='utf-8'))
        all_contracts = raw.get('items', []) if isinstance(raw, dict) else raw
    except Exception as e:
        print(f'  ⚠️  계약 데이터 로드 실패: {e}')
        return []

    # Pick top institutions (by finding count, score >= min_score)
    from collections import Counter
    inst_counts = Counter(
        f['target_institution'] for f in findings
        if f.get('suspicion_score', 0) >= min_score
    )
    top_insts = [inst for inst, _ in inst_counts.most_common(10)]

    new_findings = []
    for inst in top_insts:
        # Get recent contracts for this institution
        inst_contracts = [
            c for c in all_contracts
            if inst in str(c.get('cntrctInsttNm', '')) or inst in str(c.get('ntceInsttNm', ''))
        ][:40]  # cap at 40 contracts per institution
        if len(inst_contracts) < 5:
            continue

        # Build concise contract list for Claude
        contract_lines = []
        for i, c in enumerate(inst_contracts[:30]):
            amt = int(float(c.get('thtmCntrctAmt', 0) or c.get('cntrctAmt', 0) or c.get('sucsfbidAmt', 0) or 0))
            vendor = str(c.get('rprsntCorpNm', c.get('bidwinnrNm', ''))).strip()[:20]
            title = str(c.get('cntrctNm', c.get('bidNtceNm', ''))).strip()[:40]
            method = str(c.get('cntrctCnclsMthdNm', c.get('bidMthdNm', ''))).strip()[:10]
            date = str(c.get('cntrctCnclsDate', c.get('rlOpengDt', '')))[:10]
            contract_lines.append(f'{i+1}. [{date}] {title} | {vendor} | {amt//10000:,}만원 | {method}')

        contracts_text = '\n'.join(contract_lines)

        prompt = f"""당신은 한국 정부 조달 전문 감사 AI입니다.
아래는 "{inst}"의 최근 계약 목록입니다.

{contracts_text}

이미 알려진 패턴(수의계약 반복, 낙찰률 이상, 계약 분할 등)은 이미 다른 시스템이 탐지했습니다.
규칙 기반 시스템이 놓쳤을 수 있는 이상한 패턴을 찾으세요:
- 비정상적으로 특이한 계약명 (일반 기관에 어울리지 않는 물품/서비스)
- 의심스러운 업체명 패턴 (유사한 이름, 특이한 법인명)
- 금액 패턴 이상 (비슷한 금액 반복, 특정 임계값 바로 아래)
- 시기적 이상 (비정상적 집중 발주)
- 기타 경험에 기반한 이상 징후

심각한 이상이 없으면 null을 반환하세요.
이상이 있으면 다음 JSON으로만 응답:
{{
  "anomaly_type": "이상 유형 (한 단어)",
  "description": "발견한 이상 패턴 구체적 설명 (150자 이내)",
  "suspicious_contracts": [계약 번호들, e.g. [1, 3, 7]],
  "confidence": 0.0~1.0,
  "citizen_impact": "시민에게 어떤 의미인지 한 줄"
}}"""

        try:
            msg = client.messages.create(
                model=MODEL_FAST,
                max_tokens=400,
                messages=[{'role': 'user', 'content': prompt}],
            )
            raw_resp = msg.content[0].text.strip()
            if raw_resp.lower() == 'null' or not raw_resp or raw_resp.startswith('null'):
                continue
            if '```' in raw_resp:
                raw_resp = raw_resp.split('```')[1]
                if raw_resp.startswith('json'):
                    raw_resp = raw_resp[4:]
            result = json.loads(raw_resp.strip())
            if not result or result.get('confidence', 0) < 0.6:
                continue

            # Build finding
            suspicious_idxs = [i - 1 for i in result.get('suspicious_contracts', []) if 1 <= i <= len(inst_contracts)]
            evidence = []
            for idx in suspicious_idxs[:5]:
                c = inst_contracts[idx]
                amt = float(c.get('thtmCntrctAmt', 0) or c.get('cntrctAmt', 0) or 0)
                evidence.append({
                    'no': c.get('untyCntrctNo', c.get('bidNtceNo', '')),
                    'name': str(c.get('cntrctNm', c.get('bidNtceNm', '')))[:60],
                    'amount': amt,
                    'vendor': str(c.get('rprsntCorpNm', c.get('bidwinnrNm', ''))).strip(),
                    'date': str(c.get('cntrctCnclsDate', c.get('rlOpengDt', '')))[:10],
                    'method': str(c.get('cntrctCnclsMthdNm', '')),
                    'url': '',
                })

            score = min(80, int(result.get('confidence', 0.6) * 85))
            new_findings.append({
                'pattern_type': 'ai_anomaly',
                'severity': 'HIGH' if score >= 65 else 'MEDIUM',
                'suspicion_score': score,
                'target_institution': inst,
                'summary': f'[AI 탐지] {inst}: {result.get("description", "")}',
                'detail': {
                    '기관': inst,
                    'AI_탐지_유형': result.get('anomaly_type', ''),
                    '설명': result.get('description', ''),
                    '신뢰도': f'{result.get("confidence", 0)*100:.0f}%',
                },
                'evidence_contracts': evidence,
                'citizen_impact': result.get('citizen_impact', ''),
                'innocent_explanation': 'AI 분석 결과로, 추가 검증이 필요합니다.',
                'plain_explanation': result.get('description', ''),
                'why_it_matters': 'AI가 규칙 기반 시스템이 탐지하지 못한 패턴을 발견했습니다.',
                'what_should_happen': '전문 감사관이 해당 계약들을 직접 검토해야 합니다.',
                'ai_model': MODEL,
                'ai_enriched_at': datetime.now(timezone.utc).isoformat() + 'Z',
            })
            print(f'  ✅ {inst}: {result.get("anomaly_type")} (신뢰도 {result.get("confidence",0)*100:.0f}%)')
        except Exception as e:
            print(f'  ⚠️  {inst} 이상탐지 실패: {e}')
            continue

    print(f'  AI 이상탐지: {len(new_findings)}건 신규 발견')
    return new_findings


_NEWS_SOURCE_MAP = {
    'chosun': '조선일보', 'joongang': '중앙일보', 'donga': '동아일보',
    'hani': '한겨레', 'khan': '경향신문', 'ohmynews': '오마이뉴스',
    'yna': '연합뉴스', 'yonhapnews': '연합뉴스', 'newsis': '뉴시스',
    'mt': '머니투데이', 'hankyung': '한국경제', 'mk': '매일경제',
    'sedaily': '서울경제', 'nocutnews': '노컷뉴스', 'news1': '뉴스1',
    'jtbc': 'JTBC', 'kbs': 'KBS', 'mbc': 'MBC', 'sbs': 'SBS',
    'pressian': '프레시안', 'mediatoday': '미디어오늘', 'sisain': '시사IN',
}


def _guess_news_source(url: str) -> str:
    lower = url.lower()
    for k, v in _NEWS_SOURCE_MAP.items():
        if k in lower:
            return v
    parts = lower.split('/')
    return parts[2].replace('www.', '') if len(parts) > 2 else '언론사'


def gnews_search(query: str, max_results: int = 8) -> list[dict]:
    """Search Korean news via Google News RSS. No API key needed."""
    encoded = urllib.parse.quote(query)
    url = f'https://news.google.com/rss/search?q={encoded}&hl=ko&gl=KR&ceid=KR:ko'
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/rss+xml,application/xml,text/xml,*/*',
        })
        with urllib.request.urlopen(req, timeout=12, context=_ssl_ctx) as resp:
            raw = resp.read().decode('utf-8', errors='replace')
        root = ET.fromstring(raw)
        articles = []
        for item in root.findall('.//item')[:max_results]:
            title  = (item.findtext('title') or '').strip()
            link   = (item.findtext('link')  or '').strip()
            pub    = (item.findtext('pubDate') or '').strip()
            src_el = item.find('source')
            source = src_el.text.strip() if src_el is not None and src_el.text else _guess_news_source(link)
            desc   = (item.findtext('description') or '').strip()[:250]
            date_str = ''
            try:
                date_str = parsedate_to_datetime(pub).strftime('%Y-%m-%d')
            except Exception:
                date_str = pub[:10] if len(pub) >= 10 else ''
            if title and link:
                articles.append({'title': title, 'url': link, 'source': source,
                                  'date': date_str, 'snippet': desc})
        return articles
    except Exception as e:
        return []


def build_news_coverage(client_obj: anthropic.Anthropic, inst: str, vendor: str,
                        pattern_types: list, summaries: list, articles: list) -> dict:
    """Call Claude Haiku to synthesize news articles into a structured news_coverage block."""
    arts_text = '\n'.join(
        f'  [{a["source"]}] ({a["date"]}) {a["title"]}\n    {a["snippet"]}'
        for a in articles[:6]
    ) if articles else '  (뉴스 검색 결과 없음)'

    findings_text = '\n'.join(f'  - {s[:200]}' for s in summaries[:4])

    prompt = f"""당신은 한국 정부 조달 비리 분석 전문가입니다.

## 감사 대상
기관: {inst}
업체: {vendor or '(특정 업체 없음)'}
의심 패턴: {', '.join(set(pattern_types))}

## AI 감사 발견사항
{findings_text}

## 뉴스 검색 결과
{arts_text}

아래 JSON으로만 응답 (markdown 없이):
{{
  "ai_summary": "이 기관/업체의 뉴스 보도와 감사 발견을 연결하는 2-3문장 시민 친화적 요약. 기자가 쓸 수 있는 수준.",
  "coverage_level": "significant|moderate|minimal|none",
  "coverage_note": "뉴스 보도 수준 설명 한 문장 (없으면 없는 이유)",
  "key_findings_from_news": ["뉴스에서 드러난 핵심 사실 1", "핵심 사실 2"],
  "investigation_status": "수사중|기소|유죄판결|무죄|감사원조사|국감질의|언론보도만|미확인"
}}"""

    try:
        resp = client_obj.messages.create(
            model=MODEL_FAST,
            max_tokens=500,
            messages=[{'role': 'user', 'content': prompt}],
        )
        text = resp.content[0].text.strip()
        if '```' in text:
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
        return json.loads(text.strip())
    except Exception as e:
        # Fallback: generate basic summary from article titles without Claude API
        if articles:
            sources = list(dict.fromkeys(a['source'] for a in articles[:4]))
            titles = [a['title'] for a in articles[:3]]
            n = len(articles)
            level = 'significant' if n >= 5 else 'moderate' if n >= 3 else 'minimal'
            # Detect investigation keywords in titles
            invest_kw = {'수사': '수사중', '기소': '기소', '유죄': '유죄판결', '무죄': '무죄',
                         '감사원': '감사원조사', '국감': '국감질의', '국정감사': '국감질의'}
            status = '언론보도만'
            all_titles = ' '.join(a['title'] for a in articles)
            for kw, val in invest_kw.items():
                if kw in all_titles:
                    status = val
                    break
            return {
                'ai_summary': (
                    f'{inst}에 대해 {", ".join(sources[:3])} 등 {n}건의 언론 보도가 확인됩니다. '
                    f'주요 보도: {titles[0][:60]}' +
                    (f' 외 {n-1}건.' if n > 1 else '.')
                ),
                'coverage_level': level,
                'coverage_note': f'{n}건 기사 발견 (ANTHROPIC_API_KEY 설정 시 AI 요약 생성 가능)',
                'key_findings_from_news': [t[:80] for t in titles[:2]],
                'investigation_status': status,
            }
        return {
            'ai_summary': f'{inst}에 대한 관련 언론 보도가 검색되지 않았습니다.',
            'coverage_level': 'none',
            'coverage_note': '검색 결과 없음',
            'key_findings_from_news': [],
            'investigation_status': '미확인',
        }


def enrich_live_news(client_obj: anthropic.Anthropic, findings: list, top_n: int = 300):
    """
    For each unique (institution, vendor) pair in the top N high-priority findings:
    1. Search Google News RSS
    2. Call Claude to synthesize → news_coverage block
    3. Attach to all findings for that pair
    """
    print(f'\n📰 실시간 뉴스 검색 + AI 요약 (상위 {top_n}건)...')

    sev_w = {'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}

    def _score(f):
        amt = f.get('total_amount', 0) or sum(
            c.get('amount', 0) for c in f.get('evidence_contracts', []))
        return sev_w.get(f.get('severity', ''), 0) * 1000 + f.get('suspicion_score', 0)

    eligible = [f for f in findings
                if sev_w.get(f.get('severity', ''), 0) >= 3  # HIGH or CRITICAL
                and not f.get('news_coverage')]
    eligible.sort(key=_score, reverse=True)

    # Group by (institution, primary vendor)
    from collections import defaultdict
    pair_map: dict = defaultdict(list)
    for f in eligible[:top_n]:
        inst = f.get('target_institution', '')
        vendors = [c.get('vendor', '') for c in f.get('evidence_contracts', []) if c.get('vendor')]
        v = vendors[0] if vendors else ''
        pair_map[(inst, v)].append(f)

    pairs = sorted(pair_map.items(), key=lambda x: max(_score(f) for f in x[1]), reverse=True)
    print(f'  고유 기관·업체 쌍: {len(pairs)}개')

    enriched = 0
    for idx, ((inst, vendor), flist) in enumerate(pairs, 1):
        query = f'{inst} {vendor} 비리 조달 감사'.strip()
        articles = gnews_search(query, max_results=8)
        if not articles and vendor:
            articles = gnews_search(f'{inst} 감사 비리', max_results=5)
        time.sleep(0.25)

        synthesis = build_news_coverage(
            client_obj, inst, vendor,
            [f.get('pattern_type', '') for f in flist],
            [f.get('summary', '') for f in flist],
            articles,
        )

        nc = {
            'searched_at':   datetime.now(timezone.utc).strftime('%Y-%m-%d'),
            'query_used':    query,
            'articles':      articles[:6],
            'ai_summary':    synthesis.get('ai_summary', ''),
            'coverage_level': synthesis.get('coverage_level', 'none'),
            'coverage_note': synthesis.get('coverage_note', ''),
            'key_findings_from_news': synthesis.get('key_findings_from_news', []),
            'investigation_status':  synthesis.get('investigation_status', '미확인'),
        }
        for f in flist:
            f['news_coverage'] = nc
        enriched += len(flist)

        level = synthesis.get('coverage_level', '?')
        status = synthesis.get('investigation_status', '?')
        print(f'  [{idx:03d}] {inst[:25]} / {vendor[:20] or "-"} → {len(articles)}건 뉴스 | {level} | {status}')

    print(f'  ✅ {enriched}건 news_coverage 추가')
    return enriched


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--min-score', type=int, default=MIN_SCORE_DEFAULT)
    parser.add_argument('--max-findings', type=int, default=MAX_FINDINGS_DEFAULT)
    parser.add_argument('--anomaly-only', action='store_true')
    parser.add_argument('--news-only', action='store_true')
    parser.add_argument('--skip-enrichment', action='store_true')
    parser.add_argument('--skip-anomaly', action='store_true')
    args = parser.parse_args()

    if not ANTHROPIC_API_KEY:
        print('❌ ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.')
        print('   export ANTHROPIC_API_KEY=sk-ant-...')
        sys.exit(1)

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    print('📂 감사 결과 로드...')
    audit_data = load_audit()
    findings = audit_data.get('findings', [])
    print(f'  {len(findings)}건 로드됨')

    # ── 1. 뉴스 연관성 ──────────────────────────────────────────────────────
    news_path = DATA_DIR / 'news-rss.json'
    inst_news_map = {}
    if news_path.exists():
        inst_news_map = correlate_news(findings, news_path)
        # Attach news to findings
        for f in findings:
            inst = f.get('target_institution', '')
            if inst in inst_news_map:
                f['related_news'] = inst_news_map[inst]

    if args.news_only:
        save_audit(audit_data)
        return

    # ── 2. Claude API 발견 강화 ─────────────────────────────────────────────
    if not args.anomaly_only and not args.skip_enrichment:
        # Select findings to enrich: score >= min_score, not already enriched
        candidates = [
            f for f in findings
            if f.get('suspicion_score', 0) >= args.min_score
            and not f.get('ai_headline')  # skip already enriched
        ]
        candidates.sort(key=lambda x: -x['suspicion_score'])
        to_enrich = candidates[:args.max_findings]
        print(f'\n🤖 Claude API 감사 강화 — {len(to_enrich)}건 (score >= {args.min_score})...')

        enriched_count = 0
        failed_count = 0

        def _enrich_one(f):
            return f['id'], enrich_finding(client, f)

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
            futs = {pool.submit(_enrich_one, f): f for f in to_enrich}
            for i, fut in enumerate(as_completed(futs), 1):
                fid, result = fut.result()
                if result:
                    # Find and update the finding
                    for f in findings:
                        if f.get('id') == fid:
                            f.update(result)
                            enriched_count += 1
                            break
                else:
                    failed_count += 1
                if i % 25 == 0:
                    print(f'  진행: {i}/{len(to_enrich)} ({enriched_count}건 성공, {failed_count}건 실패)')
                    # Save checkpoint
                    save_audit(audit_data)

        print(f'  ✅ 강화 완료: {enriched_count}건 성공, {failed_count}건 실패')

    # ── 3. AI 이상탐지 ──────────────────────────────────────────────────────
    if not args.skip_anomaly:
        contracts_path = DATA_DIR / 'g2b-contract-details.json'
        if not contracts_path.exists():
            contracts_path = DATA_DIR / 'g2b-actual-contracts.json'

        if contracts_path.exists():
            new_anomalies = run_ai_anomaly_detection(client, findings, contracts_path)
            if new_anomalies:
                # Assign stable content-based IDs (not sequential, so they survive regeneration)
                import hashlib as _hl
                def _ai_stable_id(nf: dict) -> str:
                    key = '|'.join([
                        nf.get('pattern_type', ''),
                        nf.get('target_institution', ''),
                        (nf.get('summary') or '')[:60],
                    ])
                    return 'af-' + _hl.sha256(key.encode()).hexdigest()[:8]

                _seen_ai: dict = {}
                for i, nf in enumerate(new_anomalies):
                    base = _ai_stable_id(nf)
                    if base in _seen_ai:
                        _seen_ai[base] += 1
                        nf['id'] = f'{base}-{_seen_ai[base]}'
                    else:
                        _seen_ai[base] = 0
                        nf['id'] = base
                    nf['target_id'] = nf['id']
                    nf['target_type'] = 'institution'
                    nf['status'] = 'active'
                    nf['created_at'] = datetime.now(timezone.utc).isoformat() + 'Z'
                    nf['verdict'] = '조사 필요'
                    nf['priority_tier'] = 2
                findings.extend(new_anomalies)
                print(f'  ✅ {len(new_anomalies)}건 AI 이상탐지 결과 추가됨')
        else:
            print('  ⚠️  계약 데이터 파일 없음 — AI 이상탐지 건너뜀')

    # ── 4. 업체 네트워크 분석 (vendor network synthesis) ────────────────────
    # Find vendors appearing across many institutions' findings — national rings
    if not args.anomaly_only and not args.news_only:
        print('\n🕸️  업체 네트워크 분석...')
        from collections import Counter as _NetCounter
        vendor_to_insts: dict[str, set] = {}
        vendor_to_findings: dict[str, list] = {}
        for f in findings:
            # Extract primary vendor from finding
            detail = f.get('detail', {})
            vendor = (detail.get('낙찰업체') or detail.get('업체') or
                      detail.get('낙찰자') or '')
            if not vendor:
                for c in f.get('evidence_contracts', []):
                    vendor = c.get('vendor', '')
                    if vendor:
                        break
            if not vendor or len(vendor) < 2:
                continue
            inst = f.get('target_institution', '')
            if inst:
                vendor_to_insts.setdefault(vendor, set()).add(inst)
                vendor_to_findings.setdefault(vendor, []).append(f)

        # Flag vendors appearing in findings across 3+ distinct institutions
        cross_inst_vendors = [
            (v, insts, vendor_to_findings[v])
            for v, insts in vendor_to_insts.items()
            if len(insts) >= 3
        ]
        cross_inst_vendors.sort(key=lambda x: -len(x[1]))

        if cross_inst_vendors:
            # Ask Claude to synthesize the top vendors as a network report
            top_vendors_text = '\n'.join(
                f'- {v}: {len(insts)}개 기관 ({", ".join(list(insts)[:4])}{"..." if len(insts) > 4 else ""}), '
                f'{len(flist)}건 의심 발견, 패턴: {", ".join(set(f["pattern_type"] for f in flist[:8]))}'
                for v, insts, flist in cross_inst_vendors[:20]
            )
            network_prompt = f"""다음은 여러 정부기관에서 반복 등장하는 업체 목록입니다.
3개 이상 기관에서 조달 비리 의심 패턴에 연루된 업체들입니다.

{top_vendors_text}

이 데이터를 바탕으로 전국적 조달 비리 링 또는 카르텔 가능성을 분석하세요.
JSON 형식으로만 응답:
{{
  "network_summary": "전체 패턴에 대한 2-3문장 요약",
  "top_suspects": [
    {{"vendor": "업체명", "risk": "HIGH|CRITICAL", "reason": "왜 위험한지 한 줄", "institutions": ["기관1", "기관2"]}}
  ],
  "investigation_recommendation": "수사기관이나 감사원에 제출할 핵심 조사 방향 (3개)"
}}"""
            try:
                net_msg = client.messages.create(
                    model=MODEL_STRONG,
                    max_tokens=800,
                    system=[{'type': 'text', 'text': SYSTEM_PROMPT, 'cache_control': {'type': 'ephemeral'}}],
                    messages=[{'role': 'user', 'content': network_prompt}],
                )
                net_raw = net_msg.content[0].text.strip()
                if '```' in net_raw:
                    net_raw = net_raw.split('```')[1]
                    if net_raw.startswith('json'):
                        net_raw = net_raw[4:]
                net_result = json.loads(net_raw.strip())
                audit_data['vendor_network_analysis'] = {
                    'generated_at': datetime.now(timezone.utc).isoformat() + 'Z',
                    'cross_institution_vendors': len(cross_inst_vendors),
                    'summary': net_result.get('network_summary', ''),
                    'top_suspects': net_result.get('top_suspects', []),
                    'investigation_recommendation': net_result.get('investigation_recommendation', ''),
                    'vendor_list': [
                        {'vendor': v, 'institution_count': len(insts),
                         'finding_count': len(flist),
                         'institutions': sorted(insts)}
                        for v, insts, flist in cross_inst_vendors[:50]
                    ],
                }
                print(f'  ✅ {len(cross_inst_vendors)}개 다기관 업체 분석 완료')
                print(f'  네트워크 요약: {net_result.get("network_summary", "")[:100]}')
            except Exception as e:
                print(f'  ⚠️  네트워크 분석 실패: {e}')
        else:
            print('  다기관 의심 업체 없음')

    # ── 5. 실시간 뉴스 검색 + AI 요약 ────────────────────────────────────────
    if not args.anomaly_only:
        enrich_live_news(client, findings, top_n=300)

    # ── Save ─────────────────────────────────────────────────────────────────
    audit_data['findings'] = findings
    save_audit(audit_data)

    # Summary
    ai_enriched  = sum(1 for f in findings if f.get('ai_headline'))
    ai_anomaly   = sum(1 for f in findings if f.get('pattern_type') == 'ai_anomaly')
    news_linked  = sum(1 for f in findings if f.get('related_news'))
    news_covered = sum(1 for f in findings if f.get('news_coverage'))
    sig_covered  = sum(1 for f in findings if (f.get('news_coverage') or {}).get('coverage_level') in ('significant', 'moderate'))
    print(f'\n📊 완료:')
    print(f'   AI 강화 발견 (headline+narrative): {ai_enriched}건')
    print(f'   AI 이상탐지:                       {ai_anomaly}건')
    print(f'   RSS 뉴스 연결:                      {news_linked}건')
    print(f'   실시간 뉴스 검색 완료:              {news_covered}건')
    print(f'     → 유의미한 언론 보도 확인:        {sig_covered}건')
    print(f'   총 발견:                            {len(findings)}건')


if __name__ == '__main__':
    main()
