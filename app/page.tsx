"use client";

import { ChangeEvent, useMemo, useState } from "react";

type Mode = "narrative" | "atmosphere" | "hybrid";
type Shot = {
  id: string;
  duration: string;
  shotSize: string;
  visual: string;
  camera: string;
  sound: string;
  lighting?: string;
  dialogue?: string;
  purpose: string;
  imagePrompt: string;
  videoPrompt: string;
  negativePrompt: string;
};
type Project = {
  title: string;
  logline: string;
  creativeDirection: string;
  script: string;
  shots: Shot[];
};

const modeCopy: Record<Mode, { label: string; tag: string; description: string }> = {
  narrative: { label: "剧情向", tag: "STORY", description: "人物目标、冲突、转折与完整叙事弧" },
  atmosphere: { label: "氛围向", tag: "MOOD", description: "视觉母题、感官细节、节奏与情绪流动" },
  hybrid: { label: "剧情 × 氛围", tag: "HYBRID", description: "简洁故事线与电影化情绪表达并重" },
};

const sample: Project = {
  title: "雨停之前",
  logline: "一名准备离开城市的女孩，在最后一班电车上看见了多年前的自己。",
  creativeDirection: "以雨夜蓝绿色为主调，暖黄车厢作为记忆锚点。克制对白，通过玻璃反射与城市掠影建立现实和记忆的双层空间。",
  script: "雨水沿车窗缓慢下坠。她把一张没有寄出的明信片压在掌心。电车驶过旧影院，玻璃里的倒影忽然变成十七岁的她。没有人说话，只有轨道摩擦声逐渐与心跳重合。到站提示响起时，倒影先一步起身。",
  shots: [
    { id: "01", duration: "4s", shotSize: "大全景", visual: "雨夜城市，末班电车从潮湿街口滑入画面，霓虹倒映在积水中。", lighting: "冷青色雨夜环境光，车厢暖黄色灯光形成冷暖对比，薄雾柔化远景。", dialogue: "—", camera: "低机位固定镜头，电车横向穿越；35mm，深景深。", sound: "细雨、远处车流、电轨摩擦声。", purpose: "建立孤独、潮湿且即将告别的城市情绪。", imagePrompt: "深夜雨中的东亚城市十字路口，一辆复古银灰色末班电车由画面左侧驶向右侧，车身结构、窗户数量、银灰色材质与暖黄色车厢灯保持固定；潮湿柏油路面映出冷青色与暖黄色霓虹，低机位大全景，35mm镜头，深景深，水平构图，轻薄体积雾，真实雨丝与克制胶片颗粒，电影写实风格，16:9。", videoPrompt: "0–2秒：\n画面：银灰色末班电车从画面左侧缓慢进入，细雨持续落下，积水倒影轻微波动。\n禁止：禁止改变电车外形、颜色、车窗数量和行驶方向；禁止新增车辆或行人。\n约束：保持街道路口结构、霓虹位置、冷青与暖黄光向不变。\n站位与朝向：电车车头朝向画面右侧，沿道路中线横向移动。\n运镜：低机位固定镜头，不摇不推。\n音效：细雨、远处车流、电轨摩擦声。\n本段简述：建立雨夜城市与末班电车。\n\n2–4秒：\n画面：电车完整穿过路口，尾部逐渐离开画面，积水中的灯光倒影随车身移动。\n禁止：禁止电车变形、突然加速、镜头抖动、光线闪烁。\n约束：保持运动速度均匀，几何结构稳定，雨势连续。\n站位与朝向：电车继续朝右侧驶离。\n运镜：固定机位，保持水平线稳定。\n音效：轨道声逐渐远去，雨声保持。\n本段简述：用驶离动作强化告别感。", negativePrompt: "保持银灰色电车的外形、颜色、材质、车窗数量和尺寸比例完全一致；保持道路、建筑、霓虹招牌、积水位置和光线方向不变；禁止新增或删除车辆、人物和街道设施；禁止车体变形、轮子漂移、文字水印、灯光闪烁、画面跳帧、几何扭曲和背景漂移。" },
    { id: "02", duration: "5s", shotSize: "近景", visual: "女孩靠窗坐着，掌心压住旧明信片；窗上雨痕切过她的倒影。", lighting: "窗外冷青光与车厢暖黄光交叠，人物面部保持柔和侧逆光。", dialogue: "旁白：有些离开，要等雨停以后才敢承认。", camera: "车外隔窗拍摄，缓慢向前推近；50mm，浅景深。", sound: "雨点击窗，纸张轻响，低频环境乐进入。", purpose: "建立人物和未说出口的离开意图。", imagePrompt: "28岁东亚女性，椭圆脸、黑色齐肩直发、自然淡妆，穿深灰色羊毛大衣与米白色高领毛衣，独自坐在末班电车靠窗座位；右手掌心压住一张无文字的旧明信片，身体朝向车头，脸微微转向窗外，疲惫克制的神情；雨痕从玻璃上纵向滑落并切过倒影。窗外冷青光、车厢暖黄光，50mm近景，平视机位，浅景深，真实皮肤与衣料质感，克制胶片颗粒，电影写实，16:9。", videoPrompt: "0–3秒：\n画面：女孩保持坐姿，右手轻压旧明信片，呼吸带动肩部极轻起伏，雨痕沿窗玻璃缓慢下滑。\n禁止：禁止人物转头、起身或改变表情；禁止明信片出现文字；禁止倒影与真人动作不同步。\n约束：保持人物面部、齐肩黑发、年龄、体型、深灰大衣、米白高领毛衣完全一致；保持右手与明信片接触。\n站位与朝向：人物坐在靠窗座位，身体朝向车头，视线朝窗外。\n运镜：50mm镜头从近景极缓慢推进约10%。\n音效：雨点击窗、车厢低频震动。\n本段简述：压住明信片，隐藏离开的决定。\n\n3–5秒：\n画面：女孩手指轻微收紧，玻璃倒影随电车环境光缓慢掠过，人物仍保持克制。\n禁止：禁止脸部漂移、发型变化、手指增减、服装变化和镜头突变。\n约束：保持人物身份、服装、明信片外形、座位和窗框位置连续。\n站位与朝向：人物位置不变，仍看向窗外。\n运镜：继续微推后稳定停住，焦点始终落在眼睛与手部。\n音效：纸张轻响，低频环境乐进入。\n本段简述：以细微动作暴露人物紧张。", negativePrompt: "保持人物面部五官、齐肩黑发、年龄、体型、深灰色大衣、米白色高领毛衣完全一致；保持旧明信片的尺寸、颜色和位置不变；保持车窗、座位、冷青窗外光与暖黄车厢光方向连续；禁止新增或删除人物和道具；禁止脸部漂移、身份变化、服装变化、手指异常、明信片文字、倒影错位、穿模、闪烁、跳帧和背景漂移。" },
  ],
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("hybrid");
  const [idea, setIdea] = useState("");
  const [duration, setDuration] = useState("60 秒");
  const [ratio, setRatio] = useState("16:9 横屏");
  const [style, setStyle] = useState("电影写实");
  const [mood, setMood] = useState("克制、潮湿、带一点怀旧");
  const [dialogue, setDialogue] = useState("少量对白");
  const [reference, setReference] = useState<string | null>(null);
  const [referenceName, setReferenceName] = useState("");
  const [visualProfile, setVisualProfile] = useState("");
  const [quality, setQuality] = useState<"lite" | "pro">("lite");
  const [project, setProject] = useState<Project>(sample);
  const [activeShot, setActiveShot] = useState(0);
  const [loading, setLoading] = useState<"vision" | "script" | null>(null);
  const [status, setStatus] = useState("示例项目已载入，可直接开始创作");

  const modeHint = useMemo(() => modeCopy[mode], [mode]);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setStatus("参考图请控制在 8MB 以内");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReference(String(reader.result));
      setReferenceName(file.name);
      setStatus("参考图已加入，点击“解析参考画面”提取视觉档案");
    };
    reader.readAsDataURL(file);
  }

  async function analyzeReference() {
    if (!reference) return setStatus("请先上传一张参考图");
    setLoading("vision");
    setStatus("豆包正在拆解人物、构图、光线与连续性锚点…");
    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: reference, quality }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "解析失败");
      setVisualProfile(data.profile);
      setStatus("视觉档案已生成，会作为后续镜头的一致性约束");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "参考图解析失败");
    } finally {
      setLoading(null);
    }
  }

  async function generateScript() {
    if (!idea.trim()) return setStatus("请先写下一个创意或画面想法");
    setLoading("script");
    setStatus(`DeepSeek 正在以“${modeHint.label}”结构创作剧本与分镜…`);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, idea, duration, ratio, style, mood, dialogue, visualProfile }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "生成失败");
      setProject(data.project);
      setActiveShot(0);
      setStatus(`已完成 ${data.project.shots.length} 个镜头，可逐镜头复制或修改提示词`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "剧本生成失败");
    } finally {
      setLoading(null);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setStatus(`${label}已复制`);
  }

  function exportMarkdown() {
    const shots = project.shots.map((s) => `### 镜头 ${s.id} · ${s.duration} · ${s.shotSize}\n\n${s.visual}\n\n- 镜头：${s.camera}\n- 声音：${s.sound}\n- 作用：${s.purpose}\n- 生图提示词：${s.imagePrompt}\n- 生视频提示词：${s.videoPrompt}\n- 负面提示词：${s.negativePrompt}`).join("\n\n");
    const blob = new Blob([`# ${project.title}\n\n> ${project.logline}\n\n## 创作方向\n\n${project.creativeDirection}\n\n## 剧本\n\n${project.script}\n\n## 分镜\n\n${shots}`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${project.title || "分镜脚本"}.md`; a.click(); URL.revokeObjectURL(url);
    setStatus("Markdown 分镜脚本已导出");
  }

  const shot = project.shots[activeShot] || project.shots[0];

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">幕</span><div><strong>幕间</strong><small>AI 剧本与分镜工作台</small></div></div>
        <div className="top-actions"><span className="connection"><i /> DEEPSEEK + DOUBAO</span><button className="ghost" onClick={exportMarkdown}>导出项目</button></div>
      </header>

      <section className="workspace">
        <aside className="brief-panel">
          <div className="section-heading"><span>01</span><div><h2>创作简报</h2><p>先定义影片如何打动观众</p></div></div>
          <label className="field"><span>视频类型</span><div className="mode-grid">
            {(Object.keys(modeCopy) as Mode[]).map((key) => <button key={key} onClick={() => setMode(key)} className={mode === key ? "mode active" : "mode"}><b>{modeCopy[key].tag}</b><strong>{modeCopy[key].label}</strong><small>{modeCopy[key].description}</small></button>)}
          </div></label>
          <label className="field"><span>创意与画面想法</span><textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={mode === "narrative" ? "例：女孩在末班电车上遇见过去的自己……" : mode === "atmosphere" ? "例：凌晨雨后的上海，霓虹、空街和无法言说的告别……" : "写下人物、画面、情绪或一句故事梗概……"} /><em>{idea.length}/1200</em></label>
          <div className="two-col"><label className="field"><span>片长</span><select value={duration} onChange={(e) => setDuration(e.target.value)}><option>30 秒</option><option>60 秒</option><option>90 秒</option><option>3 分钟</option><option>5 分钟</option></select></label><label className="field"><span>画幅</span><select value={ratio} onChange={(e) => setRatio(e.target.value)}><option>16:9 横屏</option><option>9:16 竖屏</option><option>2.39:1 宽银幕</option><option>1:1 方形</option></select></label></div>
          <div className="two-col"><label className="field"><span>影像风格</span><select value={style} onChange={(e) => setStyle(e.target.value)}><option>电影写实</option><option>胶片纪实</option><option>梦境超现实</option><option>东方美学</option><option>时尚广告</option><option>动画插画</option></select></label><label className="field"><span>对白密度</span><select value={dialogue} onChange={(e) => setDialogue(e.target.value)}><option>无对白</option><option>少量对白</option><option>对白驱动</option><option>旁白驱动</option></select></label></div>
          <label className="field"><span>情绪与质感</span><input value={mood} onChange={(e) => setMood(e.target.value)} /></label>

          <div className="reference-box">
            <div><span>参考画面</span><div className="quality"><button className={quality === "lite" ? "active" : ""} onClick={() => setQuality("lite")}>快速</button><button className={quality === "pro" ? "active" : ""} onClick={() => setQuality("pro")}>精细</button></div></div>
            <label className={reference ? "uploader has-image" : "uploader"} style={reference ? { backgroundImage: `linear-gradient(90deg,rgba(8,9,10,.45),rgba(8,9,10,.8)),url(${reference})` } : undefined}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} /><span>{reference ? "更换参考图" : "+ 上传参考图片"}</span><small>{referenceName || "JPG / PNG / WEBP · 最大 8MB"}</small></label>
            <button className="secondary full" onClick={analyzeReference} disabled={loading === "vision"}>{loading === "vision" ? "正在解析画面…" : "解析参考画面"}</button>
            {visualProfile && <details><summary>查看视觉档案</summary><pre>{visualProfile}</pre></details>}
          </div>
          <button className="generate" onClick={generateScript} disabled={loading !== null}><span>{loading === "script" ? "正在组织镜头…" : "生成剧本与分镜"}</span><b>⌘ ↵</b></button>
        </aside>

        <section className="result-panel">
          <div className="result-head"><div><span className="eyebrow">{modeHint.tag} · {duration} · {ratio}</span><h1>{project.title}</h1><p>{project.logline}</p></div><div className="stat"><strong>{project.shots.length}</strong><span>SHOTS</span></div></div>
          <div className="direction"><span>导演阐述</span><p>{project.creativeDirection}</p></div>
          <div className="script-card"><div className="card-title"><span>剧本正文</span><button onClick={() => copy(project.script, "剧本")}>复制</button></div><p>{project.script}</p></div>
          <div className="workflow-steps"><span className="done">1 剧本创作</span><i /><span className="active">2 确认分镜</span><i /><span>3 合成提示词</span></div><div className="timeline-head"><div><span>02</span><div><h2>专业分镜表</h2><p>点击任意镜头，查看中文最终提示词与连续性约束</p></div></div><button className="ghost" onClick={() => copy(JSON.stringify(project, null, 2), "JSON")}>复制 JSON</button></div>
          <div className="shot-table-wrap"><table className="shot-table"><thead><tr><th>镜号</th><th>时长</th><th>画面描述</th><th>景别</th><th>光影氛围</th><th>对白·旁白</th><th>音效</th><th>运镜</th><th>最终提示词</th></tr></thead><tbody>{project.shots.map((s,index)=><tr key={s.id} className={activeShot===index?"active":""} onClick={()=>setActiveShot(index)}><td>{s.id}</td><td>{s.duration}</td><td>{s.visual}</td><td>{s.shotSize}</td><td>{s.lighting || s.purpose}</td><td>{s.dialogue || "—"}</td><td>{s.sound}</td><td>{s.camera}</td><td><button className="view-prompt">查看提示词 →</button></td></tr>)}</tbody></table></div>
          {shot && <article className="shot-detail">
            <div className="shot-main"><div className="shot-number">SHOT<br/><strong>{shot.id}</strong></div><div><span className="eyebrow">{shot.duration} · {shot.shotSize}</span><h3>{shot.visual}</h3><dl><div><dt>摄影</dt><dd>{shot.camera}</dd></div><div><dt>声音</dt><dd>{shot.sound}</dd></div><div><dt>作用</dt><dd>{shot.purpose}</dd></div></dl></div></div>
            <div className="prompt-grid"><Prompt label="FINAL FRAME PROMPT" title="分镜图最终提示词" text={shot.imagePrompt} onCopy={() => copy(shot.imagePrompt, "分镜图提示词")} /><Prompt label="TIMED MOTION PROMPT" title="视频运动提示词（分时间段）" text={shot.videoPrompt} onCopy={() => copy(shot.videoPrompt, "视频运动提示词")} /><Prompt label="NEGATIVE & CONTINUITY" title="禁止项与连续性约束" text={shot.negativePrompt} onCopy={() => copy(shot.negativePrompt, "约束提示词")} wide /></div>
          </article>}
        </section>
      </section>
      <footer className="statusbar"><span><i /> {status}</span><span>所有密钥仅在 Railway 服务端使用</span></footer>
    </main>
  );
}

function Prompt({ label, title, text, onCopy, wide = false }: { label: string; title: string; text: string; onCopy: () => void; wide?: boolean }) {
  return <div className={wide ? "prompt wide" : "prompt"}><div><span>{label}</span><button onClick={onCopy}>复制</button></div><h4>{title}</h4><p>{text}</p></div>;
}
