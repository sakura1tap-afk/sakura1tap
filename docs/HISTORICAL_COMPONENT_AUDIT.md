# Historical Component Audit

> 本文档记录历史组件审计结论。  
> 目标是避免旧实验文件长期留在活代码目录中，干扰后续维护。

## 1. 审计时间

2026-07-01

## 2. 审计范围

本次审计以下旧入口相关组件：

- `src/components/EntryScene.tsx`
- `src/components/EntryControls.tsx`
- `src/components/EnterOverlay.tsx`
- `src/components/Live2DCharacter.tsx`
- `src/components/StudyModel.tsx`

## 3. 审计方法

使用引用搜索确认是否仍被活流程引用：

```bash
rg -n "EntryScene|EntryControls|EnterOverlay|Live2DCharacter|StudyModel" src docs README.md AGENTS.md
```

判断标准：

- 如果文件被 `App.tsx`、`Live2DEntry.tsx`、`MainPage.tsx` 或 Play 路由引用，则视为活代码。
- 如果文件只在旧组件之间互相引用，且没有活入口引用，则视为历史实验。
- 如果删除后 `npm run build` 通过，则确认没有 TypeScript 或构建层面的隐藏依赖。

## 4. 结论

### `EntryScene.tsx`

状态：removed

结论：

- 未被当前活入口引用。
- 只和旧的 `EntryControls` / `StudyModel` 方案相关。
- 当前入口已经由 `BootOverlay`、`Live2DEntry`、`Live2DStage` 和 `CursorParticles` 承载。

### `EntryControls.tsx`

状态：removed

结论：

- 未被当前活入口引用。
- 主要服务旧的 3D study model entry 控制台。
- 当前入口不再使用该控制模式。

### `EnterOverlay.tsx`

状态：removed

结论：

- 未被当前活入口引用。
- 当前进入按钮和入口转场由 `Live2DEntry.tsx` 负责。

### `Live2DCharacter.tsx`

状态：removed

结论：

- 未被当前活入口引用。
- 使用 `pixi-live2d-display` 路线。
- 当前 Live2D 活流程使用 `Live2DStage.tsx` 和 `CubismSdkModel.ts` 的自封装 Cubism SDK 路线。

### `StudyModel.tsx`

状态：removed

结论：

- 未被当前活入口引用。
- 只被旧 `EntryScene.tsx` 引用。
- 当前主页面模型渲染由 `src/components/main/MainScene.tsx` 内的 `MainStudyModel` 负责。

## 5. 删除文件

已删除：

```text
src/components/EntryScene.tsx
src/components/EntryControls.tsx
src/components/EnterOverlay.tsx
src/components/Live2DCharacter.tsx
src/components/StudyModel.tsx
```

## 6. 保留的活入口文件

当前入口相关活文件：

```text
src/App.tsx
src/components/BootOverlay.tsx
src/components/Live2DEntry.tsx
src/components/Live2DStage.tsx
src/components/CursorParticles.tsx
src/live2d/CubismSdkModel.ts
```

## 7. 后续规则

- 旧实验代码如果没有活入口引用，应删除或移入明确的实验目录，不要留在 `src/components` 根层。
- 删除前必须先搜索引用。
- 删除后必须运行 `npm run build`。
- 如果删除当前项目目录外的文件，必须先询问用户。
