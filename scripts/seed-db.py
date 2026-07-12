#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["psycopg2-binary"]
# ///
"""
seed-db.py — Seed Postgres DB from local JSON data files.

Usage:
    uv run scripts/seed-db.py --source audit
    uv run scripts/seed-db.py --source legislators
    uv run scripts/seed-db.py --source bills
    uv run scripts/seed-db.py --all
"""

import argparse
import json
import os
import sys
from typing import Any, Optional

import psycopg2
import psycopg2.extras


# ---------------------------------------------------------------------------
# DB connection
# ---------------------------------------------------------------------------

def get_connection():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        env_path = os.path.join(os.path.dirname(__file__), '..', 'apps', 'web', '.env.local')
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('DATABASE_URL='):
                        db_url = line.split('=', 1)[1].strip().strip('"\'')
    if not db_url:
        raise RuntimeError(
            "DATABASE_URL not set. Add it to .env.local or environment."
        )
    return psycopg2.connect(db_url)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_json(path: str) -> Optional[Any]:
    if not os.path.exists(path):
        print(f"  [WARN] File not found: {path} — skipping.")
        return None
    print(f"  Loading {path} ...")
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def jsondump(val) -> Optional[str]:
    """Serialize value as JSON string for JSONB columns, or None if falsy."""
    if val is None:
        return None
    return json.dumps(val, ensure_ascii=False)


def batch(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


# ---------------------------------------------------------------------------
# Phase 1 — audit_flags
# ---------------------------------------------------------------------------

PROC_ROOT = os.path.join(os.path.dirname(__file__), '..', 'apps', 'web', 'public', 'data')
DATA_ROOT = os.path.join(os.path.dirname(__file__), '..', 'apps', 'web', 'data')

AUDIT_PATH = os.path.join(PROC_ROOT, 'audit-results.json')
LEGISLATOR_SCORES_PATH = os.path.join(PROC_ROOT, 'legislator-scores.json')
BILLS_PATH = os.path.join(DATA_ROOT, 'bills.json')
BILLS_ENRICHED_PATH = os.path.join(PROC_ROOT, 'bills-enriched.json')


def seed_audit(conn):
    print("\n=== Phase 1: Seeding audit_flags ===")
    data = load_json(AUDIT_PATH)
    if data is None:
        return

    if isinstance(data, list):
        findings = data
    elif isinstance(data, dict):
        findings = data.get('findings', data.get('flags', []))
    else:
        print("  [WARN] Unexpected audit-results.json format — skipping.")
        return

    print(f"  Found {len(findings)} audit findings.")

    insert_sql = """
        INSERT INTO audit_flags (
            id,
            institution,
            amount,
            pattern_type,
            severity,
            year,
            month,
            contract_id,
            vendor_id,
            vendor_name,
            summary,
            target_institution,
            ai_headline,
            ai_narrative,
            ai_questions,
            ai_risk_assessment,
            ai_comparable,
            ai_enriched_at,
            ai_model,
            similar_cases,
            evidence_contracts,
            vendor_profile,
            verdict,
            verdict_reason,
            key_evidence,
            priority_tier,
            news_coverage,
            innocent_explanation,
            plain_explanation,
            why_it_matters,
            citizen_impact,
            what_should_happen,
            real_case_example
        )
        VALUES %s
        ON CONFLICT (id) DO UPDATE SET
            institution           = EXCLUDED.institution,
            amount                = EXCLUDED.amount,
            pattern_type          = EXCLUDED.pattern_type,
            severity              = EXCLUDED.severity,
            year                  = EXCLUDED.year,
            month                 = EXCLUDED.month,
            contract_id           = EXCLUDED.contract_id,
            vendor_id             = EXCLUDED.vendor_id,
            vendor_name           = EXCLUDED.vendor_name,
            summary               = EXCLUDED.summary,
            target_institution    = EXCLUDED.target_institution,
            ai_headline           = EXCLUDED.ai_headline,
            ai_narrative          = EXCLUDED.ai_narrative,
            ai_questions          = EXCLUDED.ai_questions,
            ai_risk_assessment    = EXCLUDED.ai_risk_assessment,
            ai_comparable         = EXCLUDED.ai_comparable,
            ai_enriched_at        = EXCLUDED.ai_enriched_at,
            ai_model              = EXCLUDED.ai_model,
            similar_cases         = EXCLUDED.similar_cases,
            evidence_contracts    = EXCLUDED.evidence_contracts,
            vendor_profile        = EXCLUDED.vendor_profile,
            verdict               = EXCLUDED.verdict,
            verdict_reason        = EXCLUDED.verdict_reason,
            key_evidence          = EXCLUDED.key_evidence,
            priority_tier         = EXCLUDED.priority_tier,
            news_coverage         = EXCLUDED.news_coverage,
            innocent_explanation  = EXCLUDED.innocent_explanation,
            plain_explanation     = EXCLUDED.plain_explanation,
            why_it_matters        = EXCLUDED.why_it_matters,
            citizen_impact        = EXCLUDED.citizen_impact,
            what_should_happen    = EXCLUDED.what_should_happen,
            real_case_example     = EXCLUDED.real_case_example
    """

    total = 0
    cur = conn.cursor()

    for chunk in batch(findings, 50):
        rows = []
        for f in chunk:
            # ai_analysis is sometimes a string narrative
            ai_analysis = f.get('ai_analysis')
            ai_headline = f.get('ai_headline')
            ai_narrative = f.get('ai_narrative')
            ai_risk_assessment = f.get('ai_risk_assessment')
            ai_comparable = f.get('ai_comparable')
            ai_model = f.get('ai_model')
            ai_enriched_at = f.get('ai_enriched_at')
            ai_questions = f.get('ai_questions')

            # If ai_analysis is a string, use it as ai_narrative when missing
            if isinstance(ai_analysis, str) and not ai_narrative:
                ai_narrative = ai_analysis

            # news_coverage: try news_coverage, then related_news
            news_coverage = f.get('news_coverage') or f.get('related_news')

            # evidence_contracts: may be a list
            evidence_contracts = f.get('evidence_contracts')

            # Extract amount and institution from evidence_contracts or detail
            amount = f.get('amount')
            if amount is None:
                contracts = evidence_contracts or []
                if isinstance(contracts, list) and contracts:
                    first = contracts[0]
                    if isinstance(first, dict):
                        amount = first.get('amount') or first.get('contract_amount')

            institution = f.get('institution') or f.get('target_institution')
            vendor_name = f.get('vendor_name')
            vendor_id = f.get('vendor_id')

            # Extract year/month from created_at
            year = f.get('year')
            month = f.get('month')
            created_at = f.get('created_at', '')
            if not year and created_at:
                try:
                    year = int(str(created_at)[:4])
                except (ValueError, TypeError):
                    year = None
            if not month and created_at:
                try:
                    month = int(str(created_at)[5:7])
                except (ValueError, TypeError):
                    month = None

            row = (
                f.get('id'),                        # id
                institution,                         # institution
                amount,                              # amount
                f.get('pattern_type'),              # pattern_type
                f.get('severity'),                  # severity
                year,                               # year
                month,                              # month
                f.get('contract_id'),               # contract_id
                vendor_id,                          # vendor_id
                vendor_name,                        # vendor_name
                f.get('summary'),                   # summary
                f.get('target_institution'),        # target_institution
                ai_headline,                        # ai_headline
                ai_narrative,                       # ai_narrative
                jsondump(ai_questions),             # ai_questions (jsonb)
                ai_risk_assessment,                 # ai_risk_assessment
                ai_comparable,                      # ai_comparable
                ai_enriched_at,                     # ai_enriched_at
                ai_model,                           # ai_model
                jsondump(f.get('similar_cases')),   # similar_cases (jsonb)
                jsondump(evidence_contracts),       # evidence_contracts (jsonb)
                jsondump(f.get('vendor_profile')),  # vendor_profile (jsonb)
                f.get('verdict'),                   # verdict
                f.get('verdict_reason'),            # verdict_reason
                f.get('key_evidence'),              # key_evidence
                f.get('priority_tier'),             # priority_tier
                jsondump(news_coverage),            # news_coverage (jsonb)
                f.get('innocent_explanation'),      # innocent_explanation
                f.get('plain_explanation'),         # plain_explanation
                f.get('why_it_matters'),            # why_it_matters
                f.get('citizen_impact'),            # citizen_impact
                f.get('what_should_happen'),        # what_should_happen
                f.get('real_case_example'),         # real_case_example
            )
            rows.append(row)

        psycopg2.extras.execute_values(cur, insert_sql, rows)
        conn.commit()
        total += len(rows)
        if total % 100 == 0 or total == len(findings):
            print(f"  Progress: {total}/{len(findings)} rows upserted")

    cur.close()
    print(f"  Done. {total} audit flags seeded.")


# ---------------------------------------------------------------------------
# Phase 2 — legislators
# ---------------------------------------------------------------------------

AREA_TO_CATEGORY = {
    '복지/보건': '보건의료',
    '환경/노동': '환경',
    '농업/수산': '농업',
    '산업/경제': '산업',
    '경제/재정': '금융',
    '정무/금융': '금융',
    '과학기술': '기술',
    '국토/교통': '부동산',
    '법무/사법': '반부패',
    '안보/정보': '안전',
    '국방': '안전',
    '여성/가족': '복지',
    '교육': '복지',
    '행정/지방': '산업',
    '외교/통일': '안전',
    '문화/체육': '미디어',
}


def seed_legislators(conn):
    print("\n=== Phase 2: Seeding legislators ===")
    data = load_json(LEGISLATOR_SCORES_PATH)
    if data is None:
        return

    if isinstance(data, list):
        legislators = data
    elif isinstance(data, dict):
        legislators = data.get('legislators', [])
    else:
        print("  [WARN] Unexpected legislator-scores.json format — skipping.")
        return

    print(f"  Found {len(legislators)} legislators.")

    insert_sql = """
        INSERT INTO legislators (
            id,
            assembly_id,
            name,
            party,
            district,
            committee,
            gender,
            activity_score,
            rank_overall,
            grade,
            bills_passage_rate,
            bills_week,
            bills_month,
            bills_quarter,
            bills_year,
            bills_pending,
            bills_partial,
            bills_effective,
            words_vs_actions_score,
            bipartisan_rate,
            spending_total,
            spending_self_promo_pct,
            primary_area,
            photo_url,
            policy_areas,
            bipartisan_parties,
            stated_focus_areas,
            actual_focus_areas,
            consistency_items,
            recent_bills,
            bills_proposed_count,
            bills_passed_count,
            vote_participation_rate
        )
        VALUES %s
        ON CONFLICT (assembly_id) DO UPDATE SET
            name                  = EXCLUDED.name,
            party                 = EXCLUDED.party,
            district              = EXCLUDED.district,
            committee             = EXCLUDED.committee,
            gender                = EXCLUDED.gender,
            activity_score        = EXCLUDED.activity_score,
            rank_overall          = EXCLUDED.rank_overall,
            grade                 = EXCLUDED.grade,
            bills_passage_rate    = EXCLUDED.bills_passage_rate,
            bills_week            = EXCLUDED.bills_week,
            bills_month           = EXCLUDED.bills_month,
            bills_quarter         = EXCLUDED.bills_quarter,
            bills_year            = EXCLUDED.bills_year,
            bills_pending         = EXCLUDED.bills_pending,
            bills_partial         = EXCLUDED.bills_partial,
            bills_effective       = EXCLUDED.bills_effective,
            words_vs_actions_score= EXCLUDED.words_vs_actions_score,
            bipartisan_rate       = EXCLUDED.bipartisan_rate,
            spending_total        = EXCLUDED.spending_total,
            spending_self_promo_pct = EXCLUDED.spending_self_promo_pct,
            primary_area          = EXCLUDED.primary_area,
            photo_url             = EXCLUDED.photo_url,
            policy_areas          = EXCLUDED.policy_areas,
            bipartisan_parties    = EXCLUDED.bipartisan_parties,
            stated_focus_areas    = EXCLUDED.stated_focus_areas,
            actual_focus_areas    = EXCLUDED.actual_focus_areas,
            consistency_items     = EXCLUDED.consistency_items,
            recent_bills          = EXCLUDED.recent_bills,
            bills_proposed_count  = EXCLUDED.bills_proposed_count,
            bills_passed_count    = EXCLUDED.bills_passed_count,
            vote_participation_rate = EXCLUDED.vote_participation_rate
    """

    total = 0
    cur = conn.cursor()

    for chunk in batch(legislators, 50):
        rows = []
        for leg in chunk:
            mona_cd = leg.get('MONA_CD', '')
            leg_id = 'leg-' + mona_cd if mona_cd else None

            sex = leg.get('SEX_GBN_NM', '')
            gender = '여' if sex == '여' else '남'

            # bills_partial is int in source; bills_effective is float
            bills_partial = leg.get('bills_partial')
            if isinstance(bills_partial, float):
                bills_partial = int(bills_partial)

            bills_effective = leg.get('bills_effective')

            row = (
                leg_id,                                     # id
                mona_cd,                                    # assembly_id
                leg.get('HG_NM'),                          # name
                leg.get('POLY_NM'),                        # party
                leg.get('ORIG_NM'),                        # district
                leg.get('CMIT_NM'),                        # committee
                gender,                                     # gender
                leg.get('activity_score'),                  # activity_score
                leg.get('rank_overall'),                    # rank_overall
                leg.get('grade'),                           # grade
                leg.get('bills_passage_rate'),              # bills_passage_rate
                leg.get('bills_week'),                      # bills_week
                leg.get('bills_month'),                     # bills_month
                leg.get('bills_quarter'),                   # bills_quarter
                leg.get('bills_year'),                      # bills_year
                leg.get('bills_pending'),                   # bills_pending
                bills_partial,                              # bills_partial
                bills_effective,                            # bills_effective
                leg.get('words_vs_actions_score'),          # words_vs_actions_score
                leg.get('bipartisan_rate'),                 # bipartisan_rate
                leg.get('spending_total'),                  # spending_total
                leg.get('spending_self_promo_pct'),         # spending_self_promo_pct
                leg.get('primary_area'),                    # primary_area
                leg.get('photo_url'),                       # photo_url
                jsondump(leg.get('policy_areas')),          # policy_areas (jsonb)
                jsondump(leg.get('bipartisan_parties')),    # bipartisan_parties (jsonb)
                jsondump(leg.get('stated_focus_areas')),    # stated_focus_areas (jsonb)
                jsondump(leg.get('actual_focus_areas')),    # actual_focus_areas (jsonb)
                jsondump(leg.get('consistency_items')),     # consistency_items (jsonb)
                jsondump(leg.get('recent_bills')),          # recent_bills (jsonb)
                leg.get('bills_total'),                     # bills_proposed_count
                leg.get('bills_passed'),                    # bills_passed_count
                leg.get('vote_participation_rate'),         # vote_participation_rate
            )
            rows.append(row)

        psycopg2.extras.execute_values(cur, insert_sql, rows)
        conn.commit()
        total += len(rows)
        print(f"  Progress: {total}/{len(legislators)} rows upserted")

    cur.close()
    print(f"  Done. {total} legislators seeded.")


# ---------------------------------------------------------------------------
# Phase 3 — bills
# ---------------------------------------------------------------------------

PROC_TO_STATUS = {
    '원안가결': '가결',
    '수정가결': '가결',
    '대안반영폐기': '폐기',
    '수정안반영폐기': '폐기',
    '폐기': '폐기',
    '철회': '폐기',
}


def map_status(proc_result: Optional[str]) -> str:
    if not proc_result:
        return '계류'
    return PROC_TO_STATUS.get(proc_result, '계류')


def seed_bills(conn):
    print("\n=== Phase 3: Seeding bills ===")

    raw_data = load_json(BILLS_PATH)
    enriched_data = load_json(BILLS_ENRICHED_PATH)

    if raw_data is None and enriched_data is None:
        print("  [WARN] Both bills files are missing — skipping.")
        return

    # Build raw bills list
    if raw_data is None:
        raw_bills = []
    elif isinstance(raw_data, list):
        raw_bills = raw_data
    elif isinstance(raw_data, dict):
        raw_bills = raw_data.get('items', [])
    else:
        raw_bills = []

    # Build enriched dict keyed by BILL_ID
    if enriched_data is None:
        enriched_dict = {}
    elif isinstance(enriched_data, list):
        enriched_dict = {b['BILL_ID']: b for b in enriched_data if 'BILL_ID' in b}
    elif isinstance(enriched_data, dict):
        enriched_list = enriched_data.get('bills', [])
        enriched_dict = {b['BILL_ID']: b for b in enriched_list if 'BILL_ID' in b}
    else:
        enriched_dict = {}

    # Merge: start from raw, overlay enriched
    all_bill_ids = set(b.get('BILL_ID') for b in raw_bills if b.get('BILL_ID'))
    all_bill_ids |= set(enriched_dict.keys())

    # Build merged bill objects
    raw_dict = {b['BILL_ID']: b for b in raw_bills if b.get('BILL_ID')}
    merged_bills = []
    for bill_id in all_bill_ids:
        raw = raw_dict.get(bill_id, {})
        enr = enriched_dict.get(bill_id, {})
        merged = {**raw, **enr}
        merged_bills.append(merged)

    print(f"  Found {len(merged_bills)} bills total.")

    insert_sql = """
        INSERT INTO bills (
            id,
            bill_no,
            title,
            proposed_date,
            proposer_name,
            committee,
            status,
            status_detail,
            ai_category,
            ai_summary,
            co_sponsors_count
        )
        VALUES %s
        ON CONFLICT (id) DO UPDATE SET
            bill_no           = EXCLUDED.bill_no,
            title             = EXCLUDED.title,
            proposed_date     = EXCLUDED.proposed_date,
            proposer_name     = EXCLUDED.proposer_name,
            committee         = EXCLUDED.committee,
            status            = EXCLUDED.status,
            status_detail     = EXCLUDED.status_detail,
            ai_category       = EXCLUDED.ai_category,
            ai_summary        = EXCLUDED.ai_summary,
            co_sponsors_count = EXCLUDED.co_sponsors_count
    """

    total = 0
    cur = conn.cursor()

    for chunk in batch(merged_bills, 200):
        rows = []
        for b in chunk:
            proc_result = b.get('PROC_RESULT')
            status = map_status(proc_result)
            status_detail = b.get('status_label') or proc_result

            area = b.get('area', '')
            ai_category = AREA_TO_CATEGORY.get(area) if area else None

            title = b.get('law_name') or b.get('BILL_NAME')
            proposed_date = b.get('PROPOSE_DT')
            # Normalize date: keep only YYYY-MM-DD if longer
            if proposed_date and len(proposed_date) > 10:
                proposed_date = proposed_date[:10]

            co_sponsors = b.get('co_sponsor_count') or b.get('co_sponsors_count')

            row = (
                b.get('BILL_ID'),                   # id
                b.get('BILL_NO'),                   # bill_no
                title,                              # title
                proposed_date,                      # proposed_date
                b.get('PUBL_PROPOSER'),             # proposer_name
                b.get('COMMITTEE'),                 # committee
                status,                             # status
                status_detail,                      # status_detail
                ai_category,                        # ai_category
                b.get('summary'),                   # ai_summary
                co_sponsors,                        # co_sponsors_count
            )
            rows.append(row)

        psycopg2.extras.execute_values(cur, insert_sql, rows)
        conn.commit()
        total += len(rows)
        if total % 200 == 0 or total == len(merged_bills):
            print(f"  Progress: {total}/{len(merged_bills)} rows upserted")

    cur.close()
    print(f"  Done. {total} bills seeded.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Seed Postgres DB from local JSON data files.'
    )
    parser.add_argument(
        '--source',
        choices=['audit', 'legislators', 'bills'],
        help='Which data source to seed (audit | legislators | bills)',
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Seed all sources (audit + legislators + bills)',
    )
    args = parser.parse_args()

    if not args.source and not args.all:
        parser.print_help()
        sys.exit(1)

    print("Connecting to database ...")
    try:
        conn = get_connection()
    except Exception as e:
        print(f"[ERROR] Cannot connect to DB: {e}")
        sys.exit(1)

    print("Connected.")

    try:
        if args.all or args.source == 'audit':
            seed_audit(conn)
        if args.all or args.source == 'legislators':
            seed_legislators(conn)
        if args.all or args.source == 'bills':
            seed_bills(conn)
    except Exception as e:
        print(f"\n[ERROR] Seeding failed: {e}")
        conn.close()
        sys.exit(1)

    conn.close()
    print("\nAll done.")


if __name__ == '__main__':
    main()
