"""Celery Beat 스케줄 설정"""
from celery.schedules import crontab

# Celery Beat 스케줄
CELERYBEAT_SCHEDULE = {
    # 30분마다: RSS 뉴스 수집
    "collect-news-rss": {
        "task": "etl.tasks.collect_news_rss",
        "schedule": crontab(minute="*/30"),
    },
    # 매일 새벽 3시: 나라장터 계약 수집
    "collect-contracts": {
        "task": "etl.tasks.collect_contracts",
        "schedule": crontab(hour=3, minute=0),
    },
    # 매일 새벽 4시: 감사 패턴 실행
    "run-audit-patterns": {
        "task": "etl.tasks.run_audit_patterns",
        "schedule": crontab(hour=4, minute=0),
    },
    # 매일 새벽 5시: 뉴스 클러스터링
    "cluster-news": {
        "task": "etl.tasks.cluster_and_analyze_news",
        "schedule": crontab(hour=5, minute=0),
    },
    # 매주 일요일 새벽 2시: 부처별 감사 점수
    "weekly-audit-scores": {
        "task": "etl.tasks.calculate_department_scores",
        "schedule": crontab(hour=2, minute=0, day_of_week=0),
    },
    # 매주 월요일 새벽 6시: 의원 활동 업데이트
    "weekly-legislator-update": {
        "task": "etl.tasks.update_legislator_stats",
        "schedule": crontab(hour=6, minute=0, day_of_week=1),
    },
    # 매월 1일 새벽 1시: 재정 데이터 전체 갱신
    "monthly-fiscal-refresh": {
        "task": "etl.tasks.refresh_fiscal_data",
        "schedule": crontab(hour=1, minute=0, day_of_month=1),
    },
    # 매일 새벽 3:30: DB 백업
    "daily-backup": {
        "task": "etl.tasks.backup_database",
        "schedule": crontab(hour=3, minute=30),
    },
}
