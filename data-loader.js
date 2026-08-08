// ============================================================
// data-loader.js - 双数据源（双门控 + 双路径重试）
// 数据源 A: questions.js (script tag defer)  -> window.questions / questionBank.all (4744 道)
// 数据源 B: data.min.json (XHR + 3 次指数退避)  -> window.muscles (58) + window.diseases (218)
// 两者都 OK 后：__dataReady=true + dispatchEvent('dataReady')
// questions.js 加载失败 / 字段不完整 / 30s 超时 -> 也继续尝试 data.min.json 兜底（data.min.json 不含题目），
// 如果检测到永远缺题，会用 error overlay 展示错误清单，不会反复重试
// ============================================================

(function () {
  'use strict';

  var _loadStartTime = Date.now();
  var _jsonTimeout = null;
  var _questionsFuseTimer = null;
  var _jsonRetryCount = 0;
  var _jsonMaxRetries = 3;
  var _jsonLoading = false;
  var _readyFired = false;

  var _gotQuestions = false;   // questions.js ready (areQuestionsUsable === true)
  var _gotMusclesDis = false; // data.min.json ready (muscles.length && diseases.length)
  var _questionsFailed = false; // 永远拿不到题目的标记
  var _jsonFailed = false;

  function setLoadingText(text, sub) {
    try {
      var el = document.getElementById('loadingText');
      var subEl = document.getElementById('loadingSub');
      if (el && text) { el.textContent = text; }
      if (subEl && sub) { subEl.textContent = sub; }
    } catch (e) {}
  }

  function appendErrorDetail(detail) {
    try {
      var list = document.getElementById('errorList');
      if (!list || !detail) { return; }
      var li = document.createElement('div');
      li.className = 'error-item';
      li.textContent = detail;
      list.appendChild(li);
    } catch (e) {}
  }

  function showError(msg, sub) {
    window.__errorShown = true;
    var errOverlay = document.getElementById('errorOverlay');
    var errText = document.getElementById('errorText');
    var errSub = document.getElementById('errorSub');
    var loading = document.getElementById('loadingOverlay');
    if (loading) { loading.style.display = 'none'; }
    if (errText && msg) { errText.textContent = msg; }
    if (errSub && sub) { errSub.textContent = sub; }
    if (errOverlay) { errOverlay.style.display = 'flex'; }
  }

  window.__showLoadError = function (msg, sub, detail) {
    if (detail) { appendErrorDetail(detail); }
    showError(msg, sub);
  };

  function clearJsonTimeout() {
    if (_jsonTimeout) { clearTimeout(_jsonTimeout); _jsonTimeout = null; }
  }
  function clearQuestionsFuse() {
    if (_questionsFuseTimer) { clearTimeout(_questionsFuseTimer); _questionsFuseTimer = null; }
  }

  function parseMuscles(ms) {
    if (!ms || !ms.length) { return []; }
    var result = [];
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i] || {};
      result.push({
        身体区域: m['身体区域'] || '', 肌肉名称: m['肌肉名称'] || '', 主要功能: m['主要功能'] || '',
        常见损伤: m['常见损伤'] || '', 评估方法: m['评估方法'] || '', 诊断标准: m['诊断标准'] || '',
        急性期处理: m['急性期处理'] || '', 康复训练: m['康复训练'] || '', 激痛点: m['激痛点'] || '',
        治疗禁忌: m['治疗禁忌'] || '', 红旗征: m['红旗征'] || '', 关联骨科疾病: m['关联骨科疾病'] || '',
        疾病分类: m['疾病分类'] || '', 疾病分级: m['疾病分级'] || '', 典型症状与体征: m['典型症状与体征'] || '',
        影像学特征: m['影像学特征'] || '', 鉴别诊断: m['鉴别诊断'] || '', 治疗方案: m['治疗方案'] || '',
        康复训练方案: m['康复训练方案'] || '', 康复禁忌动作: m['康复禁忌动作'] || '', 预后转归: m['预后转归'] || ''
      });
    }
    return result;
  }

  function parseDiseases(ds) {
    if (!ds || !ds.length) { return []; }
    var result = [];
    for (var i = 0; i < ds.length; i++) {
      var d = ds[i] || {};
      result.push({
        具体病症: d['具体病症'] || '', 部位: d['部位'] || '', 疾病分类: d['疾病分类'] || '', 疾病分级: d['疾病分级'] || '',
        ICD10编码: d['ICD-10编码'] || d['ICD10编码'] || '', 红旗征: d['红旗征/紧急预警'] || d['红旗征'] || '',
        典型症状与体征: d['典型症状与体征'] || '', 影像学特征: d['影像学特征'] || '', 鉴别诊断: d['鉴别诊断'] || '',
        常用评估量表: d['常用评估量表'] || '', 治疗方案: d['治疗方案'] || '', 手术指征: d['手术指征'] || '',
        药物治疗: d['药物治疗'] || '', 注射治疗: d['注射治疗'] || '', 康复训练方案: d['康复训练方案'] || '',
        康复禁忌动作: d['康复禁忌动作'] || '', 预后转归: d['预后转归'] || '', 常见并发症: d['常见并发症'] || '',
        生活方式调整: d['生活方式调整'] || '', 预防措施: d['预防措施'] || ''
      });
    }
    return result;
  }

  // 题目就绪：兼容两种命名 questionBank.all / questions
  function areQuestionsUsable() {
    try {
      var qs = 0;
      if (Array.isArray(window.questions)) { qs = window.questions.length; }
      if (!qs && window.questionBank && Array.isArray(window.questionBank.all)) { qs = window.questionBank.all.length; }
      return qs > 0;
    } catch (e) { return false; }
  }
  function areMusDisUsable() {
    try {
      return Array.isArray(window.muscles) && window.muscles.length > 0
          && Array.isArray(window.diseases) && window.diseases.length > 0;
    } catch (e) { return false; }
  }
  function buildQuestionBankFromGlobal() {
    try {
      if (Array.isArray(window.questions)) {
        window.questionBank = { all: window.questions };
      }
    } catch (e) {}
  }

  function tryFireReady(reason) {
    try {
      if (_readyFired) { return; }
      if (!areQuestionsUsable()) { _gotQuestions = false; return; }
      if (!areMusDisUsable())   { _gotMusclesDis = false; return; }
      _gotQuestions = true;
      _gotMusclesDis = true;
      _readyFired = true;
      clearJsonTimeout();
      clearQuestionsFuse();
      buildQuestionBankFromGlobal();
      window.__dataReady = true;
      try { window.dispatchEvent(new Event('dataReady')); } catch (eEv) {}
      setLoadingText('加载完成', '耗时 ' + (Date.now() - _loadStartTime) + 'ms · ' + (reason || ''));
    } catch (e) {
      console.warn('YZX tryFireReady fail:', e);
    }
  }

  function finalizeIfDeadEnd() {
    if (_readyFired) { return; }
    if (!_questionsFailed && !_jsonFailed) { return; }
    var missing = [];
    if (_questionsFailed) { missing.push('题目(questions.js)'); }
    if (_jsonFailed)      { missing.push('肌肉/疾病(data.min.json)'); }
    appendErrorDetail('以下数据源失败：' + missing.join('、'));
    showError('加载失败', '有部分数据源加载失败，请检查网络后重试');
  }

  // ============================================================
  // A 端：questions.js 轮询 (100ms 一次，最多 45s) + onerror 事件
  // ============================================================
  var QUESTIONS_WAIT_MS = 45000;
  function pollQuestions() {
    if (tryFireReady()) { return; }
    if (areQuestionsUsable()) {
      _gotQuestions = true;
      if (tryFireReady()) { return; }
    }
    var tries = 0;
    var MAX_POLL = Math.ceil(QUESTIONS_WAIT_MS / 100);
    var timer = setInterval(function () {
      tries++;
      try {
        if (_readyFired) { clearInterval(timer); return; }
        if (!_gotQuestions && areQuestionsUsable()) {
          _gotQuestions = true;
          buildQuestionBankFromGlobal();
          setLoadingText('题库已准备', '等待肌骨知识库...');
          if (tryFireReady('双数据源就绪')) { clearInterval(timer); return; }
        }
      } catch (e) {}
      if (tries >= MAX_POLL) {
        clearInterval(timer);
        if (!areQuestionsUsable()) {
          _questionsFailed = true;
          appendErrorDetail('题库加载超时 (45s)，请点击"重新加载"');
          finalizeIfDeadEnd();
        }
      }
    }, 100);
  }

  try {
    window.addEventListener('questionsScriptError', function () {
      if (_readyFired) { return; }
      appendErrorDetail('questions.js 加载失败');
      _questionsFailed = true;
      finalizeIfDeadEnd();
    });
  } catch (eList) {}

  // ============================================================
  // B 端：data.min.json (XHR 25s timeout, 3 次指数退避)
  // ============================================================
  function loadJson() {
    if (_jsonLoading) { return; }
    if (_readyFired) { return; }
    if (_gotMusclesDis) { return; }
    _jsonLoading = true;
    setLoadingText('加载肌骨知识库...', '第 ' + (_jsonRetryCount + 1) + '/' + (_jsonMaxRetries + 1) + ' 次');

    clearJsonTimeout();
    _jsonTimeout = setTimeout(function () {
      if (!_gotMusclesDis && !_readyFired) {
        handleJsonFailure('知识库加载超时', '网络不稳定，准备下一次尝试', 'data.min.json 超时 30s');
      }
    }, 30000);

    try {
      var xhr = new XMLHttpRequest();
      var url = 'data.min.json?v=' + Date.now();
      xhr.open('GET', url, true);
      xhr.responseType = 'json';

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          _jsonLoading = false;
          clearJsonTimeout();
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              var data = xhr.response;
              if (!data) { data = JSON.parse(xhr.responseText); }
              onJsonLoaded(data);
            } catch (e) {
              handleJsonFailure('知识库解析失败', '数据格式错误', e && e.message);
            }
          } else {
            handleJsonFailure('知识库加载失败', 'HTTP ' + xhr.status + ' ' + (xhr.statusText || ''), 'status=' + xhr.status);
          }
        }
      };
      xhr.onerror = function () {
        _jsonLoading = false;
        clearJsonTimeout();
        handleJsonFailure('网络错误', '无法访问数据文件，请检查网络', 'XHR network error');
      };
      xhr.ontimeout = function () {
        _jsonLoading = false;
        clearJsonTimeout();
        handleJsonFailure('请求超时', '服务器响应过慢', 'XHR timeout 25s');
      };
      xhr.timeout = 25000;
      xhr.send();
    } catch (e) {
      _jsonLoading = false;
      clearJsonTimeout();
      handleJsonFailure('加载失败', e.message || '未知错误', e && e.stack);
    }
  }

  function handleJsonFailure(msg, sub, detail) {
    if (_readyFired) { return; }
    appendErrorDetail(detail || msg);
    _jsonRetryCount++;
    if (_jsonRetryCount <= _jsonMaxRetries) {
      var delay = Math.pow(2, _jsonRetryCount) * 1000;
      setTimeout(loadJson, delay);
    } else {
      _jsonFailed = true;
      showError(msg, sub);
      finalizeIfDeadEnd();
    }
  }

  function onJsonLoaded(data) {
    try {
      setLoadingText('知识库解析中...', '正在整理肌肉/疾病条目');
      var ms = (data && data.ms) ? data.ms : [];
      var ds = (data && data.ds) ? data.ds : [];
      window.muscles = parseMuscles(ms);
      window.diseases = parseDiseases(ds);

      if (areMusDisUsable()) {
        _gotMusclesDis = true;
        setLoadingText('知识库已准备', '题库已加载 ' + (areQuestionsUsable() ? '完成' : '中...'));
        tryFireReady('双数据源就绪');
      } else {
        handleJsonFailure('知识库字段缺失', 'data.min.json 缺少肌肉/疾病数据', 'ms=' + ms.length + ', ds=' + ds.length);
      }
    } catch (e) {
      handleJsonFailure('知识库处理异常', e.message || '解析异常', e && e.stack);
    }
  }

  // ============================================================
  // 启动：并行跑 A + B
  // ============================================================
  function boot() {
    try {
      if (_readyFired) { return; }
      setLoadingText('正在加载...', '题库 + 知识库并行拉取');
      // A 端
      if (areQuestionsUsable()) {
        _gotQuestions = true;
        buildQuestionBankFromGlobal();
        tryFireReady();
      }
      if (!_readyFired) { pollQuestions(); }
      // B 端
      if (areMusDisUsable()) {
        _gotMusclesDis = true;
        tryFireReady();
      }
      if (!_readyFired) { loadJson(); }
    } catch (e) {
      appendErrorDetail('boot 初始化异常：' + (e && e.message));
      showError('初始化错误', e.message || '启动异常');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
