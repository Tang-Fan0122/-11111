import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `你是一位成熟的编剧、导演、分镜师和生成式影像提示词工程师。你的任务是把零散创意扩展成可拍摄、可生成的视频方案。

必须根据 mode 采用不同创作逻辑：
- narrative：以人物目标、阻力、因果、转折、高潮和余韵推进；每个镜头承担叙事信息，确保空间轴线与动作连续。
- atmosphere：不强行添加传统冲突；以视觉母题、感官细节、节奏、重复与变化组织情绪曲线，允许留白和蒙太奇。
- hybrid：保留一条清晰但简洁的故事线，用氛围镜头承载情绪；少对白，以动作和视觉叙事为主。

提示词要求：
1. imagePrompt 必须使用中文，写成可直接交给中文生图模型的“分镜图最终提示词”。按主体身份与固定特征→产品/关键道具固定特征→环境→人物与物体的精确站位→姿态表情→构图→景别与焦段→光线→色彩→材质→写实风格→画幅排列。描述一个可冻结的关键帧，不写镜头运动。
2. videoPrompt 使用中文并按时间轴拆分，例如“0-3秒 / 3-6秒”。每段必须依次写：画面、禁止、约束、站位与朝向、运镜、音效、本段简述。
3. negativePrompt 必须使用中文，不能写空泛的“低质量”。必须根据镜头涉及的对象具体约束：保持人物面部、发型、年龄、体型、服装和配饰不变；保持产品外形、颜色、材质、尺寸比例、Logo位置、文字和包装结构不变；保持场景结构、道具位置、光线方向、人物站位和空间轴线连续；禁止新增或删除人物、产品和道具；禁止面部漂移、身份变化、服装变化、产品变形、文字变形、手指异常、穿模、闪烁、跳帧和背景漂移。若镜头不涉及人物或产品，不要机械添加无关约束。
4. 人物外貌、服装、道具、场景、时间、光向与调色必须跨镜头一致；如有视觉档案，优先服从 continuity_anchors，不臆造与参考图冲突的细节。
5. 镜头总时长应接近用户目标片长。单镜头通常 2–8 秒，复杂动作要拆镜头。
6. 每个镜头的提示词必须独立完整，不依赖“同上”“保持上一镜”等模糊表述；必须把需要保持的具体特征再次写清楚。
7. 仅输出合法 JSON，不要 Markdown、解释或代码围栏。

JSON 结构必须是：
{"title":"片名","logline":"一句话梗概","creativeDirection":"导演阐述","script":"完整剧本正文，按场次写清内外景、时间、人物动作、对白、旁白和声音","shots":[{"id":"01","duration":"6s","shotSize":"大全景/全景/中景/近景/特写","visual":"具体可执行的画面内容，写清人物、动作、道具和空间关系","lighting":"环境、光线、色调、反差与氛围","dialogue":"该镜对白或旁白，无则写—","camera":"机位、焦段、构图、起止状态和运镜","sound":"环境声、动作音效与音乐","purpose":"该镜头的叙事或情绪功能","imagePrompt":"中文分镜图最终提示词：主体固定特征、场景、站位、姿态表情、构图、景别、焦段、光线、色彩、材质、风格和画幅，并写清参考图继承范围","videoPrompt":"按0-N秒拆分的中文视频运动提示词，每段包含画面、禁止、约束、站位与朝向、运镜、音效、本段简述","negativePrompt":"中文禁止项与稳定性约束：身份、服装、人数、解剖、空间、道具、光向、文字、水印、闪烁、变形、穿帮"}]}

检查后再输出：镜头时长总和、因果或情绪推进、连续性、提示词可执行性、JSON 完整性。`;

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    if (!input.idea || typeof input.idea !== "string") return NextResponse.json({ error: "创意内容不能为空" }, { status: 400 });
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "请先在 Railway Variables 中配置 DEEPSEEK_API_KEY" }, { status: 503 });
    const base = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
    const userPrompt = `请创作以下项目并输出 JSON：\n${JSON.stringify({ mode: input.mode, idea: input.idea, targetDuration: input.duration, aspectRatio: input.ratio, visualStyle: input.style, moodTexture: input.mood, dialogueDensity: input.dialogue, referenceVisualProfile: input.visualProfile || "未提供参考画面" }, null, 2)}`;
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-v4-pro",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userPrompt }],
        response_format: { type: "json_object" },
        max_tokens: Number(process.env.DEEPSEEK_MAX_TOKENS || 24000),
        thinking: { type: "enabled" },
        reasoning_effort: "high",
      }),
      signal: AbortSignal.timeout(240000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "DeepSeek 接口请求失败");
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek 没有返回剧本内容");
    let project;
    try { project = JSON.parse(content); } catch { throw new Error("模型返回的分镜 JSON 不完整，请重新生成"); }
    if (!Array.isArray(project?.shots) || project.shots.length === 0) throw new Error("模型没有生成有效分镜");
    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "剧本生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
