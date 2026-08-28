import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VISION_PROMPT = `你是一位电影摄影指导、剪辑师和视觉风格分析师。用户可能上传一张图片，或从一段视频中按时间抽取的多张连续画面。仅输出中文 JSON，不要 Markdown。必须客观区分可见事实与推测。如果是多张连续帧，需要拆解镜头变化、主体运动、镜头运动、剪辑节奏与风格规律。输出：
{
  "summary":"一句话画面摘要",
  "source_type":"图片/视频抽帧",
  "shot_breakdown":[{"range":"画面序号或时间段","content":"镜头内容","camera_motion":"镜头运动","subject_motion":"主体运动","transition":"转场或剪辑"}],
  "subjects":[{"identity":"人物/主体","appearance":"可见外貌","wardrobe":"服装配饰","pose_expression":"动作表情"}],
  "environment":{"location":"","era":"","weather":"","set_details":[]},
  "cinematography":{"shot_size":"","angle":"","composition":"","lens_estimate":"","depth_of_field":"","camera_height":""},
  "lighting":{"key_direction":"","quality":"","contrast":"","practicals":[]},
  "palette":[""],
  "texture_and_style":[""],
  "emotion":[""],
  "continuity_anchors":["后续镜头必须保持一致的具体特征"],
  "prompt_tokens":["可直接进入AI生图提示词的视觉短语"],
  "avoid":["容易破坏参考一致性的内容"]
}`;

export async function POST(request: NextRequest) {
  try {
    const { image, images, quality = "lite", sourceType = "image" } = await request.json();
    const frames = Array.isArray(images) ? images : image ? [image] : [];
    if (!frames.length || frames.some((item:string) => typeof item !== "string" || !item.startsWith("data:image/"))) {
      return NextResponse.json({ error: "没有收到有效的参考画面" }, { status: 400 });
    }
    const apiKey = quality === "pro"
      ? (process.env.ARK_PRO_API_KEY || process.env.ARK_API_KEY)
      : (process.env.ARK_LITE_API_KEY || process.env.ARK_API_KEY);
    if (!apiKey) {
      const variable = quality === "pro" ? "ARK_PRO_API_KEY" : "ARK_LITE_API_KEY";
      return NextResponse.json({ error: `请先在 Railway Variables 中配置 ${variable}` }, { status: 503 });
    }
    const model = quality === "pro"
      ? (process.env.DOUBAO_PRO_MODEL || "doubao-seed-2-0-pro-260215")
      : (process.env.DOUBAO_MODEL || "doubao-seed-2-0-lite-260215");
    const base = (process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3").replace(/\/$/, "");
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        reasoning_effort: quality === "pro" ? "medium" : "minimal",
        messages: [{ role: "user", content: [...frames.slice(0, 8).map((url:string) => ({ type: "image_url", image_url: { url } })), { type: "text", text: `${VISION_PROMPT}\n素材类型：${sourceType === "video" ? "视频抽帧，画面按时间先后排列" : "单张图片"}` }] }],
      }),
      signal: AbortSignal.timeout(120000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "豆包视觉接口请求失败");
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("视觉模型没有返回内容");
    return NextResponse.json({ profile: content, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "参考图解析失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
