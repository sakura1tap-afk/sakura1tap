# Sakura1Tap 项目日志

> 本日志用于记录项目关键结构、功能、部署和维护变更。  
> 不是严格语义化版本日志，重点是帮助后续开发快速回忆“为什么这么改”。

---

## 2026-07-16

### 修复：Cloudflare 排行榜后端部署与 JSON 响应

- 线上诊断确认 GET 接口错误回退到 SPA HTML、POST 接口返回 405 空响应，说明静态部署未装载 `functions/`。
- 新增 `worker/index.js` 与 `wrangler.jsonc`，按 Workers Static Assets 模式拦截排行榜 API，并将其他请求交回 `env.ASSETS`。
- Wrangler 明确声明 `REACTION_DB (sakura1tap-reaction)`；配置通过 Wrangler 4 dry-run，部署时不再依赖 Pages Functions。
- 前端读取接口时先校验响应体和 Content-Type，避免再次显示浏览器原始的 `Unexpected end of JSON input`。
- Worker 语法检查与反应测试组件独立 TypeScript 检查通过；正式域名需在 Cloudflare 完成该提交部署后复验。

## 2026-07-16

### 新增：D1 动态反应时间排行榜

- 新增 Pages Function `/api/reaction-leaderboard`，使用 `REACTION_DB` D1 binding。
- API 首次访问自动创建成绩表与索引；binding 缺失时返回明确的 503 提示。
- GET 返回全站 Top 10，POST 校验五次成绩并由服务端重新计算平均值。
- 同一浏览器通过本地玩家标识只保留最好成绩，避免普通重复测试堆积榜单。
- 反应测试完成页新增昵称与保存成绩操作；初始页和完成页显示紧凑榜单，红/绿测试阶段自动隐藏。
- 新增 `migrations/0001_reaction_scores.sql` 与 `docs/specs/REACTION_LEADERBOARD.md`。
- 前端、Function 已通过 TypeScript 检查，排行榜 CSS 已通过 PostCSS 解析。

## 2026-07-16

### 文案：片段页改为「哥布林万岁！」

- 删除片段章节中偏概念化的设计说明与持续记录尾注。
- 可见内容收敛为一句「哥布林万岁！」，保留原章节位置、背景人物和滚动动效。

## 2026-07-16

### 优化：入口改为幽静月色氛围

- 定位并关闭旧全局样式遗留的入口黄色径向光与扫描层，避免覆盖当前 Cinematic Entry。
- 背景遮罩改成深青灰暗角，仅在月亮方向保留非常克制的冷色环境光。
- 品牌竖线、进入按钮、箭头、悬停和进入转场从暖金色统一为低饱和月光蓝灰。
- 背景静态放大从 1.5% 收敛到 0.4%，进入转场放大从 6.5% 收敛到 3.5%，减少插值模糊。
- 调整背景饱和度、亮度和对比度，恢复花枝、建筑与水面中间调细节，同时保持幽暗观感。
- 核对桌面背景母版为 2880×1620、约 176KB；记录后续高质量 4K 母版方案，不使用普通插值伪造细节。
- 新增 `docs/specs/ENTRY_MOONLIT_REFINEMENT.md`，记录问题来源、设计决策与图像质量结论。

## 2026-07-16

### 优化：反应测试纯色测试区与等待分布

- 页面改为上下结构：上方只保留可点击的纯色色块，下方承载导航、进度、引导、记录和结果。
- 上方测试区删除全部文字、圆环、网格、纹理、边框、内阴影和状态动效；红色切换绿色时不使用颜色过渡。
- 随机源继续使用 `window.crypto.getRandomValues`，避免 `Math.random()` 的可预测性。
- 等待分布调整为 72% 短等待、23% 中等待、5% 长等待；出现 5 秒以上等待后，下一次必定回到短等待。
- 20 万次抽样验证范围为 1200–8000ms，长等待约 4.8%，连续长等待为 0。
- TypeScript 检查与 PostCSS 解析通过，设计规格同步升级为第二版。

## 2026-07-16

### 替换：Blackout Run 退役，新增反应时间测试

- 删除缺乏平衡性的 Blackout Run 模块、`/play/blackout` 路由和旧游戏实现。
- 新增 `/play/reaction`：标准红色等待、随机变绿、点击绿色计时的反应测试。
- 单轮随机等待为 1.2–8 秒；随机边界经过验证，不会超过 8 秒。
- 每次测试收集 5 次有效结果并计算平均值；红色阶段提前点击判为抢跑且不计入成绩。
- 同时支持鼠标、触控、空格与 Enter，完成态展示五次明细并允许重新测试。
- 功能空间特色卡片改为反应时间测试，总模块数从 8 个收敛为 7 个。
- 新增 `docs/specs/REACTION_TEST_DESIGN.md`，记录规则、状态机、交互与退役决策。
- 新页面和功能空间已通过 TypeScript 检查，CSS 已通过 PostCSS 解析。

## 2026-07-16

### 重做：功能空间成为可扩展模块库

- 重写 `PlayPage`，删除旧版巨型 Blackout 介绍区和重复 Play mode 列表。
- 页面建立全部 / 游戏 / 工具 / 实验分类，并支持名称、说明和标签的全文搜索。
- 模块统一显示分类、状态、名称、单句说明、标签与操作；状态限定为可用、制作中、规划中。
- Blackout Run 保留为特色可用游戏，并继续进入原 `/play/blackout` 全屏程序。
- 动效实验室作为第二个可用模块接入；App 新增 `/play` 到 `/lab` 的内部导航。
- 第一版登记 8 个模块：3 个游戏、3 个工具、2 个实验；未完成模块不提供伪入口。
- 新增独立 `src/components/play/FunctionSpace.css`，不再依赖旧 Play 样式层叠。
- 新增 `docs/specs/FUNCTION_SPACE_REDESIGN.md`，记录信息架构、模块状态和扩展规则。
- `PlayPage` 已通过 TypeScript 类型检查，独立 CSS 已通过 PostCSS 解析。

## 2026-07-16

### 重做：动效实验室成为窗口放映场

- 新增 `MotionLabPage`，将 `/lab` 从旧版 `LegacyMainExperience` 和 R3F/Three 视频纹理场景中独立出来。
- 四段现有 MP4 改用真实 `<video>` 窗口呈现，保留“窗口即按钮”的创意：悬停预览、点击聚焦播放、再次点击暂停。
- 新增四窗口空间阵列、分层视差、空白区拖动、聚焦变形、扫描光、回声边框、播放进度与概览返回。
- 加入 Escape、左右方向键、移动端 2×2 概览、单窗口聚焦和 `prefers-reduced-motion`。
- 品牌入口现在真正返回 Sakura1Tap 首页，不再切换实验室内部的虚假 Home 节点。
- 新增 `docs/specs/MOTION_LAB_REDESIGN.md`，记录设计原则、交互模型、架构变化和后续方向。
- 新页面 TSX 已通过 TypeScript 转译诊断，独立 CSS 已通过 PostCSS 解析。

## 2026-07-16

### 收口：功能优先的首页与入口

- 修正桌面拖拽时出现系统 `grabbing` 小手的问题；拖拽状态现在继续隐藏原生光标，只显示站点自定义光标反馈。
- 入口按钮可见文字固定为“进入”，修正行高、字距和控件高度，桌面端移到右下安全区；切换状态改由箭头动效和无障碍标签表达。
- Boot、Entry、主页页眉、页脚、页面标题与 Open Graph 名称统一为 `Sakura1Tap`，删除可见品牌后缀。
- 删除首页介绍句、互动说明、功能卡片描述、继续页说明与页脚操作提示，降低叙述性文案占比。
- 主页功能列表移除独立 Blackout Run 行；`/play` 继续作为功能空间，Blackout Run 保留在该空间及原路由中。
- “片段”章节暂时保留，五幕滚动结构、Live2D 底层、场景素材和 Play 功能均未改动。
- 变更后的 TSX 已通过 TypeScript 转译诊断，CSS 已通过 PostCSS 解析；并核对页面标题、`/play` 入口、片段章节和 Blackout 首页行状态。

## 2026-07-15

### 第一版：中文暗色视觉收口

- 新增 `docs/specs/PHASE_1_AESTHETIC_CONVERGENCE.md`，记录设计锁定、阶段边界、验收标准和逐文件操作。
- Boot、入口状态、章节导航、交互说明、功能入口和网页元信息完成第一轮中文化。
- 入口删除英文诗意文案与独立暖色光球，按钮改为底部居中的小型胶囊玻璃控件，仅保留 `准备中`、`进入`、`正在进入` 三种状态。
- 主页保留五幕 GSAP 结构，将章节整理为首页、互动、功能、片段、继续，并将主标题上限从约 145px 收敛到 88px。
- 新增中文字体栈，放大过小辅助文字，削弱英文排版使用的极端字距与紧行高。
- 自定义光标尺寸与交互反馈收敛，不再显示持续跟随的 `DRAG` 文案。
- Cinematic Canvas 增加深色不透明清屏、静态 fallback 遮罩与轻微冷色校正，降低纹理加载时暴露浅色底的风险。
- 本轮没有改变 Live2D 底层、路由、现有素材清晰度或 Play 功能。
- 当前执行环境缺少完整私有仓库 checkout 与 GitHub CLI；完整 `npm run build` 和视觉验收留给 PR 检查或完整仓库环境补充。
- 第一版上线后通过正式域名验证 Cloudflare 已切换中文标题；同时发现无 WebGL 环境仍显示旧米白降级页，现已将根节点和 `.webgl-fallback` 修正为统一暗色视觉。

## 2026-07-01

### 调整：主场景影片框聚焦与 Entry 小游戏手感

- 主场景临时撤下手部模型、粒子、环、底座和背景光影等堆叠层，只保留四个 MP4 影片框作为下一阶段功能入口原型。
- 删除影片框拖拽交互，改为点击某个影片框后平滑移动到屏幕中心成为焦点；非焦点影片框保留更大的左右旋转角度。
- Entry 缓冲小游戏降低左右移动速度和跳跃高度，修正按住跳跃键导致落地反复弹起的问题。
- Entry 小游戏世界宽度拉长，加入镜头跟随和背景相对移动，避免人物在固定画布上高速滑动。

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

## 2026-07-02

### 重定向：按中世纪幻想风设计文档重做方向

- 新增 `docs/specs/MEDIEVAL_FANTASY_REALM_DESIGN.md`，根据用户提供的视觉设计文档截图整理正式规格。
- 设计方向从 Black Sakura Genome Observatory 调整为 Medieval Fantasy Realm：森林、远山、城堡、玻璃拟态、暖金光标水波和沉浸式页面切换。
- `src/data/mainSections.ts` 将主 IA 改为 Home / Universe / Portfolio / Blog / About。
- `src/components/main/RealmInterface.tsx` 新增幻想风主界面：顶部导航、玻璃 hero panel、realm map card 和底部进度轨。
- `src/components/main/MainExperience.tsx` 改用 `realm-experience` Shell；Home 默认不加载 3D 舞台，只有 Universe 节点懒加载 `GenomeStage`。
- `src/components/Live2DEntry.tsx` 入口文案改为 `ENTER THE REALM`，状态语言改为 Realm Gate / Gate Ready。
- `src/components/BootOverlay.tsx` 加载文案改为 Realm Boot / Forest Gate。

### 第二阶段：清理旧 Genome 视觉骨架

- `src/components/BootOverlay.tsx` 和 `src/components/BootMotionController.tsx` 将加载层结构从 `boot-genome-*` 改为 `boot-realm-*`，减少旧赛博/DNA 语义残留。
- `src/components/Live2DEntry.tsx` 和 `src/components/EntryMotionController.tsx` 将入口中心环从 observatory 改为 `realm-entry-sigil`。
- `src/components/main/MainExperience.tsx` 新增像素级光标变量，修正主页面金色水波跟手位置。
- `src/style.css` 将 Boot/Entry 的主光色统一到暖金与灰白，并拆开 Boot gate 与 readout 的退场过渡。
- 删除未引用的 `src/components/main/GenomeInterface.tsx`，并移除对应旧 `genome-interface` / `genome-experience` CSS 块；保留 Universe 懒加载使用的 `GenomeStage`。

### 第三阶段：Universe 3D 舞台语义改造

- `src/components/main/GenomeStage.tsx` 重命名为 `src/components/main/RealmWorldStage.tsx`，主页面懒加载引用同步改为 Realm / World 语义。
- `src/components/main/DnaHologram.tsx` 重命名为 `src/components/main/ArcaneRelicHologram.tsx`，将现有 GLB 明确降级为 Universe 临时奥术遗物占位。
- `src/assets/assetManifest.ts` 将资产 id 从 `dna-hologram` 调整为 `arcane-relic-hologram`，运行时 URL 暂时沿用 `/art/models/dna_hologram.glb`。
- `src/components/main/MainScene.tsx` 将 fallback 从 `GenomeMotif` 改为 `WorldSigilFallback`，并把 Universe 3D 光色从青粉收敛到暖金与灰白。
- `src/components/main/MainMotionController.tsx` 移除未使用的旧 `genome-*` 动效选择器。
- `docs/ASSET_LIBRARY.md` 更新该 GLB 的定位：临时占位，不再作为网站身份主题。
- 删除未引用的旧主页面组件 `MainPanel`、`MainNodeMap`、`SceneHotspots` 和 `TechStrip`；当前主界面由 `RealmInterface` 接管。
- `MainMotionController` 进一步收敛到当前 Realm DOM 目标，不再扫描旧主页面组件选择器。

### 第四阶段：减少文字，转向视觉主导

- `RealmInterface` 移除主屏长段落和 `PLAY LAB` 次按钮，只保留栏目标题、序号和一个 ENTER 动作。
- `Live2DEntry` 移除入口说明段，首屏更接近视觉海报。
- `src/style.css` 弱化玻璃卡片感，放大标题，隐藏地图列表和系统条，强化暗角、雾、金色光源与轨道符号。
- Play 路由仍保留 `/play` 直达入口，但不再占用主视觉。
- 新增主场景前景暗框、金尘粒子和呼吸轨道；入口页同步加深暗角与封面式标题。

### 第五阶段：对齐 Active Theory / Lusion / Bruno 的 3D 装置方向

- 重写 `docs/specs/MEDIEVAL_FANTASY_REALM_DESIGN.md`，方向从“中世纪大字海报”改为“3D installation portfolio”。
- `RealmWorldStage` 改为主页面进入后即懒加载，不再只在 Universe 节点显示。
- `MainScene` 新增 `InstallationPanels`，用程序化玻璃屏、金属环、装置框架承接参考截图中的 3D 展厅结构。
- `EnergyField` 粒子数量从 260 增加到 900，形成更密的粒子体。
- `src/style.css` 缩小主标题与按钮，降低背景图存在感，提高 3D 舞台透明度与视觉优先级。
- 移除 Boot 百分比数字和装饰文字，只保留进度条。
- 移除主页面数字式底部进度、metric 标签和地图列表数字；文字进一步缩小。
- 移除 Entry 栏目文字堆栈与 Detail 层数字 metric，避免回到控制台式说明界面。
- `MainScene` 新增 `ParticleBloom` 和 `LiquidReflection`，用高密粒子云、光流和地面反射强化 3D 装置感。
- `RealmInterface` 推翻旧的可读菜单/标题/按钮结构，改为边缘品牌、小点导航、图标入口和纯进度线，中心区域交还给 3D 装置。

### 性能：3D 舞台 chunk 与运行时算法优化

- 移除 `RealmWorldStage` 内对 `@react-three/drei` 的 `Center/Html` 依赖，改用 Three `Box3` 包围盒算法居中模型，减少 3D chunk 依赖面。
- `ArcaneRelicHologram` 改为 GLB clone 一次，栏目切换时只更新材质颜色、发光和透明度，避免重复 clone 场景树与重建材质。
- `MainStudyModel` 解析入口预加载的 `ArrayBuffer` 时不再额外 `slice` 复制，降低内存峰值。
- 主 Canvas DPR 上限从 2 降到 1.5，移动端降低粒子数量，并移除当前无明显视觉收益的 shadow 管线。

### 素材：接入超现实手部装置模型

- 将 `素材库/2d_hand_creation_rigged.glb` 复制到 `public/art/models/2d_hand_creation_rigged.glb`，作为可部署运行时模型。
- 新增 `SurrealHandRelic`，以 Three `Box3` 居中模型，并用透明发光材质接入主 3D installation 舞台。
- `MainScene` 在 DNA/奥术遗物之外新增手部装置物，增强“创作者装置 / surreal artifact”方向。
- 更新 `src/assets/assetManifest.ts`、`public/art/ASSET_SOURCES.md` 和 `docs/ASSET_LIBRARY.md`，记录运行时路径、来源路径和授权待补充提醒。

### 性能：秒级切入与素材图层错峰加载

- `MainExperience` 新增 `stagePhase` 秒级时间表：背景、氛围、边缘 UI、Three 舞台、DNA GLB、手部 GLB 分阶段出现。
- `RealmWorldStage` / `MainScene` 新增 `assetPhase`，Three 舞台先渲染程序化 fallback，再延迟挂载 DNA 与手部模型，避免重 GLB 同时请求。
- `src/style.css` 新增主页面图层淡入变量：`--layer-backdrop`、`--layer-atmosphere`、`--layer-ui`、`--layer-stage`，用 opacity/transform 做低成本切入。
- 当前节奏：0.18s 背景，0.55s 氛围，0.95s UI，1.35s Three 舞台，2.25s DNA，3.20s 手部模型。

### 性能：Vite vendor 分包

- `vite.config.ts` 新增 `manualChunks`，将 React、Three/R3F、GSAP、Framer Motion、Live2D/Pixi 分离为稳定 vendor chunk。
- `RealmWorldStage` 从约 939 kB 降到约 17.55 kB；Three/R3F 进入独立 `three-vendor`，用于浏览器长期缓存。
- 当前构建警告主要来自 `three-vendor` 体积，这是 3D 引擎层，不再是业务场景代码膨胀。

### 第一版补齐：媒体玻璃屏与线缆装置层

- `MainScene` 新增程序化 media-glass textures，用 CanvasTexture 生成暗色光斑、曲线和半透明显示屏效果，不额外下载图片。
- 新增 `MediaGlassPanels`，把左右两块玻璃屏作为主舞台内容层，替代纯色平面。
- 新增 `CableRig`，用线段和悬挂环把模型、面板和地面反射绑定成一个完整空间装置。
- 第一版可以在没有真实作品截图的情况下先呈现完整视觉骨架；后续将程序化纹理替换为真实项目封面。

### 视觉校正：降低惊悚感

- 回应截图反馈：第一版手部模型过大、过白、过像标本，整体黑场过空，容易变成恐怖实验室气质。
- `SurrealHandRelic` 缩小并移到舞台边缘，材质从惨白发光改为暖灰、低透明、低发光。
- `MainScene` 调暖背景、雾、半球光和媒体玻璃屏透明度，让主视觉更像神秘展厅而不是断手标本。
- `src/style.css` 提高背景图和暖色环境层存在感，减少纯黑空洞。

### 交互：媒体屏与 Entry 小游戏缓冲层

- `MediaGlassPanels` 增加点击播放/暂停状态，播放中的屏幕会提高亮度并显示进度条动效。
- `MediaGlassPanels` 增加基础拖拽偏移，可用鼠标拖动左右玻璃屏，后续可接 GSAP Draggable 或物理惯性。
- 新增 `EntryMiniGame`，把 Entry 从静态门面改成轻量小游戏缓冲层；支持方向键 / WASD 横向移动，空格 / W / 上方向键跳跃。
- `Live2DEntry` 不再显示大标题和 sigil，Live2D 退为背景氛围，ENTER 按钮固定到底部。
- `EntryMotionController` 改为驱动小游戏层入场，移除旧 sigil 动效目标。

### 重做：黑白 Boot、Kenney Entry 小游戏、MP4 媒体屏

- `BootOverlay` 移除背景图、彩色晕影、realm gate 和 BootMotionController 挂载，改成纯黑底、白色十字和底部进度线。
- 解压 `素材库/kenney_new-platformer-pack-1.1.zip` 到 `public/art/game/kenney-new-platformer/`。
- `EntryMiniGame` 重写为带重力、摩擦、平台碰撞、跳跃和金币收集判定的 Kenney 2D platformer buffer。
- 复制用户提供的 4 个 mp4 到 `public/art/videos/`；当前左右玻璃屏使用 `272021_medium.mp4` 和 `285205_medium.mp4` 作为 VideoTexture。
- 旧 Entry 壁纸、网格、晕影、Live2D 舞台和粒子视觉层通过 CSS 覆盖为隐藏，Entry 只保留小游戏和底部 ENTER。

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
