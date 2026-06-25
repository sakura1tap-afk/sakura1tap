# Sakura1Tap 项目日志

> 本日志用于记录项目关键结构、功能、部署和维护变更。  
> 不是严格语义化版本日志，重点是帮助后续开发快速回忆“为什么这么改”。

---

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

- 修改后规则：

```text
/play /index.html 200
/play/* /index.html 200
```

- 修改原因：当前 SPA 只有 `/play` 和 `/play/blackout` 需要刷新 fallback，暂不使用全局兜底，避免 Cloudflare 判定 `/index.html` 继续匹配 `/*` 造成循环。

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

- 从 `MainPage.tsx` 中移除旧版内嵌 `PlayPage` 和 `DodgeGame` 导出。
- 将 `sections` 配置拆到独立数据文件。
- 将主页面 3D 子组件拆分到 `src/components/main/`。

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
- 若未来新增更多前端路由，同步更新 `public/_redirects`。

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
