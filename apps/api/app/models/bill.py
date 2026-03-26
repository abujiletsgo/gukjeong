"""법안 모델"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Text, SmallInteger, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, JSONB
from pgvector.sqlalchemy import Vector
from app.db.database import Base


class Bill(Base):
    __tablename__ = "bills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bill_no = Column(String(30), unique=True)
    title = Column(String(500), nullable=False)
    proposed_date = Column(Date)
    proposer_type = Column(String(20))
    proposer_name = Column(String(100))
    co_sponsors = Column(ARRAY(Text))
    committee = Column(String(100))
    status = Column(String(30))
    vote_result = Column(JSONB)
    full_text_url = Column(Text)
    ai_summary = Column(Text)
    ai_citizen_impact = Column(Text)
    ai_category = Column(String(30))
    ai_controversy_score = Column(SmallInteger)
    related_policy_id = Column(UUID(as_uuid=True), ForeignKey("policies.id"))
    embedding = Column(Vector(1536))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
