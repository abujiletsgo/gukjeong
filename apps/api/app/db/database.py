"""국정투명 데이터베이스 연결 모듈"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings


class Base(DeclarativeBase):
    """SQLAlchemy 선언적 베이스"""
    pass


settings = get_settings()
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """DB 세션 의존성"""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """테이블 생성 (개발용)"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
