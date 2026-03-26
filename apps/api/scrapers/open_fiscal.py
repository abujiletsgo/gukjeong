"""열린재정 API 스크래퍼"""
from scrapers.base import BaseScraper


class OpenFiscalScraper(BaseScraper):
    """기획재정부 예산/재정 데이터 수집"""
    BASE_URL = "https://apis.data.go.kr"
    RATE_LIMIT_PER_DAY = 1000

    def __init__(self, api_key: str):
        super().__init__(api_key)

    async def get_budget_by_sector(self, year: int) -> list[dict]:
        """분야별 예산 현황"""
        params = {"serviceKey": self.api_key, "resultType": "json", "fscl_yr": str(year)}
        data = await self.fetch("/B552468/SectorBudget/getSectorBudgetList", params)
        return self._extract_items(data)

    async def get_budget_by_department(self, year: int) -> list[dict]:
        """부처별 예산 현황"""
        params = {"serviceKey": self.api_key, "resultType": "json", "fscl_yr": str(year)}
        data = await self.fetch("/B552468/DeptBudget/getDeptBudgetList", params)
        return self._extract_items(data)

    async def get_national_accounts(self, year: int) -> dict:
        """국가 재정 개요"""
        params = {"serviceKey": self.api_key, "resultType": "json", "fscl_yr": str(year)}
        data = await self.fetch("/B552468/NationalAccount/getNationalAccountList", params)
        return data

    def _extract_items(self, response: dict) -> list:
        body = response.get("response", {}).get("body", {})
        items = body.get("items", {}).get("item", [])
        return items if isinstance(items, list) else [items] if items else []
