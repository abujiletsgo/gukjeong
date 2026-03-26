"""대통령 및 정책 모델"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Text, SmallInteger, ForeignKey, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, JSONB, ARRAY
from sqlalchemy.orm import relationship
from app.db.database import Base


class President(Base):
    __tablename__ = "presidents"

    id = Column(String(10), primary_key=True)
    name = Column(String(50), nullable=False)
    name_en = Column(String(100))
    term_start = Column(Date, nullable=False)
    term_end = Column(Date)
    party = Column(String(100))
    era = Column(String(50))
    portrait_url = Column(Text)
    gdp_growth_avg = Column(DECIMAL(4, 2))
    key_metric = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    policies = relationship("Policy", back_populates="president")
    key_events = relationship("KeyEvent", back_populates="president")
    governance = relationship("PresidentialGovernance", back_populates="president")
    fiscal_years = relationship("FiscalYearly", back_populates="president")
    national_agenda = relationship("NationalAgenda", back_populates="president", cascade="all, delete-orphan")
    report_card = relationship("PresidentialReportCard", back_populates="president", cascade="all, delete-orphan")


class Policy(Base):
    __tablename__ = "policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    president_id = Column(String(10), ForeignKey("presidents.id"))
    title = Column(String(200), nullable=False)
    category = Column(String(30))
    description = Column(Text)
    budget_allocated = Column(DECIMAL(14, 2))
    budget_spent = Column(DECIMAL(14, 2))
    status = Column(String(30))
    impact_score = Column(SmallInteger)
    ai_summary = Column(Text)
    ai_citizen_impact = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    pledge_source = Column(String(30))       # 공약집/취임사/시정연설/국정과제
    pledge_type = Column(String(20))         # campaign/executive/legislative
    fulfillment_status = Column(String(20))  # 이행완료/추진중/미이행/일부이행/폐기/보류
    fulfillment_pct = Column(DECIMAL(5, 2))  # 0-100%
    outcome_metrics = Column(JSONB)          # structured outcome data
    source_url = Column(Text)
    evidence_url = Column(Text)
    priority_rank = Column(SmallInteger)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    president = relationship("President", back_populates="policies")


class KeyEvent(Base):
    __tablename__ = "key_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    president_id = Column(String(10), ForeignKey("presidents.id"))
    event_date = Column(Date, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    impact_type = Column(String(20))
    significance_score = Column(SmallInteger)

    president = relationship("President", back_populates="key_events")


class PresidentialGovernance(Base):
    __tablename__ = "presidential_governance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    president_id = Column(String(10), ForeignKey("presidents.id"))
    category = Column(String(30))
    metric_name = Column(String(100))
    metric_value = Column(DECIMAL(10, 2))
    metric_unit = Column(String(20))
    year = Column(SmallInteger)
    details = Column(JSONB)

    president = relationship("President", back_populates="governance")


class PledgeTracking(Base):
    __tablename__ = "pledge_tracking"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    politician_type = Column(String(20))
    politician_id = Column(String(100))
    pledge_text = Column(Text)
    pledge_category = Column(String(30))
    pledge_date = Column(Date)
    status = Column(String(20))
    evidence = Column(Text)
    related_bill_id = Column(UUID(as_uuid=True))
    related_budget = Column(Text)
    ai_assessment = Column(Text)
    last_updated = Column(TIMESTAMP(timezone=True))


class NationalAgenda(Base):
    """국정과제 — 대통령별 공식 국정운영 과제"""
    __tablename__ = "national_agenda"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    president_id = Column(String(10), ForeignKey("presidents.id"))
    agenda_number = Column(SmallInteger)                     # 과제 번호
    goal_category = Column(String(100))                      # 국정목표
    strategy = Column(String(200))                           # 국정전략
    title = Column(String(300), nullable=False)              # 과제명
    description = Column(Text)

    # 이행 현황
    implementation_status = Column(String(20), default="추진중")  # 완료/추진중/미착수/폐기
    completion_rate = Column(DECIMAL(5, 2), default=0)            # 0-100%

    # 예산
    budget_committed = Column(DECIMAL(14, 2))   # 투입 예산 (억원)
    budget_executed = Column(DECIMAL(14, 2))     # 집행 예산

    # 성과
    target_metric = Column(String(200))   # 목표 지표
    target_value = Column(String(100))    # 목표치
    actual_value = Column(String(100))    # 실적치
    outcome_summary = Column(Text)        # 성과 요약

    # AI 분석
    ai_assessment = Column(Text)
    ai_citizen_impact = Column(Text)

    # 관련 법안/정책
    related_bill_ids = Column(ARRAY(Text))
    related_policy_id = Column(UUID(as_uuid=True), ForeignKey("policies.id"), nullable=True)

    source_url = Column(Text)
    last_verified = Column(Date)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    president = relationship("President", back_populates="national_agenda")


class PresidentialReportCard(Base):
    """대통령 성과표 — 취임 전후 핵심 지표 비교"""
    __tablename__ = "presidential_report_card"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    president_id = Column(String(10), ForeignKey("presidents.id"))
    category = Column(String(30))        # 경제/사회/외교/복지/부동산/고용
    metric_name = Column(String(100))    # e.g., "실업률"
    metric_name_en = Column(String(100))

    baseline_value = Column(DECIMAL(12, 3))   # 취임 시
    baseline_year = Column(SmallInteger)
    target_value = Column(DECIMAL(12, 3))     # 목표치 (공약)
    final_value = Column(DECIMAL(12, 3))      # 퇴임 시

    unit = Column(String(20))        # %, 조원, 만명, etc.
    trend = Column(String(10))       # improved/worsened/stable
    grade = Column(String(5))        # A/B/C/D/F (AI-generated)

    source = Column(String(100))     # 한국은행, 통계청, etc.
    source_url = Column(Text)
    note = Column(Text)

    president = relationship("President", back_populates="report_card")
