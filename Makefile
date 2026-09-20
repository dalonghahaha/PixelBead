SHELL := /bin/bash
.DEFAULT_GOAL := help

PYTHON ?= python3
UV ?= uv
PNPM ?= pnpm

# -------- 辅助命令 --------
.PHONY: help
help: ## 显示帮助
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# -------- 安装 --------
.PHONY: install
install: install-api install-web ## 安装全部依赖

.PHONY: install-api
install-api: ## 安装 API 依赖(uv)
	cd apps/api && $(UV) sync

.PHONY: install-web
install-web: ## 安装 Web 依赖(pnpm)
	$(PNPM) install

# -------- 数据库 --------
.PHONY: init-db
init-db: ## 初始化数据库(建表)
	cd apps/api && $(UV) run python -m app.init_db

.PHONY: pg-ready
pg-ready: ## 检查 PostgreSQL
	@pg_isready -h localhost -p 5432

# -------- 启动 --------
.PHONY: up
up: pg-ready ## 本地启动 web + api(无 Docker)
	@echo "启动 API..."
	@cd apps/api && $(UV) run uvicorn app.main:app --reload --port 8000 &
	@echo "启动 Web..."
	@cd apps/web && $(PNPM) dev

.PHONY: api
api: ## 只启动 API
	cd apps/api && $(UV) run uvicorn app.main:app --reload --port 8000

.PHONY: web
web: ## 只启动 Web
	cd apps/web && $(PNPM) dev

# -------- 测试 / Lint --------
.PHONY: test
test: ## 跑测试
	cd apps/api && $(UV) run pytest -v

.PHONY: lint
lint: lint-api lint-web ## 跑全部 lint

.PHONY: lint-api
lint-api: ## 后端 ruff
	cd apps/api && $(UV) run ruff check .

.PHONY: lint-web
lint-web: ## 前端 lint
	cd apps/web && $(PNPM) lint

.PHONY: typecheck
typecheck: typecheck-api typecheck-web ## 跑类型检查

.PHONY: typecheck-api
typecheck-api:
	cd apps/api && $(UV) run mypy app || true

.PHONY: typecheck-web
typecheck-web:
	$(PNPM) -r --filter web typecheck

# -------- Docker --------
.PHONY: docker-build
docker-build: ## 构建所有镜像
	docker compose build

.PHONY: docker-up
docker-up: ## 启动 docker compose
	docker compose up -d

.PHONY: docker-down
docker-down: ## 停止 docker compose
	docker compose down

.PHONY: clean
clean: ## 清理临时文件
	find . -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name '.pytest_cache' -exec rm -rf {} + 2>/dev/null || true
	rm -rf apps/api/.venv apps/api/storage apps/web/.next 2>/dev/null || true
