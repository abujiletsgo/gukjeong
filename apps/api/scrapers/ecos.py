"""한국은행 ECOS API 스크래퍼"""
from scrapers.base import BaseScraper


class EcosScraper(BaseScraper):
    """한국은행 경제통계 — GDP, CPI, 금리, 가계부채"""
    BASE_URL = "https://ecos.bok.or.kr/api"
    RATE_LIMIT_PER_DAY = 100000

    def __init__(self, api_key: str):
        super().__init__(api_key)

    async def get_stat(
        self, stat_code: str, period: str, start: str, end: str, item_code: str = ""
    ) -> list[dict]:
        """통계 데이터 조회"""
        endpoint = f"/StatisticSearch/{self.api_key}/json/kr/1/100/{stat_code}/{period}/{start}/{end}/{item_code}"
        data = await self.fetch(endpoint)
        return data.get("StatisticSearch", {}).get("row", [])

    async def get_gdp(self, start_year: str, end_year: str) -> list[dict]:
        """GDP 성장률"""
        return await self.get_stat("200Y001", "A", start_year, end_year, "10111")

    async def get_cpi(self, start_year: str, end_year: str) -> list[dict]:
        """소비자물가지수"""
        return await self.get_stat("901Y009", "A", start_year, end_year, "0")

    async def get_national_debt(self, start_year: str, end_year: str) -> list[dict]:
        """국가채무"""
        return await self.get_stat("301Y013", "A", start_year, end_year)
