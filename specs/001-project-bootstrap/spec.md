# Feature 001 — Project Bootstrap

## Overview

PixelBead 项目的全栈基础脚手架,使团队可以在本地一键启动 web、api、数据库,并保证 CI 可重复构建。
不包含业务功能(用户系统、图片生成)。后续 feature(user-auth、image-to-bead-pattern)将直接基于此骨架开发。

## User Scenarios & Testing

### Scenario 1 — 新开发者首次跑通本地环境
**角色**:新加入的开发者
**流程**:
1. 克隆仓库到本地
2. 复制 `.env.example` 为 `.env`
3. 执行 `make up` 或 `docker compose up -d`
4. 浏览器访问 http://localhost:3000 ,看到 PixelBead 占位首页(显示项目名 + 三个 feature 的状态卡片)
5. 访问 http://localhost:8000/docs ,看到 FastAPI 自动生成的 OpenAPI 文档

**验收标准**:
- `make up` 在干净环境下一次性启动成功,无报错
- web 首页响应 < 2 秒
- FastAPI `/health` 返回 `{"status":"ok"}`,`/palettes` 返回非空列表

### Scenario 2 — CI 自动校验
**角色**:CI 系统(GitHub Actions)
**流程**:
1. 提交 PR 触发 CI
2. CI 跑 lint + type-check + unit test
3. CI 跑 docker compose build,确认镜像可构建

**验收标准**:
- PR 状态显示 lint/test/build 三项全绿
- 单测覆盖率 ≥ 50%(项目骨架阶段)

### Scenario 3 — 部署到生产
**角色**:运维
**流程**:
1. 在服务器上 `git clone` + `docker compose -f docker-compose.prod.yml up -d`
2. 配置域名 + 反向代理
3. 用户访问 https://pixelbead.example.com 看到首页

**验收标准**:
- 生产 compose 文件能构建 web/api + 连接外部 PG/Redis
- 环境变量通过 `.env.prod` 管理,不在镜像中硬编码密钥

## Functional Requirements

### FR-1: Monorepo 结构
仓库根目录包含两个独立应用 + 一个共享包:
- `apps/web` — Next.js 14 (App Router) + TypeScript + Tailwind CSS
- `apps/api` — FastAPI + Python 3.10+ + pypindou
- `packages/shared` — TypeScript 类型包,供前后端共享 DTO/常量

根目录提供 `pnpm-workspace.yaml` 实现 workspace 统一管理。

### FR-2: Web 应用基础
- Next.js 14 App Router,渲染 `/` 占位首页
- Tailwind CSS 已配置,提供基础配色
- TypeScript 严格模式(`strict: true`)
- 提供健康检查端点 `/api/health` 返回 `{status:"ok",timestamp}`
- 提供基础布局组件(Header / Footer / Container)
- 环境变量通过 `.env.local` 管理,启动时校验必填项

### FR-3: API 应用基础
- FastAPI + Uvicorn,监听 `:8000`
- 暴露以下端点:
  - `GET /health` — 返回 `{status:"ok"}`
  - `GET /palettes` — 调用 `pypindou.list_palettes()` 返回色卡列表
  - `GET /docs` — FastAPI 自动 OpenAPI 文档(开发模式)
- SQLAlchemy 2.0 + Alembic 已配置,数据库连接可读写
- pypindou 已安装,可被调用
- 提供统一的错误处理中间件(返回 JSON 而非 HTML)
- 日志使用 Python `logging`,输出到 stdout(JSON 格式)

### FR-4: 数据库与基础设施
- PostgreSQL 14+ 提供持久化存储
- Redis 6+ 提供缓存与未来异步任务 broker
- 数据库初始化脚本自动创建 `pixelbead` 用户与同名数据库
- Alembic 迁移目录就绪,首次启动自动执行迁移

### FR-5: Docker Compose 一键启动
- `docker-compose.yml` 定义 web、api、postgres、redis 四个服务
- `docker-compose.prod.yml` 覆盖生产配置(外置 PG/Redis)
- 开发模式支持热重载(代码改动无需重启容器)
- 数据卷挂载避免容器重启丢数据

### FR-6: 代码质量工具
- **前端**:ESLint + Prettier + TypeScript 类型检查
- **后端**:Ruff + mypy + pytest
- 提供 `Makefile` 聚合常用命令:`make lint` / `make test` / `make up` / `make down` / `make migrate`
- 提交前通过 `lefthook` 或简单 git hook 触发 lint

### FR-7: CI/CD 基础
- `.github/workflows/ci.yml` 在 push/PR 时运行:
  - web:lint + type-check + build
  - api:ruff + mypy + pytest
  - docker compose build(可选)
- `.github/workflows/deploy.yml` 占位,后续 feature 补全

### FR-8: 文档
- `README.md` 包含:
  - 项目简介
  - 技术栈列表
  - 快速开始(本地启动 / Docker 启动 / 生产部署)
  - 目录结构说明
  - 三个 feature 的当前状态链接
- `docs/architecture.md` 简述前后端架构与数据流
- 每个子应用有独立 `README.md` 说明运行方式

## Non-Functional Requirements

### NFR-1: 启动性能
- `make up` 后 60 秒内 web 首页可访问
- API `/health` 响应 < 100ms

### NFR-2: 可观测性
- 所有服务日志输出 JSON 到 stdout
- web/api 都暴露 `/health` 端点
- 关键操作(启动、迁移完成)输出结构化日志

### NFR-3: 安全性
- 数据库密码使用环境变量,不进镜像
- FastAPI 启用 CORS 白名单(开发模式允许 `localhost:3000`)
- 未来用户密码 bcrypt 哈希(本 feature 不实现)

### NFR-4: 可移植性
- 所有 Python 依赖通过 `pyproject.toml` 管理
- 所有 Node 依赖通过 `package.json` 管理
- 镜像构建不依赖宿主环境

## Key Entities

| Entity | 描述 | 归属 |
|--------|------|------|
| `HealthStatus` | 健康检查响应 | shared |
| `PaletteInfo` | 拼豆色卡信息(`id`, `title`, `standard`, `count`) | shared |

## Success Criteria

1. ✅ 新开发者按 README 步骤,15 分钟内完成本地启动
2. ✅ CI 在 PR 触发后 5 分钟内完成所有检查
3. ✅ `make up` 一次性启动所有服务,无报错
4. ✅ Docker 镜像构建成功,镜像大小 web < 500MB,api < 800MB
5. ✅ `pnpm --filter web build` 与 `cd apps/api && uv build` 都能成功产出生产产物
6. ✅ 三个 feature 的 spec 目录已建好,后续开发有清晰入口

## Assumptions

- 目标部署环境为 Linux(x86_64),开发可在 macOS/Linux
- Python 3.10+ 已安装(开发机)
- Node 18+ 已安装(开发机)
- Docker 24+ 已安装(开发机)
- 不实现 OAuth、SSO、监控告警、生产 HTTPS 证书

## Out of Scope

- 用户注册登录(由 feature 002 实现)
- 图片上传与拼豆图纸生成(由 feature 003 实现)
- 生产 HTTPS / CDN / WAF
- 邮件发送、文件存储 CDN 加速
- 多语言 / 国际化
