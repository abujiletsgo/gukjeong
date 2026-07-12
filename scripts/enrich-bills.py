#!/usr/bin/env python3
"""
법안 AI 강화 스크립트
Enrich all 16,914 bills with rule-based metadata + batched AI summaries.

Run:
  uv run scripts/enrich-bills.py              # process ~50 bills per run (test)
  uv run scripts/enrich-bills.py --batch 200  # process 200 per run
  uv run scripts/enrich-bills.py --all        # process everything (~$10, ~15 min)
  uv run scripts/enrich-bills.py --skip-ai    # rules only (free, instant)

Output:
  apps/web/public/data/bills-enriched.json   (served to frontend)
  apps/web/data/bill-enrichment-state.json   (progress checkpoint)

What AI adds (Haiku, 50 bills/call):
  plain_title       shorter, readable Korean title
  summary           1-sentence plain description of what the bill does
  who_affected      short tag for who this bill matters to ("운전자", "의료인", "농업인")
  area_tag          citizen-friendly policy area label
  controversy_score 0-10 rough estimate of how contested this type of bill typically is

What rules add for free:
  amendment_type    일부개정 / 전부개정 / 제정 / 폐지 / 기타
  law_name          the referenced act (stripped of "일부개정법률안" suffix)
  status_label      readable status string
  proposer_party    joined from legislator-scores.json
  co_sponsor_count  count from PUBL_MONA_CD
"""

import anthropic
import argparse
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent
DATA_RAW = ROOT / 'apps/web/data'
DATA_PUBLIC = ROOT / 'apps/web/public/data'
STATE_PATH = DATA_RAW / 'bill-enrichment-state.json'
OUTPUT_PATH = DATA_PUBLIC / 'bills-enriched.json'

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
MODEL = 'claude-haiku-4-5-20251001'
BATCH_AI = 50   # bills per single AI call

# ── Rule-based helpers ──

AMENDMENT_PATTERNS = [
    ('전부개정', '전부개정'),
    ('일부개정', '일부개정'),
    ('제정',     '제정'),
    ('폐지',     '폐지'),
]

def extract_amendment_type(name: str) -> str:
    for pat, label in AMENDMENT_PATTERNS:
        if pat in name:
            return label
    return '기타'

def extract_law_name(name: str) -> str:
    # Remove standard suffixes to get the base law name
    suffixes = [
        '전부개정법률안', '일부개정법률안', '제정법률안', '폐지법률안',
        '전부개정안', '일부개정안', '법률안', '안',
    ]
    cleaned = name
    for s in suffixes:
        cleaned = cleaned.replace(s, '')
    # Remove leading/trailing whitespace and special chars
    cleaned = cleaned.strip(' ·()[]')
    # If too short (edge case), return original
    return cleaned if len(cleaned) > 2 else name

COMMITTEE_AREA = {
    '교육위원회': '교육', '과학기술정보방송통신위원회': '과학기술',
    '법제사법위원회': '법무/사법', '정무위원회': '정무/금융',
    '기획재정위원회': '경제/재정', '행정안전위원회': '행정/안전',
    '문화체육관광위원회': '문화/체육', '농림축산식품해양수산위원회': '농업/수산',
    '산업통상자원중소벤처기업위원회': '산업/경제', '보건복지위원회': '복지/보건',
    '환경노동위원회': '환경/노동', '국토교통위원회': '국토/교통',
    '정보위원회': '안보/정보', '여성가족위원회': '여성/가족',
    '국방위원회': '국방', '외교통일위원회': '외교/통일',
    '예산결산특별위원회': '예산', '국회운영위원회': '국회/행정',
}
COMMITTEE_KW = {
    '교육': '교육', '과학기술': '과학기술', '정보방송': '과학기술',
    '법제사법': '법무/사법', '정무': '정무/금융', '기획재정': '경제/재정',
    '행정안전': '행정/안전', '문화체육': '문화/체육',
    '농림축산': '농업/수산', '해양수산': '농업/수산',
    '산업통상': '산업/경제', '중소벤처': '산업/경제',
    '보건복지': '복지/보건', '환경노동': '환경/노동',
    '국토교통': '국토/교통', '여성가족': '여성/가족',
    '국방': '국방', '외교통일': '외교/통일', '예산결산': '예산',
}

def committee_to_area(committee: str | None) -> str:
    if not committee:
        return '기타'
    if committee in COMMITTEE_AREA:
        return COMMITTEE_AREA[committee]
    for kw, area in COMMITTEE_KW.items():
        if kw in committee:
            return area
    return '기타'

STATUS_MAP = {
    '원안가결': '통과 (원안)',
    '수정가결': '통과 (수정)',
    '대안반영폐기': '대안 반영',
    '수정안반영폐기': '수정안 반영',
    '철회': '철회',
    '폐기': '폐기',
}

def status_label(result: str | None) -> str:
    if not result:
        return '심의 중'
    return STATUS_MAP.get(result, result)

def apply_rules(bill: dict, mona_to_party: dict[str, str]) -> dict:
    name = bill.get('BILL_NAME', '')
    committee = bill.get('COMMITTEE', '')
    result = bill.get('PROC_RESULT', '')
    co_monas = [m.strip() for m in (bill.get('PUBL_MONA_CD') or '').split(',') if m.strip()]
    lead_mona = bill.get('RST_MONA_CD', '')

    return {
        'amendment_type': extract_amendment_type(name),
        'law_name': extract_law_name(name),
        'area': committee_to_area(committee),
        'status_label': status_label(result),
        'co_sponsor_count': len(co_monas),
        'proposer_party': mona_to_party.get(lead_mona, ''),
        # placeholder AI fields
        'plain_title': '',
        'summary': '',
        'who_affected': '',
        'area_tag': '',
        'controversy_score': 0,
        'ai_enriched': False,
    }

# ── AI enrichment (batched) ──

SYSTEM = """당신은 대한민국 국회 법안을 시민이 이해하기 쉽게 설명하는 전문가입니다.
법률 전문 용어를 피하고, 일반 시민 관점에서 간결하게 설명합니다.
응답은 반드시 유효한 JSON 배열만 출력하세요. 다른 텍스트 없이 JSON만."""

def make_prompt(bills: list[dict]) -> str:
    lines = []
    for i, b in enumerate(bills):
        name = b['BILL_NAME']
        committee = b.get('COMMITTEE', '') or ''
        proposer = b.get('RST_PROPOSER', '') or b.get('PROPOSER', '')[:10]
        lines.append(f'{i+1}. 법안명: {name} | 위원회: {committee or "미배정"} | 발의자: {proposer}')

    return f"""다음 {len(bills)}개 법안 각각에 대해 시민 친화적 메타데이터를 생성하세요.

{chr(10).join(lines)}

각 법안에 대해 아래 형식의 JSON 객체를 생성하고, 전체를 JSON 배열로 반환하세요:
{{
  "plain_title": "법안명에서 '일부개정법률안' 등 접미사를 제거한 짧은 제목 (15자 이내)",
  "summary": "이 법안이 무엇을 바꾸는지 1문장으로 설명 (30자 이내)",
  "who_affected": "주로 영향받는 시민 집단 (예: 운전자, 농업인, 의료인, 근로자) (10자 이내)",
  "area_tag": "정책 분야 태그 (예: 교통안전, 의료복지, 농업지원) (8자 이내)",
  "controversy_score": 이런 유형의 법안이 보통 논쟁적인 정도 0-10 숫자
}}

반드시 {len(bills)}개의 객체를 포함한 JSON 배열만 출력하세요."""

def enrich_batch_ai(client: anthropic.Anthropic, bills: list[dict]) -> list[dict]:
    """Call Claude Haiku to enrich a batch of bills. Returns list of AI fields."""
    prompt = make_prompt(bills)
    try:
        resp = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=[{'type': 'text', 'text': SYSTEM, 'cache_control': {'type': 'ephemeral'}}],
            messages=[{'role': 'user', 'content': prompt}],
        )
        text = resp.content[0].text.strip()
        # Extract JSON array from response
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if not match:
            raise ValueError(f'No JSON array found in: {text[:200]}')
        parsed = json.loads(match.group(0))
        if len(parsed) != len(bills):
            print(f'  ⚠️  Expected {len(bills)} items, got {len(parsed)}')
        return parsed
    except Exception as e:
        print(f'  ⚠️  AI batch failed: {e}')
        return [{'plain_title': '', 'summary': '', 'who_affected': '', 'area_tag': '', 'controversy_score': 0}] * len(bills)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--batch', type=int, default=50, help='Bills per run (default 50)')
    parser.add_argument('--all', action='store_true', help='Process all bills')
    parser.add_argument('--skip-ai', action='store_true', help='Rules only, no AI')
    parser.add_argument('--reset', action='store_true', help='Clear progress and restart')
    args = parser.parse_args()

    if args.all:
        limit = 999999
    else:
        limit = args.batch

    # ── Load data ──
    bills_raw = json.loads((DATA_RAW / 'bills.json').read_text())
    bills = bills_raw['items']
    print(f'📜 전체 법안: {len(bills)}건')

    # Load legislator party mapping
    scores_path = DATA_PUBLIC / 'legislator-scores.json'
    mona_to_party: dict[str, str] = {}
    if scores_path.exists():
        scores_data = json.loads(scores_path.read_text())
        mona_to_party = {l['MONA_CD']: l['POLY_NM'] for l in scores_data.get('legislators', [])}

    # ── Load state (incremental progress) ──
    if args.reset and STATE_PATH.exists():
        STATE_PATH.unlink()
        print('  State cleared.')

    state: dict[str, dict] = {}
    if STATE_PATH.exists():
        state = json.loads(STATE_PATH.read_text())
    print(f'  이미 처리됨: {len(state)}건')

    # Existing enriched output
    enriched_map: dict[str, dict] = {}
    if OUTPUT_PATH.exists():
        existing = json.loads(OUTPUT_PATH.read_text())
        for b in existing.get('bills', []):
            enriched_map[b['BILL_ID']] = b

    # ── Identify bills to process ──
    to_process = [b for b in bills if b['BILL_ID'] not in state]
    print(f'  처리 대기: {len(to_process)}건 → 이번 실행: {min(len(to_process), limit)}건')

    if not to_process:
        print('✅ 모든 법안 처리 완료!')
        _write_output(bills, state, enriched_map, mona_to_party)
        return

    batch_to_run = to_process[:limit]

    # ── Rule-based enrichment ──
    print('📐 규칙 기반 처리 중...')
    for bill in batch_to_run:
        bid = bill['BILL_ID']
        if bid not in state:
            state[bid] = apply_rules(bill, mona_to_party)

    # ── AI enrichment ──
    if not args.skip_ai and ANTHROPIC_API_KEY:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        ai_todo = [b for b in batch_to_run if not state[b['BILL_ID']].get('ai_enriched')]
        print(f'🤖 AI 처리: {len(ai_todo)}건 ({len(ai_todo) // BATCH_AI + 1}회 API 호출)')

        chunks = [ai_todo[i:i+BATCH_AI] for i in range(0, len(ai_todo), BATCH_AI)]
        processed = 0

        def process_chunk(chunk_bills):
            ai_results = enrich_batch_ai(client, chunk_bills)
            return chunk_bills, ai_results

        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = {pool.submit(process_chunk, chunk): chunk for chunk in chunks}
            for fut in as_completed(futures):
                chunk_bills, ai_results = fut.result()
                for bill, ai in zip(chunk_bills, ai_results):
                    bid = bill['BILL_ID']
                    state[bid].update({
                        'plain_title': ai.get('plain_title', ''),
                        'summary': ai.get('summary', ''),
                        'who_affected': ai.get('who_affected', ''),
                        'area_tag': ai.get('area_tag', ''),
                        'controversy_score': int(ai.get('controversy_score', 0) or 0),
                        'ai_enriched': True,
                    })
                processed += len(chunk_bills)
                print(f'  {processed}/{len(ai_todo)} 처리 완료')

                # Save state checkpoint after each batch
                STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, separators=(',', ':')))
    elif args.skip_ai:
        print('  (AI 스킵)')
    else:
        print('  ⚠️  ANTHROPIC_API_KEY 없음 — AI 생략')

    # Save final state
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, separators=(',', ':')))
    print(f'  상태 저장: {len(state)}건')

    # ── Write output ──
    _write_output(bills, state, enriched_map, mona_to_party)


def _write_output(bills: list[dict], state: dict, enriched_map: dict, mona_to_party: dict):
    output_bills = []
    for bill in bills:
        bid = bill['BILL_ID']
        enrichment = state.get(bid, apply_rules(bill, mona_to_party))

        # Build output record
        co_monas = [m.strip() for m in (bill.get('PUBL_MONA_CD') or '').split(',') if m.strip()]
        out = {
            'BILL_ID': bid,
            'BILL_NO': bill.get('BILL_NO', ''),
            'BILL_NAME': bill.get('BILL_NAME', ''),
            'COMMITTEE': bill.get('COMMITTEE', ''),
            'PROPOSE_DT': bill.get('PROPOSE_DT', ''),
            'PROC_RESULT': bill.get('PROC_RESULT', ''),
            'PROPOSER': bill.get('PROPOSER', ''),
            'RST_MONA_CD': bill.get('RST_MONA_CD', ''),
            'RST_PROPOSER': bill.get('RST_PROPOSER', ''),
            'PUBL_PROPOSER': bill.get('PUBL_PROPOSER', ''),
            'DETAIL_LINK': bill.get('DETAIL_LINK', ''),
            # rule-based
            'amendment_type': enrichment.get('amendment_type', '기타'),
            'law_name': enrichment.get('law_name', bill.get('BILL_NAME', '')),
            'area': enrichment.get('area', '기타'),
            'status_label': enrichment.get('status_label', '심의 중'),
            'co_sponsor_count': enrichment.get('co_sponsor_count', len(co_monas)),
            'proposer_party': enrichment.get('proposer_party', mona_to_party.get(bill.get('RST_MONA_CD',''), '')),
            # AI-generated
            'plain_title': enrichment.get('plain_title', ''),
            'summary': enrichment.get('summary', ''),
            'who_affected': enrichment.get('who_affected', ''),
            'area_tag': enrichment.get('area_tag', ''),
            'controversy_score': enrichment.get('controversy_score', 0),
            'ai_enriched': enrichment.get('ai_enriched', False),
        }
        output_bills.append(out)

    # Stats
    ai_done = sum(1 for b in output_bills if b['ai_enriched'])
    passed = sum(1 for b in output_bills if b['PROC_RESULT'] in ('원안가결', '수정가결'))
    incorporated = sum(1 for b in output_bills if b['PROC_RESULT'] in ('대안반영폐기', '수정안반영폐기'))

    output = {
        'generated_at': datetime.now().isoformat(),
        'total': len(output_bills),
        'ai_enriched_count': ai_done,
        'stats': {
            'pending': sum(1 for b in output_bills if not b['PROC_RESULT']),
            'passed': passed,
            'incorporated': incorporated,
            'withdrawn': sum(1 for b in output_bills if b['PROC_RESULT'] == '철회'),
        },
        'bills': output_bills,
    }

    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')))
    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f'\n✅ 저장 완료: {len(output_bills)}건 (AI 완료: {ai_done}건) → bills-enriched.json ({size_kb:.0f}KB)')
    print(f'   통과: {passed}건 | 대안반영: {incorporated}건 | 심의중: {output["stats"]["pending"]}건')

    # Show sample
    enriched_sample = [b for b in output_bills if b['ai_enriched']][:3]
    if enriched_sample:
        print('\n📋 샘플:')
        for b in enriched_sample:
            print(f'  [{b["amendment_type"]}] {b["BILL_NAME"][:30]}')
            print(f'    → {b["plain_title"]} | {b["summary"]}')
            print(f'    → 대상: {b["who_affected"]} | 분야: {b["area_tag"]} | 논쟁지수: {b["controversy_score"]}')


if __name__ == '__main__':
    main()
