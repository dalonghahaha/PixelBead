"""拼豆图纸生成服务层 - 包装 algorithm 模块"""
import logging
from pathlib import Path
from typing import Any

from . import algorithm

log = logging.getLogger(__name__)


def is_available() -> bool:
    return True  # 自研算法无外部依赖


def list_palettes_safe() -> list[dict[str, Any]]:
    try:
        return algorithm.list_palettes()
    except Exception as e:
        log.exception("palettes.list_failed")
        raise


def generate_pattern_safe(
    image_path: str | Path,
    palette: str = "mard-221-alfonse-doudou",
    width: int = 58,
    height: int = 58,
    max_colors: int | None = None,
    prefilter: str = "smooth",
    cleanup: str = "majority",
    dither: bool = False,
    bead_size: str = "mini",  # ← 009 新增
) -> dict[str, Any]:
    """生成拼豆图纸,统一异常包装"""
    try:
        result = algorithm.generate(
            image_path=image_path,
            palette_id=palette,
            width=width,
            height=height,
            max_colors=max_colors,
            prefilter=prefilter,
            cleanup=cleanup,
            dither=dither,
            bead_size=bead_size,  # ← 009 新增
        )
        return {
            "color_counts": result.color_counts,
            "width": width,
            "height": height,
            "palette": palette,
            "pattern": result,  # PatternResult 对象
        }
    except Exception as e:
        log.exception("algorithm.generate_failed")
        raise RuntimeError(f"生成拼豆图纸失败: {e}") from e
