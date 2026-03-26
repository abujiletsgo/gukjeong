"""댓글 API — 카카오/네이버 KYC 인증 사용자만 작성 가능

Anonymous 사용자는 댓글 조회만 가능.
댓글 작성/수정/삭제는 반드시 require_auth (카카오/네이버 로그인) 필요.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.dependencies import get_current_user, require_auth
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter(prefix="/api/v1/comments", tags=["댓글"])


# ── Schemas ──────────────────────────────────────────────

class CommentCreate(BaseModel):
    target_type: str = Field(..., description="대상 타입: bill, audit_flag, news_event, survey, policy")
    target_id: str = Field(..., description="대상 ID")
    parent_id: Optional[UUID] = Field(None, description="대댓글인 경우 부모 댓글 ID")
    content: str = Field(..., min_length=1, max_length=2000, description="댓글 내용")


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class CommentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    user_id: UUID
    target_type: str
    target_id: str
    parent_id: Optional[UUID] = None
    content: str
    upvotes: int = 0
    downvotes: int = 0
    is_deleted: bool = False
    created_at: Optional[datetime] = None


class CommentListResponse(BaseModel):
    comments: list[CommentResponse]
    total: int
    page: int
    size: int


# ── Public: 댓글 조회 (로그인 불필요) ────────────────────

@router.get("", response_model=CommentListResponse)
async def list_comments(
    target_type: str = Query(..., description="대상 타입"),
    target_id: str = Query(..., description="대상 ID"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """특정 대상의 댓글 목록 조회 — 누구나 가능"""
    from app.models.glossary import Comment

    # 최상위 댓글만 (parent_id IS NULL)
    query = (
        select(Comment)
        .where(
            and_(
                Comment.target_type == target_type,
                Comment.target_id == target_id,
                Comment.parent_id.is_(None),
                Comment.is_deleted == False,
            )
        )
        .order_by(Comment.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(query)
    comments = result.scalars().all()

    # 전체 개수
    count_query = select(func.count(Comment.id)).where(
        and_(
            Comment.target_type == target_type,
            Comment.target_id == target_id,
            Comment.parent_id.is_(None),
            Comment.is_deleted == False,
        )
    )
    total = (await db.execute(count_query)).scalar() or 0

    return CommentListResponse(
        comments=[CommentResponse.model_validate(c) for c in comments],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{comment_id}/replies", response_model=list[CommentResponse])
async def list_replies(
    comment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """대댓글 목록 조회 — 누구나 가능"""
    from app.models.glossary import Comment

    query = (
        select(Comment)
        .where(
            and_(
                Comment.parent_id == comment_id,
                Comment.is_deleted == False,
            )
        )
        .order_by(Comment.created_at.asc())
    )
    result = await db.execute(query)
    return [CommentResponse.model_validate(c) for c in result.scalars().all()]


# ── Auth required: 댓글 작성/수정/삭제 (카카오/네이버 KYC 필수) ──

@router.post("", response_model=CommentResponse, status_code=201)
async def create_comment(
    body: CommentCreate,
    user: dict = Depends(require_auth),  # 카카오/네이버 인증 필수
    db: AsyncSession = Depends(get_db),
):
    """댓글 작성 — 카카오/네이버 로그인 필수

    Anonymous 사용자는 403 Forbidden.
    KYC 인증된 사용자만 댓글을 남길 수 있습니다.
    """
    from app.models.glossary import Comment

    # 대댓글인 경우 부모 댓글 존재 확인
    if body.parent_id:
        parent = await db.get(Comment, body.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="부모 댓글을 찾을 수 없습니다")
        if parent.parent_id is not None:
            raise HTTPException(status_code=400, detail="대댓글에는 답글을 달 수 없습니다 (1단계만 허용)")

    comment = Comment(
        user_id=user["id"],
        target_type=body.target_type,
        target_id=body.target_id,
        parent_id=body.parent_id,
        content=body.content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return CommentResponse.model_validate(comment)


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: UUID,
    body: CommentUpdate,
    user: dict = Depends(require_auth),  # 카카오/네이버 인증 필수
    db: AsyncSession = Depends(get_db),
):
    """댓글 수정 — 본인만 가능"""
    from app.models.glossary import Comment

    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다")
    if str(comment.user_id) != str(user["id"]):
        raise HTTPException(status_code=403, detail="본인의 댓글만 수정할 수 있습니다")

    comment.content = body.content
    await db.commit()
    await db.refresh(comment)

    return CommentResponse.model_validate(comment)


@router.delete("/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: UUID,
    user: dict = Depends(require_auth),  # 카카오/네이버 인증 필수
    db: AsyncSession = Depends(get_db),
):
    """댓글 삭제 (soft delete) — 본인만 가능"""
    from app.models.glossary import Comment

    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다")
    if str(comment.user_id) != str(user["id"]):
        raise HTTPException(status_code=403, detail="본인의 댓글만 삭제할 수 있습니다")

    comment.is_deleted = True
    await db.commit()


@router.post("/{comment_id}/vote")
async def vote_comment(
    comment_id: UUID,
    direction: str = Query(..., pattern="^(up|down)$"),
    user: dict = Depends(require_auth),  # 카카오/네이버 인증 필수
    db: AsyncSession = Depends(get_db),
):
    """댓글 추천/비추천 — 카카오/네이버 로그인 필수"""
    from app.models.glossary import Comment

    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다")

    if direction == "up":
        comment.upvotes += 1
    else:
        comment.downvotes += 1

    await db.commit()
    return {"upvotes": comment.upvotes, "downvotes": comment.downvotes}
