"""뉴스 클러스터링 — TF-IDF + DBSCAN"""
import logging
from typing import Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

logger = logging.getLogger(__name__)

# 클러스터링 임계값
SIMILARITY_THRESHOLD = 0.6
MIN_CLUSTER_SIZE = 5


def cluster_articles(articles: list[dict]) -> list[list[dict]]:
    """기사 클러스터링"""
    if len(articles) < MIN_CLUSTER_SIZE:
        return []

    # TF-IDF 벡터화
    texts = [f"{a.get('title', '')} {a.get('summary', '')}" for a in articles]
    vectorizer = TfidfVectorizer(max_features=5000)
    tfidf_matrix = vectorizer.fit_transform(texts)

    # DBSCAN 클러스터링
    similarity_matrix = cosine_similarity(tfidf_matrix)
    distance_matrix = 1 - similarity_matrix

    clustering = DBSCAN(
        eps=1 - SIMILARITY_THRESHOLD,
        min_samples=MIN_CLUSTER_SIZE,
        metric="precomputed",
    ).fit(distance_matrix)

    # 클러스터별 기사 그룹화
    clusters = {}
    for idx, label in enumerate(clustering.labels_):
        if label == -1:
            continue  # 노이즈
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(articles[idx])

    return list(clusters.values())
