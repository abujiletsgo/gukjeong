# architecture.md — System Architecture

## Database Schema (PostgreSQL 16 + pgvector)

### Core Tables

```sql
-- ══════════════════════════════════════
-- AUTH & USERS
-- ══════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_hash VARCHAR(64) UNIQUE NOT NULL,
  nickname VARCHAR(50),
  email VARCHAR(255),
  auth_provider VARCHAR(20) NOT NULL,
  tier VARCHAR(20) DEFAULT 'free',
  region_sido VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE citizen_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age_group VARCHAR(10),
  gender VARCHAR(10),
  region_sido VARCHAR(20),
  job_category VARCHAR(30),
  income_bracket VARCHAR(20),
  education VARCHAR(20),
  housing_type VARCHAR(20),
  marital_status VARCHAR(20),
  has_children BOOLEAN,
  children_count SMALLINT,
  interests TEXT[],
  political_self VARCHAR(20),
  profile_level SMALLINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  tier VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  payment_provider VARCHAR(20),
  billing_key TEXT,
  amount INT,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  key_hash VARCHAR(64) UNIQUE,
  name VARCHAR(100),
  calls_this_month INT DEFAULT 0,
  monthly_limit INT DEFAULT 50000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INT NOT NULL,
  reason VARCHAR(50),
  description TEXT,
  balance_after INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  badge_type VARCHAR(50),
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════
-- PRESIDENTS & POLICIES
-- ══════════════════════════════════════

CREATE TABLE presidents (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  name_en VARCHAR(100),
  term_start DATE NOT NULL,
  term_end DATE,
  party VARCHAR(100),
  era VARCHAR(50),
  portrait_url TEXT,
  gdp_growth_avg DECIMAL(4,2),
  key_metric TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  president_id VARCHAR(10) REFERENCES presidents(id),
  title VARCHAR(200) NOT NULL,
  category VARCHAR(30),
  description TEXT,
  budget_allocated TEXT,
  budget_spent TEXT,
  status VARCHAR(30),
  impact_score SMALLINT,
  ai_summary TEXT,
  ai_citizen_impact TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE key_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  president_id VARCHAR(10) REFERENCES presidents(id),
  event_date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  impact_type VARCHAR(20),
  significance_score SMALLINT
);

CREATE TABLE presidential_governance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  president_id VARCHAR(10) REFERENCES presidents(id),
  category VARCHAR(30),
  metric_name VARCHAR(100),
  metric_value DECIMAL(10,2),
  metric_unit VARCHAR(20),
  year SMALLINT,
  details JSONB
);

CREATE TABLE pledge_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_type VARCHAR(20),
  politician_id VARCHAR(100),
  pledge_text TEXT,
  pledge_category VARCHAR(30),
  pledge_date DATE,
  status VARCHAR(20),
  evidence TEXT,
  related_bill_id UUID,
  related_budget TEXT,
  ai_assessment TEXT,
  last_updated TIMESTAMPTZ
);

-- ══════════════════════════════════════
-- FISCAL / BUDGET
-- ══════════════════════════════════════

CREATE TABLE fiscal_yearly (
  year SMALLINT PRIMARY KEY,
  total_spending DECIMAL(12,1),
  total_revenue DECIMAL(12,1),
  tax_revenue DECIMAL(12,1),
  national_debt DECIMAL(12,1),
  gdp DECIMAL(12,1),
  debt_to_gdp DECIMAL(5,2),
  fiscal_balance DECIMAL(12,1),
  president_id VARCHAR(10) REFERENCES presidents(id)
);

CREATE TABLE fiscal_by_sector (
  id SERIAL PRIMARY KEY,
  year SMALLINT NOT NULL,
  sector VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2),
  percentage DECIMAL(5,2),
  yoy_change DECIMAL(5,2),
  UNIQUE(year, sector)
);

CREATE TABLE fiscal_by_department (
  id SERIAL PRIMARY KEY,
  year SMALLINT NOT NULL,
  department VARCHAR(100) NOT NULL,
  budget_proposed BIGINT,
  budget_approved BIGINT,
  budget_executed BIGINT,
  execution_rate DECIMAL(5,2),
  UNIQUE(year, department)
);

-- ══════════════════════════════════════
-- BILLS / LEGISLATURE
-- ══════════════════════════════════════

CREATE TABLE legislators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id VARCHAR(30) UNIQUE,
  name VARCHAR(50) NOT NULL,
  name_en VARCHAR(100),
  party VARCHAR(50),
  district VARCHAR(100),
  term_number SMALLINT,
  committee VARCHAR(100),
  photo_url TEXT,
  bills_proposed_count INT DEFAULT 0,
  attendance_rate DECIMAL(5,2),
  vote_participation_rate DECIMAL(5,2),
  asset_declared BIGINT,
  asset_change BIGINT,
  political_fund_income BIGINT,
  political_fund_expense BIGINT,
  pledge_fulfillment_rate DECIMAL(5,2),
  ai_activity_score SMALLINT,
  consistency_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no VARCHAR(30) UNIQUE,
  title VARCHAR(500) NOT NULL,
  proposed_date DATE,
  proposer_type VARCHAR(20),
  proposer_name VARCHAR(100),
  co_sponsors TEXT[],
  committee VARCHAR(100),
  status VARCHAR(30),
  vote_result JSONB,
  full_text_url TEXT,
  ai_summary TEXT,
  ai_citizen_impact TEXT,
  ai_category VARCHAR(30),
  ai_controversy_score SMALLINT,
  related_policy_id UUID REFERENCES policies(id),
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE legislator_speeches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislator_id UUID REFERENCES legislators(id),
  session_type VARCHAR(20),
  speech_date DATE,
  content_summary TEXT,
  extracted_positions JSONB,
  keywords TEXT[],
  duration_minutes INT,
  source_url TEXT
);

CREATE TABLE legislator_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislator_id UUID REFERENCES legislators(id),
  bill_id UUID REFERENCES bills(id),
  vote VARCHAR(10),
  party_line VARCHAR(10),
  crossed_party_line BOOLEAN DEFAULT false,
  vote_date DATE,
  UNIQUE(legislator_id, bill_id)
);

CREATE TABLE consistency_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislator_id UUID REFERENCES legislators(id),
  issue VARCHAR(200),
  stated_position VARCHAR(20),
  speech_date DATE,
  speech_summary TEXT,
  actual_vote VARCHAR(10),
  vote_date DATE,
  bill_id UUID REFERENCES bills(id),
  is_consistent BOOLEAN,
  ai_analysis TEXT
);

-- ══════════════════════════════════════
-- CONTRACTS / AI AUDIT
-- ══════════════════════════════════════

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  g2b_id VARCHAR(50) UNIQUE,
  title VARCHAR(500),
  department VARCHAR(100),
  vendor_name VARCHAR(200),
  vendor_id VARCHAR(50),
  amount BIGINT,
  contract_method VARCHAR(30),
  contract_date DATE,
  category VARCHAR(30),
  item_name VARCHAR(200),
  location TEXT,
  duration_days INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contracts_dept_date ON contracts(department, contract_date);
CREATE INDEX idx_contracts_vendor ON contracts(vendor_id);
CREATE INDEX idx_contracts_amount ON contracts(amount);

CREATE TABLE audit_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type VARCHAR(20),
  target_id VARCHAR(100),
  pattern_type VARCHAR(50),
  severity VARCHAR(10),
  suspicion_score SMALLINT,
  detail JSONB,
  evidence JSONB,
  ai_analysis TEXT,
  related_bai_case TEXT,
  status VARCHAR(20) DEFAULT 'detected',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_department_scores (
  id SERIAL PRIMARY KEY,
  department VARCHAR(100),
  year SMALLINT,
  quarter SMALLINT,
  suspicion_score SMALLINT,
  flag_count INT,
  transparency_rank INT,
  details JSONB,
  UNIQUE(department, year, quarter)
);

-- ══════════════════════════════════════
-- NEWS / MEDIA
-- ══════════════════════════════════════

CREATE TABLE media_outlets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20),
  spectrum_score DECIMAL(2,1),
  category VARCHAR(20),
  rss_url TEXT,
  website_url TEXT,
  owner VARCHAR(200),
  founded_year SMALLINT,
  description TEXT,
  logo_url TEXT
);

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  source_id VARCHAR(50) REFERENCES media_outlets(id),
  published_at TIMESTAMPTZ,
  category VARCHAR(30),
  author VARCHAR(100),
  ai_summary TEXT,
  sentiment_score DECIMAL(3,2),
  sentiment_label VARCHAR(10),
  frame_keywords TEXT[],
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE news_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE,
  category VARCHAR(30),
  ai_summary TEXT,
  key_facts JSONB,
  progressive_frame JSONB,
  conservative_frame JSONB,
  citizen_takeaway TEXT,
  article_count INT,
  related_policy_id UUID REFERENCES policies(id),
  related_bill_id UUID REFERENCES bills(id)
);

CREATE TABLE news_event_articles (
  event_id UUID REFERENCES news_events(id),
  article_id UUID REFERENCES articles(id),
  PRIMARY KEY (event_id, article_id)
);

-- ══════════════════════════════════════
-- SURVEYS
-- ══════════════════════════════════════

CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  context_data JSONB,
  status VARCHAR(20) DEFAULT 'draft',
  related_policy_id UUID REFERENCES policies(id),
  related_bill_id UUID REFERENCES bills(id),
  total_responses INT DEFAULT 0,
  representativeness_score SMALLINT,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id),
  question_text TEXT NOT NULL,
  question_type VARCHAR(20),
  options JSONB,
  order_num SMALLINT,
  phase VARCHAR(10)
);

CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id),
  question_id UUID REFERENCES survey_questions(id),
  user_id UUID REFERENCES users(id),
  answer JSONB,
  demographics_snapshot JSONB,
  phase VARCHAR(10),
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(survey_id, user_id, question_id, phase)
);

CREATE TABLE survey_aggregates (
  id SERIAL PRIMARY KEY,
  survey_id UUID REFERENCES surveys(id),
  question_id UUID,
  dimension VARCHAR(30),
  dimension_value VARCHAR(50),
  answer_value VARCHAR(100),
  count INT,
  phase VARCHAR(10),
  is_published BOOLEAN DEFAULT false,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════
-- CITIZEN PARTICIPATION
-- ══════════════════════════════════════

CREATE TABLE citizen_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  report_type VARCHAR(30),
  location TEXT,
  description TEXT,
  photo_urls TEXT[],
  related_audit_flag_id UUID REFERENCES audit_flags(id),
  status VARCHAR(20) DEFAULT 'submitted',
  upvotes INT DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_petitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_flag_id UUID REFERENCES audit_flags(id),
  title VARCHAR(300),
  description TEXT,
  signature_count INT DEFAULT 0,
  target_count INT DEFAULT 300,
  status VARCHAR(20) DEFAULT 'collecting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════
-- GLOSSARY
-- ══════════════════════════════════════

CREATE TABLE glossary (
  id SERIAL PRIMARY KEY,
  term VARCHAR(100) NOT NULL UNIQUE,
  simple_explanation TEXT NOT NULL,
  detailed_explanation TEXT,
  example TEXT,
  related_terms TEXT[],
  category VARCHAR(30)
);

-- ══════════════════════════════════════
-- USAGE TRACKING
-- ══════════════════════════════════════

CREATE TABLE usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  action VARCHAR(30),
  endpoint VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE search_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  query TEXT,
  filters JSONB,
  result_count INT,
  tier VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Design (FastAPI)

### Public (no auth)
```
GET  /api/v1/presidents                    # List all
GET  /api/v1/presidents/{id}               # Detail + policies + events
GET  /api/v1/budget/yearly                 # Fiscal time series
GET  /api/v1/budget/sectors?year=2024      # Sector breakdown
GET  /api/v1/audit/heatmap                 # Department suspicion scores
GET  /api/v1/audit/{id}                    # Flag detail (summary only)
GET  /api/v1/news/today                    # Today's frame comparison
GET  /api/v1/surveys/active                # Active surveys
GET  /api/v1/glossary/{term}               # Term definition
```

### Auth required (free tier)
```
GET  /api/v1/search?q=...&page=...         # Rate limited (15/day)
GET  /api/v1/legislators/{id}              # Basic scorecard
POST /api/v1/surveys/{id}/respond          # Submit survey response
POST /api/v1/reports                       # Citizen report
GET  /api/v1/credits/balance               # Credit balance
```

### Pro tier
```
GET  /api/v1/search?q=...&filters=...      # Unlimited + all filters
GET  /api/v1/audit/flags?dept=...          # Full flag list
GET  /api/v1/legislators/ranking           # Full ranking
GET  /api/v1/legislators/{id}/consistency  # Words vs actions detail
GET  /api/v1/budget/department/{name}      # Department drill-down
GET  /api/v1/download/{resource}.csv       # CSV download (10/month)
```

### Institution tier
```
GET  /api/v1/data/export/{resource}        # Bulk JSON export
GET  /api/v1/surveys/{id}/aggregates       # Survey aggregate data
POST /api/v1/surveys/custom                # Create custom survey
POST /api/v1/ai/query                      # AI natural language query
GET  /api/v1/embed/{chart_type}            # Embeddable widget
```

## Celery Task Schedule

```python
# etl/scheduler.py

CELERYBEAT_SCHEDULE = {
    # Every 30 min: RSS news collection
    'collect-news-rss': {
        'task': 'etl.tasks.collect_news_rss',
        'schedule': crontab(minute='*/30'),
    },
    # Daily 3 AM: New contracts from 나라장터
    'collect-contracts': {
        'task': 'etl.tasks.collect_contracts',
        'schedule': crontab(hour=3, minute=0),
    },
    # Daily 4 AM: Run audit patterns on new contracts
    'run-audit-patterns': {
        'task': 'etl.tasks.run_audit_patterns',
        'schedule': crontab(hour=4, minute=0),
    },
    # Daily 5 AM: Cluster news events
    'cluster-news': {
        'task': 'etl.tasks.cluster_and_analyze_news',
        'schedule': crontab(hour=5, minute=0),
    },
    # Weekly Sunday 2 AM: Department audit scores
    'weekly-audit-scores': {
        'task': 'etl.tasks.calculate_department_scores',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),
    },
    # Weekly Monday 6 AM: Legislator activity update
    'weekly-legislator-update': {
        'task': 'etl.tasks.update_legislator_stats',
        'schedule': crontab(hour=6, minute=0, day_of_week=1),
    },
    # Monthly 1st 1 AM: Full fiscal data refresh
    'monthly-fiscal-refresh': {
        'task': 'etl.tasks.refresh_fiscal_data',
        'schedule': crontab(hour=1, minute=0, day_of_month=1),
    },
    # Daily 3:30 AM: Neon backup to local
    'daily-backup': {
        'task': 'etl.tasks.backup_database',
        'schedule': crontab(hour=3, minute=30),
    },
}
```

## Rate Limiting

```python
TIER_LIMITS = {
    "anonymous":       {"search_per_day": 5,  "results": 10, "filters": ["year","sector"]},
    "free_registered": {"search_per_day": 15, "results": 20, "filters": ["year","sector","department"]},
    "citizen_pro":     {"search_per_day": -1, "results": 100, "filters": "all", "downloads": 10},
    "institution":     {"search_per_day": -1, "results": -1, "filters": "all", "api": 100000},
    "api_only":        {"api_calls_per_month": 50000},
}
```
