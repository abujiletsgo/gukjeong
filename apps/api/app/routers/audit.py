"""AI 감사 API 라우터 — Phase 1 구현"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.audit_flag import AuditFlag, AuditDepartmentScore
from app.models.contract import Contract

router = APIRouter()


@router.get("/audit/heatmap")
async def get_audit_heatmap(
    year: int = Query(2026),
    quarter: int = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """부처별 의심 점수 히트맵"""
    query = select(AuditDepartmentScore).where(AuditDepartmentScore.year == year)
    if quarter:
        query = query.where(AuditDepartmentScore.quarter == quarter)
    result = await db.execute(query.order_by(AuditDepartmentScore.suspicion_score.desc()))
    scores = result.scalars().all()
    return {"data": [{
        "department": s.department,
        "year": s.year,
        "quarter": s.quarter,
        "suspicion_score": s.suspicion_score,
        "flag_count": s.flag_count,
        "transparency_rank": s.transparency_rank,
        "details": s.details,
    } for s in scores]}


@router.get("/audit/flags")
async def list_audit_flags(
    department: str = Query(None),
    pattern_type: str = Query(None),
    severity: str = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """감사 플래그 목록"""
    query = select(AuditFlag).order_by(AuditFlag.suspicion_score.desc())

    if department:
        query = query.where(AuditFlag.target_id == department)
    if pattern_type:
        query = query.where(AuditFlag.pattern_type == pattern_type)
    if severity:
        query = query.where(AuditFlag.severity == severity)

    # 전체 건수
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # 페이징
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    flags = result.scalars().all()

    return {
        "data": [{
            "id": str(f.id),
            "pattern_type": f.pattern_type,
            "severity": f.severity,
            "suspicion_score": f.suspicion_score,
            "target_type": f.target_type,
            "target_id": f.target_id,
            "detail": f.detail,
            "evidence": f.evidence,
            "ai_analysis": f.ai_analysis,
            "status": f.status,
            "created_at": str(f.created_at) if f.created_at else None,
        } for f in flags],
        "total": total,
        "page": page,
        "size": size,
    }


@router.get("/audit/summary")
async def get_audit_summary(
    db: AsyncSession = Depends(get_db),
):
    """감사 요약 통계"""
    # 전체 플래그 수
    total_result = await db.execute(select(func.count(AuditFlag.id)))
    total_flags = total_result.scalar() or 0

    # HIGH 심각도 건수
    high_result = await db.execute(
        select(func.count(AuditFlag.id)).where(AuditFlag.severity == "HIGH")
    )
    high_count = high_result.scalar() or 0

    # 고유 부처 수
    dept_result = await db.execute(
        select(func.count(func.distinct(AuditDepartmentScore.department)))
    )
    dept_count = dept_result.scalar() or 0

    # 평균 의심 점수
    avg_result = await db.execute(
        select(func.avg(AuditDepartmentScore.suspicion_score))
    )
    avg_score = avg_result.scalar() or 0

    return {"data": {
        "total_flags": total_flags,
        "high_severity_count": high_count,
        "departments_monitored": dept_count,
        "avg_suspicion_score": round(float(avg_score)),
    }}


@router.get("/audit/{flag_id}")
async def get_audit_flag(flag_id: str, db: AsyncSession = Depends(get_db)):
    """감사 플래그 상세"""
    result = await db.execute(select(AuditFlag).where(AuditFlag.id == flag_id))
    flag = result.scalar_one_or_none()
    if not flag:
        raise HTTPException(status_code=404, detail="감사 플래그를 찾을 수 없습니다")
    return {"data": {
        "id": str(flag.id),
        "pattern_type": flag.pattern_type,
        "severity": flag.severity,
        "suspicion_score": flag.suspicion_score,
        "target_type": flag.target_type,
        "target_id": flag.target_id,
        "detail": flag.detail,
        "evidence": flag.evidence,
        "ai_analysis": flag.ai_analysis,
        "related_bai_case": flag.related_bai_case,
        "status": flag.status,
        "created_at": str(flag.created_at) if flag.created_at else None,
        "disclaimer": "이 분석은 AI 기반 자동 탐지 결과이며, 의심 패턴일 뿐 비리 확정이 아닙니다.",
    }}
