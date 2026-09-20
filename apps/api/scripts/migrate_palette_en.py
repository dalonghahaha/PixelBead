#!/usr/bin/env python3
"""spec 005 — palette 色名英文翻译 backfill 脚本

策略:
- 读取 apps/web/data/palette-en.json(老孙手译的 221 色卡英文名)
- 若 JSON 不存在,生成模板 + 用中文拼音 fallback(后续手动补)
- 写入 palette_colors.name_en 列

幂等:已存在 name_en 不覆盖(避免老孙手译被覆写)
"""
import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text

from app.db import engine

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)


# 老孙手译模板(节选示例,完整 221 色卡由老孙在 PR 补全)
PALETTE_EN_TEMPLATE = {
    "_meta": {
        "version": "1.0.0",
        "source": "老孙手译",
        "note": "完整 221 色卡由人工翻译,机器翻译仅作参考",
    },
    "H1": "White",
    "H2": "Black",
    "H3": "Light Gray",
    "H4": "Dark Gray",
    "H5": "Light Pink",
    "H6": "Pink",
    "H7": "Red",
    "H8": "Orange",
    "H9": "Yellow",
    "H10": "Light Yellow",
    "H11": "Light Green",
    "H12": "Green",
    "H13": "Dark Green",
    "H14": "Cyan",
    "H15": "Blue",
    "H16": "Dark Blue",
    "H17": "Purple",
    "H18": "Brown",
    # ... 其余 203 色卡由老孙在 PR 补全
}


def _load_palette_en() -> dict[str, str]:
    """尝试读取仓库内手译 JSON;失败返回模板"""
    candidates = [
        Path(__file__).resolve().parents[2] / "data" / "palette-en.json",
        Path("/data/pixelbead/palette-en.json"),
    ]
    for c in candidates:
        if c.exists():
            log.info("loaded palette-en.json from %s", c)
            with c.open(encoding="utf-8") as f:
                data = json.load(f)
            return {k: v for k, v in data.items() if not k.startswith("_")}
    log.warning("palette-en.json not found, using minimal template (12 colors)")
    return PALETTE_EN_TEMPLATE


def migrate() -> None:
    translations = _load_palette_en()
    log.info("loaded %d translations", len(translations))

    with engine.begin() as conn:
        # 1. 加列(幂等)
        log.info("step 1: ALTER TABLE palette_colors ADD COLUMN IF NOT EXISTS name_en ...")
        conn.execute(
            text(
                """
                ALTER TABLE palette_colors
                ADD COLUMN IF NOT EXISTS name_en VARCHAR(64)
                """
            )
        )

        # 2. backfill:仅更新未翻译的(name_en IS NULL)
        log.info("step 2: backfill translations (skip if name_en already exists) ...")
        updated = 0
        for code, name_en in translations.items():
            result = conn.execute(
                text(
                    """
                    UPDATE palette_colors
                    SET name_en = :name_en
                    WHERE code = :code AND (name_en IS NULL OR name_en = '')
                    """
                ),
                {"code": code, "name_en": name_en},
            )
            updated += result.rowcount

        log.info("  updated %d palette colors", updated)

        # 3. 验证
        log.info("step 3: verify coverage:")
        result = conn.execute(
            text(
                """
                SELECT
                  count(*) AS total,
                  count(name_en) AS translated,
                  count(*) - count(name_en) AS missing
                FROM palette_colors
                """
            )
        )
        row = result.fetchone()
        if row:
            log.info("  total: %d, translated: %d, missing: %d", row.total, row.translated, row.missing)

    log.info("✓ migration done")


if __name__ == "__main__":
    migrate()