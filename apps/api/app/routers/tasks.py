"""spec 010 — 任务端点(POST /tasks / GET /tasks/{id} / POST /tasks/{id}/cancel)"""
from __future__ import annotations

import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.thresholds import (
    SYNC_GENERATION_THRESHOLD,
)
from ..db import get_db
from ..deps import get_current_user
from ..models import Pattern, User
from ..services import task_queue, task_status

router = APIRouter(prefix="/tasks", tags=["tasks"])
log = logging.getLogger(__name__)


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str  # queued / running / complete / failed / cancelled
    progress: int  # 0-100
    result_pattern_id: str | None = None
    error: dict | None = None  # { code, message }
    bead_size: str = "mini"
    palette: str | None = None
    width: int | None = None
    height: int | None = None
    created_at: str | None = None
    updated_at: str | None = None


def _to_response(task: dict) -> TaskStatusResponse:
    err = task.get("error")
    return TaskStatusResponse(
        task_id=task["task_id"],
        status=task["status"],
        progress=task.get("progress", 0),
        result_pattern_id=task.get("result_pattern_id"),
        error=err if isinstance(err, dict) else None,
        bead_size=task.get("bead_size", "mini"),
        palette=task.get("palette"),
        width=task.get("width"),
        height=task.get("height"),
        created_at=task.get("created_at"),
        updated_at=task.get("updated_at"),
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    file: Annotated[UploadFile, File(description="要转换的图片(JPG/PNG/WEBP,≤10MB)")],
    palette: Annotated[str, Form()] = "mard-221-alfonse-doudou",
    width: Annotated[int, Form(ge=8, le=200)] = 58,
    height: Annotated[int, Form(ge=8, le=200)] = 58,
    max_colors: Annotated[int | None, Form(ge=2, le=221)] = None,
    prefilter: Annotated[str, Form()] = "smooth",
    cleanup: Annotated[str, Form()] = "majority",
    dither: Annotated[bool, Form()] = False,
    bead_size: Annotated[str, Form(pattern=r"^(mini|midi)$")] = "mini",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建异步生成任务(大图,>80×80)"""
    settings = __import__("app.config", fromlist=["get_settings"]).get_settings()

    # 校验
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(
            status_code=415,
            detail=f"不支持的图片格式: {file.content_type},仅支持 JPG/PNG/WEBP",
        )
    contents = await file.read()
    size_mb = len(contents) / 1024 / 1024
    if size_mb > settings.max_upload_mb:
        raise HTTPException(
            status_code=413,
            detail=f"图片过大({size_mb:.1f}MB),最大 {settings.max_upload_mb}MB",
        )

    # 限流:单用户最大并发任务数
    if not task_status.check_user_concurrent_limit(current_user.id):
        raise HTTPException(
            status_code=429,
            detail=f"单用户最大并发任务数超限,请等待当前任务完成",
        )

    # 队列深度上限
    from ..core.thresholds import QUEUE_MAX_DEPTH

    if task_status.get_queue_depth() >= QUEUE_MAX_DEPTH:
        raise HTTPException(
            status_code=503,
            detail="系统繁忙,请稍后重试",
        )

    # 1. 生成 task_id(UUID v4)
    task_id = str(uuid.uuid4())

    # 2. 落临时文件(给 worker 用)
    upload_dir = settings.storage_path / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = (file.filename or "upload").split(".")[-1].lower() or "png"
    tmp_path = upload_dir / f"{task_id}.{ext}"
    tmp_path.write_bytes(contents)

    # 3. 落库 Pattern(状态 pending,等 worker 改 processing → completed)
    pattern = Pattern(
        id=task_id,  # 直接用 task_id 简化(避免双重 ID)
        user_id=current_user.id,
        status="pending",
        palette=palette,
        width=width,
        height=height,
        max_colors=max_colors,
        prefilter=prefilter,
        cleanup=cleanup,
        dither=dither,
        bead_size=bead_size,
    )
    db.add(pattern)
    db.commit()

    # 4. 写入 Redis 任务状态
    task_status.save_task(
        {
            "task_id": task_id,
            "user_id": current_user.id,
            "status": "queued",
            "progress": 0,
            "palette": palette,
            "width": width,
            "height": height,
            "bead_size": bead_size,
            "params": {
                "palette": palette,
                "width": width,
                "height": height,
                "max_colors": max_colors,
                "prefilter": prefilter,
                "cleanup": cleanup,
                "dither": dither,
                "bead_size": bead_size,
            },
        }
    )

    # 5. 入队 RQ
    task_queue.enqueue_task(
        task_id,
        "app.workers.generate_worker.generate_pattern_async",
        task_id=task_id,
        pattern_id=task_id,
        file_path=str(tmp_path),
        palette=palette,
        width=width,
        height=height,
        max_colors=max_colors,
        prefilter=prefilter,
        cleanup=cleanup,
        dither=dither,
        bead_size=bead_size,
    )

    log.info("task.created", extra={"task_id": task_id, "user_id": current_user.id})

    return {"task_id": task_id, "status": "queued"}


@router.get("/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """查询任务状态"""
    task = task_status.load_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在或已过期")
    if task.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此任务")
    return _to_response(task)


@router.post("/{task_id}/cancel")
async def cancel_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """取消任务"""
    task = task_status.load_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在或已过期")
    if task.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此任务")
    if task.get("status") in ("complete", "failed"):
        raise HTTPException(status_code=409, detail=f"任务已{ '完成' if task['status'] == 'complete' else '失败' },不可取消")
    cancelled = task_queue.cancel_job(task_id)
    return {"task_id": task_id, "status": "cancelled" if cancelled else task.get("status")}


@router.get("", response_model=list[TaskStatusResponse])
async def list_my_tasks(
    current_user: User = Depends(get_current_user),
    limit: int = 50,
):
    """列出我的任务(按 updated_at 倒序)"""
    tasks = task_status.list_user_tasks(current_user.id, limit=limit)
    return [_to_response(t) for t in tasks]