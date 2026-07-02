# Sakura1Tap 工作流

> 目标：把随机灵感变成可维护的网站迭代，而不是让每次冲动都直接改代码。

本项目保留 vibecoding 的灵感密度，但执行方式改为文档驱动：先记录，再筛选，再设计，再开发，最后回写日志。

## 1. 四个工作角色

这四个角色不是四个人，也可以由同一个 AI 或同一个开发者在不同阶段切换。关键是每次工作只戴一顶帽子。

### 1.1 Keeper：维护者

负责项目稳定性和边界。

职责：

- 维护 `AGENTS.md`、依赖、构建、部署和素材来源说明。
- 检查入口流程是否仍然成立：Boot -> Live2D -> Main -> Play。
- 发现文档和代码不一致时，标记并安排修正。
- 阻止高风险改动混在普通功能里。

重点文件：

- `AGENTS.md`
- `package.json`
- `vite.config.ts`
- `public/_redirects`
- `docs/PROJECT_OVERVIEW.md`
- `docs/OPTIMIZATION_PLAN.md`

完成标准：

- 构建命令和部署状态清楚。
- 敏感文件的改动有明确理由。
- 没有把临时文件、密钥、构建产物或大压缩包加入仓库。

### 1.2 Designer：开发设计文档员

负责把想法变成能开发的设计说明。

职责：

- 接收 `docs/BACKLOG.md` 里的想法。
- 写清楚用户体验、交互状态、页面位置和验收标准。
- 区分“已实现”“计划中”“只是灵感”。
- 避免把网站设计成普通模板个人主页。

重点文件：

- `docs/BACKLOG.md`
- `docs/PROJECT_OVERVIEW.md`
- `README.md`
- 未来可新增 `docs/specs/*.md`

完成标准：

- 开发前能回答：改哪里、为什么改、怎么验收。
- 文档描述的是项目事实或明确计划，不混在一起。

### 1.3 Builder：开发执行者

负责按已确认的设计做小步代码修改。

职责：

- 先读相关文件，再改最小范围。
- 优先处理一个独立任务，不顺手改无关问题。
- 保护 Live2D、Boot、3D Main、Play 路由等核心流程。
- 修改后运行或说明 `npm run build`。

重点文件按任务变化：

- 入口相关：`src/App.tsx`、`src/components/BootOverlay.tsx`、`src/components/Live2DEntry.tsx`、`src/components/Live2DStage.tsx`
- 主页面相关：`src/components/MainPage.tsx`
- Play 相关：`src/components/PlayPage.tsx`、`src/components/PlayGamePage.tsx`、`src/components/DodgeGame.tsx`
- 样式相关：`src/style.css`

完成标准：

- 请求的行为已实现。
- 改动范围小，构建影响清楚。
- 没有破坏现有入口、路由和核心交互。

### 1.4 Archivist：日志记录员

负责记录项目事实和决策。

职责：

- 每次阶段性改动后更新 `docs/CHANGELOG.md`。
- 记录“为什么这么改”，不只记录“改了什么”。
- 发现过期文档时列入待办或直接修正。
- 保留失败尝试的原因，避免未来重复踩坑。

重点文件：

- `docs/CHANGELOG.md`
- `docs/BACKLOG.md`
- `docs/PROJECT_OVERVIEW.md`

完成标准：

- 未来接手者能通过日志理解项目演化。
- 文档里的当前状态和代码实际状态尽量一致。

## 2. 工作入口

以后新想法先进入 `docs/BACKLOG.md`，不要直接进入代码。

状态定义：

- `idea`：只是想法，还没有判断价值。
- `candidate`：值得做，但还需要设计。
- `planned`：已经明确范围，可以排期开发。
- `doing`：正在开发。
- `done`：已完成并记录。
- `blocked`：被素材、设计、技术或部署问题卡住。

优先级定义：

- `P0`：稳定性和线上可用性。
- `P1`：当前体验的明显短板。
- `P2`：内容完善和可维护性。
- `P3`：未来扩展和实验玩法。

## 3. 标准迭代流程

每个非小修任务按这个顺序走：

1. **Capture**
   - 把想法写入 `docs/BACKLOG.md`。
   - 写清楚它属于 Boot、Live2D Entry、Main Scene、Play、Game、Styling、Build、Docs 中哪一层。

2. **Shape**
   - Designer 把想法整理成开发说明。
   - 至少包含目标、用户体验、涉及文件、验收标准和风险。

3. **Build**
   - Builder 只做这一个任务。
   - 优先小改动，避免顺手重构。

4. **Verify**
   - 代码任务默认运行 `npm run build`。
   - 涉及入口、路由、Live2D、Three.js、Canvas 时，还应本地打开页面验证。

5. **Record**
   - Archivist 更新 `docs/CHANGELOG.md`。
   - 如果项目结构变化，更新 `docs/PROJECT_OVERVIEW.md` 或 README。

## 4. 任务卡模板

复制到 `docs/BACKLOG.md` 使用：

```md
### 标题

- Status: idea
- Priority: P2
- Layer: Docs
- Owner role: Designer
- Goal:
- Scope:
- Acceptance:
- Risks:
- Notes:
```

## 5. 当前推荐顺序

基于 2026-06-30 的项目扫描，建议优先顺序如下：

1. 修正文档与实际 `_redirects` 状态不一致的问题。
2. 清理 `MainPage.tsx` 内旧版 `PlayPage` 和 `DodgeGame` 残留。
3. 抽离 `MainPage.tsx` 的 section 配置。
4. 建立 `docs/specs/`，以后大功能先写规格说明。
5. 逐步整理 `src/style.css`，但不要把样式拆分作为第一优先级。

## 6. 不做什么

- 不因为一时灵感直接改核心入口流程。
- 不把多个大方向混成一次提交。
- 不为了“看起来专业”引入重型 UI 框架。
- 不把计划中的功能写成已经实现。
- 不在没有验证的情况下改 Vite chunk 或部署规则。
