"""FastAPI 应用入口"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .logging_setup import setup_logging
from .core.sentry import init_sentry  # ← 006
from .routers import health, palettes, auth, patterns, tasks, grid, usage, og, users  # ← 007/008/010/011


settings = get_settings()
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.log_level)
    init_sentry()  # ← 006:启动时初始化 Sentry
    log.info("api.start", extra={"env": settings.app_env})
    yield
    log.info("api.stop")


app = FastAPI(
    title="PixelBead API",
    description="拼豆图纸生成 API - 基于 pypindou",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url=None,
)

# ← 010 新增:tasks 路由
app.include_router(tasks.router)

# ← 008 新增:grid 端点
app.include_router(grid.router)
app.include_router(usage.router)  # ← 011
app.include_router(og.router)  # ← 007
app.include_router(users.router)  # ← 011

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 统一错误处理:返回 JSON 而非 HTML
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # ← 006 Sentry 上报
    try:
        from .core.sentry import capture_exception
        capture_exception(exc, tags={"path": str(request.url)})
    except Exception:
        pass
    log.exception("api.error", extra={"path": str(request.url)})
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": str(exc) if settings.app_env != "production" else "服务器内部错误",
        },
    )


app.include_router(health.router)
app.include_router(palettes.router)
app.include_router(auth.router)
app.include_router(patterns.router)
