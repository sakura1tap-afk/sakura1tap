# Sakura1Tap 项目代码结构总览

> 更新时间：2026-06-25  
> 仓库：`sakura1tap-afk/sakura1tap`  
> 当前定位：个人网站入口页 + 3D 场景 + Live2D 看板娘 + Play 实验模块

---

## 1. 项目整体定位

Sakura1Tap 当前是一个基于 React + Vite 的个人网站入口项目。它不是传统静态个人主页，而是以“入口体验”为核心：先通过加载层、幻想风背景、Live2D 舞台建立第一印象，再进入内部主页面，通过 3D 模型、滚轮切换节点和 Play 模块承载个人介绍、作品档案、来源说明与互动实验。

当前项目主要包含四条线：

1. **入口体验线**：Boot 加载层、幻想背景、Live2D 双角色舞台、进入按钮、粒子反馈。
2. **主页面展示线**：React Three Fiber 场景、模型缓冲复用、节点式个人主页内容。
3. **Play 实验线**：Play Toolbox 介绍页与独立小游戏页面。
4. **部署维护线**：Vite 构建、Cloudflare Pages/Workers 部署、SPA 路由 fallback。

---

## 2. 推荐阅读顺序

后续接手或继续开发时，建议按下面顺序看代码：

1. `src/main.tsx`：React 应用挂载入口。
2. `src/App.tsx`：全局页面状态、手写路由、入口/主站/Play 页面切换。
3. `src/components/BootOverlay.tsx`：启动加载层，负责预加载 3D 模型和背景图。
4. `src/components/Live2DEntry.tsx`：入口页视觉编排，连接 Live2D 舞台、粒子和进入按钮。
5. `src/components/Live2DStage.tsx`：Live2D WebGL 舞台，管理模型加载、渲染、鼠标注视和点击反馈。
6. `src/live2d/CubismSdkModel.ts`：Live2D Cubism SDK 封装，负责 model3、贴图、动作、表情、物理、呼吸和渲染。
7. `src/data/mainSections.ts`：主页面节点内容、镜头、热点和图标配置。
8. `src/motion/gsap.ts`：GSAP 注册和统一导出。
9. `src/motion/motionTokens.ts`：动效时长、缓动和媒体查询 token。
10. `src/components/MainPage.tsx`：进入后的主页面，包含 3D 主场景、节点系统和交互逻辑。
11. `src/components/main/MainScene.tsx`：主页面 R3F/Three 场景、模型渲染、镜头和能量场。
12. `src/components/main/DetailLayer.tsx`：主页面节点详情弹层。
13. `src/components/main/MainPanel.tsx`：主页面标题、正文和主操作按钮。
14. `src/components/main/SceneHotspots.tsx`：主页面场景热点按钮。
15. `src/components/main/TechStrip.tsx`：主页面底部技术条。
16. `src/components/PlayPage.tsx`：Play Toolbox 介绍页。
17. `src/components/PlayGamePage.tsx`：独立游戏页面容器。
18. `src/components/DodgeGame.tsx`：黑白躲避小游戏核心逻辑。
19. `src/style.css`：全局样式、入口页、主页面、Play 页面、Live2D 舞台和小游戏样式。
20. `docs/HISTORICAL_COMPONENT_AUDIT.md`：历史入口组件审计记录。
21. `public/_redirects`：Cloudflare 路由 fallback 记录文件。

---

## 3. 当前代码结构目录

以下结构按当前已读取和实际使用的核心文件整理，后续如新增文件，应同步更新本文件。

```text
sakura1tap/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ public/
│  ├─ _redirects
│  ├─ images/
│  │  └─ fantasy-road.png
│  ├─ models/
│  │  └─ study.glb
│  ├─ live2d/
│  │  ├─ WhiteAngelOriginal/
│  │  │  └─ 无口天使 5.model3.json
│  │  └─ Fern/
│  │     └─ fern.model3.json
│  └─ vendor/
│     └─ live2dcubismcore.min.js
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ style.css
│  ├─ motion/
│  │  ├─ gsap.ts
│  │  └─ motionTokens.ts
│  ├─ components/
│  │  ├─ BootOverlay.tsx
│  │  ├─ CursorParticles.tsx
│  │  ├─ Live2DEntry.tsx
│  │  ├─ Live2DStage.tsx
│  │  ├─ MainPage.tsx
│  │  ├─ main/
│  │  │  ├─ DetailLayer.tsx
│  │  │  ├─ MainPanel.tsx
│  │  │  ├─ SceneHotspots.tsx
│  │  │  ├─ TechStrip.tsx
│  │  │  └─ MainScene.tsx
│  │  ├─ PlayPage.tsx
│  │  ├─ PlayGamePage.tsx
│  │  └─ DodgeGame.tsx
│  ├─ data/
│  │  └─ mainSections.ts
│  ├─ live2d/
│  │  └─ CubismSdkModel.ts
│  └─ vendor/
│     └─ cubism/
│        └─ Live2D Cubism SDK TypeScript 源码封装
└─ docs/
   ├─ BACKLOG.md
   ├─ PROJECT_OVERVIEW.md
   ├─ MAIN_PAGE_SPLIT_DESIGN.md
   ├─ MAIN_PAGE_SPLIT_LOG.md
   ├─ HISTORICAL_COMPONENT_AUDIT.md
   ├─ OPTIMIZATION_PLAN.md
   ├─ specs/
   │  ├─ README.md
   │  └─ SPEC_TEMPLATE.md
   ├─ WORKFLOW.md
   └─ CHANGELOG.md
```

---

## 4. 核心文件说明

### 4.1 `index.html`

项目 HTML 入口文件。主要作用：

- 设置页面语言为 `zh-CN`。
- 提供 `#root` 给 React 挂载。
- 先加载 `/vendor/live2dcubismcore.min.js`，再加载 `/src/main.tsx`。

Live2D 运行时依赖全局的 `Live2DCubismCore`，所以这个脚本顺序非常重要。

---

### 4.2 `package.json`

项目类型是 Vite + React + TypeScript。核心命令：

```bash
npm run dev      # 本地开发
npm run build    # TypeScript 编译 + Vite 打包
npm run preview  # 本地预览 dist
```

Cloudflare 构建时建议使用：

```text
Build command: npm run build
Build output directory: dist
Root directory: /
Production branch: main
```

主要依赖：

- `react` / `react-dom`：前端框架。
- `@react-three/fiber` / `@react-three/drei` / `three`：主页面 3D 场景。
- `framer-motion`：页面转场和动效。
- `lucide-react`：图标。
- `live2dcubismcore`、`pixi-live2d-display`、`pixi.js`：Live2D 相关依赖，目前项目核心渲染走自封装 Cubism SDK 路线。

---

### 4.3 `src/main.tsx`

React 应用入口。功能很简单：

- 引入全局样式 `style.css`。
- 使用 `createRoot` 把 `App` 挂载到 `#root`。
- 使用 `StrictMode`。

---

### 4.4 `src/App.tsx`

这是当前项目的全局调度中心。

负责内容：

- 判断当前路径属于 `main`、`play`、`play-game`。
- 维护入口是否已经进入：`entered`。
- 维护启动层是否完成：`bootComplete`。
- 维护 Live2D 是否可用：`live2dReady`。
- 保存预加载的 `study.glb` 模型二进制：`modelBuffer`。
- 使用 `lazy + Suspense` 懒加载 `Live2DEntry`、`MainPage`、`PlayPage`、`PlayGamePage`。
- 手动使用 `window.history.pushState` 实现轻量路由切换。
- 检测 WebGL 是否可用，不可用时显示 fallback。

当前路由关系：

```text
/                -> main
/play            -> play
/play/blackout   -> play-game
```

---

### 4.5 `src/components/BootOverlay.tsx`

启动加载层，负责在进入 Live2D 舞台前完成资源预热。

核心职责：

- 预加载 `/models/study.glb`。
- 预加载入口背景 `/images/fantasy-road.png`。
- 使用模拟进度 + 实际 fetch 进度混合展示加载过程。
- 加载成功后把模型 `ArrayBuffer` 传给 `App`。
- 加载失败时显示错误状态和 Retry 按钮。

设计意义：

- 避免用户直接看到 3D 模型空白或闪烁。
- 让主页面可以复用已经下载的 GLB Buffer，减少重复请求。
- 给 Live2D 舞台预留启动时间，避免进入按钮过早可点击。

---

### 4.6 `src/components/Live2DEntry.tsx`

入口页视觉总装层。

核心职责：

- 渲染幻想入口背景、网格、暗角、前景层。
- 挂载 `CursorParticles` 鼠标粒子。
- 挂载 `Live2DStage` 双角色舞台。
- 维护进入按钮 hover、进入中状态。
- 等待 `BootOverlay` 与 Live2D 模型都 ready 后，才允许点击进入。

进入按钮点击后：

1. 设置 `isEntering = true`。
2. 播放进入动效。
3. 延迟调用 `onEnter`，由 `App` 切换到主页面。

---

### 4.7 `src/components/Live2DStage.tsx`

Live2D 舞台层，负责 canvas、WebGL 上下文和多模型渲染。

当前加载两个模型：

```text
/live2d/WhiteAngelOriginal/无口天使 5.model3.json
/live2d/Fern/fern.model3.json
```

核心能力：

- 创建 WebGL 上下文。
- 按配置加载多个 `CubismSdkModel`。
- 根据桌面/移动端设置模型位置和高度。
- 监听鼠标移动，让角色视线跟随鼠标。
- 点击舞台触发表情或动作反馈。
- 使用 `ResizeObserver` 自适应容器大小。
- 本地开发环境下暴露 `window.__sakuraCubismStage.getSnapshot()` 方便调试。

---

### 4.8 `src/live2d/CubismSdkModel.ts`

这是 Live2D 的底层封装文件，也是当前项目复杂度最高的模块之一。

核心职责：

- 初始化 Live2D Cubism Framework。
- 读取 `.model3.json`。
- 加载 `.moc3` 模型文件。
- 加载表情、物理、姿势、动作文件。
- 加载贴图并绑定到 WebGL。
- 设置呼吸、眨眼、动作、表情。
- 根据鼠标拖拽参数更新头部、身体和眼球方向。
- 根据桌面/移动端 layout 重新计算模型矩阵。
- 渲染模型到当前 WebGL canvas。

维护注意：

- 这个文件尽量不要频繁改动。
- 新增 Live2D 模型时，优先改 `Live2DStage.tsx` 里的 `stageModels` 配置。
- 如果模型不显示，先检查路径、贴图、moc3、model3 文件内部相对路径，再检查这里。

---

### 4.9 `src/components/CursorParticles.tsx`

入口页粒子效果层，使用 2D Canvas 实现。

核心能力：

- 鼠标移动时生成跟随萤火粒子。
- 鼠标点击时生成爆发粒子。
- 点击进入时，粒子向入口按钮/城门位置聚拢。
- 自动适配 DPR，限制最大粒子数量，避免性能过高。

---

### 4.10 `src/components/MainPage.tsx`

进入网站后的主页面，也是当前最需要后续拆分的文件。

当前包含内容：

- 主页面交互：滚轮切换、热点切换、节点打开。
- 从 `src/data/mainSections.ts` 读取主页面节点配置。
- 挂载 `src/components/main/MainScene.tsx` 作为 3D 场景层。
- 挂载 `src/components/main/DetailLayer.tsx` 作为节点详情层。
- 挂载 `src/components/main/MainPanel.tsx` 作为主面板。
- 挂载 `src/components/main/SceneHotspots.tsx` 作为场景热点层。
- 挂载 `src/components/main/TechStrip.tsx` 作为底部技术条。

当前四个节点：

```text
ABOUT   -> 个人/网站介绍
WORK    -> 项目/作品/学习记录
SOURCE  -> 模型来源/设计参考/过程记录
PLAY    -> 互动实验工具箱入口
```

维护建议：

- 后续可以继续将节点导航、详情层等 DOM 子组件拆到 `src/components/main/`。

---

### 4.10.1 `src/data/mainSections.ts`

主页面节点配置文件。

负责内容：

- 定义 `SectionKey`。
- 存放 About、Work、Source、Play 四个节点的标题、正文、详情卡片、主题色、热点位置、镜头位置、模型旋转和图标。
- 导出 `sectionOrder`，供主页面保持稳定的节点顺序。

维护建议：

- 后续改主页面文案、详情卡片、热点位置或节点主题色，优先改这里。
- 不在这里写 React 状态逻辑、Three.js 渲染逻辑或路由逻辑。

---

### 4.10.2 `src/components/main/MainScene.tsx`

主页面 3D 场景层。

负责内容：

- React Three Fiber `Canvas`。
- `SceneRig` 镜头缓动。
- `MainStudyModel` GLB buffer 解析和模型姿态响应。
- `EnergyField` 能量环与粒子。
- 主场景灯光、雾和模型加载状态提示。

维护建议：

- 后续优化 3D 性能、模型渲染、镜头运动和能量场时，优先改这里。
- 不在这里写页面路由、Play 入口、节点详情 DOM 或主页面文案。

---

### 4.10.3 `src/components/main/DetailLayer.tsx`

主页面节点详情层。

负责内容：

- 根据当前节点读取详情数据。
- 渲染详情标题、关闭按钮和详情卡片。
- 保持详情层的 Framer Motion 入场和离场动画参数。

维护建议：

- 后续调整详情卡片结构、详情层动效或关闭按钮时，优先改这里。
- 不在这里管理当前 active 节点状态、滚轮切换或 Play 路由跳转。

---

### 4.10.4 `src/components/main/MainPanel.tsx`

主页面主面板。

负责内容：

- 渲染当前节点的 metric、title 和 body。
- 保持主面板切换动画。
- 渲染主操作按钮和按钮文案。

维护建议：

- 后续调整主面板文字布局、按钮表现或面板动画时，优先改这里。
- 不在这里决定 Play 路由跳转；按钮行为由 `MainPage.tsx` 传入。

---

### 4.10.5 `src/components/main/SceneHotspots.tsx`

主页面场景热点层。

负责内容：

- 渲染场景热点按钮。
- 根据当前节点设置热点激活态。
- 从 `mainSections` 读取热点位置 CSS 变量。

维护建议：

- 后续调整热点可访问性、热点布局或热点交互时，优先改这里。
- 不在这里写节点顺序或主页面状态，顺序和内容继续来自数据层。

---

### 4.10.6 `src/components/main/TechStrip.tsx`

主页面底部技术条。

负责内容：

- 渲染底部技术标签。
- 渲染技术条两侧图标。

维护建议：

- 后续调整技术标签内容或展示方式时，优先改这里。
- 当前是静态展示组件，不需要提前设计 props。

---

### 4.11 `src/components/PlayPage.tsx`

Play Toolbox 介绍页。

负责内容：

- 展示 Play 模块定位。
- 展示当前可用模块 `BLACKOUT RUN`。
- 展示未来计划模块 `SIGNAL`、`FORGE`。
- 点击 `START PROGRAM` 后进入 `/play/blackout`。

它不直接承载游戏逻辑，只负责介绍和启动。

---

### 4.12 `src/components/PlayGamePage.tsx`

独立小游戏页面容器。

负责内容：

- 渲染全屏游戏页面。
- 提供返回 Play 介绍页的按钮。
- 挂载 `DodgeGame`。

---

### 4.13 `src/components/DodgeGame.tsx`

黑白躲避小游戏核心逻辑。

玩法逻辑：

- 玩家控制一个白色光点。
- 障碍从横向或纵向生成。
- 随分数增长，障碍生成速度和难度提升。
- 碰撞后进入 `over` 状态。
- 记录当前分数和本次页面生命周期内的最高分。

技术实现：

- 使用 2D Canvas。
- 使用 `requestAnimationFrame` 游戏循环。
- 使用 `useRef` 保存实时游戏状态，减少 React 重渲染压力。
- 使用 `useState` 只同步 UI 需要展示的状态：phase、score、best。

---

### 4.14 `src/style.css`

全局样式文件。目前所有页面和模块样式都集中在这里。

包含范围：

- 全局根样式。
- Boot 加载层。
- Live2D 入口页。
- Live2D 舞台。
- 主页面和 3D 场景外层 UI。
- 节点地图、热点、详情层。
- Play 页面。
- DodgeGame 小游戏。
- 响应式适配。

维护建议：

- 随着模块增多，建议拆分为：
  - `styles/base.css`
  - `styles/boot.css`
  - `styles/entry.css`
  - `styles/main.css`
  - `styles/play.css`
  - `styles/responsive.css`

---

### 4.15 `public/_redirects`

Cloudflare 路由 fallback 记录文件。

当前内容：

```text
# Cloudflare redirects intentionally disabled.
# The Workers/Assets deployment path rejects SPA rewrites to /index.html as an infinite loop.
```

当前状态：

- `_redirects` 规则已暂时禁用。
- 之前使用过 `/* /index.html 200`，Cloudflare Workers/Assets 部署链路报错 infinite loop。
- 后续也尝试过只覆盖 `/play` 与 `/play/*`，但当前仓库以禁用 rewrite 为准，避免部署链路再次进入无限循环。
- 如果未来需要支持直接刷新 `/play` 或 `/play/blackout`，应先确认 Cloudflare Pages/Workers 的实际托管模式，再重新设计 fallback 规则。

---

### 4.16 `docs/MAIN_PAGE_SPLIT_LOG.md`

主页面拆分专项日志。

用途：

- 记录主页面拆分项目的时间线。
- 说明每一刀拆了什么、为什么拆、如何验证。
- 保留当前结果和未完成事项，避免后续重复讨论。

---

### 4.17 `docs/MAIN_PAGE_SPLIT_DESIGN.md`

主页面拆分设计文档。

用途：

- 定义主页面拆分的目标架构。
- 约束 `mainSections`、`MainPage`、`MainScene`、`DetailLayer` 等模块边界。
- 规划后续阶段：DOM 子组件拆分、历史组件审计、样式模块化和 bundle 优化。

---

### 4.18 `docs/HISTORICAL_COMPONENT_AUDIT.md`

历史组件审计记录。

用途：

- 记录旧入口实验组件的引用审计。
- 说明哪些组件已删除，以及当前活入口由哪些文件承载。
- 保留删除依据，避免后续误以为文件丢失。

---

### 4.19 `docs/specs/`

功能规格目录。

用途：

- 为新功能、内容改版、Play 模块和交互优化提供规格文档入口。
- 在实现前记录目标、边界、验收标准和风险。
- 使用 `SPEC_TEMPLATE.md` 创建新规格。

---

## 5. 当前运行流程

### 5.1 首次访问 `/`

```text
index.html
  -> src/main.tsx
    -> App.tsx
      -> 检查 WebGL
      -> 显示入口页
      -> BootOverlay 预加载 study.glb
      -> Live2DEntry 懒加载
      -> Live2DStage 加载双 Live2D 模型
      -> Boot + Live2D 都 ready
      -> 用户点击进入
      -> MainPage
```

### 5.2 进入主页面

```text
MainPage
  -> MainScene
    -> Canvas
    -> SceneRig 控制镜头
    -> EnergyField 渲染能量环和粒子
    -> MainStudyModel 解析 BootOverlay 传来的 GLB Buffer
  -> UI 节点系统
    -> ABOUT / WORK / SOURCE / PLAY
  -> 滚轮或点击切换节点
  -> OPEN NODE 打开详情
  -> PLAY 节点进入 Play Toolbox
```

### 5.3 访问 Play 模块

```text
/play
  -> App 判断路径为 play
  -> PlayPage
  -> START PROGRAM
  -> /play/blackout
  -> PlayGamePage
  -> DodgeGame
```

---

## 6. 当前维护重点

### 6.1 需要优先清理

1. `MainPage.tsx` 仍包含节点导航、热点和页面 DOM，后续可以继续拆分。
2. 所有样式集中在 `style.css`，后续模块增多后会难以定位。
3. 路由当前由 `App.tsx` 手写，页面继续增加后可考虑引入更清晰的路由表。
4. 历史入口组件仍需要审计，确认是删除、归档还是保留为参考。

### 6.2 可以继续增强

1. Play 模块增加更多独立实验。
2. 主页面四个节点替换成真实个人内容。
3. Work 节点接项目卡片、GitHub 链接、截图、开发日志。
4. Source 节点补充模型版权、素材来源、设计参考。
5. Live2D 模型加载状态可做更细的错误提示。
6. 移动端单独优化入口按钮、Live2D 布局和小游戏手感。

---

## 7. 开发约定建议

### 7.1 文件命名

- React 组件：`PascalCase.tsx`
- 业务数据：`camelCase.ts`
- 样式文件：按模块命名，如 `main.css`、`play.css`
- 文档文件：大写英文，如 `PROJECT_OVERVIEW.md`

### 7.2 模块拆分原则

一个文件超过 300 行且包含多种职责时，应考虑拆分。

优先拆分方向：

```text
src/components/main/
├─ MainPage.tsx
├─ MainScene.tsx
├─ MainStudyModel.tsx
├─ EnergyField.tsx
├─ DetailLayer.tsx
└─ sectionConfig.ts
```

```text
src/components/play/
├─ PlayPage.tsx
├─ PlayGamePage.tsx
└─ DodgeGame.tsx
```

```text
src/components/entry/
├─ BootOverlay.tsx
├─ Live2DEntry.tsx
├─ Live2DStage.tsx
└─ CursorParticles.tsx
```

### 7.3 提交信息建议

使用简短明确的英文或中文均可，但要表达“改了什么”。

示例：

```text
Fix Cloudflare redirects loop
Split Play game page
Refine Live2D entry layout
Add project overview docs
优化移动端入口布局
```

---

## 8. 当前项目一句话总结

这是一个以强入口体验为核心的个人网站项目：React 负责状态和页面组织，Three.js/R3F 负责主页面 3D 场景，Live2D Cubism SDK 负责看板娘舞台，Canvas 负责粒子与小游戏，Cloudflare 负责线上部署。
