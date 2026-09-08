/* 生理期：工具方法、年度日历、统计柱状图、记录管理 */
Object.assign(App, {
  // ===== 生理期工具方法 =====
  diffDays(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1 + 'T00:00:00Z');
    const d2 = new Date(dateStr2 + 'T00:00:00Z');
    return Math.round((d2 - d1) / 86400000);
  },
  addDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth()+1).padStart(2,'0') + '-' + String(d.getUTCDate()).padStart(2,'0');
  },
  mensesDays(p) {
    return this.diffDays(p.startDate, p.endDate) + 1;
  },
  // 获取排序后的经期记录（按开始日期升序）
  getSortedPeriods() {
    return this.periodData.slice().sort((a,b) => a.startDate.localeCompare(b.startDate));
  },
  // 计算所有周期（相邻两次经期开始日期间隔），返回 [{startDate, cycleDays, mensesDays, flow, pain}]
  getPeriodCycles() {
    const sorted = this.getSortedPeriods();
    if (sorted.length === 0) return [];
    const cycles = [];
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      let cycleDays = null;
      if (i < sorted.length - 1) {
        cycleDays = this.diffDays(p.startDate, sorted[i+1].startDate);
      }
      cycles.push({
        id: p.id,
        startDate: p.startDate,
        endDate: p.endDate,
        cycleDays: cycleDays,
        mensesDays: this.mensesDays(p),
        flow: p.flow || 3,
        pain: typeof p.pain === 'number' ? p.pain : 1,
        note: p.note || ''
      });
    }
    return cycles;
  },
  getAvgCycleDays() {
    const cycles = this.getPeriodCycles().filter(c => c.cycleDays !== null);
    if (cycles.length === 0) return 28;
    const valid = cycles.map(c => c.cycleDays).filter(d => d >= 15 && d <= 90);
    if (valid.length === 0) return 28;
    return Math.round(valid.reduce((a,b) => a+b, 0) / valid.length);
  },
  getAvgMensesDays() {
    const cycles = this.getPeriodCycles();
    if (cycles.length === 0) return 5;
    const valid = cycles.map(c => c.mensesDays).filter(d => d >= 1 && d <= 15);
    if (valid.length === 0) return 5;
    return Math.round(valid.reduce((a,b) => a+b, 0) / valid.length * 10) / 10;
  },
  // 获取某天的状态：null(正常) | 'menstrual' | 'ovulation' | 'predicted' | 'predicted-ovulation'
  getDateStatus(dateStr) {
    const sorted = this.getSortedPeriods();
    const avgCycle = this.getAvgCycleDays();
    const avgMenses = Math.round(this.getAvgMensesDays());
    // 检查已记录的经期
    for (const p of sorted) {
      const diffS = this.diffDays(p.startDate, dateStr);
      const diffE = this.diffDays(dateStr, p.endDate);
      if (diffS >= 0 && diffE >= 0) return { type:'menstrual', ref:p };
    }
    // 检查已记录经期对应的排卵期（下次经期前14天为排卵日，前5后4为排卵期）
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const nextStart = sorted[i+1] ? sorted[i+1].startDate : this.addDays(p.startDate, avgCycle);
      const ovuDay = this.addDays(nextStart, -14);
      const ovuStart = this.addDays(ovuDay, -5);
      const ovuEnd = this.addDays(ovuDay, 4);
      const d1 = this.diffDays(ovuStart, dateStr);
      const d2 = this.diffDays(dateStr, ovuEnd);
      if (d1 >= 0 && d2 >= 0) {
        // 只标记排卵期（不与经期重叠）
        const inMenstrual = sorted.some(pp => {
          const a = this.diffDays(pp.startDate, dateStr);
          const b = this.diffDays(dateStr, pp.endDate);
          return a >= 0 && b >= 0;
        });
        if (!inMenstrual) return { type:'ovulation', ref:p };
      }
    }
    // 预测下次经期（基于最后一条记录+平均周期）
    if (sorted.length > 0) {
      const last = sorted[sorted.length - 1];
      const predictedStart = this.addDays(last.startDate, avgCycle);
      const predictedEnd = this.addDays(predictedStart, avgMenses - 1);
      const dp1 = this.diffDays(predictedStart, dateStr);
      const dp2 = this.diffDays(dateStr, predictedEnd);
      if (dp1 >= 0 && dp2 >= 0) return { type:'predicted', ref:last };
      // 预测排卵期
      const predOvuDay = this.addDays(predictedStart, -14);
      const predOvuStart = this.addDays(predOvuDay, -5);
      const predOvuEnd = this.addDays(predOvuDay, 4);
      const do1 = this.diffDays(predOvuStart, dateStr);
      const do2 = this.diffDays(dateStr, predOvuEnd);
      if (do1 >= 0 && do2 >= 0) return { type:'predicted-ovulation', ref:last };
    }
    return null;
  },

  loadSampleData() {
    const today = this.getToday();
    const d3 = this.offsetDate(today, -4);
    const d4 = this.offsetDate(today, -6);
    const d5 = this.offsetDate(today, -9);

    this.bodyData = [
      { id:this.uid(), date:d5, weight:65.5, bodyFat:23.2, gender:'female', height:165, neck:34.0, waist:71.0, hip:93.0, bodyFatSource:'calc', createdAt:Date.now()-600000000 },
      { id:this.uid(), date:d4, weight:65.2, bodyFat:22.8, gender:'female', height:165, neck:34.0, waist:70.5, hip:92.5, bodyFatSource:'calc', createdAt:Date.now()-500000000 },
      { id:this.uid(), date:d3, weight:64.8, bodyFat:21.8, gender:'female', height:165, neck:33.8, waist:69.5, hip:91.5, bodyFatSource:'calc', createdAt:Date.now()-400000000 }
    ];

    this.isSample = true;
    this.saveAll();
  },

  saveAll() {
    localStorage.setItem(this.KEYS.records, JSON.stringify(this.records));
    localStorage.setItem(this.KEYS.body, JSON.stringify(this.bodyData));
    const oldMeta = JSON.parse(localStorage.getItem(this.KEYS.meta) || '{}');
    localStorage.setItem(this.KEYS.meta, JSON.stringify(Object.assign(oldMeta, { isSample: this.isSample })));
  },
  savePlans() {
    localStorage.setItem(this.KEYS.plans, JSON.stringify(this.planData));
  },
  saveCheckins() {
    localStorage.setItem(this.KEYS.checkins, JSON.stringify(this.checkins));
  },
  initDefaultPlan() {
    var days = WEEKLY_PLAN.map(function(p) {
      return { day: p.day, dayName: p.dayName, title: p.title, duration: p.duration, videoTitle: p.videoTitle, bvid: p.bvid };
    });
    this.planData = [{ id: this.uid(), createdAt: Date.now(), days: days }];
    this.savePlans();
  },
  getCurrentPlan() {
    return this.planData[this.planData.length - 1] || null;
  },
  saveTypes() {
    localStorage.setItem(this.KEYS.types, JSON.stringify(this.types));
  },
  // ===== 生理期：年度日历渲染 =====
  renderPeriodYearCalendar() {
    const container = document.getElementById('periodYearGrid');
    if (!container) return;
    const title = document.getElementById('pYearTitle');
    if (title) title.textContent = this.periodYear;
    const y = this.periodYear;
    const weekdays = ['日','一','二','三','四','五','六'];
    let html = '';
    for (let m = 0; m < 12; m++) {
      html += '<div class="period-mini-month">';
      html += '<div class="period-mini-month-title">' + (m+1) + '月</div>';
      html += '<div class="period-mini-grid">';
      weekdays.forEach(w => { html += '<div class="period-mini-wd">' + w + '</div>'; });
      const firstDay = new Date(Date.UTC(y, m, 1)).getUTCDay();
      const daysInMonth = new Date(Date.UTC(y, m+1, 0)).getUTCDate();
      const prevMonthDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
      // 上月补位
      for (let i = firstDay - 1; i >= 0; i--) {
        html += '<div class="period-mini-cell other-month">' + (prevMonthDays - i) + '</div>';
      }
      // 当月
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
        const status = this.getDateStatus(ds);
        let cls = 'period-mini-cell';
        if (status) cls += ' ' + status.type;
        html += '<div class="' + cls + '">' + d + '</div>';
      }
      // 下月补位
      const total = firstDay + daysInMonth;
      const remaining = (7 - (total % 7)) % 7;
      for (let i = 1; i <= remaining; i++) {
        html += '<div class="period-mini-cell other-month">' + i + '</div>';
      }
      html += '</div></div>';
    }
    container.innerHTML = html;
  },
  periodYearPrev() {
    this.periodYear--;
    this.renderPeriodYearCalendar();
  },
  periodYearNext() {
    this.periodYear++;
    this.renderPeriodYearCalendar();
  },
  // ===== 生理期：统计柱状图 =====
  renderPeriodChart() {
    const container = document.getElementById('periodChartContainer');
    if (!container) return;
    const cycles = this.getPeriodCycles();
    // 统计卡片
    const avgCycle = this.getAvgCycleDays();
    const avgMenses = this.getAvgMensesDays();
    document.getElementById('avgMensesDays').textContent = avgMenses;
    document.getElementById('avgCycleDays').textContent = avgCycle;

    const cards = document.getElementById('periodStatsCards');
    if (cards) {
      const sorted = this.getSortedPeriods();
      const last = sorted[sorted.length - 1];
      let nextPred = '—';
      if (last) {
        const nextStart = this.addDays(last.startDate, avgCycle);
        nextPred = nextStart.slice(5);
      }
      let currentCycleDay = '—';
      if (last) {
        const today = this.getToday();
        const diff = this.diffDays(last.startDate, today);
        if (diff >= 0) currentCycleDay = '第 ' + (diff + 1) + ' 天';
      }
      cards.innerHTML =
        '<div class="stat-card">' +
          '<div class="stat-value">' + avgCycle + '</div>' +
          '<div class="stat-label">平均周期(天)</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + avgMenses + '</div>' +
          '<div class="stat-label">平均经期(天)</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + nextPred + '</div>' +
          '<div class="stat-label">预计下次</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + currentCycleDay + '</div>' +
          '<div class="stat-label">当前周期</div>' +
        '</div>';
    }

    if (cycles.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:24px">暂无数据，先去记录吧</div>';
      return;
    }

    // 细柱图显示全部周期，宽柱图显示最近12个
    const showCycles = this.periodChartType === 'narrow' ? cycles : cycles.slice(-12);
    const N = showCycles.length;
    const W = 720;
    const ww = window.innerWidth;
    const svgH = ww <= 480 ? 460 : (ww <= 640 ? 500 : 540);
    const cw = container.clientWidth || 320;
    // viewBox高度匹配容器渲染比例 → X/Y缩放率完全相等 → 字体等比不变形
    const H = Math.round(W * svgH / cw);
    // 字体补偿因子：因viewBox在窄屏上被等比缩小，字体需放大才能保持可读
    // X_scale = cw/720, 要得到14px实际像素, 需要 fontSize = 14 / (cw/720) = 14*720/cw
    const fsScale = Math.min(2.2, Math.max(1.0, 720 / cw));
    const fs = (base) => Math.round(base * fsScale);
    const fsY = (base) => (base * fsScale).toFixed(1);  // Y偏移也按比例缩放
    const pad = { top: 82, right: 40, bottom: 70, left: 42 };
    const pw = W - pad.left - pad.right;
    const ph = H - pad.top - pad.bottom;

    // Y轴范围：周期天数
    const cycleVals = showCycles.map(c => c.cycleDays).filter(v => v !== null);
    const maxCycle = Math.max(80, ...cycleVals);
    const yMax = Math.ceil(maxCycle / 10) * 10;
    const yMin = 0;
    const yRange = yMax - yMin || 1;

    const barWidth = this.periodChartType === 'wide' ? pw / (N * 1.12) : Math.min(36, pw / (N * 1.35));
    const step = pw / N;

    // 网格线 & Y轴标签
    let grid = '';
    let yLabels = '';
    for (let i = 0; i <= 4; i++) {
      const val = yMax - (yMax / 4) * i;
      const y = pad.top + (i / 4) * ph;
      grid += '<line x1="'+pad.left+'" y1="'+y.toFixed(1)+'" x2="'+(W-pad.right)+'" y2="'+y.toFixed(1)+'" stroke="#f0f0f0" stroke-width="1"/>';
      yLabels += '<text x="'+(pad.left-10)+'" y="'+(y+fsY(5))+'" font-size="'+fs(14)+'" fill="#666" text-anchor="end" font-weight="600">'+Math.round(val)+'</text>';
    }

    // 参考线（仅保留虚线，文字标签移到底部HTML图例区，避免手机窄屏截断）
    const avgCycleY = pad.top + (1 - (avgCycle - yMin) / yRange) * ph;
    const idealCycle = 28;
    const idealY = pad.top + (1 - (idealCycle - yMin) / yRange) * ph;
    const avgMensesY = pad.top + (1 - (avgMenses - yMin) / yRange) * ph;
    let refLines = '';
    refLines += '<line x1="'+pad.left+'" y1="'+avgMensesY.toFixed(1)+'" x2="'+(W-pad.right)+'" y2="'+avgMensesY.toFixed(1)+'" stroke="#ff6b8a" stroke-width="1.5" stroke-dasharray="5,4"/>';
    refLines += '<line x1="'+pad.left+'" y1="'+idealY.toFixed(1)+'" x2="'+(W-pad.right)+'" y2="'+idealY.toFixed(1)+'" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="5,4"/>';
    refLines += '<line x1="'+pad.left+'" y1="'+avgCycleY.toFixed(1)+'" x2="'+(W-pad.right)+'" y2="'+avgCycleY.toFixed(1)+'" stroke="#a8d8ea" stroke-width="1.5" stroke-dasharray="5,4"/>';

    // 柱子和标签
    let bars = '';
    let xLabels = '';
    let topLabels = '';
    let earlinessTags = '';
    // earliness标签：固定在viewBox顶部，高度随字体动态调整
    const tagFs = fs(12);
    const tagH = Math.max(22, Math.round(tagFs * 1.5));
    const earlinessY = 8;
    const tagW = Math.min(46, step - 4);
    const tagTextY = earlinessY + Math.round(tagH / 2 + tagFs * 0.35);

    showCycles.forEach((c, i) => {
      const cx = pad.left + step * i + step / 2;
      const cycleDay = c.cycleDays;
      const mensesDay = c.mensesDays;
      const barX = cx - barWidth / 2;

      if (cycleDay !== null) {
        const cycleH = (cycleDay / yRange) * ph;
        const cycleY = pad.top + ph - cycleH;
        const r = Math.min(10, barWidth / 2);
        const off = fsY(3);  // 内描边偏移量按字体缩放比例
        bars += '<rect x="'+barX.toFixed(1)+'" y="'+cycleY.toFixed(1)+'" width="'+barWidth.toFixed(1)+'" height="'+cycleH.toFixed(1)+'" rx="'+r+'" ry="'+r+'" fill="none" stroke="#a8d8ea" stroke-width="2.5"/>';
        bars += '<rect x="'+(barX+parseFloat(off)).toFixed(1)+'" y="'+(cycleY+parseFloat(off)).toFixed(1)+'" width="'+(barWidth-parseFloat(fsY(6))).toFixed(1)+'" height="'+(cycleH-parseFloat(fsY(6))).toFixed(1)+'" rx="'+(r-3)+'" ry="'+(r-3)+'" fill="#e0f2fe" opacity="0.85"/>';
        topLabels += '<text x="'+cx.toFixed(1)+'" y="'+(cycleY-fsY(9))+'" font-size="'+fs(16)+'" fill="#2563eb" text-anchor="middle" font-weight="700">'+cycleDay+'</text>';
        const diff = cycleDay - avgCycle;
        if (Math.abs(diff) >= 1) {
          const label = diff > 0 ? '迟' + diff : '早' + Math.abs(diff);
          const color = diff > 0 ? '#f59e0b' : '#f97316';
          earlinessTags += '<rect x="'+(cx-tagW/2).toFixed(1)+'" y="'+earlinessY+'" width="'+tagW+'" height="'+tagH+'" rx="5" ry="5" fill="'+color+'" opacity="0.95"/>';
          earlinessTags += '<text x="'+cx.toFixed(1)+'" y="'+tagTextY+'" font-size="'+tagFs+'" fill="#fff" text-anchor="middle" font-weight="700">'+label+'</text>';
        }
      } else {
        const today = this.getToday();
        const lastStart = c.startDate;
        const curDay = this.diffDays(lastStart, today) + 1;
        if (curDay > 0) {
          const ch = Math.min(curDay, yMax);
          const cycleH = (ch / yRange) * ph;
          const cycleY = pad.top + ph - cycleH;
          const r = Math.min(10, barWidth / 2);
          const off = fsY(3);
          bars += '<rect x="'+barX.toFixed(1)+'" y="'+cycleY.toFixed(1)+'" width="'+barWidth.toFixed(1)+'" height="'+cycleH.toFixed(1)+'" rx="'+r+'" ry="'+r+'" fill="#fff" stroke="#3b82f6" stroke-width="2.5" stroke-dasharray="5,4"/>';
          topLabels += '<text x="'+cx.toFixed(1)+'" y="'+(cycleY-fsY(9))+'" font-size="'+fs(15)+'" fill="#3b82f6" text-anchor="middle" font-weight="700">当前'+curDay+'</text>';
        }
      }

      const mensesH = (mensesDay / yRange) * ph;
      const mensesY = pad.top + ph - mensesH;
      const mr = Math.min(10, barWidth / 2);
      bars += '<rect x="'+barX.toFixed(1)+'" y="'+mensesY.toFixed(1)+'" width="'+barWidth.toFixed(1)+'" height="'+mensesH.toFixed(1)+'" rx="'+mr+'" ry="'+mr+'" fill="#ff6b8a"/>';
      topLabels += '<text x="'+cx.toFixed(1)+'" y="'+(pad.top+ph-fsY(5))+'" font-size="'+fs(14)+'" fill="#fff" text-anchor="middle" font-weight="700">'+mensesDay+'</text>';

      const m = parseInt(c.startDate.slice(5,7));
      const d = parseInt(c.startDate.slice(8,10));
      xLabels += '<text x="'+cx.toFixed(1)+'" y="'+(H-fsY(10))+'" font-size="'+fs(10)+'" fill="#666" text-anchor="middle" font-weight="500">'+m+'.'+d+'</text>';
    });

    // X轴基线
    grid += '<line x1="'+pad.left+'" y1="'+(pad.top+ph).toFixed(1)+'" x2="'+(W-pad.right)+'" y2="'+(pad.top+ph).toFixed(1)+'" stroke="#d8d8d8" stroke-width="1"/>';

    container.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" style="display:block;width:100%;height:'+svgH+'px">' +
      grid + yLabels + refLines + bars + xLabels + topLabels + earlinessTags +
    '</svg>';
  },
  // ===== 生理期：记录管理 =====
  // ===== 生理期：记录Tab（单月历 + 浮动面板） =====
  renderPeriodMonthCalendar() {
    const grid = document.getElementById('periodMonthGrid');
    if (!grid) return;
    const label = document.getElementById('pMonthLabel');
    const title = document.getElementById('pMonthTitle');
    const y = this.periodMonth.year;
    const m = this.periodMonth.month;
    label.textContent = y + '-' + String(m+1).padStart(2,'0');
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    title.textContent = monthNames[m];
    // 按周一为首日：getUTCDay() 0=周日,1=周一...6=周六
    // 转换为：0=周一...6=周日
    const toMonFirst = (dow) => (dow === 0 ? 6 : dow - 1);
    const firstDayUTC = new Date(Date.UTC(y, m, 1));
    const firstDayOfWeek = toMonFirst(firstDayUTC.getUTCDay());
    const daysInMonth = new Date(Date.UTC(y, m+1, 0)).getUTCDate();
    const prevMonthDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const today = this.getToday();
    const todayParts = today.split('-').map(Number);
    const selected = this.periodSelectedDate;
    let html = '';
    // 上月补位
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = m === 0 ? 11 : m - 1;
      const prevY = m === 0 ? y - 1 : y;
      const ds = prevY + '-' + String(prevM+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      const status = this.getDateStatus(ds);
      let cls = 'period-day other-month';
      if (status) cls += ' ' + status.type;
      if (ds === selected) cls += ' selected';
      html += '<div class="' + cls + '" data-date="' + ds + '"><span class="day-label">' + d + '</span></div>';
    }
    // 当月
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      const status = this.getDateStatus(ds);
      let cls = 'period-day';
      if (status) cls += ' ' + status.type;
      if (ds === today) cls += ' today';
      if (ds === selected) cls += ' selected';
      // 显示特殊标签
      let extra = '';
      if (ds === today) extra = '<span class="day-label">今</span>';
      else extra = '<span class="day-label">' + d + '</span>';
      html += '<div class="' + cls + '" data-date="' + ds + '">' + extra + '</div>';
    }
    // 下月补位
    const total = firstDayOfWeek + daysInMonth;
    const remaining = (7 - (total % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = m === 11 ? 0 : m + 1;
      const nextY = m === 11 ? y + 1 : y;
      const ds = nextY + '-' + String(nextM+1).padStart(2,'0') + '-' + String(i).padStart(2,'0');
      const status = this.getDateStatus(ds);
      let cls = 'period-day other-month';
      if (status) cls += ' ' + status.type;
      if (ds === selected) cls += ' selected';
      html += '<div class="' + cls + '" data-date="' + ds + '"><span class="day-label">' + i + '</span></div>';
    }
    grid.innerHTML = html;
    // 日期点击事件
    grid.querySelectorAll('.period-day').forEach(cell => {
      cell.onclick = () => {
        this.periodSelectedDate = cell.dataset.date;
        this.renderPeriodMonthCalendar();
        this.renderPeriodRecordPanel();
      };
    });
  },
  periodMonthPrev() {
    if (this.periodMonth.month === 0) { this.periodMonth.month = 11; this.periodMonth.year--; }
    else { this.periodMonth.month--; }
    this.renderPeriodMonthCalendar();
  },
  periodMonthNext() {
    if (this.periodMonth.month === 11) { this.periodMonth.month = 0; this.periodMonth.year++; }
    else { this.periodMonth.month++; }
    this.renderPeriodMonthCalendar();
  },
  renderPeriodRecordPanel() {
    const dateEl = document.getElementById('pSelectedDate');
    if (dateEl) dateEl.textContent = this.periodSelectedDate;
    // 更新月经结束按钮状态：检查选中日期是否在已记录经期范围内
    const btnEnd = document.getElementById('pBtnEnd');
    if (btnEnd) {
      const sorted = this.getSortedPeriods();
      const inRecordedPeriod = sorted.some(p => {
        return this.periodSelectedDate >= p.startDate && this.periodSelectedDate <= p.endDate;
      });
      btnEnd.style.opacity = inRecordedPeriod ? '1' : '0.5';
    }
  },
  markPeriodStart() {
    this.isSample = false;
    const start = this.periodSelectedDate;
    const sorted = this.getSortedPeriods();
    // 检查是否已有包含该日期的记录
    const existing = sorted.find(p => start >= p.startDate && start <= p.endDate);
    if (existing) {
      this.toast('该日期已在经期记录中');
      return;
    }
    // 检查是否与上一条记录的结束日间隔<=3天（追加）
    const last = sorted[sorted.length - 1];
    if (last && this.diffDays(last.endDate, start) > 0 && this.diffDays(last.endDate, start) <= 3) {
      // 扩展上一条
      last.endDate = start;
      this.savePeriods();
      this.renderPeriodAll();
      this.toast('已扩展上一条经期记录');
      return;
    }
    // 新建记录
    this.periodData.push({
      id: this.uid(),
      startDate: start,
      endDate: start,
      flow: 3,
      pain: 1,
      note: '',
      createdAt: Date.now()
    });
    this.savePeriods();
    this.saveAll();
    this.renderPeriodAll();
    this.toast('已标记月经开始 ' + start);
  },
  markPeriodEnd() {
    const end = this.periodSelectedDate;
    const sorted = this.getSortedPeriods();
    // 查找包含该日期的记录
    const target = sorted.find(p => end >= p.startDate && end <= p.endDate);
    if (!target) {
      this.toast('该日期不在任何经期记录内');
      return;
    }
    if (target.startDate === end) {
      this.toast('结束日期不能与开始日期相同');
      return;
    }
    target.endDate = end;
    this.savePeriods();
    this.saveAll();
    this.renderPeriodAll();
    this.toast('已标记月经结束 ' + end);
  },
  openPeriodStatus() {
    const date = this.periodSelectedDate;
    // 查找该日期所在的记录（若有）
    const sorted = this.getSortedPeriods();
    const target = sorted.find(p => date >= p.startDate && date <= p.endDate);
    if (!target) {
      // 若无记录，询问是否创建
      this.showModal('状态设置', '该日期还没有经期记录，是否先创建一条？', () => {
        this.markPeriodStart();
      });
      return;
    }
    // 打开状态设置弹窗
    const flowLabels = ['','很少','少','中','多','很多'];
    const painLabels = ['无痛','微痛','轻痛','中痛','剧痛'];
    const html =
      '<div style="margin-bottom:12px">' +
        '<div style="font-weight:600;margin-bottom:8px">月经量</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap" id="statusFlowPicker">' +
          '<button class="intensity-btn' + (target.flow===1?' active':'') + '" data-val="1">很少</button>' +
          '<button class="intensity-btn' + (target.flow===2?' active':'') + '" data-val="2">少</button>' +
          '<button class="intensity-btn' + (target.flow===3?' active':'') + '" data-val="3">中</button>' +
          '<button class="intensity-btn' + (target.flow===4?' active':'') + '" data-val="4">多</button>' +
          '<button class="intensity-btn' + (target.flow===5?' active':'') + '" data-val="5">很多</button>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:12px">' +
        '<div style="font-weight:600;margin-bottom:8px">疼痛度</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap" id="statusPainPicker">' +
          '<button class="intensity-btn' + (target.pain===0?' active':'') + '" data-val="0">无痛</button>' +
          '<button class="intensity-btn' + (target.pain===1?' active':'') + '" data-val="1">微痛</button>' +
          '<button class="intensity-btn' + (target.pain===2?' active':'') + '" data-val="2">轻痛</button>' +
          '<button class="intensity-btn' + (target.pain===3?' active':'') + '" data-val="3">中痛</button>' +
          '<button class="intensity-btn' + (target.pain===4?' active':'') + '" data-val="4">剧痛</button>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:4px">' +
        '<div style="font-weight:600;margin-bottom:8px">备注</div>' +
        '<input type="text" id="statusNote" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:14px;box-sizing:border-box" placeholder="如：有血块、乏力等" value="' + this.escapeHtml(target.note||'') + '">' +
      '</div>';
    this.showModal('状态设置 · ' + date, html, () => {
      const flowBtn = document.querySelector('#statusFlowPicker .intensity-btn.active');
      const painBtn = document.querySelector('#statusPainPicker .intensity-btn.active');
      target.flow = flowBtn ? parseInt(flowBtn.dataset.val) : 3;
      target.pain = painBtn ? parseInt(painBtn.dataset.val) : 1;
      target.note = document.getElementById('statusNote').value.trim();
      this.savePeriods();
      this.saveAll();
      this.renderPeriodAll();
      this.toast('状态已更新');
    });
    // 绑定状态弹窗按钮（在showModal之后）
    setTimeout(() => {
      document.querySelectorAll('#statusFlowPicker .intensity-btn').forEach(b => {
        b.onclick = () => {
          document.querySelectorAll('#statusFlowPicker .intensity-btn').forEach(x => x.classList.remove('active'));
          b.classList.add('active');
        };
      });
      document.querySelectorAll('#statusPainPicker .intensity-btn').forEach(b => {
        b.onclick = () => {
          document.querySelectorAll('#statusPainPicker .intensity-btn').forEach(x => x.classList.remove('active'));
          b.classList.add('active');
        };
      });
    }, 50);
  },
  deletePeriod(id) {
    this.showModal('删除记录', '确定删除这条经期记录吗？', () => {
      this.periodData = this.periodData.filter(p => p.id !== id);
      this.savePeriods();
      this.renderPeriodAll();
      this.toast('记录已删除');
    });
  },
});
