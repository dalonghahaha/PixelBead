"""FastAPI 依赖项"""
from typing import Annotated

from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from .db import get_db
from .models import User
from .security import decode_token
from jose import JWTError


def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    pixelbead_token: Annotated[str | None, Cookie()] = None,
    db: Annotated[Session, Depends(get_db)] = None,
) -> User:
    """从 Authorization: Bearer <token> 或 pixelbead_token cookie 中解析当前用户

    为什么走 cookie fallback：<img> 标签不能加 Authorization header,
    浏览器只能发 cookie。生成的预览图 / 符号图需要图片请求带 token,
    不能靠前端 fetch 转 blob(每个预览多一次 RTT + 内存压力)。
    所以这个依赖两种认证都接受:fetch 请求用 header,<img> 请求用 cookie。
    """
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
    elif pixelbead_token:
        token = pixelbead_token.strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少认证凭据(Authorization Bearer header 或 pixelbead_token cookie)",
        )
    try:
        payload = decode_token(token)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"无效 token: {e}",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="token 缺少 sub 字段",
        )

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )
    return user
