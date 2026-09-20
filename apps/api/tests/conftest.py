"""pytest fixtures - 使用真 PostgreSQL 测试库"""
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 强制使用 PG 测试库(SQLite 不支持 String(36) primary key with OR queries)
os.environ["DATABASE_URL"] = (
    "postgresql+psycopg://pixelbead:pixelbead_dev_pwd@localhost:5432/pixelbead_test"
)
os.environ["JWT_SECRET"] = "test_secret_at_least_32_characters_long_xx"
os.environ["CORS_ORIGINS"] = "http://localhost:3000"

from app.db import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app import models  # noqa: F401,E402  # 触发模型注册

engine = create_engine(os.environ["DATABASE_URL"])
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    # 每个测试前后重建表(干净环境)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
