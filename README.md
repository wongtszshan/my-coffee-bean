# Coffee Archive ☕

一款离线优先的私人咖啡收藏与冲煮日志 PWA（无第三方服务依赖）。

## 当前功能

- 咖啡豆档案：名称、产地、庄园、豆种、海拔、处理法、烘焙度、风味、包装图片
- 同一咖啡豆可有不同烘焙日期的购买批次及库存；各批次分别保存建议养豆天数与烘焙商说明，显示豆龄、剩余养豆天数及已达到建议养豆期的状态
- 每次完成冲煮后自动扣减对应批次的咖啡粉重量，并记录冲煮时豆龄（已有历史记录仍保留）
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

## AI 图片与文字理解（v1.6.0）

- 支持最多 4 张包装照片，或粘贴烘焙商自然语言介绍；也可混合输入。
- 通过 Cloudflare Worker 的 Claude 接口提取咖啡豆信息、明确的烘焙日期及建议养豆天数；提供原文依据和冲突提醒。
- 无法确定的信息留空；如果图片只写了月/日，没有年份，不会自行推测。识别结果需要人工核对才能保存。
- AI 图片暂只保存第一张为豆子封面，多张图片用于识别，不会作为多张原图存入 JSON。
- 修改 `worker/coffee-api.js` 后必须重新部署 Cloudflare Worker；前端和 Worker 需要同时升级。
- 切勿在前端代码、公开仓库或日志中暴露 `ANTHROPIC_API_KEY` 或同步口令。

## 数据兼容说明

- 继续使用原 localStorage 键 `coffee.archive.v1`，不强制清空或迁移已有数据。
- 每个批次可选新增 `restDays`、`restNote`；历史批次缺少字段时显示「未设置养豆建议」，不自动填 14 天或 20 天。
- 冲煮日志新增可选 `beanAgeDays`，不会改变库存扣减逻辑。
- GitHub 私库仍保存原有 `beans/lots/recipes/brews/adjustments/gear` 结构，指纹同步与 SHA 冲突保护保持不变。
- 更新版本仅更新公开 PWA/Worker 代码，不会触碰私库咖啡数据。建议首次使用前在设置中导出 JSON 备份。
- `version.json`、`sw.js`、`APP_VERSION` 必须保持一致，才能触发已安装 PWA 的新版提示。

## 注意

这是第一版个人应用，暂无账号登录/跨设备同步，也尚未提供全自动端到端测试。即使仓库公开，他人访问同一网页也不会直接看到当前设备的 localStorage 记录。请勿把私人数据 JSON 上传到公开仓库。

## 技术结构

原生 HTML/CSS/JS，不依赖构建工具；manifest + Service Worker 支持安装和离线缓存。网站部署在仓库子路径下可正常使用。

## v1.7.0 云端同步与设置中心

- 首页显示同步状态：未连接、待核对、检查中、待同步、上传中、已核实同步、离线、失败与冲突。
- 设置分成同步诊断、AI 状态、备份恢复及高级连接。最近核实时间仅在远程内容匹配、成功读取私库或 GitHub 确认上传后更新。
- 所有编辑先保存本地，再尝试自动同步；未获远程确认不得展示“已同步”。
- SHA 冲突保护与手动读取/上传确认保留；数据结构、本地存储键及私库文件保持兼容。
- “待同步”展示有无更改而非虚构更改条目数量。AI 状态区别代理配置和本次 AI 请求结果。
