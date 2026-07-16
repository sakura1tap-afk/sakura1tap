# Reaction Leaderboard：反应时间动态排行榜

> 日期：2026-07-16  
> 路由：`/api/reaction-leaderboard`  
> 数据绑定：`REACTION_DB`  
> 状态：第一版实现

## 目标

- 为反应时间测试增加全站 Top 10。
- 榜单视觉保持像静态排版，但每次读取数据库中的最新成绩。
- 测试红色与绿色阶段隐藏榜单，避免影响反应判断。
- 完成五次测试后允许输入昵称并保存成绩。

## 数据规则

- 浏览器首次使用时生成本地 `playerId`。
- 同一 `playerId` 在数据库只保留最好平均成绩，重复测试不会堆积多行。
- 昵称允许 2–16 个中英文字符、数字、下划线或连字符。
- 后端只接受恰好 5 个整数成绩，每次范围为 80–1500ms。
- 平均值由后端重新计算，不采信客户端提交的平均值。
- 排序按平均值升序；相同成绩按首次进入榜单的时间排序。

## Cloudflare 架构

- 正式部署使用构建产物中的 Advanced Mode Worker：`public/_worker.js`；Vite 会将它复制为 `dist/_worker.js`。
- Worker 只拦截 `/api/reaction-leaderboard`，其他请求交还 `env.ASSETS`，不改变 SPA 与静态资源行为。
- `functions/api/reaction-leaderboard.ts` 保留同等实现，兼容标准 Pages Functions 部署与本地检查。
- 使用 D1 binding：`REACTION_DB`。
- GET 返回 Top 10；POST 校验、写入并返回更新后的榜单。
- Function 首次访问自动执行 `CREATE TABLE IF NOT EXISTS`，无需单独初始化页面。
- `migrations/0001_reaction_scores.sql` 保留相同结构，便于日后正式迁移管理。
- binding 缺失时 API 返回 503 和明确的数据库未绑定提示。
- 前端读取响应前会验证状态、Content-Type 和响应体，不再把 HTML 或空响应当作 JSON 解析。

## 第一版边界

- 这是轻量公开榜单，不等同于强反作弊竞技排行。
- 本地玩家标识可以被清除或伪造；80ms 下限只能过滤明显异常数据。
- 后续若出现刷榜，再加入 Turnstile、IP 哈希限流、管理端删除与赛季归档。
