# API Contract — Events Registry (006 主契约)

<!-- 006-analytics-monitoring/contracts/events.md -->

> **Version**: 1.0 · **Modified by**: 006 · **Naming convention**: `pb_<domain>_<action>`

## 1. Core Events Registry

10 个核心事件,跨 spec 引用:

### 1.1 Auth Domain

| 事件 | 触发时机 | 关键属性 |
|---|---|---|
| `pb_auth_signup` | 注册成功 | `source` |
| `pb_auth_login` | 登录成功 | `method` |

### 1.2 Generate Domain

| 事件 | 触发时机 | 关键属性 |
|---|---|---|
| `pb_generate_start` | 用户点"生成" | `image_size_kb`, `bead_size` |
| `pb_generate_success` | 生成成功 | `duration_ms`, `pattern_id`, `bead_count` |
| `pb_generate_failure` | 生成失败 | `error_code`, `duration_ms` |

### 1.3 Export Domain

| 事件 | 触发时机 | 关键属性 |
|---|---|---|
| `pb_export_pdf` | PDF 下载 | `pattern_id`, `page_count`, `pdf_size_kb` |
| `pb_export_usage_xlsx` | Excel 下载 | `pattern_id`, `row_count` |
| `pb_export_usage_csv` | CSV 下载 | `pattern_id`, `row_count` |

### 1.4 Share / Landing Domain

| 事件 | 触发时机 | 关键属性 |
|---|---|---|
| `pb_share_click` | 分享按钮点击 | `pattern_id`, `channel` |
| `pb_landing_cta_click` | 首页 CTA 点击 | `position` |

## 2. User Identification

所有事件携带 `user_id_hash`:

```
user_id_hash = SHA256(email + ANALYTICS_SALT)
```

- `ANALYTICS_SALT`:环境变量,每个部署独立
- 不可逆:无法从 hash 反推 email
- 未登录用户:hash = SHA256(ip + ANALYTICS_SALT),session 内一致

## 3. Sentry Errors

### 3.1 Error Captured

- 前端:`window.onerror` + `unhandledrejection` + React ErrorBoundary
- 后端:异常中间件 + 关键路径手动 `capture_message`

### 3.2 Error Levels

- `fatal`:阻断主流程(生成失败 / 导出失败)
- `error`:异常但有降级(API 503 / 图片加载失败)
- `warning`:潜在问题(性能慢 / 重试)

### 3.3 Sentry Context

每个错误带:
- `user.id` = `user_id_hash`
- `tags`:feature / stage / locale(006 T-066)
- `extra`:pattern_id / route
- `breadcrumbs`:用户路径

## 4. Related Specs

- 008 T-076:`pb_export_pdf`
- 010 T-085:`pb_task_*` 5 个
- 011 T-066:`pb_usage_*` 4 个
- 005 T-066:Sentry user context 添加 locale 维度

## 5. Sampling

- 错误捕获:100%
- 性能监控:生产 10%,开发 100%

## 6. Alerts

Sentry Alert 策略:
- `fatal` 错误 5 分钟内 ≥ 3 次 → 邮件通知
- 性能 P95 退化 > 20% → 通知

## 7. Plausible Custom Funnels

| 漏斗名 | 步骤 |
|---|---|
| 生成漏斗 | landing → upload → generate_start → generate_success |
| 导出漏斗 | generate_success → export_pdf → export_usage_xlsx |
| 注册转化漏斗 | landing → login → signup |