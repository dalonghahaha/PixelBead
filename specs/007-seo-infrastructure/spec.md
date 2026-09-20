# Feature 007 — SEO 基建

## Overview

PixelBead 当前 SEO 基建缺失(无 `sitemap.xml`、无 `robots.txt`、无 JSON-LD、OG 图不完整),导致:
- 搜索引擎收录率低,新图纸无法被搜索引擎索引
- 社交分享卡片(Twitter/LinkedIn/微博)显示残缺
- 公开图纸无独立 OG 图,分享时只能显示站点默认 OG

本 spec 补齐 **最小可用 SEO 基建**,不引入复杂 SEO 工具链(SEMrush/Ahrefs 类商业工具,宪法 §5 不做)。

不在本文范围:SEO 关键词策略、内容营销、外链建设(宪法 §5.2 运营重不做)。

## User Scenarios & Testing

### Scenario 1 — 新图纸被搜索引擎收录
**角色**:Google/Bing 爬虫
**流程**:
1. 通过 `sitemap.xml` 发现新公开图纸 URL
2. 抓取页面,看到 `<link rel="canonical">`、JSON-LD(`SoftwareApplication` schema)
3. 索引入库,搜索"拼豆图纸生成器"能找到 PixelBead

**验收标准**:
- `sitemap.xml` 包含:首页 + 主要功能页 + 所有公开图纸(`<lastmod>` 准确)
- 公开图纸页面有 `<link rel="canonical">` 指向自身
- 公开图纸页面有 `SoftwareApplication` JSON-LD(包含 name/description/image/url)
- Google Search Console(若有)显示"已索引"状态

### Scenario 2 — 社交分享卡片正确
**角色**:用户把公开图纸分享到 Twitter/LinkedIn/微博
**流程**:
1. 复制公开图纸 URL
2. 粘贴到 Twitter,看到大图卡片(1200×630,含图纸预览)
3. 卡片标题"XX 的拼豆图纸 - PixelBead",描述"用 PixelBead 在线生成..."

**验收标准**:
- `og:title` `og:description` `og:image` `og:url` `og:type` 五字段齐全
- `og:image` 实际尺寸 ≥ 1200×630
- `og:image` 是真实图纸(非站点 logo 或占位图)
- `twitter:card` = `summary_large_image`
- 在 Twitter Card Validator / Facebook Sharing Debugger 看到正确预览

### Scenario 3 — robots.txt 正确
**角色**:爬虫 + 站长工具
**流程**:
1. 爬虫访问 `/robots.txt`
2. 看到允许/禁止规则 + sitemap 引用

**验收标准**:
- `robots.txt` 存在且 200
- 包含 `Sitemap: https://pixelbead.app/sitemap.xml`
- 禁止爬取:后台页(`/admin/*`)、API 路径(`/api/*`)、用户私人页(`/patterns?user_id=...`)
- 允许爬取:首页 + 主要功能页 + 公开图纸

### Scenario 4 — 多语言 SEO 协同
**角色**:海外搜索引擎 + 跨语言用户
**流程**:
1. 爬虫抓取 `/zh` 看到 `<html lang="zh-CN">` + `<link rel="alternate" hreflang="zh">`
2. 爬虫抓取 `/en` 看到 `<html lang="en">` + `<link rel="alternate" hreflang="en">`
3. 用户在英文区搜索,优先返回 `/en` 版本

**验收标准**:
- 与 005-i18n 协同,每页面 `hreflang` 双向标注
- `sitemap.xml` 包含 `<xhtml:link rel="alternate" hreflang="...">` 节点

## Functional Requirements

### FR-1: sitemap.xml 自动生成

- 主 sitemap:`/sitemap.xml`
- 动态生成(非静态文件),按需 include:
  - 静态页:`/`, `/generate`, `/patterns`(登录后), `/login`, `/register`, `/privacy`, `/terms`
  - 公开图纸页:`/patterns/{id}`(仅当图纸标记为 `is_public=true`)
- 每条 URL 包含 `<loc>` `<lastmod>` `<changefreq>` `<priority>`
- 多语言:`<xhtml:link rel="alternate" hreflang="...">` 子节点
- 大图纸量大时(>50,000),自动分片:`sitemap-0.xml` `sitemap-1.xml`...,加 `sitemap-index.xml`

### FR-2: robots.txt

- 静态文件 `/robots.txt`
- 包含:
  - `User-agent: *`
  - `Allow: /`
  - `Disallow: /admin/`
  - `Disallow: /api/`
  - `Disallow: /account/`(私人设置)
  - `Sitemap: https://pixelbead.app/sitemap.xml`
- 可选:针对特定爬虫(BadBot)的 Disallow 规则

### FR-3: JSON-LD 结构化数据

至少包含以下 schema:

| 页面 | Schema Type | 关键字段 |
|---|---|---|
| 首页 | `SoftwareApplication` | name, description, url, applicationCategory, operatingSystem, offers |
| 公开图纸页 | `CreativeWork` | name, author, datePublished, image, keywords |
| (可选)组织信息 | `Organization` | name, url, logo, sameAs |

JSON-LD 通过 `<script type="application/ld+json">` 注入页面 `<head>`,与 React 渲染同步。

### FR-4: OG 图完善

- 每张公开图纸生成独立 OG 图(1200×630):
  - 左侧:图纸预览(居中放大)
  - 右上:PixelBead logo
  - 底部:图纸标题 + 作者(如有)
- OG 图静态文件:`/og/{pattern_id}.png`(由生成流水线产出)
- 非公开图纸不生成 OG 图,fallback 到站点默认 OG(`/og/default.png`)
- `og:image` URL 在页面 `<head>` 中显式声明

### FR-5: 站点默认 OG

- 站点默认 OG 图:`/og/default.png`(1200×630)
- 包含:PixelBead logo + 一句话介绍 + 站点截图
- 用于无独立 OG 的页面(登录页、注册页、404、500)

### FR-6: canonical 标签

- 每个页面有 `<link rel="canonical" href="...">`
- 公开图纸:`canonical` 指向自身(不带查询参数)
- 带查询参数的页面:`canonical` 指向无参版本(避免重复内容)

### FR-7: meta 标签基础

每页 `<head>` 包含:
- `<title>`(每页独立,长度 50-60 字符)
- `<meta name="description">`(每页独立,长度 150-160 字符)
- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- `<meta charset="utf-8">`
- `<meta name="robots" content="index, follow">`(非后台页)

### FR-8: 与 005 协同

- hreflang 双向链接(中文 ↔ 英文)
- `<html lang>` 正确(zh-CN / en)
- 公开图纸页 URL 语言前缀版本独立可访问

### FR-9: 与 017 分享链接协同

- 017(分享链接)产生的只读 URL,继承 007 的 OG 图 + JSON-LD
- 公开图纸的 OG 自动跟随 007 标准

## Success Criteria

### 定量

- `sitemap.xml` 200 + XML 合法(Schema.org sitemap 验证通过)
- `robots.txt` 200 + 内容正确
- 公开图纸 OG 图实际尺寸 ≥ 1200×630(自动化校验)
- JSON-LD 通过 Schema.org 验证工具 0 错误
- Lighthouse SEO 评分 ≥ 100
- Google Search Console(若有)显示"已索引的页面"递增
- Twitter Card Validator / Facebook Sharing Debugger 验证 0 错误

### 定性

- 公开图纸分享到 Twitter/LinkedIn 卡片显示完整大图
- 搜索引擎能在 7 天内收录新公开图纸
- 海外用户访问英文版页面 OG 卡片正确

## Key Entities

- **SeoPageMeta**:页面级 SEO 元数据(title/description/canonical/og:image)
- **OgImage**:独立 OG 图资源(1200×630 PNG)
- **SitemapEntry**:URL + lastmod + changefreq + priority + hreflang 子节点

## Assumptions

- 域名 `pixelbead.app` 已注册并可配置
- 公开图纸标识 `is_public` 字段已存在或新增(017 协同)
- 003 的 `GET /patterns/{id}/preview` 端点可用于 OG 图生成
- 中/英文双语页面已由 005 提供基础

## Out of Scope

- **SEO 关键词策略 / 内容营销** → 宪法 §5.2 运营重不做
- **外链建设 / 友链交换** → 不做
- **付费 SEO 工具**(SEMrush/Ahrefs/Moz) → 不投入
- **AMP / Web Stories** → 移动 Web 已够,不引入额外规范
- **SEO A/B test 框架** → 不做
- **图片 SEO**(alt 自动化 + sitemap image 扩展) → 留作可选增强
- **站点速度专项优化** → Lighthouse 已要求,但本 spec 仅覆盖 SEO meta 层

## Clarifications

### Session 2026-09-20

- Q: sitemap.xml 静态还是动态? → A: 动态生成 — 公开图纸量会增长,静态文件需手动维护成本高。框架层在请求时按需拼装,加缓存(如 1 小时)。
- Q: 公开图纸默认 is_public 还是 opt-in? → A: 默认私有, opt-in 公开 — 隐私优先,用户显式选择公开才生成 OG。
- Q: JSON-LD 用 Microdata 还是 JSON-LD? → A: JSON-LD — Google 推荐,实现简单,不污染 HTML 结构。
- Q: 007 要不要把图片 SEO (sitemap image 扩展 + alt 自动化) 也做了? → A: 不做 — 当前 10 个核心 FR 已覆盖 SEO 基线,图片 SEO 是增强项,留作后续。
- Q: 007 要不要做 PageSpeed 专项优化(代码分割/图片懒加载/CSS 压缩)? → A: 不做 — Lighthouse Performance 已要求,但 007 聚焦 SEO 层,性能优化是基础设施专项。
- Q: sitemap 提交到 Google Search Console 谁来做? → A: 老孙手动 — 仅一次性操作(GSC 验证 + 提交 sitemap),后续自动收录。