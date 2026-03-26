"""뉴스 이벤트 클러스터 모델"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Date, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, JSONB
from app.db.database import Base


class NewsEvent(Base):
    __tablename__ = "news_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    event_date = Column(Date)
    category = Column(String(30))
    ai_summary = Column(Text)
    key_facts = Column(JSONB)
    progressive_frame = Column(JSONB)
    conservative_frame = Column(JSONB)
    citizen_takeaway = Column(Text)
    article_count = Column(Integer)
    related_policy_id = Column(UUID(as_uuid=True), ForeignKey("policies.id"))
    related_bill_id = Column(UUID(as_uuid=True), ForeignKey("bills.id"))


class NewsEventArticle(Base):
    __tablename__ = "news_event_articles"

    event_id = Column(UUID(as_uuid=True), ForeignKey("news_events.id"), primary_key=True)
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"), primary_key=True)
