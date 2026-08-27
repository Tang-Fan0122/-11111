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
    { id: "01", duration: "4s", shotSize: "大全景", visual: "雨夜城市，末班电车从潮湿街口滑入画面，霓虹倒映在积水中。", camera: "低机位固定镜头，电车横向穿越；35mm，深景深。", sound: "细雨、远处车流、电轨摩擦声。", purpose: "建立孤独、潮湿且即将告别的城市情绪。", imagePrompt: "cinematic rainy city at midnight, last tram crossing a wet intersection, cyan and amber neon reflections, low angle wide shot, 35mm lens, realistic film grain, restrained East Asian urban mood, volumetric mist, 16:9", videoPrompt: "A last tram glides slowly across a rain-soaked intersection. Neon reflections ripple in puddles as light rain falls. Locked low-angle camera, subtle mist drift, natural motion blur, cinematic pacing, 4 seconds, 24fps, 16:9.", negativePrompt: "text, watermark, warped tram, duplicated vehicles, oversaturated neon, fast camera, flicker, unstable geometry" },
    { id: "02", duration: "5s", shotSize: "近景", visual: "女孩靠窗坐着，掌心压住旧明信片；窗上雨痕切过她的倒影。", camera: "车外隔窗拍摄，缓慢向前推近；50mm，浅景深。", sound: "雨点击窗，纸张轻响，低频环境乐进入。", purpose: "建立人物和未说出口的离开意图。", imagePrompt: "young East Asian woman sitting alone by tram window, hand resting on an old postcard, rain trails dividing her reflection, cyan exterior light and warm amber cabin light, intimate 50mm close-up, shallow depth of field, cinematic realism, subtle film grain, 16:9", videoPrompt: "Seen through the rain-covered tram window, a young woman gently presses an old postcard under her palm. Her reflection drifts across the glass while the camera performs an extremely slow push-in. Subtle breathing and tram vibration, 5 seconds, 24fps.", negativePrompt: "extra fingers, changing face, deformed hands, illegible postcard text, beauty filter, abrupt movement, reflection mismatch, flicker" },
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
        <div className="brand"><span className="brand-mark">幕</span><div><strong>幕间</strong><small>AI STORYBOARD STUDIO</small></div></div>
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
          <div className="timeline-head"><div><span>02</span><div><h2>分镜序列</h2><p>选择镜头查看完整提示词约束</p></div></div><button className="ghost" onClick={() => copy(JSON.stringify(project, null, 2), "JSON")}>复制 JSON</button></div>
          <div className="shot-strip">
            {project.shots.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setActiveShot(index)}
                className={activeShot === index ? "shot-tab active" : "shot-tab"}
              >
                <span>{s.id}</span>
                <strong>{s.shotSize}</strong>
                <small>{s.duration}</small>
              </button>
            ))}
          </div>
          {shot && <article className="shot-detail">
            <div className="shot-main"><div className="shot-number">SHOT<br/><strong>{shot.id}</strong></div><div><span className="eyebrow">{shot.duration} · {shot.shotSize}</span><h3>{shot.visual}</h3><dl><div><dt>摄影</dt><dd>{shot.camera}</dd></div><div><dt>声音</dt><dd>{shot.sound}</dd></div><div><dt>作用</dt><dd>{shot.purpose}</dd></div></dl></div></div>
            <div className="prompt-grid"><Prompt label="IMAGE PROMPT" title="生图提示词" text={shot.imagePrompt} onCopy={() => copy(shot.imagePrompt, "生图提示词")} /><Prompt label="VIDEO PROMPT" title="生视频提示词" text={shot.videoPrompt} onCopy={() => copy(shot.videoPrompt, "生视频提示词")} /><Prompt label="NEGATIVE" title="负面与稳定性约束" text={shot.negativePrompt} onCopy={() => copy(shot.negativePrompt, "负面提示词")} wide /></div>
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
