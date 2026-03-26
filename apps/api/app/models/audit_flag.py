"""감사 플래그 모델"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, SmallInteger, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base


class AuditFlag(Base):
    __tablename__ = "audit_flags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_type = Column(String(20))
    target_id = Column(String(100))
    pattern_type = Column(String(50))
    severity = Column(String(10))
    suspicion_score = Column(SmallInteger)
    detail = Column(JSONB)
    evidence = Column(JSONB)
    ai_analysis = Column(Text)
    related_bai_case = Column(Text)
    status = Column(String(20), default="detected")
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    petitions = relationship("AuditPetition", back_populates="audit_flag")


class AuditDepartmentScore(Base):
    __tablename__ = "audit_department_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    department = Column(String(100))
    year = Column(SmallInteger)
    quarter = Column(SmallInteger)
    suspicion_score = Column(SmallInteger)
    flag_count = Column(Integer)
    transparency_rank = Column(Integer)
    details = Column(JSONB)

    __table_args__ = (UniqueConstraint("department", "year", "quarter"),)
