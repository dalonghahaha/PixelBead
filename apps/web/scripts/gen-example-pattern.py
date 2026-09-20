#!/usr/bin/env python3
"""
T007/T008: 把 apps/web/public/examples/original.jpg 转成 29×29 MARD 色板拼豆图案
一次性脚本 — 手工运行,输出 checked-in 的 pattern.png。

需要 PYTHONPATH 包含 apps/api/vendor(本地 vendor 包)。
"""
import sys
from pathlib import Path

VENDOR = Path(__file__).resolve().parents[3] / "apps" / "api" / "vendor"
sys.path.insert(0, str(VENDOR))

from pypindou import generate_pattern  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]  # apps/web
ORIGINAL = ROOT / "public" / "examples" / "original.jpg"
PATTERN = ROOT / "public" / "examples" / "pattern.png"

def main():
    if not ORIGINAL.exists():
        sys.exit(f"❌ 缺原图: {ORIGINAL}\n先 T006 准备一张 CC0 照片")

    print(f"原图: {ORIGINAL} ({ORIGINAL.stat().st_size // 1024} KB)")

    pattern = generate_pattern(
        ORIGINAL,
        width=29,
        height=29,
        palette="mard-221-alfonse-doudou",
        fit="cover",          # 填满 29×29,裁剪
        background="white",
        dither_strength=1.0,
        color_space="lab",
    )

    # Pattern 对象有 save / to_png 等方法(看 pypindou 版本)
    if hasattr(pattern, "save"):
        pattern.save(PATTERN)
    elif hasattr(pattern, "to_png"):
        pattern.to_png(PATTERN)
    elif hasattr(pattern, "image"):
        pattern.image.save(PATTERN)
    elif hasattr(pattern, "to_image"):
        pattern.to_image().save(PATTERN)
    else:
        sys.exit(f"❌ Pattern 对象无可用 save 方法: {dir(pattern)[:20]}")

    size = PATTERN.stat().st_size // 1024
    print(f"✓ 写出: {PATTERN} ({size} KB)")


if __name__ == "__main__":
    main()