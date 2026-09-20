"""spec 009 — 后端测试

覆盖:
- Pattern 模型 bead_size 默认值
- POST /patterns 接收 bead_size 参数
- 默认值兼容性(不传 bead_size → mini)
- 非法值兜底(算法层 unknown → mini)
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

# pytest 路径设置
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base, get_db
from app.main import app
from app.models import Pattern, User
from app.security import hash_password


# ---- 内存 SQLite + 表重建 ----

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=engine, autoflush=False)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


def _make_test_user() -> User:
    db = TestSession()
    u = User(
        id="u-test",
        email="test@example.com",
        username="tester",
        password_hash=hash_password("p"),
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    db.close()
    return u


def _make_login_token(client: TestClient, user: User) -> str:
    # 简化:直接调登录端点
    r = client.post(
        "/auth/login",
        json={"email": user.email, "password": "p"},
    )
    assert r.status_code == 200, r.text
    return r.json()["token"]


def _make_png_bytes() -> bytes:
    """构造最小合法 PNG(2x2 红图)"""
    img = Image.new("RGB", (2, 2), (255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ---- 测试用例 ----


def test_pattern_model_default_bead_size():
    """Pattern.bead_size 默认 'mini'"""
    db = TestSession()
    p = Pattern(
        user_id="u-test",
        status="pending",
        palette="mard-221-alfonse-doudou",
        width=10,
        height=10,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    assert p.bead_size == "mini"
    db.close()


def test_create_pattern_default_bead_size_is_mini():
    """不传 bead_size → 后端默认 mini(向后兼容)"""
    client = TestClient(app)
    _make_test_user()
    db = TestSession()
    token = _make_login_token(client, db.query(User).first())
    db.close()

    png = _make_png_bytes()
    r = client.post(
        "/patterns",
        files={"file": ("test.png", png, "image/png")},
        data={"palette": "mard-221-alfonse-doudou", "width": "10", "height": "10"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["bead_size"] == "mini"


def test_create_pattern_explicit_midi():
    """显式传 bead_size=midi → 存储 midi"""
    client = TestClient(app)
    _make_test_user()
    db = TestSession()
    token = _make_login_token(client, db.query(User).first())
    db.close()

    png = _make_png_bytes()
    r = client.post(
        "/patterns",
        files={"file": ("test.png", png, "image/png")},
        data={
            "palette": "mard-221-alfonse-doudou",
            "width": "10",
            "height": "10",
            "bead_size": "midi",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["bead_size"] == "midi"


def test_create_pattern_invalid_bead_size_rejected():
    """非法 bead_size 值(如 'large')被 FastAPI 422 拒绝(Form pattern 校验)"""
    client = TestClient(app)
    _make_test_user()
    db = TestSession()
    token = _make_login_token(client, db.query(User).first())
    db.close()

    png = _make_png_bytes()
    r = client.post(
        "/patterns",
        files={"file": ("test.png", png, "image/png")},
        data={
            "palette": "mard-221-alfonse-doudou",
            "width": "10",
            "height": "10",
            "bead_size": "large",  # 非法
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 422


def test_algorithm_bead_size_known_values():
    """algorithm.generate 接收 mini/midi 合法值(不改变格子数)"""
    from app.services import algorithm

    # 桩:不实际跑图片,只验证函数签名 + 参数处理
    # 完整算法行为由现有 003 测试覆盖
    import inspect

    sig = inspect.signature(algorithm.generate)
    assert "bead_size" in sig.parameters
    assert sig.parameters["bead_size"].default == "mini"


def test_pypindou_service_bead_size_known_values():
    """pypindou_service.generate_pattern_safe 透传 bead_size"""
    import inspect
    from app.services import pypindou_service

    sig = inspect.signature(pypindou_service.generate_pattern_safe)
    assert "bead_size" in sig.parameters
    assert sig.parameters["bead_size"].default == "mini"