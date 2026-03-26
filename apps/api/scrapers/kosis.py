"""KOSIS 통계정보 스크래퍼"""
from scrapers.base import BaseScraper


class KosisScraper(BaseScraper):
    """통계청 KOSIS — 인구, 경제, 사회 통계"""
    BASE_URL = "https://kosis.kr/openapi"

    def __init__(self, api_key: str):
        super().__init__(api_key)

    async def get_stat_data(self, org_id: str, tbl_id: str) -> list[dict]:
        """통계 데이터 조회"""
        params = {"method": "getList", "apiKey": self.api_key, "orgId": org_id, "tblId": tbl_id, "format": "json"}
        data = await self.fetch("/Param/statisticsParameterData.do", params)
        return data if isinstance(data, list) else []
