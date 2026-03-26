"""뉴스 기사 모델"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, SmallInteger, ForeignKey, DECIMAL, ARRAY
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from pgvector.sqlalchemy import Vector
from app.db.database import Base


class MediaOutlet(Base):
    __tablename__ = "media_outlets"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20))
    spectrum_score = Column(DECIMAL(2, 1))
    category = Column(String(20))
    rss_url = Column(Text)
    website_url = Column(Text)
    owner = Column(String(200))
    founded_year = Column(SmallInteger)
    description = Column(Text)
    logo_url = Column(Text)


class Article(Base):
    __tablename__ = "articles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    url = Column(Text, unique=True, nullable=False)
    source_id = Column(String(50), ForeignKey("media_outlets.id"))
    published_at = Column(TIMESTAMP(timezone=True))
    category = Column(String(30))
    author = Column(String(100))
    ai_summary = Column(Text)
    sentiment_score = Column(DECIMAL(3, 2))
    sentiment_label = Column(String(10))
    frame_keywords = Column(ARRAY(Text))
    embedding = Column(Vector(1536))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
