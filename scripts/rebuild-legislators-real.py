#!/usr/bin/env python3
"""
apps/web/public/data/legislators-real.json 재생성 (오프라인, 네트워크 호출 없음)

기존 legislators-real.json은 2026-03-28에 일회성으로 만들어졌고, 당시 사용된
법안 소스가 전체 22대 법안(현재 apps/web/data/bills.json, 16,914건)이 아니라
"본회의 처리 법안" 1,252건짜리 부분집합이었다. 그 결과 bills_proposed가
정당 평균 5~8건 수준으로 지나치게 작게 나왔다(실제로는 legislator-scores.json
기준 정당 평균 ~50~60건).

이 스크립트는 apps/web/data/legislators.json(295명) + apps/web/data/bills.json
(16,914건, RST_MONA_CD = 대표발의자)만 읽어 legislators-real.json을 기존 스키마
그대로 다시 만든다. 네트워크 호출 없음.

사용법:
  python3 scripts/rebuild-legislators-real.py
"""
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA_RAW = ROOT / 'apps/web/data'
DATA_PUBLIC = ROOT / 'apps/web/public/data'

LEGISLATORS_PATH = DATA_RAW / 'legislators.json'
BILLS_PATH = DATA_RAW / 'bills.json'
OUTPUT_PATH = DATA_PUBLIC / 'legislators-real.json'

PASSED = {'원안가결', '수정가결'}

# RawLegislator 인터페이스(apps/web/app/legislators/LegislatorsPageClient.tsx)와
# 동일한 원본 필드만 그대로 옮긴다.
LEGISLATOR_FIELDS = [
    'HG_NM', 'HJ_NM', 'ENG_NM', 'BTH_DATE', 'POLY_NM', 'ORIG_NM',
    'ELECT_GBN_NM', 'CMIT_NM', 'CMITS', 'REELE_GBN_NM', 'UNITS',
    'SEX_GBN_NM', 'TEL_NO', 'E_MAIL', 'HOMEPAGE', 'MONA_CD',
    'MEM_TITLE', 'ASSEM_ADDR', 'JOB_RES_NM',
]


def load_json(path: Path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def main():
    legislators = load_json(LEGISLATORS_PATH)['items']
    bills = load_json(BILLS_PATH)['items']

    mona_set = {leg['MONA_CD'] for leg in legislators}
    name_to_mona = {leg['HG_NM']: leg['MONA_CD'] for leg in legislators}

    bills_by_mona: dict[str, list[dict]] = {mona: [] for mona in mona_set}
    unmatched = 0
    for bill in bills:
        mona = bill.get('RST_MONA_CD') or ''
        if mona not in mona_set:
            # RST_MONA_CD가 비어있거나 현재 295인 명단에 없는 경우
            # RST_PROPOSER 이름으로 한번 더 매칭 시도
            name = (bill.get('RST_PROPOSER') or '').strip()
            mona = name_to_mona.get(name, '')
        if mona in bills_by_mona:
            bills_by_mona[mona].append(bill)
        else:
            unmatched += 1

    total_bills_22nd = len(bills)
    plenary_bills = sum(1 for b in bills if b.get('PROC_RESULT'))

    out_legislators = []
    zero_count = 0
    for leg in legislators:
        mona = leg['MONA_CD']
        mona_bills = bills_by_mona.get(mona, [])

        bills_proposed = len(mona_bills)
        bills_passed = sum(1 for b in mona_bills if (b.get('PROC_RESULT') or '') in PASSED)
        if bills_proposed == 0:
            zero_count += 1

        sorted_bills = sorted(
            mona_bills, key=lambda b: b.get('PROPOSE_DT') or '', reverse=True
        )
        recent_bills = [
            {
                'id': b.get('BILL_ID', ''),
                'no': b.get('BILL_NO', ''),
                'name': b.get('BILL_NAME', ''),
                'committee': b.get('COMMITTEE'),
                'date': b.get('PROPOSE_DT', ''),
                'result': b.get('PROC_RESULT'),
                'link': b.get('DETAIL_LINK', ''),
            }
            for b in sorted_bills[:5]
        ]

        record = {field: leg.get(field) for field in LEGISLATOR_FIELDS if field in leg}
        record['bills_proposed'] = bills_proposed
        record['bills_passed'] = bills_passed
        record['recent_bills'] = recent_bills
        out_legislators.append(record)

    output = {
        'timestamp': date.today().isoformat(),
        'total': len(out_legislators),
        'source': '열린국회정보',
        'total_bills_22nd': total_bills_22nd,
        'plenary_bills': plenary_bills,
        'legislators': out_legislators,
    }

    OUTPUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, separators=(',', ':')),
        encoding='utf-8',
    )

    avg = sum(l['bills_proposed'] for l in out_legislators) / max(len(out_legislators), 1)
    print(f'✅ {OUTPUT_PATH} 재생성 완료')
    print(f'   의원 {len(out_legislators)}명, 법안 {total_bills_22nd}건 (본회의 처리 {plenary_bills}건)')
    print(f'   bills_proposed 평균: {avg:.1f}건, 0건 의원: {zero_count}명, 미매칭 법안: {unmatched}건')

    by_party: dict[str, list[int]] = {}
    for l in out_legislators:
        by_party.setdefault(l.get('POLY_NM') or '무소속', []).append(l['bills_proposed'])
    for party, counts in sorted(by_party.items(), key=lambda x: -len(x[1])):
        print(f'   {party}: 평균 {sum(counts)/len(counts):.1f}건 ({len(counts)}명)')


if __name__ == '__main__':
    main()
