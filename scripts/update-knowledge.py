#!/usr/bin/env python3
"""
국정투명 Knowledge Base Updater

Updates the knowledge base by:
1. Scanning audit results for unrecognized entities (orgs not in KB)
2. Checking for new government organizations from data
3. Validating existing relationships
4. Reporting gaps and recommendations

Usage:
  python3 scripts/update-knowledge.py           # Full scan + report
  python3 scripts/update-knowledge.py --scan     # Scan only (no changes)
  python3 scripts/update-knowledge.py --enrich   # Enrich from audit data
"""

import json
import sys
from pathlib import Path
from collections import defaultdict

# Load knowledge base
from knowledge import get_kb

DATA_DIR = Path(__file__).parent.parent / 'apps' / 'web' / 'data'
KNOWLEDGE_DIR = Path(__file__).parent.parent / 'data' / 'knowledge'
AUDIT_PATH = Path(__file__).parent.parent / 'apps' / 'web' / 'public' / 'data' / 'audit-results.json'


def load_json(path):
    if not path.exists():
        return {}
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def scan_unknown_entities():
    """Scan all data files for entities not in the knowledge base."""
    kb = get_kb()

    # Collect all institution names from data
    institutions = set()
    vendors = set()

    # From contracts
    for filename in ['g2b-actual-contracts.json', 'g2b-contract-details.json']:
        data = load_json(DATA_DIR / filename)
        for item in data.get('items', []):
            inst = str(item.get('cntrctInsttNm', item.get('dmndInsttNm', ''))).strip()
            vendor = str(item.get('rprsntCorpNm', '')).strip()
            if inst:
                institutions.add(inst)
            if vendor:
                vendors.add(vendor)

    # From bids
    data = load_json(DATA_DIR / 'g2b-winning-bids.json')
    for item in data.get('items', []):
        inst = str(item.get('ntceInsttNm', item.get('dminsttNm', ''))).strip()
        vendor = str(item.get('bidwinnrNm', '')).strip()
        if inst:
            institutions.add(inst)
        if vendor:
            vendors.add(vendor)

    # Check which institutions are known
    known_insts = set()
    unknown_insts = set()
    for inst in institutions:
        if kb.resolve_org(inst):
            known_insts.add(inst)
        else:
            unknown_insts.add(inst)

    # Check which vendors are gov-affiliated but not in KB
    unrecognized_gov_vendors = set()
    private_vendors = set()
    known_gov_vendors = set()
    for vendor in vendors:
        normalized = kb.normalize_name(vendor)
        if kb.resolve_org(vendor):
            known_gov_vendors.add(vendor)
        elif kb.is_gov_org(vendor):
            # Matched by keyword but not by name — might need to be added
            unrecognized_gov_vendors.add(vendor)
        else:
            private_vendors.add(vendor)

    return {
        'institutions': {
            'total': len(institutions),
            'known': len(known_insts),
            'unknown': len(unknown_insts),
            'samples': sorted(unknown_insts)[:20],
        },
        'vendors': {
            'total': len(vendors),
            'known_gov': len(known_gov_vendors),
            'unrecognized_gov': len(unrecognized_gov_vendors),
            'private': len(private_vendors),
            'unrecognized_gov_samples': sorted(unrecognized_gov_vendors)[:20],
        },
    }


def scan_audit_gaps():
    """Scan audit results for findings that might be false positives due to KB gaps."""
    kb = get_kb()
    audit = load_json(AUDIT_PATH)
    findings = audit.get('findings', [])

    # Find findings where vendor is gov-affiliated but not properly categorized
    missing_relationships = []
    for f in findings:
        if f.get('context_category') == 'gov_affiliated':
            continue  # Already caught
        inst = f.get('target_institution', '')
        for c in f.get('evidence_contracts', []):
            vendor = c.get('vendor', '')
            if not vendor:
                continue
            # Check if vendor looks like a gov org
            if kb.is_gov_org(vendor) and not kb.find_relationship(vendor, inst):
                missing_relationships.append({
                    'vendor': vendor,
                    'institution': inst,
                    'pattern': f.get('pattern_type', ''),
                    'score': f.get('suspicion_score', 0),
                    'finding_id': f.get('id', ''),
                })

    # Find findings where industry context should have applied but didn't
    missing_context = []
    for f in findings:
        if f.get('context_category'):
            continue
        search_text = ' '.join(
            c.get('name', '') for c in f.get('evidence_contracts', [])
        )
        ctx = kb.get_industry_context(search_text)
        if ctx and ctx.get('score_reduction', 0) >= 25:
            missing_context.append({
                'institution': f.get('target_institution', ''),
                'pattern': f.get('pattern_type', ''),
                'score': f.get('suspicion_score', 0),
                'would_match': ctx.get('label', ''),
                'reduction': ctx.get('score_reduction', 0),
                'finding_id': f.get('id', ''),
            })

    return {
        'missing_relationships': missing_relationships[:20],
        'missing_context': missing_context[:20],
        'total_findings': len(findings),
        'categorized': sum(1 for f in findings if f.get('context_category')),
        'uncategorized': sum(1 for f in findings if not f.get('context_category')),
    }


def generate_report():
    """Generate a comprehensive knowledge base health report."""
    kb = get_kb()
    stats = kb.stats()

    entities = scan_unknown_entities()
    gaps = scan_audit_gaps()

    report = {
        'knowledge_base_stats': stats,
        'entity_coverage': entities,
        'audit_gaps': gaps,
        'recommendations': [],
    }

    # Generate recommendations
    if entities['vendors']['unrecognized_gov'] > 0:
        report['recommendations'].append({
            'priority': 'HIGH',
            'action': f'{entities["vendors"]["unrecognized_gov"]}개 정부 관련 업체가 KB에 미등록',
            'detail': f'이 업체들이 수주한 계약이 오탐(false positive)으로 이어질 수 있습니다. '
                      f'data/knowledge/government-orgs.json에 추가하세요.',
            'samples': entities['vendors']['unrecognized_gov_samples'][:5],
        })

    if gaps['missing_relationships']:
        report['recommendations'].append({
            'priority': 'HIGH',
            'action': f'{len(gaps["missing_relationships"])}건의 정부 기관-산하기관 관계가 미등록',
            'detail': '이 관계를 org-relationships.json에 추가하면 오탐이 줄어듭니다.',
            'samples': [
                f'{r["vendor"]} → {r["institution"]} (pattern: {r["pattern"]}, score: {r["score"]})'
                for r in gaps['missing_relationships'][:5]
            ],
        })

    coverage_pct = (gaps['categorized'] / max(gaps['total_findings'], 1)) * 100
    report['recommendations'].append({
        'priority': 'INFO',
        'action': f'맥락 분류 커버리지: {coverage_pct:.1f}% ({gaps["categorized"]}/{gaps["total_findings"]})',
        'detail': f'{gaps["uncategorized"]}건의 감사 결과가 맥락 분류 없이 남아있습니다.',
    })

    return report


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else '--report'

    if mode == '--scan':
        result = scan_unknown_entities()
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif mode == '--gaps':
        result = scan_audit_gaps()
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        report = generate_report()

        print('=' * 60)
        print('  Knowledge Base Health Report')
        print('=' * 60)
        print(f'\nKB Statistics:')
        for k, v in report['knowledge_base_stats'].items():
            print(f'  {k}: {v}')

        print(f'\nEntity Coverage:')
        ent = report['entity_coverage']
        print(f'  Institutions: {ent["institutions"]["known"]}/{ent["institutions"]["total"]} known ({ent["institutions"]["known"]/max(ent["institutions"]["total"],1)*100:.0f}%)')
        print(f'  Vendors: {ent["vendors"]["known_gov"]} known gov, {ent["vendors"]["unrecognized_gov"]} unrecognized gov, {ent["vendors"]["private"]} private')

        print(f'\nAudit Gaps:')
        ag = report['audit_gaps']
        print(f'  Total findings: {ag["total_findings"]}')
        print(f'  Categorized: {ag["categorized"]}')
        print(f'  Uncategorized: {ag["uncategorized"]}')
        print(f'  Missing relationships: {len(ag["missing_relationships"])}')
        print(f'  Missing context: {len(ag["missing_context"])}')

        print(f'\nRecommendations:')
        for r in report['recommendations']:
            print(f'  [{r["priority"]}] {r["action"]}')
            print(f'    {r["detail"]}')
            if 'samples' in r:
                for s in r['samples'][:3]:
                    print(f'      - {s}')
