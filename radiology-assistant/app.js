/* ============================================================
   放射学习助手 · app.js —— 路由 / 状态 / 视图渲染
   纯前端 SPA：view 切换 + localStorage 持久化，无后端
   ============================================================ */
(function(){
"use strict";

/* ---------- 工具 ---------- */
const $  = s => document.querySelector(s);
const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
const num = n => (isNaN(n)?0:n);

const store = {
  get(k,d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove("show"), 2200);
}

/* ---------- 图标（内联 Lucide SVG，离线可用） ---------- */
const ICONS = {
  "home":'<path d="m3 9 9-7 9 7"/><path d="M9 22V12h6v10"/>',
  "activity":'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  "scan-line":'<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
  "crosshair":'<circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/>',
  "pencil-line":'<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  "person-standing":'<circle cx="12" cy="5" r="1"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/>',
  "history":'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  "user":'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  "sparkles":'<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  "brain":'<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 5v14"/>',
  "gamepad-2":'<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.018.152C2.56 9.845 2 14 2 14c0 1 .5 2 2 2 1 0 1.5-.5 2-1 .33-.33.3-.38.83-.38.53 0 .77.42.83.88C7.9 16.5 8.5 17 9.5 17c.95 0 1.66-.85 2.87-.69.3.03.51.19.63.69.13.5.5.69 1.5.69 1 0 1.5-.5 2-1 .5-.5-.4-2 0-3 .3-.77.5-1.35.5-2a5.18 5.18 0 0 0-.18-1.41c-.02-.05-.04-.1-.07-.15Z"/>',
  "book-open":'<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  "chevron-right":'<path d="m9 18 6-6-6-6"/>',
  "chevron-down":'<path d="m6 9 6 6 6-6"/>',
  "arrow-left":'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  "x":'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  "check-circle":'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  "x-circle":'<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  "alert-triangle":'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  "lightbulb":'<path d="M9 18h6"/><path d="M10 22h4"/><path d="M9 13c0-2.5.9-4 1.6-5.4C11.7 6 12 5.5 12 5a2 2 0 0 0-4 0c0 .7.3 1 .9 1.7.5.6.1.3.1 1.3"/><path d="M8 8.3a5 5 0 1 1 8 4.4c-.6.6-1 1.2-1 2.3v.5"/>',
  "settings":'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  "rotate-ccw":'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  "trash-2":'<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  "clipboard-list":'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  "shield-check":'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  "upload-cloud":'<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>',
  "info":'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  "database":'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  "gem":'<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  "text":'<path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15 18.1H3"/>',
  "eye":'<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  "check":'<path d="M20 6 9 17l-5-5"/>',
  "wrench":'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  "eraser":'<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
  "search":'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  "grip":'<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
  "triangle":'<path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>',
  "unfold":'<path d="M16 17l5-5-5-5"/><path d="M8 17l-5-5 5-5"/>'
};
function icon(name, cls){
  const body = ICONS[name]||ICONS.info;
  return `<svg class="${cls||'li'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
function patchStaticIcons(){
  $$("[data-lucide]").forEach(el=>{
    const n = el.getAttribute("data-lucide");
    if(ICONS[n]) el.innerHTML = icon(n); // icon() 返回完整 <svg>，保证图标正确渲染
  });
}

/* ---------- 全局 SPA 状态 ---------- */
const todayStr = ()=>{
  const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
};
let QUIZ_STATS = store.get("rad_stats",{total:0,correct:0,streak:1,last:""});
function bumpStreak(){
  const t=todayStr();
  if(QUIZ_STATS.last!==t){
    const y=new Date(Date.now()-864e5); const ys=y.getFullYear()+"-"+String(y.getMonth()+1).padStart(2,"0")+"-"+String(y.getDate()).padStart(2,"0");
    QUIZ_STATS.streak = (QUIZ_STATS.last===ys) ? QUIZ_STATS.streak+1 : 1;
    QUIZ_STATS.last = t;
  }
}
function saveStats(){ store.set("rad_stats",QUIZ_STATS); }
function rate(){ return QUIZ_STATS.total? Math.round(QUIZ_STATS.correct/QUIZ_STATS.total*100) : 0; }

function getWrong(){ return store.get("rad_wrong_book",[]); }
function addWrong(t){ const w=getWrong(); if(!w.some(x=>x.t===t.t)){ w.push(t); store.set("rad_wrong_book",w); } }
function todaysDaily(){
  const k="rad_daily_"+todayStr();
  let d = store.get(k,null);
  if(!d){ d={ set:poolShuffle(), idx:0, ans:[], finish:false, correct:0 }; store.set(k,d); }
  return d;
}
function poolShuffle(){ return DB.practicePool.map(x=>x).sort(()=>Math.random()-0.5); }

/* 全局视图/模块状态 */
const S = {
  view:"home",
  ai:{ mode:"read", modality:"CT", files:[] },
  dr:{ idx:0, map:{}, judged:0 },
  exam:{ si:0, items:[], idx:0, correct:0, ans:{}, running:false },
  quizTab:"day", posTab:"body", hisTab:"read"
};
const L = c=>document.createElement("div"); // not used heavily

/* ============================================================
   视图渲染
   ============================================================ */

/* ---------- 首页 ---------- */
function renderHome(){
  const q = QUIZ_STATS;
  const d = new Date();
  const week=["日","一","二","三","四","五","六"][d.getDay()];
  const dateStr = (d.getMonth()+1)+"月"+d.getDate()+"日 星期"+week;
  const daily = todaysDaily();
  const totalPos = Object.values(DB.posAreas).reduce((n,g)=>n+g.pos.length,0);
  const quick = [
    {ic:"person-standing",iccls:"ic-pos",t:"体位摆放",d:DB.posOrder.length+" 个部位 · "+totalPos+" 个 DR 标准体位，点人体图查看",v:"pos"},
    {ic:"scan-line",iccls:"ic-ai",t:"AI 阅片",d:"上传影像 智能分析",v:"ai"},
    {ic:"pencil-line",iccls:"ic-quiz",t:"每日一练",d:"真题练习 "+(daily.ans.length)+"/"+daily.set.length,v:"quiz"},
    {ic:"gamepad-2",iccls:"ic-exam",t:"模拟考试",d:"分科练习 · 100题/科",v:"quiz"},
    {ic:"book-open",iccls:"ic-book",t:"错题库",d:"每日+模拟 共 "+getWrong().length+" 题",v:"quiz"},
    {ic:"history",iccls:"ic-hist",t:"阅片历史",d:"共 "+(store.get("rad_read_hist",[]).length)+" 条记录",v:"history"}
  ];
  $("#view-home").innerHTML = `
    <div class="h-hero">
      <div class="date">Radiology · ${dateStr}</div>
      <div class="slogan">今天也要元气满满地学习哦～</div>
      <div class="spark">专业是积累，判读是沉淀。</div>
    </div>
    <div class="h-stat-row mt16">
      <div class="h-stat"><div class="val">${daily.ans.length}/${daily.set.length}</div><div class="lbl">今日答题</div></div>
      <div class="h-stat"><div class="val">${rate()}%</div><div class="lbl">总正确率</div></div>
      <div class="h-stat"><div class="val">${q.streak}</div><div class="lbl">连续打卡</div></div>
    </div>
    <div class="h-sec-title">快捷功能<span class="more">一键直达</span></div>
    <div class="h-quick-grid">
      ${quick.map((x,i)=>`<button class="h-quick" data-go="${x.v}" style="animation-delay:${i*0.05}s">
        <div class="ic ${x.iccls}">${icon(x.ic)}</div>
        <div class="qt">${x.t}</div><div class="qd">${x.d}</div></button>`).join("")}
    </div>
    <div class="h-sec-title">今日学习提示</div>
    <div class="h-tip">${icon("lightbulb")}<div class="t">${DB.dailyTip}</div></div>`;
  $("#view-home").querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
}

/* ---------- AI 阅片 ---------- */
function renderAI(){
  $("#view-ai").innerHTML = `
    <div class="mode-switch">
      <button data-m="read" class="${S.ai.mode==='read'?'on':''}">${icon("scan-line")} AI 阅片</button>
      <button data-m="cobb" class="${S.ai.mode==='cobb'?'on':''}">${icon("triangle")} Cobb 角测量</button>
    </div>
    <div id="aiBody"></div>`;
  $("#view-ai").querySelectorAll(".mode-switch button").forEach(b=>b.addEventListener("click",()=>{ S.ai.mode=b.dataset.m; renderAI(); }));
  S.ai.mode==='read' ? renderAIRead() : renderAICobb();
}
function renderAIRead(){
  const box = $("#aiBody");
  box.innerHTML = `
    <label class="field-label">影像类型</label>
    <div class="seg">${["CT","MRI","DR"].map(m=>`<button class="seg-btn ${S.ai.modality===m?'on':''}" data-m="${m}">${m}</button>`).join("")}</div>
    <label class="field-label">上传影像（可多张）</label>
    <div class="upload-zone" id="uz">
      <div><div class="uz-svg">${icon("upload-cloud")}</div>
        <div class="uz-t">点击或拖入影像</div><div class="uz-d">支持 JPG / PNG，一次可多张</div></div>
    </div>
    <div class="thumb-grid" id="thumbs"></div>
    <input type="file" id="fileInput" accept="image/*" multiple class="hide">
    <button class="btn btn-primary btn-block mt20" id="runAI">${icon("sparkles")} AI 智能分析</button>
    <div id="aiOut" class="mt16"></div>`;
  box.querySelectorAll(".seg-btn").forEach(b=>b.addEventListener("click",()=>{ S.ai.modality=b.dataset.m; renderAIRead(); }));
  const uz=$("#uz"), fi=$("#fileInput");
  uz.addEventListener("click",()=>fi.click());
  fi.addEventListener("change",e=>{
    const fs=[].slice.call(e.target.files||[]);
    S.ai.files=S.ai.files.concat(fs.map(f=>({name:f.name,url:URL.createObjectURL(f)})));
    drawThumbs();
  });
  function drawThumbs(){
    $("#thumbs").innerHTML=S.ai.files.map((f,i)=>`<div class="thumb"><img src="${f.url}" alt="${f.name}"><button class="del" data-i="${i}">${icon("x")}</button></div>`).join("");
    $$("#thumbs .del").forEach(b=>b.addEventListener("click",()=>{ S.ai.files.splice(+b.dataset.i,1); drawThumbs(); }));
  }
  $("#thumbs").innerHTML && drawThumbs();
  $("#runAI").addEventListener("click",async ()=>{
    const out=$("#aiOut");
    if(!S.ai.files.length){ toast("请先上传至少一张影像"); return; }
    out.innerHTML=`<div class="report"><div class="r-h">${icon("sparkles")} 正在分析…</div><div class="loading-bar"><i></i></div></div>`;
    const r=await API.aiReading(S.ai.files,S.ai.modality);
    out.innerHTML = r.gate
      ? aiGateHTML()
      : `<div class="report"><div class="r-h">${icon("sparkles")} ${r.report}</div>
         ${r.findings.map(f=>`<div class="mt12"><b>${f.label}：</b>${f.text}</div>`).join("")}</div>`;
  });
}
function renderAICobb(){
  $("#aiBody").innerHTML = `
    <div class="cobb title-tip">
      <svg viewBox="0 0 320 200">
        <rect width="320" height="200" fill="#0B0F14"/>
        <path d="M40 30 L60 150" class="cobb-line A"/>
        <path d="M150 20 L140 170" class="cobb-line A"/>
        <circle cx="36" cy="42" r="4" class="cobb-anchor A"/><circle cx="64" cy="138" r="4" class="cobb-anchor A"/>
        <circle cx="146" cy="32" r="4" class="cobb-anchor A"/><circle cx="136" cy="158" r="4" class="cobb-anchor A"/>
        <path d="M64 138 q60 -30 82 -106" fill="none" stroke="rgba(255,255,255,.35)" stroke-dasharray="4 4"/>
        <text x="96" y="120" class="cobb-tag">∠ 12.4°</text>
      </svg>
      <div class="cobb-title">${icon("triangle")} Cobb 角测量演示 <span class="muted" style="font-size:11px;margin-left:auto">脊柱侧弯示例</span></div>
    </div>
    <button class="btn btn-ghost btn-block mt16" id="cobbRun">${icon("wrench")} 重新测量</button>
    <div class="ai-gate mt16">${icon("info")}<div><div class="g-t">说明</div><div class="g-d">在当前原型中，Cobb 角测量以上端椎/下端椎交界线夹角示意；接入真实影像后替换为自动描点计算。</div></div></div>`;
  $("#cobbRun").addEventListener("click",()=>toast("已按当前上下端椎重新推算 ∠12.4°"));
}
function aiGateHTML(){
  return `<div class="ai-gate">${icon("alert-triangle")}<div>
    <div class="g-t">未配置视觉模型 Key</div>
    <div class="g-d">请先在「我的」配置视觉模型 API Key 后再试。配置后即可获得 AI 智能分析（演示返回）。</div>
    <button class="btn btn-sm btn-line mt8" id="goMine">去配置</button></div></div>`;
}

/* ---------- 判读（DR 骨折 22 例） ---------- */
const DR_TOTAL = DB.drCases.length;
function drBoneFilm(kind){
  const fig = kind==="肩胛"||kind==="锁骨"
    ? `<path d="M60 60 c30 -14 120 -12 150 6 c8 5 -6 22 -30 24 c-20 2 -34 -6 -50 -8 c-34 -4 -70 6 -70 6z" fill="#E8E5DF" stroke="#C7BFAe" stroke-width="1"/>`
    : `<path d="M88 34 h40 c22 0 30 10 28 30 c-2 18 -10 26 -30 26 h-30 c22 0 34 12 30 34 c-3 18 -14 30 -38 28 l-30 -3 c-24 -2 -38 -18 -34 -40 c4 -22 24 -26 34 -44 z" fill="#EEEAE2" stroke="#CFC7B8" stroke-width="1.2"/>`;
  return `<svg viewBox="0 0 240 220" focusable="false"><defs><linearGradient id="film" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${getComputedStyle(document.documentElement).getPropertyValue('--fig-grad-top').trim()||'#FFF8FA'}"/><stop offset="1" stop-color="${getComputedStyle(document.documentElement).getPropertyValue('--fig-grad-bot').trim()||'#F6E7EA'}"/></linearGradient></defs>
    <g transform="translate(0,10)">${fig}</g></svg>`;
}
function renderDR(){
  const box=$("#view-dr"); box.style.display="block";
  // 用一次性渲染容器，避免 display 竞争
  box.style.display="";
  const i=S.dr.idx; const c=DB.drCases[i];
  const done = S.dr.judged;
  const pct = num(done/DR_TOTAL*100);
  const chosen = S.dr.map[i];
  const letters=["A","B","C","D","E"];
  box.innerHTML=`
    <div class="dr-progress">
      <div class="dp-l">骨折判读</div>
      <div class="dp-bar"><i style="width:${pct}%"></i></div>
      <div class="dp-count">${done}/${DR_TOTAL}</div>
    </div>
    <div class="dr-film"><span class="film-tag">DR · ${c.type}</span>${drBoneFilm(c.type)}<div class="muted" style="font-size:11px">${c.part}</div></div>
    <div class="dr-q">第 ${i+1} 例 · ${c.t}</div>
    ${letters.map((k,idx)=>`<button class="dr-opt ${chosen!==undefined && idx===c.a?"correct":""}" data-o="${idx}"><span class="k">${k}</span>${c.o[idx]}</button>`).join("")}
    <div id="drEval" class="mt16"></div>
    <div class="dr-foot">
      <button class="btn btn-line" id="drPrev" ${i===0?'disabled':''}>上一例</button>
      <button class="btn btn-ghost" id="drRedo">↺ 重做</button>
      <button class="btn btn-primary" id="drNext" ${i>=DR_TOTAL-1?'disabled':''}>下一例</button>
    </div>
    <div class="dr-nav-note muted" style="font-size:11px;text-align:center;margin-top:8px">作答即判定，翻页保留；进度仅存于本次会话（同原版）</div>`;

  $$("#view-dr .dr-opt").forEach(b=>b.addEventListener("click",()=>answerDR(i,+b.dataset.o)));
  let btn;
  (btn=$("#drPrev"))&&btn.addEventListener("click",()=>{ if(S.dr.idx>0){S.dr.idx--;renderDR();} });
  (btn=$("#drRedo"))&&btn.addEventListener("click",()=>{ S.dr.map={}; S.dr.judged=0; S.dr.idx=0; renderDR(); toast("已重置本轮判读会话"); });
  (btn=$("#drNext"))&&btn.addEventListener("click",()=>{ if(S.dr.idx<DR_TOTAL-1){S.dr.idx++;renderDR();} });

  if(chosen!==undefined){
    const cc=c, ch=chosen;
    const right = ch===cc.a;
    // 高亮
    $$("#view-dr .dr-opt").forEach(b=>{
      const o=+b.dataset.o;
      if(o===ch)b.classList.add(right?"correct":"wrong");
      if(o===cc.a)b.classList.add("correct");
    });
    $("#drEval").innerHTML =
      `<div class="feedback ${right?'ok':'bad'}">
        <div class="fb-t">${right?icon("check-circle"):icon("x-circle")} ${right?"回答正确":"回答错误"}</div>
        <div>${right?"判读精准，继续保持。":"正确答案为 " + letters[cc.a] + "。"}</div>
        <div class="mt12" style="font-weight:700">AI 解读</div>
        <div class="q-explain" style="background:var(--ai-soft);color:var(--ai-ink);border:none">${cc.said}</div>
      </div>`;
  }
}
function answerDR(i,o){
  if(S.dr.map[i]!==undefined) return; // 已锁定
  S.dr.map[i]=o; S.dr.judged=Object.keys(S.dr.map).length;
  QUIZ_STATS.total++; if(o===DB.drCases[i].a)QUIZ_STATS.correct++; bumpStreak(); saveStats();
  renderDR();
}

/* ---------- 练习 ---------- */
function quizTabHTML(active){
  return `<div class="quiz-tabs">
    <button data-t="day" class="${active==='day'?'on':''}">每日一练</button>
    <button data-t="exam" class="${active==='exam'?'on':''}">模拟考试</button>
    <button data-t="wrong" class="${active==='wrong'?'on':''}">错题库</button>
  </div><div id="quizBody"></div>`;
}
function renderQuiz(){
  $("#view-quiz").innerHTML=quizTabHTML(S.quizTab||"day");
  const btns=$$("#view-quiz .quiz-tabs button");
  btns.forEach(b=>b.addEventListener("click",()=>{ S.quizTab=b.dataset.t; renderQuiz(); }));
  const B=$("#quizBody");
  if(S.quizTab==="wrong") return renderWrong(B);
  if(S.quizTab==="exam") return renderExamSetup(B);
  return renderDaily(B);
}
/* 每日一练 */
function renderDaily(B){
  const d=todaysDaily();
  const chips=`<div class="quiz-stat">
    <div class="q-chip"><div class="qc-ic ic-quiz">${icon("text")}</div><div><div class="qc-t">累计答题</div><div class="qc-v">${num(QUIZ_STATS.total)}</div></div></div>
    <div class="q-chip"><div class="qc-ic ic-ai">${icon("check-circle")}</div><div><div class="qc-t">正确率</div><div class="qc-v">${rate()}%</div></div></div>
  </div>`;
  B.innerHTML=chips+'<div class="mt16" id="dailyBox"></div>';
  renderDailyStage($("#dailyBox"),d);
}
function renderDailyStage(box,d){
  if(d.finish){ box.innerHTML=dailyDone(d); bindDailyDone(box); return; }
  const q=d.set[d.idx]; if(!q){ d.finish=true; renderDailyStage(box,d); return; }
  box.innerHTML=dailyItemHTML(d,q);
  $$("#dailyBox .dr-opt").forEach(b=>b.addEventListener("click",()=>answerDaily(+b.dataset.o)));
  const dn=$("#dNext"); if(dn) dn.addEventListener("click",nextDaily);
}
function dailyItemHTML(d,q){
  const letters=["A","B","C","D","E"];
  return `
    <div class="quiz-item-head"><span class="q-round">第 ${d.idx+1}/${d.set.length} 题 · ${q.sub}</span>
      <span class="qtype-tag single">单选</span></div>
    <div class="q-stem">${q.t}</div>
    <div id="dailyOpts">${letters.map((k,i)=>`<button class="dr-opt" data-o="${i}"><span class="k">${k}</span>${q.o[i]}</button>`).join("")}</div>
    <div id="dailyEval" class="mt16"></div>
    <div class="dr-foot"><button class="btn btn-primary btn-block" id="dNext">${d.idx>=d.set.length-1?"完成本日":"下一题"}</button></div>`;
}
function answerDaily(o){
  const d=todaysDaily(); const q=d.set[d.idx];
  if(d.ans[d.idx]!==undefined) return;
  d.ans[d.idx]=o; if(o===q.a)d.correct++; store.set("rad_daily_"+todayStr(),d);
  QUIZ_STATS.total++; if(o===q.a)QUIZ_STATS.correct++; bumpStreak(); saveStats();
  // 高亮 + 反馈
  const opts=$$("#dailyOpts .dr-opt");
  opts.forEach(b=>{ const x=+b.dataset.o; if(x===o)b.classList.add(o===q.a?"correct":"wrong"); if(x===q.a)b.classList.add("correct"); });
  $("#dailyEval").innerHTML=`
    <div class="feedback ${o===q.a?'ok':'bad'}">
      <div class="fb-t">${o===q.a?icon("check-circle"):icon("x-circle")} ${o===q.a?"正确":"错误"}</div>
      <div style="font-weight:700">解析</div>
      <div class="mt8">${q.ex}</div>
    </div>
    <div class="collapse" id="dAIcoll">
      <div class="collapse-head">${icon("sparkles")} 让 AI 详细讲解 <span>${icon("chevron-down")}</span></div>
      <div class="collapse-body"><div class="collapse inner" id="dAIout">点击开启 AI 讲解（需在「我的」配置 API Key）</div></div>
    </div>`;
  $("#dAIcoll .collapse-head").addEventListener("click",e=>{
    const c=$("#dAIcoll"); c.classList.toggle("open");
    if(c.classList.contains("open")) dailyAI();
  });
  $("#dNext").addEventListener("click",nextDaily);
  opts.forEach(b=>b.disabled=true);
}
async function dailyAI(){
  const out=$("#dAIout"); if(!out) return;
  const d=todaysDaily(); const q=d.set[d.idx];
  out.innerHTML=`<div class="loading-bar"><i></i></div>`;
  const r=await API.explain(q.t,q.o.join(" / "));
  out.innerHTML = r.gate ? "未配置 API Key，请到「我的」配置后使用。" : r.reply;
}
function nextDaily(){
  const d=todaysDaily();
  if(d.idx<d.set.length-1){ d.idx++; store.set("rad_daily_"+todayStr(),d); renderDaily($("#quizBody")); }
  else { d.finish=true; d.idx=0; store.set("rad_daily_"+todayStr(),d); renderDaily($("#quizBody")); }
}
function dailyDone(d){
  let b=""; $$("#view-quiz .dr-opt").forEach(x=>x.removeAttribute("disabled"));
  return `<div class="card" style="text-align:center;padding:34px 20px">
    <div style="width:64px;height:64px;margin:0 auto 14px;border-radius:22px;background:var(--grad-soft);color:var(--rose);display:flex;align-items:center;justify-content:center">${icon("check-circle","",true)}</div>
    <div style="font-size:20px;font-weight:800">今日练习完成</div>
    <div style="color:var(--ink-soft);margin-top:6px">共 ${d.set.length} 题，答对 <b style="color:var(--ok)">${d.correct}</b> 题</div>
    <div class="mt20"><button class="btn btn-ghost btn-block" id="dayRedo">↺ 重出今日题</button></div>
    <div class="muted" style="font-size:12px;margin-top:10px">错题已自动收录到「错题库」</div></div>`;
}
function bindDailyDone(box){
  const b=$("#dayRedo");
  if(b)b.addEventListener("click",()=>{ 
    const r=API.checkConnections();
    if(!r.text.ok&&!r.vision.ok){ toast("未配置 API Key——已清空今日题，可在「练习」重新生成（题库兜底）"); }
    store.del("rad_daily_"+todayStr()); renderDaily($("#quizBody"));
  });
}

/* 每日一练「上一题」可能误 disabled 的修正 */
function fixOptionDisabled(){ /* 不用 */ }

/* ---------- 模拟考试 ---------- */
function renderExamSetup(B){
  B.innerHTML=`<div class="mt8">
    <div class="card exam-desc">
      <div class="r1"><div>
        <div class="ed-sub">模拟考试</div>
        <div class="ed-meta">全真三段式：单选 → 共用题干 → 多选<br>答题完成后自动收录错题至错题库</div></div>
        <span class="tag rose">${icon("gamepad-2")} 分科</span></div>
      <div class="divider"></div>
      ${DB.examSubjects.map((s,i)=>`<div class="exam-sector" data-s="${i}">
        <div class="es-ic ic-exam" style="background:var(--rose-soft);color:var(--rose)">${s.tag==='single'?icon("text"):s.tag==='shared'?icon("book-open"):icon("clipboard-list")}</div>
        <div><div class="es-t">${s.name}</div><div class="es-d">${s.pct} · 题库 ${s.total} 题 · 考 ${s.count} 题</div></div>
        <div class="es-n">${icon("chevron-right")}</div></div>`).join("")}
    </div>
    <button class="btn btn-primary btn-block mt16" id="examStart">${icon("gamepad-2")} 开始考试</button>
    <div class="muted" style="font-size:12px;text-align:center;margin-top:10px">选择上方科目后再开始，卷面按所选科目规则组卷</div></div>`;
  let sel=0;
  $$("#quizBody .exam-sector").forEach((el,i)=>el.addEventListener("click",()=>{
    sel=i;
    $$("#quizBody .exam-sector").forEach(x=>x.style.background="");
    el.style.background="var(--grad-soft)";
  }));
  $("#examStart").addEventListener("click",()=>startExam(sel));
}
function buildExam(si){
  const s=DB.examSubjects[si];
  const items=[]; let n=0;
  while(n < Math.min(s.count, 140)){
    if(s.groups){ s.groups.forEach(g=>{ g.items.forEach(it=>{ items.push({t:it.s,o:it.o,a:it.a,qtype:"shared",g:g.g}); n++; }); }); break; }
    const q=s.pool[n % s.pool.length];
    items.push(q.qtype && q.qtype!=="single" ? q : {t:q.t,o:q.o,a:Array.isArray(q.a)?q.a:q.a,qtype:s.tag, multi:Array.isArray(q.a)});
    n++;
  }
  return items;
}
function startExam(si){
  confirmSheet("开始「"+DB.examSubjects[si].name+"」模拟考试？","卷面按所选科目规则组卷，完成后自动收录错题。",()=>{
    S.exam={si, items:buildExam(si), idx:0, correct:0, ans:{}, running:true};
    renderExamItem();
  });
}
function renderExamItem(){
  const B=$("#quizBody"); const e=S.exam; const q=e.items[e.idx];
  if(!q){ return finishExam(); }
  const letters=["A","B","C","D","E"];
  const shared = q.qtype==="shared"||q.g;
  const multi = Array.isArray(q.a);
  B.innerHTML=`<div class="mt8 card">
    <div class="quiz-item-head"><span class="q-round">${DB.examSubjects[e.si].name} · 第 ${e.idx+1}/${e.items.length} 题</span>
      <span class="qtype-tag ${multi?'multi':shared?'shared':'single'}">${multi?"多选":shared?"共用题干":"单选"}</span></div>
    ${q.g?`<div class="q-group">${q.g}</div>`:""}
    <div class="q-stem">${q.t}</div>
    <div id="examOpts">${letters.map((k,i)=>`<button class="dr-opt" data-o="${i}"><span class="k">${k}</span>${q.o[i]}</button>`).join("")}</div>
    <div class="dr-foot"><button class="btn btn-line" id="exPrev" ${e.idx===0?'disabled':''}>上一题</button>
      <button class="btn btn-primary" id="exNext">${e.idx>=e.items.length-1?"交卷":"下一题"}</button></div></div>`;
  const opts=$$("#examOpts .dr-opt");
  const sel=e.ans[e.idx];
  if(sel!==undefined){ opts.forEach(b=>b.disabled=true); if(Array.isArray(sel)){ sel.forEach(x=>opts[x]&&opts[x].classList.add("correct")); } else opts[sel]&&opts[sel].classList.add("correct"); }
  opts.forEach(b=>b.addEventListener("click",()=>{
    const o=+b.dataset.o;
    if(multi){ if(!e.ans[e.idx]) e.ans[e.idx]=[]; const arr=e.ans[e.idx]; const at=arr.indexOf(o); at>=0?arr.splice(at,1):arr.push(o); b.classList.toggle("correct"); b.disabled=true; }
    else { e.ans[e.idx]=o; opts.forEach(x=>x.disabled=true); opts.forEach(x=>{ if(+x.dataset.o===o)x.classList.add("correct"); }); }
    // 多选减少错选风险：允许逐个点，点后即锁定以保持简单
  }));
  $("#exPrev").addEventListener("click",()=>{ if(e.idx>0){e.idx--;renderExamItem();} });
  $("#exNext").addEventListener("click",()=>{
    const a=e.ans[e.idx]; if(a===undefined){ toast(multi?"请选择（可多选）":"请选择一个答案"); return; }
    const right = Array.isArray(q.a) ? arrEq(a,q.a) : a===q.a;
    if(right)e.correct++;
    if(Array.isArray(q.a)&&!right){ addWrong({sub:DB.examSubjects[e.si].name,t:q.t,o:q.o,a:q.a,ex:q.ex||"",multi:true,you:a}); }
    else if(!Array.isArray(q.a)&&!right){ addWrong({sub:DB.examSubjects[e.si].name,t:q.t,o:q.o,a:q.a,ex:q.ex||"",you:a}); }
    e.idx++; renderExamItem();
  });
}
function arrEq(a,b){ if(a.length!==b.length)return false; const s=(x)=>[...x].sort().join(","); return s(a)===s(b); }
function finishExam(){
  const e=S.exam; const s=DB.examSubjects[e.si];
  const total=e.items.length; const right=e.correct;
  const rec={sub:s.name,date:todayStr(),score:right,total,pct:Math.round(right/total*100)};
  const recs=store.get("rad_exam_records",[]); recs.unshift(rec); store.set("rad_exam_records",recs);
  S.exam.running=false;
  $("#quizBody").innerHTML=`<div class="card" style="text-align:center;padding:34px 20px">
    <div style="width:64px;height:64px;margin:0 auto 14px;border-radius:22px;background:var(--grad-soft);color:var(--rose);display:flex;align-items:center;justify-content:center">${icon("check-circle")}</div>
    <div style="font-size:20px;font-weight:800">考试完成</div>
    <div style="font-size:34px;font-weight:800;color:var(--rose);margin:10px 0">${rec.score}/${rec.total}</div>
    <div style="color:var(--ink-soft)">正确率 ${rec.pct}% · 已收录错题</div>
    <div class="mt20"><button class="btn btn-ghost btn-block" id="examAgain">再来一次</button></div></div>`;
  $("#examAgain").addEventListener("click",()=>{ S.quizTab="exam"; renderQuiz(); });
  toast("考试记录已保存到「历史」，错题已入错题库");
}
function confirmSheet(title,desc,onOk){
  openSheet(`<div class="sheet-head"><h3>${title}</h3><button class="sheet-close" id="sheetX">${icon("x")}</button></div>
    <div class="muted" style="font-size:13.5px">${desc}</div>
    <button class="btn btn-primary btn-block mt20" id="sheetOk">开始考试</button>`);
  $("#sheetOk").addEventListener("click",()=>{ closeSheet(); onOk(); });
  $("#sheetX").addEventListener("click",closeSheet);
}

/* ---------- 错题库 ---------- */
function renderWrong(B){
  const w=getWrong(); const letters=["A","B","C","D","E"];
  B.innerHTML=`<div class="mt8">
    <div class="card"><div class="quiz-item-head" style="margin-bottom:4px"><div style="font-weight:800;font-size:16px">错题库</div>
      <span class="tag bad">${icon("book-open")} ${w.length} 题</span></div>
      <div class="muted" style="font-size:12px">每日一练与模拟考试的错误题目自动收录</div></div>
    ${w.length?`<button class="btn btn-line btn-block mt12" id="clearWrong">${icon("trash-2")} 清空错题</button>`:""}
    <div class="mt8">${w.length?w.map((q,i)=>`
      <div class="card mt12"><div class="book-item">
        <div class="bi-no">${i+1}</div>
        <div class="bi-t">
          <div class="book-meta"><span class="tag rose">${q.sub}</span>${q.multi?'<span class="tag lav">多选</span>':''}</div>
          <div style="font-weight:700;font-size:14px">${q.t}</div>
          <div class="muted mt8" style="font-size:13px;line-height:1.7">
            你的答案：<b style="color:var(--bad)">${fmtYou(q)}</b> &nbsp;·&nbsp; 正确答案：<b style="color:var(--ok)">${fmtAns(q,letters)}</b></div>
          ${q.ex?`<div class="q-explain">${q.ex}</div>`:""}
        </div></div></div>`).join("")
      :`<div class="empty"><div class="e-ic">${icon("check-circle")}</div><div class="e-t">错题库是空的</div><div class="e-d">继续做题，错题会自动收录到这里<br>方便你集中复盘</div></div>`}
  </div>`;
  const cw=document.getElementById("clearWrong"); if(cw)cw.addEventListener("click",()=>{ store.set("rad_wrong_book",[]); renderQuiz(); toast("已清空错题"); });
}
function fmtYou(q){ const letters=["A","B","C","D","E"]; return Array.isArray(q.you)?q.you.map(x=>letters[x]).join("、"):letters[q.you]; }
function fmtAns(q,letters){ return Array.isArray(q.a)?q.a.map(x=>letters[x]).join("、"):letters[q.a]; }

/* ---------- 体位摆放 ---------- */
const AREA_MARKS={
  "头颅":[100,30],"颈椎":[100,46],"肩关节":[70,60],"胸部":[100,84],"胸椎":[100,102],
  "肘关节":[50,116],"腕关节":[45,168],"手":[45,188],"腰椎":[100,126],"腹部":[100,142],
  "骨盆":[100,168],"髋关节":[78,180],"膝关节":[78,238],"踝关节":[78,296],"足":[76,318]
};
function bodySVG(activeArea){
  const pts={head:[100,30],neck:[100,50]};
  const m=AREA_MARKS;
  // 简易人体线段
  const fig=`
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".7">
      <circle cx="100" cy="26" r="15"/>
      <path d="M70 58 h60 M100 41 V60"/>
      <path d="M70 60 L50 110 L45 172"/>
      <path d="M130 60 L150 110 L155 172"/>
      <circle cx="45" cy="180" r="4"/><circle cx="155" cy="180" r="4"/>
      <path d="M82 170 L78 238 L78 300"/>
      <path d="M118 170 L122 238 L122 300"/>
      <path d="M78 300 L60 312"/><path d="M122 300 L140 312"/>
    </g>`;
  return `<svg viewBox="0 0 200 330" fill="currentColor">${fig}
    ${Object.keys(m).map(k=>{ const c=m[k], active=k===activeArea;
      return active
        ? `<circle cx="${c[0]}" cy="${c[1]+10}" r="11" fill="var(--rose)" opacity=".18"/><circle cx="${c[0]}" cy="${c[1]}" r="6" fill="var(--rose)" stroke="#fff" stroke-width="1.5"/>`
        : `<circle cx="${c[0]}" cy="${c[1]}" r="4.5" fill="var(--rose)" stroke="#fff" stroke-width="1.4"/>`;
    }).join("")}
  </svg>`;
}
function renderPos(){
  const box=$("#view-pos"); box.style.display="block"; box.style.display="";
  box.innerHTML=`
    <div class="search-box mb0">${icon("search")}<input id="posSearch" placeholder="搜索体位，如：膝关节侧位 / 舟骨"/></div>
    <div class="pos-tabs mt12">
      <button data-p="body" class="on">人体图</button>
      <button data-p="all">全部部位</button>
    </div>
    <div id="posBody" class="mt8"></div>`;
  const tabs=$$("#view-pos .pos-tabs button");
  tabs.forEach(b=>b.addEventListener("click",()=>{ S.posTab=b.dataset.p; tabs.forEach(x=>x.classList.toggle("on",x===b)); renderPosInner(); }));
  const si=$("#posSearch");
  si.addEventListener("input",()=>{ const v=si.value.trim(); if(v) renderPosSearch(v); });
  renderPosInner();
}
function renderPosInner(){
  const B=$("#posBody");
  if(S.posTab==="all"){ B.innerHTML=`<div class="pos-grid">${DB.posOrder.map(a=>{ const g=DB.posAreas[a]; return `<button class="pos-cell" data-a="${a}"><div class="pc-t">${a} <span>${icon("chevron-right")}</span></div><div class="pc-n">${g.pos.length} 个标准体位</div></button>`; }).join("")}</div>`;
    $$("#posBody .pos-cell").forEach(c=>c.addEventListener("click",()=>openAreaSheet(c.dataset.a))); return; }
  B.innerHTML=`<div class="pos-body-card" style="color:var(--rose)">${bodySVG(null)}
    ${Object.keys(AREA_MARKS).map(a=>{ const c=AREA_MARKS[a]; return `<div class="pos-bubble" data-a="${a}" style="left:${c[0]/2-5}%;top:${c[1]/3.3-3}%"><div class="p-dot"></div><div class="p-lbl">${a.length>2?a.slice(0,2):a}</div></div>`; }).join("")}
  </div><button class="btn btn-ghost btn-block mt12" id="posAll">查看全部 ${DB.posOrder.length} 个部位</button>`;
  $$("#posBody .pos-bubble").forEach(b=>b.addEventListener("click",()=>openAreaSheet(b.dataset.a)));
  $("#posAll").addEventListener("click",()=>{ S.posTab="all"; renderPosInner(); });
}
function renderPosSearch(q){
  const B=$("#posBody");
  const hits=[];
  DB.posOrder.forEach(a=>DB.posAreas[a].pos.forEach(p=>{ if(p.name.includes(q)) hits.push({a,...p}); }));
  B.innerHTML = hits.length
    ? `<div class="card"><div class="quiz-item-head" style="margin-bottom:4px"><div style="font-weight:800">搜索结果</div><span class="tag rose">${hits.length} 个</span></div></div>`+ hits.map((p,i)=>`<div class="card mt12"><div class="book-item">
        <div class="bi-no" style="background:var(--rose-soft);color:var(--rose)">${i+1}</div>
        <div class="bi-t"><div class="book-meta"><span class="tag rose">${p.a}</span><span class="tag lavender" style="background:var(--peach);color:var(--warn)">标准体位</span></div>
        <div style="font-weight:700;font-size:14px">${p.name}</div><button class="btn btn-sm btn-line mt12" data-open="${p.a}" data-in="${p.i}">查看详情</button></div></div></div>`).join("")
    : `<div class="empty"><div class="e-ic">${icon("search")}</div><div class="e-t">未找到相关体位</div><div class="e-d">换个关键词试试，如「膝关节」「舟骨」「胸部」</div></div>`;
  $$("#posBody [data-open]").forEach(b=>b.addEventListener("click",()=>openPosDetail(b.dataset.open,+b.dataset.in)));
}
function openAreaSheet(area){
  const g=DB.posAreas[area];
  openSheet(`<div class="sheet-head"><h3>${area}</h3><button class="sheet-close" data-x>${icon("x")}</button></div>
    <div class="muted" style="font-size:13px;margin-bottom:10px">${g.pos.length} 个标准体位 · 点按查看详解</div>
    <div class="card-btnlist">${g.pos.map((p,i)=>`<button data-p="${i}"><span style="font-size:18px;color:var(--warn)">${icon("person-standing")}</span> ${p.name} <span style="margin-left:auto;color:var(--ink-soft)">${icon("chevron-right")}</span></button>`).join("")}</div>`);
  $$(".sheet [data-p]").forEach(b=>b.addEventListener("click",()=>{ const i=+b.dataset.p; openPosDetail(area,i); }));
  bindSheetClose();
}
function openPosDetail(area,i){
  const p=DB.posAreas[area].pos[i];
  const kv=[["摄影目的",p.aim],["患者体位",p.post],["探测器 / 暗盒",p.det],["中心线",p.cr],["SID",p.sid],["照射野",p.field],["曝光条件",p.expo],["标准影像",p.standard],["常见错误",p.errors]];
  openSheet(`<div class="sheet-head"><h3>${p.name}</h3><button class="sheet-close" data-x>${icon("x")}</button></div>
    <div class="tag rose mb0">${area} · 标准体位</div>
    <div class="mt16">${posDiagram(p.name,area)}</div>
    <div class="mt16 card">
      ${kv.map(([k,v])=>v?`<div class="pos-detail-kv"><div class="k">${k}</div><div class="v">${v}</div></div>`:"").join("")}
    </div>`);
  bindSheetClose();
}
function posDiagram(name,area){
  // 简洁投照示意图：探测器 + 中心线 + 体位
  return `<svg viewBox="0 0 300 150" style="width:100%;border-radius:16px;background:var(--cream)">
    <rect x="248" y="20" width="6" height="110" rx="3" fill="var(--rose)" opacity=".55"/><text x="258" y="15" font-size="9" fill="var(--ink-soft)">探测器</text>
    <path d="M30 75 L256 75" stroke="var(--rose)" stroke-width="1.4" stroke-dasharray="6 4"/>
    <text x="120" y="64" font-size="10" fill="var(--ink-soft)">X 射线 · 中心线</text>
    <g transform="translate(40,48)">${bodyGlyph(area)}</g>
    <text x="150" y="140" font-size="9" fill="var(--ink-soft)">${name}</text>
  </svg>`;
}
function bodyGlyph(area){
  return `<svg width="52" height="54" viewBox="0 0 40 44"><g fill="none" stroke="var(--ink-soft)" stroke-width="1.6" stroke-linecap="round"><circle cx="20" cy="7" r="5.2"/><path d="M15 15 h10 M20 12 V18"/><path d="M15 18 l-4 12 M25 18 l4 12"/><path d="M16 30 L12 42 M24 30 L28 42"/></g></svg>`;
}

/* ---------- 历史 ---------- */
function renderHistory(){
  const box=$("#view-history"); box.style.display="block"; box.style.display="";
  const hist=store.get("rad_read_hist",[]);
  const exams=store.get("rad_exam_records",[]);
  box.innerHTML=`<div class="quiz-tabs"><button data-h="read" class="on">阅片记录</button><button data-h="exam">考试记录</button></div>
    <div id="hisBody"></div>`;
  S.hisTab=S.hisTab||"read";
  $$("#view-history .quiz-tabs button").forEach(b=>b.addEventListener("click",()=>{ S.hisTab=b.dataset.h; $$("#view-history .quiz-tabs button").forEach(x=>x.classList.toggle("on",x===b)); renderHisBody(); }));
  renderHisBody();
}
function renderHisBody(){
  const B=$("#hisBody"); B.innerHTML="";
  if(S.hisTab==="exam"){ const exc=store.get("rad_exam_records",[]);
    B.innerHTML=exc.length?exc.map(e=>`<div class="hist-card" style="margin-top:12px"><div class="hc-t"><span>${e.sub} · 模拟考试</span><span class="tag ${e.pct>=60?'ok':'bad'}">${e.pct}%</span></div>
      <div class="muted" style="font-size:12px;margin-top:5px">${e.date} · 得分 ${e.score}/${e.total}</div></div>`).join("")
      :emptyHTML("history","暂无考试记录","完成一次「模拟考试」后，成绩会显示在这里"); return; }
  if(hist.length){ B.innerHTML=hist.map(h=>`<div class="hist-card"><div class="hc-t"><span>${h.type} · AI 阅片</span><span class="tag ai">${h.time}</span></div><div class="muted" style="font-size:12px;margin-top:5px">${h.desc}</div></div>`).join(""); return; }
  B.innerHTML=emptyHTML("scan-line","还没有阅片记录","去 AI 阅片上传第一张影像吧～","ai");
  const g=B.querySelectorAll("[data-go]"); g.forEach(x=>x.addEventListener("click",()=>go(x.dataset.go)));
}
function emptyHTML(ic,t,d,goTo){
  return `<div class="empty"><div class="e-ic">${icon(ic)}</div><div class="e-t">${t}</div><div class="e-d">${d}</div>
    ${goTo?`<button class="btn btn-soft btn-sm mt16" data-go="${goTo}">去上传</button>`:""}</div>`;
}

/* ---------- 我的 ---------- */
function renderMine(){
  const box=$("#view-mine"); box.style.display="block"; box.style.display="";
  const chk=API.checkConnections();
  box.innerHTML=`
    <div class="card">
      <div class="mine-avatar"><div class="av">放</div>
        <div><div class="nm">放射学习助手</div><div class="sb">本地运行 · 数据存于本机</div></div>
        <span class="tag rose" style="margin-left:auto">${icon("gem")} 永久免费</span></div>
      <div class="mine-status">
        <div class="ms"><div class="v">${num(QUIZ_STATS.total)}</div><div class="l">累计答题</div></div>
        <div class="ms"><div class="v">${rate()}%</div><div class="l">正确率</div></div>
        <div class="ms"><div class="v">${QUIZ_STATS.streak}</div><div class="l">连续打卡</div></div>
      </div>
    </div>
    <div class="card mt16">
      <div class="mine-row" data-s="api">
        <div class="mr-ic" style="background:var(--ai-soft);color:var(--ai-ink)">${icon("settings")}</div>
        <div class="mr-t">模型配置<div class="mr-d">文本 / 视觉 双通道 API Key ${chk.text.ok||chk.vision.ok?"已配置":"未配置"}</div></div>
        <div class="tag ${chk.text.ok||chk.vision.ok?'ok':'warn'}">${chk.text.ok||chk.vision.ok?"已配置":"未配置"}</div>
        <span class="mr-arrow">${icon("chevron-right")}</span>
      </div>
      <div class="mine-row" data-s="selftest">
        <div class="mr-ic" style="background:var(--mint);color:var(--ok)">${icon("shield-check")}</div>
        <div class="mr-t">连接自检<div class="mr-d">测试文本 / 视觉模型连通性</div></div>
        <span class="mr-arrow">${icon("chevron-right")}</span>
      </div>
      <div class="mine-row" data-s="data">
        <div class="mr-ic" style="background:var(--peach);color:var(--warn)">${icon("database")}</div>
        <div class="mr-t">数据管理<div class="mr-d">错题库 ${getWrong().length} · 考试记录 ${store.get('rad_exam_records',[]).length}</div></div>
        <span class="mr-arrow">${icon("chevron-right")}</span>
      </div>
    </div>
    <div class="card mt16">
      <div class="mine-row" data-s="about">
        <div class="mr-ic" style="background:var(--lav);color:#6d5bb0">${icon("info")}</div>
        <div class="mr-t">关于<div class="mr-d">版本 ${window.APP_VERSION||"1.0"} · 纯前端</div></div>
        <span class="mr-arrow">${icon("chevron-right")}</span>
      </div>
    </div>
    <div class="card mt16">
      <div class="li-row"><div><div class="li-t">主题（女生版 / 男生版）</div><div class="li-d">顶部按钮亦可随时切换</div></div>
        <button class="switch ${document.documentElement.getAttribute('data-theme')==='female'?'':'on'}" id="swTheme"><i></i></button></div>
      <div class="li-row"><div><div class="li-t">今日题目</div><div class="li-d">重出今日练习题目（需谨慎，会覆盖当天记录）</div></div>
        <button class="btn btn-sm btn-line" id="mRedo">重出</button></div>
      <div class="li-row"><div><div class="li-t">恢复初始</div><div class="li-d">清空本机全部学习数据</div></div>
        <button class="btn btn-sm btn-line" id="mReset" style="color:var(--bad)">清空</button></div>
    </div>`;
  bindMine(box);
}
function bindMine(box){
  box.querySelectorAll("[data-s]").forEach(r=>r.addEventListener("click",()=>constRun(r.dataset.s)));
  const sw=$("#swTheme"); if(sw)sw.addEventListener("click",()=>toggleTheme(sw));
  const rr=$("#mRedo"); if(rr)rr.addEventListener("click",()=>{ store.del("rad_daily_"+todayStr()); toast("今日题目已重置，可到「练习」重新开始"); });
  const rs=$("#mReset"); if(rs)rs.addEventListener("click",()=>{
    confirmSheet("确认清空全部数据？","将删除答题统计、错题库、考试记录、API 配置与主题设置，且不可恢复。",()=>{
      ["rad_stats","rad_wrong_book","rad_exam_records","rad_read_hist","rad_api"].forEach(store.del);
      QUIZ_STATS={total:0,correct:0,streak:1,last:""}; saveStats(); renderMine(); toast("已清空全部数据");
    });
  });
}
function constRun(s){
  if(s==="api") openAPIConfig();
  else if(s==="selftest") openSelfTest();
  else if(s==="data") openDataMgr();
  else if(s==="about") openSheet(`<div class="sheet-head"><h3>关于</h3><button class="sheet-close" data-x>${icon("x")}</button></div>
    <div class="card"><div class="li-row"><div class="li-t">放射学习助手</div></div>
      <div class="muted" style="font-size:13px;line-height:1.7">面向医学影像（放射）学习的单页应用原型。版本 ${window.APP_VERSION||"1.0"} · 纯前端本地运行，AI 能力需自配 API Key（未配置时自动降级为门禁提示）。</div></div>`), bindSheetClose();
}
function openAPIConfig(){
  const c=API.loadConfig();
  openSheet(`
    <div class="sheet-head"><h3>模型配置</h3><button class="sheet-close" data-x>${icon("x")}</button></div>
    <div class="api-config">
      <div style="font-weight:800;font-size:14px;display:flex;align-items:center;gap:6px">${icon("text")} 文本模型通道</div>
      <div class="ac-field mt8"><div class="ac-l">服务商</div><input class="input" id="txtPro" value="${c.textProvider||""}" placeholder="如 OpenRouter / DeepSeek"/></div>
      <div class="ac-field"><div class="ac-l">模型名</div><input class="input" id="txtModel" value="${c.textModel||""}" placeholder="如 gpt-4o-mini"/></div>
      <div class="ac-field"><div class="ac-l">API Key</div><input class="input" id="txtKey" type="password" value="${c.textKey||""}" placeholder="sk-…"/></div>
      <div class="divider"></div>
      <div style="font-weight:800;font-size:14px;display:flex;align-items:center;gap:6px">${icon("eye")} 视觉模型通道</div>
      <div class="ac-field mt8"><div class="ac-l">服务商</div><input class="input" id="visPro" value="${c.visionProvider||""}" placeholder="如 Volcano Engine / OpenAI"/></div>
      <div class="ac-field"><div class="ac-l">模型名</div><input class="input" id="visModel" value="${c.visionModel||""}" placeholder="如 doubao-vision-pro"/></div>
      <div class="ac-field"><div class="ac-l">API Key</div><input class="input" id="visKey" type="password" value="${c.visionKey||""}" placeholder="…"/></div>
      <div class="muted" style="font-size:12px">配置仅存本机 localStorage，不会上传；用于演示 AI 讲解与阅片门禁流程。</div>
      <button class="btn btn-primary btn-block mt16" id="apiSave">保存配置</button>
      <button class="btn btn-line btn-block mt8" id="apiTest">测试连接</button>
    </div>`);
  $("#apiSave").addEventListener("click",()=>{
    const nc={textProvider:gv("txtPro"),textModel:gv("txtModel"),textKey:gv("txtKey"),visionProvider:gv("visPro"),visionModel:gv("visModel"),visionKey:gv("visKey")};
    API.saveConfig(nc); toast("配置已保存"); closeSheet(); renderMine();
  });
  $("#apiTest").addEventListener("click",()=>{
    const nc={textProvider:gv("txtPro"),textModel:gv("txtModel"),textKey:gv("txtKey"),visionProvider:gv("visPro"),visionModel:gv("visModel"),visionKey:gv("visKey")};
    API.saveConfig(nc);
    openSelfTest(); toast("已按当前表单测试");
  });
  bindSheetClose();
  function gv(id){ const el=document.getElementById(id); return el?el.value.trim():""; }
}
function openSelfTest(){
  const c=API.checkConnections();
  openSheet(`<div class="sheet-head"><h3>连接自检</h3><button class="sheet-close" data-x>${icon("x")}</button></div>
    <div class="card">
      <div class="li-row"><div><div class="li-t">${icon("text")} 文本模型</div><div class="li-d">${c.text.provider?c.text.provider+" · ":"未指定服务商 "}${c.text.model||"未指定模型"}</div></div>
        <span class="tag ${c.text.ok?'ok':'warn'}">${c.text.ok?"连通":"未配置"}</span></div>
      <div class="li-row"><div><div class="li-t">${icon("eye")} 视觉模型</div><div class="li-d">${c.vision.provider?c.vision.provider+" · ":"未指定服务商 "}${c.vision.model||"未指定模型"}</div></div>
        <span class="tag ${c.vision.ok?'ok':'warn'}">${c.vision.ok?"连通":"未配置"}</span></div>
      <div class="divider"></div>
      <div class="muted" style="font-size:12.5px;line-height:1.7">：Key 均未填写时提示「未配置」，不会发起真实请求；原型中任一通道连通即可启用 AI 讲解/阅片（返回演示结果）。</div>
      <button class="btn btn-line btn-block mt16" id="stGoApi">去配置</button></div>`);
  bindSheetClose();
  $("#stGoApi").addEventListener("click",()=>{ closeSheet(); go("mine"); openAPIConfig(); });
}
function openDataMgr(){
  openSheet(`<div class="sheet-head"><h3>数据管理</h3><button class="sheet-close" data-x>${icon("x")}</button></div>
    <div class="card-btnlist">
      <button id="dmWrong">${icon("book-open")} 错题库（${getWrong().length} 题）</button>
      <button id="dmExam">${icon("clipboard-list")} 考试记录（${store.get('rad_exam_records',[]).length} 条）</button>
      <button id="dmClear" style="color:var(--bad)">${icon("trash-2")} 清空全部本地数据</button>
    </div>`);
  bindSheetClose();
  $("#dmWrong").addEventListener("click",()=>{ closeSheet(); S.quizTab="wrong"; go("quiz"); });
  $("#dmExam").addEventListener("click",()=>{ closeSheet(); S.hisTab="exam"; go("history"); });
  $("#dmClear").addEventListener("click",()=>{ closeSheet(); const s=document.getElementById("mReset"); if(s){s.click();} });
}

/* ---------- Theme 切换 ---------- */
function applyTheme(mode){
  document.documentElement.setAttribute("data-theme", mode);
  const male = mode==="male";
  const btn=$("#themeToggle"); if(btn)btn.innerHTML = male?"♀ 女生版":"♂ 男生版";
  const sw=$("#swTheme"); if(sw)sw.classList.toggle("on",male);
  const mc=document.querySelector('meta[name="theme-color"]'); if(mc)mc.setAttribute("content", male?"#081319":"#0B1220");
  try{ localStorage.setItem("rad_theme",male?"male":"female"); }catch(e){}
}
function toggleTheme(sw){
  const cur=document.documentElement.getAttribute("data-theme");
  const next = cur==="male"?"female":"male";
  applyTheme(next);
  if(sw)sw.classList.toggle("on",next==="male");
  toast(cur==="male"?"已切换为女生版 🌸 暖粉":"已切换为男生版 🔷 青绿");
}

/* ---------- 弹层 ---------- */
function openSheet(html){
  closeSheet();
  const mask=document.createElement("div");
  mask.className="modal-mask";
  mask.id="sheetMask";
  mask.innerHTML=`<div class="sheet">${html}</div>`;
  mask.addEventListener("click",e=>{ if(e.target===mask) closeSheet(); });
  document.body.appendChild(mask);
}
function closeSheet(){ const m=document.getElementById("sheetMask"); if(m) m.remove(); }
function bindSheetClose(){ const b=document.querySelector("#sheetMask [data-x]"); if(b)b.addEventListener("click",closeSheet); }

/* ---------- 路由 ---------- */
function go(v){
  const map={home:renderHome, ai:renderAI, dr:renderDR, quiz:renderQuiz, pos:renderPos, history:renderHistory, mine:renderMine};
  if(!map[v]) return;
  // 切换视图与导航
  $$(".view").forEach(x=>x.classList.remove("active"));
  $$(".tab").forEach(x=>x.classList.toggle("active",x.dataset.v===v));
  $("#view-"+v).classList.add("active");
  // 渲染内容（其它容器空闲放空）
  $$(".view").forEach(x=>{ if(x.id!=="view-"+v) x.innerHTML=""; });
  map[v]();
}

/* ---------- 初始化 ---------- */
function init(){
  patchStaticIcons();
  $("#themeToggle").addEventListener("click",()=>toggleTheme());
  $$(".tab").forEach(t=>t.addEventListener("click",()=>go(t.dataset.v)));
  // 恢复主题
  const saved = (()=>{ try{ return localStorage.getItem("rad_theme")||"female"; }catch(e){ return "female"; } })();
  applyTheme(saved);
  go("home");
}
document.addEventListener("DOMContentLoaded",init);
})();