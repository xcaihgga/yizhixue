// ============================================================
// app.js - 医智学 肌骨康复学习软件主逻辑
// 纯 ES5 语法，兼容旧浏览器
// ============================================================

// ===== 第一层防护：全局错误捕获 =====
(function () {
  var _originalErrorHandler = window.onerror;
  var errorCap = [];
  window.__errorCaptured = errorCap;

  function appendError(msg) {
    try {
      errorCap.push('[' + (new Date()).toLocaleTimeString() + '] ' + (msg || 'Unknown'));
      if (errorCap.length > 30) { errorCap.shift(); }
      var listEl = document.getElementById('errorList');
      if (listEl) {
        var html = '';
        for (var i = 0; i < errorCap.length; i++) {
          html += '<div class="err-item">' + escapeHtml(errorCap[i]) + '</div>';
        }
        listEl.innerHTML = html;
      }
    } catch (e) {}
  }
  window.__appendError = appendError;

  function showError(title, sub) {
    try {
      var errOverlay = document.getElementById('errorOverlay');
      if (!errOverlay) { return; }
      var loading = document.getElementById('loadingOverlay');
      if (loading) { loading.style.display = 'none'; }
      if (title) {
        var errText = document.getElementById('errorText');
        if (errText) { errText.textContent = title; }
      }
      if (sub) {
        var errSub = document.getElementById('errorSub');
        if (errSub) { errSub.textContent = sub; }
      }
      errOverlay.style.display = 'flex';
    } catch (e) {}
  }
  window.__showLoadError = showError;

  // 绑定「暂不处理」按钮
  function bindDismiss() {
    try {
      var btn = document.getElementById('errorDismissBtn');
      if (btn && !btn.__bound) {
        btn.__bound = true;
        btn.addEventListener('click', function () {
          var errOverlay = document.getElementById('errorOverlay');
          if (errOverlay) { errOverlay.style.display = 'none'; }
        });
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindDismiss);
  } else {
    bindDismiss();
  }

  window.onerror = function (message, source, lineno, colno, error) {
    try {
      var errMsg = (typeof message === 'string') ? message : 'Unknown error';
      if (source) { errMsg += ' @ ' + source; }
      if (lineno) { errMsg += ':' + lineno; }
      console.error('YZX Error:', errMsg);
      appendError(errMsg);
      showError('应用运行错误', '请刷新页面重试，或点击「暂不处理」继续使用');
    } catch (e) {
      console.error('Error handler itself failed:', e);
    }
    if (_originalErrorHandler) {
      return _originalErrorHandler(message, source, lineno, colno, error);
    }
    return true;
  };

  window.addEventListener('unhandledrejection', function (event) {
    try {
      var reason = (event && event.reason) ? String(event.reason) : 'Unknown promise rejection';
      console.error('YZX Unhandled Promise Rejection:', reason);
      appendError('Unhandled: ' + reason);
      showError('应用运行错误', '请刷新页面重试');
    } catch (e) {}
  });
})();

// ===== 第二层防护：localStorage 溢出保护 =====
(function () {
  // 重要顺序：从「影响最小的键」逐步清到「所有应用键」
  var PROGRESSIVE_KEYS = [
    'yizhixue_stats',
    'yizhixue_daily',
    'yizhixue_wrong',
    'yizhixue_state'
  ];

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn('YZX localStorage overflow. Progressive cleanup...');
        // 步骤1: 先把 wrongQuestionBank 内部裁剪（全局变量）
        try {
          if (typeof window !== 'undefined' && window.wrongQuestionBank && Array.isArray(window.wrongQuestionBank)) {
            if (window.wrongQuestionBank.length > 100) {
              window.wrongQuestionBank = window.wrongQuestionBank.slice(-100);
              try {
                localStorage.setItem('yizhixue_wrong', JSON.stringify(window.wrongQuestionBank));
              } catch (eIgnore) {}
            }
          }
        } catch (e1) {}
        // 步骤2: 渐进式按顺序删除非关键键（stats → daily → wrong → state）
        for (var i = 0; i < PROGRESSIVE_KEYS.length; i++) {
          var k = PROGRESSIVE_KEYS[i];
          if (k === key) { continue; }
          try { localStorage.removeItem(k); } catch (e2) {}
          try {
            localStorage.setItem(key, value);
            return true;
          } catch (e3) { /* continue next key */ }
        }
        // 步骤3: 清所有 yzx_ 前缀的未知残余键
        try {
          var keysToRemove = [];
          for (var j = 0; j < localStorage.length; j++) {
            var kk = localStorage.key(j);
            if (kk && kk.indexOf('yizhixue_') === 0) { keysToRemove.push(kk); }
          }
          for (var m = 0; m < keysToRemove.length; m++) {
            try { localStorage.removeItem(keysToRemove[m]); } catch (e4) {}
          }
        } catch (e5) {}
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (e6) {
          console.warn('YZX localStorage full even after cleanup');
          return false;
        }
      }
      return false;
    }
  }

  function safeGetItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeRemoveItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }

  window.__safeStorage = {
    set: safeSetItem,
    get: safeGetItem,
    remove: safeRemoveItem
  };
})();

// ===== 第三层防护：数组边界检查和空值保护 =====
function safeIndex(arr, idx) {
  if (!arr || !Array.isArray(arr)) { return undefined; }
  if (idx < 0 || idx >= arr.length) { return undefined; }
  return arr[idx];
}

function safeProp(obj, prop) {
  if (!obj || typeof obj !== 'object') { return ''; }
  return obj[prop] || '';
}

function safeLength(arr) {
  if (!arr || !Array.isArray(arr)) { return 0; }
  return arr.length;
}

function safeString(val) {
  if (val === null || val === undefined) { return ''; }
  return String(val);
}

function safeParseJSON(str) {
  if (!str || typeof str !== 'string') { return null; }
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn('YZX safeParseJSON failed:', e);
    return null;
  }
}

function safeGetElement(id) {
  if (!id || typeof id !== 'string') { return null; }
  try {
    return document.getElementById(id);
  } catch (e) {
    console.warn('YZX safeGetElement failed:', e);
    return null;
  }
}

function safeQuerySelector(selector) {
  if (!selector || typeof selector !== 'string') { return null; }
  try {
    return document.querySelector(selector);
  } catch (e) {
    console.warn('YZX safeQuerySelector failed:', e);
    return null;
  }
}

function safeQuerySelectorAll(selector) {
  if (!selector || typeof selector !== 'string') { return []; }
  try {
    var result = document.querySelectorAll(selector);
    return Array.prototype.slice.call(result);
  } catch (e) {
    console.warn('YZX safeQuerySelectorAll failed:', e);
    return [];
  }
}

function safeSetInnerHTML(el, html) {
  if (!el || typeof el.innerHTML === 'undefined') { return; }
  try {
    el.innerHTML = html;
  } catch (e) {
    console.warn('YZX safeSetInnerHTML failed:', e);
  }
}

function safeSetTextContent(el, text) {
  if (!el || typeof el.textContent === 'undefined') { return; }
  try {
    el.textContent = text;
  } catch (e) {
    console.warn('YZX safeSetTextContent failed:', e);
  }
}

// ===== 全局状态 =====
var state = {
  coins: 0,
  exp: 0,
  level: 1,
  studyDays: 0,
  completionCount: 0,
  mastery: {},
  lastStudyDate: null,
  streak: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  dailyDoneDate: null,   // 每日打卡完成日期
  dailyDoneCount: 0,     // 当日打卡次数
  examDoneCount: 0,      // 考试完成次数
  tagStats: {},          // 各标签答题统计 {tag: {total, correct}}
  badges: {}             // 已解锁徽章
};

var examModeState = {
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  wrongQuestions: [],
  startTime: 0,
  elapsedTime: 0,
  timerInterval: null,
  isPaused: false,
  mode: 'daily',         // 'daily' | 'exam'
  userAnswers: [],
  finished: false
};

var wrongQuestionBank = [];
var navHistory = [];
var currentTab = 'home';
var currentCategory = 'all';   // 首页分类筛选
var currentLearningMethod = null;
var flashcardCtx = null;       // 闪卡上下文 {points, index, title}

// 知识点字段定义（用于闪卡和详情）
var MUSCLE_FIELDS = [
  { key: '身体区域', label: '身体区域' },
  { key: '主要功能', label: '主要功能' },
  { key: '常见损伤', label: '常见损伤' },
  { key: '评估方法', label: '评估方法' },
  { key: '诊断标准', label: '诊断标准' },
  { key: '急性期处理', label: '急性期处理' },
  { key: '康复训练', label: '康复训练' },
  { key: '激痛点', label: '激痛点' },
  { key: '治疗禁忌', label: '治疗禁忌' },
  { key: '红旗征', label: '红旗征' },
  { key: '关联骨科疾病', label: '关联骨科疾病' },
  { key: '疾病分类', label: '疾病分类' },
  { key: '疾病分级', label: '疾病分级' },
  { key: '典型症状与体征', label: '典型症状与体征' },
  { key: '影像学特征', label: '影像学特征' },
  { key: '鉴别诊断', label: '鉴别诊断' },
  { key: '治疗方案', label: '治疗方案' },
  { key: '康复训练方案', label: '康复训练方案' },
  { key: '康复禁忌动作', label: '康复禁忌动作' },
  { key: '预后转归', label: '预后转归' }
];

var DISEASE_FIELDS = [
  { key: '部位', label: '部位' },
  { key: '疾病分类', label: '疾病分类' },
  { key: '疾病分级', label: '疾病分级' },
  { key: 'ICD10编码', label: 'ICD-10 编码' },
  { key: '红旗征', label: '红旗征/紧急预警' },
  { key: '典型症状与体征', label: '典型症状与体征' },
  { key: '影像学特征', label: '影像学特征' },
  { key: '鉴别诊断', label: '鉴别诊断' },
  { key: '常用评估量表', label: '常用评估量表' },
  { key: '治疗方案', label: '治疗方案' },
  { key: '手术指征', label: '手术指征' },
  { key: '药物治疗', label: '药物治疗' },
  { key: '注射治疗', label: '注射治疗' },
  { key: '康复训练方案', label: '康复训练方案' },
  { key: '康复禁忌动作', label: '康复禁忌动作' },
  { key: '预后转归', label: '预后转归' },
  { key: '常见并发症', label: '常见并发症' },
  { key: '生活方式调整', label: '生活方式调整' },
  { key: '预防措施', label: '预防措施' }
];

// 学习方法定义
var LEARNING_METHODS = {
  feynman: {
    name: '费曼学习法',
    icon: '🎓',
    desc: '用通俗语言讲清楚',
    steps: [
      '选择一个知识点卡片开始学习',
      '仔细阅读该知识点的所有内容',
      '合上卡片，用自己的话向他人解释',
      '遇到卡壳的地方回到原文重新学习',
      '通过做题检验掌握程度'
    ]
  },
  simon: {
    name: '西蒙学习法',
    icon: '🔬',
    desc: '先框架后细节',
    steps: [
      '先浏览知识点的整体框架结构',
      '逐个学习每个细节字段',
      '完成配套练习题巩固',
      '查看反馈，针对薄弱点加强',
      '定期复习错题本'
    ]
  },
  sq3r: {
    name: 'SQ3R学习法',
    icon: '📚',
    desc: '浏览提问阅读背诵复习',
    steps: [
      'Survey 浏览：快速浏览知识点结构',
      'Question 提问：带着问题去阅读',
      'Read 阅读：精读每个字段内容',
      'Recite 背诵：合上卡片复述要点',
      'Review 复习：通过做题回顾'
    ]
  },
  quiz: {
    name: '刷题模式',
    icon: '⚡',
    desc: '直接开始做题',
    steps: [
      '从题库随机抽取题目',
      '逐题作答，即时反馈对错',
      '答错的题目自动加入错题本',
      '完成查看得分和正确率',
      '针对错题反复练习'
    ]
  }
};

// ============================================================
// 工具函数
// ============================================================

// HTML 转义，防止 XSS
function escapeHtml(text) {
  if (text === null || text === undefined) { return ''; }
  var s = String(text);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 截断文本
function truncate(text, len) {
  if (!text) { return ''; }
  var s = String(text);
  if (s.length <= len) { return s; }
  return s.substring(0, len) + '...';
}

// Fisher-Yates 洗牌算法
function shuffleArray(arr) {
  var result = arr.slice();
  for (var i = result.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

function isQuestionBankReady() {
  if (!window.__dataReady) { return false; }
  var qb = safeProp(window, 'questionBank');
  if (qb && qb.all && safeLength(qb.all) > 0) { return true; }
  if (window.questions && safeLength(window.questions) > 0) { return true; }
  return false;
}

function getRandomQuestions(count) {
  if (!isQuestionBankReady()) { return []; }
  var bank = [];
  var qb = safeProp(window, 'questionBank');
  if (qb && qb.all && safeLength(qb.all) > 0) {
    bank = qb.all;
  } else if (window.questions && safeLength(window.questions) > 0) {
    bank = window.questions;
  }
  if (!bank || safeLength(bank) === 0) { return []; }
  var shuffled = shuffleArray(bank);
  var n = Math.min(count || 0, safeLength(shuffled));
  if (n <= 0) { return []; }
  return shuffled.slice(0, n);
}

// 获取今天日期字符串 YYYY-MM-DD
function getTodayStr() {
  var d = new Date();
  var y = d.getFullYear();
  var m = d.getMonth() + 1;
  var day = d.getDate();
  if (m < 10) { m = '0' + m; }
  if (day < 10) { day = '0' + day; }
  return y + '-' + m + '-' + day;
}

// P2-8: 只在真正「完成一次打卡或一次考试」时累加 studyDays/streak/dailyDoneDate
function creditStudyDay() {
  try {
    var today = getTodayStr();
    // 只更新日期重置位 + 当日次数计数，studyDays 只在今天第一次完成时 +1
    if (state.dailyDoneDate !== today) {
      // 计算连续：只有昨天真的完成过 (lastStudyDate 是昨天) 才续上
      if (state.lastStudyDate) {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        var ym = yesterday.getMonth() + 1;
        var yd = yesterday.getDate();
        if (ym < 10) { ym = '0' + ym; }
        if (yd < 10) { yd = '0' + yd; }
        var yStr = yesterday.getFullYear() + '-' + ym + '-' + yd;
        if (state.lastStudyDate === yStr) {
          state.streak = state.streak + 1;
        } else if (state.lastStudyDate !== today) {
          state.streak = 1;
        }
      } else {
        state.streak = 1;
      }
      state.studyDays = state.studyDays + 1;
      state.lastStudyDate = today;
    }
    state.dailyDoneDate = today;
    saveStateImmediate();
  } catch (e) {
    console.warn('YZX creditStudyDay failed:', e);
  }
}

// ============================================================
// localStorage 持久化
// ============================================================

function loadState() {
  try {
    var safeStorage = window.__safeStorage || { get: function(k) { return localStorage.getItem(k); } };
    var raw = safeStorage.get('yizhixue_state');
    if (raw) {
      var saved = safeParseJSON(raw);
      if (saved && typeof saved === 'object') {
        for (var k in saved) {
          if (saved.hasOwnProperty(k)) {
            state[k] = saved[k];
          }
        }
      }
      // 结构兜底：新增字段缺失时填默认值，防止旧存档导致崩溃
      if (typeof state.badges !== 'object' || state.badges === null) { state.badges = {}; }
      if (typeof state.tagStats !== 'object' || state.tagStats === null) { state.tagStats = {}; }
      if (typeof state.streak !== 'number') { state.streak = 0; }
      if (typeof state.studyDays !== 'number') { state.studyDays = 0; }
      if (typeof state.dailyDoneCount !== 'number') { state.dailyDoneCount = 0; }
      if (typeof state.examDoneCount !== 'number') { state.examDoneCount = 0; }
      if (typeof state.mastery !== 'object' || state.mastery === null) { state.mastery = {}; }
    }
    var wrongRaw = safeStorage.get('yizhixue_wrong');
    if (wrongRaw) {
      var wrongSaved = safeParseJSON(wrongRaw);
      if (wrongSaved && Array.isArray(wrongSaved) && wrongSaved.length) {
        wrongQuestionBank = wrongSaved.slice(0, 200);
      }
    }
  } catch (e) {
    console.warn('YZX loadState failed:', e);
  }
}

// ========== P0-3: saveState 防抖 / 立即写 / 卸载前刷盘 ==========
var _saveStateTimer = null;
var _saveStatePending = false;
var SAVE_DEBOUNCE_MS = 400;
var WRONG_HARD_LIMIT = 200;

function _doSaveStateNow() {
  try {
    _saveStatePending = false;
    if (_saveStateTimer) {
      clearTimeout(_saveStateTimer);
      _saveStateTimer = null;
    }
    var safeStorage = window.__safeStorage || { set: function(k, v) { localStorage.setItem(k, v); } };
    if (wrongQuestionBank.length > WRONG_HARD_LIMIT) {
      wrongQuestionBank = wrongQuestionBank.slice(-WRONG_HARD_LIMIT);
    }
    safeStorage.set('yizhixue_state', JSON.stringify(state));
    safeStorage.set('yizhixue_wrong', JSON.stringify(wrongQuestionBank));
  } catch (e) {
    console.warn('YZX _doSaveStateNow failed:', e);
  }
}

function saveState() {
  _saveStatePending = true;
  if (_saveStateTimer) {
    clearTimeout(_saveStateTimer);
    _saveStateTimer = null;
  }
  _saveStateTimer = setTimeout(function () {
    _doSaveStateNow();
  }, SAVE_DEBOUNCE_MS);
}

function saveStateImmediate() {
  if (_saveStateTimer) {
    clearTimeout(_saveStateTimer);
    _saveStateTimer = null;
  }
  _doSaveStateNow();
}

function flushState() {
  if (_saveStatePending) {
    saveStateImmediate();
  }
}

// 更新等级（根据经验值）
function updateLevel() {
  // 每 100 经验升一级
  var newLevel = Math.floor(state.exp / 100) + 1;
  if (newLevel > state.level) {
    state.level = newLevel;
  }
}

// ============================================================
// 初始化
// ============================================================

function init() {
  try {
    loadState();
    updateLevel();

    // P0-2: 应用后台时强制暂停考试计时器，避免时间乱跳
    function onVisibilityOrHide() {
      try {
        var hidden = (typeof document.hidden !== 'undefined') ? document.hidden : false;
        if (hidden) { pauseExamTimer(); } else { resumeExamTimer(); }
      } catch (e1) {}
      try { flushState(); } catch (e2) {}
    }
    try { document.addEventListener('visibilitychange', onVisibilityOrHide); } catch (e3) {}
    try { window.addEventListener('pagehide', function () { try { pauseExamTimer(); } catch (e4) {} try { flushState(); } catch (e5) {} }); } catch (e6) {}
    // P0-3: 关闭页面前把 pending 的 saveState 立刻写入磁盘，避免数据丢失
    try { window.addEventListener('beforeunload', function () { try { flushState(); } catch (e7) {} }); } catch (e8) {}

    window.addEventListener('dataReady', onAppReady);

    if (window.__dataReady) {
      onAppReady();
    }

    setTimeout(function () {
      try {
        if (!window.__dataReady) {
          if (window.__showLoadError) {
            window.__showLoadError('加载超时', '15秒内未完成加载，请刷新重试');
          } else {
            var overlay = safeGetElement('loadingOverlay');
            var err = safeGetElement('errorOverlay');
            if (overlay) { overlay.style.display = 'none'; }
            if (err) { err.style.display = 'flex'; }
          }
        }
      } catch (e) {
        console.error('YZX init timeout check failed:', e);
      }
    }, 15000);
  } catch (e) {
    console.error('YZX init failed:', e);
    var errOverlay = safeGetElement('errorOverlay');
    var loading = safeGetElement('loadingOverlay');
    if (loading) { loading.style.display = 'none'; }
    if (errOverlay) { errOverlay.style.display = 'flex'; }
  }
}

function onAppReady() {
  try {
    if (!window.muscles || !window.diseases) { return; }

    var overlay = safeGetElement('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hide');
      setTimeout(function () {
        try {
          overlay.style.display = 'none';
        } catch (e) {}
      }, 300);
    }

    checkDailyRefresh();
    updateStats();
    renderHomeContent();
  } catch (e) {
    console.error('YZX onAppReady failed:', e);
    var errOverlay = safeGetElement('errorOverlay');
    var loading = safeGetElement('loadingOverlay');
    if (loading) { loading.style.display = 'none'; }
    if (errOverlay) { errOverlay.style.display = 'flex'; }
  }
}

// 每日刷新逻辑（只重置当日次数，不自动累加 studyDays/streak；真正完成走 creditStudyDay）
function checkDailyRefresh() {
  try {
    var today = getTodayStr();
    if (state.dailyDoneDate !== today) {
      // 新的一天：仅重置当日打卡次数
      state.dailyDoneCount = 0;
      saveState();
    }
    // 结构兜底（旧存档升级兼容）
    if (typeof state.badges !== 'object' || state.badges === null) { state.badges = {}; }
  } catch (e) {
    console.warn('YZX checkDailyRefresh failed:', e);
  }
}

// ============================================================
// 顶部统计更新
// ============================================================

function updateStats() {
  updateLevel();
  var coinEl = document.getElementById('coinCount');
  var dayEl = document.getElementById('studyDays');
  var levelEl = document.getElementById('levelDisplay');
  if (coinEl) { coinEl.textContent = state.coins; }
  if (dayEl) { dayEl.textContent = state.studyDays; }
  if (levelEl) { levelEl.textContent = state.level; }
}

// ============================================================
// Tab 切换 & 导航历史
// ============================================================

function switchTab(tab) {
  try {
    if (!tab || typeof tab !== 'string') { return; }
    currentTab = tab;

    // P0-2: 切 Tab 时必须立即清理考试计时器，避免泄漏
    if (examModeState && examModeState.timerInterval) {
      clearInterval(examModeState.timerInterval);
      examModeState.timerInterval = null;
    }
    // 同步移除可能残留的暂停遮罩（防止 DOM 泄漏）
    try {
      var orphanMask = safeGetElement('pauseMask');
      if (orphanMask && orphanMask.parentNode) { orphanMask.parentNode.removeChild(orphanMask); }
    } catch (eMask) {}

    var pages = safeQuerySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      try {
        pages[i].classList.remove('active');
      } catch (e) {}
    }

    var target = safeGetElement('page-' + tab);
    if (target) { target.classList.add('active'); }

    var tabs = safeQuerySelectorAll('.bottom-nav .tab');
    for (var j = 0; j < tabs.length; j++) {
      try {
        tabs[j].classList.remove('active');
        if (tabs[j].getAttribute('data-tab') === tab) {
          tabs[j].classList.add('active');
        }
      } catch (e) {}
    }

    navHistory = [tab];
    setBackButton(false);

    if (tab === 'home') {
      renderHomeContent();
    } else if (tab === 'daily') {
      renderDailyStart();
    } else if (tab === 'exam') {
      renderExamStart();
    } else if (tab === 'wrong') {
      renderWrongQuestions();
    } else if (tab === 'stats') {
      renderStats();
    }

    window.scrollTo(0, 0);
  } catch (e) {
    console.error('YZX switchTab failed:', e);
  }
}

// P0-2: 计时器统一生命周期（避免同一时刻多个 setInterval 叠加）
function pauseExamTimer() {
  try {
    if (examModeState.mode !== 'exam') { return; }
    if (examModeState.isPaused) { return; }
    examModeState.isPaused = true;
    examModeState.pauseStart = Date.now();
  } catch (e) {}
}

function resumeExamTimer() {
  try {
    if (examModeState.mode !== 'exam') { return; }
    if (!examModeState.isPaused) { return; }
    examModeState.isPaused = false;
    if (examModeState.pauseStart) {
      examModeState.elapsedTime += Date.now() - examModeState.pauseStart;
      examModeState.pauseStart = 0;
    }
  } catch (e) {}
}

function pushNav(view) {
  navHistory.push(view);
  setBackButton(true);
}

function navBack() {
  // 从结果页/答题页返回到当前 Tab 的开始页
  if (examModeState.mode === 'exam') {
    // 停止计时器
    if (examModeState.timerInterval) {
      clearInterval(examModeState.timerInterval);
      examModeState.timerInterval = null;
    }
    var mask = document.getElementById('pauseMask');
    if (mask) { mask.parentNode.removeChild(mask); }
    examModeState.finished = false;
    renderExamStart();
  } else {
    renderDailyStart();
  }
  // 重置导航历史
  navHistory = [currentTab];
  setBackButton(false);
  window.scrollTo(0, 0);
}

function setBackButton(show) {
  var btn = document.getElementById('backBtn');
  if (btn) {
    btn.style.display = show ? 'flex' : 'none';
  }
}

// ============================================================
// 首页渲染
// ============================================================

function renderHomeContent() {
  try {
    var page = safeGetElement('page-home');
    if (!page) { return; }

    var html = '';

    html += '<div class="section-title"><span class="dot"></span>选择学习方法</div>';
    html += '<div class="method-grid">';
    html += buildMethodCard('feynman');
    html += buildMethodCard('simon');
    html += buildMethodCard('sq3r');
    html += buildMethodCard('quiz');
    html += '</div>';

    html += '<div class="section-title"><span class="dot"></span>知识库</div>';
    html += '<div class="tab-bar">';
    html += '<div class="cat-tab ' + (currentCategory === 'all' ? 'active' : '') + '" onclick="filterCategory(\'all\')">全部</div>';
    html += '<div class="cat-tab ' + (currentCategory === 'muscle' ? 'active' : '') + '" onclick="filterCategory(\'muscle\')">肌肉系统</div>';
    html += '<div class="cat-tab ' + (currentCategory === 'disease' ? 'active' : '') + '" onclick="filterCategory(\'disease\')">常见疾病</div>';
    html += '</div>';

    // P2-9: 先用容器占位，卡片分批 DOM 渲染（每批 40 张，通过 setTimeout(0) 让出主线程）
    html += '<div id="kpList"><div class="empty-state" id="kpLoading"><div class="e-icon">🗂</div><div class="e-text">正在生成知识卡片...</div></div></div>';

    safeSetInnerHTML(page, html);
    // 启动分批渲染
    renderKnowledgeCardsInBatches();
  } catch (e) {
    console.error('YZX renderHomeContent failed:', e);
  }
}

// P2-9: 分批渲染知识点卡片，每批 40 张
function renderKnowledgeCardsInBatches() {
  try {
    var listEl = safeGetElement('kpList');
    if (!listEl) { return; }
    var muscles = window.muscles || [];
    var diseases = window.diseases || [];

    var showMuscle = (currentCategory === 'all' || currentCategory === 'muscle');
    var showDisease = (currentCategory === 'all' || currentCategory === 'disease');

    // 先把所有卡片的 HTML 字符串算好（这是最耗时的部分）
    var batches = [];
    var currentChunk = '';
    var countInChunk = 0;
    var CHUNK_SIZE = 40;

    if (showMuscle) {
      for (var i = 0; i < muscles.length; i++) {
        try {
          currentChunk += buildMuscleCard(muscles[i], i);
        } catch (eBuild) {
          console.warn('YZX buildMuscleCard fail i=' + i, eBuild);
        }
        countInChunk++;
        if (countInChunk >= CHUNK_SIZE) {
          batches.push(currentChunk);
          currentChunk = '';
          countInChunk = 0;
        }
      }
    }
    var diseaseIndexOffset = muscles ? muscles.length : 0;
    if (showDisease) {
      for (var j = 0; j < diseases.length; j++) {
        try {
          currentChunk += buildDiseaseCard(diseases[j], diseaseIndexOffset + j);
        } catch (eBuild2) {
          console.warn('YZX buildDiseaseCard fail j=' + j, eBuild2);
        }
        countInChunk++;
        if (countInChunk >= CHUNK_SIZE) {
          batches.push(currentChunk);
          currentChunk = '';
          countInChunk = 0;
        }
      }
    }
    if (currentChunk.length > 0) { batches.push(currentChunk); }

    if (batches.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="e-icon">📭</div><div class="e-text">暂无数据</div></div>';
      return;
    }

    // 先把 loading 占位去掉
    listEl.innerHTML = '';

    var bi = 0;
    function appendNextBatch() {
      try {
        if (bi >= batches.length) { return; }
        var fragWrapper = document.createElement('div');
        fragWrapper.innerHTML = batches[bi];
        // 把所有子节点一个个移入，避免一次性 innerHTML = fullBigString 阻塞太久
        while (fragWrapper.firstChild) {
          listEl.appendChild(fragWrapper.firstChild);
        }
        bi++;
        if (bi < batches.length) {
          setTimeout(appendNextBatch, 0);
        }
      } catch (eBatch) {
        console.warn('YZX appendNextBatch fail bi=' + bi, eBatch);
      }
    }
    // 首帧第一批（让出一次事件循环，避免阻塞页面动画）
    setTimeout(appendNextBatch, 0);
  } catch (e) {
    console.error('YZX renderKnowledgeCardsInBatches failed:', e);
    // 保底：回退到一次性 build
    try {
      var listEl2 = safeGetElement('kpList');
      if (listEl2) { listEl2.innerHTML = buildKnowledgeCards(); }
    } catch (eFallback) {}
  }
}

function buildMethodCard(method) {
  var m = LEARNING_METHODS[method];
  if (!m) { return ''; }
  var html = '';
  html += '<div class="method-card ' + method + '" onclick="selectMethod(\'' + method + '\')">';
  html += '<span class="icon">' + m.icon + '</span>';
  html += '<div class="name">' + m.name + '</div>';
  html += '<div class="desc">' + m.desc + '</div>';
  html += '</div>';
  return html;
}

// 选择学习方法
function selectMethod(method) {
  currentLearningMethod = method;
  var m = LEARNING_METHODS[method];
  if (!m) { return; }

  if (method === 'quiz') {
    // 刷题模式直接开始每日打卡
    switchTab('daily');
    return;
  }

  // 其他方法显示引导弹窗
  var html = '';
  html += '<div class="method-guide">';
  html += '<div class="mg-icon">' + m.icon + '</div>';
  html += '<div class="mg-title">' + m.name + '</div>';
  html += '<div>';
  for (var i = 0; i < m.steps.length; i++) {
    html += '<div class="mg-step">';
    html += '<div class="mg-num">' + (i + 1) + '</div>';
    html += '<div class="mg-text">' + escapeHtml(m.steps[i]) + '</div>';
    html += '</div>';
  }
  html += '</div>';
  html += '<button class="btn-primary" style="margin-top:18px" onclick="closeModal();">开始学习</button>';
  html += '</div>';

  openModal(m.name, html);
  // 滚动到知识库
  setTimeout(function () {
    var list = document.getElementById('kpList');
    if (list) { list.scrollIntoView({ behavior: 'smooth' }); }
  }, 100);
}

// 筛选分类
function filterCategory(cat) {
  currentCategory = cat;
  renderHomeContent();
}

// 构建知识点卡片列表
function buildKnowledgeCards() {
  var muscles = window.muscles || [];
  var diseases = window.diseases || [];
  var html = '';

  var showMuscle = (currentCategory === 'all' || currentCategory === 'muscle');
  var showDisease = (currentCategory === 'all' || currentCategory === 'disease');

  if (showMuscle) {
    for (var i = 0; i < muscles.length; i++) {
      html += buildMuscleCard(muscles[i], i);
    }
  }
  if (showDisease) {
    for (var j = 0; j < diseases.length; j++) {
      html += buildDiseaseCard(diseases[j], j);
    }
  }

  if (!html) {
    html = '<div class="empty-state"><div class="e-icon">📭</div><div class="e-text">暂无数据</div></div>';
  }
  return html;
}

function buildMuscleCard(m, index) {
  var html = '';
  var pointCount = MUSCLE_FIELDS.length;
  html += '<div class="kp-card" onclick="showMuscleDetail(' + index + ')">';
  html += '<div class="kp-head">';
  html += '<div class="kp-name">' + escapeHtml(m['肌肉名称'] || '未命名肌肉') + '</div>';
  html += '<div class="kp-badge muscle">肌肉</div>';
  html += '</div>';
  html += '<div class="kp-meta">';
  if (m['身体区域']) {
    html += '<span class="meta-item">📍 ' + escapeHtml(m['身体区域']) + '</span>';
  }
  if (m['疾病分级']) {
    html += '<span class="meta-item">🏆 ' + escapeHtml(m['疾病分级']) + '</span>';
  }
  html += '</div>';
  if (m['主要功能']) {
    html += '<div class="kp-desc">功能：' + escapeHtml(truncate(m['主要功能'], 60)) + '</div>';
  }
  if (m['常见损伤']) {
    html += '<div class="kp-desc">损伤：' + escapeHtml(truncate(m['常见损伤'], 50)) + '</div>';
  }
  html += '<div class="kp-foot">';
  html += '<span class="kp-count">' + pointCount + ' 个知识点</span>';
  html += '<span class="kp-arrow">查看 ›</span>';
  html += '</div>';
  html += '</div>';
  return html;
}

function buildDiseaseCard(d, index) {
  var html = '';
  var pointCount = DISEASE_FIELDS.length;
  html += '<div class="kp-card" onclick="showDiseaseDetail(' + index + ')">';
  html += '<div class="kp-head">';
  html += '<div class="kp-name">' + escapeHtml(d['具体病症'] || '未命名疾病') + '</div>';
  html += '<div class="kp-badge disease">疾病</div>';
  html += '</div>';
  html += '<div class="kp-meta">';
  if (d['部位']) {
    html += '<span class="meta-item">📍 ' + escapeHtml(d['部位']) + '</span>';
  }
  if (d['疾病分类']) {
    html += '<span class="meta-item">🏷 ' + escapeHtml(d['疾病分类']) + '</span>';
  }
  if (d['ICD10编码']) {
    html += '<span class="meta-item">📋 ' + escapeHtml(d['ICD10编码']) + '</span>';
  }
  html += '</div>';
  if (d['典型症状与体征']) {
    html += '<div class="kp-desc">' + escapeHtml(truncate(d['典型症状与体征'], 70)) + '</div>';
  }
  html += '<div class="kp-foot">';
  html += '<span class="kp-count">' + pointCount + ' 个知识点</span>';
  html += '<span class="kp-arrow">查看 ›</span>';
  html += '</div>';
  html += '</div>';
  return html;
}

// 显示肌肉详情
function showMuscleDetail(index) {
  var m = window.muscles[index];
  if (!m) { return; }
  var points = [];
  for (var i = 0; i < MUSCLE_FIELDS.length; i++) {
    var f = MUSCLE_FIELDS[i];
    if (m[f.key]) {
      points.push({ label: f.label, value: m[f.key] });
    }
  }
  showDetailModal(m['肌肉名称'] || '肌肉详情', points, 'muscle', index);
}

// 显示疾病详情
function showDiseaseDetail(index) {
  var d = window.diseases[index];
  if (!d) { return; }
  var points = [];
  for (var i = 0; i < DISEASE_FIELDS.length; i++) {
    var f = DISEASE_FIELDS[i];
    if (d[f.key]) {
      points.push({ label: f.label, value: d[f.key] });
    }
  }
  showDetailModal(d['具体病症'] || '疾病详情', points, 'disease', index);
}

// 显示详情弹窗（含闪卡）
function showDetailModal(title, points, type, dataIndex) {
  if (!points || points.length === 0) {
    openModal(title, '<div class="empty-state"><div class="e-icon">📭</div><div class="e-text">暂无详细数据</div></div>');
    return;
  }
  flashcardCtx = { points: points, index: 0, title: title, type: type, dataIndex: dataIndex };
  renderFlashcardModal();
}

function renderFlashcardModal() {
  if (!flashcardCtx) { return; }
  var ctx = flashcardCtx;
  var point = ctx.points[ctx.index];
  var html = '';
  // 闪卡
  html += '<div class="flashcard" id="flashcard">';
  html += '<div class="fc-label">' + escapeHtml(point.label) + '</div>';
  html += '<div class="fc-value">' + escapeHtml(point.value) + '</div>';
  html += '</div>';
  // 导航
  html += '<div class="fc-nav">';
  html += '<button onclick="prevFlashcard()" ' + (ctx.index === 0 ? 'disabled' : '') + '>‹</button>';
  html += '<span class="fc-index">' + (ctx.index + 1) + ' / ' + ctx.points.length + '</span>';
  html += '<button onclick="nextFlashcard()" ' + (ctx.index === ctx.points.length - 1 ? 'disabled' : '') + '>›</button>';
  html += '</div>';
  // 操作按钮
  html += '<div class="fc-actions">';
  html += '<button class="btn-secondary" onclick="flipFlashcard()">翻转复习</button>';
  if (ctx.type) {
    html += '<button class="btn-primary" onclick="quizThisKnowledge(\'' + ctx.type + '\',' + ctx.dataIndex + ')">测试此知识点</button>';
  }
  html += '</div>';

  openModal(ctx.title, html);
}

// 闪卡导航
function showFlashcard(point, title, index) {
  // 兼容外部调用接口
  if (!flashcardCtx) { return; }
  flashcardCtx.index = index;
  renderFlashcardModal();
}

function nextFlashcard() {
  if (!flashcardCtx) { return; }
  if (flashcardCtx.index < flashcardCtx.points.length - 1) {
    flashcardCtx.index++;
    renderFlashcardModal();
  }
}

function prevFlashcard() {
  if (!flashcardCtx) { return; }
  if (flashcardCtx.index > 0) {
    flashcardCtx.index--;
    renderFlashcardModal();
  }
}

function flipFlashcard() {
  var card = document.getElementById('flashcard');
  if (!card) { return; }
  card.style.transform = (card.style.transform === 'rotateY(180deg)') ? 'rotateY(0deg)' : 'rotateY(180deg)';
}

// 测试此知识点：从题库筛选相关题目
function quizThisKnowledge(type, dataIndex) {
  closeModal();
  // 尝试找相关题目
  var item;
  if (type === 'muscle') {
    item = window.muscles[dataIndex];
  } else {
    item = window.diseases[dataIndex];
  }
  var keyword = '';
  if (type === 'muscle' && item) {
    keyword = item['肌肉名称'] || '';
  } else if (item) {
    keyword = item['具体病症'] || '';
  }

  var related = [];
  var bank = [];
  if (window.questionBank && window.questionBank.all) {
    bank = window.questionBank.all;
  }
  if (keyword && bank.length) {
    for (var i = 0; i < bank.length; i++) {
      var q = bank[i];
      if (q.q && q.q.indexOf(keyword) >= 0) {
        related.push(q);
      }
    }
  }
  if (related.length === 0) {
    // 没有相关题，随机抽
    related = getRandomQuestions(10);
  } else if (related.length > 10) {
    related = shuffleArray(related).slice(0, 10);
  }

  // 先切换到每日打卡 tab（会渲染开始页），再启动测验覆盖内容
  switchTab('daily');
  startDailyQuizWithQuestions(related);
}

// ============================================================
// 弹窗通用方法
// ============================================================

// P1-6: 轻提示（1.6s 自动消失，用于"题库未就绪"这类用户可以重复操作的情况，替代阻断式 Modal）
var _toastTimer = null;
function showToast(msg) {
  try {
    if (!msg) { return; }
    var host = safeGetElement('toastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toastHost';
      host.style.cssText = 'position:fixed;left:50%;top:24%;transform:translateX(-50%);z-index:99999;pointer-events:none;';
      try { document.body.appendChild(host); } catch (eAp) { return; }
    }
    var toast = document.createElement('div');
    toast.style.cssText = 'background:rgba(0,0,0,0.78);color:#fff;padding:10px 18px;border-radius:10px;font-size:14px;line-height:1.4;box-shadow:0 4px 16px rgba(0,0,0,0.25);margin-bottom:8px;max-width:80vw;text-align:center;';
    toast.textContent = msg;
    host.appendChild(toast);
    setTimeout(function () {
      try {
        toast.style.transition = 'opacity 260ms ease, transform 260ms ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
      } catch (eTr) {}
      setTimeout(function () {
        try { if (toast.parentNode) { toast.parentNode.removeChild(toast); } } catch (eRm) {}
      }, 300);
    }, 1600);
  } catch (e) {
    console.warn('YZX showToast fail:', e);
  }
}

function openModal(title, bodyHtml) {
  try {
    var container = safeGetElement('modalContainer');
    if (!container) { return; }
    var html = '';
    html += '<div class="modal-mask" id="modalMask" onclick="onMaskClick(event)">';
    html += '<div class="modal-content" onclick="event.stopPropagation()">';
    html += '<div class="modal-head">';
    html += '<span class="m-title">' + escapeHtml(title) + '</span>';
    html += '<button class="modal-close" onclick="closeModal()">✕</button>';
    html += '</div>';
    html += '<div class="modal-body">' + bodyHtml + '</div>';
    html += '</div>';
    html += '</div>';
    safeSetInnerHTML(container, html);
    document.body.style.overflow = 'hidden';
  } catch (e) {
    console.error('YZX openModal failed:', e);
  }
}

function closeModal() {
  try {
    var container = safeGetElement('modalContainer');
    if (container) { safeSetInnerHTML(container, ''); }
    document.body.style.overflow = '';
    flashcardCtx = null;
  } catch (e) {
    console.error('YZX closeModal failed:', e);
  }
}

function onMaskClick(e) {
  if (e.target.id === 'modalMask') {
    closeModal();
  }
}

// ============================================================
// 每日打卡
// ============================================================

function renderDailyStart() {
  try {
    var page = safeGetElement('page-daily');
    if (!page) { return; }
    setBackButton(false);

    var todayDone = (state.dailyDoneDate === getTodayStr());
    var html = '';
    html += '<div class="start-screen">';
    html += '<div class="big-icon">✅</div>';
    html += '<div class="start-title">每日打卡</div>';
    html += '<div class="start-desc">每天 10 道随机题<br>坚持学习，巩固肌骨康复知识</div>';
    html += '<div class="start-info">';
    html += '<div class="info-item"><div class="info-num">10</div><div class="info-label">题目数</div></div>';
    html += '<div class="info-item"><div class="info-num">' + state.dailyDoneCount + '</div><div class="info-label">今日打卡</div></div>';
    html += '<div class="info-item"><div class="info-num">' + state.streak + '</div><div class="info-label">连续天数</div></div>';
    html += '</div>';
    if (todayDone) {
      html += '<div style="color:var(--success);font-size:13px;margin-bottom:16px">🎉 今日已完成打卡，可继续练习</div>';
    }
    html += '<button class="btn-primary" onclick="startDailyQuiz()">开始打卡</button>';
    html += '</div>';
    safeSetInnerHTML(page, html);
  } catch (e) {
    console.error('YZX renderDailyStart failed:', e);
  }
}

function startDailyQuiz() {
  if (!isQuestionBankReady()) { showToast('题库正在加载，请稍后再试'); return; }
  var questions = getRandomQuestions(10);
  if (questions.length === 0) {
    showToast('题库尚未加载，请稍后再试');
    return;
  }
  startDailyQuizWithQuestions(questions);
}

function startDailyQuizWithQuestions(questions) {
  examModeState.questions = questions;
  examModeState.currentIndex = 0;
  examModeState.score = 0;
  examModeState.answered = false;
  examModeState.wrongQuestions = [];
  examModeState.userAnswers = [];
  examModeState.mode = 'daily';
  examModeState.finished = false;
  examModeState.startTime = 0;
  examModeState.isPaused = false;
  pushNav('daily-question');
  renderExamQuestion();
}

// ============================================================
// 考试模式
// ============================================================

function renderExamStart() {
  try {
    var page = safeGetElement('page-exam');
    if (!page) { return; }
    setBackButton(false);

    if (examModeState.timerInterval) {
      clearInterval(examModeState.timerInterval);
      examModeState.timerInterval = null;
    }

    var html = '';
    html += '<div class="start-screen">';
    html += '<div class="big-icon">📝</div>';
    html += '<div class="start-title">考试模式</div>';
    html += '<div class="start-desc">100 道随机题 · 60 分钟<br>检验综合掌握水平，错题自动加入错题本</div>';
    html += '<div class="start-info">';
    html += '<div class="info-item"><div class="info-num">100</div><div class="info-label">题目数</div></div>';
    html += '<div class="info-item"><div class="info-num">60</div><div class="info-label">分钟</div></div>';
    html += '<div class="info-item"><div class="info-num">' + state.examDoneCount + '</div><div class="info-label">已考次数</div></div>';
    html += '</div>';
    html += '<button class="btn-primary" onclick="startExamMode()">开始考试</button>';
    html += '</div>';
    safeSetInnerHTML(page, html);
  } catch (e) {
    console.error('YZX renderExamStart failed:', e);
  }
}

function startExamMode() {
  if (!isQuestionBankReady()) { showToast('题库正在加载，请稍后再试'); return; }
  var questions = getRandomQuestions(100);
  if (questions.length === 0) {
    showToast('题库尚未加载，请稍后再试');
    return;
  }
  examModeState.questions = questions;
  examModeState.currentIndex = 0;
  examModeState.score = 0;
  examModeState.answered = false;
  examModeState.wrongQuestions = [];
  examModeState.userAnswers = [];
  examModeState.mode = 'exam';
  examModeState.finished = false;
  examModeState.startTime = Date.now();
  examModeState.elapsedTime = 0;
  examModeState.isPaused = false;

  // 启动计时器
  startExamTimer();
  pushNav('exam-question');
  renderExamQuestion();
}

function startExamTimer() {
  if (!examModeState || examModeState.mode !== 'exam') { return; }
  // P0-2: 强清旧 interval 并 nullify，防止同一个状态下被创建多个
  if (examModeState.timerInterval) {
    try { clearInterval(examModeState.timerInterval); } catch (eCl) {}
    examModeState.timerInterval = null;
  }
  if (!examModeState.startTime) { examModeState.startTime = Date.now(); }
  examModeState.timerInterval = setInterval(function () {
    try {
      if (!examModeState || examModeState.finished) {
        if (examModeState && examModeState.timerInterval) {
          clearInterval(examModeState.timerInterval);
          examModeState.timerInterval = null;
        }
        return;
      }
      if (!examModeState.isPaused) {
        updateExamTimer();
      }
    } catch (eTick) {
      console.warn('YZX examTimer tick error:', eTick);
    }
  }, 1000);
}

function updateExamTimer() {
  try {
    var timerEl = document.getElementById('examTimer');
    if (!timerEl) { return; }
    if (!examModeState || examModeState.mode !== 'exam') { return; }
    var elapsed = Math.floor((Date.now() - (examModeState.startTime || Date.now()) - (examModeState.elapsedTime || 0)) / 1000);
    if (elapsed < 0) { elapsed = 0; }
    var remaining = 60 * 60 - elapsed; // 60 分钟
    if (remaining <= 0) {
      remaining = 0;
      timerEl.textContent = '00:00';
      timerEl.className = 'q-timer danger';
      // 时间到自动提交
      submitExam();
      return;
    }
    var min = Math.floor(remaining / 60);
    var sec = remaining % 60;
    if (min < 10) { min = '0' + min; }
    if (sec < 10) { sec = '0' + sec; }
    timerEl.textContent = min + ':' + sec;
    if (remaining < 60) {
      timerEl.className = 'q-timer danger';
    } else if (remaining < 300) {
      timerEl.className = 'q-timer warn';
    }
  } catch (e) {
    console.warn('YZX updateExamTimer fail:', e);
  }
}

function pauseExam() {
  if (!examModeState || examModeState.mode !== 'exam') { return; }
  // P0-2: 使用统一 pauseExamTimer（支持幂等），避免重复写 pauseStart
  pauseExamTimer();
  // 显示暂停遮罩
  var page = document.getElementById('page-exam');
  if (!page) { return; }
  // 避免重复添加遮罩（DOM 泄漏）
  if (safeGetElement('pauseMask')) { return; }
  var mask = document.createElement('div');
  mask.className = 'pause-mask';
  mask.id = 'pauseMask';
  mask.innerHTML = '<div class="p-icon">⏸</div><div class="p-text">考试已暂停</div><button class="btn-primary" style="width:200px" onclick="resumeExam()">继续考试</button>';
  page.appendChild(mask);
}

function resumeExam() {
  if (!examModeState || examModeState.mode !== 'exam') { return; }
  // P0-2: 使用统一 resumeExamTimer
  resumeExamTimer();
  var mask = document.getElementById('pauseMask');
  if (mask && mask.parentNode) {
    try { mask.parentNode.removeChild(mask); } catch (eRm) {}
  }
}

// ============================================================
// 题目渲染
// ============================================================

function renderExamQuestion() {
  try {
    var pageId = (examModeState.mode === 'exam') ? 'page-exam' : 'page-daily';
    var page = safeGetElement(pageId);
    if (!page) { return; }

    if (!examModeState.questions || examModeState.currentIndex >= examModeState.questions.length) {
      submitExam();
      return;
    }

    var q = examModeState.questions[examModeState.currentIndex];
    if (!q) {
      examModeState.currentIndex++;
      renderExamQuestion();
      return;
    }
    examModeState.answered = false;

    var html = '';
    html += '<div class="q-header">';
    html += '<div class="q-progress">第 <span class="num">' + (examModeState.currentIndex + 1) + '</span> / ' + examModeState.questions.length + ' 题</div>';
    if (examModeState.mode === 'exam') {
      var elapsed = Math.floor((Date.now() - examModeState.startTime - examModeState.elapsedTime) / 1000);
      var remaining = 60 * 60 - elapsed;
      if (remaining < 0) { remaining = 0; }
      var min = Math.floor(remaining / 60);
      var sec = remaining % 60;
      if (min < 10) { min = '0' + min; }
      if (sec < 10) { sec = '0' + sec; }
      var cls = 'q-timer';
      if (remaining < 60) { cls = 'q-timer danger'; }
      else if (remaining < 300) { cls = 'q-timer warn'; }
      html += '<div style="display:flex;gap:8px;align-items:center">';
      html += '<div class="' + cls + '" id="examTimer">' + min + ':' + sec + '</div>';
      html += '<button class="back-btn" style="background:var(--primary-bg);color:var(--primary)" onclick="pauseExam()">⏸</button>';
      html += '</div>';
    }
    html += '</div>';

    var typeLabel = (q.type === 'judge') ? '判断题' : '单选题';
    var typeCls = (q.type === 'judge') ? 'judge' : 'single';
    html += '<span class="q-type-tag ' + typeCls + '">' + typeLabel + '</span>';

    html += '<div class="q-question">' + escapeHtml(q.q || '') + '</div>';

    html += '<div class="q-options" id="qOptions">';
    if (q.type === 'judge') {
      html += buildOption(0, '正确', '✓');
      html += buildOption(1, '错误', '✗');
    } else if (q.options && q.options.length) {
      var labels = ['A', 'B', 'C', 'D', 'E', 'F'];
      for (var i = 0; i < q.options.length; i++) {
        var lbl = labels[i] || String(i + 1);
        html += buildOption(i, q.options[i], lbl);
      }
    }
    html += '</div>';

    html += '<div id="qFeedback"></div>';

    var isLast = (examModeState.currentIndex === examModeState.questions.length - 1);
    var btnText = isLast ? '提交并查看结果' : '下一题';
    html += '<button class="btn-primary btn-block" id="nextBtn" style="display:none" onclick="nextExamQuestion()">' + btnText + '</button>';

    if (examModeState.mode === 'exam') {
      html += '<div style="text-align:center;margin-top:12px"><button class="btn-secondary" style="width:auto;padding:8px 20px;font-size:13px" onclick="confirmSubmitExam(true)">提前交卷</button></div>';
    }

    safeSetInnerHTML(page, html);
    window.scrollTo(0, 0);
  } catch (e) {
    console.error('YZX renderExamQuestion failed:', e);
  }
}

function buildOption(index, text, label) {
  var html = '';
  html += '<div class="q-option" onclick="selectExamOption(' + index + ')">';
  html += '<div class="opt-label">' + escapeHtml(label) + '</div>';
  html += '<div class="opt-text">' + escapeHtml(text) + '</div>';
  html += '</div>';
  return html;
}

function selectExamOption(index) {
  try {
    if (examModeState.answered) { return; }
    examModeState.answered = true;

    var q = examModeState.questions[examModeState.currentIndex];
    if (!q) { return; }

    var correctIndex;
    if (q.type === 'judge') {
      correctIndex = q.answer ? 0 : 1;
    } else {
      correctIndex = q.answer;
    }

    var isCorrect = (index === correctIndex);

    var userAnswer;
    if (q.type === 'judge') {
      userAnswer = (index === 0);
    } else {
      userAnswer = index;
    }
    examModeState.userAnswers[examModeState.currentIndex] = userAnswer;

    var options = safeQuerySelectorAll('#qOptions .q-option');
    for (var i = 0; i < options.length; i++) {
      try {
        options[i].onclick = null;
        options[i].classList.add('disabled');
        if (i === correctIndex) {
          options[i].classList.add('correct');
        } else if (i === index) {
          options[i].classList.add('wrong');
        }
      } catch (e) {}
    }

    var feedback = safeGetElement('qFeedback');
    var correctText = getCorrectText(q, correctIndex);
    var html = '';
    if (isCorrect) {
      examModeState.score++;
      state.coins += 5;
      state.exp += 10;
      state.totalCorrect++;
      html += '<div class="feedback correct">✓ 答对了！+5🪙 +10经验</div>';
    } else {
      html += '<div class="feedback wrong">✗ 答错了';
      html += '<span class="answer-hint">正确答案：' + escapeHtml(correctText) + '</span>';
      html += '</div>';
      addWrongQuestion(q, userAnswer);
    }
    state.totalAnswered++;
    updateTagStats(q, isCorrect);

    if (feedback) { safeSetInnerHTML(feedback, html); }

    var nextBtn = safeGetElement('nextBtn');
    if (nextBtn) { nextBtn.style.display = 'block'; }

    updateStats();
    saveState();
  } catch (e) {
    console.error('YZX selectExamOption failed:', e);
  }
}

function getCorrectText(q, correctIndex) {
  if (q.type === 'judge') {
    return correctIndex === 0 ? '正确' : '错误';
  }
  if (q.options && q.options[correctIndex] !== undefined) {
    return q.options[correctIndex];
  }
  return '';
}

function getUserAnswerText(q, userAnswer) {
  if (q.type === 'judge') {
    return userAnswer ? '正确' : '错误';
  }
  if (q.options && q.options[userAnswer] !== undefined) {
    return q.options[userAnswer];
  }
  return String(userAnswer);
}

function nextExamQuestion() {
  if (!examModeState.answered) { return; }
  if (examModeState.currentIndex >= examModeState.questions.length - 1) {
    submitExam();
    return;
  }
  examModeState.currentIndex++;
  examModeState.answered = false;
  renderExamQuestion();
}

// 更新标签统计
function updateTagStats(q, isCorrect) {
  if (!q.tags || !q.tags.length) { return; }
  for (var i = 0; i < q.tags.length; i++) {
    var tag = q.tags[i];
    if (!state.tagStats[tag]) {
      state.tagStats[tag] = { total: 0, correct: 0 };
    }
    state.tagStats[tag].total++;
    if (isCorrect) {
      state.tagStats[tag].correct++;
    }
  }
}

// ============================================================
// 提交考试
// ============================================================

function confirmSubmitExam(early) {
  if (early) {
    var answered = examModeState.userAnswers.length;
    openModal('确认交卷', '<div style="text-align:center;padding:10px 0"><p style="font-size:14px;color:var(--text-secondary);margin-bottom:8px">已答 ' + answered + ' / ' + examModeState.questions.length + ' 题</p><p style="font-size:13px;color:var(--text-tertiary)">提交后将不能继续作答</p><div class="btn-row"><button class="btn-secondary" onclick="closeModal()">继续答题</button><button class="btn-primary" onclick="closeModal();submitExam()">确认交卷</button></div></div>');
  } else {
    submitExam();
  }
}

function submitExam() {
  try {
    if (examModeState.finished) { return; }
    examModeState.finished = true;

    if (examModeState.timerInterval) {
      clearInterval(examModeState.timerInterval);
      examModeState.timerInterval = null;
    }

    var mask = safeGetElement('pauseMask');
    if (mask && mask.parentNode) {
      try {
        mask.parentNode.removeChild(mask);
      } catch (e) {}
    }

    var total = examModeState.questions ? examModeState.questions.length : 0;
    var score = examModeState.score;
    var accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
    var elapsedSec = 0;
    if (examModeState.mode === 'exam' && examModeState.startTime) {
      elapsedSec = Math.floor((Date.now() - examModeState.startTime - examModeState.elapsedTime) / 1000);
    }

    state.completionCount++;
    if (examModeState.mode === 'daily') {
      state.dailyDoneCount++;
      state.dailyDoneDate = getTodayStr();
      state.coins += 20;
      state.exp += 30;
      // P2-8: 只要一次打卡全部答完交卷，就记今日学习 + 连续学习
      creditStudyDay();
      // P1-5: 徽章持久化（存 state.badges，下次渲染直接读取，不用临时算丢失）
      try {
        if (typeof state.badges !== 'object' || state.badges === null) { state.badges = {}; }
        state.badges.first = true;
        if (state.studyDays >= 30) { state.badges.streak30 = true; }
        if (state.totalAnswered >= 100) { state.badges.answer100 = true; }
        if (state.totalAnswered >= 500) { state.badges.answer500 = true; }
        if (state.streak >= 7) { state.badges.streak7 = true; }
        if (accuracy >= 80 && state.totalAnswered >= 50) { state.badges.acc80 = true; }
        if (accuracy >= 100) { state.badges.daily100 = true; }
        if (accuracy >= 90)  { state.badges.daily90 = true; }
        if (state.dailyDoneCount >= 3) { state.badges.daily3x = true; }
      } catch (eBg) {}
    } else {
      state.examDoneCount++;
      state.coins += 50;
      state.exp += 80;
      if (accuracy >= 60) {
        state.coins += 30;
        state.exp += 50;
      }
      // P2-8: 考试模式交卷也记一次学习日（每日首次考试会算天数/连续）
      creditStudyDay();
      // P1-5: 徽章持久化
      try {
        if (typeof state.badges !== 'object' || state.badges === null) { state.badges = {}; }
        state.badges.first = true;
        if (state.studyDays >= 30) { state.badges.streak30 = true; }
        if (state.totalAnswered >= 100) { state.badges.answer100 = true; }
        if (state.totalAnswered >= 500) { state.badges.answer500 = true; }
        if (state.streak >= 7) { state.badges.streak7 = true; }
        if (accuracy >= 80 && state.totalAnswered >= 50) { state.badges.acc80 = true; }
        state.badges.examOnce = true;
        if (accuracy >= 60) { state.badges.examPass = true; }
        if (accuracy >= 90) { state.badges.exam90 = true; }
        if (accuracy >= 100) { state.badges.exam100 = true; }
      } catch (eBg2) {}
    }

    // P0-3: 交卷属于关键操作，立即刷盘防止刷新丢失
    saveStateImmediate();
    updateStats();

    renderExamResult(score, total, accuracy, elapsedSec);
    pushNav(examModeState.mode + '-result');
    setBackButton(true);
  } catch (e) {
    console.error('YZX submitExam failed:', e);
  }
}

function renderExamResult(score, total, accuracy, elapsedSec) {
  try {
    var pageId = (examModeState.mode === 'exam') ? 'page-exam' : 'page-daily';
    var page = safeGetElement(pageId);
    if (!page) { return; }

    var emoji = '🎉';
    var title = '完成打卡！';
    if (examModeState.mode === 'exam') {
      title = accuracy >= 60 ? '考试通过！' : '考试未通过';
      if (accuracy >= 90) { emoji = '🏆'; }
      else if (accuracy >= 60) { emoji = '🎉'; }
      else { emoji = '💪'; }
    } else {
      if (accuracy >= 90) { emoji = '🏆'; }
      else if (accuracy >= 60) { emoji = '🎉'; }
      else { emoji = '💪'; }
    }

    var min = Math.floor(elapsedSec / 60);
    var sec = elapsedSec % 60;
    var timeStr = min + '分' + sec + '秒';

    var html = '';
    html += '<div class="result-card">';
    html += '<div class="result-emoji">' + emoji + '</div>';
    html += '<div class="result-title">' + title + '</div>';
    html += '<div class="result-score">' + score + '<span class="small">/' + total + '</span></div>';
    html += '<div class="result-meta">';
    html += '<div><div class="meta-num">' + accuracy + '%</div><div class="meta-label">正确率</div></div>';
    html += '<div><div class="meta-num">' + timeStr + '</div><div class="meta-label">用时</div></div>';
    if (examModeState.wrongQuestions && examModeState.wrongQuestions.length > 0) {
      html += '<div><div class="meta-num">' + examModeState.wrongQuestions.length + '</div><div class="meta-label">错题数</div></div>';
    }
    html += '</div>';
    html += '</div>';

    if (examModeState.wrongQuestions && examModeState.wrongQuestions.length > 0) {
      html += '<div class="section-title"><span class="dot"></span>错题回顾</div>';
      for (var i = 0; i < examModeState.wrongQuestions.length; i++) {
        try {
          html += buildReviewItem(examModeState.wrongQuestions[i]);
        } catch (e) {
          console.warn('YZX buildReviewItem failed at index ' + i + ':', e);
        }
      }
    }

    html += '<div class="btn-row">';
    if (examModeState.wrongQuestions && examModeState.wrongQuestions.length > 0) {
      html += '<button class="btn-secondary" onclick="switchTab(\'wrong\')">查看错题本</button>';
    }
    var againText = (examModeState.mode === 'exam') ? '再考一次' : '再来一次';
    var againFn = (examModeState.mode === 'exam') ? 'startExamMode()' : 'startDailyQuiz()';
    html += '<button class="btn-primary" onclick="' + againFn + '">' + againText + '</button>';
    html += '</div>';

    safeSetInnerHTML(page, html);
    window.scrollTo(0, 0);
  } catch (e) {
    console.error('YZX renderExamResult failed:', e);
  }
}

function buildReviewItem(wq) {
  var html = '';
  html += '<div class="review-item">';
  html += '<div class="r-q">' + escapeHtml(wq.question.q) + '</div>';
  var userText = getUserAnswerText(wq.question, wq.userAnswer);
  var correctIndex;
  if (wq.question.type === 'judge') {
    correctIndex = wq.question.answer ? 0 : 1;
  } else {
    correctIndex = wq.question.answer;
  }
  var correctText = getCorrectText(wq.question, correctIndex);
  html += '<div class="r-ans user-wrong">你的答案：' + escapeHtml(userText) + '</div>';
  html += '<div class="r-ans correct">正确答案：' + escapeHtml(correctText) + '</div>';
  if (wq.question.tags && wq.question.tags.length) {
    html += '<div class="tag-list">';
    for (var i = 0; i < wq.question.tags.length; i++) {
      html += '<span class="tag">' + escapeHtml(wq.question.tags[i]) + '</span>';
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// ============================================================
// 错题本
// ============================================================

function addWrongQuestion(question, userAnswer) {
  // 去重：相同题目只保留一条
  for (var i = 0; i < wrongQuestionBank.length; i++) {
    if (wrongQuestionBank[i].question.q === question.q) {
      wrongQuestionBank[i].userAnswer = userAnswer;
      wrongQuestionBank[i].time = Date.now();
      examModeState.wrongQuestions.push({ question: question, userAnswer: userAnswer });
      saveState();
      return;
    }
  }
  var wq = {
    question: question,
    userAnswer: userAnswer,
    time: Date.now()
  };
  wrongQuestionBank.push(wq);
  examModeState.wrongQuestions.push(wq);
  saveState();
}

function renderWrongQuestions() {
  try {
    var page = safeGetElement('page-wrong');
    if (!page) { return; }
    setBackButton(false);

    var html = '';
    html += '<div class="section-title"><span class="dot"></span>错题本';
    if (wrongQuestionBank && wrongQuestionBank.length > 0) {
      html += '<span style="font-size:13px;color:var(--text-tertiary);font-weight:500;margin-left:auto">共 ' + wrongQuestionBank.length + ' 题</span>';
    }
    html += '</div>';

    if (!wrongQuestionBank || wrongQuestionBank.length === 0) {
      html += '<div class="empty-state">';
      html += '<div class="e-icon">📒</div>';
      html += '<div class="e-text">错题本为空</div>';
      html += '<div class="e-text" style="margin-top:8px;font-size:12px">答题时答错的题目会自动加入</div>';
      html += '</div>';
    } else {
      for (var i = 0; i < wrongQuestionBank.length; i++) {
        try {
          html += buildWrongItem(wrongQuestionBank[i], i);
        } catch (e) {
          console.warn('YZX buildWrongItem failed at index ' + i + ':', e);
        }
      }
      html += '<button class="btn-secondary" style="margin-top:12px" onclick="clearAllWrong()">清空错题本</button>';
    }

    safeSetInnerHTML(page, html);
  } catch (e) {
    console.error('YZX renderWrongQuestions failed:', e);
  }
}

function buildWrongItem(wq, index) {
  var q = wq.question;
  var userText = getUserAnswerText(q, wq.userAnswer);
  var correctIndex;
  if (q.type === 'judge') {
    correctIndex = q.answer ? 0 : 1;
  } else {
    correctIndex = q.answer;
  }
  var correctText = getCorrectText(q, correctIndex);
  var typeLabel = (q.type === 'judge') ? '判断题' : '单选题';

  var html = '';
  html += '<div class="wrong-item">';
  html += '<div class="w-q"><span style="color:var(--text-tertiary);font-size:11px;margin-right:6px">[' + typeLabel + ']</span>' + escapeHtml(q.q) + '</div>';
  if (q.options && q.type !== 'judge') {
    html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;line-height:1.5">';
    for (var i = 0; i < q.options.length; i++) {
      var lbl = String.fromCharCode(65 + i);
      var mark = (i === correctIndex) ? ' ✓' : ((i === wq.userAnswer) ? ' ✗' : '');
      html += '<div>' + lbl + '. ' + escapeHtml(q.options[i]) + mark + '</div>';
    }
    html += '</div>';
  }
  html += '<div class="w-row"><span class="w-label">你的答案：</span><span class="w-user">' + escapeHtml(userText) + '</span></div>';
  html += '<div class="w-row"><span class="w-label">正确答案：</span><span class="w-correct">' + escapeHtml(correctText) + '</span></div>';
  html += '<div class="w-foot">';
  html += '<span class="w-time">' + formatTime(wq.time) + '</span>';
  html += '<button class="w-del" onclick="removeWrongQuestion(' + index + ')">已掌握 ✓</button>';
  html += '</div>';
  html += '</div>';
  return html;
}

function formatTime(ts) {
  if (!ts) { return ''; }
  var d = new Date(ts);
  var m = d.getMonth() + 1;
  var day = d.getDate();
  var h = d.getHours();
  var min = d.getMinutes();
  if (m < 10) { m = '0' + m; }
  if (day < 10) { day = '0' + day; }
  if (h < 10) { h = '0' + h; }
  if (min < 10) { min = '0' + min; }
  return m + '-' + day + ' ' + h + ':' + min;
}

function removeWrongQuestion(index) {
  if (index < 0 || index >= wrongQuestionBank.length) { return; }
  wrongQuestionBank.splice(index, 1);
  saveState();
  renderWrongQuestions();
}

function clearAllWrong() {
  if (wrongQuestionBank.length === 0) { return; }
  openModal('确认清空', '<div style="text-align:center;padding:10px 0"><p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">确定清空所有错题吗？此操作不可撤销</p><div class="btn-row"><button class="btn-secondary" onclick="closeModal()">取消</button><button class="btn-primary" onclick="closeModal();doClearWrong()">确认清空</button></div></div>');
}

function doClearWrong() {
  wrongQuestionBank = [];
  saveState();
  renderWrongQuestions();
}

// ============================================================
// 统计页
// ============================================================

function renderStats() {
  try {
    var page = safeGetElement('page-stats');
    if (!page) { return; }
    setBackButton(false);

    var accuracy = state.totalAnswered > 0 ? Math.round((state.totalCorrect / state.totalAnswered) * 100) : 0;

    var html = '';
    html += '<div class="stats-grid">';
    html += '<div class="stat-card"><div class="s-icon">📅</div><div class="s-num">' + state.studyDays + '</div><div class="s-label">学习天数</div></div>';
    html += '<div class="stat-card"><div class="s-icon">🎯</div><div class="s-num">' + state.completionCount + '</div><div class="s-label">完成次数</div></div>';
    html += '<div class="stat-card"><div class="s-icon">📝</div><div class="s-num">' + state.totalAnswered + '</div><div class="s-label">答题总数</div></div>';
    html += '<div class="stat-card"><div class="s-icon">📈</div><div class="s-num">' + accuracy + '%</div><div class="s-label">正确率</div></div>';
    html += '</div>';

    html += '<div class="card">';
    html += '<div style="display:flex;justify-content:space-between;margin-bottom:8px">';
    html += '<span style="font-size:13px;color:var(--text-secondary)">经验值</span>';
    html += '<span style="font-size:13px;font-weight:600;color:var(--primary)">' + state.exp + ' / ' + (state.level * 100) + '</span>';
    html += '</div>';
    html += '<div class="mastery-bar"><div class="mastery-fill" style="width:' + (state.exp % 100) + '%"></div></div>';
    html += '<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12px;color:var(--text-tertiary)">';
    html += '<span>💰 金币 ' + state.coins + '</span>';
    html += '<span>🔥 连续 ' + state.streak + ' 天</span>';
    html += '<span>⭐ Lv.' + state.level + '</span>';
    html += '</div>';
    html += '</div>';

    html += '<div class="section-title"><span class="dot"></span>知识点掌握度</div>';
    html += '<div class="card">';
    var tags = state.tagStats || {};
    var tagArr = [];
    for (var k in tags) {
      if (tags.hasOwnProperty(k)) {
        var t = tags[k];
        var pct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
        tagArr.push({ name: k, pct: pct, total: t.total, correct: t.correct });
      }
    }
    tagArr.sort(function (a, b) { return b.total - a.total; });
    if (tagArr.length === 0) {
      html += '<div class="empty-state" style="padding:24px"><div class="e-icon">📊</div><div class="e-text">暂无答题数据</div></div>';
    } else {
      var showCount = Math.min(8, tagArr.length);
      for (var i = 0; i < showCount; i++) {
        var t2 = tagArr[i];
        html += '<div class="mastery-bar-wrap">';
        html += '<div class="mastery-head"><span class="m-name">' + escapeHtml(t2.name) + '</span><span class="m-pct">' + t2.pct + '% (' + t2.correct + '/' + t2.total + ')</span></div>';
        html += '<div class="mastery-bar"><div class="mastery-fill" style="width:' + t2.pct + '%"></div></div>';
        html += '</div>';
      }
    }
    html += '</div>';

    html += '<div class="section-title"><span class="dot"></span>成就徽章</div>';
    html += '<div class="card">';
    html += '<div class="badge-grid">';
    // P1-5: 徽章持久化——优先读 state.badges；读不到再用实时条件兜底（避免旧存档没 badges 全灰）
    var bg = (typeof state.badges === 'object' && state.badges !== null) ? state.badges : {};
    html += buildBadge('🌱', '初次学习', !!bg.first || state.studyDays >= 1);
    html += buildBadge('🔥', '坚持7天', !!bg.streak7 || state.streak >= 7);
    html += buildBadge('💪', '坚持30天', !!bg.streak30 || state.studyDays >= 30);
    html += buildBadge('✍️', '答题100', !!bg.answer100 || state.totalAnswered >= 100);
    html += buildBadge('🎯', '答题500', !!bg.answer500 || state.totalAnswered >= 500);
    html += buildBadge('🏆', '正确80%', !!bg.acc80 || (accuracy >= 80 && state.totalAnswered >= 50));
    html += buildBadge('📝', '完成考试', !!bg.examOnce || state.examDoneCount >= 1);
    html += buildBadge('⭐', '满分打卡', !!bg.daily100);
    html += buildBadge('🥇', '考试满分', !!bg.exam100);
    html += buildBadge('🎖', '考试优秀', !!bg.exam90);
    html += buildBadge('✨', '打卡90+', !!bg.daily90);
    html += buildBadge('📅', '一日三刷', !!bg.daily3x);
    html += '</div>';
    html += '</div>';

    html += '<button class="btn-secondary" style="margin-top:12px" onclick="confirmReset()">重置学习进度</button>';

    safeSetInnerHTML(page, html);
  } catch (e) {
    console.error('YZX renderStats failed:', e);
  }
}

function buildBadge(icon, name, unlocked) {
  var html = '';
  html += '<div class="badge' + (unlocked ? ' unlocked' : '') + '">';
  html += '<div class="b-icon">' + icon + '</div>';
  html += '<div class="b-name">' + name + '</div>';
  html += '</div>';
  return html;
}

function confirmReset() {
  openModal('重置进度', '<div style="text-align:center;padding:10px 0"><p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">将清空所有学习记录、金币、错题本，不可恢复</p><div class="btn-row"><button class="btn-secondary" onclick="closeModal()">取消</button><button class="btn-primary" onclick="closeModal();doReset()">确认重置</button></div></div>');
}

function doReset() {
  state = {
    coins: 0, exp: 0, level: 1, studyDays: 0, completionCount: 0,
    mastery: {}, lastStudyDate: null, streak: 0,
    totalAnswered: 0, totalCorrect: 0,
    dailyDoneDate: null, dailyDoneCount: 0, examDoneCount: 0,
    tagStats: {}, badges: {}
  };
  wrongQuestionBank = [];
  saveState();
  updateStats();
  renderStats();
}

// ============================================================
// 启动
// ============================================================

// 兼容性：直接调用 init
init();
