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
