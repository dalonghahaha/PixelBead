# API Contract — Usage Endpoints (011 主契约)

<!-- 011-usage-export-xlsx-csv/contracts/usage.md -->

> **Version**: 1.0 · **Modified by**: 011

## 1. UsageReport Object

```typescript
interface UsageItem {
  code: string;          // 色号
  rgb: string;           // "#RRGGBB"
  name_zh: string;
  name_en: string;
  count: number;         // 颗数
  packs: number;         // 包数(向上取整)
}

interface UsageReport {
  pattern_id: string;
  bead_size: 'mini' | 'midi';   // 009 协同
  items: UsageItem[];           // 按颗数降序
  total_count: number;
  total_packs: number;
  generated_at: string;         // ISO 8601
}
```

## 2. Endpoints

### 2.1 `GET /patterns/{id}/usage`

**用途**:JSON 用量清单

**权限**:仅图纸所有者

**Response 200**:`UsageReport` 对象

**Response 403**:非所有者
**Response 404**:图纸不存在

### 2.2 `GET /patterns/{id}/usage.xlsx`

**用途**:Excel 用量清单

**Content-Type**:`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Content-Disposition**:`attachment; filename="pixelbead-usage-{id}-{YYYYMMDD}.xlsx"`

**列**:
| 列 | 类型 | 样式 |
|---|---|---|
| 色号 | string | 左对齐 |
| 色块 | (空字符串) | 单元格背景色 = RGB |
| 中文名 | string | 左对齐 |
| 英文名 | string | 左对齐 |
| 颗数 | int | 右对齐 |
| 包数 | int | 右对齐 |

**文件头**:"PixelBead 用量清单 - {pattern_id} - {date}"

**大小**:58×58 < 200KB,大图纸 < 5MB

### 2.3 `GET /patterns/{id}/usage.csv`

**用途**:CSV 用量清单

**Content-Type**:`text/csv; charset=utf-8`

**Content-Disposition**:`attachment; filename="pixelbead-usage-{id}-{YYYYMMDD}.csv"`

**编码**:UTF-8 BOM(Excel 中文兼容)

**分隔符**:逗号

**列**:色号,中文名,英文名,颗数,包数

**大小**:58×58 < 100KB,大图纸 < 1MB

## 3. `PATCH /users/me/settings`

**用途**:更新用户设置(beads_per_pack)

**Request**:
```json
{
  "beads_per_pack": 1000  // 范围 1-10000
}
```

**Response 200**:
```json
{
  "beads_per_pack": 1000
}
```

**Validation**:`beads_per_pack` 必须 1-10000,否则 400

## 4. Pack Calculation

```
packs = ceil(count / beads_per_pack)
```

- `beads_per_pack`:用户设置,默认 500,范围 1-10000
- 边界:`count = 0` → `packs = 0`(不显示 0.x)

## 5. Sort Order

`items` 按 `count` 降序排序(主力色号置顶)。

## 6. Database Schema

```sql
ALTER TABLE user_settings
  ADD COLUMN beads_per_pack INT DEFAULT 500;
```

## 7. Related Specs

- 003:`grid` 数据源
- 005:`name_zh` / `name_en` 字段(005 协同)
- 008:PDF 页面提供"下载用量清单"链接
- 009:`bead_size` 字段
- 002:user settings 扩展
- 006:`pb_usage_*` 4 个埋点