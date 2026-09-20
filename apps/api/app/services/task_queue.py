"""spec 010 — RQ 队列封装(简化版,单进程足够)

任务流程:
  POST /tasks → 落 Redis(queued) → RQ Worker 拉取 → running → complete / failed
"""
from __future__ import annotations

import logging
from typing import Any

import redis
from rq import Queue

from ..core.thresholds import REDIS_URL, RQ_QUEUE_NAME
from . import task_status

log = logging.getLogger(__name__)


def get_queue() -> Queue:
    """获取 RQ 队列(单例)"""
    return Queue(RQ_QUEUE_NAME, connection=task_status.get_redis())


def enqueue_task(
    task_id: str,
    func_path: str,
    *args: Any,
    **kwargs: Any,
) -> bool:
    """入队任务

    Args:
        task_id: 任务 UUID v4(由调用方生成,与 Redis 状态 key 关联)
        func_path: worker 函数的完整路径(必须可被 RQ worker 导入)
        *args / **kwargs: 传递给 worker 函数的参数
    """
    q = get_queue()
    # job_id 与 task_id 关联,便于 trace
    job = q.enqueue(
        func_path,
        *args,
        job_id=task_id,
        job_timeout=60,  # 任务超时 60s,见 core.thresholds.TASK_TIMEOUT_SECONDS
        **kwargs,
    )
    log.info("task.enqueued", extra={"task_id": task_id, "job_id": job.id})
    return True


def get_job_status(task_id: str) -> str | None:
    """获取 RQ job 状态"""
    try:
        job = get_queue().fetch_job(task_id)
        if job is None:
            return None
        # RQ 状态映射到我们的状态
        status_map = {
            "queued": "queued",
            "started": "running",
            "finished": "complete",
            "failed": "failed",
            "canceled": "cancelled",
        }
        return status_map.get(job.get_status(), job.get_status())
    except Exception as e:
        log.warning("task.fetch_job_failed", extra={"task_id": task_id, "error": str(e)})
        return None


def cancel_job(task_id: str) -> bool:
    """取消任务(标记 Redis + 尝试取消 RQ job)

    返回 True 表示已取消 / False 表示无法取消(已完成)
    """
    task = task_status.load_task(task_id)
    if not task:
        return False
    if task.get("status") in ("complete", "failed"):
        return False
    # 标记 Redis(我们的状态)
    task["status"] = "cancelled"
    task_status.save_task(task)
    # 尝试取消 RQ job
    try:
        job = get_queue().fetch_job(task_id)
        if job:
            job.cancel()
    except Exception as e:
        log.warning("task.rq_cancel_failed", extra={"task_id": task_id, "error": str(e)})
    return True