/* 训练日历：月历视图、翻月 */
Object.assign(App, {
  // ===== 训练日历 =====
  renderCalendar() {
    var grid = document.getElementById('calendarGrid');
    var title = document.getElementById('calTitle');
    var detail = document.getElementById('calendarDetail');
    if (!grid) return;
    var now = new Date();
    if (!this.calendarMonth) {
      this.calendarMonth = { year: now.getFullYear(), month: now.getMonth() };
    }
    var y = this.calendarMonth.year, m = this.calendarMonth.month;
    title.textContent = y + '年' + (m + 1) + '月';
    var weekdays = ['日','一','二','三','四','五','六'];
    var html = weekdays.map(function(w) { return '<div class="calendar-weekday">' + w + '</div>'; }).join('');
    var firstDay = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var prevMonthDays = new Date(y, m, 0).getDate();
    var today = this.getToday();
    var self = this;
    for (var i = firstDay - 1; i >= 0; i--) {
      var d = prevMonthDays - i;
      var py = m === 0 ? y - 1 : y;
      var pm = m === 0 ? 11 : m - 1;
      var ds = py + '-' + String(pm + 1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      var comp = !!this.checkins[ds];
      html += '<div class="calendar-cell other-month' + (comp ? ' completed' : '') + '"><span class="cell-day">' + d + '</span>' + (comp ? '<span class="cell-dot"></span>' : '') + '</div>';
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var ds = y + '-' + String(m + 1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      var comp = !!this.checkins[ds];
      var isToday = ds === today;
      var cls = 'calendar-cell';
      if (comp) cls += ' completed';
      if (isToday) cls += ' today';
      html += '<div class="' + cls + '" data-date="' + ds + '"><span class="cell-day">' + d + '</span>' + (comp ? '<span class="cell-dot"></span>' : '') + '</div>';
    }
    var totalCells = firstDay + daysInMonth;
    var remaining = (7 - (totalCells % 7)) % 7;
    for (var i = 1; i <= remaining; i++) {
      var ny = m === 11 ? y + 1 : y;
      var nm = m === 11 ? 0 : m + 1;
      var ds = ny + '-' + String(nm + 1).padStart(2,'0') + '-' + String(i).padStart(2,'0');
      var comp = !!this.checkins[ds];
      html += '<div class="calendar-cell other-month' + (comp ? ' completed' : '') + '"><span class="cell-day">' + i + '</span>' + (comp ? '<span class="cell-dot"></span>' : '') + '</div>';
    }
    grid.innerHTML = html;
    grid.querySelectorAll('.calendar-cell:not(.other-month)').forEach(function(cell) {
      cell.onclick = function() {
        grid.querySelectorAll('.calendar-cell').forEach(function(c) { c.classList.remove('selected'); });
        cell.classList.add('selected');
        var dateStr = cell.dataset.date;
        var checkin = self.checkins[dateStr];
        if (checkin) {
          var plan = self.planData.find(function(p) { return p.id === checkin.planId; });
          var dayInfo = plan ? plan.days.find(function(d) { return d.day === checkin.day; }) : null;
          var dt = new Date(checkin.completedAt);
          var timeStr = dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0') + ' ' + String(dt.getHours()).padStart(2,'0') + ':' + String(dt.getMinutes()).padStart(2,'0');
          detail.innerHTML = '<div class="calendar-detail-title">' + dateStr + ' 训练记录</div>' +
            (dayInfo ? '<div style="font-size:14px;font-weight:600;margin-bottom:4px">' + self.escapeHtml(dayInfo.title) + '</div>' +
              '<div style="font-size:13px;color:var(--text-2)">' + self.escapeHtml(dayInfo.duration || '') + '</div>' : '<div class="calendar-detail-empty">已完成训练</div>') +
            '<div style="font-size:12px;color:var(--text-3);margin-top:8px">打卡时间：' + timeStr + '</div>';
        } else {
          detail.innerHTML = '<div class="calendar-detail-title">' + dateStr + '</div><div class="calendar-detail-empty">当天未打卡</div>';
        }
        detail.classList.add('show');
      };
    });
  },
  calendarPrev() {
    if (!this.calendarMonth) return;
    if (this.calendarMonth.month === 0) { this.calendarMonth.month = 11; this.calendarMonth.year--; }
    else { this.calendarMonth.month--; }
    this.renderCalendar();
  },
  calendarNext() {
    if (!this.calendarMonth) return;
    if (this.calendarMonth.month === 11) { this.calendarMonth.month = 0; this.calendarMonth.year++; }
    else { this.calendarMonth.month++; }
    this.renderCalendar();
  },
});
