#!/usr/bin/env python3
"""spec 007 — 生成站点默认 OG 图(1200×630)

输出:apps/web/public/og/default.png
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "apps" / "web" / "public" / "og" / "default.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

# 像素拼豆网格风格的简易 LOGO(8x8 网格)
img = Image.new("RGB", (1200, 630), (255, 255, 255))
draw = ImageDraw.Draw(img)

# 加载字体
try:
    font_lg = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 64)
    font_md = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
    font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
except OSError:
    font_lg = font_md = font_sm = ImageFont.load_default()

# 主标题
draw.text((60, 200), "PixelBead", fill=(50, 50, 50), font=font_lg)
draw.text((60, 290), "上传图片,3 秒生成拼豆图纸", fill=(100, 100, 100), font=font_md)

# 拼豆网格示意(右下角 8x8)
grid_size = 8
cell_size = 24
grid_x = 1200 - 60 - (grid_size * cell_size)
grid_y = 630 - 60 - (grid_size * cell_size)

colors = [
    "#FF6B6B", "#FFE66D", "#95E1D3", "#F38181",
    "#AA96DA", "#FCE38A", "#EAFFD0", "#F38181",
] * (grid_size * grid_size // 8 + 1)

for i in range(grid_size):
    for j in range(grid_size):
        color = colors[i * grid_size + j]
        x = grid_x + j * cell_size
        y = grid_y + i * cell_size
        draw.rectangle([x, y, x + cell_size - 2, y + cell_size - 2], fill=color, outline=(50, 50, 50))

# 边框
draw.rectangle([20, 20, 1180, 610], outline=(220, 220, 220), width=2)

img.save(OUT, "PNG", optimize=True)
print(f"✓ {OUT}")