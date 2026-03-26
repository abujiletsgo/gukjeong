import { db } from './index';
import {
  presidents,
  fiscalYearly,
  auditFlags,
  bills,
  newsEvents,
  legislators,
  departmentScores,
} from './schema';
import {
  getPresidents,
  getFiscalData,
  getAuditFlags,
  getBills,
  getNewsEvents,
  getLegislators,
  getDepartmentScores,
} from '../data';

async function seed() {
  console.log('Seeding database...');

  // Clear existing data (respecting FK constraints — children first)
  console.log('  Clearing existing data...');
  await db.delete(legislators);
  await db.delete(newsEvents);
  await db.delete(bills);
  await db.delete(auditFlags);
  await db.delete(departmentScores);
  await db.delete(fiscalYearly);
  await db.delete(presidents);

  // ── Presidents ──────────────────────────────────────────────
  console.log('  Seeding presidents...');
  const presidentsData = getPresidents();
  for (const p of presidentsData) {
    await db.insert(presidents).values({
      id: p.id,
      name: p.name,
      name_en: p.name_en ?? null,
      term_start: p.term_start,
      term_end: p.term_end ?? null,
      party: p.party ?? null,
      era: p.era ?? null,
      gdp_growth_avg: p.gdp_growth_avg ?? null,
      portrait_url: p.portrait_url ?? null,
      note: p.note ?? null,
    });
  }
  console.log(`    Inserted ${presidentsData.length} presidents`);

  // ── Fiscal Yearly ───────────────────────────────────────────
  console.log('  Seeding fiscal data...');
  const fiscalData = getFiscalData();
  for (const f of fiscalData) {
    await db.insert(fiscalYearly).values({
      year: f.year,
      total_spending: f.total_spending ?? null,
      total_revenue: f.total_revenue ?? null,
      tax_revenue: f.tax_revenue ?? null,
      national_debt: f.national_debt ?? null,
      gdp: f.gdp ?? null,
      debt_to_gdp: f.debt_to_gdp ?? null,
      fiscal_balance: f.fiscal_balance ?? null,
      president_id: f.president_id ?? null,
    });
  }
  console.log(`    Inserted ${fiscalData.length} fiscal yearly records`);

  // ── Audit Flags ─────────────────────────────────────────────
  console.log('  Seeding audit flags...');
  const auditFlagsData = getAuditFlags();
  for (const a of auditFlagsData) {
    await db.insert(auditFlags).values({
      id: a.id,
      pattern_type: a.pattern_type,
      severity: a.severity,
      suspicion_score: a.suspicion_score,
      target_type: a.target_type ?? null,
      target_id: a.target_id ?? null,
      detail: (a.detail as Record<string, unknown>) ?? null,
      evidence: (a.evidence as Record<string, unknown>) ?? null,
      ai_analysis: a.ai_analysis ?? null,
      related_bai_case: a.related_bai_case ?? null,
      status: a.status,
      plain_explanation: a.plain_explanation ?? null,
      why_it_matters: a.why_it_matters ?? null,
      citizen_impact: a.citizen_impact ?? null,
      what_should_happen: a.what_should_happen ?? null,
      real_case_example: a.real_case_example ?? null,
      related_links: (a.related_links as unknown) ?? null,
      contracts: (a.contracts as unknown) ?? null,
      timeline: (a.timeline as unknown) ?? null,
    });
  }
  console.log(`    Inserted ${auditFlagsData.length} audit flags`);

  // ── Bills ───────────────────────────────────────────────────
  console.log('  Seeding bills...');
  const billsData = getBills();
  for (const b of billsData) {
    await db.insert(bills).values({
      id: b.id,
      bill_no: b.bill_no ?? null,
      title: b.title,
      proposed_date: b.proposed_date ?? null,
      proposer_type: b.proposer_type ?? null,
      proposer_name: b.proposer_name ?? null,
      committee: b.committee ?? null,
      status: b.status ?? null,
      status_detail: b.status_detail ?? null,
      vote_result: (b.vote_result as unknown) ?? null,
      ai_summary: b.ai_summary ?? null,
      ai_category: b.ai_category ?? null,
      ai_controversy_score: b.ai_controversy_score ?? null,
      ai_citizen_impact: b.ai_citizen_impact ?? null,
      co_sponsors_count: b.co_sponsors_count ?? null,
    });
  }
  console.log(`    Inserted ${billsData.length} bills`);

  // ── News Events ─────────────────────────────────────────────
  console.log('  Seeding news events...');
  const newsData = getNewsEvents();
  for (const n of newsData) {
    await db.insert(newsEvents).values({
      id: n.id,
      title: n.title,
      event_date: n.event_date ?? null,
      category: n.category ?? null,
      ai_summary: n.ai_summary ?? null,
      key_facts: (n.key_facts as unknown) ?? null,
      progressive_frame: (n.progressive_frame as unknown) ?? null,
      conservative_frame: (n.conservative_frame as unknown) ?? null,
      citizen_takeaway: n.citizen_takeaway ?? null,
      article_count: n.article_count ?? null,
      coverage: (n.coverage as unknown) ?? null,
    });
  }
  console.log(`    Inserted ${newsData.length} news events`);

  // ── Legislators ─────────────────────────────────────────────
  console.log('  Seeding legislators...');
  const legislatorsData = getLegislators();
  for (const l of legislatorsData) {
    await db.insert(legislators).values({
      id: l.id,
      name: l.name,
      name_en: l.name_en ?? null,
      party: l.party ?? null,
      district: l.district ?? null,
      region: l.region ?? null,
      elected_count: l.elected_count ?? null,
      committee: l.committee ?? null,
      attendance_rate: l.attendance_rate ?? null,
      vote_participation_rate: l.vote_participation_rate ?? null,
      pledge_fulfillment_rate: l.pledge_fulfillment_rate ?? null,
      ai_activity_score: l.ai_activity_score ?? null,
      consistency_score: l.consistency_score ?? null,
      bills_proposed_count: l.bills_proposed_count ?? null,
      bills_passed_count: l.bills_passed_count ?? null,
      speech_count: l.speech_count ?? null,
      asset_total: l.asset_total ?? null,
      age: l.age ?? null,
      gender: l.gender ?? null,
      career_summary: l.career_summary ?? null,
      consistency_details: (l.consistency_details as unknown) ?? null,
    });
  }
  console.log(`    Inserted ${legislatorsData.length} legislators`);

  // ── Department Scores ───────────────────────────────────────
  console.log('  Seeding department scores...');
  const deptData = getDepartmentScores();
  for (const d of deptData) {
    await db.insert(departmentScores).values({
      department: d.department,
      year: d.year ?? null,
      quarter: d.quarter ?? null,
      suspicion_score: d.suspicion_score,
      flag_count: d.flag_count,
      transparency_rank: d.transparency_rank ?? null,
      details: (d.details as unknown) ?? null,
    });
  }
  console.log(`    Inserted ${deptData.length} department scores`);

  console.log('Seeding complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
