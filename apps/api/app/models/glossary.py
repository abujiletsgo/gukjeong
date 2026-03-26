"""용어 사전, 시민 참여, 댓글, 사용 로그 모델"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, BigInteger, SmallInteger, Boolean, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base


class Glossary(Base):
    __tablename__ = "glossary"

    id = Column(Integer, primary_key=True, autoincrement=True)
    term = Column(String(100), nullable=False, unique=True)
    simple_explanation = Column(Text, nullable=False)
    detailed_explanation = Column(Text)
    example = Column(Text)
    related_terms = Column(ARRAY(Text))
    category = Column(String(30))


class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    report_type = Column(String(30))
    location = Column(Text)
    description = Column(Text)
    photo_urls = Column(ARRAY(Text))
    related_audit_flag_id = Column(UUID(as_uuid=True), ForeignKey("audit_flags.id"))
    status = Column(String(20), default="submitted")
    upvotes = Column(Integer, default=0)
    submitted_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)


class AuditPetition(Base):
    __tablename__ = "audit_petitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_flag_id = Column(UUID(as_uuid=True), ForeignKey("audit_flags.id"))
    title = Column(String(300))
    description = Column(Text)
    signature_count = Column(Integer, default=0)
    target_count = Column(Integer, default=300)
    status = Column(String(20), default="collecting")
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    audit_flag = relationship("AuditFlag", back_populates="petitions")


class Comment(Base):
    """댓글 — 카카오/네이버 KYC 인증 사용자만 작성 가능"""
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    # 댓글 대상: bill, audit_flag, news_event, survey, policy 등
    target_type = Column(String(30), nullable=False)  # e.g. "bill", "audit_flag"
    target_id = Column(String(100), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("comments.id"), nullable=True)  # 대댓글
    content = Column(Text, nullable=False)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # 자식 댓글
    replies = relationship("Comment", back_populates="parent", cascade="all, delete-orphan")
    parent = relationship("Comment", remote_side="Comment.id", back_populates="replies")
    user = relationship("User")


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True))
    action = Column(String(30))
    endpoint = Column(String(200))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)


class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True))
    query = Column(Text)
    filters = Column(JSONB)
    result_count = Column(Integer)
    tier = Column(String(20))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
