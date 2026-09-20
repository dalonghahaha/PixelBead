"""健康检查端点"""
from datetime import datetime
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "pixelbead-api",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
