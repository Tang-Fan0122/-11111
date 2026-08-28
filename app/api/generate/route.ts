import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const STORY_PROMPT = `你是一位经验丰富的职业影视编剧。此阶段绝对不要写分镜或AI提示词，只负责把用户的创意发展成引人入胜、逻辑严密、具有人物弧光的具体故事。
根据视频类型采用不同方法：剧情向强调欲望、阻力、因果、升级、转折、高潮和余韵；氛围向也必须有清晰的情绪事件与变化，不能只是形容词堆砌；混合型用明确事件承载情绪。
要求：主人公必须有具体目标和代价；对手或阻力必须持续施压；至少两个递进转折；高潮必须来自人物选择；结局回应开场并产生余味；所有事件适配目标时长。不要套用失忆、梦醒、纯巧合等廉价反转，除非用户明确要求。
仅输出合法JSON：{"title":"片名","genre":"类型","theme":"主题命题","logline":"高概念一句话","characters":[{"name":"姓名","identity":"身份与固定外貌","desire":"外在目标","need":"内在需求","flaw":"缺陷","arc":"人物弧"}],"world":"时空与规则","openingHook":"前三秒/开场钩子","synopsis":"完整故事梗概","beats":[{"name":"节拍名称","content":"具体发生什么、因果和人物选择","emotion":"观众情绪"}],"climax":"高潮与关键选择","ending":"结局与余韵","continuityBible":"人物、产品、道具、场景必须保持的固定信息"}`;

const SHOT_PROMPT = `你是一位专业导演和分镜师。只能根据已经确认的故事拆解镜头，不得擅自修改人物动机、关键情节和结局。镜头需要具备清晰的空间轴线、动作衔接、信息递进和节奏变化；复杂动作必须拆镜。镜头时长总和应接近目标片长。
用户会提供 targetSeconds。所有镜头 duration 的秒数相加必须严格等于 targetSeconds，输出前必须自行计算校验。
此阶段不要生成生图或视频提示词。仅输出合法JSON：{"shots":[{"id":"01","duration":"6s","beat":"对应故事节拍","shotSize":"景别","visual":"具体可拍摄画面，人物、动作、道具和空间关系","lighting":"光影与色调","dialogue":"对白或旁白，无则—","sound":"环境声、音乐、动作音效","camera":"机位、焦段、构图、起止状态和运镜","purpose":"该镜的叙事/情绪功能","continuity":"此镜必须保持的身份、产品、道具、场景连续性"}]}`;

const PROMPT_PROMPT = `你是一位生成式影像提示词导演。只能为已经确认的镜头生成提示词，不得改写剧情、增删人物、产品、道具或事件。全部使用中文，每一镜必须独立完整。
imagePrompt：按人物/产品固定特征→环境→精确站位→姿态表情→构图→景别焦段→光线→色彩→材质→风格→画幅书写一个静态关键帧。
videoPrompt：按镜头时长拆成0-3秒、3-6秒等时间段；每段必须包含“画面、禁止、约束、站位与朝向、运镜、音效、本段简述”。
negativePrompt：针对本镜具体约束人物面部、发型、年龄、体型、服装；产品外形、颜色、材质、比例、Logo位置、包装；场景结构、道具位置、光向、轴线。禁止身份漂移、产品变形、文字变形、增删对象、手指异常、穿模、闪烁、跳帧和背景漂移。
仅输出合法JSON：{"prompts":[{"id":"01","imagePrompt":"中文详细分镜图提示词","videoPrompt":"中文分时间段运动提示词","negativePrompt":"中文连续性与禁止项"}]}`;

function tokenBudget(phase: string) {
  const custom = Number(process.env.DEEPSEEK_MAX_TOKENS);
  if (custom) return custom;
  if (phase === "story") return 5500;
  if (phase === "shots") return 7500;
  return 11000;
}

async function ask(system: string, payload: unknown, phase: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("请先在 Railway Variables 中配置 DEEPSEEK_API_KEY");
  const base = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      // 剧本创作要做人物弧和因果推理，使用深度模型；分镜/提示词使用快速模型提升体验。
      model: phase === "story"
        ? (process.env.DEEPSEEK_DEEP_MODEL || process.env.DEEPSEEK_MODEL || "deepseek-v4-pro")
        : (process.env.DEEPSEEK_FAST_MODEL || "deepseek-v4-flash"),
      messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify(payload, null, 2) }],
      response_format: { type: "json_object" }, max_tokens: tokenBudget(phase),
      // 仅剧本阶段开启思考；后续结构化生产阶段关闭，以减少等待。
      thinking: { type: phase === "story" ? "enabled" : "disabled" },
      reasoning_effort: phase === "story"
        ? (process.env.DEEPSEEK_DEEP_REASONING_EFFORT || "medium")
        : (process.env.DEEPSEEK_FAST_REASONING_EFFORT || "low"),
    }), signal: AbortSignal.timeout(240000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "DeepSeek 接口请求失败");
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("模型没有返回内容");
  try { return JSON.parse(content); } catch { throw new Error("模型返回内容不完整，请重新生成"); }
}

function fitDurations(shots: Array<Record<string, unknown>>, target: number) {
  if (!shots.length || !Number.isFinite(target) || target < 1) return shots;
  const raw = shots.map(s => Math.max(1, Number.parseFloat(String(s.duration || "0")) || 1));
  const total = raw.reduce((a,b)=>a+b,0);
  const values = raw.map(v => Math.max(1, Math.floor(v / total * target)));
  let diff = target - values.reduce((a,b)=>a+b,0);
  let index = 0;
  while (diff > 0) { values[index % values.length]++; diff--; index++; }
  index = values.length - 1;
  while (diff < 0 && values.some(v=>v>1)) { if (values[index] > 1) { values[index]--; diff++; } index = (index - 1 + values.length) % values.length; }
  return shots.map((shot,i)=>({ ...shot, duration:`${values[i]}s` }));
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    if (input.phase === "story") {
      if (!input.idea?.trim()) return NextResponse.json({ error: "请先填写创意" }, { status: 400 });
      return NextResponse.json({ story: await ask(STORY_PROMPT, input, "story") });
    }
    if (input.phase === "shots") {
      if (!input.story) return NextResponse.json({ error: "请先确认故事" }, { status: 400 });
      const storyboard = await ask(SHOT_PROMPT, input, "shots");
      storyboard.shots = fitDurations(Array.isArray(storyboard.shots) ? storyboard.shots : [], Number(input.targetSeconds));
      storyboard.actualSeconds = storyboard.shots.reduce((sum:number, s:{duration:string}) => sum + (Number.parseInt(s.duration) || 0), 0);
      return NextResponse.json({ storyboard });
    }
    if (input.phase === "prompts") {
      if (!input.shots?.length) return NextResponse.json({ error: "请先确认分镜" }, { status: 400 });
      return NextResponse.json({ promptSet: await ask(PROMPT_PROMPT, input, "prompts") });
    }
    return NextResponse.json({ error: "未知生成阶段" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "生成失败" }, { status: 500 });
  }
}
