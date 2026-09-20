# API Contract — Sitemap + OG Image (007 主契约)

<!-- 007-seo-infrastructure/contracts/sitemap-og.md -->

## 1. Sitemap Endpoints

### 1.1 `GET /sitemap.xml`

- **返回**:`application/xml`
- **缓存**:Redis 1 小时
- **包含**:
  - 静态页:`/`, `/generate`, `/patterns`, `/login`, `/register`, `/privacy`, `/terms`
  - 公开图纸:`/patterns/{id}`(仅 `is_public=true`)
- **每条 URL 含**:`<loc>` `<lastmod>` `<changefreq>` `<priority>`
- **多语言子节点**:`<xhtml:link rel="alternate" hreflang="...">`

### 1.2 `GET /sitemap-index.xml`(分片时)

- 触发条件:>50,000 URL
- **返回**:sitemap index XML,引用 `sitemap-0.xml`, `sitemap-1.xml`, ...
- 缓存:同 1.1

## 2. OG Image Endpoints

### 2.1 `GET /og/{pattern_id}.png`

- **返回**:`image/png`, 1200×630
- **权限**:仅 `is_public=true`
- **缓存**:磁盘 + Nginx `expires 30d`
- **生成**:Pillow(OG 图内容:左侧图纸 + 右上 logo + 底部标题)

### 2.2 `GET /og/default.png`

- **返回**:`image/png`, 1200×630
- **用途**:站点默认 OG(非公开图纸 / 登录 / 注册 / 404 / 500)
- **缓存**:永久静态

## 3. `GET /robots.txt`

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /account/
Sitemap: https://pixelbead.app/sitemap.xml
```

## 4. JSON-LD

| 页面 | Schema Type |
|---|---|
| 首页 | `SoftwareApplication` |
| 公开图纸页 | `CreativeWork` |
| (可选)首页脚部 | `Organization` |

注入方式:`<script type="application/ld+json">` 在 `<head>` 中。

## 5. `<head>` Meta Tags

每页面 `generateMetadata` 注入:
- `<title>`(50-60 字符)
- `<meta name="description">`(150-160 字符)
- `<meta name="viewport">`
- `<meta charset="utf-8">`
- `<link rel="canonical">`(去查询参数)
- `<meta property="og:title|description|image|url|type">`
- `<meta name="twitter:card" content="summary_large_image">`
- `<link rel="alternate" hreflang="...">`(005 协同)

## 6. Database Schema

```sql
ALTER TABLE patterns
  ADD COLUMN is_public BOOLEAN DEFAULT FALSE,
  ADD COLUMN public_at TIMESTAMP NULL,
  ADD COLUMN og_image_url VARCHAR(255) NULL;

CREATE INDEX idx_patterns_public ON patterns(is_public, public_at);
```

## 7. Validation

- Schema.org 验证工具:0 错误
- Twitter Card Validator / Facebook Sharing Debugger:0 错误
- Lighthouse SEO = 100
- 自动化:`og:image` 尺寸 ≥ 1200×630

## 8. Related Specs

- 005:`hreflang` 页面级实现(`alternates.languages`)
- 008:公开图纸页面 OG 跟随 007 标准
- 017(Phase 3):分享链接 OG 继承 007 标准