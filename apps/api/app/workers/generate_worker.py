"""spec 010 — RQ Worker 函数

异步生成拼豆图纸。worker 启动方式:
    cd apps/api && python -m app.workers.generate_worker

或通过 docker-compose / systemd 管理。
"""
from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path

from PIL import Image

from ..config import get_settings
from ..core.thresholds import REDIS_URL  # noqa: F401  # noqa: F841
from ..db import SessionLocal
from ..models import Pattern
from ..services import pypindou_service, task_status

log = logging.getLogger(__name__)

# Worker 函数必须可被 RQ 序列化导入,函数路径 = 'app.workers.generate_worker.generate_pattern_async'


def generate_pattern_async(
    task_id: str,
    pattern_id: str,
    file_path: str,
    palette: str,
    width: int,
    height: int,
    max_colors: int | None,
    prefilter: str,
    cleanup: str,
    dither: bool,
    bead_size: str,
) -> dict:
    """异步生成拼豆图纸(RQ worker 调用)

    流程:
      1. 标记任务 running(进度 30)
      2. 调用 pypindou_service 生成(进度 60)
      3. 渲染输出 + 落库(进度 90)
      4. 标记 complete(进度 100)
      5. 失败 → 标记 failed + Sentry 上报(006 协同)
    """
    settings = get_settings()
    db = SessionLocal()

    try:
        # 1. running
        task_status.update_progress(task_id, 30, status="running")

        # 加载图纸记录
        pattern = db.get(Pattern, pattern_id)
        if not pattern:
            raise ValueError(f"图纸不存在: {pattern_id}")

        # 2. 生成
        result = pypindou_service.generate_pattern_safe(
            image_path=file_path,
            palette=palette,
            width=width,
            height=height,
            max_colors=max_colors,
            prefilter=prefilter,
            cleanup=cleanup,
            dither=dither,
            bead_size=bead_size,
        )

        task_status.update_progress(task_id, 60)

        # 3. 渲染输出 + 落库
        output_dir = settings.storage_path / "patterns" / pattern_id
        output_dir.mkdir(parents=True, exist_ok=True)
        preview_file = output_dir / "preview.png"
        symbol_file = output_dir / "symbols.png"

        pat_obj = result["pattern"]
        pat_obj.to_preview(scale=12).save(preview_file)
        pat_obj.to_symbol_chart(cell_size=24).save(symbol_file)

        pattern.status = "completed"
        pattern.color_counts = result["color_counts"]
        pattern.preview_path = str(preview_file)
        pattern.symbol_path = str(symbol_file)
        pattern.completed_at = datetime.utcnow()
        db.commit()

        # 4. complete
        task_status.update_progress(
            task_id, 100,
            status="complete",
            result_pattern_id=pattern_id,
        )

        log.info(
            "pattern.async_generated",
            extra={"task_id": task_id, "pattern_id": pattern_id, "colors": len(result.get("color_counts") or {})},
        )
        return {"task_id": task_id, "pattern_id": pattern_id, "status": "complete"}

    except MemoryError as e:
        # OOM 错误分类(010 FR-8)
        db.rollback()
        _mark_failed(task_id, pattern_id, db, code="oom", message="图片过大,请尝试压缩或缩小尺寸", error=e)
        raise

    except TimeoutError as e:
        db.rollback()
        _mark_failed(task_id, pattern_id, db, code="timeout", message="生成超时,请重试", error=e)
        raise

    except ValueError as e:
        db.rollback()
        _mark_failed(task_id, pattern_id, db, code="invalid_input", message=f"输入参数错误: {e}", error=e)
        raise

    except Exception as e:
        db.rollback()
        _mark_failed(task_id, pattern_id, db, code="algorithm_error", message="生成失败,请重试或换张图片", error=e)
        raise

    finally:
        db.close()


def _mark_failed(
    task_id: str,
    pattern_id: str | None,
    db,
    code: str,
    message: str,
    error: Exception,
) -> None:
    """标记任务失败 + 落库错误"""
    task_status.update_progress(
        task_id, 0,
        status="failed",
        error={"code": code, "message": message},
    )
    if pattern_id:
        pattern = db.get(Pattern, pattern_id)
        if pattern:
            pattern.status = "failed"
            pattern.error = f"[{code}] {message}"
            pattern.completed_at = datetime.utcnow()
            db.commit()

    # Sentry 上报(006 协同,失败静默)
    try:
        import sentry_sdk
        sentry_sdk.capture_exception(error)
    except ImportError:
        pass

    log.exception(
        "pattern.async_failed",
        extra={"task_id": task_id, "pattern_id": pattern_id, "error_code": code},
    )


# ---- 启动入口(docker-compose / systemd 使用) ----

def main() -> None:
    """RQ worker 启动入口

    Usage:
        cd apps/api && python -m app.workers.generate_worker
    """
    import sys

    from rq import Worker

    from ..core.thresholds import RQ_QUEUE_NAME, WORKER_CONCURRENCY

    log.info("worker.starting", extra={"queue": RQ_QUEUE_NAME, "concurrency": WORKER_CONCURRENCY})

    queue = task_status.get_redis()
    worker = Worker([RQ_QUEUE_NAME], connection=queue)
    worker.work(with_scheduler=True, logging_level="INFO")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    main()