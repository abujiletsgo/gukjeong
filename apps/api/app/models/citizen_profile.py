"""시민 프로필 모델"""
from datetime import datetime
from sqlalchemy import Column, String, Boolean, SmallInteger, ForeignKey, ARRAY, Text
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
from app.db.database import Base


class CitizenProfile(Base):
    __tablename__ = "citizen_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    age_group = Column(String(10))
    gender = Column(String(10))
    region_sido = Column(String(20))
    job_category = Column(String(30))
    income_bracket = Column(String(20))
    education = Column(String(20))
    housing_type = Column(String(20))
    marital_status = Column(String(20))
    has_children = Column(Boolean)
    children_count = Column(SmallInteger)
    interests = Column(ARRAY(Text))
    political_self = Column(String(20))
    profile_level = Column(SmallInteger, default=0)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")
