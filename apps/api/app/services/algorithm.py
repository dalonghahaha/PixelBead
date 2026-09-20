"""拼豆图纸生成算法 - 基于 vendor 的 palettes.json 自研实现

参考算法思路:
1. 像素化:把图缩到目标网格(主色提取,而非均值)
2. 颜色量化:每格颜色映射到调色板最近色(Lab 距离优先)
3. 杂色清理:邻域多数清理 + 小连通域合并
4. 输出:网格矩阵 + 色号统计 + 预览图 + 符号图

设计原则:
- 纯 Python,只用 Pillow + numpy(已装)
- 利用 vendor/pypindou/resources/palettes.json 的真实色卡数据
- 不依赖 scikit-learn / scikit-image(避免重依赖)
"""
from __future__ import annotations

import io
import json
import math
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFont


PALETTES_PATH = Path(__file__).resolve().parents[2] / "vendor" / "pypindou" / "resources" / "palettes.json"


@dataclass
class BeadColor:
    code: str
    name: str
    rgb: tuple[int, int, int]


@dataclass
class Palette:
    id: str
    title: str
    standard: str
    colors: list[BeadColor] = field(default_factory=list)


# ---------- 色卡加载 ----------

_palettes_cache: dict[str, Palette] = {}
_default_id: str | None = None


def _hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    h = hex_str.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _load_palettes() -> None:
    global _default_id
    if _palettes_cache:
        return
    with open(PALETTES_PATH, encoding="utf-8") as f:
        data = json.load(f)

    _default_id = data.get("default_palette")
    for p in data["palettes"]:
        colors = [
            BeadColor(
                code=c["code"],
                name=c.get("name", c["code"]),
                rgb=tuple(c["rgb"]),
            )
            for c in p["colors"]
        ]
        pal = Palette(
            id=p["id"],
            title=p["title"],
            standard=p.get("standard", "domestic"),
            colors=colors,
        )
        _palettes_cache[p["id"]] = pal


def list_palettes() -> list[dict[str, Any]]:
    _load_palettes()
    return [
        {"id": p.id, "title": p.title, "standard": p.standard, "count": len(p.colors)}
        for p in _palettes_cache.values()
    ]


def get_palette(pid: str) -> Palette:
    _load_palettes()
    if pid not in _palettes_cache:
        # fallback 到默认
        if _default_id and _default_id in _palettes_cache:
            return _palettes_cache[_default_id]
        raise KeyError(f"未知色卡: {pid}")
    return _palettes_cache[pid]


# ---------- RGB <-> Lab 转换(简化版 D65) ----------

def _srgb_to_linear(c: float) -> float:
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgb_to_lab(r: int, g: int, b: int) -> tuple[float, float, float]:
    rl, gl, bl = _srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b)
    # sRGB -> XYZ (D65)
    x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047
    y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750
    z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883
    # XYZ -> Lab
    def f(t: float) -> float:
        return t ** (1 / 3) if t > 0.008856 else (7.787 * t + 16 / 116)

    fx, fy, fz = f(x), f(y), f(z)
    L = 116 * fy - 16
    a = 500 * (fx - fy)
    bb = 200 * (fy - fz)
    return L, a, bb


# 预计算色卡 Lab 值
def _palette_lab(palette: Palette) -> tuple[np.ndarray, list[BeadColor]]:
    labs = np.array([rgb_to_lab(*c.rgb) for c in palette.colors], dtype=np.float32)
    return labs, palette.colors


# ---------- 主导色提取(替代均值池化,避免灰色毛边) ----------

def _dominant_color(region: np.ndarray) -> tuple[int, int, int]:
    """region 形状: (H, W, 3|4) uint8。返回该区域出现频率最高的 RGB。"""
    flat = region.reshape(-1, region.shape[-1])
    # 忽略透明 / 半透明
    if flat.shape[1] == 4:
        alpha = flat[:, 3]
        flat = flat[alpha > 128, :3]
    else:
        flat = flat[:, :3]
    if len(flat) == 0:
        return 255, 255, 255
    # 量化到 5-bit per channel 减少 unique 数,加速 mode 计算
    quantized = (flat // 8).astype(np.int32)
    keys = quantized[:, 0] * 1024 + quantized[:, 1] * 32 + quantized[:, 2]
    counts = np.bincount(keys)
    top_key = int(np.argmax(counts))
    q = np.array([
        top_key // 1024,
        (top_key // 32) % 32,
        top_key % 32,
    ], dtype=np.int32) * 8 + 4
    return int(q[0]), int(q[1]), int(q[2])


# ---------- 核心:生成拼豆图纸 ----------

@dataclass
class PatternResult:
    grid: np.ndarray  # 形状 (height, width),值为 palette 中颜色的索引
    palette: Palette
    color_counts: dict[str, int]
    width: int
    height: int

    def to_preview(self, scale: int = 12) -> Image.Image:
        """生成预览图:每格放大 scale 倍,纯色填充"""
        h, w = self.grid.shape
        img = Image.new("RGB", (w * scale, h * scale), (255, 255, 255))
        px = img.load()
        for y in range(h):
            for x in range(w):
                r, g, b = self.palette.colors[int(self.grid[y, x])].rgb
                for dy in range(scale):
                    for dx in range(scale):
                        px[x * scale + dx, y * scale + dy] = (r, g, b)
        return img

    def to_symbol_chart(
        self,
        cell_size: int = 24,
        out_format: str = "PNG",
    ) -> Image.Image:
        """生成符号图:每格中央标注色号 + 网格线"""
        h, w = self.grid.shape
        img = Image.new("RGB", (w * cell_size, h * cell_size), (255, 255, 255))
        draw = ImageDraw.Draw(img)

        # 字体
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size=max(8, cell_size // 3))
        except OSError:
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/wqy/wqy-microhei.ttc", size=max(8, cell_size // 3))
            except OSError:
                font = ImageFont.load_default()

        # 填充颜色
        for y in range(h):
            for x in range(w):
                r, g, b = self.palette.colors[int(self.grid[y, x])].rgb
                x0, y0 = x * cell_size, y * cell_size
                draw.rectangle([x0, y0, x0 + cell_size - 1, y0 + cell_size - 1], fill=(r, g, b))

        # 标注色号
        for y in range(h):
            for x in range(w):
                code = self.palette.colors[int(self.grid[y, x])].code
                r, g, b = self.palette.colors[int(self.grid[y, x])].rgb
                luminance = 0.299 * r + 0.587 * g + 0.114 * b
                text_color = (0, 0, 0) if luminance > 128 else (255, 255, 255)
                cx, cy = x * cell_size + cell_size // 2, y * cell_size + cell_size // 2
                bbox = draw.textbbox((0, 0), code, font=font)
                tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
                draw.text((cx - tw // 2, cy - th // 2), code, fill=text_color, font=font)

        # 网格线
        for x in range(w + 1):
            color = (80, 80, 80) if x % 5 == 0 else (200, 200, 200)
            width = 2 if x % 5 == 0 else 1
            draw.line([(x * cell_size, 0), (x * cell_size, h * cell_size)], fill=color, width=width)
        for y in range(h + 1):
            color = (80, 80, 80) if y % 5 == 0 else (200, 200, 200)
            width = 2 if y % 5 == 0 else 1
            draw.line([(0, y * cell_size), (w * cell_size, y * cell_size)], fill=color, width=width)

        return img


def generate(
    image_path: str | Path | Image.Image,
    palette_id: str = "mard-221-alfonse-doudou",
    width: int = 58,
    height: int = 58,
    max_colors: int | None = None,
    prefilter: str = "smooth",
    cleanup: str = "majority",
    dither: bool = False,
) -> PatternResult:
    """生成拼豆图纸主入口

    Args:
        image_path: 输入图片路径或 PIL.Image
        palette_id: 色卡 ID
        width: 输出网格宽(格数)
        height: 输出网格高(格数)
        max_colors: 限制总颜色数(超限并入最相似色)
        prefilter: 'smooth' | 'none' — 是否做抗锯齿预处理
        cleanup: 'majority' | 'none' — 邻域多数清理
        dither: 是否启用 Floyd-Steinberg 抖动
    """
    pal = get_palette(palette_id)
    pal_lab, pal_colors = _palette_lab(pal)

    # 1. 加载图片
    if isinstance(image_path, Image.Image):
        img = image_path.convert("RGBA")
    else:
        img = Image.open(image_path).convert("RGBA")

    src_w, src_h = img.size
    if src_w == 0 or src_h == 0:
        raise ValueError("图片尺寸为 0")

    # 2. 计算中间缩放比例:目标 N 倍放大后下采样,提升每格质量
    intermediate_w = width * 4 if dither else width * 4
    intermediate_h = height * 4 if dither else height * 4

    if prefilter == "smooth":
        # 平滑:LANCZOS 抗锯齿到中间尺寸
        interp = Image.Resampling.LANCZOS if dither else Image.Resampling.LANCZOS
    else:
        interp = Image.Resampling.BILINEAR

    # cover 模式:保持比例填满
    src_ratio = src_w / src_h
    target_ratio = width / height
    if src_ratio > target_ratio:
        # 原图更宽,以高为准
        new_h = intermediate_h
        new_w = int(new_h * src_ratio)
    else:
        new_w = intermediate_w
        new_h = int(new_w / src_ratio)
    resized = img.resize((new_w, new_h), interp)

    # 居中裁剪到目标中间尺寸
    x0 = (new_w - intermediate_w) // 2
    y0 = (new_h - intermediate_h) // 2
    cropped = resized.crop((x0, y0, x0 + intermediate_w, y0 + intermediate_h))

    arr = np.array(cropped)  # shape: (intermediate_h, intermediate_w, 4)

    # 3. 主导色提取 → width × height 网格
    cell_h = intermediate_h // height
    cell_w = intermediate_w // width
    grid = np.zeros((height, width), dtype=np.int32)

    if dither:
        # Floyd-Steinberg 抖动(Lab 空间误差扩散)
        arr_lab = np.array(
            [
                [rgb_to_lab(*arr[y, x, :3]) for x in range(intermediate_w)]
                for y in range(intermediate_h)
            ],
            dtype=np.float32,
        )

        for y in range(intermediate_h):
            for x in range(intermediate_w):
                L, a, b = arr_lab[y, x]
                dists = np.sqrt(((pal_lab - np.array([L, a, b])) ** 2).sum(axis=1))
                idx = int(np.argmin(dists))
                # 误差扩散
                err = arr_lab[y, x] - pal_lab[idx]
                if err.any():
                    for dy, dx, factor in [(0, 1, 7 / 16), (1, -1, 3 / 16), (1, 0, 5 / 16), (1, 1, 1 / 16)]:
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < intermediate_h and 0 <= nx < intermediate_w:
                            arr_lab[ny, nx] += err * factor
                # 写入对应格
                gy, gx = y // cell_h, x // cell_w
                if gy < height and gx < width:
                    grid[gy, gx] = idx
    else:
        # 主导色提取:每 cell 取区域 mode
        for gy in range(height):
            for gx in range(width):
                region = arr[gy * cell_h : (gy + 1) * cell_h, gx * cell_w : (gx + 1) * cell_w]
                if region.shape[0] == 0 or region.shape[1] == 0:
                    grid[gy, gx] = 0
                    continue
                # 用前几个像素就行(major vote)
                rgb = _dominant_color(region)
                # 找最近色(Lab)
                L, a, b = rgb_to_lab(*rgb)
                dists = np.sqrt(((pal_lab - np.array([L, a, b])) ** 2).sum(axis=1))
                grid[gy, gx] = int(np.argmin(dists))

    # 4. 杂色清理:邻域多数清理(每格被 4 邻域主色同化)
    if cleanup == "majority":
        for _ in range(2):
            new_grid = grid.copy()
            for y in range(height):
                for x in range(width):
                    neighbors = []
                    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < height and 0 <= nx < width:
                            neighbors.append(int(grid[ny, nx]))
                    if not neighbors:
                        continue
                    counts = Counter(neighbors)
                    most_common, freq = counts.most_common(1)[0]
                    if freq >= 3 and most_common != int(grid[y, x]):
                        new_grid[y, x] = most_common
            grid = new_grid

    # 5. 限色:并入最相似色
    if max_colors and max_colors > 0:
        used_codes = {int(v) for v in np.unique(grid)}
        if len(used_codes) > max_colors:
            # 按用量排序
            usage = Counter(int(v) for v in grid.flatten())
            keep = set(c for c, _ in usage.most_common(max_colors))
            # 对每个被丢弃的色,找到 keep 中 Lab 最近的
            drop = used_codes - keep
            replace_map = {}
            for d in drop:
                dl = pal_lab[d]
                dists = np.array([np.sqrt(((pal_lab[k] - dl) ** 2).sum()) for k in keep])
                nearest = list(keep)[int(np.argmin(dists))]
                replace_map[d] = nearest
            # 应用
            for y in range(height):
                for x in range(width):
                    v = int(grid[y, x])
                    if v in replace_map:
                        grid[y, x] = replace_map[v]

    # 6. 统计色号用量
    counts = Counter(int(v) for v in grid.flatten())
    color_counts = {pal_colors[idx].code: cnt for idx, cnt in counts.items()}

    return PatternResult(
        grid=grid,
        palette=pal,
        color_counts=color_counts,
        width=width,
        height=height,
    )
