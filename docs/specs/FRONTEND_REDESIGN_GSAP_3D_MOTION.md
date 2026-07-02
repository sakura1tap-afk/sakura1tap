# Sakura1Tap Frontend Redesign: GSAP / 3D / Motion Spec

> 本文档用于规划 Sakura1Tap 下一轮前端重设计。  
> 目标不是把网站改成普通作品集，而是在保留 Live2D、3D 主场景和极简幻想气质的基础上，建立更专业、更可维护、更有记忆点的动效系统。

## 1. Summary

- Title: GSAP / 3D / 立体滑动重设计
- Status: draft
- Owner role: Designer
- Layer: Main Scene / Entry / Styling / Performance
- Created: 2026-07-01
- Preferred direction: 方案 A + 方案 B 的混合路线：Ripple Atlas + Camera-Bound Nodes
- System design: `docs/specs/BLACK_SAKURA_GENOME_FRONTEND_DESIGN.md`
- Asset library: `docs/ASSET_LIBRARY.md`

## 2. Integrated Design Lock

本轮重设计锁定为一个完整方案，而不是四个互相独立的动效 demo。

方案名称：**Ripple Atlas + Camera-Bound Nodes**

一句话定义：

> Sakura1Tap 是一个在黑白纸面和透明水膜之间展开的 3D 个人空间；用户通过滚轮、热点和节点按钮切换观察点，每次切换都由水波、光场、镜头和资料层共同完成。

统一体验主线：

1. **入口身份不变**：Boot 和 Live2D Entry 继续作为网站第一层身份，不把它替换成普通 hero。
2. **主页面成为核心舞台**：About、Work、Source、Play 仍是一屏内的四个空间节点。
3. **水波负责“触感”**：鼠标、滚轮、节点切换和详情打开都在同一套 Ripple Layer 上产生反馈。
4. **镜头负责“空间”**：R3F 场景通过 section 参数移动观察点，DOM 层通过 GSAP timeline 与镜头节奏对齐。
5. **资料层负责“内容”**：MainPanel 和 DetailLayer 不再只是文字容器，而是像从水面下浮起的资料页。
6. **性能负责“可信度”**：所有视觉增强都要能关闭、降级、清理和构建验证。

本轮不做的事：

- 不把整站改成 ScrollTrigger 长页面。
- 不重写 Live2D Cubism 内部逻辑。
- 不引入重型 UI 框架。
- 不为了动效牺牲文字可读性、移动端稳定性或加载路径。

## 3. Current Baseline

当前网站已经具备这些核心资产：

- Boot 层负责预加载入口背景和 GLB 模型。
- Live2D Entry 是网站身份的一部分，不能被普通 landing page 替代。
- Main Scene 已拆成页面编排、数据配置、3D 场景、节点导航、热点、详情层和技术条。
- 主页面使用 React Three Fiber 渲染 3D 场景，并通过 section 配置驱动镜头、模型旋转、热点和文案。
- Framer Motion 已用于页面淡入、面板切换和详情层挂载动画。

现有主要问题：

- 视觉层级还不够“立体”，DOM 层和 3D 层之间的联动偏弱。
- 滑动/滚轮切换目前是状态切换，缺少可感知的空间过渡。
- 水波、折射、液体感、滑动惯性等动效还没有统一实现策略。
- `MainScene` 静态导入导致主页面 chunk 偏大，后续要考虑懒加载和资源分层。
- 动效如果直接堆，会增加低端设备和移动端卡顿风险。

## 4. GSAP Usage Decision

GSAP 适合引入，但要有明确边界。

适合使用 GSAP 的地方：

- 主页面节点切换的多层时间线。
- DOM UI、光场、遮罩、水波覆盖层、按钮和详情层的协调动画。
- 滚动或滑动驱动的进度动画。
- 指针跟随、视差、惯性反馈等高频交互，使用 `gsap.quickTo()` 复用 tween。
- 使用 `gsap.matchMedia()` 管理桌面、移动端和 reduced-motion。

不应该用 GSAP 替代的地方：

- R3F 每帧模型缓动和摄像机 lerp 逻辑仍由 Three/R3F 控制。
- Live2D 模型内部状态仍由当前 Live2D Stage 负责。
- 简单 CSS hover 不需要全部改成 GSAP。
- 不用 GSAP 强行接管 React 状态。

依赖策略：

- 计划新增 `gsap` 和 `@gsap/react`。
- 插件从公开 `gsap` npm 包导入，不使用 CDN、不使用私有 registry、不写 GreenSock token。
- 初期只注册 `useGSAP`，需要滚动叙事时再注册 `ScrollTrigger`。
- 其他插件如 `Observer`、`Flip`、`SplitText`、`CustomEase` 按阶段懒引入或按需注册。

## 5. Direction Library

以下四个方向不是四个并行项目。A 和 B 已合并成本轮主方案；C 和 D 作为后续专项保留，避免当前阶段范围膨胀。

### 方案 A：Ripple Atlas

核心感觉：黑白纸面上浮起一层透明水膜，鼠标、滚轮和节点切换都会在界面上留下轻微波纹。

适合内容：

- 主页面四个节点继续保持。
- 节点切换时有水波扩散、光场偏移和面板层级滑动。
- 鼠标移动触发低成本水面扰动。
- 详情层打开时像在水面下展开一张资料页。

技术落点：

- 新增 `RippleLayer`，优先用 Canvas 2D 或 CSS mask 做轻量版本。
- 指针坐标通过 `gsap.quickTo()` 写入 CSS 变量或 Canvas uniform-like 状态。
- 水波不是每次创建大量 DOM 节点，而是复用一层绘制面。
- 低端设备和 reduced-motion 下只保留淡入与轻微光场移动。

优点：

- 视觉记忆点强。
- 不需要重做整个页面结构。
- 性能可控，适合先做 MVP。

风险：

- 如果水波过度，会遮挡文字或让页面变油腻。
- Canvas 后处理需要严格控制分辨率和绘制频率。

### 方案 B：Camera-Bound Nodes

核心感觉：用户不是在点菜单，而是在一个 3D 空间里切换观察点；每个节点有自己的镜头姿态、景深和 UI 入场节奏。

适合内容：

- About / Work / Source / Play 仍作为四个节点。
- 滚轮或滑动切换时，DOM 层和 R3F 镜头层同步过渡。
- 节点切换不只是文字换掉，而是镜头、光、粒子环、热点和面板一起完成一段短时间线。

技术落点：

- 保留 `mainSections.ts` 作为节点数据中心。
- 新增 motion 控制层，把 active section 转成 CSS 变量、timeline label 和 3D scene signal。
- R3F 摄像机仍用 `useFrame` damp，但 DOM 层由 GSAP timeline 编排。
- 使用 `gsap.timeline()` 和 label 描述 `leave -> transit -> enter`。

优点：

- 最贴合当前 3D 主场景身份。
- 不需要从零重做内容结构。
- 可以逐步增强，每个阶段都能构建验证。

风险：

- DOM 动效和 R3F 动效如果节奏不一致，会显得割裂。
- 需要建立统一 motion tokens，否则以后很难维护。

### 方案 C：Scroll Observatory

核心感觉：整站变成一个滚动观测路线，用户往下滚动时被带过不同展台或章节。

适合内容：

- 更像完整作品集叙事。
- 每个 section 有完整段落、项目卡、来源说明、Play 入口。
- 使用 ScrollTrigger 做 pin、scrub、横向伪滚动或章节推进。

技术落点：

- 使用 `ScrollTrigger` 驱动 top-level timeline。
- pinned section 里只动画子元素，不动画 pinned 容器本身。
- 如果做横向滑动，container animation 必须 `ease: "none"`。
- 所有 ScrollTrigger 必须在 React cleanup 中自动 revert。

优点：

- 展示信息量更强。
- 适合后续补真实项目和学习档案。

风险：

- 对当前站点是较大结构改造。
- 移动端和低端设备风险最高。
- ScrollTrigger 数量一多会增加维护难度。

### 方案 D：Live2D Theatre

核心感觉：Live2D 入口不只是门面，而是整个网站的舞台导演；从入口到主场景有更戏剧化的转场。

适合内容：

- 强化看板娘反馈、入场按钮、进入主场景的一瞬间。
- 点击、注视、加载完成、进入网站都由时间线串联。
- 主页面可以继承入口光效和粒子方向。

技术落点：

- Live2D 内部仍由 `Live2DStage` 控制。
- GSAP 只负责入口 DOM、遮罩、背景、粒子层和进入主页面前后的过渡。
- 不在本阶段重写 Live2D 模型加载或 Cubism SDK。

优点：

- 保留并强化网站最独特的身份。
- 适合做第一印象优化。

风险：

- 和主页面 3D 重设计同时做会范围过大。
- Live2D 加载失败路径必须继续可用，不能为了演出感阻塞进入。

## 6. Direction Comparison

| 方案 | 视觉冲击 | 性能风险 | 实现复杂度 | 适合优先级 |
| --- | --- | --- | --- | --- |
| A Ripple Atlas | 高 | 中 | 中 | P1 |
| B Camera-Bound Nodes | 高 | 中 | 中 | P1 |
| C Scroll Observatory | 很高 | 高 | 高 | P2 |
| D Live2D Theatre | 高 | 中 | 中高 | P2 |

推荐先做 A + B：

- 保留当前主页面结构，不做大拆迁。
- 先把主页面做得更立体、更顺滑。
- 水波、滑动、镜头和 DOM 层联动可以分阶段落地。
- 等内容更真实后，再考虑 C 的滚动叙事。
- D 放到入口专项，避免主页面重设计和 Live2D 重设计互相拖住。

## 7. Target Experience

用户进入主页面后：

1. 主页面从入口转场后不是简单淡入，而是光场、水膜和 3D 场景逐层稳定。
2. 鼠标移动时，背景光和水波层有轻微响应，文字不抖、不糊、不被遮挡。
3. 滚轮切换节点时，当前节点先收束，水波或遮罩扫过，3D 镜头滑到新观察点，新节点面板再进入。
4. 打开详情层时，主场景略向后退，详情像浮层资料卡展开。
5. 移动端不强行复刻桌面复杂动效，只保留轻量过渡、清晰点击和稳定布局。
6. reduced-motion 用户看到的是低动效版本，不出现大幅视差和持续波动。

## 8. Experience Timeline

主页面一次完整节点切换应被设计成同一条时间线，而不是几个组件各自动：

```text
idle
  ↓ pointer / wheel / click
intent
  ↓ lock input briefly
leave current node
  ↓ panel compresses, hotspots dim, ripple starts
transit
  ↓ camera target changes, light field drifts, water sweep crosses
enter next node
  ↓ panel resolves, node map updates, hotspot reappears
idle
```

详情层打开时间线：

```text
node idle
  ↓ OPEN NODE
scene depth push
  ↓ background slows and dims
detail surface rise
  ↓ cards stagger in
reading mode
  ↓ close
detail surface sink
  ↓ scene returns
node idle
```

这些时间线对应的实现原则：

- React state 只表达当前节点和详情是否打开。
- GSAP timeline 只负责 DOM 层进入、退出、遮罩和水波。
- R3F scene 只读取 active/nodeOpen 后继续用 `useFrame` 做平滑相机和模型过渡。
- `mainSections.ts` 继续作为节点配置来源，后续可扩展每个节点的 motion profile。

## 9. Proposed Architecture

新增或调整的模块边界：

```text
src/
├─ motion/
│  ├─ gsap.ts                 # GSAP 注册、公共导出、插件边界
│  ├─ motionTokens.ts         # duration、ease、breakpoints、reduced-motion 策略
│  └─ mainMotion.ts           # 主页面 timeline 构建函数，纯逻辑优先
├─ components/
│  └─ main/
│     ├─ MainMotionLayer.tsx  # 主页面 DOM 动效容器
│     ├─ RippleLayer.tsx      # 水波/折射覆盖层
│     └─ MainScene.tsx        # 保留 R3F 场景，可逐步暴露 motion signal
└─ data/
   └─ mainSections.ts         # 继续作为节点内容和 3D 参数来源
```

原则：

- `MainPage.tsx` 继续负责状态和编排，不重新变成大杂烩。
- `MainScene.tsx` 不直接引入 GSAP，避免 DOM 动效和 R3F 场景耦合。
- `MainMotionLayer.tsx` 负责 DOM 层时间线、CSS 变量和水波层协调。
- `RippleLayer.tsx` 可独立降级或关闭。
- motion tokens 统一管理时间、缓动和媒体查询，不在组件里散写 magic number。

## 10. Implementation Plan

### Phase 0：基线确认

- 记录当前 `npm run build` 状态。
- 确认主页面首屏、入口流、Play 路由和 WebGL fallback 仍可用。
- 记录当前大 chunk 警告，不在动效阶段盲目使用 `manualChunks`。

### Phase 1：安装与动效基础设施

- Status: done on 2026-07-01.
- Installed `gsap` and `@gsap/react`.
- Added `src/motion/gsap.ts` to register and export GSAP / `useGSAP`.
- Added `src/motion/motionTokens.ts` for shared duration, easing, media query, and reduced-motion helpers.
- Updated README and project overview so GSAP is documented as part of the motion system.

验收：

- `npm run build` passed on 2026-07-01.
- No current visual behavior should change.
- No CDN, token, or private registry was added.
- Known warning remains: `MainPage` chunk is still larger than 500 kB because the R3F/Three main scene is heavy. This is deferred to the performance phase instead of being mixed into Phase 1.

### Phase 2：主页面 Motion Shell

- 新增 `MainMotionLayer.tsx`。
- 使用 `useGSAP({ scope })` 管理主页面 DOM 动效。
- 把节点切换拆成 `leave`、`transit`、`enter` 三段 timeline。
- 用 `gsap.matchMedia()` 处理桌面、移动端和 reduced-motion。

验收：

- 节点切换更顺滑，但功能不变。
- 动画 cleanup 正常，离开页面不残留 tween。
- reduced-motion 下大幅位移和持续动效关闭。

### Phase 3：Ripple MVP

- 新增 `RippleLayer.tsx`。
- 先做轻量水波：一层 Canvas 或 CSS mask，不做复杂 shader。
- 指针跟随使用 `gsap.quickTo()`。
- 节点切换时触发一次中心波纹或方向波纹。

验收：

- 水波不遮挡主要文字。
- 低端模式可关闭。
- 移动端触摸不会造成过多重绘。

### Phase 4：3D 深度协调

- 让 DOM motion layer 与现有 section active 状态同步。
- 调整 `MainScene` 的 camera、fog、light、particle scale，使节点切换更有空间感。
- 不把 GSAP 直接塞进 `useFrame`。

验收：

- 切换节点时 3D 和 DOM 节奏一致。
- 模型加载失败状态仍显示。
- GLB buffer 复用不受影响。

### Phase 5：滚动/滑动增强

- 先评估是否需要 `Observer` 统一 wheel / touch / pointer。
- 如果做滚动叙事，再引入 `ScrollTrigger`。
- ScrollTrigger 只放 top-level timeline，不放在 nested tween。
- 开发 markers 不进入生产。

验收：

- 桌面滚轮、触控板和移动端滑动行为可控。
- 不出现误触、页面卡死或滚动劫持感。

### Phase 6：性能与验收

- 构建通过。
- 桌面和移动端手动检查。
- 检查 chunk 体积，优先考虑 `MainScene` 懒加载或路由级拆分。
- 检查动画是否只使用 transform、opacity、CSS variables 等低成本属性。
- 检查清理逻辑，确认无残留 ScrollTrigger 或 tween。

## 11. Phase Dependency Map

```text
Phase 0 baseline
  ↓
Phase 1 GSAP foundation
  ↓
Phase 2 motion shell
  ↓
Phase 3 ripple MVP
  ↓
Phase 4 3D depth coordination
  ↓
Phase 5 optional scroll / gesture enhancement
  ↓
Phase 6 performance verification
```

不可跳过的依赖：

- Phase 2 依赖 Phase 1，否则没有统一 cleanup、tokens 和 scope。
- Phase 3 依赖 Phase 2，否则水波会变成孤立装饰。
- Phase 4 依赖 Phase 2 和现有 `mainSections.ts`，否则 3D 深度无法和 DOM 时间线对齐。
- Phase 5 只有在 Phase 2-4 稳定后才考虑，避免先引入 ScrollTrigger 造成系统过重。

## 12. Performance Rules

- 优先动画属性：`x`、`y`、`scale`、`rotation`、`autoAlpha`、CSS variables。
- 避免动画属性：`width`、`height`、`top`、`left`、`margin`、`padding`。
- 高频指针动画使用 `gsap.quickTo()`，不要在 pointermove 中不断创建新 tween。
- `will-change` 只加在真实会动的元素上，不全局滥用。
- timeline 用 label 管理，不用一堆 delay 拼接。
- React 中必须使用 `useGSAP()` 或 `gsap.context()` cleanup。
- selector 必须通过 scope 限定，避免影响其他组件。
- reduced-motion 必须是第一等约束。
- 粒子、波纹、遮罩数量要有上限。
- ScrollTrigger 数量要少，并按页面顺序创建。

## 13. Visual Rules

- 保留黑白、暖纸、柔和幻想、极简互动的身份。
- 不做模板化作品集 hero。
- 不用大面积紫蓝渐变、单色霓虹或廉价科技风。
- 水波和立体感服务内容，不压过 Live2D 和 3D 主模型。
- 主页面首屏必须仍然明确看到 Sakura1Tap、四个节点和 3D 场景。
- 移动端不能用密集动效弥补布局问题。

## 14. Files and Boundaries

Expected files in later implementation:

- `package.json`
- `package-lock.json`
- `src/motion/gsap.ts`
- `src/motion/motionTokens.ts`
- `src/motion/mainMotion.ts`
- `src/components/MainPage.tsx`
- `src/components/main/MainMotionLayer.tsx`
- `src/components/main/RippleLayer.tsx`
- `src/components/main/MainScene.tsx`
- `src/style.css`
- `README.md`
- `docs/CHANGELOG.md`
- `docs/BACKLOG.md`

Do not touch without separate decision:

- `src/live2d/CubismSdkModel.ts`
- Live2D model assets
- GLB model file
- Cloudflare redirect behavior
- Play game internals

## 15. Acceptance Criteria

- `npm run build` passes.
- Boot -> Live2D Entry -> Main Page flow remains intact.
- `/play` and `/play/blackout` remain functional.
- WebGL/model error states remain visible.
- Main page has visible depth improvement and smoother node transitions.
- Ripple effect exists but does not harm readability.
- Desktop, narrow mobile, and reduced-motion states are intentionally handled.
- No secrets, external scripts, CDN dependencies, or private registry config are added.
- Documentation and changelog are updated after each phase.

## 16. Open Questions

- 水波应偏“真实水膜”还是偏“纸面墨迹/樱花光晕”？
- 主页面是否继续保持四节点一屏，还是未来进入滚动叙事？
- Work 节点是否要先补真实项目内容，再做更复杂的滚动效果？
- Live2D 入口是否作为单独专项重设计？

## 17. Design Start Checklist

开始实现前，Builder 应按以下顺序工作：

1. 只做 Phase 1，不改变视觉。
2. 构建通过后，再做 Phase 2 的 Motion Shell。
3. Motion Shell 稳定后，再添加 Ripple Layer。
4. 每个阶段更新 changelog/backlog，不把设计记录留到最后。
5. 如果某阶段需要触碰 Live2D、GLB、Cloudflare 或 Play 内部，先回到文档追加决策。

## 18. Recommendation

下一步建议不要直接做 ScrollTrigger 长页面，而是先做：

1. Phase 1：GSAP 基础设施。
2. Phase 2：主页面节点切换 timeline。
3. Phase 3：Ripple MVP。

这条路线能最快改善“前端设计像拼起来的 demo”的感觉，同时不把系统复杂度推爆。
