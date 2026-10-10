# Coffee Archive ☕

一款离线优先的私人咖啡收藏与冲煮日志 PWA（无第三方服务依赖）。

## 当前功能

- 咖啡豆档案：名称、产地、庄园、豆种、海拔、处理法、烘焙度、风味、包装图片
- 同一咖啡豆可有不同烘焙日期的购买批次及库存
- 每次完成冲煮后自动扣减对应批次的咖啡粉重量
- 编辑冲煮日志只计算用量差额；删除日志自动返还库存
- 手工校准库存并保留数量调整历史
- 冲煮计时器、沿用上次参数、配方收藏与来源链接
- JSON 备份/恢复和冲煮 CSV 导出；离线访问

## GitHub Pages

在 GitHub 仓库 **Settings → Pages → Build and deployment → Deploy from a branch**，选择 **main / (root)** 并保存。

部署后预计站点路径为：
https://wongtszshan.github.io/my-coffee-bean/

## 自定义图标及启动页

目前使用临时占位素材，后续替换：

- `assets/icon.svg` — PWA 图标占位
- `assets/splash.svg` — 应用启动画面占位

建议再准备：

- `assets/icon-192.png` — 192 × 192
- `assets/icon-512.png` — 512 × 512，建议包含 maskable 安全区域
- `assets/apple-touch-icon.png` — 180 × 180
- 可选单独的高分辨率竖版启动图

替换时同步修改 `index.html` 中 favicon / apple-touch-icon 引用和 `manifest.webmanifest` 中 icons。不同 iOS 版本的 PWA 启动画面行为不同，当前 splash.svg 是应用内的轻量占位启动页，不是 iOS 系统原生静态 splash。

## 数据与隐私

数据使用浏览器 localStorage 保存在**当前浏览器/当前设备**，不经 GitHub 保存或云同步。浏览器清理网站数据、卸载或换设备都可能丢失资料，请定期导出 JSON。包装照片经过压缩后嵌入本地数据；数量很大时会受到 localStorage 大小限制。后续升级 IndexedDB 会更适合长久存储大量照片。

## AI 图片识别

已预留包装照片上传、预览及手动编辑入口，**尚未接入 AI 图片识别**。需要后续由服务端或 Cloudflare Worker 等安全代理接入，不要把私人 API Key 写在公开网站上。

## 注意

这是第一版个人应用，暂无账号登录/跨设备同步，也尚未提供全自动端到端测试。即使仓库公开，他人访问同一网页也不会直接看到当前设备的 localStorage 记录。请勿把私人数据 JSON 上传到公开仓库。

## 技术结构

原生 HTML/CSS/JS，不依赖构建工具；manifest + Service Worker 支持安装和离线缓存。网站部署在仓库子路径下可正常使用。
