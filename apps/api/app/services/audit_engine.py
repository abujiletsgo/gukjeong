"""AI 감사 엔진 — 10가지 의심 패턴 탐지"""
from typing import Optional
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.contract import Contract
from app.models.audit_flag import AuditFlag


# 패턴별 가중치
PATTERN_WEIGHTS = {
    "yearend_spike": 15,        # 연말 지출 급증
    "vendor_concentration": 15, # 업체 집중도
    "inflated_pricing": 20,     # 고가 계약
    "contract_splitting": 20,   # 계약 분할
    "zombie_project": 10,       # 좀비 사업
    "revolving_door": 30,       # 전관예우
    "paper_company": 25,        # 페이퍼 컴퍼니
    "unnecessary_renovation": 10, # 불필요 개보수
    "poor_roi": 20,             # 낮은 투자 수익
    "bid_rigging": 30,          # 입찰 담합
}


async def detect_yearend_spike(
    db: AsyncSession,
    department: str,
    year: int,
) -> Optional[dict]:
    """패턴 1: 연말 지출 급증 (Q4 > 40%)"""
    # Q4 지출 합계
    q4_result = await db.execute(
        select(func.sum(Contract.amount))
        .where(
            Contract.department == department,
            func.extract("year", Contract.contract_date) == year,
            func.extract("month", Contract.contract_date) >= 10,
        )
    )
    q4_total = q4_result.scalar() or 0

    # 연간 지출 합계
    yearly_result = await db.execute(
        select(func.sum(Contract.amount))
        .where(
            Contract.department == department,
            func.extract("year", Contract.contract_date) == year,
        )
    )
    yearly_total = yearly_result.scalar() or 1

    ratio = q4_total / yearly_total if yearly_total > 0 else 0

    if ratio > 0.4:
        return {
            "pattern_type": "yearend_spike",
            "severity": "HIGH" if ratio > 0.6 else "MEDIUM",
            "suspicion_score": PATTERN_WEIGHTS["yearend_spike"],
            "target_type": "department",
            "target_id": department,
            "detail": {
                "q4_ratio": round(ratio * 100, 1),
                "q4_total": q4_total,
                "yearly_total": yearly_total,
                "year": year,
            },
            "evidence": {
                "threshold": "40%",
                "actual": f"{ratio*100:.1f}%",
                "description": f"{department}의 {year}년 Q4 지출이 연간의 {ratio*100:.1f}%를 차지합니다.",
            },
        }
    return None


async def detect_vendor_concentration(
    db: AsyncSession,
    department: str,
    year: int,
) -> Optional[dict]:
    """패턴 2: 업체 집중도 (동일 업체 30% 이상 또는 3년 연속)"""
    result = await db.execute(
        select(
            Contract.vendor_id,
            Contract.vendor_name,
            func.count().label("count"),
            func.sum(Contract.amount).label("total"),
        )
        .where(
            Contract.department == department,
            func.extract("year", Contract.contract_date) == year,
        )
        .group_by(Contract.vendor_id, Contract.vendor_name)
        .order_by(func.sum(Contract.amount).desc())
    )
    vendors = result.all()

    if not vendors:
        return None

    total_amount = sum(v.total or 0 for v in vendors)
    top_vendor = vendors[0]

    if total_amount > 0 and (top_vendor.total or 0) / total_amount > 0.3:
        return {
            "pattern_type": "vendor_concentration",
            "severity": "HIGH",
            "suspicion_score": PATTERN_WEIGHTS["vendor_concentration"],
            "target_type": "department",
            "target_id": department,
            "detail": {
                "vendor_id": top_vendor.vendor_id,
                "vendor_name": top_vendor.vendor_name,
                "concentration_ratio": round((top_vendor.total or 0) / total_amount * 100, 1),
                "contract_count": top_vendor.count,
            },
            "evidence": {
                "threshold": "30%",
                "actual": f"{(top_vendor.total or 0) / total_amount * 100:.1f}%",
            },
        }
    return None


async def detect_contract_splitting(
    db: AsyncSession,
    department: str,
    year: int,
) -> Optional[dict]:
    """패턴 4: 계약 분할 (수의계약 한도 80-100% 금액 3건 이상)"""
    # 수의계약 한도: 2000만원 (20,000,000 KRW)
    limit_lower = 16_000_000  # 80%
    limit_upper = 20_000_000  # 100%

    result = await db.execute(
        select(
            Contract.vendor_id,
            Contract.vendor_name,
            func.count().label("count"),
        )
        .where(
            Contract.department == department,
            func.extract("year", Contract.contract_date) == year,
            Contract.amount >= limit_lower,
            Contract.amount <= limit_upper,
        )
        .group_by(Contract.vendor_id, Contract.vendor_name)
        .having(func.count() >= 3)
    )
    suspicious = result.all()

    if suspicious:
        return {
            "pattern_type": "contract_splitting",
            "severity": "HIGH",
            "suspicion_score": PATTERN_WEIGHTS["contract_splitting"],
            "target_type": "department",
            "target_id": department,
            "detail": {
                "vendors": [{
                    "vendor_id": s.vendor_id,
                    "vendor_name": s.vendor_name,
                    "split_count": s.count,
                } for s in suspicious],
            },
            "evidence": {
                "threshold": "수의계약 한도(2000만원)의 80-100% 범위 계약 3건 이상",
            },
        }
    return None


async def run_all_patterns(db: AsyncSession, department: str, year: int) -> list[dict]:
    """모든 패턴 실행"""
    flags = []
    detectors = [
        detect_yearend_spike,
        detect_vendor_concentration,
        detect_contract_splitting,
        # TODO: 나머지 7개 패턴 구현
    ]
    for detector in detectors:
        result = await detector(db, department, year)
        if result:
            flags.append(result)
    return flags
