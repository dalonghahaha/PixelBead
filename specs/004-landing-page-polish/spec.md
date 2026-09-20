# Feature 004 — Landing Page Polish

## Overview

PixelBead 首页(/)已经从 03074dc 起完成基础改造:把开发视角的"功能状态卡片"(#001/#002/#003、后端健康指示、色卡数)替换为产品视角的 Hero + 3 卖点 + 三步流程。

但首页仍存在 **6 个必修问题** 和 **4 个打磨点**:
- 必修影响功能/真实性(示例图是 mock、Header/CTA 不感知登录态、移动端未验证、缺 SEO meta、色板数字未核实);
- 打磨影响品质(品牌一致性、Footer、可访问性、CTA 反馈)。

本文档把这些待修复整理为可测试的 spec,作为后续 plan/tasks 的输入。

不在本文范围:i18n(005 单独 spec)、用户评价/社会证明(006 单独 spec)、行为埋点(007 单独 spec)。

## User Scenarios & Testing

### Scenario 1 — 未登录访客首次到达首页
**角色**:看到 SNS 分享链接、点进来的陌生用户(可能手机/可能桌面)
**流程**:
1. 通过 URL 直接进入 /
2. 在 5 秒内明白 PixelBead 是什么、做什么、对自己有什么用
3. 点击 "开始生成 →" → 跳到登录页(带 redirect 参数 `/login?redirect=/generate`)
4. 登录后回到 /generate,看到上传界面

**验收标准**:
- Hero 主标题 + 副标题一眼看出产品价值("上传图片,3 秒生成拼豆图纸")
- CTA 文案"开始生成 →"明确指向"开始生成图纸"而非"开始试用"等含糊词
- 未登录用户点击 CTA → 实际跳到 `/login?redirect=/generate`(不是 /generate)
- 移动端(375px)同样能看清 + 能点 CTA(命中区域 ≥ 44×44px)

### Scenario 2 — 登录用户到达首页
**角色**:已经登录的活跃用户,从浏览器收藏夹或外部链接回到首页
**流程**:
1. 进入 /
2. Header 右侧不再显示"登录",而显示用户头像 + 下拉菜单(我的图纸 / 设置 / 退出)
3. 点击 CTA"开始生成 →" → 直接跳到 /generate(不再去登录页)

**验收标准**:
- Header 右侧在已登录态下显示用户头像(或首字母),不显示"登录"按钮
- 头像点击展开下拉菜单,至少包含:我的图纸、退出登录
- 已登录用户点 CTA → 实际跳到 /generate(不是 /login)
- 状态变化无需刷新页面(基于当前 session)

### Scenario 3 — 移动端访客
**角色**:在手机上浏览的用户(主流尺寸 375-414px)
**流程**:
1. 进入 /
2. 内容自适应屏幕宽度,无水平滚动
3. CTA / Header 链接在触控热区 ≥ 44×44px
4. 字体大小在 16px 起步(防 iOS 自动放大)

**验收标准**:
- 375px / 414px / 768px 三档断点布局正确
- 无水平滚动
- CTA 按钮 / Header 链接可点击命中区域 ≥ 44×44px
- Hero 标题在 375px 下不溢出

### Scenario 4 — 通过 SNS 分享进入的访客
**角色**:从微信/微博/朋友圈/Twitter 看到分享卡片点进来的用户
**流程**:
1. 在 SNS 上看到分享卡片(标题 + 描述 + 缩略图)
2. 点入 /,着陆后页面 <title> 和 og:title 一致
3. 缩略图是真实拼豆图纸(不是 Logo 或渐变)

**验收标准**:
- HTML `<title>` = `PixelBead — 上传图片,3 秒生成拼豆图纸`
- og:title / og:description / og:image 三个字段都存在且不为空
- og:image 是真实生成的拼豆图纸 PNG/JPG(≥ 1200×630 满足大图规范)
- twitter:card = `summary_large_image`

## Functional Requirements

### FR-1: 用真实拼豆图纸替换示例图
- "示例效果"卡左侧"原图":老孙从 Unsplash 选 1 张 CC0 真实照片(小动物/卡通/食物),下载后放 `apps/web/public/examples/original.jpg`
- "示例效果"卡右侧"拼豆图纸**:在本地写一个一次性生成脚本(`apps/web/scripts/gen-example-pattern.py`),调 pypindou 把同张照片转成拼豆图纸,输出 PNG 到 `apps/web/public/examples/pattern.png`
- 两侧图片在视觉上明显对应(同源原图 → 同源图纸,色板匹配)
- 验收:截图比对,左右图肉眼可识别为同源关系;两个文件实际存在于 `apps/web/public/examples/`;文件总大小 < 500KB

### FR-2: Header 感知登录态
- 已登录:Header 右侧显示用户头像(优先)或用户名首字母圆形按钮,点击展开下拉菜单
  - 下拉菜单项:我的图纸、设置(预留)、退出登录
- 未登录:Header 右侧显示"登录"按钮(可附"注册"链接)
- 状态来源:复用现有 session(基于 002-user-auth 的 cookie/session 机制)
- 验收:本地起服务,登录/登出两态切换,Header 实时反映

### FR-3: CTA "开始生成 →" 按登录态路由
- 未登录 → 跳 `/login?redirect=/generate`
- 已登录 → 跳 `/generate`
- 实现:客户端组件读取 session,决定 `<Link>` 的 href
- 验收:两态下点击行为正确

### FR-4: 移动端响应式(375 / 414 / 768 / 1280 四档)
- Hero 标题在 375px 下不溢出,字号自动缩小(`text-5xl` → `text-3xl`)
- 3 卖点在 < 768px 改为单列堆叠(非 3 列)
- "示例效果"卡在 < 768px 左右两栏改为上下堆叠
- Header 在 < 768px 下:Logo + 紧凑菜单(可折叠汉堡包)
- CTA 按钮 + Header 链接命中区域 ≥ 44×44px
- 验收:四档断点 headless Chromium 截图视觉通过 + 无水平滚动

### FR-5: SEO meta(generateMetadata)
- 实现 `generateMetadata()` 导出在 `apps/web/app/page.tsx`
- 字段:`title`、`description`、`openGraph: { title, description, images, type }`、`twitter: { card, title, description, images }`
- og:image 指向一张静态 PNG(≥ 1200×630),文件放 `apps/web/public/og.png`
- 验收:查看页面源码,所有 meta 字段齐全且非空;在 Facebook Sharing Debugger / Twitter Card Validator 上看到正确预览

### FR-6: 色板数与 pypindou 实际一致
- 首页"26 种真实拼豆色板"改为从后端动态拉取:Server Component 在渲染时调 `GET /palettes` 拿数组,渲染长度 `N` + "种真实拼豆色板"
- 加 cache:`fetch(..., { next: { revalidate: 3600 } })`,1 小时重验证
- 后端不可达 fallback:显示"20+ 种真实拼豆色板"(不要空白、不要硬编一个错的数字)
- 验收:首页数字与 `/palettes` 返回数组长度一致(后端正常时);后端模拟 500 时 fallback 文本出现且不崩页

### FR-7: Footer 完整化
- 当前 Footer 只有一行 "PixelBead MVP · 算法基于开源 pypindou · (Apache 2.0)"
- 升级为三段:左 logo+简介、中产品链接(生成图纸 / 我的图纸 / 文档)、右版权+社交链接占位
- 移动端三段堆叠为单列
- 验收:视觉截图通过,链接全部可点(部分可指向 # 占位)

### FR-8: 品牌图标统一
- 制作 PixelBead 简易 logo SVG(8×8 拼豆网格抽象)
- 落地:favicon(放 `apps/web/public/favicon.svg` + `favicon.ico`)、Header 左侧小图标、Footer 左上角图标
- 验收:浏览器 tab、Header、Footer 三处图标一致

### FR-9: 可访问性基础
- 标题层级 h1 → h2 → h3 不跳级(当前 page.tsx 是 h1/h3/h2,需要修)
- 所有 `<img>` 有 alt
- 所有可点击元素键盘可达,`:focus-visible` 有可见 outline
- 颜色对比度 WCAG AA(文字 ≥ 4.5:1)
- 验收:`axe-core` 0 critical / 0 serious

### FR-10: CTA 状态反馈
- hover:背景色加深 + 轻微 scale
- active:按下时背景再深 + scale 收回
- 加载中(跳转瞬间):按钮显示 spinner + "加载中..."
- 验收:三状态视觉截图通过

## Success Criteria

### 定量
- Lighthouse mobile score(Performance + Accessibility + Best Practices + SEO)≥ 90/100/100/100
- LCP < 2.5s(3G 模拟)
- CLS < 0.1
- 桌面 1280×800 / 平板 768×1024 / 手机 375×667 三档 headless Chromium 截图视觉通过
- axe-core 报告 0 critical、0 serious
- og:image 实际尺寸 ≥ 1200×630
- 全部 FR 验收标准达成

### 定性
- 用户在 5 秒内能从首页说出"这产品能做什么、对我有什么用、下一步怎么操作"
- 老孙肉眼对比整改前后,示例图明显更有真实感(从 mock 渐变 → 真实拼豆)
- 老孙在 375px 手机模式下能完成"看 Hero → 点 CTA → 到登录"全流程无障碍

## Key Entities

无新增实体。复用:
- **User**(002-user-auth 定义)
- **Palette**(003-image-to-bead-pattern 定义,供 FR-6 校验数量)

## Assumptions

- 002-user-auth 的 session 机制已就绪可用(cookie-based)
- 003-image-to-bead-pattern 的 `/palettes` 端点已上线
- Next.js 14 App Router + Tailwind CSS 已在 001-project-bootstrap 配置
- 项目目前不引入 i18n(留作 005 spec)
- 老孙有截图工具链可用(snap chromium + wqy-microhei 已就位)

## Out of Scope

- **i18n / 多语言切换** → 005 单独 spec
- **真实用户评价 / 社会证明区块** → 006 单独 spec
- **行为埋点(GA4 / Plausible / 自建)** → 007 单独 spec
- **新增色板/上传/生成功能** → 已属 003 范围
- **Header 移动端汉堡包展开抽屉的完整键盘导航** → 仅做最小可用,完整 a11y 在 a11y 专题 spec
- **真实图案库 / 案例库(需要后端)**
- **SEO sitemap.xml / robots.txt** → 单独 spec(008)
- **A/B test 框架**
- **Cookie banner / 隐私政策页**(合规相关)

## Clarifications

### Session 2026-09-20

- Q: 首页"示例效果"卡的两张图(原图 + 拼豆图纸)怎么准备? → A: 静态打包——老孙挑 1 张 CC0 真实照片(Unsplash),用本地脚本调 pypindou 预生成拼豆 PNG,放 `apps/web/public/examples/`。首屏不依赖 API,加载快、可离线、可缓存。
- Q: 首页 Header 怎么感知登录态? → A: Server Component 读 cookie——Next.js 14 RSC 在服务端读 002-user-auth 的 session cookie,直接给 Header 传 `loggedIn + user` props。零闪烁、SSR 友好、SEO 友好。
- Q: 首页"26 种真实拼豆色板"这个数字怎么取? → A: Server Component 动态拉+缓存——在渲染时调 `GET /palettes` 拿数组长度,加 `next.revalidate=3600` 1 小时重验证,后端不可达 fallback "20+ 种真实拼豆色板"。
- Q: PixelBead 品牌图标(FR-8)怎么来? → A: 老孙自己设计 SVG——手画一个 8×8 像素拼豆 grid 风格,放 `apps/web/public/favicon.svg`,Header / Footer 复用同一份 SVG。先业余版本,后续你定稿可随时替换。
- Q: 004 要不要把 4 个 polish 项(FR-7 Footer / FR-9 a11y / FR-10 CTA 反馈)一起做了? → A: 全部 10 个 FR 都做——Footer 完整化 + a11y 基础(h1-h3/alt/focus/contrast)+ CTA hover/loading 反馈一起交付。后续 spec(005 i18n / 006 社会证明 / 007 埋点)只做文档铺垫,不在本轮实现。