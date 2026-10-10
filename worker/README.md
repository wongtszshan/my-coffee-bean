# Coffee Archive 安全同步与 AI 后端

本目录仅为 Cloudflare Worker **部署模板**，不包含任何私密凭证，上传 GitHub 后**不会自动部署**。

## 需要准备

1. GitHub fine-grained personal access token：只给予 `wongtszshan/coffeedatabase` 仓库 **Contents: Read and write** 权限，不允许其他仓库。Token 仅写入 Worker Secret `GITHUB_TOKEN`。
2. 强随机独立口令写入 Worker Secret `SYNC_PASSHRASE`（不要复用 GitHub 密码）。前端每次会话输入，用于认证，不能提交到 GitHub。
3. 可选 Anthropic Claude API key 写入 Worker Secret `ANTHROPIC_API_KEY`。使用 `ANTHROPIC_MODEL` 指定模型（缺省 claude-sonnet-4-5）；请先确认模型可用和 API 计费。
4. Worker 变量 `ALLOWED_ORIGIN=https://wongtszshan.github.io`。如使用自定义域名应更新来源。
5. 把 `worker/coffee-api.js` 部署到 Cloudflare Worker 后，将 `https://你的Worker地址.workers.dev` 粘贴到 PWA 的「设置 → 云端同步」。

## API

- `GET /data`：读取私有仓库 `coffee-data.json` 与最新 SHA
- `PUT /data`：传 `{data,sha}` 保存；SHA 有冲突时返回 409，客户端应停止覆盖并重新读取
- `POST /recognize`：传 `{image:"data:image/jpeg;base64,..."}`，返回 `{fields:{...}}`
- 请求头：`x-sync-key: 你的独立口令`

不要公开 Worker Secret，不要上传包含凭证的截图。Cloudflare Worker 口令验证适合低流量私人原型，但对于公网长期运行，建议改用 Cloudflare Access / OAuth + 服务端会话，并配合速率限制和访问审计。

## 数据注意

- Private GitHub 仓库作为个人数据备份/低频同步可行，但**不适合高频逐秒写入**；推荐一次完整冲煮后同步一次。
- 每次同步通过 GitHub Contents API 会产生 git commit；遇到 409 要处理冲突而不是强制覆盖。
- 上传的咖啡包装照片目前是 base64，长期大量积累建议改用 R2 私有对象存储，仅在 GitHub 保存元数据与路径。
- 目前公开网页和数据私库独立；页面访问者不应拥有 Worker 同步口令。


## 已部署环境

Worker: https://coffee-archive-api.wangtszshan.workers.dev

已使用 Claude Messages API；Claude 调用会产生 Anthropic API 费用。客户端同步时的口令是 `SYNC_PASSHRASE` Secret 的值，绝对不要把它加入公开仓库。
