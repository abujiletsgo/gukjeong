"""사용자 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional


class UserBrief(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    nickname: Optional[str] = None
    tier: str = "free"
    region_sido: Optional[str] = None


class CreditBalance(BaseModel):
    balance: int
    history: list = []


class CreditEntry(BaseModel):
    model_config = {"from_attributes": True}

    amount: int
    reason: str
    description: Optional[str] = None
    created_at: Optional[str] = None
