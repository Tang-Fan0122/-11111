# 幕间 · AI 剧本与分镜工作台

将创意和参考画面扩展为剧情向、氛围向或混合型视频剧本、分镜，以及逐镜头生图、生视频和负面提示词。

## 本地运行

复制 `.env.example` 为 `.env.local`，填入 DeepSeek 与火山方舟 API Key，然后：

```bash
pnpm install
pnpm dev
```

## Railway 部署

1. 将仓库推送到 GitHub。
2. 在 Railway 创建项目并选择 Deploy from GitHub repo。
3. 在 Variables 中填入 `.env.example` 中的变量，至少配置 `DEEPSEEK_API_KEY` 和 `ARK_API_KEY`。
4. 生成公开域名。

API Key 仅由服务端读取。参考图片在浏览器转为 Data URL 后直接发送给豆包，不写入服务器磁盘。

## 模型分工

- 豆包 Seed 2.0 Lite：默认参考画面解析。
- 豆包 Seed 2.0 Pro：精细视觉解析。
- DeepSeek V4 Pro：剧本、分镜与提示词生成。
