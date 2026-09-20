# PixelBead API

FastAPI 后端服务,负责用户认证和拼豆图纸生成。

## 技术栈

- FastAPI 0.115+ / Uvicorn
- SQLAlchemy 2.0 + PostgreSQL
- JWT (python-jose)
- Bcrypt (passlib)
- pypindou (拼豆图纸算法)
- Pillow (图像处理)

## 本地运行

### 1. 准备环境

需要 PostgreSQL 和 Redis 在本机运行:

```bash
# 创建数据库(一次性)
sudo -u postgres psql -c "CREATE USER pixelbead WITH PASSWORD 'pixelbead_dev_pwd';"
sudo -u postgres psql -c "CREATE DATABASE pixelbead OWNER pixelbead;"
```

### 2. 配置环境

```bash
cp .env.example .env
# 按需修改
```

### 3. 安装依赖

```bash
uv sync          # 推荐:极快
# 或:pip install -e ".[dev]"
```

### 4. 初始化数据库

```bash
uv run python -m app.init_db
```

### 5. 启动服务

```bash
uv run uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- OpenAPI 文档: http://localhost:8000/docs

## 测试

```bash
uv run pytest -v
uv run ruff check .
uv run mypy app
```

## 目录结构

```
apps/api/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 入口
│   ├── config.py            # 配置加载
│   ├── db.py                # 数据库连接
│   ├── models.py            # SQLAlchemy 模型
│   ├── security.py          # JWT / 密码
│   ├── deps.py              # FastAPI 依赖
│   ├── logging_setup.py     # 结构化日志
│   ├── init_db.py           # 数据库初始化
│   ├── routers/
│   │   ├── health.py        # GET /health
│   │   ├── palettes.py      # GET /palettes
│   │   ├── auth.py          # POST /auth/register, /login, GET /me
│   │   └── patterns.py      # POST /patterns, GET /patterns, 下载
│   └── services/
│       └── pypindou_service.py  # pypindou 包装层
├── tests/
├── pyproject.toml
├── .env.example
└── README.md
```

## API 端点

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/health` | 否 | 健康检查 |
| GET | `/palettes` | 否 | 色卡列表 |
| POST | `/auth/register` | 否 | 注册 |
| POST | `/auth/login` | 否 | 登录 |
| GET | `/auth/me` | 是 | 当前用户信息 |
| POST | `/patterns` | 是 | 上传图片生成图纸 |
| GET | `/patterns` | 是 | 列出我的图纸 |
| GET | `/patterns/{id}` | 是 | 图纸详情 |
| GET | `/patterns/{id}/preview` | 是 | 下载预览图 PNG |
| GET | `/patterns/{id}/symbol` | 是 | 下载符号图 PNG |
