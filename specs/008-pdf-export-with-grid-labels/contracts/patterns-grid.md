# API Contract — `GET /patterns/{id}/grid` (008 协同 003)

<!-- 008-pdf-export-with-grid-labels/contracts/patterns-grid.md -->

> **Version**: 1.0 · **Modified by**: 008 · **003 端点扩展**

## 1. Endpoint

```
GET /patterns/{id}/grid
```

## 2. Purpose

PDF 渲染所需色号 + RGB 网格数据。

## 3. Response

```json
{
  "pattern_id": "abc123",
  "width": 58,
  "height": 58,
  "bead_size": "mini",
  "locale": "zh",
  "grid": [
    [
      {"code": "H1", "rgb": "#FFFFFF"},
      {"code": "H2", "rgb": "#000000"},
      ...
    ],
    ...
  ],
  "palette": [
    {
      "code": "H1",
      "name_zh": "白色",
      "name_en": "White",
      "rgb": "#FFFFFF"
    }
  ]
}
```

## 4. Fields

| 字段 | 类型 | 说明 |
|---|---|---|
| `pattern_id` | string | 图纸 ID |
| `width` | int | 宽度(格子数) |
| `height` | int | 高度(格子数) |
| `bead_size` | enum | `mini` / `midi`(009 协同) |
| `locale` | enum | `zh` / `en`(005 协同) |
| `grid` | array[array[cell]] | 二维网格,每格色号 + RGB |
| `palette` | array[color] | 色板(用于色名标注,005 协同) |

## 5. Permission

- 私有图纸:仅所有者(user_id 校验)
- 公开图纸:`is_public=true` 时任何用户可访问

## 6. Caching

- 缓存:图纸更新后失效
- 公开图纸:1 小时缓存 + ETag

## 7. Related Endpoints

- `GET /patterns/{id}/preview`(003 已有):符号叠加层使用
- `GET /patterns/{id}/symbol`(003 已有):符号图下载
- `GET /patterns/{id}`(003 已有):图纸基本信息

## 8. Related Specs

- 005:`name_zh` / `name_en` 字段来源
- 009:`bead_size` 字段来源
- 011:`/usage` 端点从 `grid` 聚合用量