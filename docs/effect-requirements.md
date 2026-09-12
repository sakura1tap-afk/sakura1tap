# Sakura1Tap Asset Discovery Phase

## Current Operating Note

更新时间：2026-07-08

当前状态：本版素材需求已完成并冻结。

本文件保留为素材规则和下一版素材搜索流程，不再要求本版继续寻找新素材。本版实际使用的字体、SVG、favicon 和 CSS grain 已记录在 `docs/assets.md`。除非下一版明确提出新的素材需求，否则不要继续新增素材。

用户已授权：素材可以由执行 agent 自由处置，包括新增、替换、删除和重新组合，只要服务 Sakura1Tap 首页 `/` 的 PC 前端效果页。

仍需遵守：

1. 不新增授权不清素材。
2. 不新增外部运行时脚本、CDN 或追踪资源。
3. 新增或替换素材后必须更新 `docs/assets.md`。
4. PC 视觉和交互优先；移动端素材适配优先级最低。

下一版素材搜索目标：
Sakura1Tap 当前阶段不是内容网站，也不是作品集网站，而是参考 Active Theory / Lusion 方向的前端效果页。如果下一版重新打开素材搜索，只允许为页面寻找少量免费、授权明确、轻量、可编辑的艺术素材，用于增强主视觉对象、空间线稿、字体气质和背景材质。

素材必须服务以下方向：

- interactive frontend effect page
- spatial motion
- cursor-driven visual core
- scroll-driven scene
- thin-line system
- signal / ripple / portal / sakura / orbit / glyph
- quiet but alive

禁止寻找或使用：

- SaaS 插画
- business illustration
- portfolio template
- dashboard asset
- 大背景图
- 人物立绘
- 动漫图
- 复杂 3D 模型
- 视频素材
- 大体积贴图
- 授权不明确的素材
- 需要付费或登录才能合法使用的素材
- 只写 free 但没有清晰 license 的素材

允许寻找的素材类型，按优先级：

1. SVG symbol / emblem / glyph
2. open-source web font
3. tiny noise / grain texture
4. line art / ring / orbit / ripple SVG
5. very small optional sound effect, but only as future candidate, not integrated now

素材来源优先级：

- Google Fonts：只选开源字体，记录字体名称和 license，优先下载到本地自托管。
- Openverse：只选 CC0 / Public Domain / clearly licensed assets，必须记录 author、license、source URL。
- Openclipart：只选简单 SVG，并记录 source URL。
- SVGRepo / Iconify / unDraw 等：必须逐个确认 license，不能因为页面写 free 就直接使用。
- 如无法确认 license，则禁止使用。

执行流程必须严格遵守：

## Step 1：先搜索候选素材，不要直接改页面

为每个候选素材输出：

- asset name
- asset type
- source URL
- license
- author / attribution if required
- file size estimate
- why it fits Sakura1Tap
- whether it can be edited as SVG/CSS

## Step 2：只选择最多 5 个候选素材

候选素材建议包括：

- 1 个标题字体
- 1 个正文或等宽点缀字体
- 1 个 sakura / ripple / signal 相关 SVG
- 1 个 orbit / ring / portal 相关 SVG
- 1 个 tiny noise texture 或 CSS-generated grain 方案

## Step 3：下载前必须确认

- license allows website usage
- license allows modification if needed
- attribution requirements are clear
- file size is acceptable
- no external script
- no tracking
- no remote runtime dependency

## Step 4：下载到项目内

- fonts 放到 `src/assets/fonts` 或 `public/fonts`
- svg 放到 `src/assets/symbols`
- textures 放到 `src/assets/textures`
- 新建 `docs/assets.md` 记录素材清单、来源、license、author、用途和修改情况

## Step 5：集成限制

本阶段只允许轻量集成：

- 字体可以接入 CSS
- SVG 可以作为主视觉核心体内部结构或背景 glyph
- noise 可以作为低强度材质层

不允许把页面改成素材展示页。
不允许新增 About、Projects、Tech Stack、Portfolio 内容。
不允许新增依赖。
不允许引入 Three.js。
不允许破坏 `/lab`、`/play`、`/play/blackout`。

## Step 6：体积限制

- 单个 SVG 尽量小于 50KB
- 单个纹理尽量小于 100KB
- 字体只保留必要 weight，避免下载完整字体家族
- 总新增素材体积尽量控制在 500KB 以内
- 如果超过，需要说明原因

## Step 7：验收标准

- 页面更有 Sakura1Tap 识别度
- 主视觉核心体更像专属视觉对象，而不是普通 CSS demo
- 字体不再像默认模板
- 没有 AI SaaS 插画感
- 没有玻璃卡片感
- 所有素材 license 清晰可追溯
- `npm run build` 通过
- `/`、`/lab`、`/play`、`/play/blackout` 均正常
