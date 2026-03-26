"""대통령 및 정책 모델"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Text, SmallInteger, ForeignKey, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, JSONB
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


class Policy(Base):
    __tablename__ = "policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    president_id = Column(String(10), ForeignKey("presidents.id"))
    title = Column(String(200), nullable=False)
    category = Column(String(30))
    description = Column(Text)
    budget_allocated = Column(Text)
    budget_spent = Column(Text)
    status = Column(String(30))
    impact_score = Column(SmallInteger)
    ai_summary = Column(Text)
    ai_citizen_impact = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
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
