# Sakura1Tap 稳定基座

## 目标

在不改变现有视觉和功能行为的前提下，为后续工具与小游戏提供统一、可回退的前后端结构。

## 本阶段范围

- 集中管理 `/`、`/play`、`/play/reaction`、`/lab` 路径。
- 建立功能注册表，功能空间不再维护独立的模块清单。
- 反应测试通过 feature 入口懒加载，保留现有页面实现和地址。
- 为所有页面级懒加载增加可见 loading 和错误恢复界面。
- Worker 拆分为 API 路由、JSON 响应工具和功能处理器。
- 增加 `/api/health`，同时探测 Worker 与 D1 binding。
- 未知 `/api/*`、无效 JSON、错误请求方法始终返回 JSON。

## 明确不包含

- 不新增工具或小游戏。
- 不改变主页、功能空间、动效实验室和反应测试的正常视觉。
- 不增加账号、权限、CMS、复杂反作弊或通用排行榜表。
- 不更换框架，不引入微前端或额外后端服务。

## 架构边界

- `src/app/`：路径、页面级加载和错误恢复。
- `src/features/registry.ts`：功能空间唯一元数据来源。
- `src/features/<feature>/`：功能模块的稳定入口。
- `worker/routes/`：按 API 功能拆分的处理器。
- `worker/lib/`：无业务状态的通用响应工具。

## 验收标准

1. 四个正式地址可直接打开和刷新。
2. 功能空间的数量、分类、筛选和入口行为保持一致。
3. 反应测试排行榜读取和保存行为保持一致，同 ID 只保留更快成绩。
4. 模块加载失败时显示“重新加载”，不出现永久白屏。
5. `GET /api/health` 在 D1 可用时返回 HTTP 200 与 JSON `status: ok`。
6. 未知 API 返回 HTTP 404 JSON；无效提交 JSON 返回 HTTP 400 JSON。
7. Worker 语法检查、TypeScript 检查与 Wrangler dry-run 通过。

## 后续约束

新增功能必须先写需求卡，再登记到 feature registry。未达到验收标准的功能不得标记为 `available`。
