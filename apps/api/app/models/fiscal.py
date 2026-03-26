"""재정 데이터 모델"""
from sqlalchemy import Column, String, SmallInteger, Integer, BigInteger, DECIMAL, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class FiscalYearly(Base):
    __tablename__ = "fiscal_yearly"

    year = Column(SmallInteger, primary_key=True)
    total_spending = Column(DECIMAL(12, 1))
    total_revenue = Column(DECIMAL(12, 1))
    tax_revenue = Column(DECIMAL(12, 1))
    national_debt = Column(DECIMAL(12, 1))
    gdp = Column(DECIMAL(12, 1))
    debt_to_gdp = Column(DECIMAL(5, 2))
    fiscal_balance = Column(DECIMAL(12, 1))
    president_id = Column(String(10), ForeignKey("presidents.id"))

    president = relationship("President", back_populates="fiscal_years")


class FiscalBySector(Base):
    __tablename__ = "fiscal_by_sector"

    id = Column(Integer, primary_key=True, autoincrement=True)
    year = Column(SmallInteger, nullable=False)
    sector = Column(String(50), nullable=False)
    amount = Column(DECIMAL(12, 2))
    percentage = Column(DECIMAL(5, 2))
    yoy_change = Column(DECIMAL(5, 2))

    __table_args__ = (UniqueConstraint("year", "sector"),)


class FiscalByDepartment(Base):
    __tablename__ = "fiscal_by_department"

    id = Column(Integer, primary_key=True, autoincrement=True)
    year = Column(SmallInteger, nullable=False)
    department = Column(String(100), nullable=False)
    budget_proposed = Column(BigInteger)
    budget_approved = Column(BigInteger)
    budget_executed = Column(BigInteger)
    execution_rate = Column(DECIMAL(5, 2))

    __table_args__ = (UniqueConstraint("year", "department"),)
