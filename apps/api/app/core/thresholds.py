"""spec 010 — 同步/异步生成阈值常量 + 配置"""
import os


# 同步阈值:图纸格子数 ≤ THRESHOLD × THRESHOLD 走同步,> 走异步
SYNC_GENERATION_THRESHOLD: int = int(
    os.environ.get("SYNC_GENERATION_THRESHOLD", "80")
)  # 默认 80×80


# 任务队列配置
WORKER_CONCURRENCY: int = int(os.environ.get("WORKER_CONCURRENCY", "2"))
TASK_TTL_SECONDS: int = int(os.environ.get("TASK_TTL_SECONDS", str(60 * 60 * 24 * 30)))  # 30 天
TASK_TIMEOUT_SECONDS: int = int(os.environ.get("TASK_TIMEOUT_SECONDS", "60"))
USER_MAX_CONCURRENT: int = int(os.environ.get("USER_MAX_CONCURRENT", "2"))
QUEUE_MAX_DEPTH: int = int(os.environ.get("QUEUE_MAX_DEPTH", "100"))

# Redis 连接
REDIS_URL: str = os.environ.get("REDIS_URL", "redis://redis:6379/0")

# RQ 队列名
RQ_QUEUE_NAME: str = os.environ.get("RQ_QUEUE_NAME", "pixelbead-default")