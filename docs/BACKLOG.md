# Sakura1Tap Backlog

> 所有新想法先放这里。先收纳，再筛选，再设计，再开发。

状态：`idea`、`candidate`、`planned`、`doing`、`done`、`blocked`  
优先级：`P0` 稳定性、`P1` 明显体验短板、`P2` 内容和维护性、`P3` 未来扩展

## Inbox

### 建立文档驱动开发流程

- Status: done
- Priority: P1
- Layer: Docs
- Owner role: Keeper / Archivist
- Goal: 给项目建立维护、设计、开发、记录四类工作角色，减少随机改代码带来的混乱。
- Scope: 新增 `docs/WORKFLOW.md` 和本 backlog。
- Acceptance: 后续想法有统一入口；每类工作职责清楚。
- Risks: 流程写太重会没人用，所以保持轻量。
- Notes: 2026-06-30 已创建初版。

### 修正文档中的 `_redirects` 状态

- Status: done
- Priority: P0
- Layer: Docs / Build
- Owner role: Keeper
- Goal: 让项目文档和 `public/_redirects` 的实际状态一致。
- Scope: 检查 `docs/PROJECT_OVERVIEW.md`、`docs/CHANGELOG.md`、`README.md` 中关于 Cloudflare fallback 的描述。
- Acceptance: 文档明确说明当前 `_redirects` 是 disabled，或者恢复并验证实际 fallback 规则。
- Risks: Cloudflare Workers/Assets 曾因 SPA rewrite 触发 infinite loop，不能随意恢复全局 fallback。
- Notes: 2026-06-30 已同步 `docs/PROJECT_OVERVIEW.md` 和 `docs/CHANGELOG.md`。

### 清理 `MainPage.tsx` 旧版 Play 残留

- Status: done
- Priority: P1
- Layer: Main Scene / Play
- Owner role: Builder
- Goal: 移除 `MainPage.tsx` 中已被独立文件替代的旧版 `DodgeGame` 和 `PlayPage`。
- Scope: 只删除不可达重复代码和无用 import/type，不改变现有 `/play` 与 `/play/blackout` 行为。
- Acceptance: `npm run build` 通过；主页面 Play 节点仍能进入 Play Toolbox；Blackout Run 仍在独立页面运行。
- Risks: 误删仍被引用的类型或图标 import。
- Notes: 2026-06-30 已删除旧版重复导出，独立文件继续承载 Play 路由。

### 抽离主页面 section 配置

- Status: done
- Priority: P2
- Layer: Main Scene
- Owner role: Builder
- Goal: 把 `sections` 静态配置从 `MainPage.tsx` 移到独立数据文件，降低主文件复杂度。
- Scope: 新增类似 `src/data/mainSections.ts` 的文件，只移动静态配置和相关类型。
- Acceptance: 主页面视觉和交互不变；section 切换、热点、详情卡片都正常；`npm run build` 通过。
- Risks: 图标类型和 React 组件类型需要保持 TypeScript 兼容。
- Notes: 2026-07-01 已抽离到 `src/data/mainSections.ts`，没有混入 3D 组件拆分。

### 拆分主页面 3D 场景组件

- Status: done
- Priority: P2
- Layer: Main Scene
- Owner role: Builder
- Goal: 将 `MainPage.tsx` 中的 R3F/Three 场景逻辑拆到独立组件，降低页面组件复杂度。
- Scope: 新增 `src/components/main/MainScene.tsx`，移动 `SceneRig`、`MainStudyModel`、`EnergyField` 和 `MainScene`。
- Acceptance: 主页面视觉和交互不变；GLB buffer 仍能传入主场景；`npm run build` 通过。
- Risks: R3F hook 必须继续位于 Canvas 子树内；模型解析和节点切换不能被破坏。
- Notes: 2026-07-01 已完成。`MainPage.tsx` 继续负责页面状态、节点导航和 DOM 层。

### 拆分主页面节点详情层

- Status: done
- Priority: P2
- Layer: Main Scene
- Owner role: Builder
- Goal: 将节点详情弹层从 `MainPage.tsx` 拆出，进一步区分页面编排和详情 DOM。
- Scope: 新增 `src/components/main/DetailLayer.tsx`，移动详情标题、关闭按钮和详情卡片渲染。
- Acceptance: `OPEN NODE` 仍能打开详情；关闭按钮仍正常；动画和样式类名不变；`npm run build` 通过。
- Risks: `AnimatePresence` 仍由父层控制，拆出组件时不能改变挂载/卸载动画边界。
- Notes: 2026-07-01 已完成。

### 拆分主页面主面板

- Status: done
- Priority: P2
- Layer: Main Scene
- Owner role: Builder
- Goal: 将主页面标题、正文和主操作按钮从 `MainPage.tsx` 拆出，降低页面编排文件复杂度。
- Scope: 新增 `src/components/main/MainPanel.tsx`，移动 `.main-panel` DOM、面板切换动画和 action 按钮。
- Acceptance: 面板文字切换动画不变；`OPEN NODE` 仍打开详情；`OPEN TOOLBOX` 仍进入 Play；`npm run build` 通过。
- Risks: Play 路由决策不应下沉到展示组件中，否则会让 `MainPanel` 变成路由组件。
- Notes: 2026-07-01 已完成。父层继续负责 action 决策。

### 拆分主页面节点导航

- Status: done
- Priority: P2
- Layer: Main Scene
- Owner role: Builder
- Goal: 将主页面节点导航按钮从 `MainPage.tsx` 拆出，降低页面编排文件复杂度。
- Scope: 新增 `src/components/main/MainNodeMap.tsx`，移动 `.main-node-map` DOM、节点图标和节点按钮渲染。
- Acceptance: 节点按钮仍能切换 About / Work / Source / Play；激活态不变；`npm run build` 通过。
- Risks: 节点顺序必须继续来自 `sectionOrder`，不能在组件内写死。
- Notes: 2026-07-01 已完成。

### 拆分主页面场景热点

- Status: done
- Priority: P2
- Layer: Main Scene
- Owner role: Builder
- Goal: 将主页面场景热点按钮从 `MainPage.tsx` 拆出，降低页面编排文件复杂度。
- Scope: 新增 `src/components/main/SceneHotspots.tsx`，移动 `.scene-hotspots` DOM、热点坐标和热点按钮渲染。
- Acceptance: 场景热点仍能切换节点；热点位置继续来自 section 配置；`npm run build` 通过。
- Risks: 热点位置依赖 CSS 自定义属性，拆分时不能改变变量名。
- Notes: 2026-07-01 已完成。

### 拆分主页面技术条

- Status: done
- Priority: P2
- Layer: Main Scene
- Owner role: Builder
- Goal: 将底部技术条从 `MainPage.tsx` 拆出，让页面编排文件只保留状态和组合逻辑。
- Scope: 新增 `src/components/main/TechStrip.tsx`，移动 `.tech-strip` DOM 和图标。
- Acceptance: 技术条显示内容和样式类名不变；`npm run build` 通过。
- Risks: 该组件当前是静态展示，避免过度设计 props。
- Notes: 2026-07-01 已完成。

### 审计历史入口组件

- Status: done
- Priority: P2
- Layer: Entry / Docs
- Owner role: Keeper
- Goal: 判断 `EntryScene`、`EntryControls`、`EnterOverlay`、`Live2DCharacter`、`StudyModel` 是否仍有保留价值。
- Scope: 搜索引用、确认是否为历史实验、决定删除、归档或保留说明。
- Acceptance: 每个疑似历史组件都有明确结论。
- Risks: 这些组件可能是未来回滚或参考用，不应未确认就删除。
- Notes: 2026-07-01 已完成，结论记录在 `docs/HISTORICAL_COMPONENT_AUDIT.md`，未引用旧组件已删除。

### 建立功能规格目录

- Status: done
- Priority: P2
- Layer: Docs
- Owner role: Designer
- Goal: 为大一点的功能建立 `docs/specs/`，先写设计说明再开发。
- Scope: 新增目录和一个 spec 模板。
- Acceptance: 新 Play 模块、主页面内容改版、Live2D 行为调整都能按模板写规格。
- Risks: 模板过复杂会降低使用率。
- Notes: 2026-07-01 已新增 `docs/specs/README.md` 和 `docs/specs/SPEC_TEMPLATE.md`。

### GSAP / 3D / 立体滑动前端重设计

- Status: doing
- Priority: P1
- Layer: Main Scene / Entry / Styling / Performance
- Owner role: Designer / Builder / Keeper
- Goal: 用 GSAP 时间线、水波层、3D 深度协调和性能守则重设计主页面动效，让 Sakura1Tap 更有立体感和专业交互感。
- Scope: 先完成设计文档，再按 Phase 1-3 小步实现：GSAP 基础设施、主页面 Motion Shell、Ripple MVP。
- Acceptance: 设计文档明确视觉方向、技术边界、性能规则、阶段计划和验收标准；实现阶段必须保持 Boot -> Live2D -> Main、Play 路由和 WebGL fallback 不被破坏。
- Risks: 动效过度会遮挡内容或拖慢低端设备；ScrollTrigger 长页面改造暂不作为第一阶段。
- Notes: 2026-07-01 已创建 `docs/specs/FRONTEND_REDESIGN_GSAP_3D_MOTION.md`，推荐 A + B 混合路线：Ripple Atlas + Camera-Bound Nodes。Phase 1 已完成，新增 GSAP 依赖和 `src/motion/` 基础设施，`npm run build` 通过。

### 黑樱基因观测站页面系统设计

- Status: doing
- Priority: P1
- Layer: Entry / Main Scene / Motion / Assets / Performance
- Owner role: Designer / Keeper / Builder / Archivist
- Goal: 把 GSAP 动效、R3F 主场景、Live2D 入口和素材库统一成一个兼容性强、系统性强、可扩展的前端页面设计。
- Scope: 新增系统设计文档和素材库清单；明确素材分层、页面体验、模块 interface、兼容等级和实现阶段。
- Acceptance: 后续实现可以按 Phase 0-6 推进；素材不会散落引用；MainPage 不重新膨胀；Live2D、Play、Cloudflare 等边界清楚。
- Risks: 素材授权和体积必须先审计；DNA/HDRI/黑岩材质不能直接进入首屏；动漫/IP 模型未经确认不能公开使用。
- Notes: 2026-07-01 已新增 `docs/specs/BLACK_SAKURA_GENOME_FRONTEND_DESIGN.md` 和 `docs/ASSET_LIBRARY.md`。已开始 Phase 0/1，新增 `src/assets/assetManifest.ts`、`src/components/main/MainMotionLayer.tsx` 和懒加载的 `MainMotionController.tsx`。主页面已完成第一轮黑樱基因观测站视觉大改，包含程序化 DNA、黑曜石基座、GSAP sequence timeline 和新视觉覆盖样式。

### 建立主页面拆分专项文档

- Status: done
- Priority: P1
- Layer: Docs / Main Scene
- Owner role: Archivist / Designer
- Goal: 为主页面拆分项目建立完整日志和整体设计文档，先明确整体架构再继续局部拆分。
- Scope: 新增 `docs/MAIN_PAGE_SPLIT_LOG.md` 和 `docs/MAIN_PAGE_SPLIT_DESIGN.md`。
- Acceptance: 文档包含已完成步骤、当前结构、模块边界、阶段计划、风险和验收标准。
- Risks: 文档过细会增加维护负担，所以后续只在阶段性结构变化时更新。
- Notes: 2026-07-01 已完成。

### 优化入口背景资源

- Status: candidate
- Priority: P2
- Layer: Boot / Assets
- Owner role: Keeper / Builder
- Goal: 在不明显降低画质的前提下降低 `public/images/fantasy-road.png` 体积。
- Scope: 生成高质量 WebP 或 AVIF 候选，视觉确认后再替换引用。
- Acceptance: 背景清晰度基本不变；首屏资源体积下降；`npm run build` 通过。
- Risks: 过度压缩会破坏当前暖纸幻想氛围。
- Notes: 当前 PNG 约 3.08 MB。

### 复查主模型 GLB 体积

- Status: idea
- Priority: P2
- Layer: Main Scene / Assets
- Owner role: Keeper
- Goal: 查看 `public/models/study.glb` 是否有安全优化空间。
- Scope: 先分析体积和贴图，再决定是否生成候选文件。
- Acceptance: 不损失正常观看距离下的模型质量。
- Risks: 模型视觉劣化、加载失败或 attribution 漏记。
- Notes: 当前 GLB 约 3.60 MB，已有 `study-attribution.txt`。

### 补真实个人内容

- Status: idea
- Priority: P2
- Layer: Main Scene / Content
- Owner role: Designer
- Goal: 替换 About、Work、Source 中偏占位的文字，让网站更像真实个人入口。
- Scope: 先写文案草稿，再更新主页面配置。
- Acceptance: 内容适合学生作品集或个人展示，不破坏现有幻想极简氛围。
- Risks: 文案太满会削弱当前低文字密度体验。
- Notes: 可以先从 Work 节点的项目档案开始。

### 扩展 Play Toolbox 第二个模块

- Status: idea
- Priority: P3
- Layer: Play / Game
- Owner role: Designer
- Goal: 在 `Blackout Run` 之外新增一个小型互动实验。
- Scope: 先确定玩法和输入方式，再决定是否独立路由。
- Acceptance: 模块有明确可玩目标，不只是装饰 demo。
- Risks: 过早扩展会增加维护负担。
- Notes: 候选方向：Signal 鼠标轨迹、粒子节奏、反应训练。

## Done

已完成项保留在 Inbox 或按日期移入这里。当前先保持轻量，不额外分组。
