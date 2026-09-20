#!/usr/bin/env python3
"""spec 009 — 数据库迁移:patterns 表加 bead_size 列 + 历史 backfill

用法:
    cd apps/api && python -m scripts.migrate_bead_size

幂等:可反复执行(ADD COLUMN IF NOT EXISTS + UPDATE WHERE bead_size IS NULL)
"""
import logging
import sys
from pathlib import Path

# 允许直接 python scripts/migrate_bead_size.py 运行
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text

from app.db import engine

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)


def migrate() -> None:
    with engine.begin() as conn:
        # 1. 加列(幂等)
        log.info("step 1: ALTER TABLE patterns ADD COLUMN IF NOT EXISTS bead_size ...")
        conn.execute(
            text(
                """
                ALTER TABLE patterns
                ADD COLUMN IF NOT EXISTS bead_size VARCHAR(16) DEFAULT 'mini' NOT NULL
                """
            )
        )

        # 2. backfill 历史数据(空字符串/NULL → 'mini')
        log.info("step 2: backfill existing rows to bead_size = 'mini' ...")
        result = conn.execute(
            text(
                """
                UPDATE patterns
                SET bead_size = 'mini'
                WHERE bead_size IS NULL OR bead_size = ''
                """
            )
        )
        log.info("  backfilled %d rows", result.rowcount)

        # 3. 验证(打印分布)
        log.info("step 3: verify distribution:")
        result = conn.execute(
            text(
                """
                SELECT bead_size, count(*) AS n
                FROM patterns
                GROUP BY bead_size
                ORDER BY bead_size
                """
            )
        )
        for row in result:
            log.info("  %s: %d", row.bead_size, row.n)

    log.info("✓ migration done")


if __name__ == "__main__":
    migrate()