# Sakura1Tap

> 一个仍在持续开发中的互动式个人网站与前端实验入口。

`Sakura1Tap` 目前定位为个人网站 / 作品集入口 / 前端交互实验站。它不是传统的静态个人主页，而是尝试把 Live2D、Three.js、Canvas 小游戏、滚轮绑定和动效转场组合成一个更有记忆点的网页体验。

当前项目仍处于开发阶段，页面内容、文案、移动端适配和功能模块都会继续迭代。本 README 会随着项目进展持续更新。

## 当前进度

目前已经实现的主要内容：

- Boot 启动加载层
  - 预加载入口背景图。
  - 预加载主场景 GLB 模型。
  - 显示启动进度、加载状态、失败重试提示。
- Live2D 入口页
  - 加载双 Live2D 模型舞台。
  - 支持鼠标焦点追随。
  - 支持点击角色触发表情 / 动作反馈。
  - 支持进入按钮与入场转场。
- 3D 主页面
  - 使用 Three.js / React Three Fiber 渲染主场景。
  - 通过滚轮切换不同内容节点。
  - 节点包括 About、Work、Source、Play。
  - 不同节点拥有独立主题色、镜头位置、模型角度和详情卡片。
- Play 工具箱
  - 已建立独立的 Play 页面。
  - 当前可用模块：`Blackout Run`。
  - 预留 `Signal`、`Forge` 等未来实验模块。
- Blackout Run 小游戏
  - 使用 HTML5 Canvas 2D 实现。
  - 鼠标 / 指针控制光点移动。
  - 随时间生成障碍物并提升难度。
  - 支持分数、最高分、开始和重新开始状态。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 前端框架 | React |
| 开发语言 | TypeScript |
| 构建工具 | Vite |
| 3D 渲染 | Three.js、React Three Fiber、Drei |
| Live2D | Live2D Cubism Core、自定义 Cubism SDK 封装 |
| 动效 | Framer Motion |
| 小游戏 | HTML5 Canvas 2D |
| 图标 | Lucide React |
| 样式 | CSS |

## 本地运行

请先确保本地已经安装 Node.js。

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建项目：

```bash
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

## 项目结构

```text
index.html                         页面入口，加载 Live2D Cubism Core
src/main.tsx                       React 根节点挂载
src/App.tsx                        顶层状态、入口流程、手写路由控制
src/components/BootOverlay.tsx     启动加载层与 GLB 模型预加载
src/components/Live2DEntry.tsx     Live2D 入口页与进入按钮
src/components/Live2DStage.tsx     Live2D WebGL 舞台与模型调度
src/live2d/CubismSdkModel.ts       自定义 Cubism 模型加载、更新、渲染逻辑
src/components/MainPage.tsx        3D 主页面、节点配置、滚轮切换
src/components/PlayPage.tsx        Play 工具箱介绍页
src/components/PlayGamePage.tsx    Blackout Run 全屏程序页
src/components/DodgeGame.tsx       Canvas 躲避小游戏
src/components/CursorParticles.tsx 入口粒子与萤火效果
src/style.css                      当前全局样式文件
```

## 页面与交互流程

当前页面流程大致如下：

```text
打开网站
  ↓
BootOverlay 启动加载层
  ↓
Live2D 入口页
  ↓
点击入口按钮
  ↓
3D 主页面
  ↓
滚轮 / 热点切换 About、Work、Source、Play
  ↓
进入 Play 工具箱
  ↓
启动 Blackout Run 小游戏
```

当前路由：

```text
/                 主页面入口
/play             Play 工具箱介绍页
/play/blackout    Blackout Run 全屏小游戏
```

项目目前使用轻量的 History API 手写路由控制，暂未接入 React Router。

## 当前模块说明

### Boot 启动层

启动层负责网站第一阶段的加载演出。它会提前加载入口背景和主场景模型，避免用户进入主页面后才看到明显等待。

### Live2D 入口

Live2D 是当前网站的核心视觉记忆点之一。入口页会展示角色舞台，角色可以根据鼠标位置改变视线方向，也可以通过点击触发表情或动作反馈。

### 3D 主页面

主页面是网站的核心展示区域。当前以四个节点组织内容：

- `About`：个人与网站介绍。
- `Work`：项目、作品、学习记录入口。
- `Source`：模型来源、灵感参考和设计演化记录。
- `Play`：互动工具箱和小游戏入口。

节点切换时，页面会同步改变文字、主题色、热点状态、3D 镜头位置和模型朝向。

### Play 工具箱

Play 是未来承载小游戏、视觉实验和前端工具的区域。目前已经接入第一个完整模块：`Blackout Run`。

### Blackout Run

`Blackout Run` 是一个黑白风格的 Canvas 躲避小游戏。玩家通过鼠标控制白色光点移动，躲避不断出现的扫描障碍物，存活越久分数越高。

## 开发状态

当前项目仍在开发中，已有功能更偏向“体验骨架”和“技术验证”。后续会继续补充真实内容、优化移动端、拆分样式并扩展 Play 模块。

## 后续计划

短期计划：

- 补充更完整的个人介绍与项目内容。
- 优化 README 和项目说明。
- 检查移动端 Live2D、3D 主页面和小游戏体验。
- 整理模型、图片和素材来源说明。
- 优化加载速度与资源体积。

中期计划：

- 将 `src/style.css` 拆分为更易维护的样式模块。
- 扩展 Play 工具箱，增加新的交互实验。
- 完善 Source 区域，记录模型、参考网站和设计迭代。
- 增加更明确的项目展示页或作品详情页。

长期计划：

- 将网站发展为个人作品集入口和前端实验室。
- 增加更多可交互模块。
- 根据页面数量决定是否引入 React Router。
- 完善部署说明和更新日志。

## Agent 说明

本仓库已经添加 `AGENTS.md`，用于约束 AI coding agent 修改代码时的行为。

核心原则包括：

- 保持 Sakura1Tap 的 Live2D + 3D + 互动实验站定位。
- 不要把项目改成普通模板个人主页。
- 修改前先阅读相关文件，不猜测结构。
- 尽量做小而安全的改动。
- 不提交密钥、构建产物、依赖目录或临时文件。
- 修改后说明变更范围和验证情况。

## 注意事项

- 当前项目包含较重的模型、Live2D 和图片资源，首次加载速度仍有继续优化空间。
- 当前内容文案仍有占位性质，后续会持续替换为真实内容。
- 当前样式主要集中在 `src/style.css`，后续可能拆分。
- 当前路由为手写 History API，页面继续增加后可能调整。

## License / 素材说明

项目代码与素材授权信息后续会进一步整理。

如果新增第三方模型、图片、字体、音频或其他素材，应在 README 或独立文档中补充来源与授权说明。
