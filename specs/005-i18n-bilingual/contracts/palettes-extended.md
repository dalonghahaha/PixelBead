# API Contract — `GET /palettes` (005 扩展)

<!-- 005-i18n-bilingual/contracts/palettes-extended.md -->

> **Version**: 2.0 · **Modified by**: 005 · **Backward compatible**: Yes(旧字段保留为 fallback)

## 1. Endpoint

```
GET /palettes
```

## 2. Response

### 2.1 Before(v1.x)

```json
{
  "palettes": [
    {
      "id": "mard-221",
      "name": "MARD 221",
      "colors": [
        {"code": "H1", "rgb": "#FFFFFF", "name": "白色"}
      ]
    }
  ]
}
```

### 2.2 After(v2.0 — 005 上线)

```json
{
  "palettes": [
    {
      "id": "mard-221",
      "name_zh": "MARD 221 色卡",
      "name_en": "MARD 221 Palette",
      "colors": [
        {"code": "H1", "rgb": "#FFFFFF", "name_zh": "白色", "name_en": "White"}
      ]
    }
  ]
}
```

## 3. Backward Compatibility

- `name` 字段保留(值为 `name_zh`)
- 客户端按 locale 选择字段:
  - `locale=zh` → 使用 `name_zh`(fallback `name`)
  - `locale=en` → 使用 `name_en`(fallback `name_zh`)

## 4. Database Schema

```sql
ALTER TABLE palette_colors
  ADD COLUMN name_en VARCHAR(64);

-- backfill
UPDATE palette_colors SET name_en = <manual translation>;
```

## 5. Migration

- 005 上线前一次性脚本:`scripts/migrate-palette-en.py`
- 221 色卡全部 backfill
- 老孙手译(CSV → Git PR → CI 校验)

## 6. Related Specs

- 008 PDF:色名标注用 `name_en`
- 011 用量清单:Excel/CSV 色名跟随 locale
- 005 UI:色板选择器按 locale 切换显示