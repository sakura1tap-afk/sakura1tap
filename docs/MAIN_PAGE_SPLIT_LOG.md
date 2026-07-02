# Main Page Split Log

> 本文档专门记录主页面拆分项目的进度。  
> `CHANGELOG.md` 记录全项目变化；本文记录这一轮结构拆分的上下文、步骤、验证和后续判断。

## 1. 项目背景

主页面原本把多类职责集中在 `src/components/MainPage.tsx` 中：

- 主页面状态：当前节点、详情打开状态、滚轮方向、光标位置。
- 节点内容：About、Work、Source、Play 的文案、详情、镜头、热点、图标。
- 3D 场景：R3F Canvas、镜头缓动、GLB 解析、模型姿态、能量环和粒子。
- DOM 层：节点按钮、主面板、详情弹层、技术条、滚轮进度。
- 历史残留：旧版 `PlayPage` 和 `DodgeGame` 代码曾经仍留在主页面文件中。

这种结构在早期 vibecoding 阶段很快，但后续会带来三个问题：

- 内容维护会误碰渲染逻辑。
- 3D 性能优化会和 DOM 状态混在一起。
- 后续多 agent 或多人协作时，很容易争抢同一个大文件。

## 2. 拆分原则

本轮拆分只做结构分层，不主动改变视觉和行为。

原则：

- 先拆职责边界清楚的模块。
- 每次移动一个层级，构建通过后再继续。
- 文案、3D、DOM、路由不要混在一次改动里。
- 保持 Boot -> Live2D -> Main -> Play 主流程不变。
- 每次拆分后同步 `BACKLOG.md`、`CHANGELOG.md`、`PROJECT_OVERVIEW.md` 和文件地图。

## 3. 已完成步骤

### Step 1：清理旧版 Play 残留

状态：done  
日期：2026-06-30  
涉及文件：

- `src/components/MainPage.tsx`
- `src/components/PlayPage.tsx`
- `src/components/PlayGamePage.tsx`
- `src/components/DodgeGame.tsx`

完成内容：

- 从 `MainPage.tsx` 移除旧版内嵌 `DodgeGame`。
- 从 `MainPage.tsx` 移除旧版内嵌 `PlayPage`。
- 保留独立 Play 路由文件作为唯一来源。

原因：

- Play 已经独立成 `/play` 和 `/play/blackout`。
- 旧代码不可达，会误导后续维护者。

验证：

- `npm run build` 通过。

### Step 2：抽离主页面 section 配置

状态：done  
日期：2026-07-01  
涉及文件：

- `src/data/mainSections.ts`
- `src/components/MainPage.tsx`

完成内容：

- 新增 `src/data/mainSections.ts`。
- 将 `SectionKey`、节点配置、详情卡片、图标映射、镜头、热点和 `sectionOrder` 从 `MainPage.tsx` 抽出。
- `MainPage.tsx` 通过 `mainSections` 读取节点数据。

原因：

- 后续改 About / Work / Source / Play 内容时，不应该进入渲染组件。
- 内容配置可以独立演化，未来更容易接真实项目数据或文案编辑。

验证：

- `npm run build` 通过。

### Step 3：拆分主页面 3D 场景层

状态：done  
日期：2026-07-01  
涉及文件：

- `src/components/main/MainScene.tsx`
- `src/components/MainPage.tsx`

完成内容：

- 新增 `src/components/main/MainScene.tsx`。
- 移动 `SceneRig`、`MainStudyModel`、`EnergyField` 和 `MainScene`。
- `MainPage.tsx` 不再直接依赖 R3F、Three.js 或 GLTFLoader。

原因：

- 3D 场景的风险和维护方式与 DOM 页面不同。
- 后续优化模型、镜头、粒子或性能时，可以只进入场景层。

验证：

- `npm run build` 通过。

### Step 4：拆分节点详情层

状态：done  
日期：2026-07-01  
涉及文件：

- `src/components/main/DetailLayer.tsx`
- `src/components/MainPage.tsx`

完成内容：

- 新增 `src/components/main/DetailLayer.tsx`。
- 移动节点详情标题、关闭按钮和详情卡片渲染。
- `AnimatePresence` 仍留在 `MainPage.tsx`，保持挂载边界不变。

原因：

- 详情层是独立 DOM 子界面，适合单独维护。
- 后续优化移动端详情阅读体验时，可以只改详情组件和 CSS。

验证：

- `npm run build` 通过。

### Step 5：拆分主页面主面板

状态：done  
日期：2026-07-01  
涉及文件：

- `src/components/main/MainPanel.tsx`
- `src/components/MainPage.tsx`

完成内容：

- 新增 `src/components/main/MainPanel.tsx`。
- 移动 `.main-panel`、面板文案切换动画和主操作按钮。
- 父层 `MainPage.tsx` 继续决定按钮行为：Play 节点进入 Play，其他节点打开详情。

原因：

- 主面板是独立 DOM 子界面，适合单独维护。
- 不把路由决策下沉到展示组件，可以保持 `MainPanel` 简单。

验证：

- `npm run build` 通过。

### Step 6：拆分主页面节点导航

状态：done  
日期：2026-07-01  
涉及文件：

- `src/components/main/MainNodeMap.tsx`
- `src/components/MainPage.tsx`

完成内容：

- 新增 `src/components/main/MainNodeMap.tsx`。
- 移动 `.main-node-map`、节点按钮、节点图标和激活态渲染。
- 节点顺序继续来自 `sectionOrder`。

原因：

- 节点导航是独立 DOM 子界面，适合单独维护。
- 后续优化节点按钮布局或键盘导航时，可以只进入该组件。

验证：

- `npm run build` 通过。

### Step 7：拆分主页面场景热点

状态：done  
日期：2026-07-01  
涉及文件：

- `src/components/main/SceneHotspots.tsx`
- `src/components/MainPage.tsx`

完成内容：

- 新增 `src/components/main/SceneHotspots.tsx`。
- 移动 `.scene-hotspots`、热点按钮和热点位置 CSS 变量。
- 热点位置继续来自 `mainSections` 的 `hotspot` 配置。

原因：

- 场景热点是独立导航入口，和节点按钮导航可以分开维护。
- 后续调整热点布局或可访问性时，可以只进入该组件。

验证：

- `npm run build` 通过。

### Step 8：拆分主页面技术条

状态：done  
日期：2026-07-01  
涉及文件：

- `src/components/main/TechStrip.tsx`
- `src/components/MainPage.tsx`

完成内容：

- 新增 `src/components/main/TechStrip.tsx`。
- 移动 `.tech-strip`、图标和静态标签。

原因：

- 技术条是独立静态展示组件，适合从页面编排文件中移出。
- 拆出后 `MainPage.tsx` 更接近纯页面编排器。

验证：

- `npm run build` 通过。

## 4. 当前结构

当前主页面相关结构：

```text
src/
├─ data/
│  └─ mainSections.ts
└─ components/
   ├─ MainPage.tsx
   └─ main/
      ├─ MainScene.tsx
      ├─ DetailLayer.tsx
      ├─ MainPanel.tsx
      ├─ MainNodeMap.tsx
      ├─ SceneHotspots.tsx
      └─ TechStrip.tsx
```

当前职责：

- `mainSections.ts`：主页面内容和配置数据。
- `MainPage.tsx`：主页面状态、滚轮切换、节点按钮和整体编排。
- `MainScene.tsx`：R3F/Three 场景、镜头、模型、能量场。
- `DetailLayer.tsx`：节点详情弹层。
- `MainPanel.tsx`：主面板标题、正文、切换动画和主操作按钮。
- `MainNodeMap.tsx`：主页面节点导航按钮。
- `SceneHotspots.tsx`：主页面场景热点按钮。
- `TechStrip.tsx`：底部技术条。

## 5. 当前结果

结构结果：

- `MainPage.tsx` 已从大文件变成页面编排器。
- 内容配置、3D 场景、详情层已经有独立维护入口。
- 后续 agent 可以按文件职责分工，减少互相覆盖。

文件规模记录：

```text
MainPage.tsx             190 lines
MainScene.tsx            205 lines
DetailLayer.tsx           42 lines
MainPanel.tsx             31 lines
MainNodeMap.tsx           29 lines
SceneHotspots.tsx         28 lines
TechStrip.tsx             13 lines
mainSections.ts           96 lines
style.css               4056 lines
```

构建结果：

- `npm run build` 通过。
- Vite 仍提示 `MainPage` chunk 超过 500 kB。

说明：

- 这个警告没有被结构拆分解决，因为 `MainPage` 仍静态 import `MainScene`。
- 如果要解决 bundle 体积，需要后续考虑 `MainScene` 二级 lazy 或做 bundle analysis。
- 不建议现在直接上 `manualChunks`，因为项目曾因构建/部署优化导致白屏风险。

## 6. 未完成事项

这些事项不应混在当前拆分里继续做，应该单独排任务：

1. 设计主页面真实内容。
2. 评估 `MainScene` 二级 lazy 是否值得做。
3. 拆分 `src/style.css`。

## 7. 当前建议

下一步先不要急着拆 CSS。更好的顺序是：

1. 先完成主页面模块边界设计文档。
2. 然后进入需求设计。
3. 最后再考虑样式模块化和 bundle 优化。

原因：

- CSS 现在虽然大，但视觉耦合强，盲拆容易产生移动端和入口页回归。
- `MainPage.tsx` 的结构已经明显改善，继续拆 DOM 子组件更安全。
- Bundle 优化需要测量，不能靠感觉改 Vite 配置。

## 8. 后续执行规则

后续继续主页面拆分时，按 `docs/MAIN_PAGE_SPLIT_DESIGN.md` 的执行流程工作：

1. 选择一个拆分目标。
2. 确认文件边界和不改范围。
3. 执行最小代码移动。
4. 运行 `npm run build`。
5. 同步更新日志、backlog 和项目地图。
6. 停下来判断下一步，不自动连续拆。

当前推荐的下一刀：

- 设计主页面真实内容

## 9. 历史入口组件审计

状态：done  
日期：2026-07-01  
详情文档：`docs/HISTORICAL_COMPONENT_AUDIT.md`

已删除未引用旧组件：

- `src/components/EntryScene.tsx`
- `src/components/EntryControls.tsx`
- `src/components/EnterOverlay.tsx`
- `src/components/Live2DCharacter.tsx`
- `src/components/StudyModel.tsx`

结论：

- 当前活入口由 `BootOverlay`、`Live2DEntry`、`Live2DStage`、`CursorParticles` 和 `CubismSdkModel` 承载。
- 旧入口实验已经不再参与 Boot -> Live2D -> Main -> Play 流程。

## 10. 功能规格目录

状态：done  
日期：2026-07-01

新增文件：

- `docs/specs/README.md`
- `docs/specs/SPEC_TEMPLATE.md`

结论：

- 后续新功能、内容改版、Play 模块和交互优化应先写 spec，再进入代码实现。
- 主页面拆分板块到此完成结构整理，下一步应进入需求设计或独立专项。

暂缓：

- CSS 模块化。
- Vite `manualChunks`。
- React Router。
- 新增 UI 框架。
