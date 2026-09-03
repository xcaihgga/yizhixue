/* ============================================================
   放射学习助手 · api.js —— API 桩（无真实后端）
   签名/延迟/加载态对齐未来真实接口，替换实现即可接入。
   约定：
     - apiConfig = { textProvider, textModel, textKey, visionProvider, visionModel, visionKey }
       存于 localStorage('rad_api')
     - 未配置密钥 → 返回 { gate:true }（前端弹门禁提示）
   ============================================================ */
const API = (() => {

  function delay(ms){ return new Promise(r => setTimeout(r, ms)); }

  function loadConfig(){
    try { return JSON.parse(localStorage.getItem("rad_api") || "null") || {}; }
    catch(e){ return {}; }
  }
  function saveConfig(c){ try { localStorage.setItem("rad_api", JSON.stringify(c)); }catch(e){} }

  /* 自检：列出文本/视觉两通道配置状态 */
  function checkConnections(){
    const c = loadConfig();
    const text = [c.textProvider, c.textModel, c.textKey].every(Boolean);
    const vis  = [c.visionProvider, c.visionModel, c.visionKey].every(Boolean);
    return {
      text:{ ok:text, provider:c.textProvider||"", model:c.textModel||"", key:!!c.textKey },
      vision:{ ok:vis, provider:c.visionProvider||"", model:c.visionModel||"", key:!!c.visionKey }
    };
  }

  /* 演示用）配置了任一 Key 即放行，返回 canned 回复。
       TODO: 替换为 POST /api/ai/explain
       req: { questionText, options, apiConfig }  resp: { reply }         */
  async function explain(questionText, options){
    await delay(650); // 模拟网络延迟，触发 loading
    const ok = checkConnections().text.ok || checkConnections().vision.ok;
    if(!ok) return { gate:true };
    return { reply: "【AI 详细讲解】" + (qDesc(questionText) + " 结合临床情景分析如下：该题考查" +
      (options||"") + "，核心在把握投照体位与影像判读要点，建议对照教材案例强化记忆。").slice(0,220) };
  }

  /* TODO: 替换为 POST /api/ai/reading（multipart 影像）
       req: { images:[dataURL], modality, apiConfig }  resp: { report, findings }  */
  async function aiReading(images, modality){
    await delay(1200);
    const ok = checkConnections().vision.ok;
    if(!ok) return { gate:true };
    const n = images ? images.length : 0;
    return {
      report: "影像AI分析报告（演示）",
      findings: [
        { label: modality, text: `共接收 ${n} 张${modality}影像，已启用视觉模型通道进行智能分析。` },
        { label: "建议", text: "未检出明确异常征象（演示输出）。震荡与骨密度判读需结合临床；若为筛查建议结合原始DICOM进一步评估。" }
      ]
    };
  }

  function qDesc(t){ return "题干（" + (t||"").slice(0,30) + "…）"; }

  return { loadConfig, saveConfig, checkConnections, explain, aiReading, delay };
})();