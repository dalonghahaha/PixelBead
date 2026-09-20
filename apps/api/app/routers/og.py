"""spec 007 — OG 图端点(1200×630 PNG)
GET /og/{pattern_id}.png  → 仅 is_public=true 可访问
"""
from __future__ import annotations

import io
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..models import Pattern

router = APIRouter(prefix="/og", tags=["og"])
log = logging.getLogger(__name__)


def _get_or_generate(pattern_id: str, db: Session) -> Path:
    """获取或生成 OG 图(磁盘缓存)

    路径:<STORAGE_DIR>/og/{pattern_id}.png
    """
    settings = get_settings()
    og_dir = settings.storage_path / "og"
    og_dir.mkdir(parents=True, exist_ok=True)
    og_file = og_dir / f"{pattern_id}.png"

    if og_file.exists():
        return og_file

    # 生成占位 OG 图(用 PIL 画一个简单 1200×630 PNG)
    pattern = db.get(Pattern, pattern_id)
    if not pattern or not pattern.is_public:
        raise HTTPException(status_code=404, detail="图纸不存在或非公开")

    try:
        from PIL import Image, ImageDraw, ImageFont

        img = Image.new("RGB", (1200, 630), (255, 255, 255))
        draw = ImageDraw.Draw(img)

        # 尝试加载字体
        try:
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        except OSError:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()

        # 标题
        draw.text((60, 60), "PixelBead", fill=(50, 50, 50), font=font_large)

        # 副标题
        draw.text((60, 130), f"Bead Pattern · {pattern.bead_size}", fill=(100, 100, 100), font=font_small)
        draw.text((60, 170), f"{pattern.width}×{pattern.height} cells", fill=(100, 100, 100), font=font_small)

        # 边框
        draw.rectangle([40, 40, 1160, 590], outline=(220, 220, 220), width=2)

        img.save(og_file, "PNG")
        log.info("og.generated", extra={"pattern_id": pattern_id})
        return og_file

    except Exception as e:
        log.exception("og.generate_failed", extra={"pattern_id": pattern_id})
        raise HTTPException(status_code=500, detail=f"OG 图生成失败: {e}")


@router.get("/{pattern_id}.png")
async def get_og(
    pattern_id: str,
    db: Session = Depends(get_db),
):
    """返回图纸 OG 图(1200×630 PNG)"""
    og_file = _get_or_generate(pattern_id, db)
    return FileResponse(
        og_file,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=2592000"},  # 30 天
    )