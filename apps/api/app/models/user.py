"""사용자 모델"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, SmallInteger, ForeignKey, ARRAY, Text
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auth_hash = Column(String(64), unique=True, nullable=False)
    nickname = Column(String(50))
    email = Column(String(255))
    auth_provider = Column(String(20), nullable=False)
    tier = Column(String(20), default="free")
    region_sido = Column(String(20))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("CitizenProfile", back_populates="user", uselist=False)
    subscriptions = relationship("Subscription", back_populates="user")
    credits = relationship("Credit", back_populates="user")
    badges = relationship("Badge", back_populates="user")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    tier = Column(String(20), nullable=False)
    status = Column(String(20), default="active")
    payment_provider = Column(String(20))
    billing_key = Column(Text)
    amount = Column(Integer)
    started_at = Column(TIMESTAMP(timezone=True))
    expires_at = Column(TIMESTAMP(timezone=True))
    cancelled_at = Column(TIMESTAMP(timezone=True))

    user = relationship("User", back_populates="subscriptions")


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    key_hash = Column(String(64), unique=True)
    name = Column(String(100))
    calls_this_month = Column(Integer, default=0)
    monthly_limit = Column(Integer, default=50000)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
