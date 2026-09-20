# PixelBead 🧩

> 上传图片,一键生成可打印的拼豆图纸

把任意图片(照片、插画、Logo)转成拼豆/Perler Beads 风格的像素画图纸,自动匹配真实拼豆色号、统计用量、导出 PNG。

**算法核心**:[pypindou](https://github.com/HansBug/pypindou)(Apache 2.0 开源)

---

## 当前状态(MVP)

| Feature | 状态 | 路径 |
|---------|------|------|
| 001 项目骨架 | ✅ 完成 | `specs/001-project-bootstrap/` |
| 002 用户系统 | ✅ 完成 | `specs/002-user-auth/` |
| 003 图纸生成 | ✅ 完成 | `specs/003-image-to-bead-pattern/` |

**已实现能力:**
- 用户注册 / 登录(JWT 鉴权)
- 上传 JPG/PNG/WEBP 图片(最大 10MB)
- 选择拼豆色卡(默认 MARD 221 国内色卡)
- 自定义网格尺寸、限色数、预处理、抖动
- 同步生成拼豆图纸(预览图 + 符号图)
- 色号用量统计
- 个人图纸列表 / 下载

---

## 技术栈

**前端:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
**后端:** FastAPI + Python 3.10+ + SQLAlchemy + pypindou
**数据库:** PostgreSQL 14+
**缓存/队列:** Redis 6+
**Monorepo:** pnpm workspaces

---

## 快速开始

### 一、本地开发(推荐先试这个)

#### 1. 前置依赖

需要本机安装:
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Redis 6+

#### 2. 创建数据库

```bash
sudo -u postgres psql -c "CREATE USER pixelbead WITH PASSWORD 'pixelbead_dev_pwd';"
sudo -u postgres psql -c "CREATE DATABASE pixelbead OWNER pixelbead;"
```

#### 3. 启动 Redis

```bash
redis-server --daemonize yes
```

#### 4. 安装项目依赖

```bash
# 在项目根目录
make install
```

#### 5. 初始化数据库表

```bash
make init-db
```

#### 6. 一键启动

```bash
make up
```

- Web: http://localhost:3000
- API: http://localhost:8000
- API 文档: http://localhost:8000/docs

---

### 二、Docker Compose 启动

```bash
docker compose up -d
```

四个服务一键拉起:`web`、`api`、`postgres`、`redis`。

---

## 目录结构

```
PixelBead/
├── apps/
│   ├── web/                  # Next.js 前端
│   │   ├── app/              # App Router 页面
│   │   ├── components/       # 共享组件
│   │   ├── lib/              # API 客户端、auth
│   │   └── package.json
│   └── api/                  # FastAPI 后端
│       ├── app/              # 应用代码
│       │   ├── routers/      # 路由(health/palettes/auth/patterns)
│       │   ├── services/     # 业务服务(pypindou 包装)
│       │   ├── models.py     # SQLAlchemy 模型
│       │   └── main.py       # FastAPI 入口
│       ├── tests/            # pytest 测试
│       └── pyproject.toml
├── packages/
│   └── shared/               # 前后端共享 TS 类型
├── specs/                    # Spec Kit 规范文档
│   ├── 001-project-bootstrap/
│   ├── 002-user-auth/
│   └── 003-image-to-bead-pattern/
├── .specify/                 # Spec Kit 工作区
│   ├── init-options.json     # 顺序编号配置
│   ├── memory/constitution.md # 项目宪章
│   └── templates/            # 本地模板覆盖(可选)
├── .github/workflows/        # CI 配置
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## API 端点速查

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/health` | 否 | 健康检查 |
| GET | `/palettes` | 否 | 色卡列表 |
| POST | `/auth/register` | 否 | 注册 |
| POST | `/auth/login` | 否 | 登录 |
| GET | `/auth/me` | 是 | 当前用户 |
| POST | `/patterns` | 是 | 上传图片生成图纸 |
| GET | `/patterns` | 是 | 我的图纸列表 |
| GET | `/patterns/{id}/preview` | 是 | 下载预览图 |
| GET | `/patterns/{id}/symbol` | 是 | 下载符号图 |

---

## 常用命令

```bash
make help          # 查看所有命令
make install       # 安装全部依赖
make init-db       # 初始化数据库
make up            # 启动 web + api
make test          # 跑测试
make lint          # 跑 lint
make typecheck     # 类型检查
make clean         # 清理临时文件
```

---

## License

MIT(项目代码)
第三方依赖:
- pypindou: Apache 2.0
- Next.js: MIT
- FastAPI: MIT
