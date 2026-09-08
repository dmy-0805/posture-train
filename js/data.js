/* 数据层：loadData、示例数据、生理期保存 */
Object.assign(App, {
  // ===== 数据 =====
  loadData() {
    this.records = JSON.parse(localStorage.getItem(this.KEYS.records) || '[]');
    this.bodyData = JSON.parse(localStorage.getItem(this.KEYS.body) || '[]');
    this.types = JSON.parse(localStorage.getItem(this.KEYS.types) || '[]');
    this.planData = JSON.parse(localStorage.getItem(this.KEYS.plans) || '[]');
    this.checkins = JSON.parse(localStorage.getItem(this.KEYS.checkins) || '{}');
    this.periodData = JSON.parse(localStorage.getItem(this.KEYS.periods) || '[]');
    this.bookData = JSON.parse(localStorage.getItem(this.KEYS.books) || '[]');
    this.inspirationData = JSON.parse(localStorage.getItem(this.KEYS.inspirations) || '[]');
    this._inspPendingImgs = [];
    this.bookTab = 'wishlist';
    const meta = JSON.parse(localStorage.getItem(this.KEYS.meta) || '{}');
    this.isSample = meta.isSample !== false;

    if (this.types.length === 0) {
      this.types = ['体态训练','跑步','瑜伽','力量训练','骑行','拉伸放松'];
      this.saveTypes();
    }
    if (this.planData.length === 0) {
      this.initDefaultPlan();
    }
    if (this.bodyData.length === 0 && this.isSample) {
      this.loadSampleData();
    }
    if (this.periodData.length === 0 && this.isSample) {
      this.loadSamplePeriods();
    }
    // 数据版本：v3=用户2026-08-09最新真实数据（2024-03 ~ 2026-05，19条），覆盖旧v1/v2
    const meta2 = JSON.parse(localStorage.getItem(this.KEYS.meta) || '{}');
    if (meta2.periodDataVersion !== 3) {
      this.loadSamplePeriods();
      localStorage.setItem(this.KEYS.meta, JSON.stringify(Object.assign(meta2, { isSample: this.isSample, periodDataVersion: 3 })));
    }
  },

  loadSamplePeriods() {
    // 用户真实数据（2024-03 ~ 2026-05）
    const samples = [
      { start:'2024-03-20', days:5, flow:3, pain:1 },
      { start:'2024-07-09', days:5, flow:3, pain:1 },
      { start:'2024-08-16', days:5, flow:3, pain:1 },
      { start:'2024-09-22', days:5, flow:3, pain:2 },
      { start:'2024-11-15', days:5, flow:3, pain:1 },
      { start:'2024-12-18', days:7, flow:4, pain:2 },
      { start:'2025-02-05', days:6, flow:3, pain:1 },
      { start:'2025-03-22', days:5, flow:3, pain:2 },
      { start:'2025-06-07', days:6, flow:3, pain:1 },
      { start:'2025-07-16', days:5, flow:3, pain:1 },
      { start:'2025-08-27', days:5, flow:3, pain:1 },
      { start:'2025-10-02', days:7, flow:4, pain:2 },
      { start:'2025-11-17', days:6, flow:3, pain:1 },
      { start:'2025-12-04', days:5, flow:3, pain:1 },
      { start:'2025-12-30', days:6, flow:3, pain:1 },
      { start:'2026-01-29', days:7, flow:4, pain:2 },
      { start:'2026-03-09', days:5, flow:3, pain:1 },
      { start:'2026-04-25', days:6, flow:3, pain:1 },
      { start:'2026-05-31', days:5, flow:3, pain:1 }
    ];
    this.periodData = samples.map(s => ({
      id: this.uid(),
      startDate: s.start,
      endDate: this.addDays(s.start, s.days - 1),
      flow: s.flow,
      pain: s.pain,
      note: '',
      createdAt: Date.now() - Math.random()*1e10
    }));
    this.savePeriods();
  },

  savePeriods() {
    localStorage.setItem(this.KEYS.periods, JSON.stringify(this.periodData));
  },
});
