"""국정투명 시드 데이터 로드"""
import asyncio
import json
from pathlib import Path
from sqlalchemy import select
from app.db.database import async_session, engine, Base
from app.models.president import President
from app.models.fiscal import FiscalYearly
from app.models.article import MediaOutlet
from app.models.glossary import Glossary


SEED_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent / "data" / "seed"


async def seed_presidents():
    """대통령 시드 데이터"""
    data = json.loads((SEED_DIR / "presidents.json").read_text())
    async with async_session() as session:
        for item in data:
            existing = await session.execute(
                select(President).where(President.id == item["id"])
            )
            if existing.scalar_one_or_none():
                continue
            president = President(
                id=item["id"],
                name=item["name"],
                name_en=item.get("name_en"),
                term_start=item["term_start"],
                term_end=item.get("term_end"),
                party=item.get("party"),
                era=item.get("era"),
                gdp_growth_avg=item.get("gdp_growth_avg"),
            )
            session.add(president)
        await session.commit()
    print("[시드] 대통령 데이터 로드 완료")


async def seed_fiscal():
    """재정 시드 데이터"""
    data = json.loads((SEED_DIR / "fiscal_historical.json").read_text())
    async with async_session() as session:
        for item in data:
            existing = await session.execute(
                select(FiscalYearly).where(FiscalYearly.year == item["year"])
            )
            if existing.scalar_one_or_none():
                continue
            fiscal = FiscalYearly(
                year=item["year"],
                total_spending=item.get("total_spending"),
                national_debt=item.get("national_debt"),
                debt_to_gdp=item.get("debt_to_gdp"),
                tax_revenue=item.get("tax_revenue"),
                president_id=item.get("president_id"),
            )
            session.add(fiscal)
        await session.commit()
    print("[시드] 재정 데이터 로드 완료")


async def seed_media_outlets():
    """미디어 시드 데이터"""
    data = json.loads((SEED_DIR / "media_outlets.json").read_text())
    async with async_session() as session:
        for item in data:
            existing = await session.execute(
                select(MediaOutlet).where(MediaOutlet.id == item["id"])
            )
            if existing.scalar_one_or_none():
                continue
            outlet = MediaOutlet(
                id=item["id"],
                name=item["name"],
                type=item.get("type"),
                spectrum_score=item.get("spectrum_score"),
                category=item.get("category"),
                rss_url=item.get("rss_url"),
                website_url=item.get("website_url"),
                founded_year=item.get("founded_year"),
                description=item.get("description"),
            )
            session.add(outlet)
        await session.commit()
    print("[시드] 미디어 매체 데이터 로드 완료")


async def seed_glossary():
    """용어 사전 시드 데이터"""
    data = json.loads((SEED_DIR / "glossary.json").read_text())
    async with async_session() as session:
        for item in data:
            existing = await session.execute(
                select(Glossary).where(Glossary.term == item["term"])
            )
            if existing.scalar_one_or_none():
                continue
            glossary = Glossary(
                term=item["term"],
                simple_explanation=item["simple_explanation"],
                detailed_explanation=item.get("detailed_explanation"),
                example=item.get("example"),
                related_terms=item.get("related_terms"),
                category=item.get("category"),
            )
            session.add(glossary)
        await session.commit()
    print("[시드] 용어 사전 데이터 로드 완료")


async def seed_all():
    """모든 시드 데이터 로드"""
    print("[시드] 데이터 로드 시작...")
    await seed_presidents()
    await seed_fiscal()
    await seed_media_outlets()
    await seed_glossary()
    print("[시드] 모든 데이터 로드 완료!")


if __name__ == "__main__":
    asyncio.run(seed_all())
