# PixelBead (拼豆图纸工坊)

> Web app for generating perler/fuse bead patterns from images

## What it does

Take an image, convert it into a printable perler bead pattern with:

- **Pixel grid layout** (configurable: 29×29 / 58×58 / 87×87 等标准板型)
- **Color quantization** to the nearest standard bead color
  (MARD / HAMA / Perler / YOBUKI / 漫漫 / 盼盼 等品牌色卡)
- **Bead count statistics** per color
- **Export** to PNG / SVG / PDF (A4 / B4 打印友好)

## Tech Stack

TBD — feature planning phase

可能的选型（待定）：

| 方案 | 优 | 劣 |
|---|---|---|
| 纯前端 (Canvas + Vite + TS) | 零后端、保护隐私、部署简单 | 大图慢、palette 库靠前端 JSON |
| 前端 + Node API | 处理大图、palette 服务化 | 部署成本↑ |
| 前端 + WASM (imagequant / color-thief) | 纯前端 + 高质量量化 | 体积略大 |

## Status

🚧 **Initial scaffold** — 还没开始写功能，目录结构 + 决策记录先到位。

## License

MIT
