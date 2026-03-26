"""국정투명 설정 모듈"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """환경 변수 기반 설정"""
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://gukjeong:gukjeong@localhost:5432/gukjeong"
    # AI
    ANTHROPIC_API_KEY: str = ""
    # Government APIs
    DATA_GO_KR_API_KEY: str = ""
    ECOS_API_KEY: str = ""
    ASSEMBLY_API_KEY: str = ""
    LAW_API_KEY: str = ""
    # Auth
    KAKAO_CLIENT_ID: str = ""
    KAKAO_CLIENT_SECRET: str = ""
    NAVER_CLIENT_ID: str = ""
    NAVER_CLIENT_SECRET: str = ""
    # Payments
    TOSS_CLIENT_KEY: str = ""
    TOSS_SECRET_KEY: str = ""
    # Infrastructure
    REDIS_URL: str = "redis://localhost:6379"
    MEILISEARCH_URL: str = "http://localhost:7700"
    MEILISEARCH_API_KEY: str = "masterKey"
    SENTRY_DSN: str = ""
    # Feature flags
    ENABLE_PAID_TIERS: bool = False
    ENABLE_SURVEYS: bool = False
    ENABLE_AUDIT: bool = True
    # Server
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True


TIER_LIMITS = {
    "anonymous": {"search_per_day": 5, "results": 10, "filters": ["year", "sector"]},
    "free_registered": {"search_per_day": 15, "results": 20, "filters": ["year", "sector", "department"]},
    "citizen_pro": {"search_per_day": -1, "results": 100, "filters": "all", "downloads": 10},
    "institution": {"search_per_day": -1, "results": -1, "filters": "all", "api": 100000},
    "api_only": {"api_calls_per_month": 50000},
}


@lru_cache
def get_settings() -> Settings:
    return Settings()
