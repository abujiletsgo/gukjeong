// React 18 does not export cache; define a passthrough so queries deduplicate within a render
const cache = <T extends (...args: never[]) => unknown>(fn: T): T => fn;
import { db } from './index';
import { auditFlags, legislators, bills } from './schema';
import type { AuditFlag, Legislator, Bill, LegislatorBill } from '../types';
import { eq, ilike, and, desc, asc, sql } from 'drizzle-orm';

// ─── Audit Flags ────────────────────────────────────────────

export const getAuditFlagsFromDB = cache(async (opts?: {
  severity?: string;
  patternType?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ flags: AuditFlag[]; total: number }> => {
  try {
    const page = opts?.page ?? 1;
    const pageSize = opts?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (opts?.severity) {
      conditions.push(eq(auditFlags.severity, opts.severity));
    }
    if (opts?.patternType) {
      conditions.push(eq(auditFlags.pattern_type, opts.patternType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      whereClause
        ? db.select().from(auditFlags).where(whereClause).orderBy(desc(auditFlags.suspicion_score)).limit(pageSize).offset(offset)
        : db.select().from(auditFlags).orderBy(desc(auditFlags.suspicion_score)).limit(pageSize).offset(offset),
      whereClause
        ? db.select({ count: sql<number>`count(*)` }).from(auditFlags).where(whereClause)
        : db.select({ count: sql<number>`count(*)` }).from(auditFlags),
    ]);

    const total = Number(countRows[0]?.count ?? 0);

    const flags: AuditFlag[] = rows.map((row) => ({
      id: row.id,
      pattern_type: row.pattern_type,
      severity: row.severity,
      suspicion_score: row.suspicion_score,
      target_type: row.target_type ?? undefined,
      target_id: row.target_id ?? undefined,
      target_institution: row.target_institution ?? undefined,
      summary: row.summary ?? undefined,
      detail: (row.detail as Record<string, unknown>) ?? undefined,
      evidence: (row.evidence as Record<string, unknown>) ?? undefined,
      ai_analysis: row.ai_analysis ?? undefined,
      related_bai_case: row.related_bai_case ?? undefined,
      status: row.status,
      verdict: (row.verdict as AuditFlag['verdict']) ?? undefined,
      verdict_reason: row.verdict_reason ?? undefined,
      key_evidence: row.key_evidence ?? undefined,
      evidence_contracts: (row.evidence_contracts as AuditFlag['evidence_contracts']) ?? undefined,
      vendor_profile: (row.vendor_profile as AuditFlag['vendor_profile']) ?? undefined,
      priority_tier: row.priority_tier ?? undefined,
      plain_explanation: row.plain_explanation ?? undefined,
      why_it_matters: row.why_it_matters ?? undefined,
      innocent_explanation: row.innocent_explanation ?? undefined,
      citizen_impact: row.citizen_impact ?? undefined,
      what_should_happen: row.what_should_happen ?? undefined,
      real_case_example: row.real_case_example ?? undefined,
      similar_cases: (row.similar_cases as AuditFlag['similar_cases']) ?? undefined,
      related_links: (row.related_links as AuditFlag['related_links']) ?? undefined,
      contracts: (row.contracts as AuditFlag['contracts']) ?? undefined,
      timeline: (row.timeline as AuditFlag['timeline']) ?? undefined,
      ai_headline: row.ai_headline ?? undefined,
      ai_narrative: row.ai_narrative ?? undefined,
      ai_questions: (row.ai_questions as string[]) ?? undefined,
      ai_risk_assessment: row.ai_risk_assessment ?? undefined,
      ai_comparable: row.ai_comparable ?? undefined,
      ai_model: row.ai_model ?? undefined,
      ai_enriched_at: row.ai_enriched_at ? row.ai_enriched_at.toISOString() : undefined,
      news_coverage: (row.news_coverage as AuditFlag['news_coverage']) ?? undefined,
      created_at: row.created_at ? row.created_at.toISOString() : undefined,
    }));

    return { flags, total };
  } catch {
    return { flags: [], total: 0 };
  }
});

export const getAuditFlagByIdFromDB = cache(async (id: string): Promise<AuditFlag | undefined> => {
  try {
    const rows = await db.select().from(auditFlags).where(eq(auditFlags.id, id)).limit(1);
    if (rows.length === 0) return undefined;

    const row = rows[0];
    return {
      id: row.id,
      pattern_type: row.pattern_type,
      severity: row.severity,
      suspicion_score: row.suspicion_score,
      target_type: row.target_type ?? undefined,
      target_id: row.target_id ?? undefined,
      target_institution: row.target_institution ?? undefined,
      summary: row.summary ?? undefined,
      detail: (row.detail as Record<string, unknown>) ?? undefined,
      evidence: (row.evidence as Record<string, unknown>) ?? undefined,
      ai_analysis: row.ai_analysis ?? undefined,
      related_bai_case: row.related_bai_case ?? undefined,
      status: row.status,
      verdict: (row.verdict as AuditFlag['verdict']) ?? undefined,
      verdict_reason: row.verdict_reason ?? undefined,
      key_evidence: row.key_evidence ?? undefined,
      evidence_contracts: (row.evidence_contracts as AuditFlag['evidence_contracts']) ?? undefined,
      vendor_profile: (row.vendor_profile as AuditFlag['vendor_profile']) ?? undefined,
      priority_tier: row.priority_tier ?? undefined,
      plain_explanation: row.plain_explanation ?? undefined,
      why_it_matters: row.why_it_matters ?? undefined,
      innocent_explanation: row.innocent_explanation ?? undefined,
      citizen_impact: row.citizen_impact ?? undefined,
      what_should_happen: row.what_should_happen ?? undefined,
      real_case_example: row.real_case_example ?? undefined,
      similar_cases: (row.similar_cases as AuditFlag['similar_cases']) ?? undefined,
      related_links: (row.related_links as AuditFlag['related_links']) ?? undefined,
      contracts: (row.contracts as AuditFlag['contracts']) ?? undefined,
      timeline: (row.timeline as AuditFlag['timeline']) ?? undefined,
      ai_headline: row.ai_headline ?? undefined,
      ai_narrative: row.ai_narrative ?? undefined,
      ai_questions: (row.ai_questions as string[]) ?? undefined,
      ai_risk_assessment: row.ai_risk_assessment ?? undefined,
      ai_comparable: row.ai_comparable ?? undefined,
      ai_model: row.ai_model ?? undefined,
      ai_enriched_at: row.ai_enriched_at ? row.ai_enriched_at.toISOString() : undefined,
      news_coverage: (row.news_coverage as AuditFlag['news_coverage']) ?? undefined,
      created_at: row.created_at ? row.created_at.toISOString() : undefined,
    };
  } catch {
    return undefined;
  }
});

// ─── Legislators ────────────────────────────────────────────

function mapLegislatorRow(row: typeof legislators.$inferSelect): Legislator {
  return {
    id: row.id,
    name: row.name,
    name_en: row.name_en ?? undefined,
    party: row.party ?? undefined,
    district: row.district ?? undefined,
    region: row.region ?? undefined,
    elected_count: row.elected_count ?? undefined,
    committee: row.committee ?? undefined,
    attendance_rate: row.attendance_rate ?? undefined,
    vote_participation_rate: row.vote_participation_rate ?? undefined,
    pledge_fulfillment_rate: row.pledge_fulfillment_rate ?? undefined,
    ai_activity_score: row.ai_activity_score ?? undefined,
    consistency_score: row.consistency_score ?? undefined,
    bills_proposed_count: row.bills_proposed_count ?? undefined,
    bills_passed_count: row.bills_passed_count ?? undefined,
    speech_count: row.speech_count ?? undefined,
    asset_total: row.asset_total ?? undefined,
    age: row.age ?? undefined,
    gender: row.gender ?? undefined,
    career_summary: row.career_summary ?? undefined,
    consistency_details: (row.consistency_details as Legislator['consistency_details']) ?? undefined,
    recent_bills: (row.recent_bills as LegislatorBill[]) ?? undefined,
    photo_url: row.photo_url ?? undefined,
  };
}

export const getLegislatorsFromDB = cache(async (opts?: {
  party?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ legislators: Legislator[]; total: number }> => {
  try {
    const page = opts?.page ?? 1;
    const pageSize = opts?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (opts?.party) {
      conditions.push(eq(legislators.party, opts.party));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderByClause = opts?.sortBy === 'rank_overall'
      ? asc(legislators.rank_overall)
      : desc(legislators.ai_activity_score);

    const [rows, countRows] = await Promise.all([
      whereClause
        ? db.select().from(legislators).where(whereClause).orderBy(orderByClause).limit(pageSize).offset(offset)
        : db.select().from(legislators).orderBy(orderByClause).limit(pageSize).offset(offset),
      whereClause
        ? db.select({ count: sql<number>`count(*)` }).from(legislators).where(whereClause)
        : db.select({ count: sql<number>`count(*)` }).from(legislators),
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    const result = rows.map(mapLegislatorRow);

    return { legislators: result, total };
  } catch {
    return { legislators: [], total: 0 };
  }
});

export const getLegislatorByIdFromDB = cache(async (id: string): Promise<Legislator | undefined> => {
  try {
    // Try primary id first
    let rows = await db.select().from(legislators).where(eq(legislators.id, id)).limit(1);

    // If not found, try assembly_id (MONA_CD)
    if (rows.length === 0) {
      rows = await db.select().from(legislators).where(eq(legislators.assembly_id, id)).limit(1);
    }

    if (rows.length === 0) return undefined;

    return mapLegislatorRow(rows[0]);
  } catch {
    return undefined;
  }
});

// ─── Bills ──────────────────────────────────────────────────

function mapBillRow(row: typeof bills.$inferSelect): Bill {
  return {
    id: row.id,
    bill_no: row.bill_no ?? undefined,
    title: row.title,
    proposed_date: row.proposed_date ?? undefined,
    proposer_type: row.proposer_type ?? undefined,
    proposer_name: row.proposer_name ?? undefined,
    committee: row.committee ?? undefined,
    status: row.status ?? undefined,
    status_detail: row.status_detail ?? undefined,
    vote_result: (row.vote_result as Bill['vote_result']) ?? undefined,
    ai_summary: row.ai_summary ?? undefined,
    ai_category: row.ai_category ?? undefined,
    ai_controversy_score: row.ai_controversy_score ?? undefined,
    ai_citizen_impact: row.ai_citizen_impact ?? undefined,
    co_sponsors_count: row.co_sponsors_count ?? undefined,
    background: row.background ?? undefined,
    problem_statement: row.problem_statement ?? undefined,
    citizen_impact_detail: (row.citizen_impact_detail as Bill['citizen_impact_detail']) ?? undefined,
    controversy_detail: (row.controversy_detail as Bill['controversy_detail']) ?? undefined,
    perspectives: (row.perspectives as Bill['perspectives']) ?? undefined,
    co_sponsors: (row.co_sponsors as Bill['co_sponsors']) ?? undefined,
    bill_timeline: (row.bill_timeline as Bill['bill_timeline']) ?? undefined,
    related_bills: (row.related_bills as string[]) ?? undefined,
  };
}

export const getBillsFromDB = cache(async (opts?: {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ bills: Bill[]; total: number }> => {
  try {
    const page = opts?.page ?? 1;
    const pageSize = opts?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (opts?.status) {
      conditions.push(eq(bills.status, opts.status));
    }
    if (opts?.category) {
      conditions.push(eq(bills.ai_category, opts.category));
    }
    if (opts?.search) {
      conditions.push(ilike(bills.title, `%${opts.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      whereClause
        ? db.select().from(bills).where(whereClause).orderBy(desc(bills.proposed_date)).limit(pageSize).offset(offset)
        : db.select().from(bills).orderBy(desc(bills.proposed_date)).limit(pageSize).offset(offset),
      whereClause
        ? db.select({ count: sql<number>`count(*)` }).from(bills).where(whereClause)
        : db.select({ count: sql<number>`count(*)` }).from(bills),
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    const result = rows.map(mapBillRow);

    return { bills: result, total };
  } catch {
    return { bills: [], total: 0 };
  }
});

export const getBillByIdFromDB = cache(async (id: string): Promise<Bill | undefined> => {
  try {
    const rows = await db.select().from(bills).where(eq(bills.id, id)).limit(1);
    if (rows.length === 0) return undefined;
    return mapBillRow(rows[0]);
  } catch {
    return undefined;
  }
});
