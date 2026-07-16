# Device Load Reliability：跨设备加载降级

> 日期：2026-07-16  
> 范围：入口、Cloudflare HTML 缓存、低能力设备  
> 目标：不追求完整移动端视觉一致，但任何现代设备都应能进入网站

## 线上诊断

- iPhone Safari、Android Chrome、Windows Chrome、macOS Safari 请求均能取得当前 HTML、JS 与 CSS。
- 当前生产构建的主文件和 13 个动态分包均返回正确 MIME 类型。
- 部署切换期间曾观察到旧 HTML 继续引用已删除的哈希分包；缺失分包被 SPA fallback 返回为 HTML，会导致模块脚本加载失败和白屏。
- 无 WebGL 的浏览器此前只有不可用提示，没有继续进入网站的路径。
- 重入口需要约 3.6MB GLB、两个 Live2D MOC 和五张 4096×4096 PNG；网络体积约 32MB，解码后的五张纹理理论占用约 320MB，足以使手机或低显存 PC 超时或丢失 WebGL context。

## 降级策略

- 以下任一条件成立时使用轻量静态入口：无 WebGL、视口不超过 760px、粗指针、设备内存不超过 4GB、节流模式或 2G 网络。
- 轻量入口只加载响应式 WebP 背景与进入按钮，不挂载 GLB 或 Live2D。
- 桌面重入口的 GLB 等待上限从 25 秒收敛为 12 秒；失败后自动使用空模型继续，不再把用户锁在重试页。
- Live2D 准备超过 15 秒时允许继续进入，模型可在后台结束或失败。
- 主页继续使用现有静态 `<picture>` 作为 WebGL Canvas 的底层降级，因此轻入口不会导向空白页面。

## Cloudflare 缓存策略

- Worker 改为先处理全部请求，再把非 API 请求交给 `env.ASSETS`。
- HTML 响应统一设置 `Cache-Control: no-store, no-cache, must-revalidate`，并补充 `Pragma` 与 `Expires`。
- 带内容哈希的 JS、CSS 与媒体继续使用 Cloudflare 静态资源缓存，不降低大资源缓存收益。

## 验收标准

- 无 WebGL 环境仍显示可用的进入按钮。
- 手机入口不发起 GLB、MOC 或 4096 纹理请求。
- 桌面端资源失败或超时后，最多约 15 秒获得进入能力。
- HTML 不再跨部署保留旧哈希引用。
- `/play`、`/lab`、`/play/reaction` 直达路由继续返回当前 SPA。
