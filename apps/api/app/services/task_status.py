"""spec 010 — 任务状态管理(Redis Hash + TTL)

任务状态:queued / running / complete / failed / cancelled
存储:Redis Hash(`pixelbead:task:{task_id}`)
TTL:任务完成后保留 30 天(可配置 TASK_TTL_SECONDS)
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any

import redis

from ..core.thresholds import REDIS_URL, TASK_TTL_SECONDS

log = logging.getLogger(__name__)

TASK_KEY_PREFIX = "pixelbead:task:"
USER_TASK_SET_PREFIX = "pixelbead:tasks:user:"


# 全局 Redis 客户端(懒加载)
_redis_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


# ---- 任务对象序列化 ----


def _task_key(task_id: str) -> str:
    return f"{TASK_KEY_PREFIX}{task_id}"


def _user_set_key(user_id: str) -> str:
    return f"{USER_TASK_SET_PREFIX}{user_id}"


def save_task(task: dict[str, Any]) -> None:
    """保存任务到 Redis(覆盖式写入)

    task dict 必须包含 task_id, status;可选 progress, params, result_pattern_id, error, retry_count, updated_at
    """
    task.setdefault("created_at", datetime.utcnow().isoformat() + "Z")
    task["updated_at"] = datetime.utcnow().isoformat() + "Z"
    r = get_redis()
    key = _task_key(task["task_id"])
    r.set(key, json.dumps(task), ex=TASK_TTL_SECONDS)
    # 加入用户的任务集合(便于"我的任务"查询)
    if task.get("user_id"):
        r.sadd(_user_set_key(task["user_id"]), task["task_id"])


def load_task(task_id: str) -> dict[str, Any] | None:
    r = get_redis()
    raw = r.get(_task_key(task_id))
    if not raw:
        return None
    return json.loads(raw)


def delete_task(task_id: str, user_id: str | None = None) -> None:
    r = get_redis()
    r.delete(_task_key(task_id))
    if user_id:
        r.srem(_user_set_key(user_id), task_id)


# ---- 进度更新 ----


def update_progress(task_id: str, progress: int, **kwargs: Any) -> None:
    """更新任务进度(0-100 粗粒度)

    kwargs: 可选 status / result_pattern_id / error
    """
    task = load_task(task_id)
    if not task:
        return
    task["progress"] = progress
    if "status" in kwargs:
        task["status"] = kwargs["status"]
    if "result_pattern_id" in kwargs:
        task["result_pattern_id"] = kwargs["result_pattern_id"]
    if "error" in kwargs:
        task["error"] = kwargs["error"]
    task["updated_at"] = datetime.utcnow().isoformat() + "Z"
    save_task(task)


def list_user_tasks(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    """列出用户所有任务(按 updated_at 倒序)"""
    r = get_redis()
    task_ids = list(r.smembers(_user_set_key(user_id)))
    tasks = []
    for tid in task_ids:
        t = load_task(tid)
        if t:
            tasks.append(t)
    tasks.sort(key=lambda t: t.get("updated_at", ""), reverse=True)
    return tasks[:limit]


# ---- 队列深度 ----


def get_queue_depth() -> int:
    """获取 RQ 队列深度(pending + running)"""
    from rq import Queue

    q = Queue(connection=get_redis())
    return len(q) + q.count


def check_user_concurrent_limit(user_id: str) -> bool:
    """检查单用户最大并发任务数(USER_MAX_CONCURRENT)"""
    from ..core.thresholds import USER_MAX_CONCURRENT

    tasks = list_user_tasks(user_id, limit=100)
    active = [t for t in tasks if t.get("status") in ("queued", "running")]
    return len(active) < USER_MAX_CONCURRENT