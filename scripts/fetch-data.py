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


def fetch_json(url, timeout=20):
    req = urllib.request.Request(url, headers={
        'Accept': 'application/json',
        'User-Agent': 'GukjeongTumyeong/fetch-data',
    })
    resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
    return json.loads(resp.read().decode('utf-8'))


def fetch_text(url, timeout=15):
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


def fetch_koneps_pages(url_template, max_pages=10, label='items'):
    """Generic paginated fetcher for KONEPS/data.go.kr APIs."""
    all_items = []
    page = 1
    while page <= max_pages:
        url = url_template.format(KEY=DATA_GO_KR_KEY, PAGE=page)
        d = fetch_json(url)
        # Handle KONEPS error format
        err = d.get('nkoneps.com.response.ResponseError', {})
        if err:
            code = err.get('header', {}).get('resultCode', '?')
            msg = err.get('header', {}).get('resultMsg', '?')
            if page == 1:
                print(f'  ⚠️  API error: {code} — {msg}')
            break
        body = d.get('response', {}).get('body', {})
        items = body.get('items', [])
        if not isinstance(items, list):
            items = [items] if items else []
        if not items:
            break
        all_items.extend(items)
        total = int(body.get('totalCount', 0))
        if page % 5 == 0:
            print(f'  Page {page}: {len(all_items)}/{total}')
        if len(all_items) >= total or len(items) < 100:
            break
        page += 1
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
    all_bills = []
    page = 1
    while page <= 200:
        url = (
            f'https://open.assembly.go.kr/portal/openapi/nzmimeepazxkubdpn'
            f'?KEY={ASSEMBLY_KEY}&Type=json&pIndex={page}&pSize=100&AGE=22'
        )
        d = fetch_json(url)
        rows = []
        for k in d:
            if isinstance(d[k], list) and len(d[k]) > 1:
                rows = d[k][1].get('row', [])
        if not rows:
            break
        all_bills.extend(rows)
        if page % 25 == 0:
            print(f'  Page {page}: total {len(all_bills)}')
        if len(rows) < 100:
            break
        page += 1

    save('bills.json', {
        'source': 'open.assembly.go.kr',
        'endpoint': 'nzmimeepazxkubdpn',
        'fetched_at': now_iso(),
        'totalCount': len(all_bills),
        'items': all_bills,
    })
    print(f'  ✅ {len(all_bills)} bills')


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
    print('\n🏗️  나라장터 — 입찰공고')
    all_items = []
    page = 1
    while page <= 20:
        url = (
            f'https://apis.data.go.kr/1230000/ao/PubDataOpnStdService'
            f'/getDataSetOpnStdBidPblancInfo?serviceKey={DATA_GO_KR_KEY}'
            f'&numOfRows=100&pageNo={page}&type=json'
        )
        d = fetch_json(url)
        body = d.get('response', {}).get('body', {})
        items = body.get('items', [])
        if not isinstance(items, list):
            items = [items] if items else []
        if not items:
            break
        all_items.extend(items)
        total = body.get('totalCount', 0)
        if page % 10 == 0:
            print(f'  Page {page}: {len(all_items)}/{total}')
        if len(all_items) >= total or len(items) < 100:
            break
        page += 1

    save('g2b-contracts.json', {
        'source': 'data.go.kr',
        'endpoint': 'getDataSetOpnStdBidPblancInfo',
        'fetched_at': now_iso(),
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} bid announcements')


def fetch_g2b_contracts():
    print('\n📝 나라장터 — 계약정보')
    all_items = []
    page = 1
    while page <= 10:
        url = (
            f'https://apis.data.go.kr/1230000/ao/PubDataOpnStdService'
            f'/getDataSetOpnStdCntrctInfo?serviceKey={DATA_GO_KR_KEY}'
            f'&numOfRows=100&pageNo={page}&type=json'
        )
        d = fetch_json(url)
        body = d.get('response', {}).get('body', {})
        items = body.get('items', [])
        if not isinstance(items, list):
            items = [items] if items else []
        if not items:
            break
        all_items.extend(items)
        total = body.get('totalCount', 0)
        if len(all_items) >= total or len(items) < 100:
            break
        page += 1

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

    all_corps = []
    for i, bizno in enumerate(sorted(biznos)):
        if i >= 500:  # rate limit guard (1000/day shared across all endpoints)
            print(f'  ⚠️  Stopped at 500 — rate limit')
            break
        try:
            url = (
                f'https://apis.data.go.kr/1230000/ao/UsrInfoService02'
                f'/getPrcrmntCorpBasicInfo02?serviceKey={DATA_GO_KR_KEY}'
                f'&bizno={bizno}&inqryDiv=3&numOfRows=1&pageNo=1&type=json'
            )
            d = fetch_json(url)
            body = d.get('response', {}).get('body', {})
            items = body.get('items', [])
            if not isinstance(items, list):
                items = [items] if items else []
            all_corps.extend(items)
        except Exception:
            pass  # skip unreachable companies
        if (i + 1) % 50 == 0:
            print(f'  Queried {i + 1}/{min(len(biznos), 200)}')

    save('g2b-companies.json', {
        'source': 'data.go.kr',
        'endpoint': 'getPrcrmntCorpBasicInfo02',
        'fetched_at': now_iso(),
        'totalCount': len(all_corps),
        'items': all_corps,
    })
    print(f'  ✅ {len(all_corps)} company profiles')


def fetch_g2b_sanctions():
    print('\n🚫 나라장터 — 부정당제재업체')
    all_items = []
    page = 1
    while page <= 20:
        url = (
            f'https://apis.data.go.kr/1230000/ao/UsrInfoService02'
            f'/getUnptRsttCorpInfo02?serviceKey={DATA_GO_KR_KEY}'
            f'&inqryDiv=3&numOfRows=100&pageNo={page}&type=json'
        )
        d = fetch_json(url)
        body = d.get('response', {}).get('body', {})
        items = body.get('items', [])
        if not isinstance(items, list):
            items = [items] if items else []
        if not items:
            break
        all_items.extend(items)
        total = body.get('totalCount', 0)
        if len(all_items) >= total or len(items) < 100:
            break
        page += 1

    save('g2b-sanctions.json', {
        'source': 'data.go.kr',
        'endpoint': 'getUnptRsttCorpInfo02',
        'fetched_at': now_iso(),
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} sanctioned companies')


def fetch_g2b_winning_bids():
    """낙찰정보서비스 — as/ScsbidInfoService"""
    print('\n🏆 나라장터 — 낙찰정보 (물품+공사+용역)')
    start, end = koneps_date(30)
    all_items = []
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
        items = fetch_koneps_pages(tmpl, max_pages=5)
        all_items.extend(items)
        print(f'  {category}: {len(items)}건')

    save('g2b-winning-bids.json', {
        'source': 'data.go.kr',
        'service': 'as/ScsbidInfoService',
        'fetched_at': now_iso(),
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} winning bids')


def fetch_g2b_contract_details():
    """계약정보서비스 — ao/CntrctInfoService"""
    print('\n📋 나라장터 — 계약정보 (물품+공사+용역)')
    start, end = koneps_date(30)
    all_items = []
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
        items = fetch_koneps_pages(tmpl, max_pages=5)
        all_items.extend(items)
        print(f'  {category}: {len(items)}건')

    save('g2b-contract-details.json', {
        'source': 'data.go.kr',
        'service': 'ao/CntrctInfoService',
        'fetched_at': now_iso(),
        'totalCount': len(all_items),
        'items': all_items,
    })
    print(f'  ✅ {len(all_items)} contract details')


def fetch_g2b_contract_process():
    """계약과정통합공개 — ao/CntrctProcssIntgOpenService"""
    print('\n🔄 나라장터 — 계약과정통합공개')
    start, end = koneps_date(30)
    all_items = []
    for category, ep in [
        ('물품', 'getCntrctProcssIntgOpenThng'),
        ('공사', 'getCntrctProcssIntgOpenCnstwk'),
        ('용역', 'getCntrctProcssIntgOpenServc'),
    ]:
        tmpl = (
            f'{G2B_BASE}/ao/CntrctProcssIntgOpenService/{ep}'
            f'?serviceKey={{KEY}}&numOfRows=100&pageNo={{PAGE}}&type=json'
            f'&inqryDiv=1&inqryBgnDt={start}&inqryEndDt={end}'
        )
        items = fetch_koneps_pages(tmpl, max_pages=3)
        all_items.extend(items)
        print(f'  {category}: {len(items)}건')

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
    """공공조달통계정보서비스 — at/PubPrcrmntStatInfoService"""
    print('\n📊 공공조달통계')
    now = datetime.now()
    year = str(now.year - 1)  # full year data
    ym_start = f'{now.year - 1}01'
    ym_end = f'{now.year - 1}12'

    all_data = {}

    # 총괄 현황
    try:
        url = (
            f'{G2B_BASE}/at/PubPrcrmntStatInfoService/getTotlPubPrcrmntSttus'
            f'?serviceKey={DATA_GO_KR_KEY}&numOfRows=100&pageNo=1&type=json'
            f'&srchBssYear={year}'
        )
        d = fetch_json(url)
        items = d.get('response', {}).get('body', {}).get('items', [])
        if not isinstance(items, list):
            items = [items] if items else []
        all_data['total'] = items
        print(f'  총괄: {len(items)}건')
    except Exception as e:
        print(f'  ❌ 총괄: {e}')

    # 계약방법별
    try:
        url = (
            f'{G2B_BASE}/at/PubPrcrmntStatInfoService/getCntrctMthdAccotSttus'
            f'?serviceKey={DATA_GO_KR_KEY}&numOfRows=100&pageNo=1&type=json'
            f'&srchBssYmBgn={ym_start}&srchBssYmEnd={ym_end}'
        )
        d = fetch_json(url)
        items = d.get('response', {}).get('body', {}).get('items', [])
        if not isinstance(items, list):
            items = [items] if items else []
        all_data['by_method'] = items
        print(f'  계약방법별: {len(items)}건')
    except Exception as e:
        print(f'  ❌ 계약방법별: {e}')

    # 기업구분별
    try:
        url = (
            f'{G2B_BASE}/at/PubPrcrmntStatInfoService/getEntrprsDivAccotPrcrmntSttus'
            f'?serviceKey={DATA_GO_KR_KEY}&numOfRows=100&pageNo=1&type=json'
            f'&srchBssYmBgn={ym_start}&srchBssYmEnd={ym_end}'
        )
        d = fetch_json(url)
        items = d.get('response', {}).get('body', {}).get('items', [])
        if not isinstance(items, list):
            items = [items] if items else []
        all_data['by_enterprise'] = items
        print(f'  기업구분별: {len(items)}건')
    except Exception as e:
        print(f'  ❌ 기업구분별: {e}')

    save('procurement-stats.json', {
        'source': 'data.go.kr',
        'service': 'at/PubPrcrmntStatInfoService',
        'fetched_at': now_iso(),
        'year': year,
        'data': all_data,
    })
    total = sum(len(v) for v in all_data.values())
    print(f'  ✅ {total} stat records')


def fetch_official_assets():
    """공직자 재산공개 — 행정안전부 ApiPetyService"""
    print('\n👔 공직자 재산공개 (관보)')
    now = datetime.now()
    req_from = f'{now.year - 1}0101'
    req_to = now.strftime('%Y%m%d')

    all_items = []
    page = 1
    while page <= 10:
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

    all_articles = []
    for fid, fname, url, spectrum, cat in feeds:
        try:
            text = fetch_text(url)
            items_xml = re.findall(r'<item>([\s\S]*?)</item>', text, re.I)
            for ix in items_xml:
                all_articles.append({
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
        except Exception as e:
            print(f'  ❌ {fname}: {str(e)[:60]}')

    all_articles.sort(key=lambda a: a.get('pubDate', ''), reverse=True)

    save('news-rss.json', {
        'source': 'RSS feeds',
        'outlets': len(feeds),
        'fetched_at': now_iso(),
        'totalCount': len(all_articles),
        'items': all_articles,
    })
    print(f'  ✅ {len(all_articles)} total articles')


# ── Main ──

FETCHERS = {
    'legislators': fetch_legislators,
    'bills': fetch_bills,
    'ecos': fetch_ecos,
    'g2b': fetch_g2b_bids,
    'contracts': fetch_g2b_contracts,
    'companies': fetch_g2b_companies,
    'sanctions': fetch_g2b_sanctions,
    'winning-bids': fetch_g2b_winning_bids,
    'contract-details': fetch_g2b_contract_details,
    'contract-process': fetch_g2b_contract_process,
    'prices': fetch_g2b_prices,
    'stats': fetch_procurement_stats,
    'assets': fetch_official_assets,
    'news': fetch_news,
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
