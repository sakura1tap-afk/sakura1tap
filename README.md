# Sakura1Tap 🌸

> 一个仍在持续开发中的互动式个人网站。先让它活起来，再慢慢让它变强。

`Sakura1Tap` 的核心定位是一个个人网站。它首先是一个面向访问者的网页入口，用来承载个人介绍、作品展示、学习记录、设计来源和一些可玩的前端实验。

这个网站目前仍在开发中。现阶段重点不是把它做成传统意义上的开源项目模板，而是先打磨网站本身的第一印象、进入流程、视觉风格和互动体验。换句话说：先把门面支起来，再往里面慢慢装修。README 会随着网站内容和功能持续更新。

## Current signature experience — Void Relic

The production homepage now uses a five-act GSAP scroll narrative built around a luminous obsidian relic: Opening → Compression → Expansion → Drift → Exit. `/play` and `/lab` remain available from the third act, and the earlier fantasy-realm installation is kept in `src/components/main/` but is no longer routed.

## 网站当前进度 🚧

目前已经实现的主要内容：

- Live2D 入口页 🎭
  - 首页 `/` 首先进入 Live2D 入口舞台（双模型）。
  - 支持鼠标焦点追随。
  - 支持点击角色触发表情 / 动作反馈。
  - 支持进入按钮与入场转场。
  - Cubism 运行时按需加载，只在内页不下载。
- 主页面：Void Relic 五幕滚动叙事 🧭
  - 使用 Three.js / React Three Fiber + GSAP ScrollTrigger。
  - 通过滚动切换首页 → 互动 → 功能 → 片段 → 继续五幕。
  - 第三幕提供「功能空间」与「动效实验室」入口。
- Play 工具箱 🎮
  - 已建立独立的功能空间页面，带分类筛选与搜索。
  - 当前可用模块：`反应时间测试`、`动效实验室`（含「仿 Lusion」物理实验场）。
  - `Signal`、`Color Forge`、`JSON Lens` 等仍标记为规划中。

## 网站体验流程 🗺️

当前访问流程大致如下：

```text
打开网站
  ↓
Live2D 入口页（背景图 + 双模型舞台）
  ↓
点击入口按钮
  ↓
主页面：Void Relic 五幕滚动叙事
  ↓
进入 Play 工具箱
  ↓
打开「反应时间测试」或「动效实验室」
```

当前路由：

```text
/                 Void Relic 五幕滚动主体验（入口页为 Live2D 舞台）
/lab              动效实验室：视频窗口 + 「仿 Lusion」物理实验场
/play             Play 工具箱 / 功能空间
/play/reaction    反应时间测试（含全站排行榜）
```

项目目前使用轻量的 History API 手写路由控制，暂未接入 React Router。现在页面还不算多，先别拿大炮打蚊子。

## 当前模块说明 🧩

### Boot 启动层

启动层负责网站第一阶段的加载演出。它会提前加载入口背景和主场景模型，避免用户进入主页面后才看到明显等待。

### Live2D 入口

Live2D 是当前网站的核心视觉记忆点之一。入口页会展示双模型舞台，角色可以根据鼠标位置改变视线方向，也可以通过点击触发表情或动作反馈。

模型的摆放按**实际网格包围盒**计算（见 `src/live2d/CubismSdkModel.ts` 的 `CubismSdkLayout` 说明）：`x` / `y` 是角色包围盒中心在视口中的比例，`height` 是该包围盒在 NDC 下的高度（1 = 半个视口高）。之所以不按 moc 画布居中，是因为这两个模型的网格相对画布原点偏移了大约半个画布。

### 主页面

主页面是网站的核心展示区域，当前是 Void Relic 五幕滚动叙事（首页 → 互动 → 功能 → 片段 → 继续）。功能幕提供「功能空间」和「动效实验室」两个入口。

> 早期基于 About / Work / Source / Play 四节点的 3D 魔幻场景仍保留在 `src/components/main/` 下，但已不再挂载到任何路由。

### Play 工具箱

Play 是承载小游戏、视觉实验和前端工具的区域。目前可用模块为「反应时间测试」和「动效实验室」。

### 反应时间测试

等待红色变绿后点击，完成 5 次有效测试计算平均值，并通过 `/api/reaction-leaderboard` 提交到 Cloudflare D1 排行榜（本地 `vite dev` / `vite preview` 没有 Worker，所以排行榜会显示未连接）。

### 动效实验室

`/lab` 提供四个可聚焦的视频动效窗口，以及「仿 Lusion」实验场：基于 Rapier 刚体物理的零件力场。Rapier 体积较大，只在进入该实验场时才动态加载。

## 技术栈 🛠️

| 分类 | 技术 |
| --- | --- |
| 前端框架 | React |
| 开发语言 | TypeScript |
| 构建工具 | Vite |
| 3D 渲染 | Three.js、React Three Fiber、Drei |
| Live2D | Live2D Cubism Core、自定义 Cubism SDK 封装 |
| 动效 | Framer Motion、GSAP |
| 小游戏 | HTML5 Canvas 2D |
| 图标 | Lucide React |
| 样式 | CSS |

## 项目结构 📁

```text
index.html                         页面入口，加载 Live2D Cubism Core
src/main.tsx                       React 根节点挂载
src/App.tsx                        顶层状态、入口流程、手写路由控制
src/motion/gsap.ts                 GSAP 注册和统一导出
src/motion/motionTokens.ts         动效时长、缓动和媒体查询 token
src/components/BootOverlay.tsx     启动加载层与 GLB 模型预加载（当前未挂载，遗留）
src/components/Live2DEntry.tsx     Live2D 入口页与进入按钮
src/components/Live2DStage.tsx     Live2D WebGL 舞台与模型调度
src/live2d/CubismSdkModel.ts       自定义 Cubism 模型加载、更新、渲染与布局逻辑
src/components/home/HomeExperience.tsx  主页面五幕滚动叙事
src/components/home/CinematicCanvas.tsx 主页面 WebGL 背景着色器
src/components/PlayPage.tsx        Play 工具箱 / 功能空间
src/components/play/ReactionTestPage.tsx 反应时间测试与排行榜
src/components/lab/MotionLabPage.tsx 动效实验室（视频窗口 → 仿 Lusion 实验场）
src/components/lab/LusionStudy.tsx    Rapier 刚体零件力场
src/data/mainSections.ts           早期四节点主页面的内容配置（当前未挂载，遗留）
src/components/main/*              早期 3D 魔幻主页面组件（当前未挂载，遗留）
src/components/PlayGamePage.tsx    Blackout Run 全屏程序页（当前未挂载，遗留）
src/components/DodgeGame.tsx       Canvas 躲避小游戏（当前未挂载，遗留）
src/components/CursorParticles.tsx 入口粒子与萤火效果（当前未挂载，遗留）
src/style.css                      全局样式（含若干历史设计遗留规则）
```

## 本地开发 💻

本仓库主要服务于网站本身，本地运行说明仅作为开发记录保留。想跑起来的话，先确保本地已经安装 Node.js。

```bash
npm install
npm run dev
npm run build
npm run preview
npm test        # 运行 Cloudflare Worker 的路由/缓存策略测试
```

## 线上部署 ☁️

- 正式域名：`https://www.sakura1tap.com`
- 生产分支：`main`
- 构建命令：`npm run build`
- 输出目录：`dist`
- Cloudflare 会在 `main` 更新后自动构建并发布。

## 开发状态 🌱

当前网站仍在开发中，已有功能更偏向“体验骨架”和“技术验证”。后续会继续补充真实内容、优化移动端、拆分样式并扩展 Play 模块。

目前它已经能看、能点、能动、能玩，但还远没到最终形态。简单说：房子主体搭起来了，软装、灯光、家具和猫还在路上。

## 后续计划 📝

短期计划：

- 补充更完整的个人介绍与项目内容。
- 整理模型、图片和素材来源说明。
- 清理无路由引用的遗留组件：`src/components/main/`、`BootOverlay.tsx`、`EntryMiniGame.tsx`、`CursorParticles.tsx`、`DodgeGame.tsx`、`PlayGamePage.tsx`、`src/components/artifact/`。它们仍能编译，但 `App.tsx` 已经不再渲染，属于上一版设计的残留（对应素材已在 `_archive/`）。
- `EntryMotionController.tsx` 目前只往 `.live2d-entry` 上写 `--entry-motion-*` 变量，而没有样式消费它们；要么删掉，要么把入口动效重新接上。
- `/lab` 的 Lusion 实验场首次进入仍偏慢（Rapier 分包 2.2 MB，gzip 830 KB），可以换成更小的物理方案或延迟到真正点击时再加载。
- `/lab` 的四个视频合计 38 MB，是 `dist` 里最大的一块；若拿到压缩工具，值得重新导出一版。

中期计划：

- 继续按页面拆分样式（`src/style.css` 现在只保留全局 base 与 Live2D 入口，其它页面各自持有 CSS）。
- 扩展 Play 工具箱，增加新的交互实验。
- 增加更明确的项目展示页或作品详情页。

长期计划：

- 将网站发展为个人作品集入口和前端实验室。
- 增加更多可交互模块。
- 根据页面数量决定是否引入 React Router。
- 完善部署说明和更新日志。

## Agent 说明 🤖

本仓库已经添加 `AGENTS.md`，用于约束 AI coding agent 修改代码时的行为。

核心原则包括：

- 保持 Sakura1Tap 的 Live2D + 3D + 互动网站定位。
- 不要把项目改成普通模板个人主页。
- 修改前先阅读相关文件，不猜测结构。
- 尽量做小而安全的改动。
- 不提交密钥、构建产物、依赖目录或临时文件。
- 修改后说明变更范围和验证情况。

## 注意事项 ⚠️

- 首页入口背景、Live2D 运行时和模型清单只在 `/` 预加载；Cubism Core 改为入口页按需注入，内页不再下载。进入主页要用的两张背景图在入口页以 `prefetch` 预热。
- Live2D 模型的摆放按实际网格包围盒计算，改 `layout` 前请先读 `CubismSdkLayout` 的说明。
- `src/style.css` 已收敛到当前站点真正命中的选择器（5929 行 → 371 行），历史几代设计的规则已删除，需要时可从 git 历史找回。改动它时要留意：现在文件里的声明顺序就是级联结果本身，随意重排会改变谁生效。
- 无路由引用的素材已移到 `_archive/`（见该目录的 README），`dist` 从 125 MB 降到 52 MB。它们仍在本地，移回 `public/` 再 build 即可恢复。
- 路由用 `history.pushState` + `sakura:route-change` 事件，站内跳转是单页切换，不会整页刷新；新页面由 `aria-live` 区域播报，并各自设置 `document.title`。
- 开启「减少动态效果」时，主页会退化成可正常滚动的静态五幕（而不是只剩第一屏）。
- 当前内容文案仍有占位性质，后续会持续替换为真实内容。
- 未匹配的路径会回落到主页面（没有独立 404 页）。

## License / 素材说明 📌

项目代码与素材授权信息后续会进一步整理。

如果新增第三方模型、图片、字体、音频或其他素材，应在 README 或独立文档中补充来源与授权说明。毕竟做网站可以浪漫，素材来源不能糊涂。
