"""Meilisearch 검색 서비스"""
from typing import Optional
import meilisearch
from app.config import get_settings

settings = get_settings()


def get_meili_client():
    """Meilisearch 클라이언트 생성"""
    return meilisearch.Client(
        settings.MEILISEARCH_URL,
        settings.MEILISEARCH_API_KEY,
    )


async def index_document(index_name: str, document: dict):
    """문서 인덱싱"""
    client = get_meili_client()
    index = client.index(index_name)
    index.add_documents([document])


async def search_documents(
    index_name: str,
    query: str,
    filters: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """문서 검색"""
    client = get_meili_client()
    index = client.index(index_name)
    params = {"limit": limit, "offset": offset}
    if filters:
        params["filter"] = filters
    return index.search(query, params)


async def setup_indexes():
    """인덱스 초기 설정"""
    client = get_meili_client()
    indexes = [
        {"uid": "presidents", "primaryKey": "id"},
        {"uid": "bills", "primaryKey": "id"},
        {"uid": "contracts", "primaryKey": "id"},
        {"uid": "glossary", "primaryKey": "id"},
        {"uid": "legislators", "primaryKey": "id"},
    ]
    for idx in indexes:
        try:
            client.create_index(idx["uid"], {"primaryKey": idx["primaryKey"]})
        except Exception:
            pass  # 이미 존재하는 경우
