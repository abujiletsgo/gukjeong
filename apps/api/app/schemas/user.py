"""사용자 Pydantic 스키마"""
from pydantic import BaseModel
from typing import Optional


class UserBrief(BaseModel):
    id: str
    nickname: Optional[str] = None
    tier: str = "free"


class CreditBalance(BaseModel):
    balance: int
    history: list = []
