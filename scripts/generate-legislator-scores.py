#!/usr/bin/env python3
"""
국회의원 성과 지수 생성기
Compute comprehensive performance scores from bills, funding, voting, and career data.

Input:
  apps/web/data/legislators.json        raw API (295 legislators)
  apps/web/public/data/legislators-real.json  enriched copy
  apps/web/data/bills.json              16k+ bills with MONA_CD proposers
  apps/web/data/political-funding.json  70k spending records (2024)
  apps/web/public/data/voting-records.json   participation data

Output:
  apps/web/public/data/legislator-scores.json
"""

import json
import os
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict

ROOT = Path(__file__).parent.parent
DATA_RAW = ROOT / 'apps/web/data'
DATA_PUBLIC = ROOT / 'apps/web/public/data'

def load_json(path: Path):
    if not path.exists():
        print(f'  ⚠️  Missing: {path}')
        return None
    with open(path, encoding='utf-8') as f:
        return json.load(f)

# ── Committee → policy area ──
COMMITTEE_TO_AREA = {
    '교육위원회': '교육',
    '과학기술정보방송통신위원회': '과학기술',
    '법제사법위원회': '법무/사법',
    '정무위원회': '정무/금융',
    '기획재정위원회': '경제/재정',
    '행정안전위원회': '행정/지방',
    '문화체육관광위원회': '문화/체육',
    '농림축산식품해양수산위원회': '농업/수산',
    '산업통상자원중소벤처기업위원회': '산업/경제',
    '보건복지위원회': '복지/보건',
    '환경노동위원회': '환경/노동',
    '국토교통위원회': '국토/교통',
    '정보위원회': '안보/정보',
    '여성가족위원회': '여성/가족',
    '국방위원회': '국방',
    '외교통일위원회': '외교/통일',
    '예산결산특별위원회': '경제/재정',
    '국회운영위원회': '행정/지방',
    '운영위원회': '행정/지방',
    '윤리특별위원회': '기타',
}

COMMITTEE_KW = {
    '교육': '교육', '과학기술': '과학기술', '정보방송': '과학기술',
    '법제사법': '법무/사법', '정무': '정무/금융',
    '기획재정': '경제/재정', '행정안전': '행정/지방',
    '문화체육': '문화/체육', '농림축산': '농업/수산', '해양수산': '농업/수산',
    '산업통상': '산업/경제', '중소벤처': '산업/경제',
    '보건복지': '복지/보건', '환경노동': '환경/노동',
    '국토교통': '국토/교통', '여성가족': '여성/가족',
    '국방': '국방', '외교통일': '외교/통일', '예산결산': '경제/재정',
}

def bill_area(committee: str | None) -> str:
    if not committee:
        return '기타'
    if committee in COMMITTEE_TO_AREA:
        return COMMITTEE_TO_AREA[committee]
    for kw, area in COMMITTEE_KW.items():
        if kw in committee:
            return area
    return '기타'

# ── MEM_TITLE keyword → policy area (for stated-focus extraction) ──
AREA_KEYWORDS: dict[str, list[str]] = {
    '교육':      ['교육', '학교', '학생', '대학', '교사', '교원', '교수', '특수교육'],
    '과학기술':  ['과학', '기술', '연구', 'IT', '정보통신', '인공지능', 'AI', '방송', '디지털', '소프트웨어', '통신'],
    '법무/사법': ['법무', '검찰', '사법', '법원', '법학', '형사', '판사', '변호사', '검사'],
    '경제/재정': ['경제', '금융', '세금', '재정', '회계', '은행', '투자', '무역', '통상', '기획재정'],
    '산업/경제': ['산업', '기업', '중소기업', '창업', '벤처', '상공', '제조'],
    '행정/지방': ['행정', '지방', '공무원', '자치', '관료', '행정고시', '도지사', '시장'],
    '문화/체육': ['문화', '예술', '체육', '스포츠', '관광', '영화'],
    '농업/수산': ['농업', '농촌', '수산', '축산', '식품', '농림', '어업', '어촌'],
    '복지/보건': ['복지', '의료', '보건', '건강', '병원', '약사', '간호', '사회보장', '장애', '노인'],
    '환경/노동': ['환경', '기후', '에너지', '노동', '고용', '임금', '근로', '노조', '재생에너지', '탄소'],
    '국토/교통': ['국토', '교통', '도시', '건설', '주택', '부동산', '도로', '철도'],
    '여성/가족': ['여성', '가족', '아동', '청소년', '출산', '육아', '젠더'],
    '국방':      ['국방', '군인', '방위', '군', '보훈', '예비역', '사관'],
    '외교/통일': ['외교', '통일', '북한', '국제', '대사', '외무', '유엔'],
    '정무/금융': ['정무', '금융위', '금감원', '공정거래', '규제개혁'],
}

def extract_stated_areas(mem_title: str) -> list[str]:
    if not mem_title:
        return []
    text = mem_title.replace('\r', ' ').replace('\n', ' ')
    areas = [area for area, kws in AREA_KEYWORDS.items() if any(kw in text for kw in kws)]
    return areas[:5]

def policy_hhi(area_counts: dict[str, int]) -> float:
    """Herfindahl index 0-1. Higher = more specialist."""
    total = sum(area_counts.values())
    if not total:
        return 0.0
    return sum((v / total) ** 2 for v in area_counts.values())

def percentile_rank(value: float, all_vals: list[float]) -> float:
    if not all_vals:
        return 50.0
    below = sum(1 for v in all_vals if v < value)
    equal = sum(1 for v in all_vals if v == value)
    return round((below + equal * 0.5) / len(all_vals) * 100, 1)

def letter_grade(pct: float) -> str:
    if pct >= 90: return 'A+'
    if pct >= 80: return 'A'
    if pct >= 70: return 'B+'
    if pct >= 60: return 'B'
    if pct >= 50: return 'C+'
    if pct >= 40: return 'C'
    if pct >= 30: return 'D+'
    if pct >= 20: return 'D'
    return 'F'

# Spending categories that signal self-promotion / media management
SELF_PROMO_CATS = {
    '홍보_비용등', '홍보_문자', '언론_기자식대등',
    '언론_광고', '언론_신문구독', '언론_잡지', '언론_연감및도서',
}
POLICY_CATS = {'정책_비용', '정책_도서및교육비'}

def build_consistency_items(
    leg: dict, stated: list[str], actual: list[str],
    primary_area: str, hhi: float, bills_total: int, avg_bills: float,
    spending_total: float, self_promo_pct: float, policy_pct: float,
    bipartisan_rate: float,
) -> list[dict]:
    items = []

    committee = leg.get('CMIT_NM', '') or ''
    is_first_term = leg.get('REELE_GBN_NM', '') == '초선'

    # 1. Committee ↔ actual bill area alignment
    if committee:
        cmit_area = bill_area(committee.split(',')[0].strip())
        aligned = (primary_area == cmit_area) or (cmit_area in actual)
        if aligned and primary_area != '기타':
            items.append({
                'topic': f'{primary_area} 정책',
                'speech_stance': f'{committee.split(",")[0].strip()} 소속 위원 — {primary_area} 전문성 표방',
                'vote_stance': f'실제 발의 법안 {int(hhi * 100)}% 집중도로 {primary_area} 분야에 집중',
                'is_consistent': True,
                'explanation': '위원회 소속과 실제 입법 활동 분야가 일치합니다.',
                'vote_source': f'22대 국회 법안 발의 {bills_total}건 기준',
            })
        elif primary_area != '기타' and cmit_area != '기타':
            items.append({
                'topic': f'{cmit_area} 정책',
                'speech_stance': f'{committee.split(",")[0].strip()} 소속 위원',
                'vote_stance': f'실제 주요 발의 법안은 {primary_area} 분야 — 위원회 분야와 불일치',
                'is_consistent': False,
                'explanation': f'위원회 전문 분야({cmit_area})와 실제 법안 발의 주력 분야({primary_area})가 다릅니다.',
            })

    # 2. Career background ↔ bill activity
    if stated and actual:
        overlap = [a for a in stated if a in actual]
        if overlap:
            items.append({
                'topic': '전문 분야 입법 활동',
                'speech_stance': f'경력 기반 전문 분야: {", ".join(stated[:3])}',
                'vote_stance': f'실제 법안 발의 분야: {", ".join(actual[:3])} — 경력과 일치',
                'is_consistent': True,
                'explanation': '본인의 직업 경력과 실제 입법 활동 분야가 서로 부합합니다.',
            })
        elif stated:
            items.append({
                'topic': '전문 분야 입법 활동',
                'speech_stance': f'경력 기반 전문 분야: {", ".join(stated[:3])}',
                'vote_stance': f'실제 법안 발의 분야: {", ".join(actual[:3]) if actual else "데이터 없음"}',
                'is_consistent': False,
                'explanation': '경력에서 강조된 전문 분야와 실제 발의 법안 분야가 다릅니다.',
            })

    # 3. Activity vs. peers
    if bills_total > avg_bills * 1.4:
        items.append({
            'topic': '입법 활동량',
            'speech_stance': '적극적인 의정 활동 약속',
            'vote_stance': f'발의 {bills_total}건 — 의원 평균 {avg_bills:.0f}건 대비 상위권',
            'is_consistent': True,
            'explanation': '공약대로 동료 의원 평균보다 활발한 법안 발의 실적을 보이고 있습니다.',
            'vote_source': '22대 국회 전체 기준',
        })
    elif bills_total < avg_bills * 0.4 and avg_bills > 10:
        items.append({
            'topic': '입법 활동량',
            'speech_stance': '국민을 위한 적극적인 의정 활동 약속',
            'vote_stance': f'발의 {bills_total}건 — 의원 평균 {avg_bills:.0f}건의 절반에 미달',
            'is_consistent': False,
            'explanation': '법안 발의 건수가 동료 의원 평균의 40% 미만으로 소극적인 의정 활동입니다.',
        })

    # 4. Spending self-promotion
    if spending_total > 0:
        if self_promo_pct > 25:
            items.append({
                'topic': '정치자금 사용 패턴',
                'speech_stance': '청렴하고 투명한 정치 활동 표방',
                'vote_stance': f'정치자금의 {self_promo_pct:.0f}%를 홍보·언론비로 지출 (의원 평균 약 14.5%)',
                'is_consistent': False,
                'explanation': f'홍보·언론비 지출 비율이 의원 평균의 {self_promo_pct / 14.5:.1f}배입니다. 정책보다 이미지 관리에 집중하는 경향이 보입니다.',
            })
        elif policy_pct > 8:
            items.append({
                'topic': '정치자금 사용 패턴',
                'speech_stance': '정책 중심 의정 활동 강조',
                'vote_stance': f'정치자금의 {policy_pct:.0f}%를 정책 연구·도서 비용으로 사용',
                'is_consistent': True,
                'explanation': '정책 연구에 상대적으로 높은 비중을 투자하고 있습니다.',
            })

    # 5. Bipartisan work
    if bipartisan_rate > 20:
        items.append({
            'topic': '초당적 협력',
            'speech_stance': '여야 협치 및 국민 통합 강조',
            'vote_stance': f'발의 법안의 {bipartisan_rate:.0f}%에 타 정당 의원 공동 발의',
            'is_consistent': True,
            'explanation': '실제로 타 정당 의원과의 공동 발의 비율이 높아 초당적 협력이 검증됩니다.',
        })
    elif bipartisan_rate < 3 and bills_total >= 10:
        items.append({
            'topic': '초당적 협력',
            'speech_stance': '초당적 협력 및 국민 통합 강조',
            'vote_stance': f'발의 법안의 {bipartisan_rate:.0f}%만 타 정당과 공동 발의',
            'is_consistent': False,
            'explanation': '타 정당과의 공동 발의 비율이 매우 낮아 당론 중심 입법 활동에 그치고 있습니다.',
        })

    return items[:4]


def main():
    print('🏛️  국회의원 성과 지수 생성 시작')

    # ── Load ──
    raw_leg = load_json(DATA_RAW / 'legislators.json')
    real_leg = load_json(DATA_PUBLIC / 'legislators-real.json')
    bills_raw = load_json(DATA_RAW / 'bills.json')
    funding_raw = load_json(DATA_RAW / 'political-funding.json')
    voting_raw = load_json(DATA_PUBLIC / 'voting-records.json')
    # Load enriched bill metadata if available (from enrich-bills.py)
    enriched_raw = load_json(DATA_PUBLIC / 'bills-enriched.json')
    enriched_by_id: dict[str, dict] = {}
    if enriched_raw:
        for eb in (enriched_raw.get('bills') or []):
            enriched_by_id[eb['BILL_ID']] = eb

    legislators = (raw_leg or {}).get('items', [])
    bills = (bills_raw or {}).get('items', [])
    funding_items = (funding_raw or {}).get('items', [])
    voting_participation = (voting_raw or {}).get('participation', {})
    real_by_mona: dict[str, dict] = {
        leg['MONA_CD']: leg
        for leg in (real_leg or {}).get('legislators', [])
    }

    print(f'  의원: {len(legislators)}명, 법안: {len(bills)}건, 지출: {len(funding_items)}건')

    today = datetime.now().date()
    cutoffs = {
        'week':    today - timedelta(days=7),
        'month':   today - timedelta(days=30),
        'quarter': today - timedelta(days=90),
        'year':    today - timedelta(days=365),
    }

    mona_to_party = {leg['MONA_CD']: leg['POLY_NM'] for leg in legislators}

    # Korean political blocs — cross-bloc cooperation is "true bipartisan" (여야 협치)
    YODANG = {'국민의힘'}                       # 여당 (ruling)
    YADANG = {'더불어민주당', '조국혁신당', '진보당', '사회민주당', '기본소득당'}  # 야당 (opposition)
    CENTER = {'개혁신당', '무소속'}

    def is_cross_bloc(lead_party: str, co_parties: set[str]) -> bool:
        """True if bill crosses 여당-야당 boundary."""
        all_parties = {lead_party} | co_parties
        has_yodang = bool(all_parties & YODANG)
        has_yadang = bool(all_parties & YADANG)
        return has_yodang and has_yadang

    # ── Bill processing ──
    print('📜 법안 분석 중...')
    PASSED = {'원안가결', '수정가결'}
    PARTIAL = {'대안반영폐기', '수정안반영폐기'}  # bill was incorporated — partial legislative credit
    PASSED_MAP = {'원안가결': '통과 (원안)', '수정가결': '통과 (수정)', '대안반영폐기': '대안 반영',
                  '수정안반영폐기': '수정안 반영', '철회': '철회', '폐기': '폐기'}

    BillStats = lambda: {
        'total': 0, 'passed': 0, 'partial': 0, 'pending': 0,
        'week': 0, 'month': 0, 'quarter': 0, 'year': 0,
        'passed_month': 0, 'passed_year': 0,
        'areas': defaultdict(int),
        'bipartisan': 0, 'bipartisan_parties': set(),
        'bill_records': [],  # list of compact bill records for UI display
    }
    bills_by_mona: dict[str, dict] = defaultdict(BillStats)
    cosponsor_count: dict[str, int] = defaultdict(int)

    for bill in bills:
        lead = bill.get('RST_MONA_CD', '')
        if not lead:
            continue

        dt_str = bill.get('PROPOSE_DT', '') or ''
        try:
            dt = datetime.strptime(dt_str, '%Y-%m-%d').date()
        except ValueError:
            dt = None

        result = bill.get('PROC_RESULT', '') or ''
        passed = result in PASSED
        area = bill_area(bill.get('COMMITTEE', ''))

        co_monas = [m.strip() for m in (bill.get('PUBL_MONA_CD') or '').split(',') if m.strip()]
        lead_party = mona_to_party.get(lead, '')
        co_parties_set = {mona_to_party.get(m, '') for m in co_monas if mona_to_party.get(m, '')}
        # "true bipartisan" = crosses 여당-야당 boundary (국민의힘 ↔ 민주당 계열)
        cross_party = is_cross_bloc(lead_party, co_parties_set)

        b = bills_by_mona[lead]
        is_partial = result in PARTIAL
        b['total'] += 1
        b['passed'] += int(passed)
        b['partial'] += int(is_partial)
        b['pending'] += int(not result)
        b['areas'][area] += 1
        if cross_party:
            b['bipartisan'] += 1
            b['bipartisan_parties'].update(p for p in co_parties_set if p and p != lead_party)

        # Compact bill record for UI popup (top 50 by date stored per legislator)
        enriched = enriched_by_id.get(bill.get('BILL_ID', ''), {})
        b['bill_records'].append({
            'BILL_ID': bill.get('BILL_ID', ''),
            'BILL_NAME': bill.get('BILL_NAME', ''),
            'law_name': enriched.get('law_name') or bill.get('BILL_NAME', ''),
            'amendment_type': enriched.get('amendment_type', ''),
            'area': enriched.get('area') or area,
            'status_label': enriched.get('status_label') or (result or '심의 중'),
            'PROC_RESULT': result,
            'PROPOSE_DT': bill.get('PROPOSE_DT', ''),
            'co_sponsor_count': len([m for m in (bill.get('PUBL_MONA_CD') or '').split(',') if m.strip()]),
            'co_proposer_names': (bill.get('PUBL_PROPOSER', '') or '')[:80],
            'plain_title': enriched.get('plain_title', ''),
            'summary': enriched.get('summary', ''),
            'who_affected': enriched.get('who_affected', ''),
            'DETAIL_LINK': bill.get('DETAIL_LINK', ''),
            'passed': passed,
        })

        if dt:
            for period, cutoff in cutoffs.items():
                if dt >= cutoff:
                    b[period] += 1
                    if passed and period in ('month', 'year'):
                        b[f'passed_{period}'] += 1

        for m in co_monas:
            if m:
                cosponsor_count[m] += 1

    # ── Funding processing ──
    print('💰 정치자금 분석 중...')
    funding_by_name: dict[str, dict] = {}
    for row in funding_items:
        name = row.get('의원명', '')
        amount = float(row.get('지출') or 0)
        cat = row.get('분류', '기타') or '기타'
        if not name:
            continue
        if name not in funding_by_name:
            funding_by_name[name] = {'total': 0.0, 'cats': defaultdict(float)}
        funding_by_name[name]['total'] += amount
        funding_by_name[name]['cats'][cat] += amount

    # ── Distribution vectors (for percentile ranking) ──
    all_bills = [bills_by_mona[leg['MONA_CD']]['total'] for leg in legislators]
    all_passage = [
        bills_by_mona[leg['MONA_CD']]['passed'] / max(bills_by_mona[leg['MONA_CD']]['total'], 1) * 100
        for leg in legislators
    ]
    all_effective = [
        (bills_by_mona[leg['MONA_CD']]['passed'] + 0.3 * bills_by_mona[leg['MONA_CD']]['partial'])
        / max(bills_by_mona[leg['MONA_CD']]['total'], 1) * 100
        for leg in legislators
    ]
    all_bipartisan = [
        bills_by_mona[leg['MONA_CD']]['bipartisan'] / max(bills_by_mona[leg['MONA_CD']]['total'], 1) * 100
        for leg in legislators
    ]
    all_spending = [
        funding_by_name.get(leg['HG_NM'], {}).get('total', 0.0)
        for leg in legislators
        if funding_by_name.get(leg['HG_NM'], {}).get('total', 0.0) > 0
    ]

    avg_bills = sum(all_bills) / max(len(all_bills), 1)
    avg_passage = sum(all_passage) / max(len(all_passage), 1)
    avg_spending = sum(all_spending) / max(len(all_spending), 1)
    avg_self_promo = 14.5  # empirical from spending analysis

    print(f'  법안 발의 평균: {avg_bills:.1f}건, 통과율 평균: {avg_passage:.1f}%')

    # ── Per-legislator scores ──
    print('📊 종합 점수 산출 중...')
    results = []

    for leg in legislators:
        mona = leg['MONA_CD']
        name = leg['HG_NM']
        b = bills_by_mona[mona]
        f = funding_by_name.get(name, {'total': 0.0, 'cats': {}})
        v = voting_participation.get(mona, {})

        # Bill stats
        bills_total = b['total']
        bills_passed = b['passed']
        bills_partial = b['partial']  # 대안반영폐기 — bill was incorporated into law
        # Effective bills: passed + 30% credit for incorporated-into-alternative
        bills_effective = round(bills_passed + 0.3 * bills_partial, 1)
        passage_rate = round(bills_passed / max(bills_total, 1) * 100, 1)
        effective_rate = round(bills_effective / max(bills_total, 1) * 100, 1)

        # Policy areas (sorted by count)
        areas_sorted = sorted(b['areas'].items(), key=lambda x: -x[1])
        primary_area = areas_sorted[0][0] if areas_sorted else '기타'
        areas_dict = {k: v for k, v in areas_sorted[:8]}
        hhi = policy_hhi(dict(b['areas']))

        # Stated vs actual focus
        mem_title = leg.get('MEM_TITLE', '') or real_by_mona.get(mona, {}).get('MEM_TITLE', '') or ''
        stated_areas = extract_stated_areas(mem_title)
        actual_areas = list({a for a, _ in areas_sorted[:4] if a != '기타'})

        stated_set, actual_set = set(stated_areas), set(actual_areas)
        union = stated_set | actual_set
        raw_alignment = len(stated_set & actual_set) / max(len(union), 1) if union else 0.0
        # Also boost alignment if committee area matches actual bills
        cmit_area = bill_area((leg.get('CMIT_NM', '') or '').split(',')[0].strip())
        committee_match = int(cmit_area in actual_areas and cmit_area != '기타')
        # Composite alignment: 50% stated-vs-actual, 30% committee-match, 20% specialist bonus
        specialist_bonus = min(hhi, 0.5)  # reward being focused in one area
        alignment = raw_alignment * 0.5 + committee_match * 0.3 + specialist_bonus * 0.4

        # Bipartisan
        bipartisan_bills = b['bipartisan']
        bipartisan_rate = round(bipartisan_bills / max(bills_total, 1) * 100, 1)

        # Spending
        cats = dict(f.get('cats', {}))
        spending_total = f.get('total', 0.0)
        self_promo = sum(cats.get(c, 0) for c in SELF_PROMO_CATS)
        policy_spend = sum(cats.get(c, 0) for c in POLICY_CATS)
        self_promo_pct = round(self_promo / max(spending_total, 1) * 100, 1)
        policy_pct = round(policy_spend / max(spending_total, 1) * 100, 1)

        # Voting
        vote_participation = float(v.get('participation_rate', 0))

        # Percentile scores
        bills_pct = percentile_rank(bills_total, all_bills)
        passage_pct = percentile_rank(passage_rate, all_passage)
        effective_pct = percentile_rank(effective_rate, all_effective)
        bipartisan_pct = percentile_rank(bipartisan_rate, all_bipartisan)
        # WVA: min-max normalize alignment (0-1) → 0-100
        wva_score = round(min(alignment, 1.0) * 100)

        # Composite: quality (effective rate) weighted over quantity (raw bills)
        activity_score = round(
            0.25 * bills_pct +       # volume — working hard
            0.35 * effective_pct +   # quality — work that becomes law
            0.20 * bipartisan_pct +  # collaboration — bridging divides
            0.20 * wva_score         # integrity — words match actions
        )

        # Consistency items (words vs actions narrative)
        consistency_items = build_consistency_items(
            leg, stated_areas, actual_areas, primary_area, hhi,
            bills_total, avg_bills, spending_total, self_promo_pct, policy_pct, bipartisan_rate,
        )

        results.append({
            'MONA_CD': mona,
            'HG_NM': name,
            'POLY_NM': leg.get('POLY_NM', ''),
            'ORIG_NM': leg.get('ORIG_NM', ''),
            'CMIT_NM': leg.get('CMIT_NM', ''),
            'REELE_GBN_NM': leg.get('REELE_GBN_NM', ''),
            'SEX_GBN_NM': leg.get('SEX_GBN_NM', ''),
            'BTH_DATE': leg.get('BTH_DATE', ''),

            # Bill activity
            'bills_total': bills_total,
            'bills_cosponsor': cosponsor_count.get(mona, 0),
            'bills_passed': bills_passed,
            'bills_partial': bills_partial,   # 대안반영폐기 — incorporated into law
            'bills_effective': bills_effective,  # passed + 0.3×partial
            'bills_passage_rate': passage_rate,
            'bills_effective_rate': effective_rate,
            'bills_week': b['week'],
            'bills_month': b['month'],
            'bills_quarter': b['quarter'],
            'bills_year': b['year'],
            'bills_passed_month': b['passed_month'],
            'bills_passed_year': b['passed_year'],
            'bills_pending': b['pending'],

            # Policy focus
            'policy_areas': areas_dict,
            'primary_area': primary_area,
            'policy_concentration': round(hhi, 3),

            # Cross-party collaboration
            'bipartisan_bills': bipartisan_bills,
            'bipartisan_rate': bipartisan_rate,
            'bipartisan_parties': list(b['bipartisan_parties']),

            # Voting participation
            'vote_total': v.get('total_votes', 0),
            'vote_present': v.get('present', 0),
            'vote_absent': v.get('absent', 0),
            'vote_participation_rate': vote_participation,

            # Political funding (2024)
            'spending_total': round(spending_total),
            'spending_breakdown': {k: round(v) for k, v in sorted(cats.items(), key=lambda x: -x[1])[:10]},
            'spending_self_promo_pct': self_promo_pct,
            'spending_policy_pct': policy_pct,

            # Words vs actions
            'stated_focus_areas': stated_areas,
            'actual_focus_areas': actual_areas,
            'words_vs_actions_score': wva_score,
            'consistency_items': consistency_items,

            # Composite scores
            'activity_score': activity_score,
            'bills_percentile': round(bills_pct),
            'effective_percentile': round(effective_pct),
            'bipartisan_percentile': round(bipartisan_pct),
            'grade': letter_grade(activity_score),

            # Recent bills (top 50 by propose date) for UI popup
            'recent_bills': sorted(
                b['bill_records'],
                key=lambda r: r.get('PROPOSE_DT', '') or '',
                reverse=True,
            )[:50],
        })

    # ── Global rankings ──
    rank_specs = [
        ('rank_overall',         'activity_score',      False),
        ('rank_bills_total',     'bills_total',         False),
        ('rank_bills_passed',    'bills_passed',        False),
        ('rank_passage_rate',    'bills_passage_rate',  False),
        ('rank_effective_rate',  'bills_effective_rate', False),
        ('rank_bipartisan',      'bipartisan_rate',     False),
        ('rank_wva',             'words_vs_actions_score', False),
        ('rank_bills_week',      'bills_week',          False),
        ('rank_bills_month',     'bills_month',         False),
        ('rank_bills_quarter',   'bills_quarter',       False),
        ('rank_bills_year',      'bills_year',          False),
        ('rank_spending_total',  'spending_total',      True),   # lower = less waste
        ('rank_self_promo',      'spending_self_promo_pct', True),
    ]
    for rank_field, metric, lower_better in rank_specs:
        ordered = sorted(range(len(results)), key=lambda i: results[i][metric], reverse=not lower_better)
        for rank, idx in enumerate(ordered, 1):
            results[idx][rank_field] = rank

    # ── Save ──
    output = {
        'generated_at': datetime.now().isoformat(),
        'total': len(results),
        'summary': {
            'avg_bills_proposed': round(avg_bills, 1),
            'avg_passage_rate': round(avg_passage, 1),
            'avg_bipartisan_rate': round(sum(all_bipartisan) / max(len(all_bipartisan), 1), 1),
            'avg_spending': round(avg_spending),
        },
        'legislators': results,
    }

    out = DATA_PUBLIC / 'legislator-scores.json'
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, separators=(',', ':'))

    kb = os.path.getsize(out) / 1024
    print(f'\n✅ {len(results)}명 완료 → {out.name} ({kb:.0f}KB)')

    # Summary
    grade_dist: dict[str, int] = {}
    for r in results:
        grade_dist[r['grade']] = grade_dist.get(r['grade'], 0) + 1
    print('\n📊 성적 분포:')
    for g in ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F']:
        if g in grade_dist:
            bar = '█' * (grade_dist[g] // 3)
            print(f'  {g:3s} {grade_dist[g]:3d}명  {bar}')

    print('\n🏆 종합 TOP 5:')
    for r in sorted(results, key=lambda x: -x['activity_score'])[:5]:
        print(f'  {r["HG_NM"]:6s} ({r["POLY_NM"]}) — {r["grade"]} ({r["activity_score"]}점)')

    print('\n📜 법안 발의 TOP 5:')
    for r in sorted(results, key=lambda x: -x['bills_total'])[:5]:
        print(f'  {r["HG_NM"]:6s} {r["bills_total"]}건 (통과 {r["bills_passed"]}건)')

    print('\n🤝 초당적 협력 TOP 5 (발의 10건↑):')
    for r in sorted([r for r in results if r['bills_total'] >= 10], key=lambda x: -x['bipartisan_rate'])[:5]:
        print(f'  {r["HG_NM"]:6s} {r["bipartisan_rate"]}% ({r["bipartisan_bills"]}/{r["bills_total"]}건)')

    print('\n🎯 말행일치 TOP 5:')
    for r in sorted(results, key=lambda x: -x['words_vs_actions_score'])[:5]:
        print(f'  {r["HG_NM"]:6s} {r["words_vs_actions_score"]}점 (경력↔법안: {r["stated_focus_areas"][:2]} vs {r["actual_focus_areas"][:2]})')


if __name__ == '__main__':
    main()
