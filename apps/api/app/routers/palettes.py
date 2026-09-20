"""色卡端点 - 调用 pypindou"""
import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from ..services.pypindou_service import list_palettes_safe

router = APIRouter(prefix="/palettes", tags=["palettes"])
log = logging.getLogger(__name__)


@router.get("")
async def get_palettes() -> list[dict[str, Any]]:
    """列出所有可用拼豆色卡

    返回字段(spec 005 扩展):
      - id / title:中文标题
      - title_en:英文标题(可空,客户端按 locale 切换)
      - standard:domestic / international
      - count:色卡总数
    """
    try:
        # algorithm.list_palettes() 已从 data/palette-en.json 注入 name_en
        # 此端点直接返回 list_palettes_safe()(透传 service 层结果)
        return list_palettes_safe()
    except Exception as e:
        log.exception("palettes.list_failed")
        raise HTTPException(status_code=500, detail=f"列出色卡失败: {e}")
