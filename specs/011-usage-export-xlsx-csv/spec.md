# Feature 011 — 用量清单导出 ⭐

## Overview

用户生成图纸后,**下一步就是准备材料**(买豆/翻库存)。当前竞品都把"色号 + 颗数 + 中文名"作为标配导出项。

本 spec 提供 **完整用量清单闭环**:
- 前端展示用量表格(色号 + 色块 + 中文名 + 颗数 + 包数)
- 三种格式导出:JSON / Excel(.xlsx) / CSV
- 包数换算规则(默认 500 颗/包,用户可设置)

⭐ 这是 Phase 1 核心 P0,与 008 PDF 导出并列为"用户能否完成最终拼豆流程"的关键。

不在本文范围:豆仓库存扣减(宪法 §5.2 不做)、电商导流(宪法 §5.1 不做)、物料采购清单合并(宪法 §5.2 不做)。

## User Scenarios & Testing

### Scenario 1 — 用户查看用量表格
**角色**:生成 58×58 图纸后的用户
**流程**:
1. 进入 `/patterns/{id}` 页
2. 看到"用量清单"区块:表格列出色号、色块、中文名、颗数、包数
3. 按颗数降序排列,主力色号置顶
4. 总颗数 + 总包数汇总

**验收标准**:
- 表格列:色号、色块、中文名(色名)、颗数、包数
- 默认排序:颗数降序
- 汇总行:总颗数、总包数、总色号数
- 色块用真实色卡颜色(006/005 协同)
- 中英文跟随 locale

### Scenario 2 — 导出 Excel
**角色**:想把用量清单打印或发给家人的用户
**流程**:
1. 点击"导出 Excel (.xlsx)"
2. 下载 `pixelbead-usage-{pattern_id}.xlsx`
3. 打开 Excel:表格含色号、色块、中文名、颗数、包数
4. 可直接打印作为采购清单

**验收标准**:
- 文件格式:.xlsx(Excel 2007+)
- 列与前端表格一致
- 色块以单元格背景色呈现(便于识别)
- 文件名:`pixelbead-usage-{pattern_id}-{YYYYMMDD}.xlsx`
- 文件大小 < 200KB(58×58 图纸)

### Scenario 3 — 导出 CSV
**角色**:想在 Excel/WPS/Numbers 中处理或导入其他工具的用户
**流程**:
1. 点击"导出 CSV (.csv)"
2. 下载 `pixelbead-usage-{pattern_id}.csv`
3. 打开:UTF-8 BOM,逗号分隔,色号、中文名、颗数、包数列
4. Excel 打开中文不乱码

**验收标准**:
- 文件格式:.csv,UTF-8 BOM(Excel 中文兼容)
- 列:色号、中文名、英文名、颗数、包数
- 文件名:`pixelbead-usage-{pattern_id}-{YYYYMMDD}.csv`
- 文件大小 < 100KB

### Scenario 4 — JSON API(供集成)
**角色**:开发者用户或第三方工具集成者
**流程**:
1. 调 `GET /patterns/{id}/usage`
2. 返回 JSON:`{ pattern_id, bead_size, items: [{ code, name_zh, name_en, count, packs }], total_count, total_packs, generated_at }`
3. 自行处理或集成

**验收标准**:
- API 返回完整 JSON
- 权限:仅图纸所有者可访问
- 数据结构稳定(向后兼容)

### Scenario 5 — 包数换算规则可配置
**角色**:买散装(非整包)豆的用户 / 整包为 1000 颗的用户
**流程**:
1. 进入用户设置,改"每包颗数"为 1000(默认 500)
2. 后续所有用量清单按 1000 颗/包换算
3. 已生成的图纸用量表也实时更新

**验收标准**:
- 用户设置中"每包颗数"字段可编辑
- 默认值:500
- 范围:1-10000(防误填)
- 改后所有用量清单包数实时重算
- 单色颗数 = 0 → 包数 = 0(不显示 0.x 包)

### Scenario 6 — 与 008 PDF 协同
**角色**:导出 PDF 的用户
**流程**:
1. 导出 PDF(008)后,页面同时提供"用量清单"下载入口
2. 用量清单作为独立附件,非 PDF 内嵌(灵活)

**验收标准**:
- PDF 页面有"下载用量清单"链接(指向 011 端点)
- 用量清单与 PDF 协同,色号一致性 100%

## Functional Requirements

### FR-1: 用量数据来源

- 后端从 003 的网格数据聚合:每色号颗数 = 该色号在网格中出现的格子数
- 每色号记录:色号 code、色块 RGB、中文名 name_zh、英文名 name_en、颗数 count
- 同一图纸多次生成 → 取最新一次的用量(覆盖)

### FR-2: 前端用量表格

- 位置:`/patterns/{id}` 页下半部分
- 列:色号、色块(色卡预览)、中文名、英文名、颗数、包数
- 排序:默认按颗数降序,支持点击列头切换升序/降序
- 汇总行:总色号数、总颗数、总包数
- 分页/虚拟滚动:色号数 > 100 时启用,避免长列表卡顿

### FR-3: Excel 导出(.xlsx)

- API:`GET /patterns/{id}/usage.xlsx`
- 实现:服务端用 Excel 库生成(避免前端大文件处理)
- 列:色号、色块背景色、中文名、英文名、颗数、包数
- 文件头:`PixelBead 用量清单 - {pattern_id} - {date}`
- 样式:
  - 表头加粗、底色
  - 色块列:单元格背景色 = 该色卡 RGB
  - 数字右对齐,文本左对齐
- 列宽自适应

### FR-4: CSV 导出(.csv)

- API:`GET /patterns/{id}/usage.csv`
- 编码:UTF-8 BOM
- 分隔符:逗号
- 列:色号、中文名、英文名、颗数、包数
- 换行:`\n` 或 `\r\n`(兼容)
- 文件头:`# PixelBead 用量清单 - {pattern_id} - {date}`(可选,注释行)

### FR-5: JSON 导出

- API:`GET /patterns/{id}/usage`
- 权限:仅图纸所有者
- 数据结构:
  ```json
  {
    "pattern_id": "abc123",
    "bead_size": "mini",
    "items": [
      { "code": "H1", "rgb": "#FFFFFF", "name_zh": "白色", "name_en": "White", "count": 256, "packs": 1 }
    ],
    "total_count": 1024,
    "total_packs": 3,
    "generated_at": "2026-09-20T..."
  }
  ```

### FR-6: 包数换算

- 公式:`packs = ceil(count / beads_per_pack)`
- 默认 `beads_per_pack = 500`
- 用户可在设置中修改(范围 1-10000)
- 改后所有用量清单实时重算
- count = 0 → packs = 0(不显示 0.x)

### FR-7: 文件命名规范

- Excel:`pixelbead-usage-{pattern_id}-{YYYYMMDD}.xlsx`
- CSV:`pixelbead-usage-{pattern_id}-{YYYYMMDD}.csv`
- JSON:API 端点不生成文件,直接返回

### FR-8: 与 005 协同

- 用量清单色名跟随 locale(中文/英文)
- Excel/CSV 文件头文字跟随 locale
- JSON API 同时返回 name_zh + name_en(供前端选择)

### FR-9: 与 006 协同

- 埋点事件:
  - `pb_usage_table_viewed`(查看用量表格)
  - `pb_usage_export_xlsx`(Excel 下载)
  - `pb_usage_export_csv`(CSV 下载)
  - `pb_usage_api_called`(JSON API)
- Sentry 上报:导出失败

### FR-10: 错误处理

- 图纸未生成 → 提示"图纸尚未就绪"
- 图纸已删除 → 404
- 文件生成失败 → 500 + Sentry 上报
- 大图纸用量表过大 → Excel 仍可用(CSV < 1MB,Excel < 5MB)

## Success Criteria

### 定量

- 用量表 100% 与图纸网格数据一致(自动化校验)
- Excel 文件 < 200KB(58×58)
- CSV 文件 < 100KB(58×58)
- Excel 中文不乱码(UTF-8 BOM 验证)
- 色块背景色与色卡 RGB 一致(视觉校验)
- 包数换算 100% 正确(自动化用例覆盖)
- 三种格式导出成功率 ≥ 99%(006 埋点)

### 定性

- 用户拿到 Excel 后可直接打印作为采购清单
- 色块视觉识别度高(一眼能找到某色号)
- 包数预估合理,买豆不浪费不短缺
- 中英文模式下文件名 + 内容跟随

## Key Entities

- **UsageItem**:`{ code, rgb, name_zh, name_en, count, packs }`
- **UsageReport**:`{ pattern_id, bead_size, items: UsageItem[], total_count, total_packs, generated_at }`
- **UserSettings**(扩展现有):新增 `beads_per_pack: int`(默认 500)

## Assumptions

- 003 已提供图纸网格数据(色号 + 每色号颗数)
- 005 已提供 `name_en` 字段
- 用户设置(002 已有的 user settings)可扩展
- 服务端有 Excel 库(Python `openpyxl` 或类似)

## Out of Scope

- **豆仓库存扣减** → 宪法 §5.2 不做
- **电商导流**(淘宝联盟) → 宪法 §5.1 不做
- **物料采购清单合并**(多图纸合并) → 宪法 §5.2 不做
- **预算估算**(按市价算总价) → 不做
- **缺货标记** → 不做
- **缺色推荐**(替代色号) → 012 单格替换可间接覆盖
- **国际化货币** → 留作 Phase 4+
- **PDF 内嵌用量清单** → 008 + 011 协同,各自独立,不强嵌入

## Clarifications

### Session 2026-09-20

- Q: Excel 在前端还是后端生成? → A: 后端 — Excel 库成熟(`openpyxl`),前端大文件处理性能差;后端生成后流式返回。
- Q: 包数默认 500 还是 1000? → A: 500 — MARD 主流整包,用户可在设置改。
- Q: 色块在 Excel 里怎么呈现? → A: 单元格背景色 — 简单直观,Excel/WPS/Numbers 全兼容。
- Q: CSV 要不要带 BOM? → A: 带 UTF-8 BOM — Excel 打开中文不乱码,虽不严格符合 RFC 4180,但实际 99% 用户用 Excel 打开。
- Q: 用量清单要不要做多图纸合并? → A: 不做 MVP — 留作后续增强,当前单图纸够用。
- Q: 011 要不要做"缺货标记 / 替代色号"? → A: 不做 — 依赖用户库存数据(宪法 §5.2 不做豆仓),012 单格替换可间接覆盖。
- Q: 011 要不要把 PDF 内嵌用量清单也做了? → A: 不做 — 008 PDF 与 011 用量清单各自独立,PDF 仅图纸,用量清单独立下载;用户按需取用。