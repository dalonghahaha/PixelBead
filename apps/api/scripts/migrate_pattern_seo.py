#!/usr/bin/env python3
"""spec 007 — patterns 表加 SEO 字段 + 索引

幂等:可反复执行(ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS)
"""
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text

from app.db import engine

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)


def migrate() -> None:
    with engine.begin() as conn:
        log.info("step 1: ALTER TABLE patterns ADD COLUMN IF NOT EXISTS seo fields ...")
        conn.execute(
            text(
                """
                ALTER TABLE patterns
                ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE NOT NULL,
                ADD COLUMN IF NOT EXISTS public_at TIMESTAMP NULL,
                ADD COLUMN IF NOT EXISTS og_image_url VARCHAR(255) NULL
                """
            )
        )

        log.info("step 2: CREATE INDEX IF NOT EXISTS idx_patterns_public ...")
        conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS idx_patterns_public
                ON patterns(is_public, public_at)
                """
            )
        )

        log.info("step 3: verify distribution:")
        result = conn.execute(
            text(
                """
                SELECT is_public, count(*) AS n
                FROM patterns
                GROUP BY is_public
                ORDER BY is_public
                """
            )
        )
        for row in result:
            log.info("  is_public=%s: %d", row.is_public, row.n)

    log.info("✓ migration done")


if __name__ == "__main__":
    migrate()