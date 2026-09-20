# Feature 005 — i18n 中英文双语

## Overview

PixelBead 当前所有 UI 文案、错误提示、邮件、PDF 注释均为简体中文,限制了海外用户(通过 SEO/分享链接可能进入)的可读性,也让开源项目难以承接非中文贡献者。

本 spec 在 **不破坏现有国内用户体验、不引入地区差异(货币/日期)** 的前提下,引入最小可用的中/英双语支持:

- 默认中文(国内当前用户基盘),可手动切换英文
- 通过 URL 前缀暴露语言版本(`/zh` `/en`),便于 SEO 和分享
- 色卡名称双语(现有 API 返回中文名,需补英文名)

不在本文范围:地区差异(货币/日期格式)、RTL 语言、第三方翻译服务接入、AI 自动翻译(见宪法 §5.2)。

## User Scenarios & Testing

### Scenario 1 — 国内用户首次访问
**角色**:从中文环境首次进入 PixelBead 的用户(默认中文环境)
**流程**:
1. 直接进入 `https://pixelbead.app/`(无前缀)
2. 页面显示中文 Hero 文案、按钮、错误提示
3. 切到英文后刷新,体验无降级

**验收标准**:
- 默认 URL `/` 显示中文 UI
- 切换语言后,UI 文案 100% 命中对应语言(无遗漏、无错位)
- 切换语言无需刷新页面(或刷新后状态保持)

### Scenario 2 — 英文环境访客
**角色**:通过英文 SEO/分享链接进入的海外访客(浏览器语言 en-* 或显式访问 `/en`)
**流程**:
1. 进入 `https://pixelbead.app/en`
2. 看到英文 Hero、文案、按钮、错误提示
3. 色卡名称显示为英文(而非中英混杂)

**验收标准**:
- `/en` 路径下所有 UI 文案为英文
- 色板选择器下拉项全部为英文色名
- 错误提示、Toast、Modal 提示均为英文
- 无中文残留(中文字符出现在 UI 视为缺陷)

### Scenario 3 — 中文用户在英文页切换回中文
**角色**:在 `/en` 浏览过程中,切回中文
**流程**:
1. 当前在 `/en/patterns`
2. 点击 Header 语言切换器 → 选"中文"
3. URL 跳到 `/zh/patterns`,UI 切回中文

**验收标准**:
- 切换语言同时更新 URL 前缀 + Cookie 偏好
- 切换无白屏闪烁(SSR 直接渲染目标语言)
- 切换后保持当前路径(`/patterns` 不丢)

### Scenario 4 — PDF/Excel 导出文案跟随语言
**角色**:生成图纸后导出 PDF/Excel 的用户
**流程**:
1. 当前在中文模式,导出 PDF
2. PDF 内页眉/页脚/标题为中文(若当前语言是中文)
3. 切到英文模式,导出 PDF
4. PDF 内页眉/页脚/标题为英文

**验收标准**:
- PDF 文档内的标题、色名标注、说明文字与当前 UI 语言一致
- 同一图纸在中文/英文模式下导出两份 PDF,文案分别正确
- Excel 用量清单的色名列跟随语言

### Scenario 5 — SEO 与可分享性
**角色**:搜索引擎爬虫 + 分享到 Twitter/LinkedIn 的用户
**流程**:
1. 爬虫抓取 `/zh` 看到 `<html lang="zh-CN">`,抓取 `/en` 看到 `<html lang="en">`
2. 用户在英文页面分享 URL,对方看到英文 OG 卡片
3. `<link rel="alternate" hreflang="zh">` 和 `hreflang="en"` 双向标注

**验收标准**:
- 每个页面 `<html lang="...">` 正确
- `<link rel="alternate" hreflang="..." href="...">` 双向链接存在
- OG 卡片 title/description 跟随语言

## Functional Requirements

### FR-1: 默认中文 + URL 前缀

- 默认 URL `/` 等同于 `/zh`(零迁移成本,国内用户体验不变)
- URL 前缀规则:
  - `/` → 中文(zh)
  - `/zh` → 中文(zh)
  - `/en` → 英文(en)
- 中间件层统一处理,无前缀自动重定向到 `/zh`
- 非法前缀(如 `/ja` `/fr`)→ 重定向到 `/zh`

### FR-2: UI 文案双语

- 所有用户可见文案(按钮、Label、Placeholder、Tooltip、错误提示、Toast、Modal、空状态文案)100% 双语
- 文案存储:集中式 JSON 文件(`messages/zh.json` `messages/en.json`),避免散落硬编码
- 缺失翻译时 fallback 到中文(不得显示空白或 key 名)
- 关键文案(注册/登录/生成/导出/分享)必须双语,辅助文案(版本号/版权)允许中文

### FR-3: 色卡名称双语

- 色卡 API 返回的每条色卡数据,除原 `name_zh` 外,补 `name_en` 字段
- 默认 UI 显示按当前语言切换(中文模式下显示 `name_zh`,英文模式下显示 `name_en`)
- 色板选择器、PDF 标注、Excel 用量清单三处均跟随

### FR-4: 语言切换器

- Header 右侧固定位置,所有断点可见(375px 起)
- 控件:下拉菜单(选项:中文 / English),或分段控件(两选一)
- 切换行为:同时更新 URL 前缀 + 写 cookie 偏好 + 立即重渲染 UI
- 当前语言在切换器上有视觉指示(选中态)

### FR-5: SSR 友好

- 服务端渲染阶段直接渲染目标语言(无客户端二次渲染),避免白屏闪烁和 SEO 抓取失败
- 浏览器语言嗅探:首次访问无 cookie 时,根据 `Accept-Language` 决定 zh/en(优先级:en-* > zh-* > zh)
- 已设 cookie → 始终跟随 cookie

### FR-6: 错误/异常文案

- 表单校验错误、API 错误、限流提示、404/500 页面文案均双语
- 错误页(404/500)在两种语言下独立可读

## Success Criteria

### 定量

- 切换语言后,UI 文案命中率 100%(自动化遍历所有页面 + 关键路径,无遗漏、无错位)
- 中文/英文两套文案文件大小差异 ≤ 20%(平衡)
- 浏览器语言为 `en-*` 的新访客,首次访问落在 `/en` 比例 ≥ 90%
- Lighthouse mobile i18n 类 audit 0 警告
- `<html lang>` 100% 正确(zh/zh-CN/en/en-US 按页面)
- `hreflang` 双向链接存在率 100%

### 定性

- 海外用户在 `/en` 浏览 5 秒内能明白产品价值(等同中文体验)
- 切换语言无白屏闪烁
- 中文用户切换到英文后能找回中文(无需记忆 URL)

## Key Entities

- **Locale**:语言标识(`zh` / `en`),存储于 URL 前缀 + cookie
- **MessageBundle**:语言文案包,按命名空间组织(common / auth / generate / export / errors)
- **PaletteColor**:扩展现有实体,新增 `name_en` 字段(原有 `name_zh` 保留)

## Assumptions

- 002-user-auth 已支持 session cookie 跨语言保持
- 已支持 `/generate` `/patterns` `/login` `/register` 四个核心路由,均需双语
- 浏览器语言嗅探以 `Accept-Language` 头为准(无需 IP 库)
- 默认语言中文(国内基盘),不切换

## Out of Scope

- **地区差异**(货币、日期格式、数字格式) → Phase 4+ 视用户分布决定
- **RTL 语言**(阿拉伯语/希伯来语) → 不在宪法范围
- **AI 自动翻译** → 宪法 §5.2 明确不做
- **第三方翻译服务**(Crowdin/Lokalise) → 单语 + 单人维护,自托管 JSON 足够
- **邮件多语言** → 暂只做 UI,邮件模板留作后续
- **PDF/Excel 全文翻译** → 仅翻译标签 + 色名 + 页眉,不翻译图纸本体
- **动态内容翻译**(用户生成的图纸名) → 用户自填,不做翻译
- **多语言 SEO sitemap 分语言子集** → 留作 007-SEO 的协同项

## Clarifications

### Session 2026-09-20

- Q: 默认语言是中文还是英文? → A: 中文为默认(`/`) — 国内基盘不变,降低迁移风险。
- Q: 浏览器语言嗅探要不要做? → A: 做 — `Accept-Language` 决定首次访问语言,但 cookie 优先级最高(用户已选则跟随 cookie)。
- Q: 文案放在前端还是后端? → A: 前端集中式 JSON 文件(`messages/zh.json` / `messages/en.json`),后端 API 只返回结构化数据,文案渲染在前端。理由:① 前端 SSR 友好 ② 不污染后端 API ③ 翻译协作无需懂后端。
- Q: 色卡名英文翻译哪来? → A: 第一版用机器翻译 + 人工校对(老孙做),后续用户反馈驱动迭代;不接付费翻译 API。
- Q: 005 要不要把邮件/通知/SEO 也带上? → A: 不带 — 邮件留作后续,SEO hreflang 在本 spec 实现,完整 sitemap/OG 留给 007-SEO。
- Q: URL 前缀 `/zh` 还是 `/(zh)` 默认? → A: `/` 直接是中文,`/zh` 显式标注。`/en` 显式英文。无前缀/未匹配 → 重定向到 `/zh`。