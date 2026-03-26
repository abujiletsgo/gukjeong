"""국회의원 모델"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Text, SmallInteger, Integer, BigInteger, Boolean, ForeignKey, DECIMAL, ARRAY
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base


class Legislator(Base):
    __tablename__ = "legislators"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assembly_id = Column(String(30), unique=True)
    name = Column(String(50), nullable=False)
    name_en = Column(String(100))
    party = Column(String(50))
    district = Column(String(100))
    term_number = Column(SmallInteger)
    committee = Column(String(100))
    photo_url = Column(Text)
    bills_proposed_count = Column(Integer, default=0)
    attendance_rate = Column(DECIMAL(5, 2))
    vote_participation_rate = Column(DECIMAL(5, 2))
    asset_declared = Column(BigInteger)
    asset_change = Column(BigInteger)
    political_fund_income = Column(BigInteger)
    political_fund_expense = Column(BigInteger)
    pledge_fulfillment_rate = Column(DECIMAL(5, 2))
    ai_activity_score = Column(SmallInteger)
    consistency_score = Column(DECIMAL(5, 2))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    speeches = relationship("LegislatorSpeech", back_populates="legislator")
    votes = relationship("LegislatorVote", back_populates="legislator")
    consistency_analyses = relationship("ConsistencyAnalysis", back_populates="legislator")


class LegislatorSpeech(Base):
    __tablename__ = "legislator_speeches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    legislator_id = Column(UUID(as_uuid=True), ForeignKey("legislators.id"))
    session_type = Column(String(20))
    speech_date = Column(Date)
    content_summary = Column(Text)
    extracted_positions = Column(JSONB)
    keywords = Column(ARRAY(Text))
    duration_minutes = Column(Integer)
    source_url = Column(Text)

    legislator = relationship("Legislator", back_populates="speeches")


class LegislatorVote(Base):
    __tablename__ = "legislator_votes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    legislator_id = Column(UUID(as_uuid=True), ForeignKey("legislators.id"))
    bill_id = Column(UUID(as_uuid=True), ForeignKey("bills.id"))
    vote = Column(String(10))
    party_line = Column(String(10))
    crossed_party_line = Column(Boolean, default=False)
    vote_date = Column(Date)

    legislator = relationship("Legislator", back_populates="votes")

    __table_args__ = (
        {"schema": None},
    )


class ConsistencyAnalysis(Base):
    __tablename__ = "consistency_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    legislator_id = Column(UUID(as_uuid=True), ForeignKey("legislators.id"))
    issue = Column(String(200))
    stated_position = Column(String(20))
    speech_date = Column(Date)
    speech_summary = Column(Text)
    actual_vote = Column(String(10))
    vote_date = Column(Date)
    bill_id = Column(UUID(as_uuid=True), ForeignKey("bills.id"))
    is_consistent = Column(Boolean)
    ai_analysis = Column(Text)

    legislator = relationship("Legislator", back_populates="consistency_analyses")
