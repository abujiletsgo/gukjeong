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
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from datetime import datetime

# ── Paths ──
ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / 'apps' / 'web' / 'data'
AUDIT_PATH = ROOT / 'apps' / 'web' / 'public' / 'data' / 'audit-results.json'

# ── Config ──
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
MODEL = 'claude-haiku-4-5-20251001'   # Haiku: fast + cheap for batch enrichment
MAX_WORKERS = 5                        # parallel API calls
MIN_SCORE_DEFAULT = 65
MAX_FINDINGS_DEFAULT = 250

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
    'ai_anomaly': 'AI 이상탐지',
}


def load_audit() -> dict:
    data = json.loads(AUDIT_PATH.read_text(encoding='utf-8'))
    if isinstance(data, list):
        return {'findings': data, 'metadata': {}}
    return data


def save_audit(data: dict):
    data['metadata']['ai_enriched_at'] = datetime.utcnow().isoformat() + 'Z'
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
    """Call Claude to generate real AI analysis for one finding."""
    context = build_finding_context(f)

    prompt = f"""당신은 한국 정부 조달 전문 감사관입니다. 아래 감사 발견에 대해 분석하세요.

{context}

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{{
  "ai_headline": "기자가 쓸 수 있는 강렬하고 구체적인 한 줄 헤드라인 (40자 이내, 기관명+핵심 의혹 포함)",
  "ai_narrative": "시민 눈높이에서 쓴 2-3단락 조사 브리핑. 무슨 일이 일어났는지, 왜 의심스러운지, 실제 세금 낭비 가능성을 구체적으로 설명. 총 250자 이내.",
  "ai_questions": ["감사관이나 기자가 물어야 할 구체적 질문 1", "질문 2", "질문 3"],
  "ai_risk_assessment": "LOW|MEDIUM|HIGH|CRITICAL 중 하나와 한 줄 이유",
  "ai_comparable": "유사한 실제 한국 조달 비리 사례 참조 (있으면). 없으면 null."
}}"""

    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=600,
            messages=[{'role': 'user', 'content': prompt}],
        )
        raw = msg.content[0].text.strip()
        # Extract JSON if wrapped in ```
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
            'ai_model': MODEL,
            'ai_enriched_at': datetime.utcnow().isoformat() + 'Z',
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
                model=MODEL,
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
                'ai_enriched_at': datetime.utcnow().isoformat() + 'Z',
            })
            print(f'  ✅ {inst}: {result.get("anomaly_type")} (신뢰도 {result.get("confidence",0)*100:.0f}%)')
        except Exception as e:
            print(f'  ⚠️  {inst} 이상탐지 실패: {e}')
            continue

    print(f'  AI 이상탐지: {len(new_findings)}건 신규 발견')
    return new_findings


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
                    nf['created_at'] = datetime.utcnow().isoformat() + 'Z'
                    nf['verdict'] = '조사 필요'
                    nf['priority_tier'] = 2
                findings.extend(new_anomalies)
                print(f'  ✅ {len(new_anomalies)}건 AI 이상탐지 결과 추가됨')
        else:
            print('  ⚠️  계약 데이터 파일 없음 — AI 이상탐지 건너뜀')

    # ── Save ─────────────────────────────────────────────────────────────────
    audit_data['findings'] = findings
    save_audit(audit_data)

    # Summary
    ai_enriched = sum(1 for f in findings if f.get('ai_headline'))
    ai_anomaly = sum(1 for f in findings if f.get('pattern_type') == 'ai_anomaly')
    news_linked = sum(1 for f in findings if f.get('related_news'))
    print(f'\n📊 완료:')
    print(f'   AI 강화 발견: {ai_enriched}건')
    print(f'   AI 이상탐지: {ai_anomaly}건')
    print(f'   뉴스 연결: {news_linked}건')
    print(f'   총 발견: {len(findings)}건')


if __name__ == '__main__':
    main()
