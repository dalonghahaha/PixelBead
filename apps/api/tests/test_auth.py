"""注册 / 登录流程测试"""


def test_register_login_me_flow(client):
    # 注册
    res = client.post("/auth/register", json={
        "email": "alice@example.com",
        "username": "alice",
        "password": "secret123",
    })
    assert res.status_code == 201, res.text
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == "alice@example.com"
    token = data["token"]

    # me
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["username"] == "alice"

    # 登录
    res = client.post("/auth/login", json={
        "email": "alice@example.com",
        "password": "secret123",
    })
    assert res.status_code == 200
    assert "token" in res.json()


def test_register_duplicate_email(client):
    payload = {
        "email": "bob@example.com",
        "username": "bob",
        "password": "secret123",
    }
    assert client.post("/auth/register", json=payload).status_code == 201
    payload2 = {
        "email": "bob@example.com",
        "username": "bob2",
        "password": "secret456",
    }
    res = client.post("/auth/register", json=payload2)
    assert res.status_code == 409


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "email": "carol@example.com",
        "username": "carol",
        "password": "secret123",
    })
    res = client.post("/auth/login", json={
        "email": "carol@example.com",
        "password": "wrong",
    })
    assert res.status_code == 401


def test_me_requires_token(client):
    res = client.get("/auth/me")
    assert res.status_code == 401
