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
3. 在 Variables 中填入 `.env.example` 中的变量，至少配置 `DEEPSEEK_API_KEY`、`ARK_LITE_API_KEY` 和 `ARK_PRO_API_KEY`。如果两个豆包模型共用密钥，也可以只配置 `ARK_API_KEY`。
4. 生成公开域名。

API Key 仅由服务端读取。参考图片在浏览器转为 Data URL 后直接发送给豆包，不写入服务器磁盘。

## 模型分工

- 豆包 Seed 2.0 Lite：默认参考画面解析。
- 豆包 Seed 2.0 Pro：精细视觉解析。
- DeepSeek V4 Pro：剧本、分镜与提示词生成。
# 幕间 · AI 剧本与分镜工作台

## Railway 环境变量

```text
DEEPSEEK_API_KEY=你的 DeepSeek 密钥
DEEPSEEK_DEEP_MODEL=deepseek-v4-pro
DEEPSEEK_FAST_MODEL=deepseek-v4-flash
ARK_LITE_API_KEY=豆包快速视觉模型密钥
ARK_PRO_API_KEY=豆包精细视觉模型密钥
DOUBAO_MODEL=快速视觉模型 ID
DOUBAO_PRO_MODEL=精细视觉模型 ID
```

模型分工：DeepSeek 深度模型只创作故事；DeepSeek 快速模型负责分镜与提示词；豆包快速模型负责默认素材拆解，精细模型可用于高质量视觉分析。

`DEEPSEEK_API_KEY` 只需要填一份密钥。程序会自动分流：

- `DEEPSEEK_DEEP_MODEL`：生成专业剧本与故事情节，开启深度思考，质量优先。
- `DEEPSEEK_FAST_MODEL`：生成分镜、画面提示词和运动提示词，关闭深度思考，速度优先。
- `ARK_LITE_API_KEY` + `DOUBAO_MODEL`：普通图片与视频关键帧的快速分析。
- `ARK_PRO_API_KEY` + `DOUBAO_PRO_MODEL`：预留给更精细的视觉分析。

变量名称必须使用上述英文大写名称；模型 ID 填在变量右侧的“值”中，不要把模型 ID 当成变量名称。
