/* 身体数据渲染：统计卡、折线图、历史列表 */
Object.assign(App, {
  // ===== 渲染 =====
  renderAll() {
    this.renderToday();
    this.renderPlan();
    this.renderHistory();
    this.renderHabits();
    this.renderBodyData();
    this.renderTypeManage();
    this.renderCalendar();
    this.renderDashboard();
    this.renderPeriodAll();
    this.renderBooks();
    this.renderInspiration();
  },
  renderPeriodAll() {
    this.renderPeriodYearCalendar();
    this.renderPeriodChart();
    this.renderPeriodMonthCalendar();
    this.renderPeriodRecordPanel();
  },

  renderTypeManage() {
    const container = document.getElementById('typeManage');
    let html = this.types.map(t =>
      '<span class="type-chip">'+this.escapeHtml(t)+'<span class="remove" data-type="'+this.escapeHtml(t)+'">×</span></span>'
    ).join('');
    html += '<button class="type-add" id="typeAddBtn">＋ 添加类型</button>';
    container.innerHTML = html;

    container.querySelectorAll('.remove').forEach(el => {
      el.onclick = () => {
        const t = el.dataset.type;
        this.types = this.types.filter(x => x !== t);
        this.saveTypes();
        this.renderTypeManage();
        this.toast('已删除类型：' + t);
      };
    });
    document.getElementById('typeAddBtn').onclick = () => {
      const name = prompt('输入运动类型名称：');
      if (name && name.trim()) {
        const t = name.trim();
        if (!this.types.includes(t)) {
          this.types.push(t);
          this.saveTypes();
          this.renderTypeManage();
          this.toast('已添加类型：' + t);
        }
      }
    };
  },

  renderToday() {
    const container = document.getElementById('todayList');
    const plan = this.getTodayPlan();

    if (!plan) {
      container.innerHTML = '<div class="today-empty">今天没有训练计划</div>';
      return;
    }

    const today = this.getToday();
    const isChecked = !!this.checkins[today];
    const isRest = plan.day === 6 || plan.day === 0;
    const checkinCls = isChecked ? ' checked' : '';
    const cardCls = isChecked ? ' checked' : '';

    container.innerHTML = '<div class="today-plan-card' + cardCls + '">' +
      '<div class="today-checkin' + checkinCls + '" id="todayCheckin">' +
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
      '</div>' +
      '<span class="today-plan-day">' + plan.dayName + ' · 今天</span>' +
      '<div class="today-plan-info">' +
        '<div class="today-plan-title">' + this.escapeHtml(plan.title) + '</div>' +
        '<div class="today-plan-meta">' + (plan.duration || (isRest ? '休息日' : '')) + '</div>' +
      '</div>' +
      (plan.bvid ? '<a class="plan-action-btn video" href="https://www.bilibili.com/video/' + plan.bvid + '/" target="_blank" rel="noopener">跟练</a>' : '') +
    '</div>';

    const checkinBtn = container.querySelector('#todayCheckin');
    if (checkinBtn) {
      checkinBtn.onclick = () => this.toggleCheckin(today);
    }

    const btn = container.querySelector('.plan-action-btn.video');
    if (btn) {
      btn.onclick = () => {
        const card = document.querySelector('.plan-day.today');
        if (card) {
          card.scrollIntoView({behavior:'smooth', block:'center'});
        }
      };
    }
  },

  renderBodyData() {
    this.renderChart();
    this.renderBodyStats();
    this.renderBodyList();
  },

  renderBodyStats() {
    const container = document.getElementById('bodyStats');
    const sorted = this.bodyData.slice().sort((a,b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) {
      container.innerHTML = '';
      return;
    }
    const latest = sorted[sorted.length - 1];
    const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;

    const wChange = prev ? latest.weight - prev.weight : 0;
    const fChange = prev ? latest.bodyFat - prev.bodyFat : 0;

    const fmtChange = (v, unit) => {
      if (v === 0) return '<span class="stat-change flat">—</span>';
      const cls = v > 0 ? 'up' : 'down';
      const arrow = v > 0 ? '↑' : '↓';
      return '<span class="stat-change '+cls+'">'+arrow+' '+Math.abs(v).toFixed(1)+unit+'</span>';
    };

    container.innerHTML =
      '<div class="stat-card">' +
        '<div class="stat-value">'+latest.weight.toFixed(1)+'</div>' +
        '<div class="stat-label">体重 (kg)</div>' +
        fmtChange(wChange, '') +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-value">'+latest.bodyFat.toFixed(1)+'%</div>' +
        '<div class="stat-label">体脂率</div>' +
        fmtChange(fChange, '%') +
      '</div>';
  },

  renderChart() {
    const container = document.getElementById('chartContainer');
    const data = this.bodyData.slice().sort((a,b) => a.date.localeCompare(b.date));

    if (data.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:24px">暂无数据，添加后自动生成趋势图</div>';
      return;
    }

    const W = 640, H = 220;
    const pad = { top:20, right:50, bottom:35, left:45 };
    const pw = W - pad.left - pad.right;
    const ph = H - pad.top - pad.bottom;

    const weights = data.map(d => d.weight);
    const fats = data.map(d => d.bodyFat);
    let wMin = Math.min(...weights), wMax = Math.max(...weights);
    let fMin = Math.min(...fats), fMax = Math.max(...fats);
    if (wMin === wMax) { wMin -= 1; wMax += 1; }
    if (fMin === fMax) { fMin -= 1; fMax += 1; }
    wMin = Math.floor((wMin - 0.5) * 10) / 10;
    wMax = Math.ceil((wMax + 0.5) * 10) / 10;
    fMin = Math.floor((fMin - 0.5) * 10) / 10;
    fMax = Math.ceil((fMax + 0.5) * 10) / 10;
    const wRange = wMax - wMin || 1;
    const fRange = fMax - fMin || 1;

    const xPos = i => data.length > 1 ? pad.left + (i / (data.length - 1)) * pw : pad.left + pw / 2;
    const wY = v => pad.top + (1 - (v - wMin) / wRange) * ph;
    const fY = v => pad.top + (1 - (v - fMin) / fRange) * ph;

    let wPath = '', fPath = '', wDots = '', fDots = '';
    data.forEach((d, i) => {
      const x = xPos(i);
      const wy = wY(d.weight);
      const fy = fY(d.bodyFat);
      wPath += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + wy.toFixed(1) + ' ';
      fPath += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + fy.toFixed(1) + ' ';
      wDots += '<circle cx="'+x.toFixed(1)+'" cy="'+wy.toFixed(1)+'" r="3.5" fill="#1a1a1a"/>';
      fDots += '<circle cx="'+x.toFixed(1)+'" cy="'+fy.toFixed(1)+'" r="3.5" fill="#999" stroke="#fff" stroke-width="1.5"/>';
    });

    // 网格线
    let grid = '';
    for (let i = 0; i <= 2; i++) {
      const y = pad.top + (i / 2) * ph;
      grid += '<line x1="'+pad.left+'" y1="'+y.toFixed(1)+'" x2="'+(W-pad.right)+'" y2="'+y.toFixed(1)+'" stroke="#f0f0f0" stroke-width="1"/>';
    }

    // Y 轴标签
    const wLabels = [wMax, (wMin+wMax)/2, wMin];
    const fLabels = [fMax, (fMin+fMax)/2, fMin];
    let wLabelHtml = '', fLabelHtml = '';
    wLabels.forEach((v, i) => {
      const y = pad.top + (i/2)*ph;
      wLabelHtml += '<text x="'+(pad.left-8)+'" y="'+(y+4).toFixed(1)+'" font-size="11" fill="#1a1a1a" text-anchor="end">'+v.toFixed(1)+'</text>';
    });
    fLabels.forEach((v, i) => {
      const y = pad.top + (i/2)*ph;
      fLabelHtml += '<text x="'+(W-pad.right+8)+'" y="'+(y+4).toFixed(1)+'" font-size="11" fill="#999" text-anchor="start">'+v.toFixed(1)+'%</text>';
    });

    // X 轴标签
    let xLabelHtml = '';
    data.forEach((d, i) => {
      if (data.length > 7 && i % 2 !== 0 && i !== data.length - 1) return;
      const x = xPos(i);
      xLabelHtml += '<text x="'+x.toFixed(1)+'" y="'+(H-10)+'" font-size="11" fill="#999" text-anchor="middle">'+d.date.slice(5)+'</text>';
    });

    container.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="max-height:240px;display:block">' +
      grid + wLabelHtml + fLabelHtml +
      '<path d="'+wPath+'" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      wDots +
      '<path d="'+fPath+'" fill="none" stroke="#999" stroke-width="2" stroke-dasharray="5,3" stroke-linejoin="round" stroke-linecap="round"/>' +
      fDots + xLabelHtml +
    '</svg>';
  },

  renderBodyList() {
    const container = document.getElementById('bodyList');
    const sorted = this.bodyData.slice().sort((a,b) => b.date.localeCompare(a.date));

    if (sorted.length === 0) {
      container.innerHTML = '<div class="empty-state">' +
        '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>' +
        '<div>还没有身体数据，开始记录吧</div></div>';
      return;
    }

    container.innerHTML = sorted.map(d => {
      var tags = '';
      if (d.neck) tags += '<span class="body-tag">颈围 ' + d.neck.toFixed(1) + '</span>';
      if (d.waist) tags += '<span class="body-tag">腰围 ' + d.waist.toFixed(1) + '</span>';
      if (d.hip) tags += '<span class="body-tag">臀围 ' + d.hip.toFixed(1) + '</span>';
      var sourceTag = d.bodyFatSource === 'calc'
        ? '<span class="body-tag calc">围度计算</span>'
        : '<span class="body-tag">手动输入</span>';
      return '<div class="record-item">' +
        '<div class="record-item-header">' +
          '<div class="record-item-title">' +
            '<span class="record-date">' + d.date + '</span>' +
          '</div>' +
          '<button class="record-del" data-id="' + d.id + '">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="record-meta">' +
          '<span class="record-meta-item">体重 ' + d.weight.toFixed(1) + ' kg</span>' +
          '<span class="record-meta-item">体脂率 ' + d.bodyFat.toFixed(1) + '%</span>' +
        '</div>' +
        (tags ? '<div class="body-detail-tags">' + sourceTag + tags + '</div>' : '') +
      '</div>';
    }).join('');

    container.querySelectorAll('.record-del').forEach(btn => {
      btn.onclick = () => this.deleteBodyData(btn.dataset.id);
    });
  },
});
