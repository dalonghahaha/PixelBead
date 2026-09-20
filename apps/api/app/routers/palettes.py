"""色卡端点 - 调用 pypindou"""
import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from ..services.pypindou_service import list_palettes_safe

router = APIRouter(prefix="/palettes", tags=["palettes"])
log = logging.getLogger(__name__)


@router.get("")
async def get_palettes() -> list[dict[str, Any]]:
    """列出所有可用拼豆色卡"""
    try:
        return list_palettes_safe()
    except Exception as e:
        log.exception("palettes.list_failed")
        raise HTTPException(status_code=500, detail=f"列出色卡失败: {e}")
