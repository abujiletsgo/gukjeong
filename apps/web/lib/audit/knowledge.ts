/**
 * 국정투명 Knowledge Base — TypeScript frontend client
 *
 * Mirrors the Python knowledge.py module for frontend enrichment.
 * Loads from data/knowledge/*.json at build time (via import).
 *
 * Key capabilities:
 * - Entity resolution (name normalization, org lookup)
 * - Parent-child relationship detection
 * - Industry context classification
 * - Procurement profile matching
 */

import governmentOrgs from '../../data/knowledge/government-orgs.json';
import orgRelationships from '../../data/knowledge/org-relationships.json';
import industryContext from '../../data/knowledge/industry-context.json';
import procurementRules from '../../data/knowledge/procurement-rules.json';

// ── Types ─────────────────────────────────────────────────────

interface GovOrg {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  aliases: string[];
  procurement_profile: string;
  notes?: string;
}

interface Relationship {
  from: string;
  to: string;
  type: string;
  law?: string;
  note?: string;
}

interface RelationshipType {
  label: string;
  description: string;
  normal_procurement: boolean;
  score_cap: number;
}

interface IndustryCategory {
  label: string;
  keywords: string[];
  structural_monopoly: boolean;
  reason: string;
  score_reduction: number;
  score_cap?: number;
  real_concern: string;
  assessment?: string;
}

interface ProcurementProfile {
  label: string;
  expected_sole_source_pct: { min: number; max: number };
  note: string;
}

// ── Index construction ────────────────────────────────────────

const orgByName = new Map<string, GovOrg>();
const orgByAlias = new Map<string, GovOrg>();
const govOrgNames = new Set<string>();

for (const org of (governmentOrgs as any).organizations as GovOrg[]) {
  orgByName.set(org.name, org);
  govOrgNames.add(org.name);
  for (const alias of org.aliases || []) {
    orgByAlias.set(alias, org);
    govOrgNames.add(alias);
  }
}

const relationships = (orgRelationships as any).relationships as Relationship[];
const relationshipTypes = (orgRelationships as any).relationship_types as Record<string, RelationshipType>;
const namePatterns: { regex: RegExp; replace: string }[] = [];

for (const p of (orgRelationships as any).name_normalization?.patterns || []) {
  try {
    namePatterns.push({ regex: new RegExp(p.regex, 'g'), replace: p.replace });
  } catch {
    // Skip invalid regex
  }
}

const industryCategories = (industryContext as any).categories as Record<string, IndustryCategory>;
const procurementProfiles = (industryContext as any).procurement_profiles as Record<string, ProcurementProfile>;

const GOV_AFFILIATED_KEYWORDS = [
  '연구원', '연구소', '진흥원', '진흥회', '진흥재단', '관리원', '관리공단',
  '정보원', '개발원', '평가원', '안전원', '안전공단', '품질관리원',
  '교통안전공단', '국토정보공사', '산림조합', '농협', '수협',
  '공사', '공단',
];

// ── Entity Resolution ─────────────────────────────────────────

export function normalizeName(name: string): string {
  let result = name.trim();
  for (const pat of namePatterns) {
    result = result.replace(pat.regex, pat.replace);
  }
  return result.trim();
}

export function resolveOrg(name: string): GovOrg | null {
  const normalized = normalizeName(name);
  if (orgByName.has(normalized)) return orgByName.get(normalized)!;
  if (orgByAlias.has(normalized)) return orgByAlias.get(normalized)!;
  // Partial match
  const orgEntries = Array.from(orgByName.entries());
  for (let i = 0; i < orgEntries.length; i++) {
    const [orgName, org] = orgEntries[i];
    if (orgName.includes(normalized) || normalized.includes(orgName)) return org;
  }
  const aliasEntries = Array.from(orgByAlias.entries());
  for (let i = 0; i < aliasEntries.length; i++) {
    const [alias, org] = aliasEntries[i];
    if (alias.includes(normalized) || normalized.includes(alias)) return org;
  }
  return null;
}

export function isGovOrg(name: string): boolean {
  const normalized = normalizeName(name);
  if (govOrgNames.has(normalized)) return true;
  return GOV_AFFILIATED_KEYWORDS.some(kw => normalized.includes(kw));
}

// ── Relationship Queries ──────────────────────────────────────

export interface RelationshipResult {
  from: string;
  to: string;
  type: string;
  law?: string;
  note?: string;
  typeInfo: RelationshipType;
  normalProcurement: boolean;
  scoreCap: number;
}

export function findRelationship(vendorName: string, institutionName: string): RelationshipResult | null {
  const vNorm = normalizeName(vendorName);
  const iNorm = normalizeName(institutionName);

  for (const rel of relationships) {
    const fromMatch = rel.from === vNorm || rel.from.includes(vNorm) || vNorm.includes(rel.from);
    const toMatch = rel.to === iNorm || rel.to.includes(iNorm) || iNorm.includes(rel.to);

    if (fromMatch && toMatch) {
      const typeInfo = relationshipTypes[rel.type] || { label: '', description: '', normal_procurement: false, score_cap: 100 };
      return {
        ...rel,
        typeInfo,
        normalProcurement: typeInfo.normal_procurement,
        scoreCap: typeInfo.score_cap,
      };
    }

    // Check reverse
    const fromMatchRev = rel.from === iNorm || rel.from.includes(iNorm) || iNorm.includes(rel.from);
    const toMatchRev = rel.to === vNorm || rel.to.includes(vNorm) || vNorm.includes(rel.to);

    if (fromMatchRev && toMatchRev) {
      const typeInfo = relationshipTypes[rel.type] || { label: '', description: '', normal_procurement: false, score_cap: 100 };
      return {
        ...rel,
        typeInfo,
        normalProcurement: typeInfo.normal_procurement,
        scoreCap: typeInfo.score_cap,
      };
    }
  }

  return null;
}

export function isParentChild(vendorName: string, institutionName: string): boolean {
  const rel = findRelationship(vendorName, institutionName);
  return rel?.normalProcurement === true;
}

// ── Industry Context ──────────────────────────────────────────

export interface IndustryMatch {
  category: string;
  label: string;
  reason: string;
  scoreReduction: number;
  scoreCap?: number;
  realConcern: string;
  structuralMonopoly: boolean;
  matchedKeywords: number;
}

export function getIndustryContext(text: string): IndustryMatch | null {
  const lower = text.toLowerCase();
  let bestMatch: IndustryMatch | null = null;
  let bestCount = 0;

  for (const [catKey, cat] of Object.entries(industryCategories)) {
    const count = cat.keywords.filter(kw => lower.includes(kw.toLowerCase())).length;
    if (count > bestCount) {
      bestCount = count;
      bestMatch = {
        category: catKey,
        label: cat.label,
        reason: cat.reason,
        scoreReduction: cat.score_reduction,
        scoreCap: cat.score_cap,
        realConcern: cat.real_concern,
        structuralMonopoly: cat.structural_monopoly,
        matchedKeywords: count,
      };
    }
  }

  return bestMatch;
}

export function isNormalProcurement(text: string): boolean {
  const ctx = getIndustryContext(text);
  if (!ctx) return false;
  const cat = industryCategories[ctx.category];
  const assessment = (cat as any)?.assessment || '';
  return assessment.startsWith('NORMAL');
}

// ── Procurement Profile ───────────────────────────────────────

export interface ProfileResult {
  key: string;
  label: string;
  expectedSoleSourcePct: { min: number; max: number };
  note: string;
}

export function getProcurementProfile(institutionName: string): ProfileResult {
  const org = resolveOrg(institutionName);
  if (org) {
    const profileKey = org.procurement_profile || 'standard';
    const profile = procurementProfiles[profileKey];
    if (profile) {
      return {
        key: profileKey,
        label: profile.label,
        expectedSoleSourcePct: profile.expected_sole_source_pct,
        note: profile.note,
      };
    }
  }

  // Keyword fallback
  const name = institutionName;
  const keywordMap: [string[], string][] = [
    [['연구원', '연구소', '연구재단'], 'research'],
    [['교육', '학교', '대학'], 'education'],
    [['군', '국방', '육군', '해군', '공군', '방위'], 'defense'],
    [['경찰', '정보원', '수사', '국정원'], 'security'],
    [['병원', '의료', '보건'], 'medical'],
    [['농협', '산림', '수협', '축협'], 'commodity'],
  ];

  for (const [keywords, profileKey] of keywordMap) {
    if (keywords.some(kw => name.includes(kw))) {
      const profile = procurementProfiles[profileKey];
      if (profile) {
        return {
          key: profileKey,
          label: profile.label,
          expectedSoleSourcePct: profile.expected_sole_source_pct,
          note: profile.note,
        };
      }
    }
  }

  const standard = procurementProfiles['standard'];
  return {
    key: 'standard',
    label: standard?.label || '일반',
    expectedSoleSourcePct: standard?.expected_sole_source_pct || { min: 20, max: 40 },
    note: standard?.note || '',
  };
}

// ── Bid Rate Assessment ───────────────────────────────────────

export function assessBidRate(rate: number, participants: number): {
  assessment: string;
  label: string;
  flag: boolean;
} {
  if (participants === 1 && rate >= 99.5) {
    return { assessment: 'NORMAL', label: '단독응찰 100% — 협상/수의계약 가격', flag: false };
  }
  if (participants >= 2 && rate >= 99.5) {
    return { assessment: 'CRITICAL', label: '복수업체 99%+ — 예정가격 유출 강력 의심', flag: true };
  }
  if (rate >= 98) {
    return { assessment: 'WATCH', label: '이상 범위 — 반복 시 의심', flag: participants >= 2 };
  }
  if (rate >= 95) {
    return { assessment: 'LOW', label: '주의 관찰', flag: false };
  }
  return { assessment: 'NORMAL', label: '정상 범위', flag: false };
}

// ── Stats ─────────────────────────────────────────────────────

export function getKnowledgeBaseStats() {
  return {
    organizations: (governmentOrgs as any).organizations.length,
    relationships: relationships.length,
    industryCategories: Object.keys(industryCategories).length,
    procurementProfiles: Object.keys(procurementProfiles).length,
  };
}
