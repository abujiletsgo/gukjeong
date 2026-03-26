"""국정투명 — FastAPI 메인 앱"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.routers import (
    presidents, budget, bills, legislators, audit,
    news, survey, local, search, auth, credits, comments,
)


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행"""
    # 시작 시: DB 연결 확인 등
    yield
    # 종료 시: 리소스 정리


app = FastAPI(
    title="국정투명 API",
    description="수치로 보는 대한민국 정부 — 공공데이터 기반 시민 투명성 플랫폼",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(presidents.router, prefix="/api/v1", tags=["대통령"])
app.include_router(budget.router, prefix="/api/v1", tags=["예산"])
app.include_router(bills.router, prefix="/api/v1", tags=["법안"])
app.include_router(legislators.router, prefix="/api/v1", tags=["국회의원"])
app.include_router(audit.router, prefix="/api/v1", tags=["AI 감사"])
app.include_router(news.router, prefix="/api/v1", tags=["뉴스"])
app.include_router(survey.router, prefix="/api/v1", tags=["설문"])
app.include_router(local.router, prefix="/api/v1", tags=["지방정부"])
app.include_router(search.router, prefix="/api/v1", tags=["검색"])
app.include_router(auth.router, prefix="/api/v1", tags=["인증"])
app.include_router(credits.router, prefix="/api/v1", tags=["크레딧"])
app.include_router(comments.router, tags=["댓글"])  # prefix already in router


@app.get("/")
async def root():
    return {"name": "국정투명 API", "version": "0.1.0", "status": "운영 중"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
