"""拼豆图纸端点 - 上传 + 生成 + 列表 + 下载"""
import io
import logging
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from PIL import Image
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..deps import get_current_user
from ..models import Pattern, User
from ..services import pypindou_service
from ..core.thresholds import SYNC_GENERATION_THRESHOLD as SYNC_THRESHOLD  # ← 010

router = APIRouter(prefix="/patterns", tags=["patterns"])
log = logging.getLogger(__name__)
settings = get_settings()


class PatternOut(BaseModel):
    id: str
    status: str
    palette: str
    width: int
    height: int
    max_colors: int | None = None
    prefilter: str
    cleanup: str
    dither: bool
    bead_size: str = "mini"  # ← 009 新增
    color_counts: dict[str, int] | None = None
    preview_url: str | None = None
    symbol_url: str | None = None
    error: str | None = None
    created_at: str
    completed_at: str | None = None


def _to_out(p: Pattern) -> PatternOut:
    base = "/patterns"
    return PatternOut(
        id=p.id,
        status=p.status,
        palette=p.palette,
        width=p.width,
        height=p.height,
        max_colors=p.max_colors,
        prefilter=p.prefilter,
        cleanup=p.cleanup,
        dither=p.dither,
        bead_size=p.bead_size,  # ← 009 新增
        color_counts=p.color_counts,
        preview_url=f"{base}/{p.id}/preview" if p.preview_path else None,
        symbol_url=f"{base}/{p.id}/symbol" if p.symbol_path else None,
        error=p.error,
        created_at=p.created_at.isoformat() + "Z",
        completed_at=p.completed_at.isoformat() + "Z" if p.completed_at else None,
    )


@router.post("", response_model=PatternOut, status_code=status.HTTP_201_CREATED)
async def create_pattern(
    file: Annotated[UploadFile, File(description="要转换的图片(JPG/PNG/WEBP,≤10MB)")],
    palette: Annotated[str, Form()] = "mard-221-alfonse-doudou",
    width: Annotated[int, Form(ge=8, le=200)] = 58,
    height: Annotated[int, Form(ge=8, le=200)] = 58,
    max_colors: Annotated[int | None, Form(ge=2, le=221)] = None,
    prefilter: Annotated[str, Form()] = "smooth",
    cleanup: Annotated[str, Form()] = "majority",
    dither: Annotated[bool, Form()] = False,
    bead_size: Annotated[str, Form(pattern=r"^(mini|midi)$")] = "mini",  # ← 009 新增
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """上传图片,生成拼豆图纸

    路由分流(010):
      - 小图(<=80×80):同步生成,返 PatternOut
      - 大图(>80×80):转发到 POST /tasks,返 TaskResponse(task_id + status)
    """
    if not pypindou_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="pypindou 不可用,无法生成图纸",
        )

    # ← 010 分流:大图自动转发到 /tasks
    if width > SYNC_THRESHOLD or height > SYNC_THRESHOLD:
        from .tasks import create_task  # 避免循环依赖
        return await create_task(
            file=file, palette=palette, width=width, height=height,
            max_colors=max_colors, prefilter=prefilter, cleanup=cleanup,
            dither=dither, bead_size=bead_size, db=db, current_user=current_user,
        )

    # 校验上传
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"不支持的图片格式: {file.content_type},仅支持 JPG/PNG/WEBP",
        )
    contents = await file.read()
    size_mb = len(contents) / 1024 / 1024
    if size_mb > settings.max_upload_mb:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"图片过大({size_mb:.1f}MB),最大 {settings.max_upload_mb}MB",
        )

    # 落库(状态:processing)
    pattern = Pattern(
        user_id=current_user.id,
        status="processing",
        palette=palette,
        width=width,
        height=height,
        max_colors=max_colors,
        prefilter=prefilter,
        cleanup=cleanup,
        dither=dither,
        bead_size=bead_size,  # ← 009 新增
    )
    db.add(pattern)
    db.commit()
    db.refresh(pattern)

    try:
        # 落临时文件给 pypindou
        upload_dir = settings.storage_path / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        ext = (file.filename or "upload").split(".")[-1].lower() or "png"
        tmp_path = upload_dir / f"{pattern.id}.{ext}"
        tmp_path.write_bytes(contents)

        # 验证可被 PIL 打开
        with Image.open(tmp_path) as img:
            img.verify()

        result = pypindou_service.generate_pattern_safe(
            image_path=tmp_path,
            palette=palette,
            width=width,
            height=height,
            max_colors=max_colors,
            prefilter=prefilter,
            cleanup=cleanup,
            dither=dither,
            bead_size=bead_size,  # ← 009 新增
        )

        # 渲染输出文件
        output_dir = settings.storage_path / "patterns" / pattern.id
        output_dir.mkdir(parents=True, exist_ok=True)
        preview_file = output_dir / "preview.png"
        symbol_file = output_dir / "symbols.png"

        pat_obj = result["pattern"]
        pat_obj.to_preview(scale=12).save(preview_file)
        pat_obj.to_symbol_chart(cell_size=24).save(symbol_file)

        pattern.status = "completed"
        pattern.color_counts = result["color_counts"]
        pattern.preview_path = str(preview_file)
        pattern.symbol_path = str(symbol_file)
        pattern.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(pattern)

        log.info(
            "pattern.generated",
            extra={
                "pattern_id": pattern.id,
                "user_id": current_user.id,
                "colors": len(result["color_counts"] or {}),
            },
        )
        return _to_out(pattern)
    except HTTPException:
        raise
    except Exception as e:
        pattern.status = "failed"
        pattern.error = str(e)[:500]
        pattern.completed_at = datetime.utcnow()
        db.commit()
        log.exception("pattern.failed", extra={"pattern_id": pattern.id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成失败: {e}",
        )


@router.get("", response_model=list[PatternOut])
def list_patterns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
):
    """列出当前用户的图纸(按创建时间倒序)"""
    items = (
        db.query(Pattern)
        .filter(Pattern.user_id == current_user.id)
        .order_by(Pattern.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_to_out(p) for p in items]


@router.get("/public", response_model=list[dict])
def list_public_patterns(
    db: Session = Depends(get_db),
    limit: int = 1000,
):
    """spec 007 — 公开图纸列表(供 sitemap 使用)

    返回:[{ id, updated_at }]
    注:不要求登录(供 sitemap 爬虫访问)
    """
    items = (
        db.query(Pattern.id, Pattern.public_at)
        .filter(Pattern.is_public == True)  # noqa: E712
        .order_by(Pattern.public_at.desc())
        .limit(limit)
        .all()
    )
    from datetime import datetime
    return [
        {
            "id": p.id,
            "updated_at": (p.public_at or datetime.utcnow()).isoformat() + "Z",
        }
        for p in items
    ]


@router.patch("/{pattern_id}/visibility")
async def toggle_visibility(
    pattern_id: str,
    is_public: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """spec 007 — 切换图纸公开/私有状态"""
    from datetime import datetime

    pat = db.get(Pattern, pattern_id)
    if not pat or pat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="图纸不存在")
    pat.is_public = is_public
    pat.public_at = datetime.utcnow() if is_public else None
    db.commit()
    return {"id": pat.id, "is_public": pat.is_public}


@router.get("/{pattern_id}", response_model=PatternOut)
def get_pattern(
    pattern_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pat = db.get(Pattern, pattern_id)
    if not pat or pat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="图纸不存在")
    return _to_out(pat)


def _safe_resolve(pattern: Pattern, kind: str) -> Path:
    """安全解析文件路径,防止路径穿越"""
    path_str = pattern.preview_path if kind == "preview" else pattern.symbol_path
    if not path_str:
        raise HTTPException(status_code=404, detail=f"{kind} 文件不存在")
    p = Path(path_str).resolve()
    base = settings.storage_path.resolve()
    if not str(p).startswith(str(base)):
        raise HTTPException(status_code=403, detail="非法路径")
    if not p.exists():
        raise HTTPException(status_code=404, detail="文件已丢失")
    return p


@router.get("/{pattern_id}/preview")
def get_preview(
    pattern_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pat = db.get(Pattern, pattern_id)
    if not pat or pat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="图纸不存在")
    return FileResponse(_safe_resolve(pat, "preview"), media_type="image/png")


@router.get("/{pattern_id}/symbol")
def get_symbol(
    pattern_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pat = db.get(Pattern, pattern_id)
    if not pat or pat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="图纸不存在")
    return FileResponse(_safe_resolve(pat, "symbol"), media_type="image/png")


@router.delete("/{pattern_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pattern(
    pattern_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除当前用户的图纸(DB 行 + storage 文件)

    安全:只能删自己的(pat.user_id != current_user → 404,不区分存在与否防枚举)
    原子:文件删失败不阻断 DB 删(DB 是真源),但 try/except 防 storage 路径不存在。
    """
    pat = db.get(Pattern, pattern_id)
    if not pat or pat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="图纸不存在")
    # 删 storage 目录(整张图含 preview + symbol + grid)
    storage_dir = settings.storage_path / "patterns" / pattern_id
    if storage_dir.exists():
        shutil.rmtree(storage_dir, ignore_errors=True)
    db.delete(pat)
    db.commit()
    return None
