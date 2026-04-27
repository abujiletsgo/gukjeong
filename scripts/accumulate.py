#!/usr/bin/env python3
"""
Daily data accumulator for 국정투명.

Run once per day: uv run scripts/accumulate.py [--months N]

Each run:
  1. Reads state to find oldest unfetched month per dataset
  2. Fetches MONTHS_PER_RUN months of new historical data
  3. Merges (deduplicated) into existing JSON stores — nothing is lost
  4. Updates state so next run goes further back in history

Datasets managed:
  - g2b-winning-bids.json      낙찰정보 (ScsbidInfoService)
  - g2b-contract-details.json  계약정보 (CntrctInfoService)
  - g2b-bid-rankings.json      개찰결과/입찰순위 (ScsbidInfoService)

After accumulating, re-run: uv run scripts/generate-audit.py
"""

import json
import os
import ssl
import sys
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

# ── Paths & keys ──
DATA_DIR = Path(__file__).parent.parent / 'apps' / 'web' / 'data'
STATE_FILE = DATA_DIR / 'accumulator-state.json'
DATA_GO_KR_KEY = os.environ.get(
    'DATA_GO_KR_API_KEY',
    '3ae0c87c5217c2e49abb045621ddd371a3ba8e26c5823d5c78f40910b5903201',
)
G2B_BASE = 'https://apis.data.go.kr/1230000'

MONTHS_PER_RUN = int(sys.argv[sys.argv.index('--months') + 1]) if '--months' in sys.argv else 3

# ── Rate limiter (mirrors fetch-data.py) ──
_CONCURRENCY = 6
_REQUEST_GAP = 0.08
_http_sem = threading.Semaphore(_CONCURRENCY)
_http_lock = threading.Lock()
_last_req_ts: float = 0.0

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def _rate_limited_open(url: str, timeout: int = 30):
    global _last_req_ts
    with _http_sem:
        with _http_lock:
            gap = _REQUEST_GAP - (time.monotonic() - _last_req_ts)
            if gap > 0:
                time.sleep(gap)
            _last_req_ts = time.monotonic()
        req = urllib.request.Request(url, headers={
            'Accept': 'application/json',
            'User-Agent': 'GukjeongTumyeong/accumulate',
        })
        return urllib.request.urlopen(req, timeout=timeout, context=ctx)


def fetch_json(url: str) -> dict:
    with _rate_limited_open(url) as resp:
        return json.loads(resp.read().decode('utf-8'))


# ── Pagination ──
def fetch_pages(url_template: str, max_pages: int = 100, workers: int = 8) -> list:
    url = url_template.format(KEY=DATA_GO_KR_KEY, PAGE=1)
    d = fetch_json(url)
    err = d.get('nkoneps.com.response.ResponseError', {})
    if err:
        code = err.get('header', {}).get('resultCode', '?')
        msg = err.get('header', {}).get('resultMsg', '?')
        print(f'    ⚠️  API error: {code} — {msg}')
        return []
    body = d.get('response', {}).get('body', {})
    p1 = body.get('items', [])
    if not isinstance(p1, list):
        p1 = [p1] if p1 else []
    if not p1:
        return []
    total = int(body.get('totalCount', 0))
    total_pages = min(max_pages, (total + 99) // 100)
    if total_pages <= 1:
        return p1

    def _get(page: int):
        u = url_template.format(KEY=DATA_GO_KR_KEY, PAGE=page)
        try:
            b = fetch_json(u).get('response', {}).get('body', {})
            its = b.get('items', [])
            return page, its if isinstance(its, list) else ([its] if its else [])
        except Exception:
            return page, []

    results: dict[int, list] = {}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futs = {pool.submit(_get, p): p for p in range(2, total_pages + 1)}
        for fut in as_completed(futs):
            pg, items = fut.result()
            results[pg] = items

    all_items = list(p1)
    for pg in sorted(results):
        all_items.extend(results[pg])
    return all_items


# ── Date helpers ──
def ym_to_months_ago(year: int, month: int) -> int:
    now = datetime.now()
    return (now.year - year) * 12 + (now.month - month)


def months_ago_to_ym(months_ago: int) -> tuple[int, int]:
    now = datetime.now()
    total = now.year * 12 + now.month - 1 - months_ago
    return total // 12, total % 12 + 1


def month_range_fmt(year: int, month: int) -> tuple[str, str]:
    start = datetime(year, month, 1)
    end = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)
    now = datetime.now()
    if end > now:
        end = now
    return start.strftime('%Y%m%d0000'), end.strftime('%Y%m%d2359')


# ── State ──
def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding='utf-8'))
    return {}


def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')


def seed_months_already_fetched() -> list[str]:
    """The initial 12 months already in data files (fetch-data.py default)."""
    now = datetime.now()
    months = []
    for i in range(12):
        y, m = months_ago_to_ym(i)
        months.append(f'{y:04d}-{m:02d}')
    return months


def _ym_str_to_int(ym: str) -> int:
    """Convert 'YYYY-MM' to 0-indexed total months (consistent with months_ago_to_ym)."""
    return int(ym[:4]) * 12 + int(ym[5:]) - 1


def _int_to_ym(total: int) -> tuple[int, int]:
    y, r = divmod(total, 12)
    return y, r + 1


def next_months_to_fetch(state_key: str, state: dict, n: int) -> list[tuple[int, int]]:
    """Return n oldest unfetched (year, month) tuples."""
    fetched = set(state.get(state_key, {}).get('months', []))
    if not fetched:
        fetched = set(seed_months_already_fetched())

    # oldest_int is 0-indexed so subtracting 1 gives the month just before it
    oldest_int = min(_ym_str_to_int(ym) for ym in fetched)
    result = []
    for i in range(n):
        total = oldest_int - 1 - i
        y, m = _int_to_ym(total)
        label = f'{y:04d}-{m:02d}'
        if label not in fetched:
            result.append((y, m))
    return result


# ── Dedup keys ──
def key_winning_bid(r: dict) -> str:
    return f"{r.get('bidNtceNo','')}-{r.get('bidNtceOrd','')}-{r.get('bidClsfcNo','')}"


def key_contract_detail(r: dict) -> str:
    k = r.get('untyCntrctNo', '')
    return k if k else f"{r.get('cntrctRefNo','')}-{r.get('cntrctNm','')[:40]}"


def key_bid_ranking(r: dict) -> str:
    return (
        f"{r.get('bidNtceNo','')}-{r.get('bidNtceOrd','')}"
        f"-{r.get('bidClsfcNo','')}-{r.get('rbidNo','')}"
    )


# ── Merge ──
def merge_into_file(filename: str, new_items: list, key_fn) -> tuple[int, int]:
    fpath = DATA_DIR / filename
    if fpath.exists():
        blob = json.loads(fpath.read_text(encoding='utf-8'))
        old_items = blob.get('items', [])
        existing_keys = {key_fn(r) for r in old_items}
        added = [r for r in new_items if key_fn(r) not in existing_keys]
        merged = old_items + added
        blob['items'] = merged
        blob['totalCount'] = len(merged)
        blob['last_accumulation'] = datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')
    else:
        added = new_items
        merged = new_items
        blob = {
            'source': 'data.go.kr (accumulated)',
            'fetched_at': datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'totalCount': len(merged),
            'items': merged,
        }
    fpath.write_text(json.dumps(blob, ensure_ascii=False), encoding='utf-8')
    return len(added), len(merged)


# ── Per-dataset fetch ──
DATASETS = [
    {
        'state_key': 'winning_bids',
        'filename': 'g2b-winning-bids.json',
        'label': '낙찰정보',
        'api_base': f'{G2B_BASE}/as/ScsbidInfoService',
        'endpoints': [
            'getScsbidListSttusThng',
            'getScsbidListSttusCnstwk',
            'getScsbidListSttusServc',
        ],
        'key_fn': key_winning_bid,
    },
    {
        'state_key': 'contract_details',
        'filename': 'g2b-contract-details.json',
        'label': '계약정보',
        'api_base': f'{G2B_BASE}/ao/CntrctInfoService',
        'endpoints': [
            'getCntrctInfoListThng',
            'getCntrctInfoListCnstwk',
            'getCntrctInfoListServc',
        ],
        'key_fn': key_contract_detail,
    },
    {
        'state_key': 'bid_rankings',
        'filename': 'g2b-bid-rankings.json',
        'label': '개찰결과',
        'api_base': f'{G2B_BASE}/as/ScsbidInfoService',
        'endpoints': [
            'getOpengResultListInfoThng',
            'getOpengResultListInfoCnstwk',
            'getOpengResultListInfoServc',
        ],
        'key_fn': key_bid_ranking,
    },
]


def fetch_dataset_month(api_base: str, endpoints: list, start: str, end: str) -> list:
    items = []
    for ep in endpoints:
        tmpl = (
            f'{api_base}/{ep}'
            f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
            f'&inqryDiv=1&inqryBgnDt={start}&inqryEndDt={end}'
        )
        items.extend(fetch_pages(tmpl, max_pages=100))
    return items


def accumulate_dataset(ds: dict, months: list[tuple[int, int]]) -> tuple[dict, int, int]:
    """Fetch months, merge into file. Returns (month_results, added, total)."""
    month_results: dict[str, list] = {}

    def _fetch(ym: tuple[int, int]):
        y, m = ym
        label = f'{y:04d}-{m:02d}'
        start, end = month_range_fmt(y, m)
        try:
            items = fetch_dataset_month(ds['api_base'], ds['endpoints'], start, end)
            return label, items
        except Exception as e:
            print(f'    ⚠️  {label} fetch error: {e}')
            return label, []

    with ThreadPoolExecutor(max_workers=3) as pool:
        futs = {pool.submit(_fetch, ym): ym for ym in months}
        for fut in as_completed(futs):
            label, items = fut.result()
            month_results[label] = items
            print(f'    {label}: {len(items):,}건')

    new_items = []
    for label in sorted(month_results):
        new_items.extend(month_results[label])

    added, total = merge_into_file(ds['filename'], new_items, ds['key_fn'])
    return month_results, added, total


def main():
    if not DATA_GO_KR_KEY:
        print('❌ DATA_GO_KR_API_KEY not set')
        sys.exit(1)

    print(f'🗃️  국정투명 데이터 축적 — {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    print(f'   월 {MONTHS_PER_RUN}개월분 추가 (--months N 으로 변경 가능)\n')

    state = load_state()
    grand_added = 0

    for ds in DATASETS:
        sk = ds['state_key']
        print(f'📦 {ds["label"]} ({ds["filename"]})')

        months = next_months_to_fetch(sk, state, MONTHS_PER_RUN)
        if not months:
            print('  ✓ 추가할 데이터 없음 (API 전체 범위 수집 완료)')
            continue

        labels = [f'{y:04d}-{m:02d}' for y, m in months]
        print(f'  → {", ".join(labels)} 수집 중...')

        month_results, added, total = accumulate_dataset(ds, months)
        grand_added += added
        print(f'  +{added:,} 신규 레코드 → 누적 총 {total:,}건')

        if sk not in state:
            state[sk] = {'months': []}
        existing = set(state[sk].get('months', []))
        if not existing:
            existing = set(seed_months_already_fetched())
        existing.update(labels)
        state[sk]['months'] = sorted(existing)
        state[sk]['last_run'] = datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')
        state[sk]['total_records'] = total
        state[sk]['coverage_months'] = len(state[sk]['months'])
        state[sk]['oldest_month'] = state[sk]['months'][0] if state[sk]['months'] else None

    save_state(state)

    print(f'\n✅ 완료 — 신규 {grand_added:,}건 추가')
    print(f'   State → {STATE_FILE}')

    for ds in DATASETS:
        sk = ds['state_key']
        if sk in state:
            s = state[sk]
            print(f'   {ds["label"]}: {s.get("total_records", 0):,}건 ({s.get("coverage_months", 0)}개월 커버, {s.get("oldest_month","?")} ~ 현재)')

    print('\n다음 단계: uv run scripts/generate-audit.py')


if __name__ == '__main__':
    main()
