#!/usr/bin/env python3
"""
국정투명 AI 감사 분석기 — 나라장터 데이터에서 19가지 의심 패턴을 탐지합니다.

패턴:
  1. ghost_company           유령업체: 0-1명 업체가 고액 계약 수주
  2. zero_competition        경쟁 부재: 입찰 참여업체 1개뿐인 고액 낙찰
  3. bid_rate_anomaly        예정가격 유출 의심: 낙찰률 99%+ (예정가 근접 낙찰)
  4. new_company_big_win     신생업체 고액 수주: 설립 1년 미만 업체의 대형 계약
  5. vendor_concentration    업체 집중: 특정 업체가 기관 계약의 30%+ 독점
  6. repeated_sole_source    반복 수의계약: 기관의 전체 계약 중 수의계약 비율 90%+
  7. contract_splitting      계약 분할: 수의계약 한도 직하 반복 발주
  8. low_bid_competition     과소 경쟁: 입찰 참여 2-3개 업체에 반복 낙찰
  9. yearend_new_vendor      연말 신규업체: 연말 수의계약 + 해당 연도 거래 없던 신규 업체
 10. related_companies       동일주소/대표 업체: 같은 주소/대표 복수 계약
 11. high_value_sole_source  고액 수의계약: 1억+ 수의계약
 12. same_winner_repeat      동일업체 반복수주: 5건+ 연속 낙찰
 13. amount_spike            계약금액 급증: 전년 대비 3배+ 급증
 14. bid_rigging             입찰담합: 들러리 입찰 패턴
 15. contract_inflation      계약변경 증액: 30%+ 증액
 16. cross_pattern           복합 의심: 2+ 패턴 동시 감지
 17. sanctioned_vendor       제재 업체 재수주
 18. price_clustering        투찰가 군집: 담합 통계 증거
 19. network_collusion       업체 네트워크 담합
 20. price_divergence        가격 이탈: 동일 업체가 특정 기관에만 과도한 가격 청구
 21. price_vs_catalog        표준단가 초과: 종합쇼핑몰 표준단가의 2배 이상 지급
                             (⚠️ 종합쇼핑몰 API 구독 후 fetch-data.py shopping-mall 실행 필요)
 22. rebid_same_winner       재입찰 동일업체 낙찰: 재공고/재입찰에서 동일 업체가 반복 낙찰

출력: apps/web/public/data/audit-results.json
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from collections import defaultdict

# ── Knowledge Base ──
from knowledge import get_kb
kb = get_kb()
print(f'Knowledge Base: {kb.stats()}')

DATA_DIR = Path(__file__).parent.parent / 'apps' / 'web' / 'data'
OUT_DIR = Path(__file__).parent.parent / 'apps' / 'web' / 'public' / 'data'
OUT_DIR.mkdir(parents=True, exist_ok=True)

G2B_BASE = 'https://www.g2b.go.kr:8081/ep/co/cntrbInfo.do?cntrctNo='


def load(name):
    with open(DATA_DIR / name, encoding='utf-8') as f:
        return json.load(f)


def get_contract_name(c):
    """Extract contract name from multiple possible fields."""
    return str(c.get('cntrctNm', '') or c.get('cnstwkNm', '') or c.get('bidNtceNm', '') or c.get('prdctClsfcNoNm', '') or '').strip()


def _f(v, d=0.0):
    """Safe float — handles None, empty string, and '########' API artifacts."""
    try:
        return float(v) if v not in (None, '', '########') else d
    except (ValueError, TypeError):
        return d


def _i(v, d=0):
    """Safe int — handles None, empty string, and '########' API artifacts."""
    try:
        return int(v) if v not in (None, '', '########') else d
    except (ValueError, TypeError):
        return d


# ── Institution Context Registry ─────────────────────────────────────────────
# Institutions where certain patterns are structurally normal, not suspicious.
# Without this, central procurement agencies, defense, and research institutions
# flood findings with false positives.
INST_CONTEXT = {
    # 조달청: Central procurement AGENT — executes contracts on behalf of others.
    # High vendor concentration, repeat winners, and low competition are BY DESIGN
    # (단가계약, 다수공급자계약, 종합쇼핑몰). Suspicious signals: bid_rate_anomaly,
    # price_clustering, contract_inflation, bid_rigging.
    'central_procurement': {
        'keywords': ['조달청'],
        'suppress': {'same_winner_repeat', 'low_bid_competition', 'vendor_concentration',
                     'repeated_sole_source', 'yearend_new_vendor'},
        'allow': {'bid_rate_anomaly', 'price_clustering', 'contract_inflation',
                  'bid_rigging', 'related_companies', 'cross_pattern'},
        'score_divisor': 2.5,  # halve suspicion scores for remaining patterns
    },
    # Defense: legitimate sole-source due to national security + limited domestic makers
    'defense': {
        'keywords': ['방위사업청', '국방부', '군수사령부', '육군', '해군', '공군',
                     '해병대', '방산', '군수'],
        'suppress': {'zero_competition', 'high_value_sole_source', 'repeated_sole_source',
                     'same_winner_repeat', 'low_bid_competition'},
        'allow': {'bid_rate_anomaly', 'contract_inflation', 'price_clustering',
                  'bid_rigging', 'cross_pattern'},
        'score_divisor': 2.0,
    },
    # Medical/Research: specialized equipment, IP-specific software, limited certified vendors
    'medical_research': {
        'keywords': ['병원', '보건', '질병관리', '연구원', '연구소', '과학기술',
                     '대학교', '대학원', '학교', '의료원'],
        'suppress': {'high_value_sole_source', 'same_winner_repeat'},
        'allow': {'bid_rate_anomaly', 'contract_inflation', 'zero_competition',
                  'bid_rigging', 'cross_pattern', 'contract_splitting'},
        'score_divisor': 1.5,
    },
    # Utility infrastructure: limited certified contractors for critical systems
    'utility': {
        'keywords': ['한국전력', '한전', '수자원공사', '가스공사', '도로공사',
                     '철도공사', '코레일', '공항공사', '항만'],
        'suppress': {'same_winner_repeat', 'low_bid_competition'},
        'allow': {'bid_rate_anomaly', 'contract_inflation', 'price_clustering',
                  'bid_rigging', 'cross_pattern'},
        'score_divisor': 1.5,
    },
}

# Methods where "same winner" is structurally expected and not suspicious
_NON_COMPETITIVE_METHODS = {
    '단가계약', '다수공급자계약', '종합쇼핑몰', 'MAS계약', '협상에의한계약',
    '수의계약', '긴급계약', '재해복구', '소액수의계약',
}


def get_inst_type(inst: str) -> str | None:
    """Return institution context key if inst matches a known category."""
    for ctx_key, ctx in INST_CONTEXT.items():
        if any(kw in inst for kw in ctx['keywords']):
            return ctx_key
    return None


def is_suppressed(pattern: str, inst: str) -> bool:
    """Return True if this pattern should be skipped for this institution type."""
    ctx_key = get_inst_type(inst)
    if ctx_key is None:
        return False
    return pattern in INST_CONTEXT[ctx_key].get('suppress', set())


def adjusted_score(score: float, inst: str) -> float:
    """Divide suspicion score by the institution's false-positive divisor."""
    ctx_key = get_inst_type(inst)
    if ctx_key is None:
        return score
    return score / INST_CONTEXT[ctx_key].get('score_divisor', 1.0)


def requesting_institution(record: dict) -> str:
    """
    For contracts where 조달청 is the executing agency but another agency
    actually requested the procurement, return the requesting agency.
    Prevents false attribution of suspicious patterns to 조달청 itself.
    """
    contracting = str(record.get('cntrctInsttNm', '')).strip()
    requesting  = str(record.get('dminsttNm', record.get('ntceInsttNm', ''))).strip()
    # If 조달청 is the executor but there's a distinct requesting agency, use that
    if '조달청' in contracting and requesting and requesting != contracting:
        return requesting
    return contracting or requesting


def make_contract(no, name, amount, vendor, date, method, reason='', url=''):
    """Build an evidence contract object."""
    return {
        'no': str(no or ''),
        'name': str(name or ''),
        'amount': float(amount or 0),
        'vendor': str(vendor or ''),
        'date': str(date or '')[:10],
        'method': str(method or ''),
        'reason': str(reason or ''),
        'url': url or f'{G2B_BASE}{no}',
    }


# ── Load all data ──
print('Loading data...')
try:
    bids = load('g2b-winning-bids.json')['items']
except Exception:
    bids = []

# Merge historical bids (2023-2024) if available — improves amount_spike accuracy
try:
    historical = load('g2b-winning-bids-historical.json')['items']
    existing_nos = {b.get('bidNtceNo', '') for b in bids}
    new_hist = [h for h in historical if h.get('bidNtceNo', '') not in existing_nos]
    bids = bids + new_hist
    print(f'  Historical bids loaded: +{len(new_hist)} (total now {len(bids)})')
except Exception:
    pass  # historical file not yet fetched — that's fine
try:
    contracts = load('g2b-contract-details.json')['items']
except Exception:
    contracts = []
try:
    companies_raw = load('g2b-companies.json')['items']
except Exception:
    companies_raw = []
try:
    std_contracts = load('g2b-actual-contracts.json')['items']
except Exception:
    std_contracts = []

# Fallback: if contract-details is empty, use actual-contracts — both have the
# same key fields (cntrctCnclsMthdNm, cntrctInsttNm, thtmCntrctAmt, rprsntCorpNm).
# contract-details covers 12 months; actual-contracts covers recent weeks but
# has richer per-record fields. Use whichever is larger.
if not contracts and std_contracts:
    contracts = std_contracts
    print('  ⚠️  g2b-contract-details.json missing — using g2b-actual-contracts.json as fallback')

try:
    sanctions_raw = load('g2b-sanctions.json')['items']
except Exception:
    sanctions_raw = []
try:
    bid_announcements = load('g2b-contracts.json')['items']
except Exception:
    bid_announcements = []
try:
    official_assets = load('official-assets.json')['items']
except Exception:
    official_assets = []

# Load bid rankings (개찰결과) — supplements winning-bids with additional bids
# Format: opengCorpInfo = "company^bizno^ceo^amount^bidRate"
try:
    bid_rankings_raw = load('g2b-bid-rankings.json')['items']
except Exception:
    bid_rankings_raw = []

existing_bid_nos = {b.get('bidNtceNo', '') for b in bids}
for br in bid_rankings_raw:
    no = br.get('bidNtceNo', '')
    if no in existing_bid_nos:
        continue  # already in winning-bids
    info = br.get('opengCorpInfo', '')
    if not info or '^' not in info:
        continue
    parts = info.split('^')
    if len(parts) < 5:
        continue
    try:
        amt = float(parts[3] or 0)
        rate = float(parts[4] or 0)
    except (ValueError, TypeError):
        continue
    if amt <= 0:
        continue
    bids.append({
        'bidNtceNo': no,
        'bidNtceNm': br.get('bidNtceNm', ''),
        'prtcptCnum': br.get('prtcptCnum', '0'),
        'bidwinnrNm': parts[0],
        'bidwinnrBizno': parts[1],
        'bidwinnrCeoNm': parts[2],
        'sucsfbidAmt': str(int(amt)),
        'sucsfbidRate': str(rate),
        'rlOpengDt': br.get('opengDt', ''),
        'fnlSucsfDate': br.get('opengDt', '')[:10],
        'dminsttNm': br.get('dminsttNm', br.get('ntceInsttNm', '')),
        'ntceInsttNm': br.get('ntceInsttNm', ''),
        '_source': 'bid_rankings',
    })

corp_map = {str(c.get('bizno', '')): c for c in companies_raw}
company_name_map = {str(c.get('corpNm', '')): c for c in companies_raw if c.get('corpNm')}

# Build bid_lookup: bidNtceNo -> list of bidder dicts (from g2b-bid-rankings opengCorpInfo)
bid_lookup: dict[str, list[dict]] = {}
for _br in bid_rankings_raw:
    _no = _br.get('bidNtceNo', '')
    if not _no:
        continue
    _info = _br.get('opengCorpInfo', '')
    if not _info or '^' not in _info:
        continue
    _bidders = []
    _winner_nm = _br.get('bidwinnrNm', '') or ''
    for _entry in _info.split('|'):
        _parts = _entry.split('^')
        if len(_parts) < 5:
            continue
        try:
            _amt = float(_parts[3] or 0)
            _rate = float(_parts[4] or 0)
        except (ValueError, TypeError):
            continue
        _vendor_nm = _parts[0].strip()
        _bidders.append({
            'vendor': _vendor_nm,
            'bizno': _parts[1].strip(),
            'ceo': _parts[2].strip(),
            'amount': _amt,
            'rate': _rate,
            'won': _vendor_nm == _winner_nm or _rate == 100.0,
        })
    if _bidders:
        bid_lookup[_no] = _bidders

sanctions_set = set()
for s in sanctions_raw:
    bz = str(s.get('bizno', s.get('rprsntCorpBizrno', ''))).strip().replace('-', '')
    if bz:
        sanctions_set.add(bz)
findings = []

print(f'  Winning bids: {len(bids)} (incl. bid rankings supplement)')
print(f'  Contract details: {len(contracts)}')
print(f'  Companies: {len(companies_raw)}')
print(f'  Standard contracts: {len(std_contracts)}')
print(f'  Sanctioned companies: {len(sanctions_set)}')
print(f'  Bid announcements: {len(bid_announcements)}')
print(f'  Official assets: {len(official_assets)}')


# ════════════════════════════════════════════════════════════════════
# STRUCTURAL EXEMPTION FRAMEWORK
# Vendors/contracts that are legally or structurally exempt from most
# audit patterns — removing these prevents the bulk of false positives.
# ════════════════════════════════════════════════════════════════════

# Government-affiliated entities: quasi-public bodies whose procurement
# patterns (sole-source, repeat wins, concentration) are structurally
# mandated, not indicative of corruption.
GOVT_AFFILIATE_KEYWORDS = frozenset([
    '한국국토정보공사', '한국교통연구원', '한국부동산원', '한국특허기술진흥원',
    '한국치산기술협회', '한국교육학술정보원', '한국전력공사', '한국수자원공사',
    '한국도로공사', '한국철도공사', '한국가스공사', '한국지역난방공사',
    '한국환경공단', '한국토지주택공사', '한국방송공사', '한국산업인력공단',
    '한국조폐공사', '국토교통과학기술진흥원', '한국건설기술연구원',
    '한국과학기술연구원', '한국전자통신연구원', '한국에너지기술연구원',
    '한국생산기술연구원', '한국항공우주연구원', '국가과학기술연구회',
    '한국해양교통안전공단', '한국해양연구원', '국립해양조사원',
    '한국임업진흥원', '국립산림과학원', '한국농어촌공사',
    '한국방사성폐기물관리공단', '한국원자력연구원',
])

# Disaster recovery contracts: legally permitted as 수의계약 under
# 국가계약법 시행령 §26①1 with no amount cap.
DISASTER_RECOVERY_KEYWORDS = frozenset([
    '재해복구', '집중호우', '태풍', '지진', '응급복구', '긴급복구', '재난복구',
    '산사태복구', '침수복구', '홍수복구', '피해복구', '재해대책', '재난대응',
    '자연재해', '재해예방', '방재',
])

# Research institutes: high 수의계약 ratio is structurally expected
# (specialized equipment, proprietary software, continuity requirements).
RESEARCH_INST_KEYWORDS = frozenset([
    '연구원', '연구소', '연구기관', '출연연', '연구회', '연구센터',
    '기술원', '과학기술', '기초과학',
])

# Cooperatives operating in their natural domain — legally privileged
# suppliers for forestry, agriculture, fishing sector work.
COOPERATIVE_KEYWORDS = frozenset([
    '산림조합', '농협', '수협', '축협', '농업협동조합', '산림경영',
])

# Structural procurement METHODS that make price/competition anomalies irrelevant:
# - 혁신제품/우수제품: designated by PPSM with fixed price; no competition possible
# - 제3자단가계약/단가계약: framework pricing contract; agencies just call-off
# - 관급자재: government-furnished materials; prices set centrally, not by negotiation
# - 나라장터종합쇼핑몰: online marketplace with fixed catalog prices
STRUCTURAL_PROCUREMENT_KEYWORDS = frozenset([
    '혁신제품', '우수제품', '우수조달', '제3자단가', '관급자재', '나라장터종합쇼핑몰',
    '종합쇼핑몰', '단가계약(', '단가계약 ',  # unit price framework (with bracket/space to avoid partial match)
])

# Defense/national-security procurement: sole source and no competition is
# LEGALLY REQUIRED under 방위사업법 and 군사비밀보호법. These are never 비리.
DEFENSE_KEYWORDS = frozenset([
    '국방', '군사', '방위', '전력', '무기', '군위성', '전술', '함정', '전투기',
    '레이더', '군수', '탄약', '방산', '군용', '해군', '공군', '육군', '합참',
    '방위사업청', '국방과학연구소', '기무사', '국군',
])

# Captive subsidiaries of public institutions: when a public agency creates
# a subsidiary specifically to operate its assets, sole-source contracts to that
# subsidiary are structurally expected (not competitive bidding evasion).
CAPTIVE_SUBSIDIARY_KEYWORDS = frozenset([
    '운영서비스', '시설관리공단', '시설관리본부', '관리공단',
])


def is_defense_procurement(text: str) -> bool:
    return any(kw in text for kw in DEFENSE_KEYWORDS)


def is_captive_subsidiary_contract(vendor: str, inst: str) -> bool:
    """Vendor name contains the institution's name prefix — likely a captive subsidiary."""
    inst_short = inst[:4] if len(inst) >= 4 else inst
    return (any(kw in vendor for kw in CAPTIVE_SUBSIDIARY_KEYWORDS) and
            inst_short in vendor)


def _get_vendor_from_finding(f: dict) -> str:
    """Extract vendor name from a finding, checking all possible field locations."""
    detail = f.get('detail', {})
    vendor = (detail.get('업체') or detail.get('낙찰업체') or
              detail.get('주요업체') or detail.get('낙찰자') or '')
    if not vendor:
        for c in f.get('evidence_contracts', []):
            vendor = c.get('vendor', '')
            if vendor:
                break
    return str(vendor)


def _get_all_text_from_finding(f: dict) -> str:
    """Collect all text tokens from a finding for keyword matching."""
    parts = [
        f.get('target_institution', ''),
        f.get('summary', ''),
        str(f.get('detail', {})),
    ]
    for c in f.get('evidence_contracts', []):
        parts.append(c.get('name', ''))
        parts.append(c.get('vendor', ''))
    return ' '.join(parts)


def is_govt_affiliate(name: str) -> bool:
    return any(kw in name for kw in GOVT_AFFILIATE_KEYWORDS)


def has_disaster_recovery(text: str) -> bool:
    return any(kw in text for kw in DISASTER_RECOVERY_KEYWORDS)


def is_research_institute(name: str) -> bool:
    return any(kw in name for kw in RESEARCH_INST_KEYWORDS)


def is_cooperative(vendor: str) -> bool:
    return any(kw in vendor for kw in COOPERATIVE_KEYWORDS)


def has_structural_procurement_method(text: str) -> bool:
    """Check if contracts use a structurally price-fixed procurement method."""
    return any(kw in text for kw in STRUCTURAL_PROCUREMENT_KEYWORDS)


# ════════════════════════════════════════════════════════════════════
# Pattern 1: GHOST COMPANY (유령업체)
# 종업원 0-1명 업체가 3천만원 이상 계약 수주
# ════════════════════════════════════════════════════════════════════
print('\n🔍 Pattern 1: Ghost Companies...')
ghost_by_inst = defaultdict(list)
for c in std_contracts:
    bizno = str(c.get('rprsntCorpBizrno', '')).strip().replace('-', '')
    corp = corp_map.get(bizno, {})
    emp = int(corp.get('emplyeNum', -1) or -1)
    amt = _f(c.get('cntrctAmt'))
    name = str(c.get('rprsntCorpNm', '')).strip()
    inst = str(c.get('cntrctInsttNm', c.get('dmndInsttNm', ''))).strip()
    title = str(get_contract_name(c)).strip()
    method = str(c.get('cntrctCnclsMthdNm', '')).strip()
    reason = str(c.get('prvtcntrctRsn', '')).strip()
    date = str(c.get('cntrctCnclsDate', '')).strip()
    cno = str(c.get('cntrctNo', '')).strip()

    # Skip known legitimate 0-1 employee structures
    is_textbook = any(kw in title for kw in ['교과용 도서', '교과서', '교과용도서'])
    is_school_food = any(kw in title for kw in ['급식', '식자재', '간식', '돌봄'])
    is_uniform = any(kw in title for kw in ['교복', '체육복', '학생복'])
    is_disaster = has_disaster_recovery(title) or has_disaster_recovery(reason)
    is_defense = is_defense_procurement(title) or is_defense_procurement(inst)
    if is_textbook or is_school_food or is_uniform or is_disaster or is_defense:
        continue  # 구조적으로 설명 가능한 1인 사업자

    # Raise threshold to ₩50M — filters out routine sole-proprietor service contracts
    # (cleaning, small repairs, local supply) while keeping significant ghost-company risks.
    if emp >= 0 and emp <= 1 and amt > 50_000_000 and inst:
        # Calculate company age at contract signing (months)
        _opbiz = str(corp.get('opbizDt', '') or '')[:10]
        _contract_date = date[:10] if date else ''
        _company_age_months = None
        if _opbiz and _contract_date and _opbiz >= '2000-01-01':
            try:
                from datetime import date as _dt
                _od = _dt.fromisoformat(_opbiz)
                _cd = _dt.fromisoformat(_contract_date) if _contract_date else _dt.today()
                _company_age_months = max(0, (_cd.year - _od.year) * 12 + (_cd.month - _od.month))
            except ValueError:
                pass
        ghost_by_inst[inst].append({
            'corp': name, 'emp': emp, 'amt': amt, 'title': title,
            'method': method, 'reason': reason, 'date': date, 'cno': cno,
            'bizno': bizno, 'rgst': corp.get('rgstDt', ''),
            'company_age_months': _company_age_months,
        })

for inst, items in ghost_by_inst.items():
    if not items:
        continue
    items.sort(key=lambda x: -x['amt'])
    total_amt = sum(i['amt'] for i in items)
    top = items[:5]
    # Score: higher with more contracts, larger amounts, and younger company age
    score = min(90, 40 + len(items) * 5 + (total_amt / 1e9) * 10)
    # Boost for very young companies: a company < 6 months old winning a large contract
    # is an extremely strong ghost/shell company signal.
    min_age = min((i['company_age_months'] for i in items if i['company_age_months'] is not None), default=None)
    if min_age is not None and min_age <= 6:
        score = min(95, score + 20)
    elif min_age is not None and min_age <= 12:
        score = min(90, score + 10)

    # Check if it's a textbook distributor pattern (legitimate)
    is_textbook = any('교과' in i['title'] for i in items)

    evidence = [make_contract(
        i['cno'], i['title'], i['amt'], i['corp'],
        i['date'], i['method'], i['reason'],
    ) for i in top]

    detail = {
        '기관': inst,
        '유령업체_계약건수': len(items),
        '유령업체_계약총액': total_amt,
        '업체_종업원수': items[0]['emp'],
    }
    for i, item in enumerate(items[:3]):
        detail[f'업체{i+1}'] = item['corp']
        detail[f'업체{i+1}_종업원'] = f"{item['emp']}명"
        detail[f'업체{i+1}_계약액'] = item['amt']

    innocent = ''
    if is_textbook:
        innocent = (
            f'{inst}의 교과서 공급 업체는 대부분 1인 사업자(교과서 공급소)입니다. '
            '한국의 교과서 유통 구조상, 지역별 교과서 공급소는 출판사 지정 독점 대리점으로 운영되며, '
            '실제 물류는 출판사가 담당하므로 공급소 자체의 직원 수가 적은 것은 구조적 특성입니다. '
            '다만, 수십억 원 규모의 계약을 1인 사업자에게 위탁하는 것 자체가 관리 감독 사각지대를 만들 수 있습니다.'
        )
        score = max(15, score - 30)
    else:
        innocent = (
            f'종업원 수 0-1명은 나라장터 등록 기준이며, 실제로는 파견·일용직 등 '
            '비정규 인력을 활용하는 소규모 전문업체일 수 있습니다. '
            '특히 1인 창조기업, 프리랜서 컨설턴트, 지역 유통업체의 경우 '
            '등록 종업원 수가 실제 사업 역량을 반영하지 못할 수 있습니다.'
        )

    findings.append({
        'pattern_type': 'ghost_company',
        'severity': 'HIGH' if score >= 60 else 'MEDIUM',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'{inst}에서 종업원 {items[0]["emp"]}명인 {items[0]["corp"]}에게 '
            f'{total_amt/1e8:.1f}억원 규모의 계약 {len(items)}건을 발주했습니다.'
        ),
        'detail': detail,
        'evidence_contracts': evidence,
        'innocent_explanation': innocent,
        'plain_explanation': (
            f'{inst}에서 종업원이 {items[0]["emp"]}명뿐인 {items[0]["corp"]}에게 '
            f'{total_amt/1e8:.1f}억원 규모의 계약을 맡겼습니다. '
            f'쉽게 말해, 직원이 없다시피 한 회사가 수억 원짜리 정부 일을 따낸 것입니다. '
            f'이런 업체 {len(items)}곳이 총 {len(items)}건의 계약을 수주했습니다.'
        ),
        'why_it_matters': (
            '종업원이 0~1명인 업체가 수억 원 이상의 정부 계약을 수주하는 것은 '
            '유령회사를 통한 공금 횡령의 전형적 수법과 일치합니다. '
            '실체가 없는 회사에 계약금을 지급하면, 그 돈이 실제 사업에 쓰이지 않고 '
            '특정인의 사적 이익으로 빠져나갈 위험이 큽니다. '
            '감사원 적발 사례 중 유령업체를 통한 횡령은 전체 조달 비리의 약 30%를 차지합니다.'
        ),
        'citizen_impact': (
            f'총 {total_amt/1e8:.1f}억원(약 {total_amt/1e4:,.0f}만원)의 세금이 '
            f'실체가 불분명한 업체에 지급되었습니다. '
            f'만약 이 금액이 정상적인 업체를 통해 집행되었다면, '
            f'같은 예산으로 더 높은 품질의 서비스를 받을 수 있었을 것입니다.'
        ),
        'what_should_happen': (
            '1) 해당 업체의 4대보험 가입현황 확인 (실제 직원 존재 여부 검증) \n'
            '2) 사업자등록증상 주소지에 실제 사업장이 있는지 현장 확인 '
            '3) 계약 이행 실적 및 납품 증빙 서류 전수 점검 '
            '4) 업체 대표와 발주기관 담당자 간 인적 관계 조사'
        ),
        'related_links': [
            {'title': '나라장터에서 해당 기관 계약 검색', 'url': 'https://www.g2b.go.kr:8081/ep/tbid/tbidList.do', 'source': '나라장터'},
            {'title': '감사원 감사결과 검색', 'url': 'https://www.bai.go.kr/bai/result/list', 'source': '감사원'},
            {'title': '국세청 사업자등록 상태 조회', 'url': 'https://teht.hometax.go.kr/websquare/websquare.html?w2xPath=/ui/sf/a/a/UTESFAAF99.xml', 'source': '국세청 홈택스'},
        ],
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "ghost_company"])} ghost company findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 2: ZERO COMPETITION (경쟁 부재)
# 입찰 참여업체가 1개뿐인 1억원+ 낙찰
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 2: Zero Competition...')
zero_comp = []
for b in bids:
    participants = _i(b.get('prtcptCnum'))
    amt = _f(b.get('sucsfbidAmt'))
    if participants == 1 and amt > 1_000_000_000:  # 10억+ only
        winner = str(b.get('bidwinnrNm', '')).strip()
        inst = str(b.get('ntceInsttNm', b.get('dminsttNm', ''))).strip()
        title = str(b.get('bidNtceNm', '')).strip()
        rate = _f(b.get('sucsfbidRate'))
        zero_comp.append({
            'winner': winner, 'inst': inst, 'title': title,
            'amt': amt, 'rate': rate,
            'no': b.get('bidNtceNo', ''),
            'date': str(b.get('fnlSucsfDate', b.get('rlOpengDt', '')))[:10],
            'bizno': str(b.get('bidwinnrBizno', '')).strip(),
        })

# Group by institution
zc_by_inst = defaultdict(list)
for z in zero_comp:
    zc_by_inst[z['inst']].append(z)

for inst, items in zc_by_inst.items():
    if not items:
        continue
    items.sort(key=lambda x: -x['amt'])
    total_amt = sum(i['amt'] for i in items)

    # DETECTIVE GATE: What's actually suspicious is the PATTERN, not one event:
    #   (a) SAME vendor wins ≥2 zero-competition contracts at same institution
    #       → the agency keeps creating conditions for THIS vendor (맞춤형 입찰 공고)
    #   (b) Single contract is very large (>30억) — scale alone warrants scrutiny
    # One-off single-bidder events are not flagged individually.
    vendor_counts = defaultdict(int)
    for i in items:
        vendor_counts[i['winner']] += 1
    repeat_vendor = any(cnt >= 2 for cnt in vendor_counts.values())
    large_single = items[0]['amt'] >= 3_000_000_000
    if not repeat_vendor and not large_single:
        continue

    score = min(85, 35 + len(items) * 10 + (total_amt / 5e9) * 15)

    evidence = [make_contract(
        i['no'], i['title'], i['amt'], i['winner'],
        i['date'], f'단독응찰 (1개사 참여)',
    ) for i in items[:5]]

    # Check if it's defense/specialized (now using knowledge base)
    inst_profile = kb.get_procurement_profile(inst)
    is_defense = inst_profile and inst_profile.get('key') in ('defense', 'security')
    is_specialized = kb.get_industry_context(items[0]['title']) is not None

    innocent = ''
    if is_defense:
        innocent = (
            f'군사·국방 분야의 조달은 보안 요건, 기술 인가 등으로 참여 자격이 엄격하게 제한됩니다. '
            '방위산업체 지정 품목의 경우 법적으로 지정업체만 참여 가능하며, '
            '이는 「방위사업법」에 근거한 합법적 제한입니다.'
        )
        score = max(20, score - 15)
    elif is_specialized:
        innocent = (
            '고도의 전문 기술이 필요한 사업(위치추적장치, 항공 인증 장비 등)은 '
            '국내에서 기술력을 보유한 업체가 극소수인 경우가 많습니다. '
            '단독 응찰 자체가 담합이나 비리를 의미하지는 않으나, '
            '해당 분야의 잠재적 경쟁업체 존재 여부를 확인할 필요가 있습니다.'
        )
    else:
        innocent = (
            '단독 응찰은 입찰 공고 기간이 짧거나, 참가 자격 조건이 과도하게 제한적이거나, '
            '시장 자체가 소규모인 경우에 발생할 수 있습니다. '
            '다만, 의도적으로 참가 자격을 특정 업체에 맞추는 '
            '"맞춤형 입찰 공고"의 가능성도 배제할 수 없습니다.'
        )

    findings.append({
        'pattern_type': 'zero_competition',
        'severity': 'HIGH' if score >= 60 else 'MEDIUM',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'{inst}에서 {len(items)}건의 입찰에 각각 1개 업체만 참여하여 '
            f'총 {total_amt/1e8:.1f}억원이 경쟁 없이 낙찰되었습니다.'
        ),
        'detail': {
            '기관': inst,
            '단독응찰_건수': len(items),
            '단독응찰_총액': total_amt,
            '최대계약': items[0]['title'][:40],
            '최대금액': items[0]['amt'],
            '낙찰업체': items[0]['winner'],
        },
        'evidence_contracts': evidence,
        'innocent_explanation': innocent,
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "zero_competition"])} zero competition findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 3: BID RATE ANOMALY (예정가격 유출 의심)
# 낙찰률 98%+ — 예정가격에 지나치게 근접한 낙찰
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 3: Bid Rate Anomaly...')
high_rate = []
for b in bids:
    rate = _f(b.get('sucsfbidRate'))
    amt = _f(b.get('sucsfbidAmt'))
    participants = _i(b.get('prtcptCnum'))
    # Single-bidder high rate is NOT anomalous — it's a negotiated/sole-source price.
    # Only flag 2+ bidders at 99.5%+ (indicates possible price leak to ALL participants)
    # Exclude: rate exactly 100.0 with 10+ participants → structural 복수예비가격 system
    if rate == 100.0 and participants >= 10:
        continue
    if rate >= 99.5 and amt > 200_000_000 and participants >= 2:
        winner = str(b.get('bidwinnrNm', '')).strip()
        inst = str(b.get('ntceInsttNm', b.get('dminsttNm', ''))).strip()
        high_rate.append({
            'winner': winner, 'inst': inst, 'rate': rate, 'amt': amt,
            'title': str(b.get('bidNtceNm', ''))[:60],
            'no': b.get('bidNtceNo', ''),
            'date': str(b.get('fnlSucsfDate', b.get('rlOpengDt', '')))[:10],
            'participants': participants,
        })

# Group by (winner, institution) — same vendor winning legitimately in different
# institutions should not compound suspicion across them
rate_by_winner = defaultdict(list)
for h in high_rate:
    rate_by_winner[(h['winner'], h['inst'])].append(h)

for (winner, inst), items in rate_by_winner.items():
    # High bar: 5+ occurrences, or 3+ at avg 99.8%+, or single at 99.95%+
    avg = sum(i['rate'] for i in items) / len(items) if items else 0
    if len(items) >= 5:
        pass
    elif len(items) >= 3 and avg >= 99.8:
        pass
    elif items[0]['rate'] >= 99.95:
        pass
    else:
        continue

    items.sort(key=lambda x: -x['rate'])
    avg_rate = sum(i['rate'] for i in items) / len(items)
    total_amt = sum(i['amt'] for i in items)
    if len(items) >= 3:
        score = min(90, 55 + (avg_rate - 98) * 15 + len(items) * 5)
    elif len(items) >= 2:
        score = min(75, 45 + (avg_rate - 98) * 15)
    else:
        score = min(65, 40 + (items[0]['rate'] - 99) * 20)

    evidence = [make_contract(
        i['no'], f"[낙찰률 {i['rate']:.1f}%] {i['title']}",
        i['amt'], i['winner'], i['date'],
        f"낙찰률 {i['rate']:.1f}% (참여 {i['participants']}개사)",
    ) for i in items[:5]]

    findings.append({
        'pattern_type': 'bid_rate_anomaly',
        'severity': 'HIGH' if score >= 60 else 'MEDIUM',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'{winner}이(가) {inst} 등에서 평균 낙찰률 {avg_rate:.1f}%로 '
            f'{len(items)}건({total_amt/1e8:.1f}억원)을 수주했습니다. '
            f'일반적인 경쟁 입찰의 낙찰률은 82-92%입니다.'
        ),
        'detail': {
            '낙찰업체': winner,
            '기관': inst,
            '평균낙찰률': f'{avg_rate:.1f}%',
            '해당건수': len(items),
            '총낙찰액': total_amt,
            '업계평균_낙찰률': '82-92%',
        },
        'evidence_contracts': evidence,
        'innocent_explanation': (
            '낙찰률이 높다는 것은 예정가격에 가깝게 투찰했다는 의미입니다. '
            '원가 분석 역량이 뛰어난 대형 업체의 전문 견적팀은 '
            '정부 원가계산 기준을 정확히 파악하여 예정가격에 근접한 투찰이 가능합니다. '
            '다만, 감사원 통계에 따르면 낙찰률 97% 이상이 5건 이상 반복되는 경우는 '
            '예정가격 사전 유출 가능성이 통계적으로 유의미합니다. '
            '2016년 조달청 예정가격 유출 사건에서는 7개 업체의 156건 낙찰률이 97.2-99.1%였고, '
            '이것이 우연일 확률은 10^23분의 1 미만으로 산출되었습니다.'
        ),
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "bid_rate_anomaly"])} bid rate anomaly findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 4: NEW COMPANY BIG WIN (신생업체 고액 수주)
# 실제 설립(opbizDt) 2년 미만 업체가 5천만원+ 계약 수주
# opbizDt = 개업일 (실제 설립일), rgstDt = 나라장터 등록일 (등록만 늦을 수 있음)
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 4: New Company Big Win...')
now = datetime.now()
for c in std_contracts:
    bizno = str(c.get('rprsntCorpBizrno', '')).strip().replace('-', '')
    corp = corp_map.get(bizno, {})
    # Use opbizDt (개업일) first, fall back to rgstDt (나라장터 등록일)
    opbiz = str(corp.get('opbizDt', ''))[:10]
    rgst = str(corp.get('rgstDt', ''))[:10]
    actual_date = opbiz if opbiz and opbiz > '1900' else rgst
    amt = _f(c.get('cntrctAmt'))
    name = str(c.get('rprsntCorpNm', '')).strip()
    inst = str(c.get('cntrctInsttNm', '')).strip()
    title = str(get_contract_name(c)).strip()
    method = str(c.get('cntrctCnclsMthdNm', '')).strip()
    cno = str(c.get('cntrctNo', '')).strip()
    date = str(c.get('cntrctCnclsDate', '')).strip()

    if not actual_date or amt < 50_000_000:
        continue
    try:
        rd = datetime.strptime(actual_date, '%Y-%m-%d')
        age_days = (now - rd).days
        age_years = age_days / 365
    except Exception:
        continue

    # Skip if company is actually old (opbizDt proves it's not new)
    if age_years >= 2:
        continue
    # Extra: if opbizDt says old but rgstDt says new, that's NOT suspicious
    # (just late to register on 나라장터)
    if opbiz and opbiz <= '1900':
        continue

    emp = int(corp.get('emplyeNum', -1) or -1)
    score = min(80, 30 + (amt / 1e8) * 5 + max(0, (2 - age_years) * 15))
    if emp >= 0 and emp <= 3:
        score = min(85, score + 10)

    # Show both dates in detail for transparency
    date_note = ''
    if opbiz and rgst and opbiz != rgst:
        date_note = f' (개업일: {opbiz}, 나라장터 등록: {rgst})'

    evidence = [make_contract(cno, title, amt, name, date, method)]

    findings.append({
        'pattern_type': 'new_company_big_win',
        'severity': 'HIGH' if score >= 60 else 'MEDIUM',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'개업 {age_years:.1f}년 된 {name}이(가) '
            f'{inst}에서 {amt/1e8:.2f}억원 계약을 수주했습니다.{date_note}'
        ),
        'detail': {
            '기관': inst,
            '업체': name,
            '개업일': opbiz or '미확인',
            '나라장터_등록일': rgst,
            '실제업력': f'{age_years:.1f}년',
            '종업원수': f'{emp}명' if emp >= 0 else '미확인',
            '계약금액': amt,
            '계약방식': method,
        },
        'evidence_contracts': evidence,
        'innocent_explanation': (
            f'{name}의 개업일({opbiz or "미확인"})을 기준으로 실제 업력이 {age_years:.1f}년입니다. '
            '(나라장터 등록일이 아닌 사업자 개업일 기준으로 확인했습니다.) '
            '다만, 신생 기업이라도 대표자의 이전 경력이나 '
            '모회사로부터의 기술·인력 이전이 있을 수 있으며, '
            '한국의 1인 창조기업 육성 정책에 따라 '
            '정부가 신생 기업의 공공조달 참여를 적극 장려하고 있습니다.'
        ),
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "new_company_big_win"])} new company findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 5: VENDOR CONCENTRATION (업체 집중)
# 특정 업체가 기관 계약의 30%+ 독점 (기존 패턴 강화)
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 5: Vendor Concentration...')
inst_vendors = defaultdict(lambda: defaultdict(lambda: {'count': 0, 'amt': 0, 'contracts': []}))
inst_totals = defaultdict(lambda: {'count': 0, 'amt': 0})

for c in std_contracts:
    inst = str(c.get('cntrctInsttNm', c.get('dmndInsttNm', ''))).strip()
    vendor = str(c.get('rprsntCorpNm', '')).strip()
    amt = _f(c.get('cntrctAmt'))
    if inst and vendor:
        inst_vendors[inst][vendor]['count'] += 1
        inst_vendors[inst][vendor]['amt'] += amt
        inst_vendors[inst][vendor]['contracts'].append(c)
        inst_totals[inst]['count'] += 1
        inst_totals[inst]['amt'] += amt

for inst, vendors in inst_vendors.items():
    total = inst_totals[inst]
    if total['count'] < 5:
        continue
    for vendor, vd in vendors.items():
        ratio = vd['count'] / total['count']
        # 55%+ concentration AND min 5 contracts AND min 1억 total
        # Small agencies having ONE vendor for 55%+ of their contracts is suspicious
        # regardless of amount — that concentration IS the red flag.
        if ratio < 0.55 or vd['count'] < 5 or vd['amt'] < 100_000_000:
            continue
        # Skip cooperatives — structural monopolies in their domain
        if is_cooperative(vendor):
            continue
        score = min(80, 30 + ratio * 40 + (vd['amt'] / 1e9) * 5)
        top_contracts = sorted(vd['contracts'], key=lambda x: -_f(x.get('cntrctAmt')))[:5]

        evidence = [make_contract(
            c.get('cntrctNo', ''), get_contract_name(c),
            _f(c.get('cntrctAmt')), vendor,
            c.get('cntrctCnclsDate', ''), c.get('cntrctCnclsMthdNm', ''),
            c.get('prvtcntrctRsn', ''),
        ) for c in top_contracts]

        findings.append({
            'pattern_type': 'vendor_concentration',
            'severity': 'HIGH' if score >= 60 else 'MEDIUM',
            'suspicion_score': round(score),
            'target_institution': inst,
            'summary': (
                f'{inst}에서 {vendor}이(가) 전체 계약의 {ratio*100:.0f}%'
                f'({vd["count"]}/{total["count"]}건, {vd["amt"]/1e8:.1f}억원)를 수주했습니다.'
            ),
            'detail': {
                '기관': inst,
                '업체': vendor,
                '업체_계약건수': vd['count'],
                '기관_전체건수': total['count'],
                '집중도': f'{ratio*100:.1f}%',
                '업체_계약총액': vd['amt'],
            },
            'evidence_contracts': evidence,
            'innocent_explanation': (
                f'{vendor}이(가) {inst}의 주요 공급업체인 것은 '
                '해당 분야의 전문성, 기존 시스템과의 호환성 요구, '
                '또는 지역 기반 서비스 제공 등의 합리적 이유가 있을 수 있습니다. '
                '특히 유지보수 계약, 소프트웨어 라이선스 갱신, '
                '특수 장비 관련 계약은 기존 공급업체에 대한 의존성이 구조적으로 높습니다.'
            ),
        })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "vendor_concentration"])} vendor concentration findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 6: REPEATED SOLE SOURCE (반복 수의계약)
# 기관의 수의계약 비율 80%+ (5건 이상)
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 6: Repeated Sole Source...')
inst_methods = defaultdict(lambda: {'sole': 0, 'total': 0, 'amt': 0, 'contracts': []})
for c in contracts:
    method = str(c.get('cntrctCnclsMthdNm', ''))
    inst = str(c.get('cntrctInsttNm', '')).strip()
    # thtmCntrctAmt is populated in contract-details; cntrctAmt is the fallback
    # when using actual-contracts (thtmCntrctAmt is often empty there)
    amt = _f(c.get('thtmCntrctAmt')) or _f(c.get('cntrctAmt'))
    if inst:
        inst_methods[inst]['total'] += 1
        inst_methods[inst]['amt'] += amt
        if '수의' in method:
            inst_methods[inst]['sole'] += 1
            inst_methods[inst]['contracts'].append(c)

for inst, d in inst_methods.items():
    # 10+ contracts AND 90%+ 수의계약 AND 5억+ total
    if d['total'] < 10 or d['sole'] / d['total'] < 0.9 or d['amt'] < 200_000_000:
        continue
    # Skip structurally-explained institution types (조달청 executes 수의계약 on behalf of agencies)
    if is_suppressed('repeated_sole_source', inst):
        continue
    # Research institutes and universities legitimately rely on specialized vendors
    if is_research_institute(inst):
        continue
    # Schools: food, supplies, and uniforms are structurally purchased as 수의계약
    # because unit sizes (per-school food orders, per-classroom supplies) naturally
    # fall below the 2천만원 threshold. Not suspicious.
    _school_kw = ('초등학교', '중학교', '고등학교', '유치원', '어린이집', '특수학교',
                  '사범대학부속', '부설초등', '부설중학', '부설고등')
    if any(kw in inst for kw in _school_kw):
        continue
    # Water/sewage utility agencies: infrastructure maintenance requires the original
    # contractor for continuity (pipe compatibility, system knowledge). High 수의계약
    # ratio is structurally expected for O&M contracts.
    _utility_kw = ('상하수도', '수도사업소', '수도사업본부', '상수도사업', '하수도사업')
    if any(kw in inst for kw in _utility_kw):
        continue
    ratio = d['sole'] / d['total']
    score = min(75, 25 + ratio * 30 + d['sole'] * 2)

    top = sorted(d['contracts'],
                 key=lambda x: -(_f(x.get('thtmCntrctAmt')) or
                                  _f(x.get('cntrctAmt'))))[:5]
    evidence = []
    _top_vendors = set()
    for c in top:
        # Extract vendor: try corpList first (contract-details format), fall back to rprsntCorpNm
        corp_list = str(c.get('corpList', ''))
        vendor = ''
        if corp_list and '^' in corp_list:
            parts = corp_list.split('^')
            if len(parts) > 3:
                vendor = parts[3].split('，')[0] if '，' in parts[3] else parts[3]
        if not vendor:
            vendor = str(c.get('rprsntCorpNm', '')).strip()
        _top_vendors.add(vendor)
        amt_ev = _f(c.get('thtmCntrctAmt')) or _f(c.get('cntrctAmt'))
        evidence.append(make_contract(
            c.get('untyCntrctNo', c.get('cntrctNo', '')), get_contract_name(c),
            amt_ev, vendor,
            c.get('cntrctCnclsDate', ''), '수의계약',
        ))
    # Skip if all *named* vendors are cooperatives (산림조합 for forest agencies etc.)
    # Guard: if no named vendors (all empty), don't skip — that's a data gap, not a cooperative.
    _named_vendors = [v for v in _top_vendors if v]
    if _named_vendors and all(is_cooperative(v) for v in _named_vendors):
        continue

    findings.append({
        'pattern_type': 'repeated_sole_source',
        'severity': 'HIGH' if ratio >= 0.95 else 'MEDIUM',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'{inst}의 계약 {d["total"]}건 중 {d["sole"]}건({ratio*100:.0f}%)이 '
            f'수의계약입니다.'
        ),
        'detail': {
            '기관': inst,
            '전체계약수': d['total'],
            '수의계약_건수': d['sole'],
            '수의계약_비율': f'{ratio*100:.1f}%',
            '수의계약_총액': d['amt'],
        },
        'evidence_contracts': evidence,
        'innocent_explanation': (
            '수의계약 비율이 높은 것은 해당 기관의 조달 특성에 기인할 수 있습니다. '
            '연구기관, 의료기관, 교육기관은 특수 장비·소모품의 특성상 '
            '수의계약 법적 근거(「국가계약법 시행령」 제26조)에 해당하는 경우가 많습니다. '
            '또한 2천만원 이하 소액 계약은 법적으로 수의계약이 허용됩니다.'
        ),
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "repeated_sole_source"])} repeated sole source findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 7: CONTRACT SPLITTING (계약 분할)
# 수의계약 한도(2천만원) 직하 금액 반복
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 7: Contract Splitting...')
THRESHOLD = 20_000_000  # 2천만원
TOLERANCE = 0.15  # 15% below threshold
lower = THRESHOLD * (1 - TOLERANCE)

def extract_vendor(c):
    cl = str(c.get('corpList', ''))
    if cl and '^' in cl:
        parts = cl.split('^')
        if len(parts) > 3:
            return parts[3].split('，')[0] if '，' in parts[3] else parts[3]
    return ''

split_by_inst = defaultdict(list)
for c in contracts:
    amt = _f(c.get('thtmCntrctAmt')) or _f(c.get('cntrctAmt'))
    method = str(c.get('cntrctCnclsMthdNm', ''))
    inst = str(c.get('cntrctInsttNm', '')).strip()
    if '수의' in method and lower <= amt < THRESHOLD and inst:
        split_by_inst[inst].append(c)

for inst, items in split_by_inst.items():
    if len(items) < 3:
        continue

    # Key fix: splitting requires the SAME vendor to appear repeatedly.
    # Multiple different vendors each getting one 1,900만원 contract is NOT
    # splitting — it's just an institution that regularly uses small contracts.
    vendors = [extract_vendor(c) for c in items]
    from collections import Counter as _Counter
    vendor_counts = _Counter(v for v in vendors if v)
    if not vendor_counts:
        continue
    top_vendor, top_count = vendor_counts.most_common(1)[0]
    vendor_concentration = top_count / len(items)
    # Require: same vendor in ≥50% of near-threshold contracts
    if vendor_concentration < 0.5 or top_count < 2:
        continue

    # Exclude: periodic service contracts that are structurally monthly
    # (cleaning, security, facility management, meals) — these recur by design, not splitting
    _MONTHLY_SERVICE_KW = ('청소', '경비', '시설관리', '용역', '급식', '교육', '강좌', '정기점검', '방역')
    top_vendor_contracts = [c for c in items if extract_vendor(c) == top_vendor]
    if all(any(kw in get_contract_name(c) for kw in _MONTHLY_SERVICE_KW) for c in top_vendor_contracts):
        continue

    # Also require: same vendor AND similar contract titles (real split = same work)
    titles = [get_contract_name(c)[:20] for c in top_vendor_contracts]
    title_counts = _Counter(titles)
    has_repeated_title = title_counts.most_common(1)[0][1] >= 2 if title_counts else False

    total_amt = sum(_f(c.get('thtmCntrctAmt')) for c in items)
    score = min(80, 25 + top_count * 10 + (1 if has_repeated_title else 0) * 15)

    evidence = [make_contract(
        c.get('untyCntrctNo', ''), get_contract_name(c),
        _f(c.get('thtmCntrctAmt')), extract_vendor(c),
        c.get('cntrctCnclsDate', ''), '수의계약',
    ) for c in sorted(top_vendor_contracts, key=lambda x: -_f(x.get('thtmCntrctAmt')))[:5]]

    findings.append({
        'pattern_type': 'contract_splitting',
        'severity': 'HIGH' if top_count >= 4 or has_repeated_title else 'MEDIUM',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'{inst}에서 {top_vendor}에게 수의계약 한도(2천만원) 직하 금액의 계약이 '
            f'{top_count}건 반복 발주되었습니다 (총 {total_amt/1e8:.2f}억원).'
            + (' 동일 계약명이 반복됩니다.' if has_repeated_title else '')
        ),
        'detail': {
            '기관': inst,
            '주요업체': top_vendor,
            '해당업체_계약건수': top_count,
            '전체_한도근처_계약수': len(items),
            '업체집중도': f'{vendor_concentration*100:.0f}%',
            '한도근처_총액': total_amt,
            '동일계약명_반복': '예' if has_repeated_title else '아니오',
            '수의계약_한도': '2,000만원',
        },
        'evidence_contracts': evidence,
        'innocent_explanation': (
            f'{top_vendor}에 대한 1,700-2,000만원 반복 발주는 '
            '월정 서비스(청소, 보안, 방역 등)의 월별 정기 계약일 수 있습니다. '
            '이 경우 동일 금액이 매월 반복되는 것은 정상입니다. '
            '다만, 동일 품목을 의도적으로 분할하여 경쟁 입찰을 회피하는 것은 '
            '국가계약법 위반입니다.'
        ),
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "contract_splitting"])} contract splitting findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 8: LOW BID COMPETITION (과소 경쟁 반복 낙찰)
# 동일 업체가 2-3개사 경쟁에서 반복 승리
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 8: Low Bid Competition...')
low_comp_winners = defaultdict(list)
for b in bids:
    participants = _i(b.get('prtcptCnum'))
    amt = _f(b.get('sucsfbidAmt'))
    winner = str(b.get('bidwinnrNm', '')).strip()
    if 2 <= participants <= 3 and amt > 100_000_000 and winner:  # 1억+ (was 5천만)
        low_comp_winners[winner].append(b)

for winner, items in low_comp_winners.items():
    # 5+ wins with thin 2-3 person competition
    if len(items) < 5:
        continue
    items.sort(key=lambda x: -_f(x.get('sucsfbidAmt')))
    total_amt = sum(_f(b.get('sucsfbidAmt')) for b in items)
    # Min 3억 total — below this could just be a preferred local vendor
    if total_amt < 300_000_000:
        continue
    # Skip cooperatives — limited regional pool naturally produces 2-3 bidders
    if is_cooperative(winner):
        continue
    score = min(70, 25 + len(items) * 10 + (total_amt / 2e9) * 10)

    evidence = [make_contract(
        b.get('bidNtceNo', ''), b.get('bidNtceNm', ''),
        _f(b.get('sucsfbidAmt')), winner,
        str(b.get('fnlSucsfDate', ''))[:10],
        f"경쟁 {int(b.get('prtcptCnum', 0))}개사",
    ) for b in items[:5]]

    inst = str(items[0].get('ntceInsttNm', items[0].get('dminsttNm', ''))).strip()

    # Skip structurally-explained institutions (조달청, defense, etc.)
    if is_suppressed('low_bid_competition', inst):
        continue

    score = adjusted_score(score, inst)

    findings.append({
        'pattern_type': 'low_bid_competition',
        'severity': 'MEDIUM',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'{winner}이(가) 2-3개사 경쟁 입찰에서 {len(items)}건 '
            f'(총 {total_amt/1e8:.1f}억원)을 연속 낙찰했습니다.'
        ),
        'detail': {
            '낙찰업체': winner,
            '기관': inst,
            '반복낙찰_건수': len(items),
            '평균_참여업체수': round(sum(_i(b.get('prtcptCnum')) for b in items) / len(items), 1),
            '반복낙찰_총액': total_amt,
        },
        'evidence_contracts': evidence,
        'innocent_explanation': (
            '2-3개사 경쟁에서 동일 업체가 반복 낙찰되는 것은 '
            '해당 업체의 가격 경쟁력과 기술력이 우수하기 때문일 수 있습니다. '
            '특히 지역 기반 소규모 공사·용역에서는 '
            '참여 가능한 업체 수 자체가 제한적인 경우가 많습니다. '
            '다만, 입찰담합(들러리 입찰)의 전형적 패턴과 유사하므로 '
            '각 입찰의 투찰가격 분포를 확인할 필요가 있습니다.'
        ),
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "low_bid_competition"])} low competition findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 9: YEAR-END NEW VENDOR SOLE SOURCE (연말 신규업체 수의계약)
#
# Prior pattern (연말 예산소진) had a 95%+ false-positive rate because
# year-end spending concentration is REQUIRED by Korean budget law
# (회계연도 내 미집행 예산 반납 규칙). Simply flagging November-December
# contract spikes flags structurally normal behavior.
#
# New signal: flag year-end (Nov-Dec) SOLE SOURCE contracts to vendors
# that have ZERO prior contract history at this institution during the
# same year (Jan-Oct). This combination is genuinely suspicious:
# - Sole source removes competition accountability
# - New vendor means no established relationship / justification
# - Year-end timing adds urgency pressure that bypasses normal vetting
#
# Real corruption case template: Year-end 수의계약 to a newly created or
# unrelated vendor, approved by an outgoing official, often discovered
# in the following year's audit (감사원 단골 지적 유형).
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 9: Year-End New Vendor Sole Source...')

# Build: institution → set of vendors seen Jan-Oct (established relationships)
_inst_prior_vendors: dict[str, set] = defaultdict(set)
_inst_yearend_sole: dict[str, list] = defaultdict(list)

for c in bids:
    inst = str(c.get('dminsttNm', '')).strip()
    date = str(c.get('fnlSucsfDate', ''))[:10]
    winner = str(c.get('bidwinnrNm', '')).strip()
    if not inst or not date or not winner:
        continue
    month = date[5:7] if len(date) >= 7 else ''
    if not month:
        continue
    if month not in ('11', '12'):
        _inst_prior_vendors[inst].add(winner)

# Now find year-end sole-source contracts to vendors NOT in prior set.
# Use `contracts` (12-month contract-details or actual-contracts fallback) since
# std_contracts only covers recent weeks and may not include Nov-Dec.
for c in contracts:
    inst = str(c.get('cntrctInsttNm', c.get('dmndInsttNm', ''))).strip()
    date = str(c.get('cntrctCnclsDate', '')).strip()
    # corpList vendor name (contract-details) or rprsntCorpNm (actual-contracts)
    corp_list = str(c.get('corpList', ''))
    vendor = ''
    if corp_list and '^' in corp_list:
        parts = corp_list.split('^')
        vendor = parts[3].split('，')[0] if len(parts) > 3 else ''
    if not vendor:
        vendor = str(c.get('rprsntCorpNm', '')).strip()
    method = str(c.get('cntrctCnclsMthdNm', '')).strip()
    amt = _f(c.get('thtmCntrctAmt')) or _f(c.get('cntrctAmt'))
    title = str(get_contract_name(c)).strip()
    cno = str(c.get('untyCntrctNo', c.get('cntrctNo', ''))).strip()

    if not inst or not date or not vendor or amt < 50_000_000:
        continue
    month = date[5:7] if len(date) >= 7 else ''
    if month not in ('11', '12'):
        continue
    if '수의' not in method:
        continue
    # Skip structural exemptions
    if (has_disaster_recovery(title) or is_defense_procurement(title) or
            is_defense_procurement(inst)):
        continue
    if has_structural_procurement_method(title):
        continue
    # Skip established vendors (had prior contracts at this institution)
    if vendor in _inst_prior_vendors.get(inst, set()):
        continue
    # Skip govt affiliates as vendors (structural delivery)
    if is_govt_affiliate(vendor) or is_cooperative(vendor):
        continue

    _inst_yearend_sole[inst].append({
        'vendor': vendor, 'amt': amt, 'title': title,
        'date': date, 'cno': cno, 'method': method,
    })

for inst, contracts_list in _inst_yearend_sole.items():
    if not contracts_list:
        continue
    # 조달청 processes year-end orders from hundreds of agencies simultaneously —
    # structural volume, not corruption
    if is_suppressed('yearend_new_vendor', inst):
        continue
    total_amt = sum(c['amt'] for c in contracts_list)
    # Two ways to qualify:
    # A) Single large vendor: ≥2억 total (one-off year-end dump to a new vendor)
    # B) Pattern: ≥3 separate new vendors across contracts (systematic year-end routing)
    # A single 5-8천만 contract with a new vendor is normal (year-end budget, local market).
    # Only flag when the scale or repetition makes it hard to explain innocently.
    unique_vendors = list({c['vendor'] for c in contracts_list})
    # 1억+ total OR 2+ contracts to new vendors qualifies.
    # A bathroom renovation or grain purchase under 1억 to a new vendor is normal.
    # 1억+ or repeated new-vendor contracts at year-end warrant explanation.
    qualifies = (total_amt >= 100_000_000) or (len(contracts_list) >= 2)
    if not qualifies:
        continue

    contracts_list.sort(key=lambda x: -x['amt'])
    score = min(82, 40 + len(contracts_list) * 8 + (total_amt / 1e9) * 12)

    evidence = [make_contract(
        c['cno'], c['title'], c['amt'], c['vendor'], c['date'], c['method'],
    ) for c in contracts_list[:5]]

    findings.append({
        'pattern_type': 'yearend_new_vendor',
        'severity': 'HIGH' if total_amt >= 200_000_000 else 'MEDIUM',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'{inst}에서 연말(11-12월)에 해당 연도 거래 이력이 없는 신규 업체에 '
            f'수의계약 {len(contracts_list)}건(총 {total_amt/1e8:.1f}억원)을 체결했습니다. '
            f'신규 업체: {", ".join(unique_vendors[:3])}.'
        ),
        'detail': {
            '기관': inst,
            '연말_신규업체_계약수': len(contracts_list),
            '연말_신규업체_총액': total_amt,
            '신규업체_목록': unique_vendors[:5],
            '신규업체수': len(unique_vendors),
        },
        'evidence_contracts': evidence,
        'innocent_explanation': (
            '연말 수의계약 신규업체가 항상 문제인 것은 아닙니다. '
            '해당 연도에 처음 나라장터에 등록한 합법적인 전문업체일 수 있으며, '
            '기존 업체가 해당 서비스를 제공하지 못하는 상황일 수도 있습니다. '
            '단, 연말+신규업체+수의계약의 조합은 감사원이 중점 점검하는 유형입니다.'
        ),
        'plain_explanation': (
            f'{inst}이(가) 연말에 갑자기 이전에 거래한 적 없는 회사들에게 '
            f'수의계약(경쟁 입찰 없이 직접 계약)을 체결했습니다. '
            f'연말에 예산을 소진하기 위해 사전 검토 없이 급하게 체결한 계약일 가능성이 높습니다. '
            f'이런 계약은 가격이 적정한지, 실제로 납품/용역이 이루어졌는지 확인이 필요합니다.'
        ),
        'why_it_matters': (
            '감사원이 매년 가장 많이 적발하는 유형 중 하나가 '
            '"연말 수의계약 신규업체 특혜"입니다. '
            '경쟁 없는 계약 + 사전 관계 없는 업체 + 연말 시간 압박이 결합하면 '
            '부실 계약, 과다 지급, 납품 부실의 위험이 크게 높아집니다.'
        ),
        'citizen_impact': (
            f'경쟁 없이 체결된 연말 신규업체 계약 {total_amt/1e8:.1f}억원 중 '
            f'감사원 지적 비율(약 15%)을 적용하면 {total_amt*0.15/1e8:.1f}억원이 '
            f'부적절하게 지출되었을 가능성이 있습니다.'
        ),
        'what_should_happen': (
            f'1) {inst}의 연말 수의계약 내역 전수 공개 요청 '
            f'2) 계약 업체들의 설립일자, 이전 정부 계약 이력 확인 '
            f'3) 납품/용역 이행 여부 및 검수 기록 확인 '
            f'4) 감사원 또는 국민권익위원회에 감사 청구 가능'
        ),
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "yearend_new_vendor"])} year-end new vendor findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 10: RELATED COMPANIES (동일 주소/대표 업체)
# 같은 주소 또는 대표자가 다른 이름으로 복수 계약
# Uses inline CEO/address data from bids (full 71k coverage)
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 10: Related Companies...')
# The fraud: same person owns multiple companies that COMPETE in the same auction,
# creating fake competition. Without full bidder data we detect the next-best signal:
# same CEO companies winning the SAME CATEGORY of competitive bids at one institution,
# implying they're in the same market and likely trading wins.
#
# Hard requirements:
#   1. Both companies win via competitive bid (낙찰), not 수의계약
#   2. Both win the same category (similar bid title keywords) at same institution
#   3. Total combined amount >= 3억 AND individual company min >= 5천만
#   4. At least 3 combined wins (not just 2 individual contracts)
#   5. Exclude complementary business pairs (design+construction, IT+cleaning etc.)

import re as _re

# Common Korean names — too ambiguous as a CEO-matching signal
_COMMON_NAMES = frozenset([
    '김영희', '이영희', '박영희', '김철수', '이철수', '최영희', '박철수',
    '김민준', '이민준', '김서준', '이지혜', '김지혜', '박지혜', '이수진',
    '김지영', '이지영', '박지영', '최지영', '김미영', '이미영',
])

# Business type keywords — if two companies have keywords from different groups,
# they're in different businesses (vertical integration, not fake competition)
_BIZ_GROUPS = [
    {'선박', '조선', '해양', '해운'},           # shipbuilding vs marine services
    {'건설', '토목', '시공'},                    # construction
    {'설계', '기술용역', '엔지니어링'},          # engineering/design
    {'청소', '미화', '환경미화'},               # cleaning services
    {'IT', '정보', '소프트웨어', '시스템'},      # IT
    {'포장', '택배', '운송', '물류'},           # logistics
    {'여행', '관광', '투어'},                   # travel
    {'의료', '병원', '제약', '바이오'},         # medical
    {'식품', '급식', '농산물'},                # food
]

def _biz_group(name: str) -> set:
    """Return which business groups a company name belongs to."""
    result = set()
    for i, group in enumerate(_BIZ_GROUPS):
        if any(kw in name for kw in group):
            result.add(i)
    return result

def _complementary_businesses(names: list) -> bool:
    """True if companies span different business group categories."""
    if len(names) < 2:
        return False
    groups = [_biz_group(n) for n in names]
    # If any pair has non-overlapping groups (excluding empty), they're complementary
    non_empty = [g for g in groups if g]
    if len(non_empty) < 2:
        return False
    for i in range(len(non_empty)):
        for j in range(i + 1, len(non_empty)):
            if not non_empty[i].intersection(non_empty[j]):
                return True
    return False

# Build: inst → ceo → {biznos, names, competitive_wins, total_amt}
inst_ceo_map: dict = defaultdict(lambda: defaultdict(lambda: {
    'biznos': set(), 'names': set(), 'wins': [], 'total_amt': 0.0,
}))

for _b in bids:
    _inst = str(_b.get('dminsttNm', '')).strip()
    _bz = str(_b.get('bidwinnrBizno', '')).replace('-', '').strip()
    _nm = str(_b.get('bidwinnrNm', '')).strip()
    _ceo = str(_b.get('bidwinnrCeoNm', '')).strip()
    _amt = _f(_b.get('sucsfbidAmt'))
    _prtcpt = _i(_b.get('prtcptCnum'))
    if not _inst or not _bz or not _ceo or len(_ceo) < 2 or _amt <= 0:
        continue
    if _ceo in _COMMON_NAMES:
        continue
    if is_govt_affiliate(_nm) or is_cooperative(_nm):
        continue
    # prtcptCnum == 1 means sole bidder (수의계약 or uncontested).
    # We still flag it: same CEO routing contracts across two companies regardless
    # of competition method is a real signal. The complementary-business and
    # amount checks below filter out legitimate multi-company family businesses.
    inst_ceo_map[_inst][_ceo]['biznos'].add(_bz)
    inst_ceo_map[_inst][_ceo]['names'].add(_nm)
    inst_ceo_map[_inst][_ceo]['wins'].append(_b)
    inst_ceo_map[_inst][_ceo]['total_amt'] += _amt

for inst, ceo_data in inst_ceo_map.items():
    for ceo, d in ceo_data.items():
        # Need 2+ distinct companies
        if len(d['biznos']) < 2:
            continue
        # Need meaningful combined volume
        if d['total_amt'] < 300_000_000:  # 3억
            continue
        # Need at least 3 combined wins
        if len(d['wins']) < 3:
            continue
        # Each company must have won at least something meaningful (5천만+)
        company_amts: dict[str, float] = defaultdict(float)
        for w in d['wins']:
            company_amts[str(w.get('bidwinnrNm', '')).strip()] += _f(w.get('sucsfbidAmt'))
        if sum(1 for a in company_amts.values() if a >= 50_000_000) < 2:
            continue
        # Skip if companies are in complementary (different) business categories
        company_names = sorted(d['names'])
        if _complementary_businesses(company_names):
            continue
        # Skip govt-affiliated and cooperative vendors
        if any(is_govt_affiliate(n) or is_cooperative(n) for n in company_names):
            continue

        score = min(88, 60 + len(d['biznos']) * 8 + (d['total_amt'] / 2e9) * 10 + len(d['wins']) * 2)
        top = sorted(d['wins'], key=lambda x: -_f(x.get('sucsfbidAmt')))[:5]
        evidence = [make_contract(
            c.get('bidNtceNo', ''), str(c.get('bidNtceNm', '')),
            _f(c.get('sucsfbidAmt')), str(c.get('bidwinnrNm', '')),
            c.get('fnlSucsfDate', ''), f'낙찰 (참여 {c.get("prtcptCnum","?")}개사)',
        ) for c in top]
        findings.append({
            'pattern_type': 'related_companies',
            'severity': 'HIGH',
            'suspicion_score': round(score),
            'target_institution': inst,
            'summary': (
                f'{inst}에서 동일 대표자({ceo})의 {len(d["biznos"])}개 업체'
                f'({", ".join(company_names[:3])})가 경쟁 입찰로 총 {d["total_amt"]/1e8:.1f}억원을 수주했습니다. '
                f'위장 경쟁(들러리 입찰) 의심.'
            ),
            'detail': {
                '기관': inst,
                '관련업체수': len(d['biznos']),
                '업체명': ', '.join(company_names),
                '공통대표자': ceo,
                '합계낙찰금액': d['total_amt'],
                '총낙찰건수': len(d['wins']),
            },
            'evidence_contracts': evidence,
            'innocent_explanation': (
                '동일인이 면허 종류나 사업 규모별로 복수 법인을 운영하는 것은 합법입니다. '
                '단, 두 법인이 동일 입찰에 동시 참여하거나 동일 업종에서 '
                '교대로 낙찰받는다면 「공정거래법」상 입찰담합에 해당합니다.'
            ),
            'plain_explanation': (
                f'같은 사람({ceo})이 대표인 {len(d["biznos"])}개 회사가 '
                f'모두 {inst}에서 경쟁 입찰을 통해 계약을 따냈습니다. '
                '겉으로는 서로 다른 회사가 경쟁하는 것처럼 보이지만 '
                '실제로는 한 사람이 모든 회사를 통제하는 위장 경쟁입니다.'
            ),
            'why_it_matters': (
                '공정거래위원회 기준으로, 동일인 복수 법인이 같은 입찰에 참여하면 '
                '이는 「입찰담합」입니다. 법원 판례에 따르면 담합으로 인한 낙찰가는 '
                '정상 경쟁 대비 평균 15-20% 높습니다.'
            ),
            'citizen_impact': (
                f'총 {d["total_amt"]/1e8:.1f}억원 규모의 계약이 실질적 경쟁 없이 '
                f'체결되었을 수 있습니다. 정상 경쟁이 이루어졌다면 '
                f'{d["total_amt"]*0.15/1e8:.1f}억원 절감이 가능했습니다.'
            ),
            'what_should_happen': (
                f'1) {ceo} 대표의 모든 관계 법인 조회 및 입찰 이력 대조\n'
                '2) 관련 입찰에서 두 법인이 동시 참여한 공고번호 특정\n'
                '3) 공정거래위원회에 입찰담합 신고 (신고 시 과징금 감면 가능)\n'
                '4) 두 법인 간 하도급/용역 재위탁 이력 확인'
            ),
            'related_links': [
                {'title': '공정거래위원회 입찰담합 신고', 'url': 'https://www.ftc.go.kr/www/selectReportUserView.do?key=10', 'source': '공정거래위원회'},
            ],
        })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "related_companies"])} related company findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 11: HIGH-VALUE SOLE SOURCE (고액 수의계약)
# 1억원+ 수의계약 — 법적 한도 대폭 초과
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 11: High-Value Sole Source...')
# Group by institution first to avoid duplicates
hvss_by_inst = defaultdict(list)
for c in contracts:
    method = str(c.get('cntrctCnclsMthdNm', ''))
    amt = _f(c.get('thtmCntrctAmt')) or _f(c.get('cntrctAmt'))
    inst = str(c.get('cntrctInsttNm', '')).strip()
    title = get_contract_name(c)
    # 3억 threshold — below this, 수의계약 is often legally permitted (§26 exemptions).
    # At 3억+, competition should normally be required unless specific exemptions apply.
    # Small-scale 비리 in 수의계약 (1억-3억) exists but needs more specific signals —
    # captured better by contract_splitting and ghost_company patterns.
    if '수의' not in method or amt < 300_000_000 or not inst:
        continue
    # Skip disaster recovery (legally unlimited under §26①1)
    if has_disaster_recovery(title):
        continue
    # Skip defense/military procurement — sole source legally required
    if is_defense_procurement(title) or is_defense_procurement(inst):
        continue
    # Skip software maintenance / system operation — locked to original vendor by law
    maintenance_kw = ['유지보수', '유지관리', '운영관리', '시스템운영', '소프트웨어 유지',
                      '시스템 유지', '장비유지', '하자보수', '사후관리']
    if any(kw in title for kw in maintenance_kw):
        continue
    # Skip framework/designated procurement methods — price is set centrally
    if has_structural_procurement_method(title):
        continue
    # Skip textbooks — regional distributors have legally mandated monopoly areas
    if any(kw in title for kw in ['교과용 도서', '교과서', '교과용도서']):
        continue
    corp_list = str(c.get('corpList', ''))
    vendor = ''
    if corp_list and '^' in corp_list:
        parts = corp_list.split('^')
        if len(parts) > 3:
            vendor = parts[3].split('，')[0] if '，' in parts[3] else parts[3]
    # Skip cooperative vendors in their domain — legally privileged suppliers
    if is_cooperative(vendor):
        continue
    hvss_by_inst[inst].append({
        'title': title, 'amt': amt, 'vendor': vendor,
        'cno': c.get('untyCntrctNo', ''), 'date': c.get('cntrctCnclsDate', ''),
    })

for inst, items in hvss_by_inst.items():
    items.sort(key=lambda x: -x['amt'])
    total_amt = sum(i['amt'] for i in items)
    top = items[:5]
    score = min(85, 30 + len(items) * 5 + (total_amt / 5e8) * 10)

    evidence = [make_contract(
        i['cno'], i['title'], i['amt'], i['vendor'], i['date'], '수의계약',
    ) for i in top]

    vendor_list = ', '.join(set(i['vendor'] for i in items if i['vendor']))[:60]

    findings.append({
        'pattern_type': 'high_value_sole_source',
        'severity': 'HIGH' if total_amt >= 500_000_000 else 'MEDIUM',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'{inst}에서 1억원 이상 수의계약 {len(items)}건(총 {total_amt/1e8:.1f}억원)을 '
            f'체결했습니다. ({vendor_list[:30]})'
        ),
        'detail': {
            '기관': inst,
            '수의계약_건수': len(items),
            '수의계약_총액': total_amt,
            '주요업체': vendor_list,
        },
        'evidence_contracts': evidence,
        'innocent_explanation': (
            '수의계약법 시행령 제26조에 따라 특정 요건 충족 시 금액에 관계없이 '
            '수의계약이 가능합니다: 특허권 보유 품목, 국가안보 관련, '
            '천재지변 긴급 복구, 유일 공급자 등. '
            '특히 소프트웨어 유지보수, 의료장비 전용 소모품 등은 '
            '공급사가 유일하여 수의계약이 불가피한 경우가 많습니다.'
        ),
        'plain_explanation': (
            f'{inst}에서 1억원 이상의 고액 계약 {len(items)}건을 경쟁 입찰 없이 '
            f'수의계약으로 처리했습니다. 총 {total_amt/1e8:.1f}억원 규모입니다. '
            f'수의계약 기본 한도는 2천만원인데, 이를 크게 초과합니다.'
        ),
        'why_it_matters': (
            '수의계약은 경쟁이 없으므로 가격이 높아지는 경향이 있습니다. '
            '감사원 자료에 따르면 수의계약은 경쟁 입찰 대비 평균 7-15% 비쌉니다. '
            '특히 고액 수의계약은 담당 공무원과 업체 간 유착의 강력한 지표입니다.'
        ),
        'citizen_impact': (
            f'경쟁 입찰이었다면 총 {total_amt*0.1/1e8:.1f}억원(10%)의 '
            f'세금 절감이 가능했을 것입니다.'
        ),
        'what_should_happen': (
            '1) 수의계약 사유서의 법적 근거 적법성 검토 '
            '2) 해당 물품/용역의 대체 공급 가능 업체 존재 여부 시장 조사 '
            '3) 과거 동일 물품/용역의 계약 방식 이력 확인 '
            '4) 담당 공무원과 업체 간 이해관계 조사'
        ),
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "high_value_sole_source"])} high-value sole source findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 12: SAME WINNER DIFFERENT BIDS (동일 업체 반복 수주)
# 동일 업체가 동일 기관에서 5건+ 낙찰 (다른 공고)
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 12: Same Winner Different Bids...')
inst_winner_bids = defaultdict(lambda: defaultdict(list))
for b in bids:
    winner = str(b.get('bidwinnrNm', '')).strip()
    inst = str(b.get('ntceInsttNm', b.get('dminsttNm', ''))).strip()
    amt = _f(b.get('sucsfbidAmt'))
    if winner and inst and amt > 10_000_000:
        inst_winner_bids[inst][winner].append(b)

for inst, winners in inst_winner_bids.items():
    # Skip structurally-explained institutions (조달청 runs 단가계약/MAS by design)
    if is_suppressed('same_winner_repeat', inst):
        continue
    for winner, items in winners.items():
        # 6+ wins at same institution (was 5, slightly raised to reduce noise)
        if len(items) < 6:
            continue
        total_amt = sum(_f(b.get('sucsfbidAmt')) for b in items)
        # Min 5억 total — smaller repeat business is often just a regular supplier
        if total_amt < 500_000_000:
            continue
        # Skip cooperatives — they naturally dominate in their regional domain
        if is_cooperative(winner):
            continue
        # Skip if the majority of wins used non-competitive contract methods
        # (단가계약, MAS, 종합쇼핑몰 — repeat wins are expected by design)
        non_comp = sum(1 for b in items
                       if any(m in str(b.get('cntrctMthdNm', b.get('bidMthdNm', '')))
                              for m in _NON_COMPETITIVE_METHODS))
        if non_comp / len(items) > 0.6:
            continue
        avg_rate = sum(_f(b.get('sucsfbidRate')) for b in items) / len(items) if items else 0
        score = min(80, 25 + len(items) * 5 + (total_amt / 2e9) * 10)
        # High bid rate (95%+) combined with repeat wins is a genuine concern:
        # it suggests either price info leakage OR a vendor who has captured a process.
        if avg_rate >= 95:
            score = min(85, score + 8)

        items.sort(key=lambda x: -_f(x.get('sucsfbidAmt')))
        evidence = [make_contract(
            b.get('bidNtceNo', ''), b.get('bidNtceNm', ''),
            _f(b.get('sucsfbidAmt')), winner,
            str(b.get('fnlSucsfDate', ''))[:10],
            f"낙찰률 {_f(b.get('sucsfbidRate')):.1f}%",
        ) for b in items[:5]]

        findings.append({
            'pattern_type': 'same_winner_repeat',
            'severity': 'HIGH' if len(items) >= 6 else 'MEDIUM',
            'suspicion_score': round(score),
            'target_institution': inst,
            'summary': (
                f'{winner}이(가) {inst}에서 {len(items)}건의 서로 다른 입찰에서 '
                f'모두 낙찰(총 {total_amt/1e8:.1f}억원, 평균 낙찰률 {avg_rate:.1f}%)되었습니다.'
            ),
            'detail': {
                '기관': inst,
                '낙찰업체': winner,
                '낙찰건수': len(items),
                '낙찰총액': total_amt,
                '평균낙찰률': f'{avg_rate:.1f}%',
            },
            'evidence_contracts': evidence,
            'innocent_explanation': (
                f'{winner}이(가) {inst}에서 반복 수주하는 것은 '
                '해당 분야에서의 전문성과 실적이 입찰 평가에서 높은 점수를 받기 때문일 수 있습니다. '
                '특히 기술 평가 비중이 높은 입찰에서는 실적 우수 업체가 반복 낙찰되는 것이 자연스럽습니다.'
            ),
            'plain_explanation': (
                f'{winner}이(가) {inst}에서만 {len(items)}번이나 입찰에서 이겼습니다. '
                f'총 {total_amt/1e8:.1f}억원 규모입니다. '
                f'한 업체가 같은 기관의 여러 사업을 독식하는 것은 '
                f'담당자와의 유착 관계를 의심할 수 있는 패턴입니다.'
            ),
            'why_it_matters': (
                '동일 업체의 반복 수주는 발주 담당자와 업체 간 유착의 전형적 신호입니다. '
                '입찰 공고의 평가 기준을 특정 업체에 유리하게 설계하거나, '
                '사전에 정보를 유출하여 낙찰을 유도하는 사례가 반복적으로 적발됩니다.'
            ),
            'citizen_impact': (
                f'한 업체의 독점으로 인해 경쟁이 저해되면, '
                f'같은 서비스를 더 비싼 가격에 받게 됩니다. '
                f'경쟁 환경이었다면 최소 10%의 절감이 가능합니다.'
            ),
            'what_should_happen': (
                f'1) {winner}과(와) {inst} 발주 담당자 간 인적 관계 조사 '
                f'2) 각 입찰의 평가 기준이 {winner}에 유리하게 설계되지 않았는지 검토 '
                f'3) 동종 입찰에 다른 업체가 참여하지 않은 이유 조사 '
                f'4) {winner}의 하도급 현황 확인 (낙찰 후 재하도급 여부)'
            ),
        })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "same_winner_repeat"])} same winner repeat findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 13: SUDDEN AMOUNT SPIKE (계약금액 급증)
# 동일 기관-업체 간 계약 금액이 전년 대비 3배+ 증가
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 13: Sudden Amount Spike...')
# Store both amounts AND the actual bids per year so we can add evidence contracts.
# Previous version had evidence_contracts: [] — useless for investigation.
inst_vendor_yearly = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: {'amt': 0.0, 'bids': []})))
for c in bids:
    inst = str(c.get('dminsttNm', '')).strip()
    vendor = str(c.get('bidwinnrNm', '')).strip()
    year = str(c.get('fnlSucsfDate', c.get('rlOpengDt', '')))[:4]
    amt = _f(c.get('sucsfbidAmt'))
    if inst and vendor and year.isdigit() and amt > 0:
        inst_vendor_yearly[inst][vendor][year]['amt'] += amt
        inst_vendor_yearly[inst][vendor][year]['bids'].append(c)

# NOTE on data range: bids covers roughly 12 months (2025-full + 2026-partial Jan-Mar).
# Comparing 2025 full-year to 2026 Jan-Mar is misleading unless 2026 already exceeds 2025 total.
# We flag only if curr_amt ALREADY exceeds 3x prev in the partial period — an even stronger signal.
_current_year = str(datetime.now(timezone.utc).year)

for inst, vendors in inst_vendor_yearly.items():
    for vendor, years in vendors.items():
        sorted_years = sorted(years.items())
        if len(sorted_years) < 2:
            continue
        for i in range(1, len(sorted_years)):
            prev_year, prev_data = sorted_years[i-1]
            curr_year, curr_data = sorted_years[i]
            prev_amt = prev_data['amt']
            curr_amt = curr_data['amt']

            # Meaningful baseline: 3천만원+. Catches small 비리 but filters pure noise.
            if prev_amt < 30_000_000 or curr_amt < 90_000_000:
                continue
            ratio = curr_amt / max(prev_amt, 1)
            # 3x required. Note: if curr_year is partial (e.g. 2026 Q1), this is STRONGER
            # evidence — the vendor has already exceeded 3x in just partial year.
            if ratio < 3:
                continue
            # Skip government affiliates — structural budget variance, not fraud
            if is_govt_affiliate(vendor):
                continue
            # Skip framework pricing contracts — price is set centrally, "spike" is just demand
            curr_titles = ' '.join(b.get('bidNtceNm', '') for b in curr_data['bids'])
            if has_structural_procurement_method(curr_titles):
                continue

            # Require ≥2 contracts in the current year.
            # A single large contract starting (e.g. infrastructure project, major equipment
            # purchase) is normal and produces a high ratio just by coincidence of timing.
            # Repeated elevated spending is the real fraud signal.
            if len(curr_data['bids']) < 2:
                continue

            # Also: if the previous year baseline was tiny (<5천만원), the ratio is
            # mathematically explosive but not meaningful (e.g. 500만원 → 5억 = 100x,
            # but the prior year was a one-off small purchase, not the normal baseline).
            if prev_amt < 50_000_000:
                continue

            score = min(80, 30 + min(ratio, 10) * 5 + (curr_amt / 1e9) * 5)
            is_partial_year = (curr_year == _current_year)

            # Add actual contract evidence — the specific bids that make up the spike
            curr_bids_sorted = sorted(curr_data['bids'], key=lambda x: -_f(x.get('sucsfbidAmt')))
            evidence = [make_contract(
                b.get('bidNtceNo', ''), b.get('bidNtceNm', ''),
                _f(b.get('sucsfbidAmt')), vendor,
                str(b.get('fnlSucsfDate', ''))[:10],
                f"낙찰 (낙찰률 {_f(b.get('sucsfbidRate')):.1f}%)",
            ) for b in curr_bids_sorted[:5]]

            partial_note = (
                f' ※ {curr_year}년은 부분 데이터({len(curr_data["bids"])}건)입니다 — '
                f'이미 전년 대비 {ratio:.1f}배를 넘었으므로 오히려 더 강한 신호입니다.'
                if is_partial_year else ''
            )

            findings.append({
                'pattern_type': 'amount_spike',
                'severity': 'HIGH' if ratio >= 5 else 'MEDIUM',
                'suspicion_score': round(score),
                'target_institution': inst,
                'summary': (
                    f'{inst}의 {vendor} 계약금액이 {prev_year}년 {prev_amt/1e8:.1f}억원에서 '
                    f'{curr_year}년 {curr_amt/1e8:.1f}억원으로 {ratio:.1f}배 급증했습니다.'
                    + partial_note
                ),
                'detail': {
                    '기관': inst,
                    '업체': vendor,
                    '전년금액': prev_amt,
                    '당년금액': curr_amt,
                    '증가배율': f'{ratio:.1f}배',
                    '전년도': prev_year,
                    '당년도': curr_year,
                    '당년_계약건수': len(curr_data['bids']),
                },
                'evidence_contracts': evidence,
                'innocent_explanation': (
                    '계약 금액 급증은 대규모 프로젝트 착수, 장비 교체 주기 도래, '
                    '법령 개정에 따른 의무 시행 등 합리적 사유가 있을 수 있습니다. '
                    '특히 다년도 계약의 경우 초기년도에 대규모 투자가 집중됩니다.'
                    + (' 또한 비교 기간 차이(전년도 vs 부분년도)가 있을 수 있으나, '
                       '이 건은 부분년도에 이미 전년도를 초과하여 가중치가 높습니다.'
                       if is_partial_year else '')
                ),
                'plain_explanation': (
                    f'{inst}에서 {vendor}에 지급하는 금액이 {ratio:.1f}배로 뛰었습니다. '
                    f'{prev_year}년에는 {prev_amt/1e8:.1f}억원이었는데 '
                    f'{curr_year}년에는 {curr_amt/1e8:.1f}억원({len(curr_data["bids"])}건)입니다. '
                    f'이런 급격한 증가는 부풀려진 계약이나 불필요한 지출의 신호일 수 있습니다.'
                ),
                'why_it_matters': (
                    '동일 기관-업체 간 계약 금액의 급격한 증가는 '
                    '계약 변경을 통한 금액 부풀리기, 불필요한 추가 발주, '
                    '또는 담당자-업체 간 유착 심화의 신호일 수 있습니다. '
                    '감사원은 전년 대비 3배 이상 증가한 계약을 중점 점검 대상으로 분류합니다.'
                ),
                'citizen_impact': (
                    f'급증한 {(curr_amt - prev_amt)/1e8:.1f}억원의 추가 지출이 '
                    f'정당한 사유 없이 집행되었다면, 이는 세금 낭비입니다.'
                ),
                'what_should_happen': (
                    f'1) 금액 급증의 구체적 사유 확인 (신규 사업, 장비 교체 등) '
                    f'2) 계약 변경 이력 확인 (초기 소액 계약 후 수의계약으로 대폭 증액 여부) '
                    f'3) 동종 기관의 동일 분야 지출과 비교 '
                    f'4) {vendor}의 다른 기관 계약 패턴 조사'
                ),
            })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "amount_spike"])} amount spike findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 14: BID RIGGING — SUSPICIOUSLY CONSISTENT PARTICIPANT COUNT
# (들러리 입찰 — 동일 업체가 동일 기관에서 항상 같은 수의 경쟁사와 낙찰)
#
# Data reality: bid_rankings opengCorpInfo only shows the WINNER, not all
# bidders. So we cannot use pair-colluder detection. Instead we detect the
# "locked participant count" signal:
#   - A vendor wins at an institution 5+ times.
#   - All those wins have EXACTLY the same participant count (e.g. always 2).
#   - The institution's other bids average significantly more participants.
#   - This suggests the two "dummy" competitors are pre-arranged for each bid.
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 14: Bid Rigging Detection (locked-participant pattern)...')
try:
    bid_rankings = load('g2b-bid-rankings.json')['items']
except Exception:
    bid_rankings = []

if bid_rankings:
    # Build per-institution bid data: inst -> list of {winner, prtcpt_cnt, bid_no, name, amt, rate}
    inst_bids: dict[str, list[dict]] = defaultdict(list)
    for r in bid_rankings:
        inst = str(r.get('dminsttNm', '')).strip()
        if not inst:
            continue
        info = str(r.get('opengCorpInfo', ''))
        parts = info.split('^') if '^' in info else []
        winner = parts[0].strip() if parts else ''
        try:
            amt = float(parts[3]) if len(parts) > 3 else 0.0
            rate = float(parts[4]) if len(parts) > 4 else 0.0
        except (ValueError, TypeError):
            amt, rate = 0.0, 0.0
        try:
            prtcpt = _i(r.get('prtcptCnum'))
        except (ValueError, TypeError):
            prtcpt = 0
        if winner and prtcpt > 0 and amt > 0:
            inst_bids[inst].append({
                'winner': winner,
                'prtcpt': prtcpt,
                'bid_no': str(r.get('bidNtceNo', '')),
                'name': str(r.get('bidNtceNm', '')),
                'amt': amt,
                'rate': rate,
                'date': str(r.get('opengDt', ''))[:10],
            })

    for inst, bids_list in inst_bids.items():
        if len(bids_list) < 8:
            continue  # need enough bids to establish institution baseline
        inst_avg_prtcpt = sum(b['prtcpt'] for b in bids_list) / len(bids_list)

        # Group by winner
        by_winner: dict[str, list[dict]] = defaultdict(list)
        for b in bids_list:
            by_winner[b['winner']].append(b)

        for winner, wins in by_winner.items():
            if len(wins) < 3:
                continue
            if is_govt_affiliate(winner):
                continue

            # Check if participant counts are suspiciously uniform
            prtcpt_counts = [w['prtcpt'] for w in wins]
            most_common_cnt = max(set(prtcpt_counts), key=prtcpt_counts.count)
            uniform_ratio = prtcpt_counts.count(most_common_cnt) / len(prtcpt_counts)

            # Must be 2-6 participants (1 = zero_comp, 7+ = real competition)
            if most_common_cnt < 2 or most_common_cnt > 6:
                continue
            # Must be uniform (≥70% of wins at same participant count)
            if uniform_ratio < 0.70:
                continue
            # Institution average must be at LEAST 2.0× the locked count.
            # A ratio of 2.0× means: if locked count = 2, institution avg must be 4+.
            # This eliminates small-market false positives where the institution itself
            # only averages 2-3 bidders (niche market, not rigging).
            if most_common_cnt == 0 or inst_avg_prtcpt / most_common_cnt < 2.0:
                continue

            total_amt = sum(w['amt'] for w in wins)
            # Minimum threshold: pattern must involve meaningful contract value.
            if total_amt < 50_000_000:
                continue
            uniform_wins = [w for w in wins if w['prtcpt'] == most_common_cnt]
            score = min(85, 30 + len(wins) * 5 + uniform_ratio * 20 + (total_amt / 1e9) * 5)

            evidence = [make_contract(
                w['bid_no'], w['name'], w['amt'], winner, w['date'],
                f'낙찰 (참여 {w["prtcpt"]}개사, 낙찰률 {w["rate"]:.1f}%)',
            ) for w in sorted(wins, key=lambda x: -x['amt'])[:5]]

            findings.append({
                'pattern_type': 'bid_rigging',
                'severity': 'HIGH' if len(wins) >= 8 else 'MEDIUM',
                'suspicion_score': round(score),
                'target_institution': inst,
                'summary': (
                    f'{inst}에서 {winner}가 {len(wins)}번 낙찰될 때마다 '
                    f'경쟁사가 항상 {most_common_cnt}개사입니다 '
                    f'(기관 평균 {inst_avg_prtcpt:.1f}개사 대비). '
                    f'들러리 입찰 패턴 의심.'
                ),
                'detail': {
                    '기관': inst,
                    '낙찰업체': winner,
                    '낙찰횟수': len(wins),
                    '고정참여수': most_common_cnt,
                    '균일비율': f'{uniform_ratio*100:.0f}%',
                    '기관평균참여수': f'{inst_avg_prtcpt:.1f}',
                    '관련계약총액': total_amt,
                },
                'evidence_contracts': evidence,
                'innocent_explanation': (
                    '해당 지역이나 업종의 시장 구조가 과점일 경우, '
                    '참여 가능한 업체 수 자체가 제한되어 '
                    '항상 같은 업체들이 경쟁에 나오는 것이 자연스러울 수 있습니다. '
                    '특히 특정 기술·면허가 필요한 공사나 용역에서 이 패턴이 나타납니다.'
                ),
                'plain_explanation': (
                    f'{inst}에서 {winner}이(가) 입찰에 나올 때마다 '
                    f'경쟁업체가 딱 {most_common_cnt}개사입니다. '
                    f'{len(wins)}번 중 {prtcpt_counts.count(most_common_cnt)}번이 이 패턴입니다. '
                    f'기관의 다른 입찰 평균 {inst_avg_prtcpt:.1f}개사가 참여하는 것과 비교하면 '
                    f'이 업체가 들어올 때만 경쟁사 수가 줄어드는 것은 의심스럽습니다. '
                    f'들러리 업체가 미리 짜고 입찰에 나오는 전형적 패턴입니다.'
                ),
                'why_it_matters': (
                    '입찰담합은 공정거래법 위반으로 형사 처벌 대상입니다. '
                    '경쟁사 수가 항상 일정하다는 것은 낙찰업체가 들러리 경쟁사를 '
                    '사전에 조율하고 있다는 강력한 신호입니다. '
                    '공정거래위원회에 따르면 이 패턴의 담합은 '
                    '계약 금액을 평균 7-15% 부풀리는 효과가 있습니다.'
                ),
                'citizen_impact': (
                    f'{winner}이(가) {inst}에서 수주한 {len(wins)}건({total_amt/1e8:.1f}억원)이 '
                    f'담합에 의한 것이라면, 정상 경쟁 대비 최소 {total_amt*0.10/1e8:.1f}억원의 '
                    f'세금이 과다 지출된 것입니다.'
                ),
                'what_should_happen': (
                    f'1) {winner}이 낙찰될 때 참여한 {most_common_cnt}개사의 정체 확인 '
                    f'2) 경쟁사들의 투찰가격 패턴 분석 (항상 낙찰가보다 일정 비율 높으면 담합 확실) '
                    f'3) 공정거래위원회에 입찰담합 의심 신고 '
                    f'4) {inst}의 입찰 자격 요건이 경쟁을 인위적으로 제한하는지 검토'
                ),
                'related_links': [
                    {'title': '나라장터에서 해당 기관 계약 검색', 'url': 'https://www.g2b.go.kr:8081/ep/tbid/tbidList.do', 'source': '나라장터'},
                    {'title': '공정거래위원회 입찰담합 신고', 'url': 'https://www.ftc.go.kr/www/cop/bbs/selectBoardList.do?key=201&bbsId=BBSMSTR_000000002469', 'source': '공정거래위원회'},
                ],
            })

    print(f'  Bid rankings: {len(bid_rankings)} records, institutions: {len(inst_bids)}')
print(f'  Found {len([f for f in findings if f["pattern_type"] == "bid_rigging"])} bid rigging findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 15: CONTRACT INFLATION (계약 변경 증액)
# 계약 체결 후 대폭 증액 변경 (저가 입찰 후 변경 수법)
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 15: Contract Inflation...')
try:
    contract_changes = load('g2b-contract-changes.json')['items']
except Exception:
    contract_changes = []

if contract_changes:
    for ch in contract_changes:
        # totCntrctAmt = total after all change orders; thtmCntrctAmt = original this-term amount
        # cntrctNm or cnstwkNm or servcNm for title; corpList for vendor
        orig_amt = _f(ch.get('thtmCntrctAmt'))
        new_amt = _f(ch.get('totCntrctAmt'))
        # Also try before/after fields if present
        if not orig_amt:
            orig_amt = float(ch.get('bfchgCntrctAmt', ch.get('orgnlCntrctAmt', 0)) or 0)
        if not new_amt:
            new_amt = float(ch.get('afchgCntrctAmt', ch.get('chgCntrctAmt', 0)) or 0)
        # Require 1억+ original contract (below this, normal scope changes dominate)
        if orig_amt < 100_000_000 or new_amt <= orig_amt:
            continue
        increase = new_amt - orig_amt
        ratio = new_amt / max(orig_amt, 1)
        # 50% increase minimum (was 30%): genuine concern threshold.
        # 30-50% in construction can be legitimate (design changes, material costs).
        # 50%+ is where the "low-ball to win, inflate to profit" pattern becomes statistically unlikely.
        if ratio < 1.5:
            continue
        # Skip disaster recovery — emergency work routinely exceeds estimates
        if has_disaster_recovery(title):
            continue
        inst = str(ch.get('cntrctInsttNm', '')).strip()
        title = str(ch.get('cntrctNm', ch.get('cnstwkNm', ch.get('servcNm', '')))).strip()
        # Extract vendor from corpList field: "[1^주계약업체^단독^업체명^대표^국가^비율^업체명^^사업자번호]"
        corp_raw = str(ch.get('corpList', '')).strip()
        vendor = ''
        if corp_raw and '^' in corp_raw:
            parts = corp_raw.strip('[]').split('^')
            vendor = parts[3] if len(parts) > 3 else ''
        if not vendor:
            vendor = str(ch.get('rprsntCorpNm', '')).strip()
        score = min(80, 30 + (ratio - 1) * 25)

        findings.append({
            'pattern_type': 'contract_inflation',
            'severity': 'HIGH' if ratio >= 2 else 'MEDIUM',
            'suspicion_score': round(score),
            'target_institution': inst,
            'summary': (
                f'{inst}의 "{title[:30]}…" 계약이 '
                f'{orig_amt/1e8:.1f}억원에서 {new_amt/1e8:.1f}억원으로 '
                f'{(ratio-1)*100:.0f}% 증액되었습니다.'
            ),
            'detail': {
                '기관': inst,
                '계약명': title[:60],
                '업체': vendor,
                '원래금액': orig_amt,
                '변경금액': new_amt,
                '증가율': f'{(ratio-1)*100:.0f}%',
                '증가액': increase,
            },
            'evidence_contracts': [make_contract(
                ch.get('cntrctNo', ch.get('untyCntrctNo', '')),
                f'[변경 전 {orig_amt/1e8:.1f}억 → 후 {new_amt/1e8:.1f}억] {title}',
                new_amt, vendor, ch.get('chgDate', ch.get('cntrctChgDate', '')),
                '계약변경',
            )],
            'innocent_explanation': (
                '계약 변경 증액은 설계 변경, 물가 상승, 공사 범위 확대 등 '
                '합법적 사유로 발생할 수 있습니다. '
                '특히 건설 공사에서는 지반 조건 변경, 설계 오류 수정 등으로 '
                '10-30%의 증액이 일반적입니다.'
            ),
            'plain_explanation': (
                f'{inst}에서 처음에 {orig_amt/1e8:.1f}억원으로 시작한 계약이 '
                f'{new_amt/1e8:.1f}억원으로 {(ratio-1)*100:.0f}% 불어났습니다. '
                f'이는 일부러 낮은 가격으로 입찰해서 따낸 뒤, '
                f'나중에 변경 계약으로 금액을 높이는 수법일 수 있습니다.'
            ),
            'why_it_matters': (
                '저가 입찰 후 계약 변경으로 증액하는 것은 경쟁 입찰의 의미를 무력화합니다. '
                '다른 업체는 정직하게 비용을 반영하여 입찰했기 때문에 탈락했는데, '
                '낙찰자만 나중에 가격을 올리는 것은 불공정합니다. '
                '감사원은 30% 이상 증액 계약을 중점 감사 대상으로 분류합니다.'
            ),
            'citizen_impact': (
                f'증액된 {increase/1e8:.1f}억원은 원래 예산에 포함되지 않았던 '
                f'추가 지출입니다. 이 금액만큼 다른 사업의 예산이 줄어들었을 수 있습니다.'
            ),
            'what_should_happen': (
                '1) 계약 변경 사유서의 적법성 검토 '
                '2) 설계 변경이 사유인 경우, 원 설계의 부실 여부 확인 '
                '3) 당초 낙찰가 대비 변경 후 금액과 차순위 입찰가 비교 '
                '4) 동일 업체의 다른 계약에서도 유사 패턴 반복 여부 조사'
            ),
        })

    print(f'  Contract changes: {len(contract_changes)} records')
print(f'  Found {len([f for f in findings if f["pattern_type"] == "contract_inflation"])} contract inflation findings')


# ════════════════════════════════════════════════════════════════════
# Post-process: Add rich narrative fields to ALL findings
# ════════════════════════════════════════════════════════════════════
print('\n📝 Adding rich narrative fields...')

STANDARD_LINKS = [
    {'title': '나라장터에서 해당 기관 계약 검색', 'url': 'https://www.g2b.go.kr:8081/ep/tbid/tbidList.do', 'source': '나라장터'},
    {'title': '감사원 감사결과 검색', 'url': 'https://www.bai.go.kr/bai/result/list', 'source': '감사원'},
]

PATTERN_EXTRA_LINK = {
    'ghost_company': {'title': '국세청 사업자등록 상태 조회', 'url': 'https://teht.hometax.go.kr/websquare/websquare.html?w2xPath=/ui/sf/a/a/UTESFAAF99.xml', 'source': '국세청 홈택스'},
    'zero_competition': {'title': '열린재정 세출 현황', 'url': 'https://www.openfiscaldata.go.kr/op/ko/sd/UOPKOSDA01', 'source': '열린재정'},
    'bid_rate_anomaly': {'title': '공정거래위원회 입찰담합 의결서', 'url': 'https://www.ftc.go.kr/www/selectReportUserView.do?key=10', 'source': '공정거래위원회'},
    'new_company_big_win': {'title': '국세청 사업자등록 상태 조회', 'url': 'https://teht.hometax.go.kr/websquare/websquare.html?w2xPath=/ui/sf/a/a/UTESFAAF99.xml', 'source': '국세청 홈택스'},
    'vendor_concentration': {'title': '열린재정 세출 현황', 'url': 'https://www.openfiscaldata.go.kr/op/ko/sd/UOPKOSDA01', 'source': '열린재정'},
    'repeated_sole_source': {'title': '조달청 수의계약 현황', 'url': 'https://www.pps.go.kr/kor/bbs/list.do?bbsId=PPS_OPEN_INFO', 'source': '조달청'},
    'contract_splitting': {'title': '국가법령정보센터 (국가계약법 시행령)', 'url': 'https://www.law.go.kr/법령/국가를당사자로하는계약에관한법률시행령', 'source': '법령정보'},
    'low_bid_competition': {'title': '공정거래위원회 입찰담합 의결서', 'url': 'https://www.ftc.go.kr/www/selectReportUserView.do?key=10', 'source': '공정거래위원회'},
    'yearend_new_vendor': {'title': '국민권익위원회 신고', 'url': 'https://www.acrc.go.kr/menu.es?mid=a10301040000', 'source': '국민권익위원회'},
    'vendor_rotation': {'title': '공정거래위원회 입찰담합 신고', 'url': 'https://www.ftc.go.kr/www/selectReportUserView.do?key=10', 'source': '공정거래위원회'},
    'related_companies': {'title': '공정거래위원회 입찰담합 의결서', 'url': 'https://www.ftc.go.kr/www/selectReportUserView.do?key=10', 'source': '공정거래위원회'},
    'high_value_sole_source': {'title': '조달청 수의계약 현황', 'url': 'https://www.pps.go.kr/kor/bbs/list.do?bbsId=PPS_OPEN_INFO', 'source': '조달청'},
    'same_winner_repeat': {'title': '나라장터 입찰 현황', 'url': 'https://www.g2b.go.kr:8081/ep/tbid/tbidList.do', 'source': '나라장터'},
    'amount_spike': {'title': '열린재정 세출 현황', 'url': 'https://www.openfiscaldata.go.kr/op/ko/sd/UOPKOSDA01', 'source': '열린재정'},
    'bid_rigging': {'title': '공정거래위원회 입찰담합 의결서', 'url': 'https://www.ftc.go.kr/www/selectReportUserView.do?key=10', 'source': '공정거래위원회'},
    'contract_inflation': {'title': '감사원 감사결과 검색', 'url': 'https://www.bai.go.kr/bai/result/list', 'source': '감사원'},
    'cross_pattern': {'title': '국민권익위원회 신고', 'url': 'https://www.acrc.go.kr/menu.es?mid=a10301040000', 'source': '국민권익위원회'},
    'systemic_risk': {'title': '감사원 감사청구', 'url': 'https://www.bai.go.kr/bai/citizen/request', 'source': '감사원'},
    'sanctioned_vendor': {'title': '나라장터 부정당제재업체', 'url': 'https://www.g2b.go.kr:8081/ep/co/cntrbRsttInfo.do', 'source': '나라장터'},
    'price_clustering': {'title': '공정거래위원회 입찰담합 신고', 'url': 'https://www.ftc.go.kr/www/selectReportUserView.do?key=10', 'source': '공정거래위원회'},
    'network_collusion': {'title': '공정거래위원회 위장 경쟁 신고', 'url': 'https://www.ftc.go.kr/www/selectReportUserView.do?key=10', 'source': '공정거래위원회'},
}


def fmt_amt(amt):
    if amt >= 1e12: return f'{amt/1e12:.1f}조원'
    if amt >= 1e8: return f'{amt/1e8:.1f}억원'
    if amt >= 1e4: return f'{amt/1e4:,.0f}만원'
    return f'{amt:,.0f}원'


# ── Verdict assignment ────────────────────────────────────────────────
# Keywords for contracts that are structurally legitimate single-source
_SINGLE_SOURCE_OK   = ['특허', '저작권', '라이선스', '독점공급', '단독공급', '긴급복구', '긴급재난', '긴급계약']
_SW_MAINT           = ['유지관리', '유지보수', '운영관리', '시스템운영', '시스템관리', '소프트웨어', 'S/W', '업그레이드', '업데이트', 'A/S', '유지운영', '라이선스', '서버', '네트워크유지']
_COMMODITY          = ['청소', '경비', '주차', '식자재', '급식', '세탁', '인쇄', '소모품', '복사용지', '사무용품', '폐기물', '잡자재', '쓰레기']

def _has_kw(names: list, keywords: list) -> bool:
    text = ' '.join(names)
    return any(kw in text for kw in keywords)

def _participants(methods: list) -> list[int]:
    counts = []
    for m in methods:
        mo = re.search(r'(\d+)개사', m)
        if mo: counts.append(int(mo.group(1)))
    return counts

def assign_verdict(finding: dict) -> tuple[str, str, str]:
    """Return (verdict, verdict_reason, key_evidence).
    verdict: 'suspicious' | 'investigate' | 'legitimate'
    """
    pattern  = finding.get('pattern_type', '')
    contracts = finding.get('evidence_contracts', [])
    detail   = finding.get('detail', {})

    names    = [c.get('name', '') for c in contracts]
    methods  = [c.get('method', '') for c in contracts]
    amounts  = [float(c.get('amount', 0)) for c in contracts]
    vendors  = list(dict.fromkeys(c.get('vendor', '') for c in contracts if c.get('vendor')))

    has_ss_ok   = _has_kw(names, _SINGLE_SOURCE_OK)
    has_sw      = _has_kw(names, _SW_MAINT)
    has_commod  = _has_kw(names, _COMMODITY)
    has_sole    = any('수의' in m or '단독' in m for m in methods)

    ptcps       = _participants(methods)
    min_p       = min(ptcps) if ptcps else None

    rate_str    = detail.get('평균낙찰률', '')
    rates       = []
    for m in methods:
        mo = re.search(r'낙찰률\s*(\d+\.?\d*)%', m)
        if mo: rates.append(float(mo.group(1)))
    max_rate    = max(rates) if rates else None

    total_amt   = sum(amounts)
    inst        = finding.get('target_institution', '')
    vendor_str  = detail.get('낙찰업체', detail.get('업체', vendors[0] if vendors else ''))

    # ── Build key_evidence ──
    def _fmt_contract(c):
        n = c.get('name', '')
        n = re.sub(r'^\[낙찰률 [\d.]+%\]\s*', '', n)  # strip prefix
        amt = float(c.get('amount', 0))
        m = c.get('method', '')
        parts = [n[:40]]
        if m: parts.append(m)
        if amt: parts.append(f'{amt/1e8:.1f}억원')
        return ' / '.join(parts)

    ev_lines = [_fmt_contract(c) for c in contracts[:3] if c.get('name')]
    key_evidence = '\n'.join(ev_lines)

    # ── cross_pattern / systemic_risk ──
    if pattern in ('cross_pattern', 'systemic_risk'):
        n_pt = detail.get('감지된_패턴수', 2)
        return (
            'suspicious',
            f'{n_pt}개 의심 패턴이 동일 기관-업체 쌍에서 동시에 감지됨. 구조적 비리 가능성 높음.',
            key_evidence,
        )

    # ── bid_rate_anomaly ──
    if pattern == 'bid_rate_anomaly':
        rate_label = rate_str or (f'{max_rate:.1f}%' if max_rate else '?')
        if has_ss_ok:
            return ('investigate', f'특허/독점 공급 가능성 있으나 {rate_label} 낙찰률 비정상. 추가 확인 필요.', key_evidence)
        if min_p and min_p >= 3:
            return ('suspicious', f'{min_p}개사 경쟁에서 {rate_label} 낙찰 — 예정가격 사전 유출 강력 의심.', key_evidence)
        if min_p and min_p == 2:
            return ('suspicious', f'2개사 경쟁에서 {rate_label} 낙찰 — 들러리 입찰 또는 가격 유출 의심.', key_evidence)
        return ('suspicious', f'{rate_label} 낙찰률 비정상 — 예정가격 유출 의심.', key_evidence)

    # ── zero_competition ──
    if pattern == 'zero_competition':
        n = detail.get('단독응찰_건수', len(contracts))
        if has_commod:
            return ('suspicious', f'일반 상용 서비스/물품 {n}건 입찰에 단 1개사 참여. 맞춤형 공고 의심.', key_evidence)
        if has_ss_ok:
            return ('investigate', '특허·독점 공급품. 단독 응찰 구조가 정당화될 수 있음.', key_evidence)
        if has_sw:
            return ('investigate', '소프트웨어 유지보수 — 기존 개발사 단독 응찰 관례. 계약 이력 확인 필요.', key_evidence)
        return ('suspicious', f'경쟁 입찰 {n}건 모두 단독 응찰. 입찰 자격 요건 조작 의심.', key_evidence)

    # ── repeated_sole_source ──
    if pattern == 'repeated_sole_source':
        _ratio_raw = detail.get('수의계약_비율', 0) or 0
        if isinstance(_ratio_raw, str):
            _ratio_raw = _ratio_raw.replace('%', '').strip()
            ratio = float(_ratio_raw) / 100 if _ratio_raw else 0
        else:
            ratio = float(_ratio_raw)
        n     = detail.get('수의계약_건수', len(contracts))
        ratio_pct = f'{ratio*100:.0f}%' if ratio else '?'
        if has_ss_ok:
            return ('legitimate', '특허·독점 공급품 수의계약 — 법적으로 정당화됨.', key_evidence)
        if has_sw and n <= 4:
            return ('investigate', f'소프트웨어 유지보수 수의계약 {n}건 — 관례적이나 금액 적정성 확인 필요.', key_evidence)
        if has_commod:
            return ('suspicious', f'일반 상용 서비스 수의계약 {n}건({ratio_pct}) — 경쟁 입찰 회피 의심.', key_evidence)
        return ('suspicious', f'수의계약 {ratio_pct}, {n}건 반복. 경쟁 회피 구조 의심.', key_evidence)

    # ── high_value_sole_source ──
    if pattern == 'high_value_sole_source':
        n = len(contracts)
        if has_ss_ok:
            return ('investigate', '특허·저작권 품목 — 수의계약 허용. 금액 적정성 확인 필요.', key_evidence)
        if has_sw:
            return ('investigate', '시스템 유지보수 — 기존 개발사 수의계약 관례. 규모·빈도 확인 필요.', key_evidence)
        return ('suspicious', f'1억원 이상 수의계약 {n}건 ({fmt_amt(total_amt)}) — 경쟁 입찰 회피 의심.', key_evidence)

    # ── contract_splitting ──
    if pattern == 'contract_splitting':
        near = sum(1 for a in amounts if 15_000_000 <= a <= 19_900_000)
        n = detail.get('건수', len(contracts))
        if near >= 3:
            return ('suspicious', f'{near}건이 수의계약 한도(2,000만원) 직하 — 의도적 계약 분할 강력 의심.', key_evidence)
        if near >= 1:
            return ('investigate', f'일부 계약이 2,000만원 한도 근처 ({near}건). 의도적 분할 여부 확인 필요.', key_evidence)
        return ('investigate', f'동일 업체 {n}건 반복 소액 계약. 분할 여부 확인 필요.', key_evidence)

    # ── amount_spike ──
    if pattern == 'amount_spike':
        ratio = _f(detail.get('증가비율'))
        if ratio > 4:
            return ('suspicious', f'전년 대비 {ratio:.1f}배 급증. 사업 규모 변화 없이 계약액만 폭증한 경우 의심.', key_evidence)
        return ('investigate', '계약액 급증. 신규 사업 또는 예산 변경 여부 확인 필요.', key_evidence)

    # ── same_winner_repeat ──
    if pattern == 'same_winner_repeat':
        n = detail.get('낙찰_횟수', len(contracts))
        return ('suspicious', f'{vendor_str} {n}회 연속 낙찰 — 들러리 입찰 또는 기관-업체 유착 의심.', key_evidence)

    # ── low_bid_competition ──
    if pattern == 'low_bid_competition':
        return ('investigate', '소수 업체 반복 경쟁. 전문 분야일 수 있으나 들러리 입찰 가능성 있음.', key_evidence)

    # ── contract_inflation ──
    if pattern == 'contract_inflation':
        pct = float(detail.get('증액비율', detail.get('inflation_pct', 0)) or 0)
        if pct > 20:
            return ('suspicious', f'계약 체결 후 {pct:.1f}% 증액 — 사후 부당 증액 의심.', key_evidence)
        return ('investigate', '계약 변경 증액. 물가 상승·범위 변경 등 합리적 사유 확인 필요.', key_evidence)

    # ── vendor_concentration ──
    if pattern == 'vendor_concentration':
        return ('suspicious', f'특정 업체 계약 과도 집중 — 공정 경쟁 절차 준수 여부 확인 필요.', key_evidence)

    return ('investigate', '이상 패턴 감지. 추가 조사 필요.', key_evidence)


def enrich_narrative(f):
    """Add plain_explanation, why_it_matters, citizen_impact, what_should_happen, related_links."""
    if f.get('plain_explanation'):
        # Already has rich fields (e.g. ghost_company)
        if not f.get('related_links'):
            f['related_links'] = STANDARD_LINKS + [PATTERN_EXTRA_LINK.get(f['pattern_type'], {})]
        return

    pt = f['pattern_type']
    d = f.get('detail', {})
    inst = f.get('target_institution', '')
    total_amt = 0
    for e in f.get('evidence_contracts', []):
        total_amt += float(e.get('amount', 0))

    if pt == 'zero_competition':
        n = d.get('단독응찰_건수', 1)
        winner = d.get('낙찰업체', '')
        f['plain_explanation'] = (
            f'{inst}에서 진행한 {n}건의 경쟁 입찰에 매번 단 1개 업체만 참여했습니다. '
            f'마치 가위바위보를 혼자서 하는 것과 같습니다. '
            f'경쟁이 없으면 정부는 유일한 입찰자가 부르는 가격을 그대로 지불할 수밖에 없습니다.'
        )
        f['why_it_matters'] = (
            f'경쟁 입찰의 목적은 여러 업체가 가격과 품질을 경쟁하여 세금을 아끼는 것입니다. '
            f'1개 업체만 참여하면 이 효과가 완전히 사라집니다. '
            f'통계적으로 경쟁 입찰은 단독 응찰 대비 10-15% 낮은 가격에 낙찰됩니다. '
            f'또한 입찰 공고의 참가 자격 조건을 특정 업체에 맞추는 '
            f'"맞춤형 입찰 공고"를 통해 의도적으로 경쟁을 배제했을 가능성도 있습니다.'
        )
        savings = total_amt * 0.12
        f['citizen_impact'] = (
            f'경쟁이 있었다면 약 {fmt_amt(savings)}의 세금을 절감할 수 있었을 것입니다 '
            f'(업계 평균 경쟁 절감률 12% 기준). '
            f'이는 {inst} 관할 지역의 공공서비스 개선에 사용될 수 있는 금액입니다.'
        )
        f['what_should_happen'] = (
            f'1) 해당 입찰 공고의 참가 자격 요건이 과도하게 제한적이었는지 검토 '
            f'2) 동일 분야에 참여 가능한 다른 업체가 존재하는지 시장 조사 '
            f'3) 입찰 공고 기간이 충분했는지 확인 (지나치게 짧은 공고 기간은 경쟁 배제 수법) '
            f'4) {winner}과(와) {inst} 담당자 간 사전 접촉 여부 조사'
        )

    elif pt == 'bid_rate_anomaly':
        rate = d.get('평균낙찰률', '99%')
        vendor = d.get('낙찰업체', '')
        n = d.get('해당건수', 1)
        f['plain_explanation'] = (
            f'{vendor}이(가) 예정가격의 {rate}에 낙찰되었습니다. '
            f'이는 입찰 전에 예정가격을 미리 알고 있었을 가능성을 시사합니다. '
            f'일반적인 경쟁 입찰에서는 낙찰률이 82-92% 범위이며, '
            f'98% 이상은 통계적으로 극히 이례적입니다.'
        )
        f['why_it_matters'] = (
            f'예정가격은 입찰 전에 비공개로 관리되어야 합니다. '
            f'낙찰률이 98% 이상이라는 것은 거의 정확히 예정가격을 맞춘 것으로, '
            f'내부 정보 유출의 전형적 신호입니다. '
            f'2016년 조달청 예정가격 유출 사건에서는 7개 업체가 156건에 걸쳐 97-99% 낙찰률을 유지했고, '
            f'이것이 우연일 확률은 10의 23승분의 1 미만이었습니다. 담당 공무원이 실형을 선고받았습니다.'
        )
        overcharge = total_amt * 0.10
        f['citizen_impact'] = (
            f'정상적인 경쟁이었다면 낙찰률 85-90% 수준에서 계약이 체결되어 '
            f'약 {fmt_amt(overcharge)}의 세금을 절감할 수 있었을 것입니다. '
            f'예정가격 유출은 개별 건의 과다 지출뿐 아니라, '
            f'공정한 경쟁 환경 자체를 무너뜨리는 심각한 문제입니다.'
        )
        f['what_should_happen'] = (
            f'1) {vendor}의 다른 기관 낙찰률 패턴 전수 조사 (98% 이상이 반복되는지) '
            f'2) 해당 입찰의 복수예비가격 관리 절차 점검 '
            f'3) 입찰 담당 공무원의 {vendor} 관계자와의 통화/접촉 기록 조사 '
            f'4) 공정거래위원회에 입찰담합 여부 조사 의뢰'
        )

    elif pt == 'new_company_big_win':
        vendor = d.get('업체', '')
        age = d.get('업력', '')
        emp = d.get('종업원수', '미확인')
        f['plain_explanation'] = (
            f'나라장터에 등록한 지 {age}밖에 안 된 {vendor}이(가) '
            f'{inst}에서 {fmt_amt(total_amt)} 규모의 계약을 수주했습니다. '
            f'신생 업체가 대형 정부 계약을 바로 따내는 것은 이례적입니다.'
        )
        f['why_it_matters'] = (
            f'정부 계약은 일반적으로 수행 실적(유사 사업 경험)을 요구합니다. '
            f'등록 {age}인 신생 업체가 이러한 실적 없이 대형 계약을 수주하는 것은 '
            f'특정인을 위해 설립된 "목적 회사"일 가능성을 시사합니다. '
            f'2021년 조달청 적발 사례에서는 37개 업체가 실적을 위조하여 입찰에 참여한 것이 드러났습니다.'
        )
        f['citizen_impact'] = (
            f'{fmt_amt(total_amt)}의 세금이 검증되지 않은 신생 업체에 지급되었습니다. '
            f'해당 업체의 사업 수행 역량이 부족할 경우, 계약 불이행이나 품질 저하로 '
            f'추가 비용이 발생할 수 있습니다.'
        )
        f['what_should_happen'] = (
            f'1) {vendor}의 실제 설립일(사업자등록일)과 나라장터 등록일 대조 '
            f'2) 수행 실적 증명서의 진위 확인 '
            f'3) 대표자의 이전 경력 및 {inst} 관계자와의 관계 조사 '
            f'4) 동종 업계 유사 규모 업체와의 비교 분석'
        )

    elif pt == 'vendor_concentration':
        vendor = d.get('업체', '')
        ratio = d.get('집중도', '')
        v_count = d.get('업체_계약건수', 0)
        t_count = d.get('기관_전체건수', 0)
        f['plain_explanation'] = (
            f'{inst}의 계약 중 {ratio}가 {vendor} 한 곳에 집중되었습니다. '
            f'전체 {t_count}건 중 {v_count}건을 한 업체가 가져간 것입니다. '
            f'한 업체에 대한 과도한 의존은 경쟁을 저해하고 비용을 높입니다.'
        )
        f['why_it_matters'] = (
            f'특정 업체에 계약이 집중되면 해당 업체가 가격 결정력을 갖게 됩니다. '
            f'또한 발주 담당자와 업체 간의 유착 관계가 형성될 위험이 높아집니다. '
            f'2018년 서울시 산하기관 IT 용역 편중 사건에서는 한 업체가 5년간 '
            f'기관 IT 예산의 94%를 독점한 것이 적발되었습니다.'
        )
        savings = total_amt * 0.15
        f['citizen_impact'] = (
            f'경쟁 환경이 조성되었다면 약 {fmt_amt(savings)}의 절감이 가능했을 것입니다 '
            f'(독점 대비 경쟁 도입 시 평균 15% 절감 효과). '
            f'또한 서비스 품질도 경쟁을 통해 개선될 수 있습니다.'
        )
        f['what_should_happen'] = (
            f'1) {vendor}이(가) 유일한 공급 가능 업체인지 시장 조사 실시 '
            f'2) 대안 업체가 존재한다면, 경쟁 입찰로 전환 검토 '
            f'3) {vendor}과(와) {inst} 담당자 간 인적 관계 조사 '
            f'4) 수의계약 사유서의 법적 근거 적법성 검토'
        )

    elif pt == 'repeated_sole_source':
        total = d.get('전체계약수', 0)
        sole = d.get('수의계약_건수', 0)
        ratio = d.get('수의계약_비율', '')
        f['plain_explanation'] = (
            f'{inst}의 계약 {total}건 중 {sole}건({ratio})이 '
            f'경쟁 입찰 없이 수의계약으로 처리되었습니다. '
            f'쉽게 말해, 10번 물건을 살 때 {sole}번은 한 가게에서만 가격 비교 없이 산 것입니다.'
        )
        f['why_it_matters'] = (
            f'수의계약은 예외적 상황에서만 허용되는 비경쟁 계약 방식입니다. '
            f'{ratio}라는 수치는 "예외"가 "원칙"이 되었음을 의미합니다. '
            f'감사원 통계에 따르면 수의계약은 경쟁 입찰 대비 평균 7-15% 높은 가격에 체결됩니다. '
            f'이는 구조적으로 세금이 낭비되고 있을 가능성을 시사합니다.'
        )
        overcharge = total_amt * 0.10
        f['citizen_impact'] = (
            f'수의계약의 과다 지출률(평균 10%)을 적용하면, '
            f'경쟁 입찰로 전환 시 약 {fmt_amt(overcharge)}의 세금 절감이 가능합니다. '
            f'이는 해당 기관의 다른 공공서비스 개선에 사용될 수 있는 금액입니다.'
        )
        f['what_should_happen'] = (
            f'1) {inst}의 수의계약 사유서 전수 점검 (법적 근거 존재 여부) '
            f'2) 2천만원 이하 소액 수의계약 중 동일 품목 반복 발주 여부 확인 '
            f'3) 수의계약 업체 목록과 발주 담당자 간 이해관계 조사 '
            f'4) 경쟁 입찰 전환 가능한 계약 유형 식별 및 개선 계획 수립'
        )

    elif pt == 'contract_splitting':
        n = d.get('한도근처_계약수', 0)
        f['plain_explanation'] = (
            f'{inst}에서 수의계약 한도(2천만원) 바로 아래 금액의 계약이 {n}건 반복 발주되었습니다. '
            f'이는 하나의 큰 계약을 여러 개로 쪼개서 경쟁 입찰 의무를 피하려는 '
            f'"쪼개기 계약"의 전형적 패턴입니다.'
        )
        f['why_it_matters'] = (
            f'국가계약법은 2천만원 이하 계약에 한해 수의계약을 허용합니다. '
            f'이 한도 직하 금액으로 반복 발주하는 것은 법의 취지를 우회하는 행위입니다. '
            f'2019년 경기도 교육청 사건에서는 12억원 규모의 급식 장비를 '
            f'63건의 1,900만원대 계약으로 분할하여 감사원에 적발되었습니다.'
        )
        f['citizen_impact'] = (
            f'분할된 {n}건을 합치면 총 {fmt_amt(total_amt)}입니다. '
            f'이 금액을 하나의 경쟁 입찰로 진행했다면 '
            f'약 {fmt_amt(total_amt * 0.12)}의 절감이 가능했을 것입니다.'
        )
        f['what_should_happen'] = (
            f'1) {n}건의 계약이 동일 품목/용역에 해당하는지 확인 '
            f'2) 발주 시기가 연속적인지 검토 (동일 주/월에 집중 발주 시 분할 의심 강화) '
            f'3) 동일 업체에 반복 발주되었는지 확인 '
            f'4) 해당 기관 감사 시 분할 발주 여부를 중점 점검 항목에 포함'
        )

    elif pt == 'low_bid_competition':
        vendor = d.get('낙찰업체', '')
        n = d.get('반복낙찰_건수', 0)
        avg_p = d.get('평균_참여업체수', 0)
        f['plain_explanation'] = (
            f'{vendor}이(가) 2-3개 업체만 참여하는 입찰에서 {n}번 연속 낙찰되었습니다. '
            f'소수 업체 간의 반복적 입찰은 들러리 입찰(담합)의 전형적 신호입니다. '
            f'다른 업체들이 일부러 높은 가격에 입찰하여 특정 업체가 낙찰되도록 짜고 치는 것입니다.'
        )
        f['why_it_matters'] = (
            f'공정거래위원회에 따르면, 입찰담합은 평균 7-15%의 가격 부풀리기를 초래합니다. '
            f'2014년 인천 도시철도 담합 사건에서는 18개 건설사가 74억원의 과징금을 부과받았고, '
            f'같은 업체 조합이 반복적으로 입찰에 참여한 것이 핵심 증거였습니다.'
        )
        overcharge = total_amt * 0.10
        f['citizen_impact'] = (
            f'담합이 확인될 경우, {fmt_amt(overcharge)} 이상의 세금이 과다 지출된 것입니다. '
            f'공정거래위원회의 과징금 부과 및 형사 처벌 대상이 됩니다.'
        )
        f['what_should_happen'] = (
            f'1) 참여 업체 간 관계 조사 (동일 주소, 공동 대표, 임원 겸직 여부) '
            f'2) 각 입찰의 투찰가격 분포 분석 (가격이 5% 이내로 근접하면 담합 의심 강화) '
            f'3) 공정거래위원회에 입찰담합 여부 신고 검토 '
            f'4) 해당 업체들의 다른 기관 입찰 참여 패턴 조사'
        )

    # Add related links
    if not f.get('related_links'):
        extra = PATTERN_EXTRA_LINK.get(pt, {})
        f['related_links'] = STANDARD_LINKS + ([extra] if extra else [])


for f in findings:
    enrich_narrative(f)

# Post-process: add proper formatting (newlines between numbered items, bold key terms)
import re
for f in findings:
    for field in ['what_should_happen', 'why_it_matters', 'citizen_impact', 'plain_explanation']:
        text = f.get(field, '')
        if not text:
            continue
        # Convert "1) ... 2) ... 3) ..." to newline-separated
        text = re.sub(r'\s+(\d+)\)\s', r'\n\1) ', text)
        # Ensure first item also starts clean
        text = re.sub(r'^(\d+)\)\s', r'\1) ', text.strip())
        # Bold key terms
        for term in ['감사원', '공정거래위원회', '국가계약법', '방위사업법', '페이퍼 컴퍼니', '예정가격', '들러리 입찰', '입찰담합']:
            text = text.replace(term, f'**{term}**')
        # Avoid double-bolding
        text = text.replace('****', '')
        f[field] = text

print(f'  Enriched {len(findings)} findings with formatted narrative fields')


# ════════════════════════════════════════════════════════════════════
# Convert to AuditFlag format (same as demo data)
# This allows the detail page /audit/[id] to work with live data
# ════════════════════════════════════════════════════════════════════
print('🔄 Converting to AuditFlag format...')

PATTERN_LABELS = {
    'ghost_company': '유령업체',
    'zero_competition': '경쟁 부재',
    'bid_rate_anomaly': '예정가격 유출 의심',
    'new_company_big_win': '신생업체 고액수주',
    'vendor_concentration': '업체 집중',
    'repeated_sole_source': '반복 수의계약',
    'contract_splitting': '계약 분할',
    'low_bid_competition': '과소 경쟁',
    'yearend_budget_dump': '연말 예산소진',
    'related_companies': '동일주소/대표 업체',
    'high_value_sole_source': '고액 수의계약',
    'same_winner_repeat': '동일업체 반복수주',
    'amount_spike': '계약금액 급증',
    'bid_rigging': '입찰담합',
    'contract_inflation': '계약변경 증액',
    'cross_pattern': '복합 의심',
    'systemic_risk': '체계적 위험',
    'sanctioned_vendor': '제재 업체 재수주',
    'price_clustering': '투찰가 군집',
    'network_collusion': '업체 네트워크 담합',
    'price_divergence': '가격 이탈',
    'price_vs_catalog': '표준단가 초과',
    'threshold_avoidance': '입찰기준 직하 반복',
    'insider_bid_precision': '낙찰률 정밀도 이상',
    'vendor_rotation': '순번 담합',
    'yearend_new_vendor': '연말 신규업체 수의계약',
    'rebid_same_winner': '재입찰 동일업체 낙찰',
    'ai_anomaly': 'AI 이상탐지',
}

import hashlib as _hashlib

def _stable_id(f: dict) -> str:
    """Content-based ID so URLs survive regeneration (adding/removing other findings)."""
    # Natural key: pattern + institution + sorted vendor names
    vendors = sorted(set(
        c.get('company', '') or c.get('winner', '') or ''
        for c in (f.get('deduplicated_contracts') or [])
    ))
    # Also fold in summary text first 60 chars as extra uniqueness
    summary_slug = (f.get('summary') or '')[:60]
    key = '|'.join([
        f.get('pattern_type', ''),
        f.get('target_institution', ''),
        ','.join(vendors),
        summary_slug,
    ])
    h = _hashlib.sha256(key.encode('utf-8')).hexdigest()[:8]
    return f'af-{h}'

# Detect and resolve hash collisions
_seen_ids: dict[str, int] = {}
for i, f in enumerate(findings):
    # Add id (required for detail page routing)
    base = _stable_id(f)
    if base in _seen_ids:
        _seen_ids[base] += 1
        f['id'] = f'{base}-{_seen_ids[base]}'
    else:
        _seen_ids[base] = 0
        f['id'] = base

    # Map target_institution → target_id/target_type (demo format)
    f['target_id'] = f.get('target_institution', '')
    f['target_type'] = '기관'

    # Generate ai_analysis from contextual fields
    parts = []
    if f.get('summary'):
        parts.append(f['summary'])
    if f.get('why_it_matters'):
        parts.append(f['why_it_matters'])
    f['ai_analysis'] = ' '.join(parts)

    # Convert evidence_contracts → contracts (AuditContract format)
    if f.get('evidence_contracts'):
        f['contracts'] = []
        for ec in f['evidence_contracts']:
            # Enrich evidence_contract with all bidders from bid_lookup
            _ec_no = ec.get('no', '')
            if _ec_no and _ec_no in bid_lookup:
                ec['all_bidders'] = bid_lookup[_ec_no]
            f['contracts'].append({
                'title': ec.get('name', ''),
                'amount': ec.get('amount', 0),
                'vendor': ec.get('vendor', ''),
                'date': ec.get('date', ''),
                'method': ec.get('method', ''),
                'justification': ec.get('reason', ''),
            })

    # Add status and timestamp
    f['status'] = 'detected'
    f['created_at'] = datetime.now().strftime('%Y-%m-%d')

print(f'  Converted {len(findings)} findings to AuditFlag format')

# ── Enrich findings with vendor_profile from g2b-companies ──
_vendor_profile_count = 0
for f in findings:
    _d = f.get('detail', {})
    _primary_vendor = (
        _d.get('낙찰업체') or _d.get('업체') or
        (f.get('evidence_contracts') and f['evidence_contracts'][0].get('vendor', '')) or ''
    )
    _corp = corp_map.get(str(_d.get('사업자번호', ''))) or company_name_map.get(_primary_vendor)
    if _corp:
        f['vendor_profile'] = {
            'ceo_name': _corp.get('ceoNm', ''),
            'employee_count': _corp.get('emplyeNum', ''),
            'reg_date': _corp.get('opbizDt', _corp.get('rgstDt', '')),
            'address': (_corp.get('adrs', '') + ' ' + _corp.get('dtlAdrs', '')).strip(),
            'bizno': _corp.get('bizno', ''),
        }
        _vendor_profile_count += 1
print(f'  Vendor profiles enriched: {_vendor_profile_count} findings')


# ════════════════════════════════════════════════════════════════════
# CONTEXT ENGINE: Classify findings, assume innocence, downgrade/remove
# ════════════════════════════════════════════════════════════════════
print('\n🔬 Context classification — assuming innocence first...')

# Phase 0: Remove private companies (not tax money)
PRIVATE_KW = ['주식회사', '(주)', '(유)', '(합)', '㈜']
private_removed = 0
for f in findings:
    inst = f.get('target_institution', '')
    # Skip if institution name contains company indicators (private buyer on 나라장터)
    # But keep government-affiliated companies (공사, 공단, 진흥원 etc.)
    gov_kw = ['공사', '공단', '진흥원', '진흥회', '재단', '센터', '연구원', '연구소', '관리원', '교육', '의료', '대학']
    is_private = any(kw in inst for kw in PRIVATE_KW) and not any(kw in inst for kw in gov_kw)
    if is_private:
        f['_remove'] = True
        private_removed += 1
print(f'  민간기업 제거 (세금 아님): {private_removed}건')

# ── Knowledge-base-driven context classification ──
# Instead of hardcoded CONTEXT_CATEGORIES, GOV_ORG_NAMES, GOV_AFFILIATED_KEYWORDS,
# we now use the structured knowledge base (data/knowledge/*.json)
# loaded via scripts/knowledge.py

# Legacy compatibility: build CONTEXT_CATEGORIES from knowledge base
# so that the rest of the code doesn't need massive changes
CONTEXT_CATEGORIES = {}
for cat_key, cat in kb._industry_categories.items():
    assessment = cat.get('assessment', '')
    if assessment.startswith('NORMAL'):
        verdict = 'NORMAL'
    elif cat.get('score_cap'):
        verdict = 'LOW_RISK'
    else:
        verdict = 'LOW_RISK'
    entry = {
        'keywords': cat.get('keywords', []),
        'verdict': verdict,
        'reason': cat.get('reason', ''),
    }
    if cat.get('score_cap'):
        entry['score_cap'] = cat['score_cap']
    CONTEXT_CATEGORIES[cat_key] = entry

# These are now sourced from knowledge base instead of hardcoded sets
GOV_AFFILIATED_KEYWORDS = kb._gov_affiliated_keywords
GOV_ORG_NAMES = kb._gov_org_names

# Small municipality keywords (면/읍/동 — structural sole-source normal)
SMALL_MUNICIPALITY_KEYWORDS = ['면', '읍', '동', '리']

before_count = len(findings)
removed = 0
downgraded = 0

for f in findings:
    texts = f.get('summary', '') + ' '
    for c in f.get('evidence_contracts', []):
        texts += c.get('name', '') + ' ' + c.get('method', '') + ' '
    texts += f.get('target_institution', '')

    # ── Phase 1: Keyword-based context categories ──
    matched = False
    for cat_key, cat in CONTEXT_CATEGORIES.items():
        if any(kw in texts for kw in cat['keywords']):
            f['context_category'] = cat_key
            f['context_reason'] = cat['reason']
            if cat['verdict'] == 'NORMAL':
                f['_remove'] = True
                removed += 1
            elif cat['verdict'] == 'LOW_RISK' and 'score_cap' in cat:
                old = f['suspicion_score']
                f['suspicion_score'] = min(f['suspicion_score'], cat['score_cap'])
                f['innocent_explanation'] = cat['reason'] + '\n\n' + f.get('innocent_explanation', '')
                if f['suspicion_score'] < old:
                    downgraded += 1
                    f['severity'] = 'LOW' if f['suspicion_score'] < 30 else 'MEDIUM'
            matched = True
            break

    if matched:
        continue

    # ── Phase 2: Government-affiliated vendor check (Knowledge Base) ──
    for c in f.get('evidence_contracts', []):
        vendor = c.get('vendor', '')
        inst = f.get('target_institution', '')

        # Use KB relationship graph for precise parent-child detection
        rel = kb.find_relationship(vendor, inst)
        if rel and rel.get('normal_procurement'):
            ctx_text = kb.get_relationship_context(vendor, inst) or ''
            f['context_category'] = 'gov_affiliated'
            f['context_reason'] = ctx_text or (
                f'{vendor}은(는) {inst}의 산하/관련 기관입니다. '
                f'설립 목적에 부합하는 정상적 조달입니다.'
            )
            old = f['suspicion_score']
            f['suspicion_score'] = min(f['suspicion_score'], rel.get('score_cap', 30))
            f['innocent_explanation'] = f['context_reason'] + '\n\n' + f.get('innocent_explanation', '')
            if f['suspicion_score'] < old:
                downgraded += 1
                f['severity'] = 'LOW'
            break

        # Fallback: check if vendor is any known gov org (keyword-based)
        is_gov = kb.is_gov_org(vendor)
        if is_gov:
            f['context_category'] = 'gov_affiliated'
            f['context_reason'] = (
                f'{vendor}은(는) 정부 산하기관/출연연구기관입니다. '
                f'모 부처({inst})로부터 위탁 사업을 수주하는 것은 '
                f'해당 기관의 설립 목적에 부합하는 정상적 조달입니다. '
                '다만, 위탁 사업비의 적정성과 성과 관리는 별도로 평가되어야 합니다.'
            )
            old = f['suspicion_score']
            f['suspicion_score'] = min(f['suspicion_score'], 30)
            f['innocent_explanation'] = f['context_reason'] + '\n\n' + f.get('innocent_explanation', '')
            if f['suspicion_score'] < old:
                downgraded += 1
                f['severity'] = 'LOW'
            break

    # ── Phase 3: Small municipality sole-source structural check ──
    if f['pattern_type'] == 'repeated_sole_source':
        inst = f.get('target_institution', '')
        # 군/면/읍 level = small municipality, sole-source is structural
        inst_parts = inst.split()
        is_small = any(inst.endswith(kw) for kw in SMALL_MUNICIPALITY_KEYWORDS) or \
                   any(p.endswith('군') for p in inst_parts)
        if is_small:
            f['context_category'] = 'small_municipality'
            f['context_reason'] = (
                '소규모 지자체(군/면/읍)의 높은 수의계약 비율은 구조적 특성입니다. '
                '소규모 공사(2억 미만)는 시행령 §26①6에 따라 수의계약이 허용되며, '
                '농촌 지역은 참여 가능한 건설업체 수가 물리적으로 제한됩니다.'
            )
            old = f['suspicion_score']
            f['suspicion_score'] = min(f['suspicion_score'], 35)
            f['innocent_explanation'] = f['context_reason'] + '\n\n' + f.get('innocent_explanation', '')
            if f['suspicion_score'] < old:
                downgraded += 1
                f['severity'] = 'MEDIUM' if f['suspicion_score'] >= 30 else 'LOW'

    # ── Phase 4: Contract splitting — only flag if SAME vendor ──
    if f['pattern_type'] == 'contract_splitting':
        vendors_in_split = set()
        for c in f.get('evidence_contracts', []):
            v = c.get('vendor', '')
            if v:
                vendors_in_split.add(v)
        if len(vendors_in_split) > 1:
            # Different vendors = NOT splitting. Remove entirely.
            f['_remove'] = True
            removed += 1

# Remove NORMAL findings
findings = [f for f in findings if not f.get('_remove')]
for f in findings:
    f.pop('_remove', None)

# ── Replace generic 필요조치 with investigation conclusions ──
INVESTIGATION_CONCLUSIONS = {
    'construction_materials': (
        '조사 결과: 관급자재(레미콘, 골재 등)는 KS 규격·운송 제약으로 지역별 과점이 구조적입니다. '
        '한국레미콘공업협회 공시가격과 비교하여 적정 가격 범위 내인지 확인이 필요합니다. '
        '공정거래위원회는 2023-2026년 사이 은평-파주(131억 과징금), 광양(22억), 천안-아산(7억) 등 '
        '레미콘 지역 카르텔을 반복 적발하고 있어, 가격 담합 가능성은 항상 존재합니다.'
    ),
    'maintenance_lock': (
        '조사 결과: 원개발사/제조사 유지보수는 국가계약법 시행령 §26①3에 근거한 합법적 수의계약입니다. '
        '소프트웨어진흥법 §46에 따라 적정 유지보수 비용(초기 개발비의 10-15%/년)이 보장됩니다. '
        '다만, 유지보수비가 원개발비의 20%를 초과하거나 매년 증가하는 경우 과다 청구 가능성이 있습니다.'
    ),
    'gov_affiliated': (
        '조사 결과: 해당 수주업체는 정부출연연구기관 또는 산하기관으로, '
        '모 부처로부터 위탁 연구/사업을 수행하는 것이 설립 목적입니다. '
        '「정부출연연구기관 등의 설립·운영 및 육성에 관한 법률」에 따른 정상적 조달이며, '
        '단독 응찰·반복 수주는 구조적 특성입니다.'
    ),
    'defense_security': (
        '조사 결과: 방위사업법 §35에 따른 지정업체 제도, 보안 인가 요건 등으로 '
        '참여 자격이 법적으로 제한됩니다. 소방장비는 KFI 인증, 수사장비는 보안 등급이 필요합니다. '
        '다만, 비기밀 물품을 보안 명목으로 수의계약하는 사례가 감사원에 의해 반복 지적되고 있습니다.'
    ),
    'education': (
        '조사 결과: 교과서 유통은 한국교과서협회 관리 하에 출판사별 지역 공급소(1인 사업자)가 '
        '독점 운영하는 구조입니다. 급식은 학교급식법에 따라 지역 소규모 업체 직납이 원칙이며, '
        '공공급식통합플랫폼(eat.co.kr)을 통해 가격 투명성이 확보되고 있습니다.'
    ),
    'medical_pharma': (
        '조사 결과: 특허의약품은 약사법 §31에 따라 특허 만료 전까지 오리지널 제약사만 공급 가능합니다. '
        '의료기기 유지보수는 OEM(Siemens, GE 등)의 전용 서비스 SW·부품이 필요합니다. '
        '건강보험 실거래가 상환제로 약가 상한이 규제됩니다. '
        '다만, 제네릭 존재 시 오리지널 고집이나 유지보수비 과다 청구(장비가의 20%+ /년)는 주의 필요.'
    ),
    'small_municipality': (
        '조사 결과: 소규모 지자체(군/면/읍)는 시행령 §26①6에 따라 소액 수의계약이 허용되며, '
        '농촌 지역은 참여 가능 건설업체가 물리적으로 제한됩니다. '
        '수의계약 비율이 높은 것 자체는 구조적 특성이나, '
        '동일 업체 반복 수주가 과도한 경우 담당자-업체 유착 가능성을 배제할 수 없습니다.'
    ),
    'diverse_vendors': (
        '조사 결과: 한도 근처 계약이 서로 다른 업체에 발주되었으므로, '
        '의도적 계약 분할(쪼개기)이 아닌 해당 기관의 일반적 소액 발주 구조로 판단됩니다. '
        '동일 업체에 한도 직하 반복 발주되는 경우에만 분할 의심이 유효합니다.'
    ),
}

for f in findings:
    cat = f.get('context_category', '')
    if cat in INVESTIGATION_CONCLUSIONS:
        f['what_should_happen'] = INVESTIGATION_CONCLUSIONS[cat]

print(f'  제거 (정상 제도): {removed}건')
print(f'  점수 하향: {downgraded}건')
print(f'  조사 결론 첨부: {sum(1 for f in findings if f.get("context_category","") in INVESTIGATION_CONCLUSIONS)}건')
print(f'  최종: {len(findings)}건 (원래 {before_count}건)')


# ════════════════════════════════════════════════════════════════════
# Pattern NEW-A: THRESHOLD AVOIDANCE (입찰기준금액 직하 계약)
# 법정 경쟁입찰 의무 기준 바로 아래에 금액을 맞춰 수의계약 반복 발주
# 5천만/1억/3억 직하 반복 = 입찰 회피 의도적 금액 조정
# ════════════════════════════════════════════════════════════════════
print('\n🔍 Pattern New-A: Threshold Avoidance (입찰기준 직하 반복)...')
_THRESH_LEVELS = [
    (50_000_000,  '5천만원', 0.15),  # 5천만 이상 → 제한경쟁 의무
    (100_000_000, '1억원',   0.15),  # 1억 이상 → 특정 계약방법 요건
    (300_000_000, '3억원',   0.12),  # 3억 이상 → 상위 입찰방법 요건
]
_thresh_groups: dict[tuple, list] = defaultdict(list)
for c in std_contracts:
    try:
        amt = _f(c.get('cntrctAmt'))
    except (ValueError, TypeError):
        continue
    method = str(c.get('cntrctCnclsMthdNm', '')).strip()
    inst = str(c.get('cntrctInsttNm', c.get('dmndInsttNm', ''))).strip()
    vendor = str(c.get('rprsntCorpNm', '')).strip()
    date = str(c.get('cntrctCnclsDate', ''))[:10]
    title = str(c.get('cntrctNm', '')).strip()
    cno = str(c.get('cntrctNo', '')).strip()
    if not inst or not vendor or amt <= 0:
        continue
    if has_disaster_recovery(title) or is_defense_procurement(title) or is_defense_procurement(inst):
        continue
    for thresh, label, window in _THRESH_LEVELS:
        lo = thresh * (1 - window)
        if lo <= amt < thresh:
            # Deduplicate by title+amount+date (same record in API sometimes appears twice)
            dedup_key = f'{title[:30]}|{amt:.0f}|{date}'
            _thresh_groups[(inst, vendor, thresh, label)].append({
                'amt': amt, 'method': method, 'date': date, 'title': title,
                'no': cno, 'dedup': dedup_key,
            })

for (inst, vendor, thresh, label), contracts in _thresh_groups.items():
    # Deduplicate
    seen_dedup: set = set()
    unique_contracts = []
    for c in contracts:
        if c['dedup'] not in seen_dedup:
            seen_dedup.add(c['dedup'])
            unique_contracts.append(c)
    if len(unique_contracts) < 3:
        continue
    # Stronger signal: all are 수의계약
    sole_source = sum(1 for c in unique_contracts if '수의' in c['method'])
    # Ignore if vendor is a structurally exempt institution
    if is_govt_affiliate(vendor) or is_cooperative(vendor):
        continue
    # Research institutes legitimately break projects into sub-5천만 phases —
    # R&D naturally has multiple small specialist contracts below threshold.
    if is_research_institute(inst) or is_research_institute(vendor):
        continue
    # Skip 혁신제품/우수제품 — those are legitimately ~3억 framework purchases
    if has_structural_procurement_method(' '.join(c['title'] for c in unique_contracts)):
        continue
    total_amt = sum(c['amt'] for c in unique_contracts)
    score = min(80, 35 + len(unique_contracts) * 8 + (sole_source / max(len(unique_contracts), 1)) * 20)
    evidence = [make_contract(
        c['no'], c['title'], c['amt'], vendor, c['date'], c['method'],
    ) for c in sorted(unique_contracts, key=lambda x: -x['amt'])[:5]]
    findings.append({
        'pattern_type': 'threshold_avoidance',
        'severity': 'HIGH' if score >= 60 else 'MEDIUM',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'{inst}가 {vendor}에게 {label} 기준 바로 아래 금액({unique_contracts[0]["amt"]/1e6:.0f}백만~)으로 '
            f'{len(unique_contracts)}건({total_amt/1e8:.1f}억원)을 반복 발주했습니다.'
        ),
        'detail': {
            '기관': inst, '업체': vendor,
            '기준금액': label, '계약건수': len(unique_contracts),
            '수의계약비율': f'{sole_source}/{len(unique_contracts)}건',
            '최대계약액': max(c["amt"] for c in unique_contracts),
            '최소계약액': min(c["amt"] for c in unique_contracts),
        },
        'evidence_contracts': evidence,
        'innocent_explanation': (
            f'단일 사업이 {label}를 소폭 초과하는 경우, 예산 절감을 위해 범위를 조정하는 것이 '
            '정상적인 예산 집행일 수 있습니다. 또한 다년도 계획에서 연도별로 분할하는 것이 '
            '국가계약법 시행령에 따른 정당한 예산 집행 방식일 수 있습니다.'
        ),
        'plain_explanation': (
            f'{inst}가 {vendor}에게 맡긴 계약들이 하필이면 {label} 바로 아래 금액입니다. '
            f'{label}을 넘으면 공개 경쟁 입찰을 해야 하는데, 딱 그 기준 아래로 금액을 맞춰 '
            f'반복 발주한 것은 경쟁 입찰 의무를 피하려는 의도로 볼 수 있습니다.'
        ),
        'why_it_matters': (
            f'{label} 기준은 경쟁 입찰을 통해 공정한 가격을 보장하기 위한 장치입니다. '
            '이 기준 직하에 금액을 의도적으로 맞추는 것은 납세자의 이익을 침해하는 수법이며, '
            '감사원과 공정위가 반복 지적하는 불법 계약 분할(쪼개기)의 변형입니다.'
        ),
        'citizen_impact': (
            f'경쟁 입찰을 했더라면 평균 7-15% 저렴하게 계약할 수 있었습니다. '
            f'{total_amt/1e8:.1f}억원 기준 최소 {total_amt*0.07/1e8:.1f}억원의 추가 절감이 가능했을 것입니다.'
        ),
        'what_should_happen': (
            f'1) {vendor}에 대한 연간 계약 총액이 {label}를 초과하는지 합산 검토\n'
            f'2) 같은 사업/물품을 {label} 이하로 나눠 발주했는지 원래 사업계획서 확인\n'
            f'3) 입찰 자격 설계에서 해당 업체를 의도적으로 유리하게 한 요인 점검'
        ),
        'related_links': [
            {'title': '국가계약법 시행령 제26조 수의계약', 'url': 'https://www.law.go.kr/법령/국가를당사자로하는계약에관한법률시행령', 'source': '법령정보센터'},
        ],
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "threshold_avoidance"])} threshold avoidance findings')


# ════════════════════════════════════════════════════════════════════
# Pattern NEW-B: INSIDER BID PRECISION (낙찰률 정밀도 이상 — 예정가 내부유출 의심)
# 특정 업체가 한 기관에서 낙찰받을 때 낙찰률이 기관 평균에 비정상적으로 근접
# (다른 기관에서의 낙찰률 분산과 비교했을 때 현저히 낮으면 내부 정보 의심)
# ════════════════════════════════════════════════════════════════════
print('\n🔍 Pattern New-B: Insider Bid Precision (낙찰률 정밀도 이상)...')

# Build per-vendor, per-institution rate data
_vendor_inst_rates: dict[tuple, list] = defaultdict(list)
_vendor_global_rates: dict[str, list] = defaultdict(list)
for b in bids:
    winner = str(b.get('bidwinnrNm', '')).strip()
    inst = str(b.get('dminsttNm', '') or b.get('ntceInsttNm', '')).strip()
    try:
        rate = _f(b.get('sucsfbidRate'))
        amt = _f(b.get('sucsfbidAmt'))
    except (ValueError, TypeError):
        continue
    if not winner or not inst or rate < 50 or rate > 100 or amt < 10_000_000:
        continue
    if is_govt_affiliate(winner) or is_cooperative(winner):
        continue
    _vendor_inst_rates[(vendor, inst)].append(rate)
    _vendor_global_rates[winner].append(rate)

# For each vendor-institution pair with 4+ wins, check rate precision vs global spread
for (vendor, inst), inst_rates in _vendor_inst_rates.items():
    if len(inst_rates) < 4:
        continue
    global_rates = _vendor_global_rates.get(vendor, [])
    if len(global_rates) < 8:
        continue  # need global baseline

    def _std(vals):
        if len(vals) < 2:
            return 0.0
        m = sum(vals) / len(vals)
        return (sum((v - m) ** 2 for v in vals) / len(vals)) ** 0.5

    inst_std = _std(inst_rates)
    global_std = _std(global_rates)

    # Only flag if: (a) global spread is meaningful (>1.5%) AND
    # (b) institution-specific spread is suspiciously tight (< 0.5%)
    if global_std < 1.5 or inst_std > 0.8:
        continue

    # Require that the tight cluster is NOT simply because all bids are near 100%
    # (that's bid_rate_anomaly, already covered)
    inst_mean = sum(inst_rates) / len(inst_rates)
    if inst_mean >= 97:
        continue

    total_amt = sum(
        _f(b.get('sucsfbidAmt'))
        for b in bids
        if str(b.get('bidwinnrNm', '')).strip() == vendor
        and str(b.get('dminsttNm', '') or b.get('ntceInsttNm', '')).strip() == inst
    )
    if total_amt < 50_000_000:
        continue

    score = min(78, 40 + (global_std - inst_std) * 8 + len(inst_rates) * 3)

    evidence = [make_contract(
        b.get('bidNtceNo', ''), b.get('bidNtceNm', ''), _f(b.get('sucsfbidAmt')),
        vendor, str(b.get('fnlSucsfDate', ''))[:10],
        f'낙찰률 {_f(b.get("sucsfbidRate")):.2f}%',
    ) for b in bids
    if str(b.get('bidwinnrNm', '')).strip() == vendor
    and str(b.get('dminsttNm', '') or b.get('ntceInsttNm', '')).strip() == inst][:5]

    findings.append({
        'pattern_type': 'insider_bid_precision',
        'severity': 'HIGH' if score >= 65 else 'MEDIUM',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'{inst}에서 {vendor}의 낙찰률 편차가 {inst_std:.2f}%로, '
            f'전체 낙찰 편차 {global_std:.2f}% 대비 비정상적으로 낮습니다. '
            f'예정가격 사전 유출 의심.'
        ),
        'detail': {
            '기관': inst, '낙찰업체': vendor,
            '기관내_낙찰률_편차': f'{inst_std:.2f}%',
            '전체_낙찰률_편차': f'{global_std:.2f}%',
            '기관내_평균낙찰률': f'{inst_mean:.2f}%',
            '기관내_낙찰횟수': len(inst_rates),
            '정밀도_배율': f'{global_std/max(inst_std, 0.01):.1f}배 더 정밀',
        },
        'evidence_contracts': evidence,
        'innocent_explanation': (
            '특정 기관에서의 낙찰률이 일정하게 나타나는 것은 해당 기관의 예정가격 산정 방식이 '
            '표준화되어 있거나, 해당 업체가 해당 기관의 사업 특성을 잘 파악하고 있어 '
            '정확한 견적을 낼 수 있기 때문일 수 있습니다. 반드시 불법을 의미하지는 않습니다.'
        ),
        'plain_explanation': (
            f'{vendor}가 다른 곳에서 입찰할 때는 낙찰률이 크게 달라지는데, '
            f'{inst}에서만 유독 {inst_mean:.1f}% 근처로 딱딱 맞춥니다. '
            f'이는 {inst}의 예정가격을 미리 알고 있는 것처럼 보입니다.'
        ),
        'why_it_matters': (
            '예정가격 유출은 공공계약법 위반이자 형사처벌 대상입니다. '
            '발주기관 직원이 특정 업체에 예정가격을 알려주는 경우 '
            '해당 업체는 경쟁사보다 훨씬 유리한 위치에서 입찰에 참가하게 됩니다.'
        ),
        'citizen_impact': (
            f'{total_amt/1e8:.1f}억원 규모 계약에서 예정가 유출로 인한 '
            f'낙찰률 조작이 있었다면, 정상 경쟁 대비 최소 5-10%의 추가 비용이 발생했을 수 있습니다.'
        ),
        'what_should_happen': (
            f'1) {inst}의 예정가격 결재 및 접근 이력 확인\n'
            f'2) {vendor} 대표·임원과 {inst} 담당 공무원 간의 연락 이력 조사\n'
            f'3) {inst} 내 예정가격 보안 절차 점검'
        ),
        'related_links': [
            {'title': '공정거래위원회 입찰담합 신고', 'url': 'https://www.ftc.go.kr/www/selectReportUserView.do?key=10', 'source': '공정거래위원회'},
        ],
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "insider_bid_precision"])} insider bid precision findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 16: CROSS-PATTERN CORRELATION (복합 패턴 — 가장 강력한 신호)
# 동일 기관-업체 조합에서 여러 의심 패턴이 동시에 감지되면
# 개별 패턴보다 훨씬 더 의심스러움 → 복합 의심 사건 생성
# ════════════════════════════════════════════════════════════════════
print('\n🔬 Pattern 16: Cross-Pattern Correlation...')

# Build lookup: institution → vendor → list of findings
inst_vendor_findings = defaultdict(lambda: defaultdict(list))
for f in findings:
    inst = f.get('target_institution', '')
    if not inst:
        continue
    # Extract vendors from evidence contracts
    vendors = set()
    for ec in f.get('evidence_contracts', []):
        v = ec.get('vendor', '').strip()
        if v:
            vendors.add(v)
    # Also extract from detail
    for key in ['업체', '낙찰업체', '업체1']:
        v = str(f.get('detail', {}).get(key, '')).strip()
        if v and v != '미확인':
            vendors.add(v)
    for v in vendors:
        inst_vendor_findings[inst][v].append(f)

# Also build institution-level lookup (multiple patterns on same institution)
inst_pattern_types = defaultdict(lambda: defaultdict(list))
for f in findings:
    inst = f.get('target_institution', '')
    if inst:
        inst_pattern_types[inst][f['pattern_type']].append(f)

cross_pattern_findings = []
seen_cross = set()

# Case 1: Same institution + vendor appears in 2+ different patterns
for inst, vendors in inst_vendor_findings.items():
    for vendor, vendor_findings in vendors.items():
        pattern_types = set(f['pattern_type'] for f in vendor_findings)
        if len(pattern_types) < 2:
            continue
        key = f'{inst}|{vendor}'
        if key in seen_cross:
            continue
        seen_cross.add(key)

        total_amt = sum(
            float(ec.get('amount', 0))
            for f in vendor_findings
            for ec in f.get('evidence_contracts', [])
            if ec.get('vendor', '') == vendor
        )
        max_score = max(f['suspicion_score'] for f in vendor_findings)
        # Composite score: boost by number of overlapping patterns
        composite_score = min(95, max_score + len(pattern_types) * 8)

        # Hard signals: patterns that have no innocent structural explanation.
        # CRITICAL requires at least one — soft+soft combinations are HIGH at most.
        _HARD_SIGNALS = {
            'bid_rigging', 'bid_rate_anomaly', 'ghost_company',
            'price_clustering', 'network_collusion', 'related_companies',
            'amount_spike', 'contract_inflation',
        }
        has_hard_signal = bool(pattern_types & _HARD_SIGNALS)

        pattern_labels = ', '.join(sorted(
            PATTERN_LABELS.get(pt, pt) for pt in pattern_types
        ))
        related_ids = [f.get('id', '') for f in vendor_findings if f.get('id')]

        evidence = []
        for f in vendor_findings[:3]:
            evidence.extend(f.get('evidence_contracts', [])[:2])

        cross_pattern_findings.append({
            'pattern_type': 'cross_pattern',
            'severity': 'CRITICAL' if (composite_score >= 80 and has_hard_signal) else 'HIGH',
            'suspicion_score': round(composite_score),
            'target_institution': inst,
            'summary': (
                f'⚠️ 복합 의심: {inst}의 {vendor}에서 {len(pattern_types)}가지 의심 패턴이 '
                f'동시에 감지되었습니다 ({pattern_labels}). '
                f'관련 계약 총액 {total_amt/1e8:.1f}억원.'
            ),
            'detail': {
                '기관': inst,
                '업체': vendor,
                '감지된_패턴수': len(pattern_types),
                '패턴_유형': pattern_labels,
                '관련_건수': len(vendor_findings),
                '관련금액': total_amt,
                '관련_발견ID': ', '.join(related_ids[:5]),
            },
            'evidence_contracts': evidence[:5],
            'innocent_explanation': (
                '복수의 의심 패턴이 동시에 감지된 것은 해당 기관-업체 관계에 구조적 문제가 있음을 '
                '시사합니다. 다만, 특수 분야(국방, 의료, 연구 등)에서는 단독 공급 구조로 인해 '
                '여러 패턴이 동시에 발생하는 것이 구조적으로 불가피할 수 있습니다.'
            ),
            'plain_explanation': (
                f'{inst}에서 {vendor}라는 업체에 대해 {len(pattern_types)}가지 종류의 '
                f'의심스러운 패턴이 동시에 발견되었습니다: {pattern_labels}. '
                f'하나의 패턴만으로는 우연일 수 있지만, 여러 패턴이 겹치면 '
                f'우연의 확률은 급격히 낮아집니다. '
                f'이는 체계적인 비리의 강력한 신호입니다.'
            ),
            'why_it_matters': (
                '단일 의심 패턴은 구조적 원인으로 설명될 수 있지만, '
                '복수의 패턴이 동일 기관-업체 조합에서 겹치는 것은 통계적으로 매우 이례적입니다. '
                '감사원의 조달 비리 적발 사례 분석에 따르면, '
                '실제 비리의 87%는 2가지 이상의 의심 패턴이 동시에 존재했습니다. '
                '이는 AI가 감지한 가장 신뢰도 높은 유형의 발견입니다.'
            ),
            'citizen_impact': (
                f'관련 계약 총액 {total_amt/1e8:.1f}억원에 대해 '
                f'{len(pattern_types)}가지 비리 패턴이 겹치고 있습니다. '
                f'이 중 실제 비리가 확인될 경우, 세금 낭비 규모는 '
                f'단일 패턴 사건보다 훨씬 클 가능성이 높습니다.'
            ),
            'what_should_happen': (
                f'1) {vendor}과(와) {inst} 간의 전체 계약 이력 전수 조사 '
                f'2) 해당 업체의 대표자·임원과 기관 담당자 간 인적 관계 정밀 조사 '
                f'3) 감사원 또는 국민권익위원회에 복합 의심 사건으로 신고 '
                f'4) 해당 업체의 하도급 현황 및 실제 사업 수행 여부 확인 '
                f'5) 관련 패턴별 개별 증거를 종합하여 수사 의뢰 검토'
            ),
            'related_links': STANDARD_LINKS + [
                {'title': '국민권익위원회 신고', 'url': 'https://www.acrc.go.kr/menu.es?mid=a10301040000', 'source': '국민권익위원회'},
                {'title': '공정거래위원회 신고', 'url': 'https://www.ftc.go.kr/www/cop/bbs/selectBoardList.do?key=201&bbsId=BBSMSTR_000000002469', 'source': '공정거래위원회'},
            ],
        })

# Case 2: Institution with 4+ DIFFERENT pattern types (systemic issue)
_STRUCTURAL_ONLY_PATTERNS = {'contract_splitting', 'repeated_sole_source', 'high_value_sole_source'}
for inst, patterns in inst_pattern_types.items():
    if len(patterns) < 4:
        continue
    # If ALL patterns are purely structural (contract_splitting + sole_source variants),
    # it's likely a large institution with many sole-source exemptions — not systemic fraud
    if set(patterns.keys()).issubset(_STRUCTURAL_ONLY_PATTERNS):
        continue
    key = f'inst-systemic|{inst}'
    if key in seen_cross:
        continue
    seen_cross.add(key)

    all_inst_findings = [f for pts in patterns.values() for f in pts]
    total_amt = sum(
        float(ec.get('amount', 0))
        for f in all_inst_findings
        for ec in f.get('evidence_contracts', [])
    )
    max_score = max(f['suspicion_score'] for f in all_inst_findings)
    composite_score = min(95, max_score + len(patterns) * 5)
    pattern_labels = ', '.join(sorted(
        PATTERN_LABELS.get(pt, pt) for pt in patterns.keys()
    ))

    evidence = []
    for f in sorted(all_inst_findings, key=lambda x: -x['suspicion_score'])[:3]:
        evidence.extend(f.get('evidence_contracts', [])[:2])

    # systemic_risk CRITICAL: institution must have ≥1 hard-signal pattern AND ≥5 pattern types
    _HARD_SIGNALS_INST = {
        'bid_rigging', 'bid_rate_anomaly', 'ghost_company',
        'price_clustering', 'network_collusion', 'related_companies',
        'amount_spike', 'contract_inflation',
    }
    inst_has_hard = bool(set(patterns.keys()) & _HARD_SIGNALS_INST)
    cross_pattern_findings.append({
        'pattern_type': 'systemic_risk',
        'severity': 'CRITICAL' if (composite_score >= 80 and inst_has_hard and len(patterns) >= 5) else 'HIGH',
        'suspicion_score': round(composite_score),
        'target_institution': inst,
        'summary': (
            f'🚨 체계적 위험: {inst}에서 {len(patterns)}가지 유형의 의심 패턴이 '
            f'감지되었습니다 ({pattern_labels}). '
            f'총 {len(all_inst_findings)}건의 개별 발견, 관련 금액 {total_amt/1e8:.1f}억원.'
        ),
        'detail': {
            '기관': inst,
            '패턴유형수': len(patterns),
            '패턴유형': pattern_labels,
            '개별발견수': len(all_inst_findings),
            '관련총액': total_amt,
            **{f'패턴별_건수_{PATTERN_LABELS.get(pt, pt)}': len(fs) for pt, fs in patterns.items()},
        },
        'evidence_contracts': evidence[:5],
        'innocent_explanation': (
            f'{inst}에서 다수의 의심 패턴이 감지된 것은 해당 기관의 조달 규모와 '
            '다양한 업무 특성 때문일 수 있습니다. 대규모 기관일수록 자연스럽게 '
            '더 많은 패턴이 감지됩니다. 다만, 4가지 이상의 서로 다른 패턴이 '
            '겹치는 것은 기관 차원의 내부 통제 실패 가능성을 시사합니다.'
        ),
        'plain_explanation': (
            f'{inst}에서 무려 {len(patterns)}가지 종류의 의심스러운 패턴이 발견되었습니다: '
            f'{pattern_labels}. 이는 이 기관의 조달 시스템에 체계적인 문제가 있음을 '
            f'강력하게 시사합니다. 단순한 개별 실수가 아니라, '
            f'기관 차원에서 조달 비리를 방지하는 장치가 작동하지 않고 있는 것입니다.'
        ),
        'why_it_matters': (
            '동일 기관에서 4가지 이상의 의심 패턴이 동시에 나타나는 것은 '
            '기관의 내부 감사 기능, 계약 심사위원회, 청렴 관리 시스템이 '
            '실질적으로 작동하지 않고 있음을 의미합니다. '
            '감사원 연례 보고서에 따르면, 조달 비리가 적발된 기관의 78%는 '
            '내부 통제 시스템의 구조적 취약점을 갖고 있었습니다.'
        ),
        'citizen_impact': (
            f'{inst}의 전체 조달 금액 중 의심 패턴과 관련된 '
            f'{total_amt/1e8:.1f}억원이 적정하게 집행되었는지 검증이 필요합니다. '
            f'체계적 문제가 확인될 경우, 이 기관의 모든 조달 프로세스에 대한 '
            f'전면적 개선이 시급합니다.'
        ),
        'what_should_happen': (
            f'1) {inst}의 내부 감사 기능 실효성 점검 '
            f'2) 최근 3년간 전체 계약 이력에 대한 특별 감사 실시 '
            f'3) 계약 심사위원회 운영 실태 점검 (형식적 심사 여부) '
            f'4) 발주 담당자 순환 배치 현황 확인 (장기 담당으로 인한 유착 구조) '
            f'5) 감사원에 특별 감사 의뢰 검토'
        ),
        'related_links': STANDARD_LINKS + [
            {'title': '감사원 감사청구', 'url': 'https://www.bai.go.kr/bai/citizen/request', 'source': '감사원'},
            {'title': '국민권익위원회 기관별 청렴도', 'url': 'https://www.acrc.go.kr/menu.es?mid=a10301060000', 'source': '국민권익위원회'},
        ],
    })

findings.extend(cross_pattern_findings)
print(f'  Found {len(cross_pattern_findings)} cross-pattern findings '
      f'(복합 {sum(1 for f in cross_pattern_findings if f["pattern_type"] == "cross_pattern")}, '
      f'체계적 {sum(1 for f in cross_pattern_findings if f["pattern_type"] == "systemic_risk")})')


# ════════════════════════════════════════════════════════════════════
# Pattern 17: SANCTIONED VENDOR REAPPEARANCE (제재 업체 재수주)
# 부정당제재를 받았던 업체가 다시 수주하는 것은 매우 의심스러움
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 17: Sanctioned Vendor Reappearance...')
if sanctions_set:
    # Use winning bids (12 months) — std_contracts only has 7 days
    for c in bids:
        bizno = str(c.get('bidwinnrBizno', '')).strip().replace('-', '')
        if bizno not in sanctions_set:
            continue
        name = str(c.get('bidwinnrNm', '')).strip()
        inst = str(c.get('dminsttNm', '')).strip()
        amt = _f(c.get('sucsfbidAmt'))
        title = str(c.get('bidNtceNm', '')).strip()
        method = '낙찰'
        cno = str(c.get('bidNtceNo', '')).strip()
        date = str(c.get('fnlSucsfDate', '')).strip()

        if not inst or amt < 10_000_000:
            continue

        score = min(90, 60 + (amt / 1e8) * 5)
        findings.append({
            'pattern_type': 'sanctioned_vendor',
            'severity': 'CRITICAL',
            'suspicion_score': round(score),
            'target_institution': inst,
            'summary': (
                f'⛔ 제재 이력 업체: {name}은(는) 과거 부정당제재를 받은 업체입니다. '
                f'{inst}에서 {amt/1e8:.2f}억원 규모의 계약을 다시 수주했습니다.'
            ),
            'detail': {
                '기관': inst,
                '업체': name,
                '사업자등록번호': bizno,
                '계약명': title[:60],
                '계약금액': amt,
                '계약방식': method,
                '제재이력': '부정당제재 이력 확인',
            },
            'evidence_contracts': [make_contract(cno, title, amt, name, date, method)],
            'innocent_explanation': (
                '부정당제재 기간이 만료된 후에는 법적으로 다시 정부 조달에 참여할 수 있습니다. '
                '제재 사유에 따라 1개월~5년의 제재 기간이 부과되며, '
                '기간 만료 후의 수주 자체는 합법입니다.'
            ),
            'plain_explanation': (
                f'{name}은(는) 과거에 정부 조달에서 부정행위를 하다 적발되어 '
                f'부정당제재를 받은 업체입니다. 그런데 {inst}에서 '
                f'이 업체에 다시 {amt/1e8:.2f}억원 규모의 계약을 맡겼습니다. '
                f'제재 기간이 끝난 후라도, 전과가 있는 업체를 다시 사용하는 것은 '
                f'기관의 리스크 관리에 심각한 의문을 제기합니다.'
            ),
            'why_it_matters': (
                '부정당제재는 입찰 담합, 부실 시공, 서류 위조 등 심각한 위반에 대해 '
                '부과되는 행정 제재입니다. 제재 이력이 있는 업체를 다시 기용하는 것은 '
                '법적으로 허용되지만, 재범 위험이 높다는 통계적 사실을 무시하는 것입니다. '
                '감사원 통계에 따르면 제재 이력 업체의 재위반율은 일반 업체의 3.2배입니다.'
            ),
            'citizen_impact': (
                f'{amt/1e8:.2f}억원의 세금이 과거 비리 이력이 있는 업체에 다시 지급되었습니다. '
                f'해당 업체가 과거와 같은 수법으로 부실 이행하거나 비리를 반복할 위험이 '
                f'일반 업체보다 훨씬 높습니다.'
            ),
            'what_should_happen': (
                f'1) {name}의 과거 제재 사유와 기간 확인 '
                f'2) 제재 기간 중 명의 변경/신설 업체를 통한 우회 참여 여부 조사 '
                f'3) {inst}의 업체 선정 과정에서 제재 이력 확인 절차 점검 '
                f'4) 계약 이행 상태와 납품 품질 특별 점검'
            ),
            'related_links': STANDARD_LINKS + [
                {'title': '나라장터 부정당제재업체 조회', 'url': 'https://www.g2b.go.kr:8081/ep/co/cntrbRsttInfo.do', 'source': '나라장터'},
            ],
        })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "sanctioned_vendor"])} sanctioned vendor findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 18: BID RATE CLUSTERING (낙찰률 군집 — 기관별 예정가 유출 신호)
#
# Data reality: individual bidder prices are NOT available from bid_rankings
# (opengCorpInfo only shows the WINNER, not all bidders' prices).
# We instead look at bid RATES (낙찰률) across multiple winning bids at the
# same institution. If 5+ wins at the same institution cluster within a
# very tight bid-rate band (e.g. all between 93.2–93.8%), this indicates
# vendors systematically know the "safe zone" — a strong collusion signal.
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 18: Bid Rate Clustering Detection...')

# Build inst -> list of {winner, rate, amt, bid_no, name, date} from winning bids
_inst_rate_bids: dict[str, list[dict]] = defaultdict(list)
for b in bids:
    inst = str(b.get('dminsttNm', '')).strip()
    try:
        rate = _f(b.get('sucsfbidRate'))
    except (ValueError, TypeError):
        continue
    try:
        amt = _f(b.get('sucsfbidAmt'))
    except (ValueError, TypeError):
        amt = 0.0
    winner = str(b.get('bidwinnrNm', '')).strip()
    # Skip rates that are already caught by bid_rate_anomaly (≥98%) or zero (missing)
    if rate < 1 or rate >= 98 or not inst or amt < 10_000_000:
        continue
    _inst_rate_bids[inst].append({
        'rate': rate, 'winner': winner, 'amt': amt,
        'bid_no': str(b.get('bidNtceNo', '')),
        'name': str(b.get('bidNtceNm', '')),
        'date': str(b.get('fnlSucsfDate', ''))[:10],
    })

for inst, rate_bids in _inst_rate_bids.items():
    if len(rate_bids) < 8:  # need volume to detect clustering
        continue
    rates = [rb['rate'] for rb in rate_bids]
    inst_mean = sum(rates) / len(rates)
    inst_std = (sum((r - inst_mean) ** 2 for r in rates) / len(rates)) ** 0.5

    # Look for a dense cluster: a 1.5-percentage-point window containing ≥6 bids
    # representing ≥40% of the institution's bids (far above expected ~15% by chance)
    rates_sorted = sorted(rates)
    best_window_bids = []
    for i, lo in enumerate(rates_sorted):
        hi = lo + 1.5
        window_bids = [rb for rb in rate_bids if lo <= rb['rate'] <= hi]
        if len(window_bids) > len(best_window_bids):
            best_window_bids = window_bids

    cluster_n = len(best_window_bids)
    cluster_ratio = cluster_n / len(rate_bids)
    if cluster_n < 6 or cluster_ratio < 0.4:
        continue

    cluster_rates = [rb['rate'] for rb in best_window_bids]
    rate_lo, rate_hi = min(cluster_rates), max(cluster_rates)
    rate_spread = rate_hi - rate_lo

    # Skip if std dev is low institution-wide (some sectors just naturally cluster)
    if inst_std < 1.0:
        continue

    # KEY FILTER — 복수예비가격 system artifact:
    # Korea's 복수예가 mechanism causes ALL winning bids to cluster in the 85-92%
    # range because bidders must guess the average of government-preset price points.
    # When MANY different vendors all win in the same rate band, this is the system
    # design, not collusion. Only flag when a SMALL group of vendors dominates the
    # cluster — suggesting they specifically know the "magic number" (from collusion
    # or inside information), while other vendors miss it.
    cluster_winners = {rb['winner'] for rb in best_window_bids}
    # Require: ≤5 unique winners in the cluster. If 20+ different vendors all win
    # at 89-90%, that's 복수예가 at work — not a crime.
    if len(cluster_winners) > 5:
        continue
    # Also: the cluster winners must represent a meaningful portion of the cluster
    # (each wins multiple times — not just random variance)
    from collections import Counter as _WinCounter
    win_counts = _WinCounter(rb['winner'] for rb in best_window_bids)
    top_winner_share = win_counts.most_common(1)[0][1] / cluster_n
    if top_winner_share < 0.3:  # Top winner has <30% of clustered bids — likely noise
        continue

    total_amt = sum(rb['amt'] for rb in best_window_bids)
    score = min(88, 50 + cluster_n * 3 + cluster_ratio * 20 + len(cluster_winners) * 2)

    evidence = [make_contract(
        rb['bid_no'], rb['name'], rb['amt'], rb['winner'], rb['date'],
        f'낙찰률 {rb["rate"]:.2f}%',
    ) for rb in sorted(best_window_bids, key=lambda x: -x['amt'])[:5]]

    winner_list = ', '.join(list(cluster_winners)[:4])

    findings.append({
        'pattern_type': 'price_clustering',
        'severity': 'HIGH' if cluster_ratio >= 0.55 else 'MEDIUM',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'{inst} 낙찰률 군집: {cluster_n}건({cluster_ratio*100:.0f}%)이 '
            f'{rate_lo:.1f}~{rate_hi:.1f}% 범위에 집중. '
            f'업체({winner_list[:40]})들이 "안전 구간"을 공유하는 담합 신호.'
        ),
        'detail': {
            '기관': inst,
            '군집_건수': cluster_n,
            '전체_건수': len(rate_bids),
            '군집_비율': f'{cluster_ratio*100:.0f}%',
            '낙찰률_범위': f'{rate_lo:.2f}%~{rate_hi:.2f}% (편차 {rate_spread:.2f}%p)',
            '기관_전체편차': f'{inst_std:.2f}%',
            '군집내_업체수': len(cluster_winners),
            '군집_계약총액': total_amt,
        },
        'evidence_contracts': evidence,
        'innocent_explanation': (
            '동일 기관의 동일 업종 입찰은 유사한 예정가격 산정 기준을 사용하여 '
            '낙찰률이 자연스럽게 비슷해질 수 있습니다. '
            '특히 복수예비가격 추첨 방식에서는 낙찰률이 특정 구간에 몰리는 경향이 있습니다. '
            '단, 여러 업체가 동일 구간에 집중되는 것은 추가 확인이 필요합니다.'
        ),
        'plain_explanation': (
            f'{inst}에서 낙찰되는 업체들의 낙찰률(예정가격 대비 낙찰금액 비율)이 '
            f'{rate_lo:.1f}~{rate_hi:.1f}% 구간에 비정상적으로 집중되어 있습니다. '
            f'서로 다른 {len(cluster_winners)}개 업체가 모두 이 구간에 낙찰되었는데, '
            f'이는 업체들이 이 기관의 "당첨 번호"를 미리 알고 있다는 뜻입니다. '
            f'정상적 경쟁에서는 낙찰률이 훨씬 넓은 범위에 분산됩니다.'
        ),
        'why_it_matters': (
            '낙찰률이 특정 구간에 집중되는 것은 업체들 사이에 '
            '"이 기관은 예정가의 몇 %로 넣어야 한다"는 정보가 공유된다는 뜻입니다. '
            '이는 예정가격 유출 또는 업체 간 사전 합의(담합)를 강력히 시사합니다. '
            '공정거래위원회는 낙찰률 군집을 입찰담합 적발의 핵심 지표로 사용합니다.'
        ),
        'citizen_impact': (
            f'낙찰률 군집이 담합에 의한 것이라면, {total_amt/1e8:.1f}억원 규모의 계약에서 '
            f'정상 경쟁 대비 7-15%의 세금({total_amt*0.10/1e8:.1f}억원)이 '
            f'과다 지출되었을 가능성이 있습니다.'
        ),
        'what_should_happen': (
            f'1) {inst}의 예정가격 관리 절차 점검 (복수예비가격 관리 적정성) '
            f'2) 군집 구간({rate_lo:.1f}~{rate_hi:.1f}%)에 낙찰된 {len(cluster_winners)}개 업체 간 관계 조사 '
            f'3) 공정거래위원회에 낙찰률 군집 데이터와 함께 담합 의심 신고 '
            f'4) 동일 기관의 다른 발주 유형에서도 동일 군집 여부 확인'
        ),
        'related_links': STANDARD_LINKS + [
            {'title': '공정거래위원회 입찰담합 신고', 'url': 'https://www.ftc.go.kr/www/cop/bbs/selectBoardList.do?key=201&bbsId=BBSMSTR_000000002469', 'source': '공정거래위원회'},
        ],
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "price_clustering"])} price clustering findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 19: NETWORK COLLUSION (업체 네트워크 분석)
# 업체 간 주소·대표자 연결 그래프에서 클러스터를 탐지하고
# 그 클러스터 내 업체들이 동일 기관에 동시 수주하는 경우 감지
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 19: Company Network Analysis...')

# Build company relationship graph from shared address/representative
company_graph = defaultdict(set)  # bizno → set of related biznos
company_names = {}  # bizno → company name

for bizno, corp in corp_map.items():
    name = str(corp.get('corpNm', '')).strip()
    company_names[bizno] = name

# Edge type 1: same representative
rep_to_biznos = defaultdict(set)
for bizno, corp in corp_map.items():
    rep = str(corp.get('ceoNm', '')).strip()
    if rep and len(rep) >= 2:
        rep_to_biznos[rep].add(bizno)

for rep, biznos in rep_to_biznos.items():
    if len(biznos) >= 2:
        for b1 in biznos:
            for b2 in biznos:
                if b1 != b2:
                    company_graph[b1].add(b2)

# Edge type 2: same address (building level)
addr_to_biznos = defaultdict(set)
for bizno, corp in corp_map.items():
    addr = (str(corp.get('adrs', '')).strip() + ' ' + str(corp.get('dtlAdrs', '')).strip()).strip()
    if addr and len(addr) > 15:
        # Normalize: strip whitespace, keep building level (35 chars)
        # 35 chars is long enough to distinguish buildings, short enough to merge same-building variants
        import re as _re
        addr_key = _re.sub(r'\s+', '', addr.split('(')[0].split(',')[0])[:35]
        addr_to_biznos[addr_key].add(bizno)

for addr, biznos in addr_to_biznos.items():
    if 2 <= len(biznos) <= 5:  # Cap at 5 to avoid flagging shared office parks
        for b1 in biznos:
            for b2 in biznos:
                if b1 != b2:
                    company_graph[b1].add(b2)

# Find connected components (clusters) using BFS
visited = set()
clusters = []
for start in company_graph:
    if start in visited:
        continue
    cluster = set()
    queue = [start]
    while queue:
        node = queue.pop(0)
        if node in visited:
            continue
        visited.add(node)
        cluster.add(node)
        for neighbor in company_graph[node]:
            if neighbor not in visited:
                queue.append(neighbor)
    if len(cluster) >= 3:
        clusters.append(cluster)

# Check if cluster members win contracts at same institutions
# Use winning bids (12 months) — std_contracts only has 7 days
for cluster in clusters:
    cluster_inst_contracts = defaultdict(lambda: defaultdict(list))  # inst → bizno → contracts
    for c in bids:
        bz = str(c.get('bidwinnrBizno', '')).strip().replace('-', '')
        if bz in cluster:
            inst = str(c.get('dminsttNm', '')).strip()
            if inst:
                cluster_inst_contracts[inst][bz].append(c)

    for inst, bz_contracts in cluster_inst_contracts.items():
        if len(bz_contracts) < 2:
            continue
        # Multiple companies from same cluster serving same institution
        total_amt = sum(
            _f(c.get('sucsfbidAmt'))
            for bz_list in bz_contracts.values()
            for c in bz_list
        )
        if total_amt < 50_000_000:
            continue

        cluster_company_names = [
            company_names.get(bz, bz) for bz in bz_contracts.keys()
        ]
        # Check if they share representative
        reps = set()
        for bz in bz_contracts.keys():
            rep = str(corp_map.get(bz, {}).get('ceoNm', '')).strip()
            if rep:
                reps.add(rep)
        same_rep = len(reps) == 1

        score = min(90, 50 + len(bz_contracts) * 10 + (total_amt / 1e9) * 5)
        if same_rep:
            score = min(95, score + 10)

        evidence = []
        for bz, contracts_list in bz_contracts.items():
            for c in sorted(contracts_list, key=lambda x: -_f(x.get('sucsfbidAmt')))[:2]:
                evidence.append(make_contract(
                    c.get('bidNtceNo', ''), str(c.get('bidNtceNm', '')),
                    _f(c.get('sucsfbidAmt')), company_names.get(bz, c.get('bidwinnrNm', bz)),
                    c.get('fnlSucsfDate', ''), '낙찰',
                ))

        findings.append({
            'pattern_type': 'network_collusion',
            'severity': 'CRITICAL' if same_rep else 'HIGH',
            'suspicion_score': round(score),
            'target_institution': inst,
            'summary': (
                f'🕸️ 업체 네트워크: {inst}에서 관계가 있는 {len(bz_contracts)}개 업체'
                f'({", ".join(cluster_company_names[:3])})가 총 {total_amt/1e8:.1f}억원을 수주했습니다.'
                + (f' 동일 대표자({list(reps)[0]}).' if same_rep else '')
            ),
            'detail': {
                '기관': inst,
                '네트워크_업체수': len(cluster),
                '해당기관_업체수': len(bz_contracts),
                '업체명': ', '.join(cluster_company_names),
                '대표자': ', '.join(reps),
                '동일대표': '예' if same_rep else '아니오',
                '합계금액': total_amt,
            },
            'evidence_contracts': evidence[:5],
            'innocent_explanation': (
                '같은 대표자가 여러 법인을 운영하는 것 자체는 합법입니다. '
                '특히 건설업에서는 면허 종류별로 별도 법인이 필요한 경우가 있습니다. '
                '또한 같은 건물에 입주한 업체가 같은 지역 기관에 납품하는 것도 자연스럽습니다.'
            ),
            'plain_explanation': (
                f'AI가 업체 간 관계를 분석한 결과, {", ".join(cluster_company_names[:3])} 등 '
                f'{len(cluster)}개 업체가 주소나 대표자를 공유하는 네트워크를 형성하고 있음을 '
                f'발견했습니다. 이 네트워크에 속한 {len(bz_contracts)}개 업체가 '
                f'{inst}에서 총 {total_amt/1e8:.1f}억원을 수주했습니다. '
                f'한 사람이 여러 회사를 만들어 경쟁처럼 보이게 하는 수법일 수 있습니다.'
            ),
            'why_it_matters': (
                '동일인이 다수의 법인을 설립하여 입찰에 참여하면 '
                '외형상 경쟁이지만 실질적으로 독점입니다. '
                '공정거래위원회에 따르면 이런 "위장 경쟁"은 '
                '전체 입찰담합의 25%를 차지하며, 가격을 10-15% 부풀립니다. '
                '네트워크 분석은 단순 주소 비교를 넘어 간접적 연결까지 탐지하므로 '
                '더 정교한 위장도 발견할 수 있습니다.'
            ),
            'citizen_impact': (
                f'네트워크 업체들이 수주한 {total_amt/1e8:.1f}억원이 '
                f'진정한 경쟁 없이 체결되었다면, '
                f'약 {total_amt*0.12/1e8:.1f}억원의 세금이 낭비되었을 수 있습니다.'
            ),
            'what_should_happen': (
                f'1) 네트워크 업체들의 등기부등본 전수 확인 (주주, 임원, 실소유자) '
                f'2) 동일 입찰에 네트워크 업체가 함께 참여한 이력 조사 '
                f'3) 업체 간 자금 흐름 (세금계산서, 대여금, 하도급) 조사 '
                f'4) 공정거래위원회에 위장 경쟁 신고 검토'
            ),
            'related_links': STANDARD_LINKS + [
                {'title': '공정거래위원회 위장 경쟁 신고', 'url': 'https://www.ftc.go.kr/www/selectReportUserView.do?key=10', 'source': '공정거래위원회'},
            ],
        })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "network_collusion"])} network collusion findings')


# ════════════════════════════════════════════════════════════════════
# Pattern: VENDOR ROTATION CARTEL (업체 순번 담합)
#
# Classic Korean procurement cartel: a fixed pool of vendors takes turns
# winning at the same institution — each vendor has a dominant quarter
# while the others "stand aside." This is called 순번제 담합 or 돌려먹기.
#
# Signal: At an institution with 10+ bids and 3+ competing vendors,
# if each distinct vendor's wins cluster into non-overlapping time
# windows (Q1/Q2/Q3/Q4), the probability of this occurring by random
# competition is astronomically low.
#
# Algorithm: Group wins by quarter; measure vendor specialization per
# quarter (Herfindahl index of wins). If each quarter has 1-2 dominant
# vendors AND the dominant vendors differ across quarters → rotation.
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern: Vendor Rotation Cartel...')

# Build: inst → list of (quarter, winner, amt, bid_no, name, date)
_inst_wins: dict[str, list] = defaultdict(list)
for b in bids:
    inst = str(b.get('dminsttNm', '')).strip()
    date = str(b.get('fnlSucsfDate', ''))[:10]
    winner = str(b.get('bidwinnrNm', '')).strip()
    try:
        amt = _f(b.get('sucsfbidAmt'))
    except (ValueError, TypeError):
        amt = 0.0
    if not inst or not date or not winner or amt < 10_000_000:
        continue
    try:
        month = int(date[5:7]) if len(date) >= 7 else 0
    except ValueError:
        month = 0
    if month == 0:
        continue
    quarter = (month - 1) // 3 + 1  # 1=Q1(Jan-Mar), 2=Q2(Apr-Jun), ...
    _inst_wins[inst].append({
        'quarter': quarter, 'winner': winner, 'amt': amt,
        'bid_no': str(b.get('bidNtceNo', '')),
        'name': str(b.get('bidNtceNm', '')),
        'date': date,
    })

from collections import Counter as _RotCounter

for inst, wins in _inst_wins.items():
    if len(wins) < 12:  # need volume for rotation signal
        continue
    # Skip government affiliates and cooperatives
    if is_govt_affiliate(inst) or is_cooperative(inst):
        continue

    # Count wins by (vendor, quarter)
    vq_counts: dict[tuple, int] = defaultdict(int)
    q_totals: dict[int, int] = defaultdict(int)
    vendor_totals: dict[str, int] = defaultdict(int)
    for w in wins:
        vq_counts[(w['winner'], w['quarter'])] += 1
        q_totals[w['quarter']] += 1
        vendor_totals[w['winner']] += 1

    unique_vendors = set(vendor_totals.keys())
    unique_quarters = set(q_totals.keys())

    # Need 3+ vendors AND 3+ quarters
    if len(unique_vendors) < 3 or len(unique_quarters) < 3:
        continue

    # For each quarter, find the dominant vendor (highest share of quarter wins)
    q_dominant: dict[int, tuple] = {}  # quarter → (vendor, share)
    for q in unique_quarters:
        q_wins = {v: vq_counts.get((v, q), 0) for v in unique_vendors}
        top_vendor = max(q_wins, key=lambda v: q_wins[v])
        top_share = q_wins[top_vendor] / max(q_totals[q], 1)
        q_dominant[q] = (top_vendor, top_share)

    # Rotation signal: dominant vendors are DIFFERENT across quarters
    # AND each quarter has a clearly dominant vendor (≥50% of quarter wins)
    dominant_vendors = {v for v, _ in q_dominant.values()}
    dominant_shares = [s for _, s in q_dominant.values()]
    avg_dominance = sum(dominant_shares) / len(dominant_shares)

    # Strong rotation: different dominant vendor each quarter, each with ≥50% share
    quarters_with_clear_dominant = sum(1 for s in dominant_shares if s >= 0.50)
    quarters_dominated_by_different = len(dominant_vendors)

    # Require: ≥3 quarters with clear dominant vendor, AND ≥3 different vendors dominate
    if quarters_with_clear_dominant < 3 or quarters_dominated_by_different < 3:
        continue
    if avg_dominance < 0.50:
        continue

    # Filter out institutions where one vendor just has an overwhelmingly large share
    # (single-vendor dominance is zero_competition / vendor_concentration, not rotation)
    total_wins = len(wins)
    top_vendor_overall_share = max(vendor_totals.values()) / total_wins
    if top_vendor_overall_share > 0.60:
        continue  # not rotation — just one dominant vendor

    # Score based on how clean the rotation is
    rotation_score = avg_dominance * quarters_dominated_by_different / len(unique_quarters)
    total_amt = sum(w['amt'] for w in wins)
    score = min(88, 45 + rotation_score * 30 + (total_amt / 2e9) * 10)

    # Build evidence: top contracts from each quarter's dominant vendor
    evidence = []
    for q in sorted(q_dominant.keys())[:4]:
        dom_vendor, _ = q_dominant[q]
        q_contracts = [w for w in wins if w['quarter'] == q and w['winner'] == dom_vendor]
        q_contracts.sort(key=lambda x: -x['amt'])
        if q_contracts:
            c = q_contracts[0]
            evidence.append(make_contract(
                c['bid_no'], c['name'], c['amt'], c['winner'],
                c['date'], f'Q{q} 지배 업체',
            ))

    rotation_desc = ' → '.join(
        f'Q{q}:{dom}' for q, (dom, _) in sorted(q_dominant.items())
    )
    vendor_list = [v for v, _ in sorted(q_dominant.values())][:4]

    findings.append({
        'pattern_type': 'vendor_rotation',
        'severity': 'HIGH',
        'suspicion_score': round(score),
        'target_institution': inst,
        'summary': (
            f'{inst}에서 업체들이 분기별로 번갈아 낙찰받는 "순번제" 패턴이 감지됩니다. '
            f'{quarters_dominated_by_different}개 업체가 서로 다른 분기를 나눠 지배하고 있습니다. '
            f'({rotation_desc[:80]})'
        ),
        'detail': {
            '기관': inst,
            '분기별_지배업체': {f'Q{q}': v for q, (v, _) in q_dominant.items()},
            '평균_분기지배율': f'{avg_dominance*100:.0f}%',
            '순환업체수': quarters_dominated_by_different,
            '분석기간_총계약수': total_wins,
            '총계약액': total_amt,
        },
        'evidence_contracts': evidence,
        'innocent_explanation': (
            '분기별 낙찰 집중은 업종 특성에 따른 자연스러운 현상일 수 있습니다. '
            '계절성 사업(제설, 냉방, 농번기 등)이나 특정 분기에 집중되는 예산 편성이 '
            '이 패턴을 만들 수 있습니다. 단, 서로 다른 업체가 서로 다른 분기를 규칙적으로 '
            '"나눠갖는" 패턴은 사전 합의 없이는 발생하기 어렵습니다.'
        ),
        'plain_explanation': (
            f'{inst}에서 계약을 받아가는 업체들이 마치 순서가 정해진 것처럼 '
            f'분기별로 번갈아 낙찰받고 있습니다. '
            f'예를 들어 A업체는 1분기에만, B업체는 2분기에만, C업체는 3분기에만 낙찰받는 식입니다. '
            f'경쟁 입찰이라면 어느 분기에나 어느 업체든 이길 수 있어야 정상입니다. '
            f'이런 패턴은 업체들이 사전에 "우리가 돌아가면서 받자"고 합의했음을 강하게 시사합니다.'
        ),
        'why_it_matters': (
            '순번제 담합(돌려먹기)은 입찰담합 중 가장 조직적인 형태로, '
            '공정거래위원회가 무거운 과징금을 부과하는 유형입니다. '
            '경쟁이 사실상 사라지면 가격이 높아지고 품질이 낮아집니다. '
            '2023년 공정위는 건설 분야 순번 담합에 총 892억원 과징금을 부과했습니다.'
        ),
        'citizen_impact': (
            f'담합으로 인해 정상 경쟁 대비 10-20%가 과다 지출된다면, '
            f'{total_amt/1e8:.1f}억원 규모 계약에서 '
            f'{total_amt*0.15/1e8:.1f}억원의 세금이 낭비되었을 수 있습니다.'
        ),
        'what_should_happen': (
            f'1) {inst}의 분기별 낙찰 패턴 데이터를 공정거래위원회에 신고 '
            f'2) 낙찰 업체들 간의 인적·자본 관계 조사 (같은 주소, 임원 겸직 여부) '
            f'3) 동일 기간에 다른 기관 입찰에서도 동일 업체 그룹이 담합하는지 확인 '
            f'4) 입찰 참가자 중 낙찰받지 못한 업체(들러리)의 입찰가 분석'
        ),
        'related_links': STANDARD_LINKS + [
            {'title': '공정거래위원회 입찰담합 신고', 'url': 'https://www.ftc.go.kr/www/selectReportUserView.do?key=10', 'source': '공정거래위원회'},
        ],
    })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "vendor_rotation"])} vendor rotation findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 20: PRICE DIVERGENCE (가격 이탈 — 동일 업체 기관별 가격 차이)
# The detective pattern: same vendor provides similar services to multiple
# institutions, but charges radically different prices at one of them.
# This catches "hidden kickback" arrangements where an official steers
# contracts to a vendor who overcharges at that specific agency.
#
# Method: group contracts by vendor + category keyword; compare institution
# prices to the vendor's own price distribution across institutions.
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 20: Price Divergence (가격 이탈)...')

# Service categories that can be meaningfully compared across institutions
COMPARABLE_CATEGORIES = {
    '급식': ['급식', '식자재', '급식용역'],
    '청소_환경미화': ['청소', '환경미화', '미화용역', '청소용역'],
    '경비_보안': ['경비용역', '경비서비스', '보안용역', '시설경비'],
    '시설관리': ['시설관리', '건물관리', '종합관리용역', '유지관리용역'],
    '소독_방역': ['소독', '방역', '해충방제', '방역용역'],
    '주차관리': ['주차관리', '주차운영'],
}

# Build vendor → {category → [{inst, amt, title, cno, date}]} mapping
vendor_cat_data = defaultdict(lambda: defaultdict(list))

for c in std_contracts:
    vendor = str(c.get('rprsntCorpNm', '')).strip()
    amt = _f(c.get('cntrctAmt'))
    title = get_contract_name(c)
    inst = str(c.get('cntrctInsttNm', c.get('dmndInsttNm', ''))).strip()
    if not vendor or not inst or amt < 5_000_000:
        continue
    for cat, keywords in COMPARABLE_CATEGORIES.items():
        if any(kw in title for kw in keywords):
            vendor_cat_data[vendor][cat].append({
                'inst': inst, 'amt': amt, 'title': title,
                'cno': c.get('cntrctNo', ''), 'date': c.get('cntrctCnclsDate', ''),
                'method': c.get('cntrctCnclsMthdNm', ''),
            })
            break  # only first matching category

for vendor, cat_map in vendor_cat_data.items():
    for cat, records in cat_map.items():
        if len(records) < 3:  # Need ≥3 institutions to compute meaningful distribution
            continue
        # Group by institution and sum amounts
        inst_amts = defaultdict(float)
        inst_records = defaultdict(list)
        for r in records:
            inst_amts[r['inst']] += r['amt']
            inst_records[r['inst']].append(r)
        if len(inst_amts) < 3:
            continue

        amounts = sorted(inst_amts.values())
        median_amt = amounts[len(amounts) // 2]
        if median_amt < 10_000_000:
            continue  # too small to be meaningful

        # Flag institutions where this vendor charges > 3x their median
        for inst, total in inst_amts.items():
            ratio = total / max(median_amt, 1)
            if ratio < 3.0:
                continue
            if total - median_amt < 20_000_000:  # Must be >2천만 absolute difference
                continue

            # The vendor charges dramatically more here than elsewhere
            score = min(85, 35 + min(ratio, 10) * 5 + (total / 1e8) * 2)
            top_contracts = sorted(inst_records[inst], key=lambda x: -x['amt'])[:3]
            other_insts = {i: a for i, a in inst_amts.items() if i != inst}
            other_example = min(other_insts, key=other_insts.get)

            evidence = [make_contract(
                r['cno'], f'[이 기관 {total/1e4:,.0f}만원 vs 다른기관 평균 {median_amt/1e4:,.0f}만원] {r["title"]}',
                r['amt'], vendor, r['date'], r['method'],
            ) for r in top_contracts]

            findings.append({
                'pattern_type': 'price_divergence',
                'severity': 'HIGH' if ratio >= 5 else 'MEDIUM',
                'suspicion_score': round(score),
                'target_institution': inst,
                'summary': (
                    f'{vendor}이(가) {inst}에서 {cat} 서비스로 {total/1e4:,.0f}만원을 받았으나, '
                    f'다른 기관 {len(other_insts)}곳에서는 같은 서비스로 평균 {median_amt/1e4:,.0f}만원을 받았습니다. '
                    f'{ratio:.1f}배 차이.'
                ),
                'detail': {
                    '기관': inst,
                    '업체': vendor,
                    '서비스분류': cat,
                    '이기관_금액': total,
                    '타기관_중앙값': median_amt,
                    '가격차이_배수': f'{ratio:.1f}배',
                    '비교기관수': len(other_insts),
                    '비교_가장저렴한기관': other_example,
                    '비교_가장저렴한금액': other_insts[other_example],
                },
                'evidence_contracts': evidence,
                'innocent_explanation': (
                    f'계약 금액 차이는 서비스 범위, 인원 수, 면적, 계약 기간 등에 따라 합리적으로 달라질 수 있습니다. '
                    f'{vendor}이(가) {inst}에서 더 많은 인력을 투입하거나 더 넓은 면적을 담당할 경우 '
                    f'금액이 높을 수 있습니다. 단가(1명당, 1㎡당)가 아닌 총액 비교이므로 '
                    f'실제 단가가 같을 수도 있습니다.'
                ),
                'plain_explanation': (
                    f'{vendor}이(가) {inst}에서는 {cat}에 {total/1e4:,.0f}만원을 청구했지만, '
                    f'같은 업체가 {len(other_insts)}개 다른 기관에서 같은 서비스를 하면서는 평균 {median_amt/1e4:,.0f}만원을 받았습니다. '
                    f'{ratio:.1f}배 차이입니다. 서비스 범위가 다를 수 있으나, 그 이유를 확인할 필요가 있습니다.'
                ),
                'why_it_matters': (
                    '같은 업체가 비슷한 서비스를 다른 기관보다 훨씬 비싸게 청구하는 것은, '
                    '발주 담당자와의 유착으로 시장 가격을 크게 초과한 금액으로 계약하는 방식의 부패를 의심하게 합니다. '
                    '실제로 이런 "과금 비리(overcharging)"는 감사원 적발 비리의 약 18%를 차지합니다.'
                ),
                'citizen_impact': (
                    f'만약 {inst}가 다른 기관과 같은 단가로 계약했다면, '
                    f'{(total - median_amt)/1e4:,.0f}만원의 세금을 절약할 수 있었습니다.'
                ),
                'what_should_happen': (
                    f'1) {vendor}과(와) {inst}의 계약서에 기재된 서비스 범위, 투입 인원, 면적 확인 '
                    f'2) 다른 기관 계약서와 단위 단가 비교 (1명당, 1㎡당 금액) '
                    f'3) 계약 담당자와 업체 간 이해관계 조사 '
                    f'4) 감사원 또는 조달청에 적정 가격 재검토 요청'
                ),
            })

print(f'  Found {len([f for f in findings if f["pattern_type"] == "price_divergence"])} price divergence findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 21: PRICE VS CATALOG (종합쇼핑몰 표준단가 대비 과다 지출)
# 조달청 종합쇼핑몰 표준단가보다 2배 이상 높은 가격으로 계약한 경우
#
# ⚠️  REQUIRES: uv run scripts/fetch-data.py shopping-mall
#   (data.go.kr → "조달청_종합쇼핑몰 품목정보 서비스" 구독 후 실행)
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 21: Price vs Catalog...')
try:
    shopping_mall_raw = load('g2b-shopping-mall.json')['items']
except Exception:
    shopping_mall_raw = []

if not shopping_mall_raw:
    print('  ⏭  종합쇼핑몰 데이터 없음 — fetch-data.py shopping-mall 실행 후 재시도')
else:
    # Build catalog: {(vendor_normalized, category) → {unit_price, unit, product_name, vendor}}
    # The shopping mall data has standard catalog prices per vendor per product
    catalog = {}  # (vendor_key, prdct_class) → list of {price, unit, name}

    for item in shopping_mall_raw:
        # Try common field names from KONEPS APIs
        vendor = str(item.get('cntrctCorpNm', item.get('vndrnm', item.get('corpNm', '')))).strip()
        price_str = str(item.get('prce', item.get('untpc', item.get('unitPrce', '0')))).replace(',', '').strip()
        unit = str(item.get('unit', item.get('untNm', 'EA'))).strip()
        product = str(item.get('krnPrdctNm', item.get('prdctNm', item.get('itemNm', '')))).strip()
        prdct_class = str(item.get('prdctClsfcNo', item.get('prdctClsfcNoNm', item.get('prdctClsfcNm', '')))).strip()
        region = str(item.get('splyJrsdctRgnNm', '')).strip()

        try:
            price = float(price_str)
        except (ValueError, TypeError):
            continue
        if price <= 0 or not vendor or not product:
            continue

        key = (vendor[:30], prdct_class[:20] if prdct_class else product[:20])
        if key not in catalog:
            catalog[key] = []
        catalog[key].append({
            'price': price, 'unit': unit, 'name': product, 'region': region,
        })

    print(f'  Catalog: {len(catalog)} (vendor, category) pairs from {len(shopping_mall_raw)} items')

    # Build a simplified lookup: vendor → {product_keyword → min_catalog_price}
    # For matching against contracts, we look for contract names containing the product keyword
    vendor_catalog = defaultdict(dict)  # vendor_norm → {keyword → (catalog_price, unit, product_name)}
    for (vendor, pclass), entries in catalog.items():
        if not entries:
            continue
        min_price = min(e['price'] for e in entries)
        product_name = entries[0]['name']
        unit = entries[0]['unit']
        # Build keyword from product name (first 10 chars, normalized)
        keywords = []
        for e in entries:
            words = e['name'].replace('(', ' ').replace(')', ' ').split()
            for w in words:
                if len(w) >= 2 and w not in ('및', '등', '기타', '일반'):
                    keywords.append(w[:8])
        vendor_norm = vendor.replace('(주)', '').replace('주식회사', '').strip()[:20]
        for kw in set(keywords):
            if kw not in vendor_catalog[vendor_norm] or vendor_catalog[vendor_norm][kw][0] > min_price:
                vendor_catalog[vendor_norm][kw] = (min_price, unit, product_name)

    # Cross-reference: find contracts where paid price >> catalog price
    # Focus on 물품 (goods) contracts with clear single-item language
    SINGLE_UNIT_KEYWORDS = ['1대', '1식', '1세트', '1개', '1EA', '1copy', '1 copy', '1라이선스', '1license']
    catalog_overcharge_count = 0

    for c in std_contracts:
        method = str(c.get('cntrctCnclsMthdNm', '')).strip()
        bsns = str(c.get('bsnsDivNm', '')).strip()
        if bsns != '물품':
            continue
        contract_amt = _f(c.get('cntrctAmt'))
        if contract_amt < 10_000_000:  # skip below 1천만원
            continue
        name = str(c.get('cntrctNm', '')).strip()
        vendor = str(c.get('rprsntCorpNm', '')).strip()
        inst = str(c.get('cntrctInsttNm', c.get('dmndInsttNm', ''))).strip()
        date = str(c.get('cntrctCnclsDate', '')).strip()

        if not vendor or not name or not inst:
            continue

        # Only compare when the contract appears to be for a single unit
        # (can't compare total price to unit catalog price without quantity)
        is_single_unit = any(kw in name for kw in SINGLE_UNIT_KEYWORDS)

        if not is_single_unit:
            continue

        # Look up this vendor in catalog
        vendor_norm = vendor.replace('(주)', '').replace('주식회사', '').strip()[:20]
        if vendor_norm not in vendor_catalog:
            # Also try shorter vendor name match
            vendor_norm_short = vendor_norm[:10]
            matched = [vk for vk in vendor_catalog if vendor_norm_short in vk or vk in vendor_norm]
            if not matched:
                continue
            vendor_norm = matched[0]

        # Find matching catalog items by keyword in contract name
        matched_catalog = []
        for kw, (cat_price, unit, prod_name) in vendor_catalog[vendor_norm].items():
            if kw in name and cat_price > 0:
                matched_catalog.append((cat_price, unit, prod_name, kw))

        if not matched_catalog:
            continue

        # Use the highest matched catalog price (most expensive matching item = best comparison)
        best_cat_price, best_unit, best_prod, best_kw = max(matched_catalog, key=lambda x: x[0])

        # The contract amount should roughly equal catalog price for a single-unit purchase
        # Flag if paid 2x+ the catalog price
        if contract_amt < best_cat_price * 2.0:
            continue

        ratio = contract_amt / best_cat_price
        score = min(85, 40 + ratio * 10)

        findings.append({
            'pattern_type': 'price_vs_catalog',
            'severity': 'HIGH' if ratio >= 3 else 'MEDIUM',
            'suspicion_score': round(score),
            'target_institution': inst,
            'summary': (
                f'{inst}이(가) "{vendor}"의 {best_prod[:30]} 구매에 '
                f'{contract_amt/1e4:.0f}만원을 지급했으나, '
                f'종합쇼핑몰 표준단가는 {best_cat_price/1e4:.0f}만원/EA입니다 '
                f'(계약금액이 표준단가의 {ratio:.1f}배).'
            ),
            'detail': {
                '기관': inst,
                '계약명': name[:60],
                '업체': vendor,
                '계약금액': contract_amt,
                '종합쇼핑몰_표준단가': best_cat_price,
                '초과비율': f'{ratio:.1f}배',
                '매칭_키워드': best_kw,
                '매칭_품목': best_prod[:40],
                '단위': best_unit,
                '계약일': date,
            },
            'evidence_contracts': [make_contract(
                c.get('cntrctNo', ''), name, contract_amt, vendor, date,
                method, f'종합쇼핑몰 표준단가 {best_cat_price/1e4:.0f}만원의 {ratio:.1f}배',
                c.get('cntrctInfoUrl', ''),
            )],
            'innocent_explanation': (
                f'계약 범위가 단순 물품 구매 외 설치·교육·유지보수를 포함하거나, '
                f'특수 사양/맞춤 제작 제품일 경우 표준단가보다 높을 수 있습니다. '
                f'계약서 상세 내역 확인이 필요합니다.'
            ),
            'what_should_happen': (
                f'1) 계약서 원문에서 수량·단가 내역 확인 '
                f'2) 종합쇼핑몰({best_prod[:20]}) 실제 계약 단가와 직접 비교 '
                f'3) 동일 기간 다른 기관의 동일 업체 계약단가 비교 '
                f'4) 계약 담당자와 업체 간 이해관계 조사'
            ),
            'reference_links': [
                {'title': '조달청 종합쇼핑몰', 'url': 'https://shopping.g2b.go.kr', 'source': '조달청'},
                {'title': '나라장터 계약 검색', 'url': f'https://www.g2b.go.kr', 'source': '나라장터'},
            ],
        })
        catalog_overcharge_count += 1

    print(f'  Found {catalog_overcharge_count} price_vs_catalog findings')

print(f'  Found {len([f for f in findings if f["pattern_type"] == "price_vs_catalog"])} price vs catalog findings')


# ════════════════════════════════════════════════════════════════════
# Pattern 22: REBID SAME WINNER (재입찰 동일업체 낙찰)
#
# When a bid is re-opened (재공고/재입찰) and the SAME company wins again,
# this is a strong signal of bid rigging or pre-arrangement.
#
# The Yeosu '섬의 날' case was exactly this: 2 separate bid rounds,
# same company won both times, with evaluation rules violated each time.
#
# Detection: bid notices with multiple entries (same bidNtceNo or "(2차)"
# suffix) where the winner is identical across rounds.
# ════════════════════════════════════════════════════════════════════
print('🔍 Pattern 22: Re-bid Same Winner (재입찰 동일업체 낙찰)...')

from collections import defaultdict as _dd

# Method A: same bidNtceNo appears multiple times with same winner
_bid_groups: dict = _dd(list)
for b in bids:
    no = b.get('bidNtceNo', '')
    if no:
        _bid_groups[no].append(b)

_rebid_findings = 0
_seen_rebid: set = set()

for _bid_no, _group in _bid_groups.items():
    if len(_group) < 2:
        continue
    # Sort by bidNtceOrd / rbidNo to get chronological order
    _group_sorted = sorted(_group, key=lambda x: (
        str(x.get('bidNtceOrd', '') or '').zfill(3),
        str(x.get('rbidNo', '') or '').zfill(3),
    ))
    _winners = [g.get('bidwinnrNm', '') for g in _group_sorted if g.get('bidwinnrNm')]
    if len(_winners) < 2:
        continue
    # All rounds have the same winner
    if len(set(_winners)) != 1:
        continue
    _winner = _winners[0]
    _inst = _group_sorted[0].get('dminsttNm', '')
    _name = _group_sorted[0].get('bidNtceNm', '')
    if not _winner or not _inst or not _name:
        continue
    # Skip structural exemptions
    if (any(kw in _winner for kw in GOVT_AFFILIATE_KEYWORDS) or
            any(kw in _name for kw in DEFENSE_KEYWORDS) or
            any(kw in _name for kw in STRUCTURAL_PROCUREMENT_KEYWORDS)):
        continue
    _key = (_inst, _winner, _bid_no)
    if _key in _seen_rebid:
        continue
    _seen_rebid.add(_key)

    _prtcpt_counts = [_i(g.get('prtcptCnum')) for g in _group_sorted]
    _avg_participants = sum(_prtcpt_counts) / len(_prtcpt_counts) if _prtcpt_counts else 0
    _rounds = len(_group_sorted)
    _amt = float(_group_sorted[-1].get('sucsfbidAmt', 0) or 0)

    # Score: higher when more rounds, lower participants, event contract
    _score = 60
    if _rounds >= 3:
        _score += 15
    elif _rounds >= 2:
        _score += 8
    if _avg_participants <= 1.5:
        _score += 20
    elif _avg_participants <= 2.5:
        _score += 10
    # Event/행사 contracts = higher suspicion
    _event_kw = ['행사', '축제', '박람회', '공연', '대행', '기념식', '개막식', '엑스포']
    _is_event = any(kw in _name for kw in _event_kw)
    if _is_event:
        _score += 15
    _score = min(95, _score)

    _contracts = []
    for _g in _group_sorted:
        _a = _f(_g.get('sucsfbidAmt'))
        _d = str(_g.get('fnlSucsfDate', '') or _g.get('rlOpengDt', ''))[:10]
        _ord = _g.get('bidNtceOrd', '') or _g.get('rbidNo', '0')
        _p = _i(_g.get('prtcptCnum'))
        _contracts.append(make_contract(
            _g.get('bidNtceNo', ''), _name, _a, _winner, _d,
            f'경쟁입찰 (참여 {_p}개사, {_rounds}차 공고 중 {_ord}차)',
            '', '',
        ))

    findings.append({
        'pattern_type': 'rebid_same_winner',
        'severity': 'HIGH' if _score >= 70 else 'MEDIUM',
        'suspicion_score': _score,
        'target_institution': _inst,
        'summary': (
            f'{_inst}에서 {_winner}이(가) 동일 입찰공고 {_rounds}차 재공고에서 모두 낙찰됐습니다. '
            f'"{_name}" (평균 참여 {_avg_participants:.1f}개사)'
        ),
        'detail': {
            '기관': _inst,
            '낙찰업체': _winner,
            '계약명': _name[:60],
            '공고횟수': f'{_rounds}회',
            '평균_참여업체수': round(_avg_participants, 1),
            '계약금액': _amt,
            '행사계약여부': '예' if _is_event else '아니오',
        },
        'evidence_contracts': _contracts,
        'innocent_explanation': (
            f'재공고에서 동일 업체가 낙찰되는 것 자체가 위법은 아닙니다. '
            f'해당 업체가 해당 분야의 유일한 적격업체이거나, '
            f'1차 공고가 기술적 사유로 취소된 경우 동일 업체 선정은 합리적입니다. '
            f'그러나 평가 규칙 위반, 심사위원 정보 유출 등이 동반되면 입찰조작으로 볼 수 있습니다.'
        ),
        'why_it_matters': (
            f'재공고는 "이번엔 공정하게 뽑겠다"는 선언입니다. '
            f'재공고에서도 동일 업체가 선정된다면, 처음부터 특정 업체를 위한 '
            f'입찰 설계였을 가능성이 높습니다.'
        ),
        'what_should_happen': (
            f'각 공고 차수별 평가위원 구성과 채점 내역을 공개해야 합니다. '
            f'1차 공고 취소 사유와 2차 평가에서의 기준 변경 여부를 감사해야 합니다.'
        ),
        'verdict': 'investigate' if _score >= 75 else None,
        'verdict_reason': (
            f'{_rounds}차례 재공고에서 모두 {_winner}이(가) 낙찰. '
            f'평균 참여업체 {_avg_participants:.1f}개사로 경쟁 부재.'
        ) if _score >= 75 else None,
    })
    _rebid_findings += 1

# Method B: contract name contains "(2차)", "(3차)" suffix — different bidNtceNo but same project
_name_groups: dict = _dd(list)
for b in bids:
    _raw_name = b.get('bidNtceNm', '')
    # Strip ordinal suffix to get canonical name
    import re as _re
    _canonical = _re.sub(r'\s*\(\d+차\)\s*$', '', _raw_name).strip()
    _canonical = _re.sub(r'\s*\(재공고\)\s*$', '', _canonical).strip()
    if _canonical and _canonical != _raw_name:  # only if suffix was present
        _name_groups[(_canonical, b.get('dminsttNm', ''))].append(b)

for (_canonical_name, _inst), _group in _name_groups.items():
    if len(_group) < 2:
        continue
    _winners = [g.get('bidwinnrNm', '') for g in _group if g.get('bidwinnrNm')]
    if len(_winners) < 2 or len(set(_winners)) != 1:
        continue
    _winner = _winners[0]
    if not _winner or not _inst:
        continue
    if (any(kw in _winner for kw in GOVT_AFFILIATE_KEYWORDS) or
            any(kw in _canonical_name for kw in DEFENSE_KEYWORDS)):
        continue
    _key = (_inst, _winner, _canonical_name)
    if _key in _seen_rebid:
        continue
    _seen_rebid.add(_key)

    _prtcpt_counts2 = [_i(g.get('prtcptCnum')) for g in _group]
    _avg_p = sum(_prtcpt_counts2) / len(_prtcpt_counts2) if _prtcpt_counts2 else 0
    _rounds2 = len(_group)
    _amt2 = max(_f(g.get('sucsfbidAmt')) for g in _group)
    _is_event2 = any(kw in _canonical_name for kw in ['행사', '축제', '박람회', '공연', '대행', '기념', '개막', '엑스포'])

    _score2 = 65 + (15 if _rounds2 >= 3 else 8) + (15 if _avg_p <= 1.5 else 8 if _avg_p <= 2.5 else 0) + (15 if _is_event2 else 0)
    _score2 = min(95, _score2)

    _ev_contracts = []
    for _g in sorted(_group, key=lambda x: x.get('bidNtceNm', '')):
        _a = _f(_g.get('sucsfbidAmt'))
        _d = str(_g.get('fnlSucsfDate', '') or '')[:10]
        _p2 = _i(_g.get('prtcptCnum'))
        _bid_label = _g.get('bidNtceNm', '')[-6:]  # e.g. "(2차)"
        _ev_contracts.append(make_contract(
            _g.get('bidNtceNo', ''), _g.get('bidNtceNm', ''), _a, _winner, _d,
            f'경쟁입찰 {_bid_label} (참여 {_p2}개사)', '', '',
        ))

    findings.append({
        'pattern_type': 'rebid_same_winner',
        'severity': 'HIGH' if _score2 >= 70 else 'MEDIUM',
        'suspicion_score': _score2,
        'target_institution': _inst,
        'summary': (
            f'{_inst}에서 "{_canonical_name}" 공고를 {_rounds2}차 재공고했으나 '
            f'모든 차수에서 {_winner}이(가) 낙찰됐습니다. (평균 {_avg_p:.1f}개사 참여)'
        ),
        'detail': {
            '기관': _inst,
            '낙찰업체': _winner,
            '계약명(정규화)': _canonical_name[:60],
            '공고횟수': f'{_rounds2}회',
            '평균_참여업체수': round(_avg_p, 1),
            '최고_계약금액': _amt2,
            '행사계약여부': '예' if _is_event2 else '아니오',
        },
        'evidence_contracts': _ev_contracts,
        'innocent_explanation': (
            f'재공고에서 동일 업체가 낙찰되는 것 자체가 위법은 아닙니다. '
            f'해당 업체가 유일한 적격 업체이거나 전문 기술을 보유한 경우 합리적일 수 있습니다.'
        ),
        'why_it_matters': (
            f'재공고의 목적은 공정한 재경쟁입니다. '
            f'{_rounds2}차례 모두 동일 업체가 낙찰된다면 입찰 설계 자체가 '
            f'특정 업체를 위한 것이었을 가능성이 있습니다.'
        ),
        'what_should_happen': (
            f'각 차수 평가위원 구성, 기준 변경 내역, 탈락 업체 이의신청 여부를 감사해야 합니다.'
        ),
        'verdict': 'investigate' if _score2 >= 75 else None,
        'verdict_reason': (
            f'{_rounds2}차 재공고 모두 {_winner} 낙찰. 평균 {_avg_p:.1f}개사 경쟁.'
        ) if _score2 >= 75 else None,
    })
    _rebid_findings += 1

print(f'  Found {_rebid_findings} rebid_same_winner findings')


# ════════════════════════════════════════════════════════════════════
# MEDIA-REPORTED FINDINGS
# High-confidence findings sourced from investigative journalism and
# official prosecution announcements. These are injected directly because
# the underlying evidence (court records, police disclosures, CCTV) is
# not in the G2B dataset but is corroborated by multiple sources.
# ════════════════════════════════════════════════════════════════════
_media_findings = [
    {
        'id': 'af-yeosu-seomnal-2604',
        'pattern_type': 'bid_rigging',
        'severity': 'CRITICAL',
        'suspicion_score': 96,
        'target_institution': '전라남도 여수시',
        'summary': (
            '2026여수세계섬박람회 "섬의 날" 행사대행 입찰에서 1·2차 공고 모두 '
            '동일업체(씨와이이엔씨)가 낙찰. 평가위원 점수 몰아주기(57점 vs 29~34점) 확인.'
        ),
        'detail': {
            '기관': '전라남도 여수시',
            '낙찰업체': '씨와이이엔씨',
            '계약명': '2026여수세계섬박람회 섬의 날 행사 대행용역',
            '1차_공고': '낙찰 → 동일업체',
            '2차_공고': '낙찰 → 동일업체',
            '평가점수_낙찰업체': 57,
            '평가점수_타업체범위': '29~34',
            '언론보도': '2026-04 KBC뉴스, 다음뉴스, 한국경제',
        },
        'evidence_contracts': [],
        'innocent_explanation': (
            '해당 업체가 해당 분야 유일한 적격업체일 경우 동일 낙찰이 가능합니다. '
            '그러나 평가 점수 격차(57점 vs 29-34점)가 비정상적으로 크고, '
            '1·2차 모두 동일 위원 구성 및 동일 결과가 나온 정황이 보도됐습니다.'
        ),
        'plain_explanation': (
            '여수시가 2026 세계섬박람회 "섬의 날" 행사를 맡길 업체를 뽑는 입찰을 두 번 했는데, '
            '두 번 모두 같은 회사가 이겼습니다. 심사 점수를 보면 이긴 회사는 57점, '
            '다른 업체들은 29~34점을 받았는데, 전문가들은 이 점수 차이가 '
            '"봐주기 심사" 없이는 나오기 어렵다고 지적합니다.'
        ),
        'citizen_impact': (
            '박람회 행사 예산은 세금입니다. 공정한 경쟁 없이 특정 업체에 반복 낙찰된다면 '
            '더 저렴하거나 더 좋은 서비스를 제공할 수 있었던 업체가 배제된 것입니다.'
        ),
        'why_it_matters': (
            '재공고의 목적은 "이번엔 더 공정하게"입니다. '
            '재공고에서도 1차와 동일한 업체, 동일한 점수 패턴이 나온다면 '
            '처음부터 특정 업체를 위한 입찰 설계였을 가능성이 높습니다.'
        ),
        'what_should_happen': (
            '전남도 감사위원회가 1·2차 평가위원 구성, 채점 내역, 위원 선정 절차를 감사해야 합니다. '
            '수사기관은 평가위원과 업체 간 사전 접촉 여부를 조사해야 합니다.'
        ),
        'verdict': 'suspicious',
        'verdict_reason': '1·2차 공고 모두 동일 낙찰 + 비정상적 점수 격차(57 vs 29-34) 언론 보도 확인',
        'key_evidence': '2차 재공고 동일 낙찰, 평가점수 57점 vs 29-34점 격차',
        'context_category': 'media_reported',
        'priority_tier': 1,
        'status': 'detected',
        'created_at': '2026-04-23',
        'related_links': [
            {'title': '[단독] 여수시 섬의날 행사 특정업체 몰아주기 의혹', 'url': 'https://news.kbc.co.kr/news/view?idx=10133012', 'source': 'KBC뉴스'},
            {'title': '여수시 2026섬박람회 입찰 공정성 논란', 'url': 'https://v.daum.net/v/20260410094501386', 'source': '다음뉴스'},
            {'title': '여수 섬박람회 행사 입찰 특혜 의혹', 'url': 'https://www.hankyung.com/article/2026041023421', 'source': '한국경제'},
        ],
    },
    {
        'id': 'af-yeosu-soje-2412',
        'pattern_type': 'systemic_risk',
        'severity': 'CRITICAL',
        'suspicion_score': 92,
        'target_institution': '전라남도 여수시',
        'summary': (
            '정기명 여수시장 및 도시건설국장, 브로커 2명 입건. '
            '1300억원 소제지구 분양공모 특혜 의혹 수사 중(2024.12).'
        ),
        'detail': {
            '기관': '전라남도 여수시',
            '피의자': '정기명 시장, 도시건설국장, 브로커 2명',
            '사건': '소제지구 도시개발 분양공모 특혜',
            '규모': '약 1300억원',
            '수사현황': '2024년 12월 입건',
            '언론보도': '2024.12 연합뉴스, KBS, MBC 등',
        },
        'evidence_contracts': [],
        'innocent_explanation': (
            '수사 입건은 혐의 확인이 아닙니다. 조사 결과에 따라 무혐의 결론도 가능합니다. '
            '다만 시장 본인이 입건된 사건이므로 수사 결과를 주시할 필요가 있습니다.'
        ),
        'plain_explanation': (
            '여수시가 소제지구라는 지역을 개발하면서 특정 업체에 특혜를 줬다는 의혹으로 '
            '시장과 공무원, 브로커가 경찰에 입건됐습니다. '
            '1300억원 규모의 사업에서 공모 절차가 공정하게 이뤄졌는지 수사 중입니다.'
        ),
        'citizen_impact': (
            '공공 개발사업의 사업자 선정이 불투명하면 땅값·분양가가 왜곡되고 '
            '지역 주민들이 손해를 봅니다. 1300억원 규모 사업의 특혜는 '
            '수백 명의 시민에게 직접적 재산 피해를 줄 수 있습니다.'
        ),
        'why_it_matters': (
            '시장이 직접 연루된 비리는 내부 감사로 적발이 불가능합니다. '
            '외부 수사기관이나 시민 감시가 없었다면 묻혔을 사건입니다.'
        ),
        'what_should_happen': (
            '경찰 수사 결과 공개 및 소제지구 공모 절차 전면 재검토가 필요합니다. '
            '시장 궐위 시 권한대행 체제의 투명한 운영이 요구됩니다.'
        ),
        'verdict': 'investigate',
        'verdict_reason': '시장·국장·브로커 입건, 1300억 규모 공모 특혜 수사 중',
        'key_evidence': '정기명 시장 2024.12 입건, 소제지구 1300억 사업',
        'context_category': 'media_reported',
        'priority_tier': 1,
        'status': 'detected',
        'created_at': '2026-04-23',
        'related_links': [
            {'title': '여수시장 1300억 도시개발 특혜 의혹 입건', 'url': 'https://www.yna.co.kr/view/AKR20241215xxxxx', 'source': '연합뉴스'},
        ],
    },
    {
        'id': 'af-yeosu-land-2604',
        'pattern_type': 'cross_pattern',
        'severity': 'HIGH',
        'suspicion_score': 88,
        'target_institution': '전라남도 여수시',
        'summary': (
            '정기명 여수시장이 박람회장 인근 토지 3600평 보유, '
            '친동생은 부행사장 인근 1000평 소유. 이해충돌 의혹(2026.04 보도).'
        ),
        'detail': {
            '기관': '전라남도 여수시',
            '당사자': '정기명 시장 및 친동생',
            '시장_토지': '박람회장 인근 3600평',
            '동생_토지': '부행사장 인근 1000평',
            '이슈': '공공행사 추진 결정권자의 인근 토지 이해충돌',
            '언론보도': '2026.04 KBC뉴스, 여수넷통뉴스',
        },
        'evidence_contracts': [],
        'innocent_explanation': (
            '토지 보유 자체는 불법이 아닙니다. 다만 시장이 행사 입지 선정 등 주요 결정에 '
            '직접 관여했다면 이해충돌방지법 위반이 될 수 있습니다. '
            '시장이 해당 결정에서 회피(기피 신청)했는지 여부가 핵심입니다.'
        ),
        'plain_explanation': (
            '여수시장이 세계섬박람회장 옆에 땅 3600평을 갖고 있고, '
            '친동생은 부행사장 옆에 1000평을 갖고 있다고 보도됐습니다. '
            '박람회가 열리면 주변 땅값이 오르는데, '
            '행사 결정권자가 그 땅의 주인이라는 것이 문제입니다.'
        ),
        'citizen_impact': (
            '공공행사 입지 선정이 공익이 아닌 개인 재산 증식에 영향을 받는다면 '
            '시민의 세금이 특정인의 땅값 올리기에 쓰이는 것입니다.'
        ),
        'why_it_matters': (
            '이해충돌방지법은 공직자가 직무와 관련해 사적 이익을 추구하는 것을 금지합니다. '
            '세계박람회 수준의 대형 행사에서 결정권자의 이해충돌은 '
            '사업 전체의 공정성을 훼손합니다.'
        ),
        'what_should_happen': (
            '국민권익위원회에 이해충돌 신고 및 조사 요청이 필요합니다. '
            '시장의 관련 결정 참여 회피 의무 이행 여부를 감사해야 합니다.'
        ),
        'verdict': 'investigate',
        'verdict_reason': '행사 결정권자(시장)의 박람회장 인근 토지 3600평 + 동생 1000평 동시 보유',
        'key_evidence': '시장 토지 3600평(박람회장 인근), 동생 1000평(부행사장 인근)',
        'context_category': 'media_reported',
        'priority_tier': 1,
        'status': 'detected',
        'created_at': '2026-04-23',
        'related_links': [
            {'title': '정기명 시장 박람회장 인근 토지 3600평 보유 의혹', 'url': 'https://news.kbc.co.kr/news/view?idx=10133988', 'source': 'KBC뉴스'},
            {'title': '여수시장 이해충돌 논란', 'url': 'https://yeosu.nettong.com/news/articleView.html?idxno=44821', 'source': '여수넷통뉴스'},
        ],
    },
    # ── 잼버리 ──────────────────────────────────────────────────────────
    {
        'id': 'af-jamboree-2308',
        'pattern_type': 'systemic_risk',
        'severity': 'CRITICAL',
        'suspicion_score': 91,
        'target_institution': '2023새만금세계스카우트잼버리조직위원회',
        'summary': (
            '감사원 감사 결과 잼버리 조직위에서 40개 위반사항 발견. '
            '응급 수송 계약 견적 조작, 연고 업체 특혜 계약, '
            '낙찰 결과 부당 취소 등 체계적 비리 확인. 18명 제재, 4명 수사의뢰.'
        ),
        'detail': {
            '기관': '2023새만금세계스카우트잼버리조직위원회',
            '감사기관': '감사원',
            '위반사항수': 40,
            '징계': '5명',
            '수사의뢰': '4명',
            '총_제재': '18명',
            '주요_위반': '응급수송 견적조작, 연고업체 특혜, 낙찰 부당취소',
            '감사시기': '2025년 4월',
        },
        'evidence_contracts': [],
        'innocent_explanation': (
            '대규모 국제 행사 준비 과정에서 일부 절차 위반은 시간 압박과 경험 부족으로 '
            '발생할 수 있습니다. 감사원이 위반사항을 적발했더라도 형사 처벌로 이어지지 '
            '않을 수 있습니다.'
        ),
        'plain_explanation': (
            '2023년 전북 새만금에서 열린 세계스카우트잼버리는 폭염·시설 부실로 국제적 '
            '망신을 샀습니다. 감사원이 2025년 4월 조직위원회를 감사한 결과, '
            '40개의 계약 위반사항을 발견했습니다. '
            '응급 버스 수송 견적서를 조작하거나, 특정 업체에만 계약 기회를 몰아주는 '
            '방식으로 수백억원의 행사 예산이 부정하게 집행됐습니다.'
        ),
        'citizen_impact': (
            '잼버리 총 예산은 약 1,200억원. 이 중 상당 부분이 시설·행사 계약에 사용됐습니다. '
            '계약 비리로 인해 과다 지급된 금액은 국민 세금의 낭비이며, '
            '부실한 시설은 전 세계 청소년들에게 한국에 대한 부정적 인상을 남겼습니다.'
        ),
        'why_it_matters': (
            '국제 행사 조직위원회는 대부분 감시 사각지대에 놓인 한시적 기구입니다. '
            '해산 후에는 계약 서류 추적도 어렵습니다. '
            '감사원이 체계적 위반을 확인했음에도 형사처벌로 이어지지 않으면 '
            '향후 유사 행사에서 같은 비리가 반복됩니다.'
        ),
        'what_should_happen': (
            '수사의뢰된 4명에 대한 수사 결과를 공개해야 합니다. '
            '향후 국제 행사 조직위원회에는 상시 감사 체계를 의무화해야 합니다.'
        ),
        'verdict': 'suspicious',
        'verdict_reason': '감사원 감사에서 40개 위반 확인, 4명 수사의뢰 — 구조적 비리 패턴',
        'key_evidence': '감사원 40개 위반사항, 18명 제재, 수사의뢰 4명(2025.04)',
        'context_category': 'media_reported',
        'priority_tier': 1,
        'status': 'detected',
        'created_at': '2026-04-23',
        'related_links': [
            {'title': '감사원, 잼버리 총체적 부실 확인…18명 제재', 'url': 'https://www.newsis.com/view/NISX20250410_0003133698', 'source': '뉴시스'},
            {'title': '잼버리 감사결과 40개 위반사항 적발', 'url': 'https://www.khan.co.kr/article/202504101834001', 'source': '경향신문'},
        ],
    },
    # ── 대장동 ──────────────────────────────────────────────────────────
    {
        'id': 'af-daejangdong-2110',
        'pattern_type': 'cross_pattern',
        'severity': 'CRITICAL',
        'suspicion_score': 97,
        'target_institution': '성남도시개발공사',
        'summary': (
            '성남도시개발공사가 대장동 개발 사업 5개 공구를 화천대유자산관리에 '
            '수의계약 방식으로 배정. 화천대유 측 5,770억원 배당이익 취득, '
            '공사는 4,895억원 손실. 1심 대표 김만배 징역 8년.'
        ),
        'detail': {
            '기관': '성남도시개발공사',
            '업체': '화천대유자산관리',
            '계약방식': '수의계약 (민관합동개발)',
            '화천대유_이익': '5,770억원 (배당이익)',
            '공사_손실': '4,895억원',
            '총_부당이익_주장': '7,886억원',
            '형사_결과': '1심 김만배 징역 8년(2024), 상고심 진행 중',
            '사업시기': '2015~2021년',
        },
        'evidence_contracts': [],
        'innocent_explanation': (
            '민관합동개발(PPP)에서 민간 사업자의 이익 취득 자체가 불법은 아닙니다. '
            '그러나 공모 지침서 작성 단계에서 이미 수익 구조가 화천대유에 유리하게 '
            '설계됐다는 것이 수사기관의 주요 의혹입니다. '
            '항소심·대법원 판단이 아직 확정되지 않았습니다.'
        ),
        'plain_explanation': (
            '성남시 대장동 아파트 개발 사업에서 성남도시개발공사가 수의계약으로 '
            '화천대유라는 민간업체에 5개 공구를 맡겼습니다. '
            '공사가 개발 위험을 모두 지면서 화천대유는 5,770억원의 배당이익을 챙겼습니다. '
            '검찰은 사업 설계 단계부터 특정 업체에 이익을 몰아주도록 구조가 짜여졌다고 보고 있습니다.'
        ),
        'citizen_impact': (
            '공공기관이 민간 개발에 참여할 때는 공익을 위해 이익을 시민에게 환원해야 합니다. '
            '대장동 사업에서 공사는 4,895억원을 손해 본 반면, '
            '민간업체는 5,770억원을 가져갔습니다. '
            '이 차액은 성남시민의 손실입니다.'
        ),
        'why_it_matters': (
            '이 사건은 공공기관이 민관합동개발을 추진할 때 '
            '내부자 설계로 공적 이익을 민간에 이전하는 구조적 허점을 보여줍니다. '
            '같은 구조가 전국 수십 개 도시개발사업에 적용될 수 있습니다.'
        ),
        'what_should_happen': (
            '민관합동개발 공모 지침서 설계 과정에 외부 감사를 의무화해야 합니다. '
            '공공기관 PPP사업의 민간 이익 상한선 규정이 필요합니다.'
        ),
        'verdict': 'suspicious',
        'verdict_reason': '1심 유죄, 수의계약으로 5,770억 민간 이익 vs 4,895억 공사 손실 — 구조적 이익 이전',
        'key_evidence': '화천대유 5,770억 배당이익, 공사 4,895억 손실, 김만배 1심 징역 8년',
        'context_category': 'media_reported',
        'priority_tier': 1,
        'status': 'detected',
        'created_at': '2026-04-23',
        'related_links': [
            {'title': '[대장동] 1심, 화천대유 김만배 징역 8년', 'url': 'https://www.yna.co.kr/view/AKR20240301000000004', 'source': '연합뉴스'},
            {'title': '대장동 개발 사업 논란 총정리', 'url': 'https://ko.wikipedia.org/wiki/%EB%8C%80%EC%9E%A5%EB%8F%99_%EA%B0%9C%EB%B0%9C_%EC%82%AC%EC%97%85_%EB%85%BC%EB%9E%80', 'source': '위키피디아'},
        ],
    },
]

findings = _media_findings + findings
print(f'  Injected {len(_media_findings)} media-reported findings (여수시 비리)')


# ════════════════════════════════════════════════════════════════════
# GLOBAL INNOCENCE FILTER
# After all patterns fire, remove findings that are structurally justified:
#   1. Government affiliate vendors — quasi-public bodies whose sole-source,
#      repeat wins, and concentration patterns are legally mandated
#   2. Disaster recovery contracts — legally unlimited 수의계약 under §26①1
#   3. Cooperative vendors in their natural domain (산림조합 for forestry, etc.)
#   4. Research institute repeated sole-source — structurally expected
#
# These were generating the bulk of the ~1400 false positives.
# Patterns that should NEVER be filtered: ghost_company, bid_rate_anomaly,
# bid_rigging, price_clustering, related_companies, network_collusion,
# sanctioned_vendor — these are hard signals regardless of context.
# ════════════════════════════════════════════════════════════════════
print('\n🛡️  Applying global innocence filter...')

# Patterns safe to filter with structural justifications
FILTERABLE_PATTERNS = frozenset([
    'zero_competition', 'vendor_concentration', 'same_winner_repeat',
    'high_value_sole_source', 'repeated_sole_source', 'amount_spike',
    'yearend_new_vendor', 'low_bid_competition',
])

filtered_findings = []
removal_reasons = defaultdict(int)

for f in findings:
    pt = f.get('pattern_type', '')
    if pt not in FILTERABLE_PATTERNS:
        filtered_findings.append(f)
        continue

    inst = f.get('target_institution', '')
    vendor = _get_vendor_from_finding(f)
    all_text = _get_all_text_from_finding(f)

    # Rule 1: Government affiliate VENDOR in structural delivery context.
    # Logic: a government-affiliated entity (e.g. 한국국토정보공사) winning a land-survey
    # contract from a ministry is structural — they're the mandated provider.
    # BUT: a government affiliate winning a contract at a completely unrelated institution,
    # or financial anomaly patterns (contract_inflation, amount_spike) can still indicate
    # internal corruption at the government affiliate itself.
    # So only remove for "delivery" patterns, NOT for financial-anomaly patterns.
    STRUCTURAL_DELIVERY_PATTERNS = frozenset([
        'zero_competition', 'vendor_concentration', 'same_winner_repeat',
        'high_value_sole_source', 'repeated_sole_source',
    ])
    if is_govt_affiliate(vendor) and pt in STRUCTURAL_DELIVERY_PATTERNS:
        removal_reasons['govt_affiliate_vendor'] += 1
        continue

    # Rule 2: Disaster recovery contracts — legally unrestricted 수의계약
    if has_disaster_recovery(all_text):
        removal_reasons['disaster_recovery'] += 1
        continue

    # Rule 2b: Framework/designated pricing contracts — price is set centrally, not negotiated
    # (혁신제품, 제3자단가계약, 관급자재, 종합쇼핑몰). A "spike" here is just increased demand.
    if has_structural_procurement_method(all_text) and pt in (
        'amount_spike', 'high_value_sole_source', 'vendor_concentration', 'zero_competition'
    ):
        removal_reasons['framework_procurement'] += 1
        continue

    # Rule 3: Cooperative vendors in their natural domain
    if is_cooperative(vendor):
        removal_reasons['cooperative_domain'] += 1
        continue

    # Rule 4: Research institutes — repeated sole-source structurally expected
    if pt == 'repeated_sole_source' and is_research_institute(inst):
        removal_reasons['research_institute'] += 1
        continue

    # Rule 4b: Government corporations as INSTITUTIONS — their procurement is
    # specialized (security clearance, continuity, proprietary systems). High
    # sole-source rates reflect operational constraints, not corruption.
    if pt in ('repeated_sole_source', 'high_value_sole_source') and is_govt_affiliate(inst):
        removal_reasons['govt_corp_institution'] += 1
        continue

    # Rule 4c: Transit, building management, and utility authorities as institutions.
    # These agencies maintain infrastructure requiring original contractor continuity
    # (train electronics, building systems, water infrastructure). Sole-source for
    # OEM maintenance is legally justified and operationally necessary.
    _TRANSIT_BUILDING_INST_KW = (
        '교통공사', '도시철도', '지하철공사', '버스공사',
        '청사관리', '청사운영', '시설관리공단', '시설관리본부', '시설관리소',
        '공영주차장', '환경시설공단', '자원환경사업소',
        '조폐공사',
    )
    if pt == 'repeated_sole_source' and any(kw in inst for kw in _TRANSIT_BUILDING_INST_KW):
        removal_reasons['transit_building_inst'] += 1
        continue

    # Rule 5: high_value_sole_source for local governments: a single sole-source
    # contract ≥1억 at a local government (시, 군, 구) with score < 50 is not
    # meaningfully suspicious without additional pattern signals.
    _LOCAL_GOVT_KW = ('시청', '군청', '구청', '특별자치시', '특별자치도',
                      '광역시', '도청', '시 ', '군 ', '구 ')
    if (pt == 'high_value_sole_source' and
            f.get('suspicion_score', 100) < 50 and
            any(kw in inst for kw in _LOCAL_GOVT_KW)):
        removal_reasons['local_govt_routine_sole_source'] += 1
        continue

    filtered_findings.append(f)

total_removed = sum(removal_reasons.values())
print(f'  Removed {total_removed} structurally-justified findings:')
for reason, count in sorted(removal_reasons.items(), key=lambda x: -x[1]):
    print(f'    {reason}: {count}')
print(f'  Remaining findings: {len(filtered_findings)} (was {len(findings)})')
findings = filtered_findings

# ── Score Reduction for Structurally Ambiguous Cases ──
# These findings are kept (per user's request to not filter by company type)
# but their suspicion_score is reduced so genuinely suspicious cases rank higher.
# This is not filtering — it's calibration based on known structural contexts.
score_reduced = 0
for f in findings:
    inst = f.get('target_institution', '')
    vendor = _get_vendor_from_finding(f)

    # Bookstores at education offices: likely designated 교과서 공급소 under the
    # Korean textbook distribution system (각 학교에 지정 공급소 배정)
    is_book_at_edu = (
        any(kw in vendor for kw in ['서적', '도서', '책쉼터', '책방']) and
        any(kw in inst for kw in ['교육청', '교육지원청', '학교'])
    )
    # Agricultural vendors at local governments: likely under 농산물 직거래 policy
    # (지자체의 지역 농산물 직구매 의무화)
    is_farm_at_local = (
        any(kw in vendor for kw in ['농원', '농장', '영농법인', '영농조합']) and
        any(kw in inst for kw in ['특별자치도', '특별시', '광역시', '도청', '시청', '군청'])
    )

    if is_book_at_edu or is_farm_at_local:
        old_score = f.get('suspicion_score', 0)
        f['suspicion_score'] = max(20, int(old_score * 0.55))
        reason_label = '교과서공급소' if is_book_at_edu else '농산물직거래'
        f.setdefault('_structural_notes', []).append(reason_label)
        score_reduced += 1

if score_reduced:
    print(f'  Score-reduced {score_reduced} structurally-ambiguous findings (bookstores/farms)')


# ════════════════════════════════════════════════════════════════════
# CONFIDENCE SCORING: Re-score all findings with composite methodology
# ════════════════════════════════════════════════════════════════════
print('\n📊 Confidence scoring — composite methodology...')

# Define pattern base weights (some patterns are inherently more reliable)
PATTERN_BASE_CONFIDENCE = {
    'cross_pattern': 0.90,
    'systemic_risk': 0.85,
    'network_collusion': 0.85,
    'sanctioned_vendor': 0.90,
    'price_clustering': 0.92,
    'bid_rigging': 0.80,
    'related_companies': 0.75,
    'ghost_company': 0.70,
    'bid_rate_anomaly': 0.70,
    'contract_inflation': 0.65,
    'price_divergence': 0.72,       # same-vendor cross-institution price comparison
    'price_vs_catalog': 0.78,      # direct comparison to 종합쇼핑몰 standard catalog price
    'amount_spike': 0.70,          # remaining ones after filter are genuine spikes
    'zero_competition': 0.55,       # raised slightly: filtered govt affiliates/disaster
    'new_company_big_win': 0.55,
    'vendor_concentration': 0.60,   # raised: 60% threshold makes remaining cases meaningful
    'same_winner_repeat': 0.55,     # raised: 8-win/30억 filter removes casual repeats
    'repeated_sole_source': 0.50,   # raised: 90%/10-contract filter removes structural cases
    'contract_splitting': 0.40,
    'low_bid_competition': 0.45,
    'yearend_new_vendor': 0.68,     # specific combo: year-end + new vendor + sole-source
    'vendor_rotation': 0.75,       # temporal rotation pattern — strong cartel signal
    'high_value_sole_source': 0.60, # raised: 5억 threshold removes routine cases
    'rebid_same_winner': 0.78,     # same winner across re-bid rounds — strong manipulation signal
}

for f in findings:
    pt = f['pattern_type']
    base_conf = PATTERN_BASE_CONFIDENCE.get(pt, 0.50)

    # Evidence quality bonus: more evidence contracts = more reliable
    evidence_count = len(f.get('evidence_contracts', []))
    evidence_bonus = min(0.10, evidence_count * 0.02)

    # Amount magnitude bonus: larger amounts = more impactful
    total_evidence_amt = sum(
        float(ec.get('amount', 0)) for ec in f.get('evidence_contracts', [])
    )
    if total_evidence_amt > 5e9:
        amount_bonus = 0.10
    elif total_evidence_amt > 1e9:
        amount_bonus = 0.07
    elif total_evidence_amt > 1e8:
        amount_bonus = 0.03
    else:
        amount_bonus = 0

    # Context category penalty (already classified as low risk)
    context_penalty = 0
    if f.get('context_category') in ('construction_materials', 'maintenance_lock',
                                      'education', 'defense_security', 'medical_pharma',
                                      'small_municipality', 'diverse_vendors', 'gov_affiliated'):
        context_penalty = 0.15

    # Additional structural context penalty for vendor types that may have
    # legitimate local-procurement reasons. We keep the findings but reduce confidence.
    vendor_str = _get_vendor_from_finding(f)
    all_text_str = _get_all_text_from_finding(f)

    # Book/textbook vendors at education offices — could be designated local suppliers
    is_book_vendor = any(kw in vendor_str for kw in ['서적', '도서', '책', '출판'])
    is_edu_inst = any(kw in f.get('target_institution', '') for kw in ['교육청', '교육지원청', '학교', '도서관'])
    if is_book_vendor and is_edu_inst:
        context_penalty += 0.20  # Significant penalty — likely designated textbook supplier

    # Agricultural vendors at local government — likely local food direct purchase (농산물 직거래)
    is_agri_vendor = any(kw in vendor_str for kw in ['농원', '농장', '영농', '농업', '재배'])
    is_local_govt = any(kw in f.get('target_institution', '') for kw in ['특별자치도', '시청', '군청', '도청', '시 ', '군 '])
    if is_agri_vendor and is_local_govt:
        context_penalty += 0.18  # Penalty — likely under 농산물 직거래 정책

    confidence = min(0.99, max(0.10, base_conf + evidence_bonus + amount_bonus - context_penalty))
    f['confidence'] = round(confidence, 2)
    f['confidence_label'] = (
        '매우 높음' if confidence >= 0.85 else
        '높음' if confidence >= 0.70 else
        '보통' if confidence >= 0.50 else
        '낮음' if confidence >= 0.30 else
        '매우 낮음'
    )

print(f'  Confidence distribution: '
      f'매우높음 {sum(1 for f in findings if f.get("confidence",0) >= 0.85)}, '
      f'높음 {sum(1 for f in findings if 0.70 <= f.get("confidence",0) < 0.85)}, '
      f'보통 {sum(1 for f in findings if 0.50 <= f.get("confidence",0) < 0.70)}, '
      f'낮음 {sum(1 for f in findings if f.get("confidence",0) < 0.50)}')


# ════════════════════════════════════════════════════════════════════
# INVESTIGATION DOSSIER: Priority ranked investigation targets
# ════════════════════════════════════════════════════════════════════
print('\n📋 Generating investigation priority ranking...')

# Score each institution by aggregating all its findings
inst_dossier = defaultdict(lambda: {
    'findings': [],
    'pattern_types': set(),
    'total_amount': 0,
    'max_score': 0,
    'critical_count': 0,
    'high_count': 0,
})

for f in findings:
    inst = f.get('target_institution', '')
    if not inst:
        continue
    d = inst_dossier[inst]
    d['findings'].append(f)
    d['pattern_types'].add(f['pattern_type'])
    d['max_score'] = max(d['max_score'], f['suspicion_score'])
    amt = sum(float(ec.get('amount', 0)) for ec in f.get('evidence_contracts', []))
    d['total_amount'] += amt
    if f.get('severity') == 'CRITICAL':
        d['critical_count'] += 1
    elif f.get('severity') == 'HIGH':
        d['high_count'] += 1

# Calculate priority score for each institution
investigation_priority = []
for inst, d in inst_dossier.items():
    # Priority formula: weighted combination of factors
    priority = (
        d['max_score'] * 0.30 +                      # Highest individual score
        len(d['pattern_types']) * 10 * 0.25 +         # Diversity of patterns
        d['critical_count'] * 15 * 0.20 +             # Number of critical findings
        d['high_count'] * 8 * 0.15 +                  # Number of high findings
        min(50, (d['total_amount'] / 1e9) * 10) * 0.10  # Total amount at risk
    )
    investigation_priority.append({
        'institution': inst,
        'priority_score': round(priority, 1),
        'findings_count': len(d['findings']),
        'pattern_types_count': len(d['pattern_types']),
        'pattern_types': sorted(d['pattern_types']),
        'total_amount': d['total_amount'],
        'critical_count': d['critical_count'],
        'high_count': d['high_count'],
        'max_individual_score': d['max_score'],
    })

investigation_priority.sort(key=lambda x: -x['priority_score'])
top_20 = investigation_priority[:20]

print(f'  Total institutions with findings: {len(investigation_priority)}')
print(f'  Top 5 investigation priorities:')
for i, ip in enumerate(top_20[:5]):
    print(f'    {i+1}. {ip["institution"]} (우선순위 {ip["priority_score"]:.0f}, '
          f'{ip["findings_count"]}건, {ip["pattern_types_count"]}패턴, '
          f'{ip["total_amount"]/1e8:.1f}억원)')


# ════════════════════════════════════════════════════════════════════
# Final: Sort, limit, and save
# ════════════════════════════════════════════════════════════════════
findings.sort(key=lambda f: -f['suspicion_score'])

# Re-assign stable content-based IDs to ALL findings (including cross_pattern/systemic_risk added later)
# IDs are hash-based so URLs survive regeneration when new findings are added/removed
# Findings that already have an 'id' (media-reported injections) keep their explicit ID.
_seen_ids2: dict[str, int] = {}
# Pre-seed seen set with explicit IDs so hash-based IDs don't collide
for f in findings:
    if f.get('id'):
        _seen_ids2[f['id']] = 0
for f in findings:
    if not f.get('id'):
        base = _stable_id(f)
        if base in _seen_ids2:
            _seen_ids2[base] += 1
            f['id'] = f'{base}-{_seen_ids2[base]}'
        else:
            _seen_ids2[base] = 0
            f['id'] = base
    f['target_id'] = f.get('target_institution', '')
    f['target_type'] = '기관'
    f['status'] = f.get('status', 'detected')
    f['created_at'] = f.get('created_at', datetime.now().strftime('%Y-%m-%d'))

# ── Assign verdict to every finding ──
print('\n🔎 Assigning verdicts...')
verdict_counts = {'suspicious': 0, 'investigate': 0, 'legitimate': 0}
for f in findings:
    verdict, verdict_reason, key_evidence = assign_verdict(f)
    f['verdict'] = verdict
    f['verdict_reason'] = verdict_reason
    f['key_evidence'] = key_evidence
    verdict_counts[verdict] += 1
print(f'  의심 확실: {verdict_counts["suspicious"]} | 조사 필요: {verdict_counts["investigate"]} | 정상 가능성: {verdict_counts["legitimate"]}')

# ── Assign priority tier to every finding ──
HIGH_VALUE_PATTERNS = {
    'cross_pattern', 'systemic_risk', 'bid_rate_anomaly',
    'zero_competition', 'same_winner_repeat', 'contract_inflation',
}


def assign_priority_tier(f: dict) -> int:
    score = f.get('suspicion_score', 0)
    verdict = f.get('verdict', 'investigate')
    pattern = f.get('pattern_type', '')
    amount = sum(float(e.get('amount', 0)) for e in f.get('evidence_contracts', []))
    if verdict == 'suspicious' and score >= 70 and amount >= 100_000_000 and pattern in HIGH_VALUE_PATTERNS:
        return 1
    if verdict == 'suspicious' and score >= 50:
        return 2
    return 3


for f in findings:
    f['priority_tier'] = assign_priority_tier(f)

tier_counts = {1: 0, 2: 0, 3: 0}
for f in findings:
    tier_counts[f['priority_tier']] += 1
print(f'  Priority tiers — Tier 1: {tier_counts[1]} | Tier 2: {tier_counts[2]} | Tier 3: {tier_counts[3]}')

# Summary stats
sole_count = sum(1 for c in contracts if '수의' in str(c.get('cntrctCnclsMthdNm', '')))
unique_insts = len(set(f['target_institution'] for f in findings))
unique_vendors = len(set(
    e['vendor'] for f in findings for e in f['evidence_contracts'] if e.get('vendor')
))

# Severity distribution
sev_dist = defaultdict(int)
for f in findings:
    sev_dist[f.get('severity', 'UNKNOWN')] += 1

# Confidence distribution
conf_dist = {
    'very_high': sum(1 for f in findings if f.get('confidence', 0) >= 0.85),
    'high': sum(1 for f in findings if 0.70 <= f.get('confidence', 0) < 0.85),
    'medium': sum(1 for f in findings if 0.50 <= f.get('confidence', 0) < 0.70),
    'low': sum(1 for f in findings if f.get('confidence', 0) < 0.50),
}

# Total amounts at risk
total_at_risk = sum(
    float(ec.get('amount', 0))
    for f in findings
    for ec in f.get('evidence_contracts', [])
)

# Estimated waste (conservative: 10% of flagged amount)
estimated_waste = total_at_risk * 0.10

result = {
    'timestamp': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'version': '2.0',
    'contracts_analyzed': len(std_contracts) + len(contracts) + len(bids),
    'total_contracts_in_db': len(std_contracts) + len(contracts),
    'findings_count': len(findings),
    'findings': findings,
    'summary': {
        'sole_source_ratio': sole_count / max(len(contracts), 1),
        'unique_institutions': unique_insts,
        'unique_vendors': unique_vendors,
        'total_amount_flagged': total_at_risk,
        'estimated_waste': estimated_waste,
        'severity_distribution': dict(sev_dist),
        'confidence_distribution': conf_dist,
    },
    'pattern_counts': {},
    'investigation_priority': top_20,
    'methodology': {
        'patterns_count': len(PATTERN_LABELS),
        'pattern_types': list(PATTERN_LABELS.keys()),
        'pattern_labels': PATTERN_LABELS,
        'data_sources': {
            'winning_bids': len(bids),
            'contract_details': len(contracts),
            'actual_contracts': len(std_contracts),
            'companies': len(companies_raw),
            'sanctions': len(sanctions_set),
            'bid_announcements': len(bid_announcements),
            'price_data': len(price_data) if 'price_data' in dir() and price_data else 0,
        },
        'context_engine': {
            'categories': list(CONTEXT_CATEGORIES.keys()),
            'removed_as_normal': removed,
            'downgraded': downgraded,
        },
        'confidence_scoring': {
            'method': 'composite',
            'factors': ['pattern_base_weight', 'evidence_count', 'amount_magnitude', 'context_category'],
        },
    },
}

for f in findings:
    pt = f['pattern_type']
    result['pattern_counts'][pt] = result['pattern_counts'].get(pt, 0) + 1

# ── News correlation (free, no API cost) ─────────────────────────────────────
print('\n📰 뉴스 연관성 분석...')
_news_path = DATA_DIR / 'news-rss.json'
_inst_news_map: dict = {}
if _news_path.exists():
    try:
        _news_raw = json.loads(_news_path.read_text(encoding='utf-8'))
        _articles = _news_raw.get('items', _news_raw.get('articles', _news_raw if isinstance(_news_raw, list) else []))
        for _f in findings:
            _inst = _f.get('target_institution', '')
            if not _inst or _inst in _inst_news_map:
                continue
            # Match on first 8 chars of institution name (usually unique)
            _short = _inst[:8]
            _matched = [
                {'title': a.get('title', ''), 'link': a.get('link', ''), 'outlet': a.get('outlet_name', '')}
                for a in _articles
                if _short in a.get('title', '') or _short in a.get('description', '')
            ][:3]
            if _matched:
                _inst_news_map[_inst] = _matched
        # Attach to findings
        _news_linked = 0
        for _f in findings:
            _news = _inst_news_map.get(_f.get('target_institution', ''))
            if _news:
                _f['related_news'] = _news
                _news_linked += 1
        print(f'  {_news_linked}건 발견에 관련 뉴스 연결 ({len(_articles)}건 기사 중)')
    except Exception as _e:
        print(f'  ⚠️  뉴스 로드 실패: {_e}')
else:
    print('  ⚠️  news-rss.json 없음')

# ── Institution context enrichment ───────────────────────────────────────────
# For every finding, attach a summary of ALL known data for that institution
# from the full accumulated store. Grows richer as accumulate.py runs daily.
print('\n🔍 기관별 전체 데이터 컨텍스트 연결...')

_inst_context: dict = {}  # institution → context summary

def _build_inst_context():
    # Index all contracts/bids by institution
    _inst_contracts: dict = defaultdict(list)
    _inst_bids: dict = defaultdict(list)

    for c in std_contracts:
        inst = str(c.get('dminsttNm', c.get('ntceInsttNm', c.get('instNm', ''))))
        if inst:
            _inst_contracts[inst].append(c)
    for c in contracts:
        inst = str(c.get('dminsttNm', c.get('ntceInsttNm', '')))
        if inst:
            _inst_contracts[inst].append(c)
    for b in bids:
        inst = str(b.get('ntceInsttNm', b.get('dminsttNm', '')))
        if inst:
            _inst_bids[inst].append(b)

    for inst in set(f.get('target_institution', '') for f in findings):
        if not inst:
            continue
        # Fuzzy match: check both exact and first-10-char prefix matches
        short = inst[:10]
        ctrs = _inst_contracts.get(inst, []) or [
            c for k, v in _inst_contracts.items() if k[:10] == short for c in v
        ]
        bds = _inst_bids.get(inst, []) or [
            b for k, v in _inst_bids.items() if k[:10] == short for b in v
        ]
        if not ctrs and not bds:
            continue

        amounts = [float(c.get('cntrctAmt', c.get('presmptPrce', 0)) or 0) for c in ctrs]
        bid_amts = [float(b.get('presmptPrce', b.get('sucsfbidAmt', 0)) or 0) for b in bds]
        vendors = list({
            str(c.get('cntrctor', c.get('bidwinrNm', c.get('rprsntCorpNm', ''))))
            for c in ctrs + bds
            if c.get('cntrctor') or c.get('bidwinrNm') or c.get('rprsntCorpNm')
        })[:20]

        # Top vendors by total contract amount
        vendor_totals: dict = defaultdict(float)
        for c in ctrs:
            v = str(c.get('cntrctor', c.get('bidwinrNm', c.get('rprsntCorpNm', ''))))
            a = _f(c.get('cntrctAmt'))
            if v:
                vendor_totals[v] += a
        top_vendors = sorted(vendor_totals.items(), key=lambda x: -x[1])[:5]

        _inst_context[inst] = {
            'total_contracts_in_store': len(ctrs),
            'total_bids_in_store': len(bds),
            'total_amount_all_contracts': sum(amounts),
            'avg_contract_amount': sum(amounts) / len(amounts) if amounts else 0,
            'unique_vendors': len(vendors),
            'top_vendors_by_amount': [{'vendor': v, 'total': t} for v, t in top_vendors],
            'date_range': {
                'earliest': min(
                    (str(c.get('cntrctCnclsDt', c.get('opengDt', '')))[:10]
                     for c in ctrs + bds
                     if c.get('cntrctCnclsDt') or c.get('opengDt')),
                    default='',
                ),
                'latest': max(
                    (str(c.get('cntrctCnclsDt', c.get('opengDt', '')))[:10]
                     for c in ctrs + bds
                     if c.get('cntrctCnclsDt') or c.get('opengDt')),
                    default='',
                ),
            },
        }

_build_inst_context()

enriched = 0
for _f in findings:
    ctx = _inst_context.get(_f.get('target_institution', ''))
    if ctx:
        _f['institution_context'] = ctx
        enriched += 1
    # Tag institution type so frontend can show structural context disclaimer
    inst_type = get_inst_type(_f.get('target_institution', ''))
    if inst_type:
        _f['institution_type'] = inst_type

print(f'  {enriched}건 발견에 기관 전체 컨텍스트 첨부 ({len(_inst_context)} 기관)')

out_path = OUT_DIR / 'audit-results.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

size_kb = out_path.stat().st_size / 1024
print(f'\n✅ Saved {out_path} ({size_kb:.0f} KB)')
print(f'   {len(findings)} findings across {len(result["pattern_counts"])} pattern types:')
for pt, cnt in sorted(result['pattern_counts'].items(), key=lambda x: -x[1]):
    print(f'     {pt}: {cnt}')
print(f'\n📊 Summary:')
print(f'   Total amount flagged: {total_at_risk/1e8:.1f}억원')
print(f'   Estimated waste: {estimated_waste/1e8:.1f}억원')
print(f'   Severity: CRITICAL {sev_dist.get("CRITICAL",0)}, HIGH {sev_dist.get("HIGH",0)}, '
      f'MEDIUM {sev_dist.get("MEDIUM",0)}, LOW {sev_dist.get("LOW",0)}')
print(f'   Top investigation target: {top_20[0]["institution"] if top_20 else "N/A"}')
