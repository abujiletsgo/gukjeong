"""설문조사 모델"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, SmallInteger, Integer, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    context_data = Column(JSONB)
    status = Column(String(20), default="draft")
    related_policy_id = Column(UUID(as_uuid=True), ForeignKey("policies.id"))
    related_bill_id = Column(UUID(as_uuid=True), ForeignKey("bills.id"))
    total_responses = Column(Integer, default=0)
    representativeness_score = Column(SmallInteger)
    opened_at = Column(TIMESTAMP(timezone=True))
    closed_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    questions = relationship("SurveyQuestion", back_populates="survey")


class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    survey_id = Column(UUID(as_uuid=True), ForeignKey("surveys.id"))
    question_text = Column(Text, nullable=False)
    question_type = Column(String(20))
    options = Column(JSONB)
    order_num = Column(SmallInteger)
    phase = Column(String(10))

    survey = relationship("Survey", back_populates="questions")


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    survey_id = Column(UUID(as_uuid=True), ForeignKey("surveys.id"))
    question_id = Column(UUID(as_uuid=True), ForeignKey("survey_questions.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    answer = Column(JSONB)
    demographics_snapshot = Column(JSONB)
    phase = Column(String(10))
    responded_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("survey_id", "user_id", "question_id", "phase"),)


class SurveyAggregate(Base):
    __tablename__ = "survey_aggregates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    survey_id = Column(UUID(as_uuid=True), ForeignKey("surveys.id"))
    question_id = Column(UUID(as_uuid=True))
    dimension = Column(String(30))
    dimension_value = Column(String(50))
    answer_value = Column(String(100))
    count = Column(Integer)
    phase = Column(String(10))
    is_published = Column(Boolean, default=False)
    calculated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
