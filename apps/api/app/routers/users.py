"""spec 011 — 用户设置端点

PATCH /users/me/settings  →  更新 beads_per_pack
GET   /users/me/settings  →  读取当前设置
"""
from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import User, UserSettings

router = APIRouter(prefix="/users", tags=["users"])
log = logging.getLogger(__name__)


class UserSettingsResponse(BaseModel):
    beads_per_pack: int


class UserSettingsUpdate(BaseModel):
    beads_per_pack: Annotated[int, Field(ge=1, le=10000)] = 500


@router.get("/me/settings", response_model=UserSettingsResponse)
def get_my_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取当前用户设置"""
    settings = db.get(UserSettings, current_user.id)
    if not settings:
        # 默认值
        return UserSettingsResponse(beads_per_pack=500)
    return UserSettingsResponse(beads_per_pack=settings.beads_per_pack)


@router.patch("/me/settings", response_model=UserSettingsResponse)
def update_my_settings(
    payload: UserSettingsUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新当前用户设置(beads_per_pack 范围 1-10000)"""
    settings = db.get(UserSettings, current_user.id)
    if not settings:
        settings = UserSettings(
            user_id=current_user.id,
            beads_per_pack=payload.beads_per_pack,
        )
        db.add(settings)
    else:
        settings.beads_per_pack = payload.beads_per_pack
    db.commit()
    db.refresh(settings)
    return UserSettingsResponse(beads_per_pack=settings.beads_per_pack)