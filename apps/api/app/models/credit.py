"""크레딧 및 뱃지 모델"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
from app.db.database import Base


class Credit(Base):
    __tablename__ = "credits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    amount = Column(Integer, nullable=False)
    reason = Column(String(50))
    description = Column(Text)
    balance_after = Column(Integer)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="credits")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    badge_type = Column(String(50))
    earned_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="badges")
