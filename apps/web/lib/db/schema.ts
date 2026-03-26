import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  real,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';

// ─── Presidents ─────────────────────────────────────────────
export const presidents = pgTable('presidents', {
  id: varchar('id', { length: 16 }).primaryKey(),
  name: text('name').notNull(),
  name_en: text('name_en'),
  term_start: varchar('term_start', { length: 10 }).notNull(),
  term_end: varchar('term_end', { length: 10 }),
  party: text('party'),
  era: text('era'),
  gdp_growth_avg: real('gdp_growth_avg'),
  portrait_url: text('portrait_url'),
  note: text('note'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ─── Fiscal Yearly ──────────────────────────────────────────
export const fiscalYearly = pgTable('fiscal_yearly', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull(),
  total_spending: real('total_spending'),
  total_revenue: real('total_revenue'),
  tax_revenue: real('tax_revenue'),
  national_debt: real('national_debt'),
  gdp: real('gdp'),
  debt_to_gdp: real('debt_to_gdp'),
  fiscal_balance: real('fiscal_balance'),
  president_id: varchar('president_id', { length: 16 }).references(() => presidents.id),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── Audit Flags ────────────────────────────────────────────
export const auditFlags = pgTable('audit_flags', {
  id: varchar('id', { length: 32 }).primaryKey(),
  pattern_type: varchar('pattern_type', { length: 64 }).notNull(),
  severity: varchar('severity', { length: 16 }).notNull(),
  suspicion_score: real('suspicion_score').notNull(),
  target_type: varchar('target_type', { length: 32 }),
  target_id: text('target_id'),
  detail: jsonb('detail'),
  evidence: jsonb('evidence'),
  ai_analysis: text('ai_analysis'),
  related_bai_case: text('related_bai_case'),
  status: varchar('status', { length: 32 }).notNull(),
  plain_explanation: text('plain_explanation'),
  why_it_matters: text('why_it_matters'),
  citizen_impact: text('citizen_impact'),
  what_should_happen: text('what_should_happen'),
  real_case_example: text('real_case_example'),
  related_links: jsonb('related_links'),
  contracts: jsonb('contracts'),
  timeline: jsonb('timeline'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ─── Bills ──────────────────────────────────────────────────
export const bills = pgTable('bills', {
  id: varchar('id', { length: 32 }).primaryKey(),
  bill_no: varchar('bill_no', { length: 32 }),
  title: text('title').notNull(),
  proposed_date: varchar('proposed_date', { length: 10 }),
  proposer_type: varchar('proposer_type', { length: 16 }),
  proposer_name: text('proposer_name'),
  committee: text('committee'),
  status: varchar('status', { length: 32 }),
  status_detail: text('status_detail'),
  vote_result: jsonb('vote_result'),
  ai_summary: text('ai_summary'),
  ai_category: varchar('ai_category', { length: 32 }),
  ai_controversy_score: real('ai_controversy_score'),
  ai_citizen_impact: text('ai_citizen_impact'),
  co_sponsors_count: integer('co_sponsors_count'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ─── News Events ────────────────────────────────────────────
export const newsEvents = pgTable('news_events', {
  id: varchar('id', { length: 32 }).primaryKey(),
  title: text('title').notNull(),
  event_date: varchar('event_date', { length: 10 }),
  category: varchar('category', { length: 32 }),
  ai_summary: text('ai_summary'),
  key_facts: jsonb('key_facts'),
  progressive_frame: jsonb('progressive_frame'),
  conservative_frame: jsonb('conservative_frame'),
  citizen_takeaway: text('citizen_takeaway'),
  article_count: integer('article_count'),
  coverage: jsonb('coverage'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ─── Legislators ────────────────────────────────────────────
export const legislators = pgTable('legislators', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: text('name').notNull(),
  name_en: text('name_en'),
  party: text('party'),
  district: text('district'),
  region: varchar('region', { length: 32 }),
  elected_count: integer('elected_count'),
  committee: text('committee'),
  attendance_rate: real('attendance_rate'),
  vote_participation_rate: real('vote_participation_rate'),
  pledge_fulfillment_rate: real('pledge_fulfillment_rate'),
  ai_activity_score: real('ai_activity_score'),
  consistency_score: real('consistency_score'),
  bills_proposed_count: integer('bills_proposed_count'),
  bills_passed_count: integer('bills_passed_count'),
  speech_count: integer('speech_count'),
  asset_total: real('asset_total'),
  age: integer('age'),
  gender: varchar('gender', { length: 4 }),
  career_summary: text('career_summary'),
  consistency_details: jsonb('consistency_details'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ─── Department Scores ──────────────────────────────────────
export const departmentScores = pgTable('department_scores', {
  id: serial('id').primaryKey(),
  department: text('department').notNull(),
  year: integer('year'),
  quarter: integer('quarter'),
  suspicion_score: real('suspicion_score').notNull(),
  flag_count: integer('flag_count').notNull(),
  transparency_rank: integer('transparency_rank'),
  details: jsonb('details'),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── Data Sync Log ──────────────────────────────────────────
export const dataSyncLog = pgTable('data_sync_log', {
  id: serial('id').primaryKey(),
  source: varchar('source', { length: 32 }).notNull(),
  status: varchar('status', { length: 16 }).notNull(),
  records_fetched: integer('records_fetched'),
  records_updated: integer('records_updated'),
  started_at: timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  error_message: text('error_message'),
});
