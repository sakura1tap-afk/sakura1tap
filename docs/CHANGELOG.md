# Sakura1Tap 项目日志

> 本日志用于记录项目关键结构、功能、部署和维护变更。  
> 不是严格语义化版本日志，重点是帮助后续开发快速回忆“为什么这么改”。

---

## 2026-07-01

### 新增：GSAP / 3D / 立体滑动重设计规格

- 新增 `docs/specs/FRONTEND_REDESIGN_GSAP_3D_MOTION.md`。
- 确认 GSAP 在本项目中的边界：用于 DOM 时间线、滚动/滑动、指针跟随、水波覆盖层和动效编排，不替代 R3F 每帧场景逻辑或 Live2D 内部状态。
- 给出四个可选方向：Ripple Atlas、Camera-Bound Nodes、Scroll Observatory、Live2D Theatre。
- 推荐先做 Ripple Atlas + Camera-Bound Nodes 的混合路线，兼顾视觉提升、3D 深度和可控性能。
- 明确后续阶段：GSAP 基础设施、主页面 Motion Shell、Ripple MVP、3D 深度协调、滚动增强、性能验收。
- 补充 Integrated Design Lock、Experience Timeline 和 Phase Dependency Map，明确本轮不是零散动效堆叠，而是一条统一的主页面体验方案。

### 新增：GSAP 动效基础设施 Phase 1

- 安装 `gsap` 和 `@gsap/react`。
- 新增 `src/motion/gsap.ts`，集中注册并导出 GSAP 和 `useGSAP`。
- 新增 `src/motion/motionTokens.ts`，沉淀主页面动效时长、缓动、媒体查询和 reduced-motion helper。
- 更新 README 和项目总览，把 GSAP 纳入当前动效技术栈。
- `npm audit --omit=dev` 显示现有 `pixi-live2d-display -> gh-pages` 依赖链存在 critical 漏洞；该问题不是 GSAP 引入，自动 `npm audit fix --force` 会降级 Live2D 依赖，暂不自动修复。
- `npm run build` 已通过；仍保留已知 `MainPage` chunk 超过 500 kB 的 Vite 警告，后续在性能阶段处理。

### 新增：黑樱基因观测站页面系统设计

- 新增 `docs/specs/BLACK_SAKURA_GENOME_FRONTEND_DESIGN.md`。
- 新增 `docs/ASSET_LIBRARY.md`，记录 `素材库/` 候选素材、现有 Live2D、主模型、体积风险和授权状态。
- 将页面概念统一为 Black Sakura Genome Observatory / 黑樱基因观测站。
- 明确 Live2D 作为 Entry 守门人，Main Scene 作为 3D genome observatory，Play 作为实验室。
- 明确 DNA、黑色岩石、夜景 HDRI、樱花粒子、哥特/中式素材、动漫模型的分层使用策略。
- 明确三档兼容策略：Full、Balanced、Fallback，确保低性能设备和 reduced-motion 不被重动效拖垮。

### 实现：页面系统 Phase 0/1 起步

- 新增 `src/assets/assetManifest.ts`，作为素材引用和后续加载分层的第一层 interface。
- 新增 `src/components/main/MainMotionLayer.tsx`，用 GSAP `useGSAP`、`matchMedia` 和 CSS variables 管理主页面外层 motion shell。
- `MainPage.tsx` 接入 `MainMotionLayer`，把主场景、热点、节点导航、面板、详情层和技术条纳入统一 motion layer。
- `src/style.css` 新增 `main-motion-layer`、`main-ink-film` 和 `main-motion-scan` 样式，并补充 reduced-motion 降级。
- 本阶段没有引入 DNA/HDRI/黑岩等重素材到首屏。
- `npm run build` 已通过；`MainPage` chunk 约 1,014 kB，较引入 GSAP 前继续增大，后续需要作为性能阶段处理。

### 优化：GSAP Motion Controller 懒加载

- 新增 `src/components/main/MainMotionController.tsx`，把 GSAP `useGSAP`、`matchMedia` 和 timeline 控制从 `MainMotionLayer` 中拆出。
- `MainMotionLayer` 现在是轻量静态外壳，先渲染主页面内容；`MainMotionController` 作为独立 chunk 后下载。
- `npm run build` 已通过；构建结果显示 `MainMotionController` 约 72 kB，`MainPage` 回落到约 943 kB。
- 当前仍有 `MainPage` 超过 500 kB 的已知警告，主要来自 R3F/Three 主场景，后续继续拆 scene/model loading。

### 重设计：黑樱基因观测站主页面视觉

- `src/components/main/MainScene.tsx` 新增程序化 `GenomeMotif`，以轻量 R3F 几何体表达 DNA / genome 主题，暂不加载 `素材库/dna_hologram.glb`。
- `src/components/main/MainScene.tsx` 新增 `ObsidianBase`，用程序化黑色基座承接素材库中的 dark rock / black material 方向。
- 调整主场景灯光、fog 和背景色，让主舞台从普通黑白 3D 转向冷光、水墨、黑曜石质感。
- `src/data/mainSections.ts` 将四个节点更新为 Identity / Archive / Origin / Experiment 四段 sequence。
- `src/components/main/MainMotionController.tsx` 强化 GSAP timeline，节点、面板、热点、技术条和扫描层现在按 leave / transit / enter 编排。
- `src/style.css` 追加 Black Sakura Genome Observatory 覆盖样式：黑色纸面网格、水膜扫描、玻璃实验报告面板、冷光节点和详情层。
- `src/components/main/TechStrip.tsx` 更新为 `GENOME MOTIF`、`GSAP SHELL`、`LAZY MOTION`。
- `npm run build` 已通过；`MainPage` 约 946 kB，`MainMotionController` 约 73 kB，仍保留大 chunk 警告。

### 补强：Boot 和 Live2D Entry 视觉重设计

- 回应阶段性问题：上一轮视觉实现主要落在 Main Scene，Boot 加载层和 Live2D Entry 没有实质变化，导致入口体验没有脱离旧框架。
- `src/components/BootOverlay.tsx` 新增 genome boot field、双层 orbit、进度 readout 和 genome boot 文案。
- 新增 `src/components/BootMotionController.tsx`，以懒加载 GSAP timeline 控制 Boot 入场、节点 stagger、扫描光和进度膨胀变量。
- `src/components/Live2DEntry.tsx` 新增 observatory frame 和 Identity / Archive / Origin / Experiment sequence stack。
- 新增 `src/components/EntryMotionController.tsx`，以懒加载 GSAP timeline 控制 Entry 观测环、序列文字、入口按钮、ready/enter 变量。
- `src/style.css` 追加最终覆盖样式，重塑 Boot 和 Entry 为黑色基因观测站入口，不再只显示原幻想背景和普通进度条。
- `npm run build` 已通过；构建结果显示 `BootMotionController`、`EntryMotionController`、`MainMotionController` 都是独立小 chunk，GSAP 公共依赖进入 `motionTokens` chunk。
- HTTP smoke check 返回 200。

### 应用：素材库 DNA 与夜景光影

- 将 `素材库/dna_hologram.glb` 复制到 `public/art/models/dna_hologram.glb`，作为可部署运行时资源。
- 新增 `public/art/ASSET_SOURCES.md`，记录 runtime art asset 的来源和用途。
- 新增 `src/components/main/DnaHologram.tsx`，在主场景中懒加载真实 DNA GLB，保留程序化 DNA 作为下载 fallback。
- `src/components/main/MainScene.tsx` 增加 night environment wash、冷青/樱粉 spot light、暖色 key light 和更暗的 obsidian base 材质。
- `src/assets/assetManifest.ts` 将 `dna-hologram` 标为 active，并登记 `/art/models/dna_hologram.glb` runtime URL。
- `rogland_clear_night_4k.exr` 暂不直接运行时加载；原文件约 97 MB，需要先转低分辨率环境贴图。

### 重构：主页面可见框架改为基因控制台

- 回应视觉反馈：前几轮仍沿用旧的右侧面板、底部节点和热点结构，创新感不足。
- 新增 `src/components/main/GenomeInterface.tsx`，把主页面可见交互改为中心环形 sequence console、左侧大字 wordmark、右下 briefing 和底部 data rail。
- `src/components/MainPage.tsx` 停止渲染旧 `SceneHotspots`、`MainNodeMap`、`MainPanel` 组合，改用 `GenomeInterface` 接管第一视觉层。
- `src/components/main/MainMotionController.tsx` 更新 GSAP target，让新界面层参与 section leave / transit / enter 编排。
- `src/style.css` 新增 `genome-*` 视觉系统，主页面不再以旧卡片式信息面板作为主导。
- `npm run build` 已通过；仍保留 `MainPage` 大 chunk 警告，后续应继续拆 Three/R3F 场景。

### 重构：主体验底层逻辑与场景加载

- 回应进一步反馈：旧底层仍由 `MainPage` 管理 active/open/wheel/cursor/scene，结构没有真正推翻。
- 新增 `src/components/main/experienceMachine.ts`，将主体验序列状态改为纯 reducer 状态机。
- 新增 `src/components/main/MainExperience.tsx`，集中承载主体验 Shell、状态机、滚轮序列切换、节点打开和 CSS 变量指针追踪。
- `src/components/MainPage.tsx` 重建为薄 adapter，只负责把 `modelBuffer` 和 `onOpenPlay` 交给 `MainExperience`。
- 新增 `src/components/main/GenomeStage.tsx`，将 R3F/Three 主场景从主页面逻辑中拆出并懒加载。
- 指针移动从 React `setState` 改为直接写入根元素 CSS variables，减少高频 pointer move 触发的 React 重渲染。
- 新增 `genome-experience`、`genome-stage`、`genome-backdrop`、`genome-system-strip` 等样式，旧 `main-experience` 不再是主体验结构的主语。
- `npm run build` 已通过；`MainPage` chunk 从约 953 kB 降到约 11.64 kB，R3F/Three 集中到懒加载 `GenomeStage` chunk。

### 新增：主页面拆分专项文档

- 新增 `docs/MAIN_PAGE_SPLIT_LOG.md`，集中记录主页面拆分项目的时间线、完成步骤、验证结果和后续判断。
- 新增 `docs/MAIN_PAGE_SPLIT_DESIGN.md`，定义主页面拆分的目标架构、模块边界、阶段计划、设计决策和验收标准。
- 明确下一步先完成整体结构设计，再处理 CSS、bundle、局部交互等问题。
- 补充主页面拆分执行流程：选目标、定边界、最小移动、构建验证、同步记录、停下来判断。

### 拆分：主页面 section 内容配置

- 新增 `src/data/mainSections.ts`。
- 将 `SectionKey`、section 静态配置、详情卡片内容、图标映射和 `sectionOrder` 从 `MainPage.tsx` 抽离。
- `MainPage.tsx` 继续只负责主页面渲染、3D 场景、滚轮切换、热点和详情层交互。
- 这次不拆 3D 子组件、不改视觉和文案，降低回归风险。

### 拆分：主页面 3D 场景组件

- 新增 `src/components/main/MainScene.tsx`。
- 将 `SceneRig`、`MainStudyModel`、`EnergyField` 和 `MainScene` 从 `MainPage.tsx` 移出。
- `MainPage.tsx` 不再直接依赖 React Three Fiber、Three.js 或 GLTFLoader。
- 这次只移动场景代码，不改模型加载、镜头参数、粒子数量或视觉表现。

### 拆分：主页面节点详情层

- 新增 `src/components/main/DetailLayer.tsx`。
- 将节点详情标题、关闭按钮和详情卡片渲染从 `MainPage.tsx` 移出。
- `MainPage.tsx` 保留 `AnimatePresence` 挂载边界，避免改变详情层进出场动画。
- 这次不改详情层 CSS 类名和动效参数。

### 拆分：主页面主面板

- 新增 `src/components/main/MainPanel.tsx`。
- 将 `.main-panel`、面板切换动画和主操作按钮从 `MainPage.tsx` 移出。
- `MainPage.tsx` 继续负责判断 `OPEN NODE` 与 `OPEN TOOLBOX` 的行为，避免展示组件接管路由意图。

### 拆分：主页面节点导航

- 新增 `src/components/main/MainNodeMap.tsx`。
- 将 `.main-node-map`、节点按钮、图标和激活态渲染从 `MainPage.tsx` 移出。
- 节点顺序继续由 `sectionOrder` 提供，避免在展示组件中写死顺序。

### 拆分：主页面场景热点

- 新增 `src/components/main/SceneHotspots.tsx`。
- 将 `.scene-hotspots`、热点按钮和热点坐标 CSS 变量从 `MainPage.tsx` 移出。
- 热点位置继续读取 `mainSections` 中的 `hotspot` 配置。

### 拆分：主页面技术条

- 新增 `src/components/main/TechStrip.tsx`。
- 将 `.tech-strip`、图标和静态标签从 `MainPage.tsx` 移出。
- `MainPage.tsx` 现在只保留页面状态、滚轮逻辑和组件编排。

### 清理：历史入口组件审计

- 新增 `docs/HISTORICAL_COMPONENT_AUDIT.md`。
- 确认旧入口实验组件未被当前活流程引用。
- 删除 `EntryScene.tsx`、`EntryControls.tsx`、`EnterOverlay.tsx`、`Live2DCharacter.tsx`、`StudyModel.tsx`。
- 当前入口活流程保留为 `BootOverlay`、`Live2DEntry`、`Live2DStage`、`CursorParticles` 和 `CubismSdkModel`。

### 新增：功能规格目录

- 新增 `docs/specs/README.md`。
- 新增 `docs/specs/SPEC_TEMPLATE.md`。
- 后续新功能、内容改版、Play 模块和交互优化应先写规格，再进入实现。

## 2026-06-30

### 新增：文档驱动工作流

- 新增 `docs/WORKFLOW.md`。
- 将后续协作拆成四类角色：
  - Keeper：维护稳定性、依赖、部署和项目边界。
  - Designer：把想法整理成可开发的设计说明。
  - Builder：按确认范围做小步代码实现。
  - Archivist：记录变更、决策和文档事实。
- 新增 `docs/BACKLOG.md`，作为所有随机想法和后续任务的统一入口。
- 记录当前优先事项：修正文档与 `_redirects` 实际状态不一致、清理 `MainPage.tsx` 旧版 Play 残留、抽离主页面 section 配置。

### 初始扫描结果

- `npm run build` 已通过。
- 扫描时 `MainPage.tsx` 仍包含旧版 `DodgeGame` 和 `PlayPage` 重复代码。
- 当前 `src/style.css` 已经较大，后续适合逐步整理，但不建议作为第一优先级。
- 扫描时 `public/_redirects` 实际为 disabled，部分文档仍需要同步更新。

### 同步：`_redirects` 文档事实

- 更新 `docs/PROJECT_OVERVIEW.md` 中的 `public/_redirects` 说明。
- 当前仓库实际状态是禁用 Cloudflare rewrite 规则。
- 保留历史背景：全局 SPA fallback 曾触发 Cloudflare Workers/Assets infinite loop。

### 清理：移除 MainPage 旧版 Play 残留

- 从 `src/components/MainPage.tsx` 删除已不可达的旧版 `DodgeGame` 导出。
- 从 `src/components/MainPage.tsx` 删除已不可达的旧版 `PlayPage` 导出。
- 保留独立 Play 路由文件：`PlayPage.tsx`、`PlayGamePage.tsx`、`DodgeGame.tsx`。

## 2026-06-25

### 新增：项目结构总览文档

- 新增 `docs/PROJECT_OVERVIEW.md`。
- 梳理当前项目定位：个人网站入口页 + 3D 场景 + Live2D 看板娘 + Play 实验模块。
- 梳理核心目录和文件职责。
- 梳理当前运行流程：入口加载、Live2D 舞台、主页面、Play 页面、小游戏页面。
- 标注当前维护重点：`MainPage.tsx` 过大、样式集中、旧版 Play 逻辑残留。

### 修复：Cloudflare `_redirects` 无限循环

- 原规则：

```text
/* /index.html 200
```

- Cloudflare Workers/Assets 部署时报错：

```text
Invalid _redirects configuration: Infinite loop detected in this rule.
```

- 当时修改后规则：

```text
/play /index.html 200
/play/* /index.html 200
```

- 修改原因：当前 SPA 只有 `/play` 和 `/play/blackout` 需要刷新 fallback，暂不使用全局兜底，避免 Cloudflare 判定 `/index.html` 继续匹配 `/*` 造成循环。

- 后续状态：截至 2026-06-30，`public/_redirects` 中的 rewrite 规则已禁用，以当前文件内容为准。

### 当前状态确认

- GitHub 私有仓库已连通。
- 默认分支：`main`。
- Cloudflare 部署失败原因已经定位到 `_redirects`，并已提交修复。
- 当前项目构建命令应为：

```bash
npm run build
```

- 当前构建产物目录应为：

```text
dist
```

---

## 近期已有功能记录

### 入口加载体验

- 使用 `BootOverlay` 做启动加载层。
- 预加载 `/models/study.glb`。
- 预加载 `/images/fantasy-road.png`。
- 使用模拟进度和实际 fetch 进度混合展示。
- 模型加载完成后通过 `ArrayBuffer` 传给主页面复用。

### Live2D 入口舞台

- 使用 `Live2DEntry` 组织入口页视觉层。
- 使用 `Live2DStage` 加载两个 Live2D 模型。
- 当前模型：
  - `WhiteAngelOriginal/无口天使 5.model3.json`
  - `Fern/fern.model3.json`
- 支持鼠标视线跟随。
- 支持点击触发表情/动作反馈。
- 支持桌面和移动端不同布局。

### 主页面 3D 场景

- 使用 React Three Fiber 构建主页面场景。
- 使用 `SceneRig` 进行镜头缓动。
- 使用 `MainStudyModel` 解析并渲染入口加载得到的 GLB 模型。
- 使用 `EnergyField` 做能量环和粒子装饰。
- 主页面分为四个节点：
  - ABOUT
  - WORK
  - SOURCE
  - PLAY
- 支持滚轮切换节点。
- 支持热点和节点按钮切换。
- 支持节点详情弹层。

### Play Toolbox

- `PlayPage` 已独立为 Play 介绍页。
- `PlayGamePage` 已独立为小游戏页面容器。
- `DodgeGame` 已独立为黑白躲避小游戏核心。
- 路由关系：

```text
/play          -> Play Toolbox 介绍页
/play/blackout -> Blackout Run 全屏小游戏
```

---

## 后续维护计划

### P0：结构清理

- 将主页面 3D 子组件拆分到 `src/components/main/`。
- 已完成：从 `MainPage.tsx` 中移除旧版内嵌 `PlayPage` 和 `DodgeGame` 导出。
- 已完成：将 `sections` 配置拆到 `src/data/mainSections.ts`。
- 已完成：将主页面 3D 场景组件拆到 `src/components/main/MainScene.tsx`。
- 已完成：将节点详情层拆到 `src/components/main/DetailLayer.tsx`。
- 已完成：将主页面主面板拆到 `src/components/main/MainPanel.tsx`。
- 已完成：将主页面节点导航拆到 `src/components/main/MainNodeMap.tsx`。
- 已完成：将主页面场景热点拆到 `src/components/main/SceneHotspots.tsx`。
- 已完成：将主页面技术条拆到 `src/components/main/TechStrip.tsx`。

### P1：样式拆分

当前 `src/style.css` 承载过多模块样式，建议拆分：

```text
src/styles/base.css
src/styles/boot.css
src/styles/entry.css
src/styles/main.css
src/styles/play.css
src/styles/responsive.css
```

### P2：内容实用化

- ABOUT 节点补充真实个人介绍。
- WORK 节点补充项目列表、截图、链接、学习记录。
- SOURCE 节点补充素材来源和版权说明。
- PLAY 节点继续扩展小游戏和交互工具。

### P3：部署稳定化

- 确认 Cloudflare 生产分支为 `main`。
- 确认构建命令为 `npm run build`。
- 确认输出目录为 `dist`。
- 若未来新增更多前端路由，先确认 Cloudflare 托管模式，再决定是否恢复或调整 `public/_redirects`。

---

## 维护提醒

每次完成一个明确阶段后，建议追加一条日志，格式如下：

```md
## YYYY-MM-DD

### 类型：一句话标题

- 改动 1
- 改动 2
- 为什么这样改
- 后续注意事项
```
