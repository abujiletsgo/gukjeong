"""계약 및 감사 모델"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Text, SmallInteger, Integer, BigInteger, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, JSONB
from app.db.database import Base


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    g2b_id = Column(String(50), unique=True)
    title = Column(String(500))
    department = Column(String(100))
    vendor_name = Column(String(200))
    vendor_id = Column(String(50))
    amount = Column(BigInteger)
    contract_method = Column(String(30))
    contract_date = Column(Date)
    category = Column(String(30))
    item_name = Column(String(200))
    location = Column(Text)
    duration_days = Column(Integer)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("idx_contracts_dept_date", "department", "contract_date"),
        Index("idx_contracts_vendor", "vendor_id"),
        Index("idx_contracts_amount", "amount"),
    )
