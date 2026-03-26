"""Celery 작업 정의"""
import logging
from celery import Celery
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

app = Celery("gukjeong", broker=settings.REDIS_URL)
app.config_from_object("etl.scheduler")


@app.task(name="etl.tasks.collect_news_rss")
def collect_news_rss():
    """RSS 뉴스 수집 (30분마다)"""
    logger.info("[ETL] RSS 뉴스 수집 시작")
    # TODO: NewsRSSScraper.collect_all() 호출
    logger.info("[ETL] RSS 뉴스 수집 완료")


@app.task(name="etl.tasks.collect_contracts")
def collect_contracts():
    """나라장터 계약 수집 (매일 3AM)"""
    logger.info("[ETL] 나라장터 계약 수집 시작")
    # TODO: G2BScraper.get_contracts() 호출
    logger.info("[ETL] 나라장터 계약 수집 완료")


@app.task(name="etl.tasks.run_audit_patterns")
def run_audit_patterns():
    """감사 패턴 실행 (매일 4AM)"""
    logger.info("[ETL] 감사 패턴 분석 시작")
    # TODO: audit_engine.run_all_patterns() 호출
    logger.info("[ETL] 감사 패턴 분석 완료")


@app.task(name="etl.tasks.cluster_and_analyze_news")
def cluster_and_analyze_news():
    """뉴스 클러스터링 및 프레임 분석 (매일 5AM)"""
    logger.info("[ETL] 뉴스 클러스터링 시작")
    # TODO: news_clustering + news_analyzer 호출
    logger.info("[ETL] 뉴스 클러스터링 완료")


@app.task(name="etl.tasks.calculate_department_scores")
def calculate_department_scores():
    """부처별 감사 점수 계산 (매주 일요일 2AM)"""
    logger.info("[ETL] 부처별 감사 점수 계산 시작")
    # TODO: 부처별 의심 점수 집계
    logger.info("[ETL] 부처별 감사 점수 계산 완료")


@app.task(name="etl.tasks.update_legislator_stats")
def update_legislator_stats():
    """의원 활동 통계 업데이트 (매주 월요일 6AM)"""
    logger.info("[ETL] 의원 활동 업데이트 시작")
    # TODO: AssemblyScraper + consistency_checker 호출
    logger.info("[ETL] 의원 활동 업데이트 완료")


@app.task(name="etl.tasks.refresh_fiscal_data")
def refresh_fiscal_data():
    """재정 데이터 전체 갱신 (매월 1일 1AM)"""
    logger.info("[ETL] 재정 데이터 갱신 시작")
    # TODO: OpenFiscalScraper + EcosScraper 호출
    logger.info("[ETL] 재정 데이터 갱신 완료")


@app.task(name="etl.tasks.backup_database")
def backup_database():
    """데이터베이스 백업 (매일 3:30AM)"""
    logger.info("[ETL] DB 백업 시작")
    # TODO: pg_dump 실행
    logger.info("[ETL] DB 백업 완료")
