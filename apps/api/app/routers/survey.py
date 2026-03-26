"""설문조사 API 라우터"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.survey import Survey

router = APIRouter()


@router.get("/surveys/active")
async def list_active_surveys(db: AsyncSession = Depends(get_db)):
    """진행 중인 설문 목록"""
    result = await db.execute(
        select(Survey).where(Survey.status == "active").order_by(Survey.created_at.desc())
    )
    surveys = result.scalars().all()
    return {"data": [{
        "id": str(s.id),
        "title": s.title,
        "description": s.description,
        "total_responses": s.total_responses,
        "representativeness_score": s.representativeness_score,
    } for s in surveys]}


@router.get("/surveys/{survey_id}")
async def get_survey(survey_id: str, db: AsyncSession = Depends(get_db)):
    """설문 상세 정보"""
    result = await db.execute(select(Survey).where(Survey.id == survey_id))
    survey = result.scalar_one_or_none()
    if not survey:
        raise HTTPException(status_code=404, detail="설문을 찾을 수 없습니다")
    return {"data": {
        "id": str(survey.id),
        "title": survey.title,
        "description": survey.description,
        "context_data": survey.context_data,
        "status": survey.status,
        "total_responses": survey.total_responses,
    }}


@router.post("/surveys/{survey_id}/respond")
async def respond_to_survey(survey_id: str, db: AsyncSession = Depends(get_db)):
    """설문 응답 제출 (인증 필요)"""
    # TODO: 응답 저장 구현
    return {"status": "submitted"}
