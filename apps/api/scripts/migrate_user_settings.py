#!/usr/bin/env python3
"""spec 011 — user_settings 表加 beads_per_pack 字段

幂等:可反复执行
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
        log.info("step 1: ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS beads_per_pack ...")
        conn.execute(
            text(
                """
                ALTER TABLE user_settings
                ADD COLUMN IF NOT EXISTS beads_per_pack INT DEFAULT 500 NOT NULL
                """
            )
        )

        log.info("step 2: backfill existing rows to beads_per_pack = 500 ...")
        result = conn.execute(
            text(
                """
                UPDATE user_settings
                SET beads_per_pack = 500
                WHERE beads_per_pack IS NULL OR beads_per_pack = 0
                """
            )
        )
        log.info("  backfilled %d rows", result.rowcount)

    log.info("✓ migration done")


if __name__ == "__main__":
    migrate()