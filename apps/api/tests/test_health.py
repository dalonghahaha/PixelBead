"""健康检查 + 基础端点测试"""
from fastapi.testclient import TestClient


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "pixelbead-api"


def test_palettes_returns_list(client):
    res = client.get("/palettes")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
