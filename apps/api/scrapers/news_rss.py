"""뉴스 RSS 수집기"""
import feedparser
from scrapers.base import BaseScraper


class NewsRSSScraper(BaseScraper):
    """30개+ 뉴스 매체 RSS 수집"""

    # 주요 RSS 피드
    RSS_FEEDS = {
        "chosun": "https://www.chosun.com/arc/outboundfeeds/rss/",
        "joongang": "https://rss.joins.com/joins_news_list.xml",
        "donga": "https://rss.donga.com/total.xml",
        "hankyoreh": "https://www.hani.co.kr/rss/",
        "khan": "https://www.khan.co.kr/rss/rssdata/total_news.xml",
        "hankyung": "https://rss.hankyung.com/feed/",
    }

    async def collect_all(self) -> list[dict]:
        """모든 RSS 피드에서 기사 수집"""
        articles = []
        for source_id, url in self.RSS_FEEDS.items():
            try:
                feed = feedparser.parse(url)
                for entry in feed.entries[:20]:  # 매체당 최대 20개
                    articles.append({
                        "title": entry.get("title", ""),
                        "url": entry.get("link", ""),
                        "source_id": source_id,
                        "published_at": entry.get("published", ""),
                        "summary": entry.get("summary", "")[:500],
                    })
            except Exception as e:
                continue  # 실패한 피드 건너뛰기
        return articles

    async def collect_source(self, source_id: str) -> list[dict]:
        """특정 매체 RSS 수집"""
        url = self.RSS_FEEDS.get(source_id)
        if not url:
            return []
        feed = feedparser.parse(url)
        return [{
            "title": entry.get("title", ""),
            "url": entry.get("link", ""),
            "source_id": source_id,
            "published_at": entry.get("published", ""),
        } for entry in feed.entries]
