"use client";

import { PointerEvent, useState } from "react";

type Mode = "narrative" | "atmosphere" | "hybrid";
type Story = { title:string; genre:string; theme:string; logline:string; characters:Array<{name:string;identity:string;desire:string;need:string;flaw:string;arc:string}>; world:string; openingHook:string; synopsis:string; beats:Array<{name:string;content:string;emotion:string}>; climax:string; ending:string; continuityBible:string };
type Shot = { id:string;duration:string;beat:string;shotSize:string;visual:string;lighting:string;dialogue:string;sound:string;camera:string;purpose:string;continuity:string };
type PromptItem = { id:string;imagePrompt:string;videoPrompt:string;negativePrompt:string };

const modeLabel:Record<Mode,string>={narrative:"剧情向",atmosphere:"氛围向",hybrid:"剧情 × 氛围"};

export default function Home(){
  const [mode,setMode]=useState<Mode>("narrative"); const [idea,setIdea]=useState(""); const [duration,setDuration]=useState("60秒");
  const [story,setStory]=useState<Story|null>(null); const [storyText,setStoryText]=useState(""); const [storyOK,setStoryOK]=useState(false);
  const [shots,setShots]=useState<Shot[]>([]); const [shotsOK,setShotsOK]=useState(false); const [prompts,setPrompts]=useState<PromptItem[]>([]);
  const [selected,setSelected]=useState("01"); const [loading,setLoading]=useState<string|null>(null); const [status,setStatus]=useState("先创作故事，再确认分镜，最后生成提示词");
  const [offset,setOffset]=useState({x:40,y:40}); const [drag,setDrag]=useState<{x:number;y:number;ox:number;oy:number}|null>(null);
  const currentShot=shots.find(s=>s.id===selected); const currentPrompt=prompts.find(p=>p.id===selected);

  async function call(body:unknown){const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||"生成失败");return d}
  async function makeStory(){if(!idea.trim())return setStatus("请先写下故事创意");setLoading("story");setStatus("专业编剧正在设计人物、冲突、转折与结局…");try{const d=await call({phase:"story",mode,idea,duration});setStory(d.story);setStoryText(d.story.synopsis);setStoryOK(false);setShots([]);setPrompts([]);setStatus("故事已完成，请修改或确认故事")}catch(e){setStatus(e instanceof Error?e.message:"生成失败")}finally{setLoading(null)}}
  async function makeShots(){if(!story)return;setLoading("shots");setStatus("导演正在把已确认故事拆成镜头…");try{const d=await call({phase:"shots",mode,duration,story:{...story,synopsis:storyText}});setShots(d.storyboard.shots);setSelected(d.storyboard.shots[0]?.id||"01");setShotsOK(false);setPrompts([]);setStatus("分镜已完成，请逐镜检查并确认")}catch(e){setStatus(e instanceof Error?e.message:"生成失败")}finally{setLoading(null)}}
  async function makePrompts(){setLoading("prompts");setStatus("提示词导演正在生成逐镜中文提示词与一致性约束…");try{const d=await call({phase:"prompts",story:{...story,synopsis:storyText},shots});setPrompts(d.promptSet.prompts);setStatus("全部提示词已生成")}catch(e){setStatus(e instanceof Error?e.message:"生成失败")}finally{setLoading(null)}}
  function down(e:PointerEvent<HTMLDivElement>){if((e.target as HTMLElement).closest(".node,button,input,textarea,select"))return;setDrag({x:e.clientX,y:e.clientY,ox:offset.x,oy:offset.y});e.currentTarget.setPointerCapture(e.pointerId)}
  function move(e:PointerEvent<HTMLDivElement>){if(drag)setOffset({x:drag.ox+e.clientX-drag.x,y:drag.oy+e.clientY-drag.y})}
  function copy(t:string){navigator.clipboard.writeText(t);setStatus("已复制提示词")}

  return <main className="canvas-app">
    <header className="canvas-top"><div className="logo"><b>幕</b><span><strong>幕间</strong><small>AI 剧本与分镜工作台</small></span></div><div className="stagebar"><em className={story?"done":"active"}>1 创作故事</em><i/><em className={storyOK?(shots?"done":"active"):""}>2 确认分镜</em><i/><em className={shotsOK?"active":""}>3 生成提示词</em></div><button onClick={()=>setOffset({x:40,y:40})}>回到起点</button></header>
    <div className="infinite-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={()=>setDrag(null)}>
      <div className="canvas-world" style={{transform:`translate(${offset.x}px,${offset.y}px)`}}>
        <svg className="wires" width="2850" height="1100"><path d="M 430 250 C 500 250 500 250 570 250"/><path d="M 1030 250 C 1100 250 1100 250 1170 250"/><path d="M 1820 250 C 1890 250 1890 250 1960 250"/></svg>
        <section className="node brief-node" style={{left:0,top:40}}><NodeHead n="01" title="创意简报" state="输入"/><label>视频类型<div className="seg">{(Object.keys(modeLabel) as Mode[]).map(m=><button className={mode===m?"on":""} onClick={()=>setMode(m)} key={m}>{modeLabel[m]}</button>)}</div></label><label>目标片长<select value={duration} onChange={e=>setDuration(e.target.value)}><option>30秒</option><option>60秒</option><option>90秒</option><option>3分钟</option><option>5分钟</option></select></label><label>核心创意<textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="写下人物、困境、画面灵感或一句故事构想…"/></label><button className="primary" onClick={makeStory} disabled={!!loading}>{loading==="story"?"编剧创作中…":"生成具体故事情节 →"}</button></section>
        <section className="node story-node" style={{left:570,top:40}}><NodeHead n="02" title="故事编剧室" state={storyOK?"已确认":story?"待确认":"等待"}/>{story?<><h2>{story.title}</h2><p className="logline">{story.logline}</p><div className="story-meta"><span>主题：{story.theme}</span><span>开场钩子：{story.openingHook}</span></div><textarea className="story-editor" value={storyText} onChange={e=>{setStoryText(e.target.value);setStoryOK(false)}}/><div className="beats">{story.beats.map((b,i)=><div key={i}><b>{i+1}</b><span><strong>{b.name}</strong><small>{b.content}</small></span></div>)}</div><div className="node-actions"><button onClick={makeStory}>重新创作</button><button className="primary" onClick={()=>{setStoryOK(true);setStatus("故事已确认，可以生成分镜")}}>确认故事 ✓</button></div></>:<Empty text="完成创意简报后，职业编剧会在这里构建完整故事"/>}</section>
        <section className="node shots-node" style={{left:1170,top:40}}><NodeHead n="03" title="导演分镜台" state={shotsOK?"已确认":shots.length?"待确认":"等待"}/>{storyOK&&!shots.length?<Empty text="故事已确认，开始拆解镜头"><button className="primary" onClick={makeShots}>{loading==="shots"?"拆解中…":"生成分镜镜头 →"}</button></Empty>:shots.length?<><div className="shot-list">{shots.map(s=><button key={s.id} className={selected===s.id?"selected":""} onClick={()=>setSelected(s.id)}><b>{s.id}</b><span><strong>{s.shotSize} · {s.duration}</strong><small>{s.visual}</small></span></button>)}</div>{currentShot&&<div className="shot-inspect"><b>{currentShot.beat}</b><p>{currentShot.camera}</p><p>{currentShot.lighting}</p><small>连续性：{currentShot.continuity}</small></div>}<div className="node-actions"><button onClick={makeShots}>重新拆分</button><button className="primary" onClick={()=>{setShotsOK(true);setStatus("分镜已确认，可以生成最终提示词")}}>确认全部分镜 ✓</button></div></>:<Empty text="请先确认左侧的完整故事"/>}</section>
        <section className="node prompt-node" style={{left:1960,top:40}}><NodeHead n="04" title="最终提示词" state={prompts.length?"已生成":"等待"}/>{shotsOK&&!prompts.length?<Empty text="分镜已确认，将为每一镜生成详细中文提示词"><button className="primary" onClick={makePrompts}>{loading==="prompts"?"生成中…":"生成画面与运动提示词 →"}</button></Empty>:currentPrompt?<><div className="prompt-tabs">镜头 {selected} · {currentShot?.duration}</div><Prompt title="分镜图提示词" text={currentPrompt.imagePrompt} copy={copy}/><Prompt title="视频运动提示词" text={currentPrompt.videoPrompt} copy={copy}/><Prompt title="AI 一致性约束" text={currentPrompt.negativePrompt} copy={copy}/></>:<Empty text="请先确认全部分镜镜头"/>}</section>
      </div>
      <div className="canvas-help">按住空白处拖动画布 · 横向探索工作流</div><div className="mini-status"><i/>{status}</div>
    </div>
  </main>
}

function NodeHead({n,title,state}:{n:string;title:string;state:string}){return <div className="node-head"><span>{n}</span><h3>{title}</h3><em>{state}</em></div>}
function Empty({text,children}:{text:string;children?:React.ReactNode}){return <div className="empty"><span>⌁</span><p>{text}</p>{children}</div>}
function Prompt({title,text,copy}:{title:string;text:string;copy:(t:string)=>void}){return <div className="prompt-box"><div><b>{title}</b><button onClick={()=>copy(text)}>复制</button></div><p>{text}</p></div>}
