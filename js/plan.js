/* 训练计划：今日计划、录入解析、历史计划、打卡 */
Object.assign(App, {
  // ===== 训练计划 =====
  getTodayPlan() {
    const day = new Date().getDay();
    const plan = this.getCurrentPlan();
    if (!plan) return null;
    return plan.days.find(d => d.day === day) || null;
  },

  renderPlan() {
    const container = document.getElementById('planList');
    const today = new Date().getDay();
    const plan = this.getCurrentPlan();
    if (!plan) {
      container.innerHTML = '<div class="empty-state">暂无训练计划</div>';
      return;
    }
    var days = plan.days.slice();
    var todayIdx = days.findIndex(d => d.day === today);
    if (todayIdx >= 0) {
      var todayItem = days.splice(todayIdx, 1)[0];
      days.unshift(todayItem);
    }
    const renderDay = p => {
      const isToday = p.day === today;
      const videoLink = p.bvid
        ? '<a class="plan-video-wrapper" href="https://www.bilibili.com/video/' + p.bvid + '/" target="_blank" rel="noopener">' +
            '<svg class="play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
            '<span class="video-text">观看视频 · ' + this.escapeHtml(p.videoTitle || '') + '</span>' +
          '</a>'
        : '';
      return '<div class="plan-day' + (isToday ? ' today' : '') + '">' +
        '<div class="plan-day-header">' +
          '<div class="plan-day-label">' +
            '<span class="day-badge">' + p.dayName + (isToday ? ' · 今天' : '') + '</span>' +
            '<span class="plan-day-title">' + this.escapeHtml(p.title) + '</span>' +
          '</div>' +
          (p.duration ? '<span class="plan-duration">' + this.escapeHtml(p.duration) + '</span>' : '') +
        '</div>' +
        videoLink +
      '</div>';
    };
    container.innerHTML = days.map(renderDay).join('');
  },

  renderHabits() {
    const container = document.getElementById('habitsList');
    container.innerHTML = DAILY_HABITS.map((h, i) =>
      '<li><span class="habits-num">' + (i+1) + '</span><span>' + this.escapeHtml(h) + '</span></li>'
    ).join('');
  },

  // ===== 计划录入与解析 =====
  parsePlanText(text) {
    var dayMap = { '周一':1, '周二':2, '周三':3, '周四':4, '周五':5, '周六':6, '周日':0 };
    var lines = text.trim().split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l; });
    var days = [];
    var errors = [];
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      var dayMatch = line.match(/^(周[一二三四五六日])/);
      if (!dayMatch) { i++; continue; }
      var dayName = dayMatch[1];
      var day = dayMap[dayName];
      var rest = line.substring(dayName.length).replace(/^[｜|]\s*/, '');
      var title = rest, duration = '';
      var durMatch = rest.match(/[（(]([^）)]*)[）)]\s*$/);
      if (durMatch) {
        duration = durMatch[1].trim();
        title = rest.replace(/[（(][^）)]*[）)]\s*$/, '').trim();
      }
      var videoTitle = '', bvid = '';
      if (i + 1 < lines.length) {
        var next = lines[i + 1];
        if (!next.match(/^周[一二三四五六日]/) && next.match(/^对应跟练视频[：:]/)) {
          videoTitle = next.replace(/^对应跟练视频[：:]\s*/, '');
          i++;
        }
      }
      if (i + 1 < lines.length) {
        var next2 = lines[i + 1];
        if (!next2.match(/^周[一二三四五六日]/) && next2.match(/^链接[：:]/)) {
          var url = next2.replace(/^链接[：:]\s*/, '');
          var bvMatch = url.match(/(BV[\w]+)/);
          if (bvMatch) bvid = bvMatch[1];
          i++;
        }
      }
      days.push({ day: day, dayName: dayName, title: title, duration: duration, videoTitle: videoTitle, bvid: bvid });
      i++;
    }
    days.sort(function(a, b) { return (a.day === 0 ? 7 : a.day) - (b.day === 0 ? 7 : b.day); });
    if (days.length === 0) return { error: '未解析到任何计划内容' };
    return { days: days };
  },

  showPlanInputModal() {
    document.getElementById('planInputOverlay').classList.remove('hidden');
    document.getElementById('planInputText').value = '';
  },
  hidePlanInputModal() {
    document.getElementById('planInputOverlay').classList.add('hidden');
  },
  saveNewPlan() {
    var text = document.getElementById('planInputText').value.trim();
    if (!text) { this.toast('请粘贴计划内容'); return; }
    var result = this.parsePlanText(text);
    if (result.error) { this.toast('解析失败：' + result.error); return; }
    if (result.days.length < 7) { this.toast('只解析到 ' + result.days.length + ' 天，需要 7 天'); return; }
    var newPlan = { id: this.uid(), createdAt: Date.now(), days: result.days };
    this.planData.push(newPlan);
    this.savePlans();
    this.hidePlanInputModal();
    this.renderPlan();
    this.renderToday();
    this.renderHistory();
    this.renderCalendar();
    this.toast('新计划已保存，旧计划已归档');
  },
  restorePlan(id) {
    var plan = this.planData.find(function(p) { return p.id === id; });
    if (!plan) return;
    this.showModal('恢复历史计划', '将把该计划设为当前计划，当前计划会自动归档。确定继续吗？', () => {
      this.planData = this.planData.filter(function(p) { return p.id !== id; });
      this.planData.push(plan);
      this.savePlans();
      this.renderPlan();
      this.renderToday();
      this.renderHistory();
      this.renderCalendar();
      this.toast('已恢复为当前计划');
    });
  },

  // ===== 历史计划渲染 =====
  renderHistory() {
    var container = document.getElementById('historyList');
    if (!container) return;
    if (this.planData.length <= 1) {
      container.innerHTML = '<div class="history-empty">暂无历史计划</div>';
      return;
    }
    var history = this.planData.slice(0, -1).reverse();
    var self = this;
    container.innerHTML = history.map(function(plan) {
      var dt = new Date(plan.createdAt);
      var time = dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0') + ' ' + String(dt.getHours()).padStart(2,'0') + ':' + String(dt.getMinutes()).padStart(2,'0');
      var daysHtml = plan.days.map(function(d) {
        return '<div class="history-day-row"><span class="history-day-name">' + d.dayName + '</span><span class="history-day-title">' + self.escapeHtml(d.title) + '</span></div>';
      }).join('');
      return '<div class="history-item">' +
        '<div class="history-item-header">' +
          '<span class="history-item-time" data-id="' + plan.id + '" style="cursor:pointer">' + time + ' · 点击查看详情</span>' +
          '<button class="history-restore-btn" data-id="' + plan.id + '">恢复为当前</button>' +
        '</div>' +
        '<div class="history-detail" id="historyDetail_' + plan.id + '">' + daysHtml + '</div>' +
      '</div>';
    }).join('');
    container.querySelectorAll('.history-item-time').forEach(function(el) {
      el.onclick = function() {
        var detail = document.getElementById('historyDetail_' + el.dataset.id);
        if (detail) detail.classList.toggle('open');
      };
    });
    container.querySelectorAll('.history-restore-btn').forEach(function(btn) {
      btn.onclick = function() { self.restorePlan(btn.dataset.id); };
    });
  },

  // ===== 打卡 =====
  toggleCheckin(date) {
    if (date !== this.getToday()) {
      this.toast('过去的记录不可修改');
      return;
    }
    if (this.checkins[date]) {
      delete this.checkins[date];
      this.toast('已取消今日打卡');
    } else {
      var plan = this.getTodayPlan();
      var curPlan = this.getCurrentPlan();
      this.checkins[date] = {
        planId: curPlan ? curPlan.id : null,
        day: plan ? plan.day : null,
        completedAt: Date.now()
      };
      this.toast('今日训练打卡成功');
    }
    this.saveCheckins();
    this.renderToday();
    this.renderCalendar();
  },
});
