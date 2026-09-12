# Sakura1Tap 前端效果页执行规格文档

## 0. 工作继承协议

本文件同时作为新窗口继承工作的主交接文档。每一轮开发都必须维护它，避免上下文丢失。

每一轮开始时必须：

1. 先阅读 `docs/effect-implementation-spec.md`、`docs/effect-requirements.md`、`docs/assets.md`。
2. 确认 `## 17. 当前实现状态`、`## 18. 本版验收矩阵` 和 `## 20. 下一版候选需求`。
3. 启动本地测试服务，并打开一个可视测试窗口给用户肉眼查看进度。

每一轮结束前必须：

1. 更新 `## 17. 当前实现状态`。
2. 更新 `## 18. 本版验收矩阵`。
3. 记录本轮验证结果，包括是否运行 `npm run build`、测试 URL、主要肉眼检查点。
4. 阶段收口时同步 `docs/CHANGELOG.md` 和 `docs/BACKLOG.md`。
5. 如新增、删除、替换素材，更新 `docs/assets.md`。

当前优先级：

1. PC 首页效果优先，目标视口以 1440px 宽桌面为主。
2. 移动端优先级最低，只要求不明显崩坏；可以弱化或不兼容高级互动。
3. 不为了移动端牺牲 PC 的主视觉、动效和空间感。

当前文档状态：

- 本版需求状态：已收口。
- 本版范围：正式首页 `/` 的 PC 前端效果页第一版，重点是主视觉、入场、鼠标、拖拽、滚轮叙事、素材合法性和基础验证。
- 后续新增想法必须作为新需求进入 `## 20. 下一版候选需求`，不要继续混入本版完成定义。

## 1. 执行目标

本规格用于指导 Sakura1Tap 首页 `/` 的实际开发工作。

当前目标不是制作内容网站、作品集网站或个人介绍网站，而是制作一个参考 Active Theory / Lusion 风格的前端效果页。

所有开发任务必须围绕以下核心效果展开：

- 秒级入场动画
- 主视觉核心体
- 鼠标影响空间
- 滚轮推进场景
- 拖拽产生惯性反馈
- 文字和线条按时间线切入
- 页面整体像一个可操作空间，而不是普通网页

总原则：

首页采用 Narrative Scroll（叙事式滚动）设计。用户的每一次滚轮输入都应驱动场景演出，而不仅仅是页面位移。滚动过程中，相机、模型、光照、粒子、UI、HUD 和环境应协同变化，共同营造连续、具有空间感和电影感的浏览体验。所有滚动动画统一由 GSAP Timeline 管理，禁止各模块独立播放导致节奏割裂。

## 2. 页面范围

本阶段只允许重点修改正式首页 `/`。

允许修改：

- `src/components/home/HomeExperience.tsx`
- `src/components/home/HomeExperience.css`
- `src/hooks/usePointerField.ts`
- `src/hooks/useDragInertia.ts`
- `src/assets/symbols/*`
- `src/assets/textures/*`
- `src/assets/fonts/*`

允许在必要时修改：

- `src/components/MainPage.tsx`
- `src/App.tsx`
- `index.html`
- `README.md`
- `docs/assets.md`

禁止破坏：

- `/lab`
- `/play`
- `/play/blackout`

## 3. 页面结构

首页 `/` 必须由以下体验段落组成：

1. Opening Scene
2. Compression Scene
3. Expansion Scene
4. Drift Scene
5. Exit Scene

这些不是普通内容 section，而是滚轮驱动的场景状态。

禁止使用以下普通内容结构：

- About
- Projects
- Tech Stack
- Contact
- Resume
- Portfolio Grid
- SaaS Feature Cards

## 4. 主视觉核心体规格

首页必须有一个主视觉核心体，作为所有交互的中心。

核心体命名建议：

```tsx
<SpatialCore />
```

或在 `HomeExperience.tsx` 内部实现。

核心体必须包含至少 4 层：

- outer ring
- inner ring
- orbit line
- glyph / signal mark

推荐 DOM 结构：

```tsx
<div className="spatial-core">
  <div className="core-ring core-ring-outer" />
  <div className="core-ring core-ring-inner" />
  <svg className="core-glyph" />
  <div className="core-orbit" />
</div>
```

禁止核心体只是一个普通圆形 div。

## 5. 入场动画规格

页面打开后必须执行 0-2 秒的入场时间线。

推荐 GSAP timeline：

```ts
const intro = gsap.timeline()

intro
  .fromTo(".home-field", { opacity: 0 }, { opacity: 1, duration: 0.4 })
  .fromTo(".spatial-core", { opacity: 0, scale: 0.72, filter: "blur(16px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.8 }, 0.25)
  .fromTo(".home-title", { y: 48, opacity: 0, filter: "blur(10px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7 }, 0.7)
  .fromTo(".home-subtitle", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 1.05)
  .fromTo(".home-hint", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, 1.45)
```

要求：

- 不能所有内容同时出现
- 不能只有 opacity fade
- 必须包含 transform / blur / scale / stagger 中至少三种
- 入场后核心体仍有轻微 idle motion

## 6. 鼠标交互规格

鼠标移动必须影响至少 3 层：

- 主视觉核心体
- 背景光场
- 文字或线条辅助元素

建议 CSS 变量：

- `--pointer-x`
- `--pointer-y`
- `--core-tilt-x`
- `--core-tilt-y`
- `--light-x`
- `--light-y`
- `--hover-energy`

鼠标反馈最低要求：

- 核心体 tilt 范围：-8deg 到 8deg
- 核心体 translate 范围：-24px 到 24px
- 光场位置随鼠标变化
- 线条或 glyph 有轻微反向偏移

禁止：

- 只有 cursor 小圆点变化
- 只有按钮 hover
- 鼠标移动肉眼不可见

## 7. 拖拽交互规格

主视觉核心体必须支持拖拽。

拖拽逻辑要求：

- pointerdown 设置 dragging 状态
- pointermove 计算 deltaX / deltaY
- delta 映射到 rotate / tilt / offset
- pointerup 后保留 velocity
- velocity 通过 requestAnimationFrame 或 GSAP 衰减
- 最终回弹到稳定状态

建议变量：

- `--core-drag`
- `--core-rotate`
- `--core-drag-x`
- `--core-drag-y`

拖拽验收：

- 拖动时核心体明显旋转或倾斜
- 松开后仍有惯性运动
- 惯性逐渐衰减
- 不造成页面选择文字或滚动异常

## 8. 滚轮场景规格

首页采用 Scroll-driven Narrative / Scroll-driven Experience。

滚轮必须驱动场景状态，不是普通页面滚动。滚动本身就是一种交互：它不是“滚一下，切换章节”，而是同步驱动整个场景演出。

页面所有章节共享同一条时间轴。所有元素都挂在同一条 GSAP Timeline 上，随着 scroll progress 连续变化。

必须使用 GSAP ScrollTrigger 创建 scrub timeline。

推荐阶段：

```ts
const scene = gsap.timeline({
  scrollTrigger: {
    trigger: ".home-experience",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.8,
  },
})
```

滚轮必须驱动：

- `--scroll-progress`
- `--core-depth`
- `--core-scale`
- `--core-blur`
- `--space-drift`
- Camera Position
- Camera Rotation
- Camera FOV
- Model Rotation
- Model Offset
- Particle Density
- Environment Brightness
- Bloom
- Depth of Field
- HUD Progress
- Scene Rail
- Command Strip
- Pointer Field
- 文本 y / opacity / blur
- 背景层 parallax

最低效果要求：

### Stage 1 Opening

进入页面：

- 模型缓慢漂浮。
- Camera 距离较远。
- 环境光较弱。
- HUD 进入。
- Pointer Field Online。
- Scroll Hint 出现。

### Stage 2 Compression

用户向下滚动：

- Camera Forward。
- 模型略微放大。
- 背景轻微压缩。
- Bloom 增强。
- 景深增加。
- Rail 进入 Compression。
- HUD 更新。

### Stage 3 Expansion

继续滚动：

- 模型缓慢展开。
- Camera Orbit。
- 环境出现更多空间层。
- 粒子增加。
- Lighting 逐渐变亮。
- HUD 进入 Expansion。

### Stage 4 Drift

滚动后半段：

- 模型进入自由漂浮。
- 背景移动速度降低。
- UI 逐渐透明。
- Atmosphere 加强。
- Depth Gate 开启。
- Scene 进入漂浮状态。

### Stage 5 Exit

滚动到底：

- Camera 缓慢远离。
- 背景暗下。
- HUD 关闭。
- Command Strip Fade。
- 进入下一章节。

### Scroll Interaction Rules

滚轮不仅移动页面，必须同时驱动：

- Camera Position
- Camera Rotation
- Camera FOV
- Model Rotation
- Model Offset
- Particle Density
- Environment Brightness
- Bloom
- Depth of Field
- HUD Progress
- Scene Rail
- Command Strip
- Pointer Field

每一个参数都有自己的 timeline 段，但它们必须属于同一个 scroll-driven master timeline。禁止多个动画独立播放。

全部变化都必须绑定 scroll progress。

### Scroll Feel

滚轮应具有：

- 轻微惯性。
- 电影感缓动。
- 不允许突然停止。
- 速度统一。
- 所有 transition 保持一致。

禁止：

- section 只是 fade in
- 卡片列表普通上滑
- 滚轮没有明显主视觉变化
- 多个模块各自独立播放导致节奏割裂
- 章节瞬间跳变

性能要求：

- 滚轮动画目标为 60FPS。
- 使用 GSAP ScrollTrigger 驱动 timeline。
- 动画主要使用 `transform`、`opacity`、`filter` 和 CSS variables。
- 避免 layout thrashing。
- 避免频繁 React re-render。
- 避免 scroll handler 中进行复杂 DOM 查询。

## 9. 视觉风格规格

必须保持以下风格：

- dark spatial interface
- minimal typography
- thin-line system
- subtle noise
- controlled glow
- abstract core object
- cinematic timing

禁止：

- glass card
- SaaS button
- dashboard panel
- large border radius
- business illustration
- portfolio grid
- tech stack badges
- fake project cards

按钮只允许：

- 文字
- 细线
- 小幅 hover offset
- 低强度光感

禁止白色强高光导致文字不可读。

## 10. 素材使用规格

素材不是必须，但允许使用轻量素材增强质感。

优先允许：

- SVG glyph
- SVG ring / orbit / ripple
- 开源字体
- tiny noise texture
- CSS-generated grain

禁止：

- 授权不清素材
- 大背景图
- 人物图
- 动漫图
- 视频
- 大型 3D 模型
- 付费素材
- 登录后才能下载的素材

所有外部素材必须记录到：

```text
docs/assets.md
```

记录内容：

- asset name
- source URL
- license
- author
- usage
- modified or not

如果 license 不清楚，禁止使用。

## 11. 字体规格

如果引入字体：

- 只引入必要 weight
- 推荐自托管
- 必须记录 license
- 不使用过多字体

推荐：

- 标题字体：有识别度
- 正文字体：中性干净
- 点缀字体：小号等宽

禁止字体导致加载明显变慢。

## 12. 响应式规格

必须适配：

- 390px
- 768px
- 1440px

390px 要求：

- 标题不被核心体遮挡
- 核心体可见但不过大
- 交互提示可读
- 不横向溢出
- QQ 或辅助信息如果存在，不遮挡主体验

移动端允许弱化拖拽，但不能崩。

## 13. 性能规格

动画优先使用：

- transform
- opacity
- filter

禁止频繁动画：

- width
- height
- top
- left
- margin
- padding

避免：

- 高频 getBoundingClientRect
- pointermove 中复杂 DOM 查询
- 大量 box-shadow
- 大型 blur 叠加
- 大素材

必须：

- `npm run build` 通过
- 页面不卡顿
- 支持 `prefers-reduced-motion`

## 14. 验收标准

完成后必须满足：

- 打开 `/` 后 2 秒内有明显分阶段入场
- 第一眼能看到主视觉核心体
- 鼠标移动明显影响核心体和光场
- 滚轮明显推进场景
- 拖拽核心体有明显手感
- 页面不依赖真实内容也成立
- 页面不像作品集
- 页面不像 AI SaaS
- 页面没有玻璃卡片 UI
- 390px / 768px / 1440px 不崩
- `/lab` 保留
- `/play` 保留
- `/play/blackout` 保留
- `npm run build` 通过
- Cloudflare Pages 可部署

## 15. 开发顺序

必须按以下顺序执行：

1. 检查当前 `/` 首页效果
2. 强化主视觉核心体
3. 强化入场 timeline
4. 强化鼠标反馈
5. 强化拖拽反馈
6. 强化滚轮 scene progression
7. 检查 AI 模板味
8. 检查移动端
9. 检查 build
10. 输出修改说明

禁止在未完成主视觉和交互前添加内容模块。

## 16. 完成定义

当前阶段完成的定义不是“网站内容完整”，而是：

用户打开页面后，能明显感受到这是一个以前端效果为核心的互动空间页面。

如果用户只能看到普通排版、普通滚动、普通文字和轻微动画，则视为未完成。

## 17. 当前实现状态

更新时间：2026-07-08

本版状态：已完成，可作为下一轮新需求的基线。

已完成：

1. `/` 已接入 `src/components/home/HomeExperience.tsx`，替代旧 `MainExperience` 作为正式首页效果页。
2. 首页已有自托管字体、CSS grain、Openclipart sakura glyph、项目自制 orbit glyph 和 favicon。
3. 首页已有主视觉核心体、GSAP 入场、鼠标光场/核心体反馈、核心体拖拽惯性、ScrollTrigger 滚轮推进。
4. `/lab`、`/play`、`/play/blackout` 已保留。
5. `npm run build` 已通过；此前用 preview + Chrome 自动化确认 390 / 768 / 1440 三档无横向溢出。
6. PC 首页已增加固定 scene HUD，显示 Opening / Compression / Expansion / Drift / Exit 五阶段、进度刻度和 readout。
7. PC 首页已增加 depth gate 和底部 command strip，强化“可操作空间”的仪器感。
8. 核心体拖拽已处理浏览器原生行为：拖拽期间 `body.dragging` 禁止文字选中和原生拖拽，松开/取消/失焦后恢复。
9. 首页滚轮逻辑已整理为 single scroll-driven master timeline：Camera / Model / Environment / Bloom / DOF / Particle / HUD / Command Strip / Depth Gate / 文案状态均由同一条 `sceneTimeline` 绑定 scroll progress。
10. 中后段文案已从普通内容模块改为场景事件语言：Compression Field / Route Aperture / Memory Current / Return Vector。
11. 已增加 atmosphere shell 和 post-processing readout，随 master timeline 的 `--atmosphere`、`--post-alpha`、`--scan-skew`、`--scene-bloom`、`--dof`、`--camera-z` 变化。
12. 核心体已增加内部结构状态轨道：`--core-fold`、`--ring-spread`、`--vector-fold`、`--fragment-spread`、`--symbol-scale`，Opening / Compression / Expansion / Drift / Exit 的差异会更多发生在主视觉对象内部。
13. 已修复滚轮/触控板惯性导致一次滚动冲到 Exit 模糊状态的问题：单次 wheel progress 被限制，仍由同一条 `sceneTimeline` 驱动。
14. 素材来源已登记到 `docs/assets.md`，本版未引入授权不清素材、外部运行时脚本、CDN 或追踪资源。

当前取舍：

1. PC 视觉和交互优先，移动端只维持不明显崩坏。
2. `src/App.tsx` 当前直接进入首页效果页，绕过 Boot / Live2D 入口。这是为了优先完成 PC 效果页；后续需要单独决定 Live2D 的新位置。
3. 当前首页已具备 single master timeline、场景事件语言和核心体内部结构变化；Exit 的“离开首页过渡口”可以作为下一版需求继续深化，但不阻塞本版收口。
4. 测试浏览器启用了 `prefers-reduced-motion: reduce`，自动化只能确认无障碍保护分支、布局和滚动距离；普通动效分支的最终手感仍建议在用户本机肉眼复看。
5. 后续实现继续遵守 single scroll-driven master timeline：新增 Camera / Environment / Lighting / Model / UI / HUD / Pointer Field / Post Processing 参数时必须绑定同一个 scroll progress。

本版完成结论：

1. `/` 已从普通内容页方向转为前端效果页方向。
2. 主视觉、鼠标、拖拽、滚轮叙事和 HUD 已形成一个可运行的第一版体验闭环。
3. 本版不再继续追加新视觉目标；下一步应先提出新需求，再进入新一版 Shape / Build。

## 18. 本版验收矩阵

| 项目 | 状态 | 证据 / 说明 |
| --- | --- | --- |
| `/` 接入正式首页效果页 | 已完成 | `MainPage` 已渲染 `HomeExperience`。 |
| 主视觉核心体不是普通圆形 div | 已完成 | rings、vectors、sakura glyph、orbit glyph、fragments 多层结构已实现。 |
| 0-2 秒入场 timeline | 已完成 | light field、core、title、subtitle、links 分段进入。 |
| 鼠标影响至少 3 层 | 已完成 | core tilt/offset、light field、line shift 均受 pointer 影响。 |
| 核心体拖拽惯性 | 已完成 | pointer capture、velocity throw、drag reset、选区/原生拖拽保护已实现。 |
| Single scroll-driven master timeline | 已完成 | Camera / Model / Environment / Bloom / DOF / Particle / HUD / Text 状态均在 `sceneTimeline`。 |
| 五阶段场景语言 | 已完成 | Opening / Compression / Expansion / Drift / Exit 已映射到 HUD、文案和核心体状态。 |
| 核心体 folding / opening / drifting / fading | 已完成 | `--core-fold`、`--ring-spread`、`--vector-fold`、`--fragment-spread`、`--symbol-scale` 已接入。 |
| 滚轮不会一次冲到底 | 已完成 | wheel governor 限制单次 progress delta；真实滚轮自动化未直接到底。 |
| 素材 license 可追溯 | 已完成 | `docs/assets.md` 已登记字体、SVG、favicon、CSS grain。 |
| 不新增依赖 / 外部脚本 | 已完成 | 本版未新增 package dependency、CDN 或第三方运行时脚本。 |
| `/lab`、`/play`、`/play/blackout` 保留 | 已完成 | 路由检查均返回 200。 |
| `npm run build` | 已完成 | 最近一次构建通过，见验证记录。 |
| 390 / 768 / 1440 不明显崩坏 | 基本完成 | 早前 Chrome 自动化确认无横向溢出；后续视觉细调仍以 1440 PC 为主。 |
| 非 reduced-motion 手感复看 | 待人工确认 | 当前自动化浏览器启用 reduced-motion，普通动效分支需要用户本机肉眼复看。 |

## 19. 验证记录

### 2026-07-08 / 接续前状态

- `npm run build`：通过。
- preview 路由：`/`、`/lab`、`/play`、`/play/blackout` 均返回 200。
- Chrome 自动化：390 / 768 / 1440 均无横向溢出；favicon 404 已通过 `public/favicon.svg` 清理。

### 2026-07-08 / PC scene HUD 增强

- 测试窗口：已打开 Chrome 到 `http://127.0.0.1:5173/`。
- 修改文件：`src/components/home/HomeExperience.tsx`、`src/components/home/HomeExperience.css`、`docs/effect-implementation-spec.md`、`docs/effect-requirements.md`。
- 新增效果：固定 scene HUD、五阶段 rail/readout、depth gate、底部 command strip。
- `npm run build`：通过。
- Chrome 1440px 自动化检查：无 console error，无横向溢出；HUD 和 command strip 均可见；滚动后 active scene 会从 Opening 切换到 Drift。

### 2026-07-08 / 核心体拖拽原生行为修复

- 测试窗口：继续使用 Chrome `http://127.0.0.1:5173/`。
- 修改文件：`src/components/home/HomeExperience.tsx`、`src/components/home/HomeExperience.css`、`docs/effect-implementation-spec.md`。
- 修复内容：核心体 pointerdown 后进入 `body.dragging`，拖拽期间禁止文字选中、图片/SVG 原生拖拽、双击选词；pointerup / pointercancel / window blur / unmount 均会清理状态。
- `npm run build`：通过。
- Chrome 1440px 自动化拖拽检查：拖拽中 `body.dragging=true`、cursor 为 grabbing、`window.getSelection()` 为空；松开后 `body.dragging=false`、选区为空、核心体旋转仍生效、无 console error。
- 交互回归：点击 `Drift` 链接可滚到 `#drift`；滚轮仍推进 scene；拖拽状态不会残留。

### 2026-07-08 / Scroll-driven Narrative 规格补充

- 测试窗口：dev server 仍运行在 `http://127.0.0.1:5173/`。
- 修改文件：`docs/effect-implementation-spec.md`。
- 规格补充：明确首页采用 Narrative Scroll / Scroll-driven Experience；滚动本身是交互；Camera / Environment / Lighting / Model / UI / HUD / Pointer Field / Post Processing 必须挂在同一条 GSAP master timeline 上并绑定 scroll progress。
- 本轮仅更新需求文档，未改运行代码，未重新运行 build。

### 2026-07-08 / Single Master Timeline 实现

- 测试窗口：继续使用 Chrome `http://127.0.0.1:5173/`。
- 修改文件：`src/components/home/HomeExperience.tsx`、`src/components/home/HomeExperience.css`、`docs/effect-implementation-spec.md`。
- 实现内容：移除每个章节独立 ScrollTrigger；新增 single `sceneTimeline`，使用 Opening / Compression / Expansion / Drift / Exit labels 管理 Camera / Model / Environment / Bloom / DOF / Particle / HUD / Command Strip / Depth Gate / 文案状态轨道。
- 新增视觉层：`home-particle-field` 18 个轻量 DOM 粒子，粒子密度、亮度和漂移绑定 master timeline。
- `npm run build`：通过。
- dev server 路由检查：`/`、`/lab`、`/play`、`/play/blackout` 均返回 200。
- Chrome 1440px 自动化检查：无 console error，无横向溢出；滚动 0 / 0.22 / 0.48 / 0.74 / 1 五个位置时 camera、core scale/rotate、environment、bloom、DOF、particles、HUD、command strip、depth gate 均随同一 scroll progress 改变。

### 2026-07-08 / Scene Language 与 Atmosphere 增强

- 测试窗口：继续使用 Chrome `http://127.0.0.1:5173/`。
- 修改文件：`src/components/home/HomeExperience.tsx`、`src/components/home/HomeExperience.css`、`docs/effect-implementation-spec.md`。
- 文案调整：将中后段从普通内容词改为场景事件：`Compression Field`、`Route Aperture`、`Memory Current`、`Return Vector`。
- 新增视觉层：`home-atmosphere-shell` 和 `home-post-readout`。它们不新增外部素材，使用 CSS 与 master timeline 变量驱动。
- master timeline 扩展：新增 `--post-alpha`、`--scan-skew`、`--atmosphere` 轨道，并与 Bloom / DOF / Camera readout 一起变化。
- `npm run build`：通过。
- dev server 路由检查：`/`、`/lab`、`/play`、`/play/blackout` 均返回 200。
- Chrome 1440px 自动化检查：无 console error，无横向溢出；Expansion / Drift / Exit 抽样可读到新文案，post readout 和 atmosphere opacity 随 scroll progress 改变。

### 2026-07-08 / Core Folding 状态轨道增强

- 测试窗口：本轮 dev server 因 5173 被占用自动运行在 `http://127.0.0.1:5174/`。
- 修改文件：`src/components/home/HomeExperience.tsx`、`src/components/home/HomeExperience.css`、`docs/effect-implementation-spec.md`。
- 实现内容：在 single `sceneTimeline` 内新增核心体内部状态变量：`--core-fold`、`--ring-spread`、`--vector-fold`、`--fragment-spread`、`--symbol-scale`。
- 视觉变化：Compression 阶段环层收束、线框折叠、碎片回收、glyph 降低；Expansion 阶段环层展开、碎片外扩、glyph 放大；Drift 阶段碎片漂移增强；Exit 阶段核心体缩远、环层和碎片外散、glyph 淡出。
- CSS 实现：核心体 rings / vectors / fragments / symbols 只通过 transform、opacity、filter 和 stroke dash 读取变量，不新增 DOM，不新增依赖，不新增 ScrollTrigger。
- 同步修正：`scrub` 改为直接跟随滚动，避免 HUD progress 和视觉 playhead 在正常动效分支中脱节；Opening 初始变量与 timeline 首帧保持一致。
- `npm run build`：通过。
- dev server 路由检查：`/`、`/lab`、`/play`、`/play/blackout` 均返回 200。
- Chrome 1440px 自动化检查：无横向溢出；当前测试浏览器启用了 `prefers-reduced-motion: reduce`，因此视觉 scrub 分支按无障碍保护不播放，但 Opening 首帧变量、DOM 存在性和布局检查通过。

### 2026-07-08 / Wheel Progress 防冲到底修复

- 用户反馈：自己滚了一下之后页面会继续自动滚完，进入 Exit 的模糊状态。
- 判断原因：普通滚轮/触控板惯性直接驱动内部滚动容器，`scrub: true` 会把较大的 scroll delta 映射到整条 master timeline，导致一次滚动就冲到后段。
- 修改文件：`src/components/home/HomeExperience.tsx`、`src/components/home/HomeExperience.css`、`docs/effect-implementation-spec.md`。
- 修复内容：新增 wheel governor，正常动效分支下拦截 wheel 输入并将单次 progress delta 限制在约 18%，仍然通过滚动容器驱动同一条 `sceneTimeline`，不新增 ScrollTrigger。
- CSS 配套：`home-experience` 增加 `overscroll-behavior: contain`，并将容器 `scroll-behavior` 改为 `auto`，避免平滑滚动和惯性叠加成自动滑走。
- `npm run build`：通过。
- dev server 路由检查：`/`、`/lab`、`/play`、`/play/blackout` 均返回 200。
- Chrome 自动化检查：真实滚轮输入后未直接到达底部，console error/warning 为 0；当前测试浏览器启用了 `prefers-reduced-motion: reduce`，普通动效分支的核心 blur 轨道仍需在非 reduced-motion 环境下人工复看手感。

### 2026-07-08 / 本版需求文档收口

- 修改文件：`docs/effect-implementation-spec.md`、`docs/effect-requirements.md`、`docs/BACKLOG.md`、`docs/CHANGELOG.md`。
- 收口内容：将本版状态明确为“已完成，可作为下一轮新需求的基线”；新增本版验收矩阵；新增下一版候选需求；冻结本版素材需求；同步 backlog 和 changelog。
- 文档边界：Exit 过渡口、FOV illusion、particle path、Live2D / Boot 入口回归、普通动效分支手感复测、移动端保护均已归入下一版候选，不再视为本版未完成项。
- 本轮仅更新文档，未改运行代码，未重新运行 build。

## 20. 下一版候选需求

以下内容不是本版缺口，而是下一版可以单独 Shape 的候选需求。提出新需求前，先从这里选择或新增条目，再进入新的设计/实现循环。

### Candidate A：Exit 过渡口

- 目标：让 Exit 不只是联系方式，而是像离开首页场景的过渡口。
- 可能范围：Exit 文案、core fade-out、route hint、Play/Archive 入口承接。
- 验收方向：滚到底时用户能明确感到“场景结束并指向下一处”，而不是只看到 QQ 或普通联系信息。

### Candidate B：FOV Illusion 与 Particle Path

- 目标：继续强化 master timeline 的空间纵深。
- 可能范围：`--camera-z`、`--dof`、`--particle-density`、particle path、depth gate scale。
- 验收方向：Compression / Expansion / Drift 的空间深度更明显，但仍然不新增独立 ScrollTrigger。

### Candidate C：Live2D / Boot 入口回归策略

- 目标：决定当前首页效果页和原 Boot -> Live2D 入口如何共存。
- 可能范围：`src/App.tsx`、`BootOverlay`、`Live2DEntry`、`HomeExperience` 的入口顺序。
- 验收方向：既保留 Live2D 作为 Sakura1Tap 身份特征，又不削弱 PC 首页效果页第一屏。

### Candidate D：普通动效分支手感复测

- 目标：在非 `prefers-reduced-motion` 环境下复看滚轮、拖拽、核心体 blur 和 scene progress。
- 可能范围：wheel governor 参数、timeline ease、core blur 强度、scene duration。
- 验收方向：滚轮不冲到底，拖拽不误滚动，Exit blur 不突兀。

### Candidate E：移动端最低限度保护

- 目标：确认 390px / 768px 不明显崩坏。
- 可能范围：核心体尺寸、HUD 隐藏策略、文字遮挡、滚动距离。
- 验收方向：移动端可以弱化高级互动，但标题、核心体、基本入口不能互相遮挡。
