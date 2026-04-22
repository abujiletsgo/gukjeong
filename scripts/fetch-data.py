#!/usr/bin/env python3
"""
국정투명 데이터 새로고침 스크립트

모든 외부 API에서 데이터를 가져와 apps/web/data/ 에 JSON으로 저장합니다.
앱은 이 로컬 파일을 읽어 서비스합니다.

사용법:
  python3 scripts/fetch-data.py          # 전체 새로고침
  python3 scripts/fetch-data.py news     # 뉴스만
  python3 scripts/fetch-data.py ecos     # 경제지표만
"""
import urllib.request
import json
import ssl
import sys
import os
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

# ── Setup ──
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

DATA_DIR = Path(__file__).parent.parent / 'apps' / 'web' / 'data'
DATA_DIR.mkdir(parents=True, exist_ok=True)

# API Keys (hardcoded for local dev — same as in the codebase)
DATA_GO_KR_KEY = os.environ.get(
    'DATA_GO_KR_API_KEY',
    '3ae0c87c5217c2e49abb045621ddd371a3ba8e26c5823d5c78f40910b5903201',
)
ASSEMBLY_KEY = os.environ.get('ASSEMBLY_API_KEY', 'c5d3b64dc8d9419fac113114b6fb97c9')
ECOS_KEY = os.environ.get('ECOS_API_KEY', 'UTL8M4BXGPPLQAQE2W9T')

# ── Global rate limiter ──
# Caps concurrent HTTP connections to apis.data.go.kr to avoid 429s.
# All fetch_json / fetch_text calls share this semaphore, so even when
# multiple ThreadPoolExecutors are running in parallel they collectively
# stay within the limit.
_CONCURRENCY = 6          # max simultaneous in-flight requests
_REQUEST_GAP = 0.08       # minimum seconds between any two requests (≈12 req/s peak)
_http_sem = threading.Semaphore(_CONCURRENCY)
_http_lock = threading.Lock()
_last_req_ts: float = 0.0


def _rate_limited_open(url, timeout):
    """Acquire semaphore + enforce minimum inter-request gap, then open URL."""
    global _last_req_ts
    with _http_sem:
        with _http_lock:
            gap = _REQUEST_GAP - (time.monotonic() - _last_req_ts)
            if gap > 0:
                time.sleep(gap)
            _last_req_ts = time.monotonic()
        req = urllib.request.Request(url, headers={
            'Accept': 'application/json',
            'User-Agent': 'GukjeongTumyeong/fetch-data',
        })
        return urllib.request.urlopen(req, timeout=timeout, context=ctx)


def fetch_json(url, timeout=20):
    resp = _rate_limited_open(url, timeout)
    return json.loads(resp.read().decode('utf-8'))


def fetch_text(url, timeout=15):
    global _last_req_ts
    with _http_sem:
        with _http_lock:
            gap = _REQUEST_GAP - (time.monotonic() - _last_req_ts)
            if gap > 0:
                time.sleep(gap)
            _last_req_ts = time.monotonic()
        req = urllib.request.Request(url, headers={'User-Agent': 'GukjeongTumyeong/fetch-data'})
        resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        return resp.read().decode('utf-8', errors='replace')


def save(filename, data):
    path = DATA_DIR / filename
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    size = path.stat().st_size
    unit = 'KB' if size < 1_000_000 else 'MB'
    val = size / 1024 if size < 1_000_000 else size / 1_048_576
    print(f'  💾 Saved {filename} ({val:.1f} {unit})')


def now_iso():
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


# ── KONEPS API helpers ──
# 조달청 KONEPS APIs use different gateway prefixes and date formats

G2B_BASE = 'https://apis.data.go.kr/1230000'

def koneps_date(days_ago=30):
    """Date pair for KONEPS APIs: (start, end) in YYYYMMDDHHmm format."""
    end = datetime.now()
    start = datetime(end.year, end.month, 1) if days_ago <= 31 else datetime(end.year - 1, 1, 1)
    return start.strftime('%Y%m%d0000'), end.strftime('%Y%m%d2359')


def koneps_month_ranges(months_back=12):
    """Generate (start, end) pairs for each month going back N months.
    KONEPS APIs have a 1-month max date range, so we query month by month."""
    now = datetime.now()
    ranges = []
    for i in range(months_back):
        y = now.year - ((now.month - 1 - i) < 0)
        m = ((now.month - 1 - i) % 12) + 1
        start = datetime(y, m, 1)
        if m == 12:
            end = datetime(y + 1, 1, 1)
        else:
            end = datetime(y, m + 1, 1)
        # Clamp end to now if in current month
        if end > now:
            end = now
        ranges.append((start.strftime('%Y%m%d0000'), end.strftime('%Y%m%d2359')))
    return ranges


def fetch_koneps_pages(url_template, max_pages=10, label='items', workers=10):
    """Paginated fetcher for KONEPS/data.go.kr APIs — parallel after page 1."""
    # Page 1 first to get totalCount
    url = url_template.format(KEY=DATA_GO_KR_KEY, PAGE=1)
    d = fetch_json(url)
    err = d.get('nkoneps.com.response.ResponseError', {})
    if err:
        code = err.get('header', {}).get('resultCode', '?')
        msg = err.get('header', {}).get('resultMsg', '?')
        print(f'  ⚠️  API error: {code} — {msg}')
        return []
    body = d.get('response', {}).get('body', {})
    items_p1 = body.get('items', [])
    if not isinstance(items_p1, list):
        items_p1 = [items_p1] if items_p1 else []
    if not items_p1:
        return []
    total = int(body.get('totalCount', 0))
    total_pages = min(max_pages, (total + 99) // 100)
    if total_pages <= 1:
        return items_p1

    def _fetch_page(page):
        u = url_template.format(KEY=DATA_GO_KR_KEY, PAGE=page)
        try:
            r = fetch_json(u)
            b = r.get('response', {}).get('body', {})
            its = b.get('items', [])
            if not isinstance(its, list):
                its = [its] if its else []
            return page, its
        except Exception:
            return page, []

    results = {}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futs = {pool.submit(_fetch_page, p): p for p in range(2, total_pages + 1)}
        for fut in as_completed(futs):
            page, items = fut.result()
            results[page] = items

    all_items = list(items_p1)
    for p in sorted(results):
        all_items.extend(results[p])
    return all_items


# ── Fetchers ──

def fetch_legislators():
    print('\n📋 열린국회정보 — 의원 목록')
    all_members = []
    page = 1
    while page <= 5:
        url = (
            f'https://open.assembly.go.kr/portal/openapi/nwvrqwxyaytdsfvhu'
            f'?KEY={ASSEMBLY_KEY}&Type=json&pIndex={page}&pSize=100&UNIT_CD=100022'
        )
        d = fetch_json(url)
        rows = []
        for k in d:
            if isinstance(d[k], list) and len(d[k]) > 1:
                rows = d[k][1].get('row', [])
        if not rows:
            break
        all_members.extend(rows)
        print(f'  Page {page}: +{len(rows)} (total: {len(all_members)})')
        if len(rows) < 100:
            break
        page += 1

    save('legislators.json', {
        'source': 'open.assembly.go.kr',
        'endpoint': 'nwvrqwxyaytdsfvhu',
        'fetched_at': now_iso(),
        'totalCount': len(all_members),
        'items': all_members,
    })
    print(f'  ✅ {len(all_members)} legislators')


def fetch_bills():
    print('\n📜 열린국회정보 — 법안 목록 (22대)')
    ASSEMBLY_BASE = 'https://open.assembly.go.kr/portal/openapi/nzmimeepazxkubdpn'

    def _extract_rows(d):
        for k in d:
            if isinstance(d[k], list) and len(d[k]) > 1:
                return d[k][1].get('row', [])
        return []

    def _fetch_bill_page(page):
        url = (
            f'{ASSEMBLY_BASE}'
            f'?KEY={ASSEMBLY_KEY}&Type=json&pIndex={page}&pSize=100&AGE=22'
        )
        try:
            d = fetch_json(url)
            return page, _extract_rows(d)
        except Exception:
            return page, []

    # Page 1 first — get initial rows and totalCount
    url_p1 = f'{ASSEMBLY_BASE}?KEY={ASSEMBLY_KEY}&Type=json&pIndex=1&pSize=100&AGE=22'
    d1 = fetch_json(url_p1)
    rows_p1 = _extract_rows(d1)
    # Assembly API wraps totalCount in the first element of each key's list
    total_count = 0
    for k in d1:
        if isinstance(d1[k], list) and len(d1[k]) > 0:
            tc = d1[k][0].get('list_total_count', 0)
            if tc:
                total_count = int(tc)
                break
    total_pages = min(200, (total_count + 99) // 100) if total_count else 200

    all_bills = list(rows_p1)
    print(f'  Page 1: {len(rows_p1)} rows, totalCount={total_count}, pages={total_pages}')

    if total_pages > 1 and len(rows_p1) == 100:
        results = {}
        with ThreadPoolExecutor(max_workers=10) as pool:
            futs = {pool.submit(_fetch_bill_page, p): p for p in range(2, total_pages + 1)}
            for fut in as_completed(futs):
                page, rows = fut.result()
                results[page] = rows
        for p in sorted(results):
            rows = results[p]
            if rows:
                all_bills.extend(rows)
                if p % 25 == 0:
                    print(f'  Page {p}: total {len(all_bills)}')

    save('bills.json', {
        'source': 'open.assembly.go.kr',
        'endpoint': 'nzmimeepazxkubdpn',
        'fetched_at': now_iso(),
        'totalCount': len(all_bills),
        'items': all_bills,
    })
    print(f'  ✅ {len(all_bills)} bills')


def fetch_bill_vote_results():
    """열린국회정보 — 본회의 의결 결과 (22대)"""
    print('\n🗳️  본회의 의결 결과 (22대)')
    ENDPOINT = 'https://open.assembly.go.kr/portal/openapi/nwbpacrgavhjryiph'

    def _fetch_page(page):
        url = f'{ENDPOINT}?KEY={ASSEMBLY_KEY}&Type=json&pIndex={page}&pSize=100&AGE=22'
        try:
            d = fetch_json(url)
            for k in d:
                if isinstance(d[k], list) and len(d[k]) > 1:
                    return page, d[k][1].get('row', [])
            return page, []
        except Exception:
            return page, []

    # Page 1 first
    _, rows_p1 = _fetch_page(1)
    if not rows_p1:
        print('  ⚠️  No data returned')
        return

    all_rows = list(rows_p1)
    print(f'  Page 1: {len(rows_p1)} rows')

    # Paginate until empty (no list_total_count available)
    page = 2
    while len(rows_p1) == 100:
        results = {}
        with ThreadPoolExecutor(max_workers=10) as pool:
            futs = {pool.submit(_fetch_page, p): p for p in range(page, page + 10)}
            for fut in as_completed(futs):
                p, rows = fut.result()
                results[p] = rows
        new_rows = []
        for p in sorted(results):
            if results[p]:
                new_rows.extend(results[p])
            else:
                break
        if not new_rows:
            break
        all_rows.extend(new_rows)
        rows_p1 = results.get(page, [])  # update to check if last batch was full
        page += 10
        print(f'  Total so far: {len(all_rows)}')
        if len(new_rows) < 10 * 100:  # less than full batch means we hit the end
            break

    save('bill-vote-results.json', {
        'source': 'open.assembly.go.kr',
        'endpoint': 'nwbpacrgavhjryiph',
        'description': '22대 국회 본회의 의결 결과',
        'fetched_at': now_iso(),
        'totalCount': len(all_rows),
        'items': all_rows,
    })
    print(f'  ✅ {len(all_rows)} bill vote records')


def fetch_ecos():
    print('\n📊 한국은행 ECOS — 경제지표')
    url = f'https://ecos.bok.or.kr/api/KeyStatisticList/{ECOS_KEY}/json/kr/1/200'
    d = fetch_json(url)
    rows = d.get('KeyStatisticList', {}).get('row', [])
    total = d.get('KeyStatisticList', {}).get('list_total_count', 0)

    save('ecos-stats.json', {
        'source': 'ecos.bok.or.kr',
        'endpoint': 'KeyStatisticList',
        'fetched_at': now_iso(),
        'totalCount': total,
        'items': rows,
    })
    print(f'  ✅ {len(rows)} indicators')


def fetch_g2b_bids():
    print('\n🏗️  나라장터 — 입찰공고 (전체)')
    base_url = (
        f'https://apis.data.go.kr/1230000/ao/PubDataOpnStdService'
        f'/getDataSetOpnStdBidPblancInfo?serviceKey={DATA_GO_KR_KEY}'
        f'&numOfRows=100&pageNo={{PAGE}}&type=json'
    )
    all_items = fetch_koneps_pages(base_url, max_pages=150)

    save('g2b-contracts.json', {
        'source': 'data.go.kr',
        'endpoint': 'getDataSetOpnStdBidPblancInfo',
        'fetched_at': now_iso(),
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} bid announcements')


def fetch_g2b_contracts():
    print('\n📝 나라장터 — 계약정보 (전체)')
    base_url = (
        f'https://apis.data.go.kr/1230000/ao/PubDataOpnStdService'
        f'/getDataSetOpnStdCntrctInfo?serviceKey={DATA_GO_KR_KEY}'
        f'&numOfRows=100&pageNo={{PAGE}}&type=json'
    )
    all_items = fetch_koneps_pages(base_url, max_pages=400)

    if all_items:
        save('g2b-actual-contracts.json', {
            'source': 'data.go.kr',
            'endpoint': 'getDataSetOpnStdCntrctInfo',
            'fetched_at': now_iso(),
            'totalCount': len(all_items),
            'items': all_items,
        })
    print(f'  ✅ {len(all_items)} contracts')


def fetch_g2b_companies():
    print('\n🏢 나라장터 — 조달업체 기본정보')
    # Extract unique bizno values from existing bid/contract data
    biznos = set()
    for fname in ['g2b-actual-contracts.json', 'g2b-contracts.json']:
        fpath = DATA_DIR / fname
        if fpath.exists():
            with open(fpath, encoding='utf-8') as f:
                data = json.load(f)
            for item in data.get('items', []):
                for key in ['rprsntCorpBizrno', 'bidwinrBizno', 'cntrctorBizno']:
                    bz = str(item.get(key, '')).strip().replace('-', '')
                    if bz and len(bz) == 10 and bz.isdigit():
                        biznos.add(bz)
    print(f'  Found {len(biznos)} unique bizno values from existing data')

    target_biznos = sorted(biznos)[:3000]

    def _lookup(bizno):
        url = (
            f'https://apis.data.go.kr/1230000/ao/UsrInfoService02'
            f'/getPrcrmntCorpBasicInfo02?serviceKey={DATA_GO_KR_KEY}'
            f'&bizno={bizno}&inqryDiv=3&numOfRows=1&pageNo=1&type=json'
        )
        try:
            d = fetch_json(url)
            body = d.get('response', {}).get('body', {})
            items = body.get('items', [])
            if not isinstance(items, list):
                items = [items] if items else []
            return items
        except Exception:
            return []

    all_corps = []
    done = 0
    with ThreadPoolExecutor(max_workers=10) as pool:
        futs = {pool.submit(_lookup, bz): bz for bz in target_biznos}
        for fut in as_completed(futs):
            all_corps.extend(fut.result())
            done += 1
            if done % 200 == 0:
                print(f'  Queried {done}/{len(target_biznos)}')

    save('g2b-companies.json', {
        'source': 'data.go.kr',
        'endpoint': 'getPrcrmntCorpBasicInfo02',
        'fetched_at': now_iso(),
        'totalCount': len(all_corps),
        'items': all_corps,
    })
    print(f'  ✅ {len(all_corps)} company profiles')


def fetch_g2b_sanctions():
    """부정당제재업체 — try multiple query approaches"""
    print('\n🚫 나라장터 — 부정당제재업체')
    all_items = []

    # Strategy 1: getUnptRsttCorpInfo02 inqryDiv=1 with date range (month by month)
    def _fetch_sanctions_month(args):
        start, end = args
        url = (
            f'https://apis.data.go.kr/1230000/ao/UsrInfoService02'
            f'/getUnptRsttCorpInfo02?serviceKey={DATA_GO_KR_KEY}'
            f'&inqryDiv=1&inqryBgnDt={start}&inqryEndDt={end}'
            f'&numOfRows=100&pageNo=1&type=json'
        )
        try:
            req = urllib.request.Request(url, headers={
                'Accept': 'application/json',
                'User-Agent': 'GukjeongTumyeong/fetch-data',
            })
            resp = urllib.request.urlopen(req, timeout=60, context=ctx)
            raw = resp.read().decode('utf-8')
            d = json.loads(raw)
            body = d.get('response', {}).get('body', {})
            items = body.get('items', [])
            if not isinstance(items, list):
                items = [items] if items else []
            return items
        except Exception:
            return []

    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = [pool.submit(_fetch_sanctions_month, r) for r in koneps_month_ranges(36)]
        for fut in as_completed(futs):
            all_items.extend(fut.result())
    strategy1_count = len(all_items)
    print(f'  Strategy 1 getUnptRsttCorpInfo02 inqryDiv=1 (월별): {strategy1_count}건')

    # Strategy 2: getUnptRsttCorpInfo02 inqryDiv=3 (no date, all records)
    tmpl = (
        f'https://apis.data.go.kr/1230000/ao/UsrInfoService02'
        f'/getUnptRsttCorpInfo02?serviceKey={{KEY}}'
        f'&inqryDiv=3&numOfRows=100&pageNo={{PAGE}}&type=json'
    )

    def _fetch_sanctions_page(page):
        url = tmpl.format(KEY=DATA_GO_KR_KEY, PAGE=page)
        try:
            req = urllib.request.Request(url, headers={
                'Accept': 'application/json',
                'User-Agent': 'GukjeongTumyeong/fetch-data',
            })
            resp = urllib.request.urlopen(req, timeout=60, context=ctx)
            d = json.loads(resp.read().decode('utf-8'))
            body = d.get('response', {}).get('body', {})
            items = body.get('items', [])
            if not isinstance(items, list):
                items = [items] if items else []
            total = int(body.get('totalCount', 0))
            return items, total
        except Exception:
            return [], 0

    p1_items, total = _fetch_sanctions_page(1)
    if p1_items:
        all_items.extend(p1_items)
        total_pages = min(50, (total + 99) // 100)
        if total_pages > 1:
            with ThreadPoolExecutor(max_workers=4) as pool:
                futs = {pool.submit(_fetch_sanctions_page, p): p for p in range(2, total_pages + 1)}
                for fut in as_completed(futs):
                    items, _ = fut.result()
                    all_items.extend(items)
    strategy2_count = len(all_items) - strategy1_count
    print(f'  Strategy 2 getUnptRsttCorpInfo02 inqryDiv=3 (전체): +{strategy2_count}건 (total reported: {total})')

    # Strategy 3: getUnptRsttCorpInfo (without "02" suffix) — alternative method name
    strategy3_count_before = len(all_items)
    try:
        debug_url = (
            f'https://apis.data.go.kr/1230000/ao/UsrInfoService02'
            f'/getUnptRsttCorpInfo?serviceKey={DATA_GO_KR_KEY}'
            f'&numOfRows=100&pageNo=1&type=json'
        )
        req3 = urllib.request.Request(debug_url, headers={
            'Accept': 'application/json',
            'User-Agent': 'GukjeongTumyeong/fetch-data',
        })
        resp3 = urllib.request.urlopen(req3, timeout=60, context=ctx)
        raw3 = resp3.read().decode('utf-8')
        print(f'  [DEBUG] getUnptRsttCorpInfo raw response (first 500 chars): {raw3[:500]}')
        d3 = json.loads(raw3)
        body3 = d3.get('response', {}).get('body', {})
        items3 = body3.get('items', [])
        if not isinstance(items3, list):
            items3 = [items3] if items3 else []
        all_items.extend(items3)
        print(f'  Strategy 3 getUnptRsttCorpInfo (no suffix): +{len(items3)}건')
    except Exception as e3:
        print(f'  Strategy 3 getUnptRsttCorpInfo (no suffix): error — {str(e3)[:100]}')

    # Strategy 4: inqryDiv=2
    try:
        url4 = (
            f'https://apis.data.go.kr/1230000/ao/UsrInfoService02'
            f'/getUnptRsttCorpInfo02?serviceKey={DATA_GO_KR_KEY}'
            f'&inqryDiv=2&numOfRows=100&pageNo=1&type=json'
        )
        req4 = urllib.request.Request(url4, headers={
            'Accept': 'application/json',
            'User-Agent': 'GukjeongTumyeong/fetch-data',
        })
        resp4 = urllib.request.urlopen(req4, timeout=60, context=ctx)
        raw4 = resp4.read().decode('utf-8')
        print(f'  [DEBUG] getUnptRsttCorpInfo02 inqryDiv=2 raw response (first 500 chars): {raw4[:500]}')
        d4 = json.loads(raw4)
        body4 = d4.get('response', {}).get('body', {})
        items4 = body4.get('items', [])
        if not isinstance(items4, list):
            items4 = [items4] if items4 else []
        all_items.extend(items4)
        print(f'  Strategy 4 inqryDiv=2: +{len(items4)}건')
    except Exception as e4:
        print(f'  Strategy 4 inqryDiv=2: error — {str(e4)[:100]}')

    print(f'  Summary: Strategy1={strategy1_count}, Strategy2={strategy2_count}, Strategy3/4 added separately above')

    # Deduplicate by bizno
    seen = set()
    unique = []
    for item in all_items:
        bz = str(item.get('bizno', item.get('rprsntCorpBizrno', '')))
        key = f"{bz}_{item.get('rsttBgnDate', '')}"
        if key not in seen:
            seen.add(key)
            unique.append(item)

    save('g2b-sanctions.json', {
        'source': 'data.go.kr',
        'endpoint': 'getUnptRsttCorpInfo02',
        'fetched_at': now_iso(),
        'totalCount': len(unique),
        'items': unique,
    })
    print(f'  ✅ {len(unique)} sanctioned companies')
    print("  ℹ️  부정당제재 데이터 없음 — data.go.kr에서 UsrInfoService02 구독 상태 확인 필요")
    print("     또는 현재 제재 업체가 없을 수 있음 (totalCount: 0 from server)")


def fetch_g2b_winning_bids():
    """낙찰정보서비스 — as/ScsbidInfoService (12개월 월별 조회, 월별 저장)"""
    print('\n🏆 나라장터 — 낙찰정보 (물품+공사+용역, 12개월)')
    month_ranges = koneps_month_ranges(12)

    def _fetch_month(args):
        mi, (start, end) = args
        month_label = f'{start[:4]}-{start[4:6]}'
        items = []
        for category, ep in [
            ('물품', 'getScsbidListSttusThng'),
            ('공사', 'getScsbidListSttusCnstwk'),
            ('용역', 'getScsbidListSttusServc'),
        ]:
            tmpl = (
                f'{G2B_BASE}/as/ScsbidInfoService/{ep}'
                f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
                f'&inqryDiv=1&inqryBgnDt={start}&inqryEndDt={end}'
            )
            items.extend(fetch_koneps_pages(tmpl, max_pages=100))
        return month_label, items

    all_items = []
    months_done = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(_fetch_month, (mi, r)): mi for mi, r in enumerate(month_ranges)}
        month_results = {}
        for fut in as_completed(futs):
            label, items = fut.result()
            month_results[label] = items
            months_done += 1
    for label in sorted(month_results, reverse=True):
        items = month_results[label]
        all_items.extend(items)
        if items:
            print(f'  {label}: {len(items)}건')

    if all_items:
        save('g2b-winning-bids.json', {
            'source': 'data.go.kr',
            'service': 'as/ScsbidInfoService',
            'fetched_at': now_iso(),
            'months_covered': months_done,
            'totalCount': len(all_items),
            'items': all_items,
        })
    print(f'  ✅ {len(all_items)} winning bids ({months_done}개월)')


def fetch_g2b_contract_details():
    """계약정보서비스 — ao/CntrctInfoService (12개월 월별 조회)"""
    print('\n📋 나라장터 — 계약정보 (물품+공사+용역, 12개월)')
    month_ranges = koneps_month_ranges(12)

    def _fetch_month(args):
        mi, (start, end) = args
        month_label = f'{start[:4]}-{start[4:6]}'
        items = []
        for category, ep in [
            ('물품', 'getCntrctInfoListThng'),
            ('공사', 'getCntrctInfoListCnstwk'),
            ('용역', 'getCntrctInfoListServc'),
        ]:
            tmpl = (
                f'{G2B_BASE}/ao/CntrctInfoService/{ep}'
                f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
                f'&inqryDiv=1&inqryBgnDt={start}&inqryEndDt={end}'
            )
            items.extend(fetch_koneps_pages(tmpl, max_pages=100))
        return month_label, items

    all_items = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(_fetch_month, (mi, r)): mi for mi, r in enumerate(month_ranges)}
        month_results = {}
        for fut in as_completed(futs):
            label, items = fut.result()
            month_results[label] = items
    for label in sorted(month_results, reverse=True):
        items = month_results[label]
        all_items.extend(items)
        if items:
            print(f'  {label}: {len(items)}건')

    save('g2b-contract-details.json', {
        'source': 'data.go.kr',
        'service': 'ao/CntrctInfoService',
        'fetched_at': now_iso(),
        'months_covered': 12,
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} contract details (12개월)')


def fetch_g2b_contract_process():
    """계약과정통합공개 — ao/CntrctProcssIntgOpenService (per-ntceNo lookup)

    이 API는 날짜 범위 쿼리를 지원하지 않음 — ntceNo(입찰공고번호)를 기본 키로 사용해야 함.
    g2b-contract-details.json 및 g2b-winning-bids.json에서 ntceNo를 추출하여
    ThreadPoolExecutor(max_workers=10)로 병렬 조회함.
    """
    print('\n🔄 나라장터 — 계약과정통합공개 (per-ntceNo lookup)')

    # 1. Load ntceNo values from g2b-contract-details.json
    ntce_records = {}  # ntceNo -> record (to get sort key)
    details_path = DATA_DIR / 'g2b-contract-details.json'
    if details_path.exists():
        with open(details_path, encoding='utf-8') as f:
            details_data = json.load(f)
        for item in details_data.get('items', []):
            ntce = str(item.get('ntceNo', '')).strip()
            if ntce:
                # Use thtmCntrctAmt (당해계약금액) as sort key; fallback to totCntrctAmt
                try:
                    amt = int(str(item.get('thtmCntrctAmt', item.get('totCntrctAmt', 0))).replace(',', '') or 0)
                except (ValueError, TypeError):
                    amt = 0
                if ntce not in ntce_records or amt > ntce_records[ntce]:
                    ntce_records[ntce] = amt
        print(f'  g2b-contract-details.json: {len(ntce_records)} unique ntceNo values')
    else:
        print('  ⚠️  g2b-contract-details.json not found — run contract-details first')

    # 2. Also load ntceNo values from g2b-winning-bids.json (bidNtceNo == ntceNo)
    winning_path = DATA_DIR / 'g2b-winning-bids.json'
    if winning_path.exists():
        with open(winning_path, encoding='utf-8') as f:
            winning_data = json.load(f)
        before = len(ntce_records)
        for item in winning_data.get('items', []):
            ntce = str(item.get('bidNtceNo', '')).strip()
            if ntce and ntce not in ntce_records:
                try:
                    amt = int(str(item.get('sucsfbidAmt', 0)).replace(',', '') or 0)
                except (ValueError, TypeError):
                    amt = 0
                ntce_records[ntce] = amt
        print(f'  g2b-winning-bids.json: +{len(ntce_records) - before} additional ntceNo values')

    # 3. Deduplicate + sort by amount descending, take top 5000
    sorted_ntces = sorted(ntce_records.keys(), key=lambda n: ntce_records[n], reverse=True)
    target_ntces = sorted_ntces[:5000]
    print(f'  Target: {len(target_ntces)} ntceNo values (top by contract amount)')

    if not target_ntces:
        print('  ⚠️  No ntceNo values found — skipping')
        save('g2b-contract-process.json', {
            'source': 'data.go.kr',
            'service': 'ao/CntrctProcssIntgOpenService',
            'fetched_at': now_iso(),
            'totalCount': 0,
            'items': [],
        })
        return

    # 4. Per-ntceNo lookup using getCntrctProcssIntgOpenThng (물품 endpoint covers majority)
    def _lookup(ntce_no):
        url = (
            f'{G2B_BASE}/ao/CntrctProcssIntgOpenService/getCntrctProcssIntgOpenThng'
            f'?serviceKey={DATA_GO_KR_KEY}&numOfRows=10&pageNo=1&type=json'
            f'&inqryDiv=1&ntceNo={ntce_no}'
        )
        try:
            d = fetch_json(url)
            body = d.get('response', {}).get('body', {})
            items = body.get('items', [])
            if not isinstance(items, list):
                items = [items] if items else []
            return items
        except Exception:
            return []

    # 5. ThreadPoolExecutor(max_workers=10) — same pattern as fetch_g2b_companies
    all_items = []
    done = 0
    with ThreadPoolExecutor(max_workers=10) as pool:
        futs = {pool.submit(_lookup, ntce): ntce for ntce in target_ntces}
        for fut in as_completed(futs):
            all_items.extend(fut.result())
            done += 1
            if done % 500 == 0:
                print(f'  Queried {done}/{len(target_ntces)} ntceNo values ({len(all_items)} records collected)')

    print(f'  Total collected: {len(all_items)} records from {len(target_ntces)} ntceNo lookups')
    if all_items:
        sample = all_items[0]
        sample_keys = list(sample.keys())[:5]
        print(f'  Sample record keys: {sample_keys}')
        print(f'  Sample ntceNo: {sample.get("ntceNo", sample.get("bidNtceNo", "N/A"))}')

    save('g2b-contract-process.json', {
        'source': 'data.go.kr',
        'service': 'ao/CntrctProcssIntgOpenService',
        'fetched_at': now_iso(),
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} contract process records')


def fetch_g2b_prices():
    """가격정보현황서비스 — ao/PriceInfoService"""
    print('\n💰 나라장터 — 가격정보')
    all_items = []
    for category, ep in [
        ('시설공통자재(토목)', 'getPriceInfoListFcltyCmmnMtrilEngrk'),
        ('시설공통자재(건축)', 'getPriceInfoListFcltyCmmnMtrilBildng'),
        ('시설공통자재(기계)', 'getPriceInfoListFcltyCmmnMtrilMchnEqp'),
        ('시설공통자재(전기)', 'getPriceInfoListFcltyCmmnMtrilElctyIrmc'),
    ]:
        tmpl = (
            f'{G2B_BASE}/ao/PriceInfoService/{ep}'
            f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
        )
        items = fetch_koneps_pages(tmpl, max_pages=5)
        all_items.extend(items)
        print(f'  {category}: {len(items)}건')

    save('g2b-prices.json', {
        'source': 'data.go.kr',
        'service': 'ao/PriceInfoService',
        'fetched_at': now_iso(),
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} price records')


def fetch_procurement_stats():
    """공공조달통계정보서비스 — at/PubPrcrmntStatInfoService (다년도)"""
    print('\n📊 공공조달통계 (2020-2025)')
    now = datetime.now()
    all_data = {'total': [], 'by_method': [], 'by_enterprise': []}

    # Build list of all (year, endpoint_name, url) tasks
    tasks = []
    for year in range(2020, now.year + 1):
        ym_start = f'{year}01'
        ym_end = f'{year}12'
        tasks.append((year, 'total', (
            f'{G2B_BASE}/at/PubPrcrmntStatInfoService/getTotlPubPrcrmntSttus'
            f'?serviceKey={DATA_GO_KR_KEY}&numOfRows=100&pageNo=1&type=json'
            f'&srchBssYear={year}'
        )))
        tasks.append((year, 'by_method', (
            f'{G2B_BASE}/at/PubPrcrmntStatInfoService/getCntrctMthdAccotSttus'
            f'?serviceKey={DATA_GO_KR_KEY}&numOfRows=100&pageNo=1&type=json'
            f'&srchBssYmBgn={ym_start}&srchBssYmEnd={ym_end}'
        )))
        tasks.append((year, 'by_enterprise', (
            f'{G2B_BASE}/at/PubPrcrmntStatInfoService/getEntrprsDivAccotPrcrmntSttus'
            f'?serviceKey={DATA_GO_KR_KEY}&numOfRows=100&pageNo=1&type=json'
            f'&srchBssYmBgn={ym_start}&srchBssYmEnd={ym_end}'
        )))

    def _fetch_stat(task):
        year, endpoint_name, url = task
        try:
            d = fetch_json(url)
            items = d.get('response', {}).get('body', {}).get('items', [])
            if not isinstance(items, list):
                items = [items] if items else []
            return year, endpoint_name, items
        except Exception:
            return year, endpoint_name, []

    results = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        futs = {pool.submit(_fetch_stat, task): task for task in tasks}
        for fut in as_completed(futs):
            results.append(fut.result())

    # Assemble into output structure in sorted order
    results.sort(key=lambda r: (r[0], r[1]))
    for year, endpoint_name, items in results:
        all_data[endpoint_name].extend(items)
        if items:
            label_map = {'total': '총괄', 'by_method': '계약방법별', 'by_enterprise': '기업구분별'}
            print(f'  {year} {label_map.get(endpoint_name, endpoint_name)}: {len(items)}건')

    save('procurement-stats.json', {
        'source': 'data.go.kr',
        'service': 'at/PubPrcrmntStatInfoService',
        'fetched_at': now_iso(),
        'years': '2020-2025',
        'data': all_data,
    })
    total = sum(len(v) for v in all_data.values())
    print(f'  ✅ {total} stat records')


def fetch_official_assets():
    """공직자 재산공개 — 행정안전부 ApiPetyService"""
    print('\n👔 공직자 재산공개 (관보)')
    now = datetime.now()
    req_from = f'{now.year - 3}0101'  # 3 years of data
    req_to = now.strftime('%Y%m%d')

    all_items = []
    page = 1
    while page <= 50:  # expanded from 10
        url = (
            f'https://apis.data.go.kr/1741000/ApiPetyService/getApiPetyList'
            f'?serviceKey={DATA_GO_KR_KEY}&pageNo={page}&pageSize=100'
            f'&reqFrom={req_from}&reqTo={req_to}&type=1'
        )
        d = fetch_json(url)
        resp = d.get('response', {})
        items = resp.get('items', {}).get('item', [])
        if not isinstance(items, list):
            items = [items] if items else []
        if not items:
            break
        all_items.extend(items)
        total = int(resp.get('totalCount', 0))
        if len(all_items) >= total or len(items) < 100:
            break
        page += 1

    save('official-assets.json', {
        'source': 'data.go.kr',
        'service': 'ApiPetyService',
        'fetched_at': now_iso(),
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} asset disclosure records')


def fetch_political_funding():
    """OhmyNews/KA-money — 22대 국회의원 정치자금 수입지출 공개 데이터"""
    print('\n💰 정치자금 수입지출 (OhmyNews/KA-money)')

    # expenditure detail file (70k+ rows: date, description, amount, recipient, category per member)
    xlsx_url = 'https://raw.githubusercontent.com/OhmyNews/KA-money/master/2024_KAPF-22.xlsx'

    try:
        import openpyxl
        from io import BytesIO
    except ImportError:
        print('  ⚠️  openpyxl 미설치 — pip install openpyxl 후 재실행')
        return

    req = urllib.request.Request(xlsx_url, headers={
        'User-Agent': 'GukjeongTumyeong/fetch-data',
    })
    ctx_dl = ssl.create_default_context()
    ctx_dl.check_hostname = False
    ctx_dl.verify_mode = ssl.CERT_NONE
    resp = urllib.request.urlopen(req, timeout=30, context=ctx_dl)
    raw_bytes = resp.read()
    print(f'  Downloaded: {len(raw_bytes):,} bytes')

    wb = openpyxl.load_workbook(BytesIO(raw_bytes), read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        print('  ⚠️  빈 시트')
        return

    # First row = headers
    headers = [str(h).strip() if h else f'col_{i}' for i, h in enumerate(rows[0])]
    records = []
    for row in rows[1:]:
        if all(v is None for v in row):
            continue
        rec = {}
        for h, v in zip(headers, row):
            if v is not None:
                rec[h] = str(v) if not isinstance(v, (int, float)) else v
        records.append(rec)

    save('political-funding.json', {
        'source': 'github.com/OhmyNews/KA-money',
        'description': '22대 국회의원 정치자금 수입지출 내역',
        'fetched_at': now_iso(),
        'totalCount': len(records),
        'headers': headers,
        'items': records,
    })
    print(f'  ✅ {len(records)} 정치자금 records')


def fetch_news():
    print('\n📰 뉴스 RSS 피드')
    feeds = [
        ('hankyoreh', '한겨레', 'https://www.hani.co.kr/rss/', 1.2, 'progressive'),
        ('khan', '경향신문', 'https://www.khan.co.kr/rss/rssdata/total_news.xml', 1.5, 'progressive'),
        ('donga', '동아일보', 'https://rss.donga.com/total.xml', 4.0, 'conservative'),
        ('sbs', 'SBS', 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=RSSREADER', 2.8, 'center'),
        ('jtbc', 'JTBC', 'https://fs.jtbc.co.kr/RSS/newsflash.xml', 2.2, 'progressive'),
        ('segye', '세계일보', 'https://www.segye.com/Articles/RSSList/segye_recent.xml', 3.2, 'conservative'),
    ]

    def extract_tag(xml, tag):
        m = re.search(rf'<{tag}[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*</{tag}>', xml, re.I)
        if m:
            return m.group(1).strip()
        m = re.search(rf'<{tag}[^>]*>([\s\S]*?)</{tag}>', xml, re.I)
        return m.group(1).strip() if m else ''

    def _fetch_feed(feed):
        fid, fname, url, spectrum, cat = feed
        try:
            text = fetch_text(url)
            items_xml = re.findall(r'<item>([\s\S]*?)</item>', text, re.I)
            articles = []
            for ix in items_xml:
                articles.append({
                    'outlet_id': fid,
                    'outlet_name': fname,
                    'title': extract_tag(ix, 'title'),
                    'link': extract_tag(ix, 'link'),
                    'pubDate': extract_tag(ix, 'pubDate'),
                    'description': extract_tag(ix, 'description')[:200],
                    'spectrum_score': spectrum,
                    'category': cat,
                })
            print(f'  ✅ {fname}: {len(items_xml)} articles')
            return articles
        except Exception as e:
            print(f'  ❌ {fname}: {str(e)[:60]}')
            return []

    all_articles = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        futs = {pool.submit(_fetch_feed, feed): feed for feed in feeds}
        for fut in as_completed(futs):
            all_articles.extend(fut.result())

    all_articles.sort(key=lambda a: a.get('pubDate', ''), reverse=True)

    save('news-rss.json', {
        'source': 'RSS feeds',
        'outlets': len(feeds),
        'fetched_at': now_iso(),
        'totalCount': len(all_articles),
        'items': all_articles,
    })
    print(f'  ✅ {len(all_articles)} total articles')


def fetch_g2b_bid_rankings():
    """개찰결과 — ALL bidders per bid, not just winner (bid rigging detection)"""
    print('\n🏅 나라장터 — 개찰결과/입찰순위 (12개월)')
    month_ranges = koneps_month_ranges(12)

    def _fetch_month(args):
        mi, (start, end) = args
        month_label = f'{start[:4]}-{start[4:6]}'
        items = []
        for category, ep in [
            ('물품', 'getOpengResultListInfoThng'),
            ('공사', 'getOpengResultListInfoCnstwk'),
            ('용역', 'getOpengResultListInfoServc'),
        ]:
            tmpl = (
                f'{G2B_BASE}/as/ScsbidInfoService/{ep}'
                f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
                f'&inqryDiv=1&inqryBgnDt={start}&inqryEndDt={end}'
            )
            items.extend(fetch_koneps_pages(tmpl, max_pages=100))
        return month_label, items

    all_items = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(_fetch_month, (mi, r)): mi for mi, r in enumerate(month_ranges)}
        month_results = {}
        for fut in as_completed(futs):
            label, items = fut.result()
            month_results[label] = items
    for label in sorted(month_results, reverse=True):
        items = month_results[label]
        all_items.extend(items)
        if items:
            print(f'  {label}: {len(items)}건')

    save('g2b-bid-rankings.json', {
        'source': 'data.go.kr',
        'service': 'as/ScsbidInfoService (개찰결과)',
        'fetched_at': now_iso(),
        'months_covered': 12,
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} bid ranking records (12개월)')


def fetch_g2b_contract_changes():
    """계약변경이력 — contract amendments (corruption detection)"""
    import calendar
    print('\n📝 나라장터 — 계약변경이력 (12개월)')
    # This API requires end date = last day of month (not first of next month)
    # Data is available from ~2025, not 2026 — so go back 24 months
    now = datetime.now()

    def _fetch_month(i):
        y = now.year - ((now.month - 1 - i) < 0)
        m = ((now.month - 1 - i) % 12) + 1
        last_day = calendar.monthrange(y, m)[1]
        start = f'{y:04d}{m:02d}010000'
        end = now.strftime('%Y%m%d2359') if (y == now.year and m == now.month) else f'{y:04d}{m:02d}{last_day:02d}2359'
        month_label = f'{y:04d}-{m:02d}'
        items = []
        for category, ep in [
            ('물품변경', 'getCntrctInfoListThngChgHstry'),
            ('공사변경', 'getCntrctInfoListCnstwkChgHstry'),
            ('용역변경', 'getCntrctInfoListServcChgHstry'),
        ]:
            tmpl = (
                f'{G2B_BASE}/ao/CntrctInfoService/{ep}'
                f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
                f'&inqryDiv=1&inqryBgnDt={start}&inqryEndDt={end}'
            )
            items.extend(fetch_koneps_pages(tmpl, max_pages=10))
        return month_label, items

    all_items = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(_fetch_month, i): i for i in range(24)}
        month_results = {}
        for fut in as_completed(futs):
            label, items = fut.result()
            month_results[label] = items
    for label in sorted(month_results, reverse=True):
        items = month_results[label]
        all_items.extend(items)
        if items:
            print(f'  {label}: {len(items)}건')

    save('g2b-contract-changes.json', {
        'source': 'data.go.kr',
        'service': 'ao/CntrctInfoService (변경이력)',
        'fetched_at': now_iso(),
        'months_covered': 12,
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} contract change records (12개월)')


def fetch_historical_bids():
    """낙찰정보 2년 이전 이력 — as/ScsbidInfoService (13-36개월 전, 구독 불필요)

    amount_spike 패턴의 정확도를 높이기 위한 2023-2024년 과거 데이터.
    최초 1회만 실행하면 됩니다 (g2b-winning-bids-historical.json 생성).
    현재 g2b-winning-bids.json은 최근 12개월만 포함.
    """
    print('\n📦 나라장터 — 과거 낙찰정보 (13-36개월, 2023-2025년)')
    # Months 13 through 36 ago = 2 additional years of history
    month_ranges = koneps_month_ranges(36)[12:]  # skip first 12 (already in winning-bids)

    def _fetch_month(args):
        mi, (start, end) = args
        month_label = f'{start[:4]}-{start[4:6]}'
        items = []
        for category, ep in [
            ('물품', 'getScsbidListSttusThng'),
            ('공사', 'getScsbidListSttusCnstwk'),
            ('용역', 'getScsbidListSttusServc'),
        ]:
            tmpl = (
                f'{G2B_BASE}/as/ScsbidInfoService/{ep}'
                f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
                f'&inqryDiv=1&inqryBgnDt={start}&inqryEndDt={end}'
            )
            try:
                items.extend(fetch_koneps_pages(tmpl, max_pages=100))
            except Exception as e:
                print(f'  ⚠️  {month_label} {category} 중단: {e}')
        return month_label, items

    all_items = []
    months_done = 0
    month_results = {}
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(_fetch_month, (mi, r)): mi for mi, r in enumerate(month_ranges)}
        for fut in as_completed(futs):
            label, items = fut.result()
            month_results[label] = items
            months_done += 1
    for label in sorted(month_results, reverse=True):
        items = month_results[label]
        all_items.extend(items)
        if items:
            print(f'  {label}: {len(items)}건')

    if all_items:
        save('g2b-winning-bids-historical.json', {
            'source': 'data.go.kr',
            'service': 'as/ScsbidInfoService',
            'fetched_at': now_iso(),
            'note': '2년 이전 과거 데이터 (months 13-36). amount_spike 연도별 비교용.',
            'months_covered': months_done,
            'totalCount': len(all_items),
            'items': all_items,
        })
        print(f'  ✅ {len(all_items)} 과거 낙찰 이력 (최근 {months_done}개월 전 데이터)')
    else:
        print(f'  ⚠️  수집된 데이터 없음')


def fetch_targeted_companies():
    """감사 결과에 등장하는 업체만 집중 조회 — 유령업체·신생업체·관계사 패턴 정밀화

    g2b-companies.json은 현재 50,503개 bizno 중 1,647개만 커버.
    audit-results.json에 등장하는 3,579개 업체를 추출해 bizno를 매핑한 후
    미확보 프로필만 선택적으로 조회합니다 (~1,500 API 호출).
    """
    print('\n🎯 감사 결과 업체 집중 조회 (targeted company lookup)')

    # Step 1: Collect vendor names from audit findings
    audit_file = Path(__file__).parent.parent / 'apps' / 'web' / 'public' / 'data' / 'audit-results.json'
    if not audit_file.exists():
        print('  ⚠️  audit-results.json 없음 — generate-audit.py 먼저 실행하세요')
        return
    with open(audit_file, encoding='utf-8') as f:
        audit = json.load(f)
    finding_vendors: set[str] = set()
    for finding in audit.get('findings', []):
        for c in finding.get('evidence_contracts', []):
            v = str(c.get('vendor', '')).strip()
            if v:
                finding_vendors.add(v)
    print(f'  감사 등장 업체: {len(finding_vendors)}개')

    # Step 2: Resolve vendor names -> bizno from existing raw data
    name_to_bizno: dict[str, str] = {}
    for fname in ['g2b-winning-bids.json', 'g2b-actual-contracts.json', 'g2b-contract-details.json']:
        fpath = DATA_DIR / fname
        if not fpath.exists():
            continue
        with open(fpath, encoding='utf-8') as f:
            data = json.load(f)
        for item in data.get('items', []):
            for nm_key, bz_key in [
                ('bidwinnrNm', 'bidwinnrBizno'),
                ('cntrctorNm', 'cntrctorBizno'),
                ('bidwinnrNm', 'bidwinnrBizno'),
            ]:
                nm = str(item.get(nm_key, '')).strip()
                bz = str(item.get(bz_key, '')).strip().replace('-', '')
                if nm and bz and len(bz) == 10 and bz.isdigit():
                    name_to_bizno[nm] = bz

    matched = {v: name_to_bizno[v] for v in finding_vendors if v in name_to_bizno}
    print(f'  Bizno 매핑 성공: {len(matched)}/{len(finding_vendors)}개')

    # Step 3: Only fetch profiles we don't already have
    companies_path = DATA_DIR / 'g2b-companies.json'
    if companies_path.exists():
        with open(companies_path, encoding='utf-8') as f:
            existing_companies = json.load(f)
    else:
        existing_companies = {'items': []}
    have_biznos = {str(c.get('bizno', '')).strip() for c in existing_companies.get('items', [])}
    new_biznos = sorted({bz for bz in matched.values() if bz not in have_biznos})
    print(f'  신규 조회 대상: {len(new_biznos)}개 bizno')

    if not new_biznos:
        print('  ✅ 이미 모두 조회됨')
        return

    def _lookup(bizno):
        url = (
            f'https://apis.data.go.kr/1230000/ao/UsrInfoService02'
            f'/getPrcrmntCorpBasicInfo02?serviceKey={DATA_GO_KR_KEY}'
            f'&bizno={bizno}&inqryDiv=3&numOfRows=1&pageNo=1&type=json'
        )
        try:
            d = fetch_json(url)
            body = d.get('response', {}).get('body', {})
            items = body.get('items', [])
            if not isinstance(items, list):
                items = [items] if items else []
            return items
        except Exception:
            return []

    new_corps = []
    done = 0
    with ThreadPoolExecutor(max_workers=10) as pool:
        futs = {pool.submit(_lookup, bz): bz for bz in new_biznos}
        for fut in as_completed(futs):
            new_corps.extend(fut.result())
            done += 1
            if done % 300 == 0:
                print(f'  조회 {done}/{len(new_biznos)} (확보 {len(new_corps)}개)')

    # Merge with existing
    merged = existing_companies.get('items', []) + new_corps
    # Deduplicate by bizno
    seen_bz: set[str] = set()
    unique: list = []
    for c in merged:
        bz = str(c.get('bizno', '')).strip()
        if bz not in seen_bz:
            seen_bz.add(bz)
            unique.append(c)

    save('g2b-companies.json', {
        'source': 'data.go.kr',
        'endpoint': 'getPrcrmntCorpBasicInfo02 (targeted)',
        'fetched_at': now_iso(),
        'totalCount': len(unique),
        'items': unique,
    })
    print(f'  ✅ {len(new_corps)}개 신규 프로필 추가 (총 {len(unique)}개)')


def fetch_shopping_mall_prices():
    """종합쇼핑몰 품목정보 — MltiSpcPrdctInfoService

    ⚠️  이 API는 별도 구독이 필요합니다:
        data.go.kr → "조달청_종합쇼핑몰 품목정보 서비스" 신청
        (동일 API 키 사용 가능)

    품목별 표준 단가 데이터를 가져와 price_vs_catalog 감사 패턴에 사용됩니다.
    """
    print('\n🛒 종합쇼핑몰 — 품목정보 (표준단가)')

    # Candidate endpoints under MltiSpcPrdctInfoService
    # (exact method name depends on 조달청 API specification)
    CANDIDATE_METHODS = [
        'getMltiSpcPrdctInfoList',
        'getMltiSpcPrdctList',
        'getShpngMallPrdctInfoList',
        'getPrdctInfoList',
    ]

    all_items = []
    used_method = None

    for method in CANDIDATE_METHODS:
        tmpl = (
            f'https://apis.data.go.kr/1230000/MltiSpcPrdctInfoService/{method}'
            f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
        )
        try:
            items = fetch_koneps_pages(tmpl, max_pages=3, label=method)
            if items:
                used_method = method
                all_items.extend(items)
                break
        except Exception as e:
            err = str(e)
            if '500' in err or 'Unexpected' in err:
                # API exists but key not subscribed — tell the user
                print(f'  ⚠️  API 구독 필요: data.go.kr에서 "조달청_종합쇼핑몰 품목정보 서비스" 신청하세요')
                print(f'     (현재 API 키로 구독 후 재실행하면 됩니다)')
                return
            # 404 = method name wrong, try next
            continue

    if not all_items:
        print(f'  ⚠️  모든 endpoint 시도 실패. API 구독 필요 또는 endpoint 명칭 변경')
        return

    # If first page worked, fetch the rest (category-by-category if API supports it)
    # Try fetching by major product categories for better coverage
    MAJOR_CATEGORIES = [
        ('소프트웨어', '소프트웨어'),
        ('IT기기', 'IT·전자기기'),
        ('사무용품', '사무용품·소모품'),
        ('청소용품', '청소·환경미화'),
        ('경비보안', '경비·보안'),
        ('급식', '식품·급식'),
        ('의료', '의료·방역'),
    ]

    tmpl_base = (
        f'https://apis.data.go.kr/1230000/MltiSpcPrdctInfoService/{used_method}'
        f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
    )

    # Get all pages from the base query (already started above)
    # Re-fetch properly with full pagination
    all_items = []
    tmpl_full = tmpl_base + '&numOfRows=100&pageNo={PAGE}'
    try:
        items = fetch_koneps_pages(tmpl_base, max_pages=200, label='전체')
        all_items.extend(items)
        print(f'  전체: {len(items)}건')
    except Exception as e:
        print(f'  ⚠️  전체 조회 실패: {e}')

    if not all_items:
        print(f'  ⚠️  0건 수집됨')
        return

    save('g2b-shopping-mall.json', {
        'source': 'data.go.kr',
        'service': f'MltiSpcPrdctInfoService/{used_method}',
        'fetched_at': now_iso(),
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} 종합쇼핑몰 품목 가격 레코드')

    # Print sample fields for debugging
    if all_items:
        print(f'  📋 필드: {list(all_items[0].keys())[:8]}')


def fetch_dapa_bids(output_dir=None):
    """방위사업청 낙찰결과 — 1230000/ScsbidInfoService (12개월 월별)"""
    print('\n🛡️  방위사업청 — 낙찰결과 (12개월)')
    month_ranges = koneps_month_ranges(12)

    def _fetch_month(args):
        mi, (start, end) = args
        month_label = f'{start[:4]}-{start[4:6]}'
        items = []
        for category, ep in [
            ('물품', 'getScsbidListSttusThng'),
            ('공사', 'getScsbidListSttusCnstwk'),
            ('용역', 'getScsbidListSttusServc'),
        ]:
            tmpl = (
                f'https://apis.data.go.kr/1230000/ScsbidInfoService/{ep}'
                f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
                f'&inqryDiv=1&inqryBgnDt={start}&inqryEndDt={end}'
            )
            try:
                fetched = fetch_koneps_pages(tmpl, max_pages=20)
                items.extend(fetched)
            except Exception as e:
                err = str(e)
                if '403' in err or '401' in err or 'SERVICE_ACCESS_DENIED' in err or 'LIMITED_NUMBER' in err:
                    print('  DAPA subscription pending approval at data.go.kr')
                    return month_label, []
        return month_label, items

    all_items = []
    months_done = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(_fetch_month, (mi, r)): mi for mi, r in enumerate(month_ranges)}
        month_results = {}
        for fut in as_completed(futs):
            label, items = fut.result()
            month_results[label] = items
            months_done += 1
    for label in sorted(month_results, reverse=True):
        items = month_results[label]
        all_items.extend(items)
        if items:
            print(f'  {label}: {len(items)}건')

    save('dapa-bids.json', {
        'source': 'data.go.kr',
        'service': 'ScsbidInfoService (DAPA)',
        'fetched_at': now_iso(),
        'months_covered': months_done,
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} DAPA bids ({months_done}개월)')


def fetch_dapa_contracts(output_dir=None):
    """방위사업청 계약정보 — 1230000/CntrctInfoService (12개월 월별)"""
    print('\n🛡️  방위사업청 — 계약정보 (12개월)')
    month_ranges = koneps_month_ranges(12)

    def _fetch_month(args):
        mi, (start, end) = args
        month_label = f'{start[:4]}-{start[4:6]}'
        items = []
        for category, ep in [
            ('물품', 'getCntrctInfoListThng'),
            ('공사', 'getCntrctInfoListCnstwk'),
            ('용역', 'getCntrctInfoListServc'),
        ]:
            tmpl = (
                f'https://apis.data.go.kr/1230000/CntrctInfoService/{ep}'
                f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
                f'&inqryDiv=1&inqryBgnDt={start}&inqryEndDt={end}'
            )
            try:
                fetched = fetch_koneps_pages(tmpl, max_pages=20)
                items.extend(fetched)
            except Exception as e:
                err = str(e)
                if '403' in err or '401' in err or 'SERVICE_ACCESS_DENIED' in err or 'LIMITED_NUMBER' in err:
                    print('  DAPA contracts subscription pending')
                    return month_label, []
        return month_label, items

    all_items = []
    months_done = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(_fetch_month, (mi, r)): mi for mi, r in enumerate(month_ranges)}
        month_results = {}
        for fut in as_completed(futs):
            label, items = fut.result()
            month_results[label] = items
            months_done += 1
    for label in sorted(month_results, reverse=True):
        items = month_results[label]
        all_items.extend(items)
        if items:
            print(f'  {label}: {len(items)}건')

    save('dapa-contracts.json', {
        'source': 'data.go.kr',
        'service': 'CntrctInfoService (DAPA)',
        'fetched_at': now_iso(),
        'months_covered': months_done,
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} DAPA contracts ({months_done}개월)')


def fetch_lh_contracts(output_dir=None):
    """한국토지주택공사(LH) 계약현황정보 — B552555/lhComodInfoService (12개월 월별)"""
    print('\n🏠 LH — 계약현황정보 (12개월)')
    month_ranges = koneps_month_ranges(12)

    def _fetch_month(args):
        mi, (start, end) = args
        month_label = f'{start[:4]}-{start[4:6]}'
        items = []
        # Try primary method, then fallback
        for ep in ['getLhComodInfo', 'getComodInfoList']:
            tmpl = (
                f'https://apis.data.go.kr/B552555/lhComodInfoService/{ep}'
                f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
                f'&inqryBgnDt={start}&inqryEndDt={end}'
            )
            try:
                fetched = fetch_koneps_pages(tmpl, max_pages=20)
                if fetched:
                    items.extend(fetched)
                    break
            except Exception as e:
                err = str(e)
                if '403' in err or '401' in err or 'SERVICE_ACCESS_DENIED' in err or 'LIMITED_NUMBER' in err:
                    print('  LH subscription pending approval')
                    return month_label, []
                # 404/method not found — try next method
                continue
        return month_label, items

    all_items = []
    months_done = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(_fetch_month, (mi, r)): mi for mi, r in enumerate(month_ranges)}
        month_results = {}
        for fut in as_completed(futs):
            label, items = fut.result()
            month_results[label] = items
            months_done += 1
    for label in sorted(month_results, reverse=True):
        items = month_results[label]
        all_items.extend(items)
        if items:
            print(f'  {label}: {len(items)}건')

    save('lh-contracts.json', {
        'source': 'data.go.kr',
        'service': 'B552555/lhComodInfoService',
        'fetched_at': now_iso(),
        'months_covered': months_done,
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} LH contracts ({months_done}개월)')


def fetch_lh_bids(output_dir=None):
    """한국토지주택공사(LH) 개찰정보(낙찰결과) — B552555/lhBidInfoService (12개월 월별)"""
    print('\n🏠 LH — 개찰정보/낙찰결과 (12개월)')
    month_ranges = koneps_month_ranges(12)

    def _fetch_month(args):
        mi, (start, end) = args
        month_label = f'{start[:4]}-{start[4:6]}'
        items = []
        # Try primary method, then fallback
        for ep in ['getLhBidInfo', 'getBidInfoList']:
            tmpl = (
                f'https://apis.data.go.kr/B552555/lhBidInfoService/{ep}'
                f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
                f'&inqryBgnDt={start}&inqryEndDt={end}'
            )
            try:
                fetched = fetch_koneps_pages(tmpl, max_pages=20)
                if fetched:
                    items.extend(fetched)
                    break
            except Exception as e:
                err = str(e)
                if '403' in err or '401' in err or 'SERVICE_ACCESS_DENIED' in err or 'LIMITED_NUMBER' in err:
                    print('  LH bid subscription pending approval')
                    return month_label, []
                # 404/method not found — try next method
                continue
        return month_label, items

    all_items = []
    months_done = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(_fetch_month, (mi, r)): mi for mi, r in enumerate(month_ranges)}
        month_results = {}
        for fut in as_completed(futs):
            label, items = fut.result()
            month_results[label] = items
            months_done += 1
    for label in sorted(month_results, reverse=True):
        items = month_results[label]
        all_items.extend(items)
        if items:
            print(f'  {label}: {len(items)}건')

    save('lh-bids.json', {
        'source': 'data.go.kr',
        'service': 'B552555/lhBidInfoService',
        'fetched_at': now_iso(),
        'months_covered': months_done,
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} LH bids ({months_done}개월)')


# ── Main ──

FETCHERS = {
    'legislators': fetch_legislators,
    'bills': fetch_bills,
    'bill-votes': fetch_bill_vote_results,  # 본회의 의결 결과
    'ecos': fetch_ecos,
    'g2b': fetch_g2b_bids,
    'contracts': fetch_g2b_contracts,
    'companies': fetch_g2b_companies,
    'targeted-companies': fetch_targeted_companies,
    'sanctions': fetch_g2b_sanctions,
    'winning-bids': fetch_g2b_winning_bids,
    'contract-details': fetch_g2b_contract_details,
    'contract-process': fetch_g2b_contract_process,
    'prices': fetch_g2b_prices,
    'stats': fetch_procurement_stats,
    'assets': fetch_official_assets,
    'political-funding': fetch_political_funding,  # 22대 의원 정치자금 수입지출
    'news': fetch_news,
    'bid-rankings': fetch_g2b_bid_rankings,
    'contract-changes': fetch_g2b_contract_changes,
    'shopping-mall': fetch_shopping_mall_prices,
    'historical-bids': fetch_historical_bids,
    'dapa-bids': fetch_dapa_bids,
    'dapa-contracts': fetch_dapa_contracts,
    'lh-contracts': fetch_lh_contracts,
    'lh-bids': fetch_lh_bids,
}

if __name__ == '__main__':
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(FETCHERS.keys())
    print(f'🔄 국정투명 데이터 새로고침 — {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    print(f'   대상: {", ".join(targets)}')

    for name in targets:
        if name in FETCHERS:
            try:
                FETCHERS[name]()
            except Exception as e:
                print(f'  ❌ {name} failed: {e}')
        else:
            print(f'  ⚠️  Unknown target: {name}')
            print(f'     Available: {", ".join(FETCHERS.keys())}')

    print(f'\n✅ Done! Data saved to {DATA_DIR}')
