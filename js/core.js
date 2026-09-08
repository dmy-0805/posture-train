/* 核心定义：WEEKLY_PLAN / DAILY_HABITS 常量、App 状态、init、模块切换、首页仪表盘 */
const WEEKLY_PLAN = [
  {day:1,dayName:'周一',title:'肩颈矫正 + 改善高低溜肩',duration:'20min',
   videoTitle:'20 分钟上半身姿态改善｜薄背开肩、改善圆肩溜肩高低肩、缓解肩颈酸痛',
   bvid:'BV1uSTM64EsE',
   exercises:[
     {name:'靠墙站立收下巴',detail:'3min'},
     {name:'门框胸大肌拉伸',detail:'左右 30s×2'},
     {name:'墙壁天使',detail:'15 次×3（高低肩弱侧多加控制）'},
     {name:'沉肩夹背',detail:'20 次×3'},
     {name:'颈椎侧拉伸',detail:'左右 30s'}
   ],
   focus:'高侧肩膀主动下沉，不要耸肩。'},
  {day:2,dayName:'周二',title:'O 型腿 + 假胯宽矫正',duration:'20min',
   videoTitle:'20min 臀腿普拉提｜改善假胯宽、O 型腿腿型回正，无器械',
   bvid:'BV1SkXSBHETX',
   exercises:[
     {name:'蚌式开合',detail:'左右 20 次×3'},
     {name:'侧卧内收腿',detail:'左右 20 次×3'},
     {name:'青蛙趴',detail:'1min×3'},
     {name:'大腿外侧放松（矿泉水瓶滚压）',detail:'2min'}
   ],
   focus:'膝盖不要内扣，感受臀部外侧发力，大腿内侧收紧。'},
  {day:3,dayName:'周三',title:'腰腹轻薄塑形（无卷腹，不伤腰）',duration:'20min',
   videoTitle:'20 分钟垫上｜全程无卷腹，强化深层核心、收紧小腹',
   bvid:'BV1MRztBoEyY',
   exercises:[
     {name:'腹式呼吸',detail:'3min'},
     {name:'死虫式',detail:'15 次×3'},
     {name:'平板支撑',detail:'30s×3'}
   ],
   focus:'腰全程贴地，不要塌腰拱腰。'},
  {day:4,dayName:'周四',title:'全身放松拉伸 + 高低肩薄弱侧补强',duration:'20min 恢复日',
   videoTitle:'20 分钟全身深度拉伸｜肩颈腰背髋腿全覆盖，改善高低肩紧张',
   bvid:'BV1n1LS6SEwT',
   exercises:[
     {name:'全身筋膜拉伸',detail:'10min（大腿前/后、小腿、肩背胸）'},
     {name:'单侧墙壁天使（弱侧肩膀）',detail:'12 次×3 组'},
     {name:'小腿拉伸',detail:'左右 40s'}
   ],
   focus:'今天不求出汗，主打放松肌肉、平衡双肩，酸痛感降到轻微即可。'},
  {day:5,dayName:'周五',title:'下肢瘦腿优化（大小腿粗 + O 型腿力线）',duration:'20min',
   videoTitle:'20min 腿部矫正瘦腿｜改善 O 型腿、大小腿粗壮、提臀',
   bvid:'BV1vyf6BDEPR',
   exercises:[
     {name:'臀桥',detail:'20 次×3'},
     {name:'坐姿腿内扣',detail:'25 次×3'},
     {name:'踮脚慢落',detail:'15 次×3（下落 3 秒，不要猛砸地）'}
   ],
   focus:''},
  {day:6,dayName:'周六',title:'休息日',duration:'',
   videoTitle:'可选 10 分钟简易拉伸',
   bvid:'BV1PV411v7Ej',
   exercises:[],
   focus:'休息为主，可做简易拉伸放松。'},
  {day:0,dayName:'周日',title:'休息日',duration:'',
   videoTitle:'可选 10 分钟简易拉伸',
   bvid:'BV1PV411v7Ej',
   exercises:[],
   focus:'休息为主，可做简易拉伸放松。'}
];
const DAILY_HABITS = [
  '禁止跷二郎腿、歪坐沙发，手机举到视线高度，减少头前伸',
  '走路脚尖朝前，不要外八，改善 O 型腿发力',
  '久坐每 40 分钟，做 1 分钟沉肩收下巴，缓解脖子肩膀痛'
];
const App = {
  records: [], bodyData: [], types: [], planData: [], checkins: {}, periodData: [],
  currentModule: 'workout',
  bfMode: 'manual',
  isSample: true,
  calendarMonth: null,
  periodYear: null,
  periodTab: 'stats',
  periodChartType: 'wide',
  periodDim: 'period',
  periodFlow: 3,
  periodPain: 1,
  periodMonth: null,
  periodSelectedDate: null,

  KEYS: {
    records: 'wb_fitness_records',
    body: 'wb_fitness_body',
    types: 'wb_fitness_types',
    meta: 'wb_fitness_meta',
    plans: 'wb_fitness_plans',
    checkins: 'wb_fitness_checkins',
    nav: 'wb_fitness_nav',
    periods: 'wb_fitness_periods',
    books: 'wb_fitness_books',
    inspirations: 'wb_fitness_inspirations'
  },

  init() {
    this.loadData();
    this.setDefaultDates();
    this.loadProfile();
    if (!this.periodYear) this.periodYear = new Date().getFullYear();
    if (!this.periodMonth) {
      const now = new Date();
      this.periodMonth = { year: now.getFullYear(), month: now.getMonth() };
    }
    if (!this.periodSelectedDate) this.periodSelectedDate = this.getToday();
    this.renderAll();
    this.bindEvents();
    this.switchModule('workout');
    this.checkReminder();
  },

  switchModule(name) {
    this.currentModule = name;
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    var module = document.getElementById(name + 'Module');
    if (module) module.classList.add('active');
    var navItem = document.querySelector('.nav-item[data-module="' + name + '"]');
    if (navItem) navItem.classList.add('active');
    var titles = { home: '首页', workout: '锻炼台', period: '生理期', inspiration: '灵感记录', books: '想买的书', settings: '设置' };
    document.getElementById('pageTitle').textContent = titles[name] || '';
    if (name === 'home') this.renderDashboard();
    if (name === 'period') this.renderPeriodAll();
    if (name === 'books') this.renderBooks();
    if (name === 'inspiration') this.renderInspiration();
  },

  switchPeriodTab(name) {
    this.periodTab = name;
    document.querySelectorAll('[data-ptab]').forEach(t => t.classList.toggle('active', t.dataset.ptab === name));
    document.getElementById('pCalendarTab').classList.toggle('active', name === 'calendar');
    document.getElementById('pStatsTab').classList.toggle('active', name === 'stats');
    document.getElementById('pRecordTab').classList.toggle('active', name === 'record');
    if (name === 'calendar') this.renderPeriodYearCalendar();
    if (name === 'stats') this.renderPeriodChart();
    if (name === 'record') { this.renderPeriodMonthCalendar(); this.renderPeriodRecordPanel(); }
  },

  switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === name + 'Tab'));
  },

  renderDashboard() {
    var todayContainer = document.getElementById('dashboardToday');
    var grid = document.getElementById('dashboardGrid');
    var quick = document.getElementById('dashboardQuick');
    var plan = this.getTodayPlan();
    var today = this.getToday();
    var isChecked = !!this.checkins[today];

    // 今日训练卡片
    if (plan) {
      var isRest = plan.day === 6 || plan.day === 0;
      todayContainer.innerHTML = '<div class="dash-today-card" data-goto="workout">' +
        '<div class="dash-today-label">' + plan.dayName + ' · 今天</div>' +
        '<div class="dash-today-title">' + this.escapeHtml(plan.title) + '</div>' +
        '<div class="dash-today-meta">' + (plan.duration || (isRest ? '休息日' : '')) + (isChecked ? ' · 已打卡 ✓' : ' · 未打卡') + '</div>' +
      '</div>';
    } else {
      todayContainer.innerHTML = '<div class="dash-today-card" data-goto="workout"><div class="dash-today-label">今天</div><div class="dash-today-title">无训练计划</div></div>';
    }

    // 数据概览
    var sortedBody = this.bodyData.slice().sort((a,b) => a.date.localeCompare(b.date));
    var latest = sortedBody[sortedBody.length - 1];
    var weight = latest ? latest.weight.toFixed(1) + ' kg' : '—';
    var bodyFat = latest ? latest.bodyFat.toFixed(1) + '%' : '—';
    var checkinCount = Object.keys(this.checkins).length;
    var planCount = this.planData.length;

    grid.innerHTML =
      '<div class="dash-card" data-goto="workout">' +
        '<div class="dash-card-header"><span class="dash-card-title">体重</span></div>' +
        '<div class="dash-card-value">' + weight + '</div>' +
      '</div>' +
      '<div class="dash-card" data-goto="workout">' +
        '<div class="dash-card-header"><span class="dash-card-title">体脂率</span></div>' +
        '<div class="dash-card-value">' + bodyFat + '</div>' +
      '</div>' +
      '<div class="dash-card" data-goto="workout">' +
        '<div class="dash-card-header"><span class="dash-card-title">累计打卡</span></div>' +
        '<div class="dash-card-value">' + checkinCount + ' 次</div>' +
      '</div>' +
      '<div class="dash-card" data-goto="workout">' +
        '<div class="dash-card-header"><span class="dash-card-title">计划版本</span></div>' +
        '<div class="dash-card-value">' + planCount + ' 份</div>' +
      '</div>';

    // 快速入口
    quick.innerHTML =
      '<div class="dash-card" data-goto="workout"><div class="dash-card-header"><span class="dash-card-title">锻炼台</span></div><div class="dash-card-sub">训练计划 · 身体数据 · 日历</div></div>' +
      '<div class="dash-card" data-goto="period"><div class="dash-card-header"><span class="dash-card-title">生理期</span></div><div class="dash-card-sub">平均周期 ' + (this.getAvgCycleDays() || '—') + ' 天</div></div>' +
      '<div class="dash-card" data-goto="inspiration"><div class="dash-card-header"><span class="dash-card-title">灵感记录</span></div><div class="dash-card-sub">' + this.inspirationData.length + ' 条灵感</div></div>' +
      '<div class="dash-card" data-goto="books"><div class="dash-card-header"><span class="dash-card-title">想买的书</span></div><div class="dash-card-sub">' + this.bookData.filter(b => !b.purchased).length + ' 本待购</div></div>' +
      '<div class="dash-card" data-goto="settings"><div class="dash-card-header"><span class="dash-card-title">设置</span></div><div class="dash-card-sub">数据管理</div></div>';

    // 绑定卡片点击跳转
    document.querySelectorAll('[data-goto]').forEach(card => {
      card.onclick = () => this.switchModule(card.dataset.goto);
    });
  },
};
