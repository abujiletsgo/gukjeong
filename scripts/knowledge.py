"""
국정투명 Knowledge Base — 조달 감사 시스템의 구조화된 지식 엔진

이 모듈은 data/knowledge/ 디렉토리의 JSON 파일을 로드하고,
엔티티 해석(Entity Resolution), 관계 조회, 맥락 분류를 제공합니다.

Usage:
    from knowledge import KnowledgeBase
    kb = KnowledgeBase()
    kb.is_parent_child('한국부동산원', '국토교통부')  # True
    kb.normalize_name('(재)한국법령정보원')            # '한국법령정보원'
    kb.get_industry_context('레미콘 공급 계약')        # {..., reduction: 35}
    kb.get_procurement_profile('한국원자력연구원')     # 'research'
"""

import json
import re
from pathlib import Path
from typing import Optional


KNOWLEDGE_DIR = Path(__file__).parent.parent / 'data' / 'knowledge'


class KnowledgeBase:
    """Structured knowledge for Korean government procurement audit."""

    def __init__(self, knowledge_dir: Optional[Path] = None):
        self.dir = knowledge_dir or KNOWLEDGE_DIR
        self._orgs = {}
        self._org_by_name = {}
        self._org_by_alias = {}
        self._relationships = []
        self._relationship_types = {}
        self._industry_categories = {}
        self._procurement_rules = {}
        self._procurement_profiles = {}
        self._name_patterns = []
        self._gov_org_names = set()
        self._gov_affiliated_keywords = []
        self._loaded = False

    def load(self):
        """Load all knowledge base files."""
        if self._loaded:
            return self
        self._load_orgs()
        self._load_relationships()
        self._load_industry_context()
        self._load_procurement_rules()
        self._loaded = True
        return self

    def _load_json(self, filename):
        path = self.dir / filename
        if not path.exists():
            print(f'  Warning: {filename} not found at {path}')
            return {}
        with open(path, encoding='utf-8') as f:
            return json.load(f)

    def _load_orgs(self):
        data = self._load_json('government-orgs.json')
        for org in data.get('organizations', []):
            oid = org['id']
            self._orgs[oid] = org
            name = org['name']
            self._org_by_name[name] = org
            self._gov_org_names.add(name)
            for alias in org.get('aliases', []):
                self._org_by_alias[alias] = org
                self._gov_org_names.add(alias)

        # Extract gov-affiliated keywords from org types
        self._gov_affiliated_keywords = [
            '연구원', '연구소', '진흥원', '진흥회', '진흥재단', '관리원', '관리공단',
            '정보원', '개발원', '평가원', '안전원', '안전공단', '품질관리원',
            '교통안전공단', '국토정보공사', '산림조합', '농협', '수협',
            '공사', '공단',
        ]

    def _load_relationships(self):
        data = self._load_json('org-relationships.json')
        self._relationship_types = data.get('relationship_types', {})
        self._relationships = data.get('relationships', [])
        # Load name normalization patterns
        norm = data.get('name_normalization', {})
        for p in norm.get('patterns', []):
            try:
                self._name_patterns.append({
                    'regex': re.compile(p['regex']),
                    'replace': p['replace'],
                })
            except re.error:
                pass

    def _load_industry_context(self):
        data = self._load_json('industry-context.json')
        self._industry_categories = data.get('categories', {})
        self._procurement_profiles = data.get('procurement_profiles', {})

    def _load_procurement_rules(self):
        data = self._load_json('procurement-rules.json')
        self._procurement_rules = data

    # ── Entity Resolution ──────────────────────────────────────

    def normalize_name(self, name: str) -> str:
        """Normalize an organization/company name by stripping legal prefixes/suffixes."""
        result = name.strip()
        for pat in self._name_patterns:
            result = pat['regex'].sub(pat['replace'], result)
        return result.strip()

    def resolve_org(self, name: str) -> Optional[dict]:
        """Resolve a name to a known government organization."""
        normalized = self.normalize_name(name)
        # Exact match
        if normalized in self._org_by_name:
            return self._org_by_name[normalized]
        if normalized in self._org_by_alias:
            return self._org_by_alias[normalized]
        # Partial match (e.g. "국토교통부 도로국" → "국토교통부")
        for org_name, org in self._org_by_name.items():
            if org_name in normalized or normalized in org_name:
                return org
        for alias, org in self._org_by_alias.items():
            if alias in normalized or normalized in alias:
                return org
        return None

    def is_gov_org(self, name: str) -> bool:
        """Check if a name is a known government organization."""
        normalized = self.normalize_name(name)
        if normalized in self._gov_org_names:
            return True
        # Check keyword patterns
        return any(kw in normalized for kw in self._gov_affiliated_keywords)

    # ── Relationship Queries ───────────────────────────────────

    def find_relationship(self, vendor_name: str, institution_name: str) -> Optional[dict]:
        """Find a relationship between a vendor (as a gov org) and an institution.

        Returns the relationship dict if found, including type and whether
        procurement between them is expected/normal.
        """
        v_norm = self.normalize_name(vendor_name)
        i_norm = self.normalize_name(institution_name)

        for rel in self._relationships:
            rel_from = rel.get('from', '')
            rel_to = rel.get('to', '')

            # Direct match: vendor→institution or institution→vendor
            from_match = (rel_from == v_norm or rel_from in v_norm or v_norm in rel_from)
            to_match = (rel_to == i_norm or rel_to in i_norm or i_norm in rel_to)

            if from_match and to_match:
                rel_type = self._relationship_types.get(rel['type'], {})
                return {
                    **rel,
                    'type_info': rel_type,
                    'normal_procurement': rel_type.get('normal_procurement', False),
                    'score_cap': rel_type.get('score_cap', 100),
                }

            # Reverse: institution→vendor (some relationships are bidirectional)
            from_match_rev = (rel_from == i_norm or rel_from in i_norm or i_norm in rel_from)
            to_match_rev = (rel_to == v_norm or rel_to in v_norm or v_norm in rel_to)

            if from_match_rev and to_match_rev:
                rel_type = self._relationship_types.get(rel['type'], {})
                return {
                    **rel,
                    'type_info': rel_type,
                    'normal_procurement': rel_type.get('normal_procurement', False),
                    'score_cap': rel_type.get('score_cap', 100),
                }

        return None

    def is_parent_child(self, vendor_name: str, institution_name: str) -> bool:
        """Check if vendor is a child org of the institution (procurement is normal)."""
        rel = self.find_relationship(vendor_name, institution_name)
        if rel and rel.get('normal_procurement'):
            return True

        # Also check via org tree
        v_org = self.resolve_org(vendor_name)
        i_org = self.resolve_org(institution_name)
        if v_org and i_org:
            # v_org is child of i_org?
            if v_org.get('parent_id') and i_org.get('id'):
                return v_org['parent_id'] == i_org['id']
            # i_org is child of v_org?
            if i_org.get('parent_id') and v_org.get('id'):
                return i_org['parent_id'] == v_org['id']
            # Same parent?
            if v_org.get('parent_id') and i_org.get('parent_id'):
                if v_org['parent_id'] == i_org['parent_id']:
                    return True  # sister orgs

        return False

    def get_relationship_context(self, vendor_name: str, institution_name: str) -> Optional[str]:
        """Get a Korean-language explanation of why vendor→institution procurement is normal."""
        rel = self.find_relationship(vendor_name, institution_name)
        if not rel:
            return None
        v_norm = self.normalize_name(vendor_name)
        i_norm = self.normalize_name(institution_name)
        rel_label = rel.get('type_info', {}).get('label', '관련 기관')
        law = rel.get('law', '')
        note = rel.get('note', '')
        explanation = (
            f'{v_norm}은(는) {i_norm}의 {rel_label}입니다. '
            f'{law}에 근거하여 설립된 기관으로, '
            f'모 부처로부터 위탁 사업을 수주하는 것은 설립 목적에 부합하는 정상적 조달입니다.'
        )
        if note:
            explanation += f' ({note})'
        return explanation

    # ── Industry Context ───────────────────────────────────────

    def get_industry_context(self, text: str) -> Optional[dict]:
        """Find the most relevant industry context for a contract/finding.

        Args:
            text: Combined text from contract names, vendor, institution

        Returns:
            Dict with label, reason, score_reduction, etc. or None
        """
        text_lower = text.lower()
        best_match = None
        best_keyword_count = 0

        for cat_key, cat in self._industry_categories.items():
            keywords = cat.get('keywords', [])
            match_count = sum(1 for kw in keywords if kw.lower() in text_lower)
            if match_count > best_keyword_count:
                best_keyword_count = match_count
                best_match = {
                    'category': cat_key,
                    **cat,
                    'matched_keywords': match_count,
                }

        return best_match if best_keyword_count > 0 else None

    def get_all_matching_contexts(self, text: str) -> list:
        """Find ALL matching industry contexts (a contract can match multiple)."""
        text_lower = text.lower()
        matches = []
        for cat_key, cat in self._industry_categories.items():
            keywords = cat.get('keywords', [])
            matched = [kw for kw in keywords if kw.lower() in text_lower]
            if matched:
                matches.append({
                    'category': cat_key,
                    **cat,
                    'matched_keywords': len(matched),
                })
        return sorted(matches, key=lambda x: -x['matched_keywords'])

    def is_normal_procurement(self, text: str) -> bool:
        """Check if a contract matches categories that should be auto-removed (NORMAL)."""
        ctx = self.get_industry_context(text)
        if ctx and ctx.get('assessment') == 'NORMAL — 자동 제거 대상':
            return True
        if ctx and ctx.get('assessment') == 'NORMAL — 유일 공급자':
            return True
        if ctx and ctx.get('assessment') == 'NORMAL — 법정 독점':
            return True
        return False

    # ── Procurement Profile ────────────────────────────────────

    def get_procurement_profile(self, institution_name: str) -> Optional[dict]:
        """Get the expected procurement profile for an institution.

        Returns the profile with expected sole-source rates, etc.
        """
        org = self.resolve_org(institution_name)
        if org:
            profile_key = org.get('procurement_profile', 'standard')
            profile = self._procurement_profiles.get(profile_key, {})
            return {
                'key': profile_key,
                **profile,
                'org': org,
            }
        # Keyword-based fallback
        name = institution_name
        if any(kw in name for kw in ['연구원', '연구소', '연구재단']):
            return {'key': 'research', **self._procurement_profiles.get('research', {})}
        if any(kw in name for kw in ['교육', '학교', '대학']):
            return {'key': 'education', **self._procurement_profiles.get('education', {})}
        if any(kw in name for kw in ['군', '국방', '육군', '해군', '공군', '방위']):
            return {'key': 'defense', **self._procurement_profiles.get('defense', {})}
        if any(kw in name for kw in ['경찰', '정보원', '수사', '국정원']):
            return {'key': 'security', **self._procurement_profiles.get('security', {})}
        if any(kw in name for kw in ['병원', '의료', '보건']):
            return {'key': 'medical', **self._procurement_profiles.get('medical', {})}
        if any(kw in name for kw in ['농협', '산림', '수협', '축협']):
            return {'key': 'commodity', **self._procurement_profiles.get('commodity', {})}
        return {'key': 'standard', **self._procurement_profiles.get('standard', {})}

    def is_sole_source_normal_for(self, institution_name: str, sole_source_pct: float) -> bool:
        """Check if a given sole-source percentage is within expected range for this institution."""
        profile = self.get_procurement_profile(institution_name)
        if not profile:
            return sole_source_pct < 40
        expected = profile.get('expected_sole_source_pct', {'min': 20, 'max': 40})
        return sole_source_pct <= expected['max']

    # ── Procurement Rules ──────────────────────────────────────

    def get_bid_rate_assessment(self, rate: float, participants: int) -> dict:
        """Assess a bid rate given the number of participants.

        Returns assessment with label, risk level, and whether to flag.
        """
        rules = self._procurement_rules.get('bid_rate_benchmarks', {})
        if participants == 1 and rate >= 99.5:
            return {
                'assessment': 'NORMAL',
                'label': '단독응찰 100% — 협상/수의계약 가격',
                'flag': False,
            }
        if participants >= 2 and rate >= 99.5:
            return {
                'assessment': 'CRITICAL',
                'label': '복수업체 99%+ — 예정가격 유출 강력 의심',
                'flag': True,
                'reference': rules.get('reference_case', {}),
            }
        if rate >= 98:
            return {
                'assessment': 'WATCH',
                'label': '이상 범위 — 반복 시 의심',
                'flag': participants >= 2,
            }
        if rate >= 95:
            return {
                'assessment': 'LOW',
                'label': '주의 관찰',
                'flag': False,
            }
        return {
            'assessment': 'NORMAL',
            'label': '정상 범위',
            'flag': False,
        }

    def get_competition_method_reduction(self, method: str) -> int:
        """Get the score reduction for a competition method."""
        methods = self._procurement_rules.get('competition_methods', {})
        for key, info in methods.items():
            if info.get('korean', '') and info['korean'] in method:
                return info.get('score_reduction', 0)
        return 0

    # ── Bulk Context Assessment ────────────────────────────────

    def assess_finding(self, finding: dict) -> dict:
        """Comprehensive context assessment for a single finding.

        Returns a dict with:
        - is_normal: bool (should be auto-removed)
        - score_cap: int (max score after context)
        - context_category: str
        - context_reason: str
        - relationship: dict or None
        - industry: dict or None
        - profile: dict or None
        """
        inst = finding.get('target_institution', '')
        evidence = finding.get('evidence_contracts', [])
        vendors = set(c.get('vendor', '') for c in evidence if c.get('vendor'))

        # Build search text
        texts = [inst]
        texts.extend(c.get('name', '') for c in evidence)
        texts.extend(c.get('method', '') for c in evidence)
        texts.extend(c.get('vendor', '') for c in evidence)
        texts.extend(c.get('reason', '') for c in evidence)
        search_text = ' '.join(texts)

        result = {
            'is_normal': False,
            'score_cap': 100,
            'context_category': None,
            'context_reason': None,
            'relationship': None,
            'industry': None,
            'profile': None,
            'mitigating_reasons': [],
        }

        # 1. Check industry context
        industry = self.get_industry_context(search_text)
        if industry:
            result['industry'] = industry
            if industry.get('assessment', '').startswith('NORMAL'):
                result['is_normal'] = True
                result['context_category'] = industry['category']
                result['context_reason'] = industry['reason']
                return result
            if 'score_cap' in industry:
                result['score_cap'] = min(result['score_cap'], industry['score_cap'])
            result['context_category'] = industry['category']
            result['context_reason'] = industry['reason']
            result['mitigating_reasons'].append(industry['reason'])

        # 2. Check vendor→institution relationship
        for vendor in vendors:
            rel = self.find_relationship(vendor, inst)
            if rel:
                result['relationship'] = rel
                if rel.get('normal_procurement'):
                    result['score_cap'] = min(result['score_cap'], rel.get('score_cap', 30))
                    ctx = self.get_relationship_context(vendor, inst)
                    if ctx:
                        result['mitigating_reasons'].append(ctx)
                break
            # Also check if vendor is a known gov org
            if self.is_gov_org(vendor):
                result['mitigating_reasons'].append(
                    f'{vendor}은(는) 정부 산하기관/출연연구기관으로, '
                    f'모 부처로부터 위탁 사업을 수주하는 것은 설립 목적에 부합합니다.'
                )
                result['score_cap'] = min(result['score_cap'], 30)

        # 3. Check institution profile
        profile = self.get_procurement_profile(inst)
        if profile:
            result['profile'] = profile

        return result

    # ── Statistics ──────────────────────────────────────────────

    def stats(self) -> dict:
        """Return summary statistics about the knowledge base."""
        return {
            'organizations': len(self._orgs),
            'org_names_indexed': len(self._org_by_name) + len(self._org_by_alias),
            'relationships': len(self._relationships),
            'relationship_types': len(self._relationship_types),
            'industry_categories': len(self._industry_categories),
            'procurement_profiles': len(self._procurement_profiles),
            'name_normalization_patterns': len(self._name_patterns),
        }


# ── Singleton ──────────────────────────────────────────────────

_kb_instance = None


def get_kb() -> KnowledgeBase:
    """Get or create the singleton KnowledgeBase instance."""
    global _kb_instance
    if _kb_instance is None:
        _kb_instance = KnowledgeBase().load()
    return _kb_instance


def get_parent_agency(inst_name: str) -> str:
    """
    Map a regional sub-agency name to its parent body.
    Used to detect cross-regional patterns (e.g., vendor winning across all 해양경찰청 sub-offices).
    Returns the original name if no parent mapping applies.
    """
    import re as _re
    name = inst_name.strip()

    # 해양경찰청 regional offices → 해양경찰청
    if '해양경찰청' in name and any(kw in name for kw in ('중부', '남해', '서해', '동해', '제주', '포항', '여수', '군산', '인천', '부산', '통영', '목포', '태안', '평택')):
        return '해양경찰청'

    # 교육청 (any province/city prefix)
    if name.endswith('교육청') or '교육지원청' in name:
        return '교육청'

    # 지방조달청 → 조달청
    if '지방조달청' in name or ('조달청' in name and any(kw in name for kw in ('서울', '부산', '대구', '인천', '광주', '대전', '울산', '경기', '강원', '충청', '전라', '경상', '제주'))):
        return '조달청'

    # 지방환경청 → 환경부
    if '지방환경청' in name or ('환경청' in name and not name == '환경부'):
        return '환경부'

    # 지방국토관리청 → 국토교통부
    if '국토관리청' in name:
        return '국토교통부'

    # 지방고용노동청 → 고용노동부
    if '지방고용노동청' in name or '고용노동지청' in name:
        return '고용노동부'

    return name


if __name__ == '__main__':
    kb = get_kb()
    stats = kb.stats()
    print(f'Knowledge Base loaded:')
    for k, v in stats.items():
        print(f'  {k}: {v}')

    # Test entity resolution
    print('\n-- Entity Resolution Tests --')
    tests = [
        ('(재)한국법령정보원', '한국법령정보원'),
        ('재단법인 한국법령정보원', '한국법령정보원'),
        ('주식회사 더존비즈온', '더존비즈온'),
    ]
    for input_name, expected in tests:
        result = kb.normalize_name(input_name)
        status = 'OK' if result == expected else f'FAIL (got {result})'
        print(f'  {input_name} -> {result} [{status}]')

    # Test relationship queries
    print('\n-- Relationship Tests --')
    rel_tests = [
        ('한국부동산원', '국토교통부', True),
        ('한국인터넷진흥원', '과학기술정보통신부', True),
        ('한국전력공사', '산업통상자원부', True),
        ('삼성전자', '국토교통부', False),
    ]
    for vendor, inst, expected in rel_tests:
        result = kb.is_parent_child(vendor, inst)
        status = 'OK' if result == expected else 'FAIL'
        print(f'  {vendor} → {inst}: parent_child={result} [{status}]')

    # Test industry context
    print('\n-- Industry Context Tests --')
    ctx_tests = [
        '레미콘 공급',
        'COMSOL 라이선스 갱신',
        'MTU 주기관 정비',
        '교과용 도서 공급',
        '사무용품 구매',
    ]
    for text in ctx_tests:
        ctx = kb.get_industry_context(text)
        if ctx:
            print(f'  "{text}" -> {ctx["label"]} (reduction: {ctx.get("score_reduction", 0)})')
        else:
            print(f'  "{text}" -> (no match)')
