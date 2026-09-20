"""初始化数据库 - 启动时自动建表(替代 alembic,MVP 阶段简化)

生产应使用 alembic 迁移。本脚本幂等,反复跑安全。
"""
import logging

from .db import Base, engine
from . import models  # noqa: F401 - 触发模型注册

log = logging.getLogger(__name__)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    log.info("db.initialized", extra={"tables": list(Base.metadata.tables.keys())})


if __name__ == "__main__":
    init_db()
    print("✓ 数据库表已创建")
