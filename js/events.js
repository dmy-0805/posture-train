/* 事件绑定：所有 DOM 事件集中绑定 */
Object.assign(App, {
  // ===== 事件绑定 =====
  bindEvents() {
    // 模块切换
    document.querySelectorAll('.nav-item').forEach(n => {
      n.onclick = () => this.switchModule(n.dataset.module);
    });
    // logo 点击回首页
    document.getElementById('sidebarLogo').onclick = () => this.switchModule('home');
    document.getElementById('sidebarTitle').onclick = () => this.switchModule('home');
    // 锻炼台内部 Tab 切换
    document.querySelectorAll('.tab[data-tab]').forEach(t => {
      t.onclick = () => this.switchTab(t.dataset.tab);
    });
    // 生理期内部 Tab 切换
    document.querySelectorAll('.tab[data-ptab]').forEach(t => {
      t.onclick = () => this.switchPeriodTab(t.dataset.ptab);
    });
    // 生理期：年度日历年份切换
    document.getElementById('pYearPrev').onclick = () => this.periodYearPrev();
    document.getElementById('pYearNext').onclick = () => this.periodYearNext();
    // 生理期：图表类型切换
    document.querySelectorAll('.period-chart-type').forEach(t => {
      t.onclick = () => {
        this.periodChartType = t.dataset.ctype;
        document.querySelectorAll('.period-chart-type').forEach(x => x.classList.toggle('active', x.dataset.ctype === this.periodChartType));
        this.renderPeriodChart();
      };
    });
    // 生理期：记录Tab - 月历切换
    document.getElementById('pMonthPrev').onclick = () => this.periodMonthPrev();
    document.getElementById('pMonthNext').onclick = () => this.periodMonthNext();
    // 生理期：记录Tab - 操作按钮
    document.getElementById('pBtnStart').onclick = () => this.markPeriodStart();
    document.getElementById('pBtnEnd').onclick = () => this.markPeriodEnd();
    document.getElementById('pBtnStatus').onclick = () => this.openPeriodStatus();
    document.getElementById('pPanelMenu').onclick = () => {
      const sorted = this.getSortedPeriods();
      const target = sorted.find(p => this.periodSelectedDate >= p.startDate && this.periodSelectedDate <= p.endDate);
      if (!target) { this.toast('该日期没有经期记录可删除'); return; }
      this.showModal('删除记录', '确定删除 ' + target.startDate + ' → ' + target.endDate + ' 的记录吗？', () => {
        this.periodData = this.periodData.filter(p => p.id !== target.id);
        this.savePeriods();
        this.renderPeriodAll();
        this.toast('记录已删除');
      });
    };

    // 导出导入
    document.getElementById('exportBtn').onclick = () => this.exportData();
    document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
    document.getElementById('importFile').onchange = (e) => {
      if (e.target.files[0]) this.importData(e.target.files[0]);
      e.target.value = '';
    };

    // 想买的书
    document.getElementById('addBookBtn').onclick = () => this.openBookModal();
    document.getElementById('bookCancelBtn').onclick = () => this.closeBookModal();
    document.getElementById('bookSaveBtn').onclick = () => this.saveBook();
    document.getElementById('bookModalOverlay').onclick = (e) => {
      if (e.target.id === 'bookModalOverlay') this.closeBookModal();
    };
    document.querySelectorAll('.books-tab').forEach(t => {
      t.onclick = () => this.switchBookTab(t.dataset.btab);
    });

    // 灵感记录
    document.getElementById('addInspBtn').onclick = () => this.openInspModal();
    document.getElementById('inspCancelBtn').onclick = () => this.closeInspModal();
    document.getElementById('inspSaveBtn').onclick = () => this.saveInspiration();
    document.getElementById('inspModalOverlay').onclick = (e) => {
      if (e.target.id === 'inspModalOverlay') this.closeInspModal();
    };
    document.getElementById('inspContentInput').oninput = () => this._renderInspPreview();
    document.getElementById('inspImgInput').onchange = (e) => {
      this._handleInspImgInput(e.target.files);
      e.target.value = '';
    };
    document.getElementById('inspTagAddBtn').onclick = () => this._addPendingInspTag();
    document.getElementById('inspTagInput').onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this._addPendingInspTag(); }
    };
    document.getElementById('inspTagInput').oninput = () => this._updateInspSaveBtn();

    // 提交
    document.getElementById('bodySubmit').onclick = () => this.addBodyData();

    // 体脂率模式切换
    document.querySelectorAll('.bf-mode-tab').forEach(t => {
      t.onclick = () => this.switchBfMode(t.dataset.mode);
    });
    // 性别切换
    document.getElementById('bodyGender').onchange = () => this.updateHipVisibility();
    // 围度实时计算
    ['bodyHeight','bodyNeck','bodyWaist','bodyHip'].forEach(id => {
      document.getElementById(id).oninput = () => this.updateBfCalc();
    });

    // 清空
    document.getElementById('clearSampleBtn').onclick = () => this.clearSample();
    document.getElementById('clearAllBtn').onclick = () => this.clearAll();

    // 模态框
    document.getElementById('modalCancel').onclick = () => this.hideModal();
    document.getElementById('modalConfirm').onclick = () => {
      if (this._modalConfirm) this._modalConfirm();
      this.hideModal();
    };
    document.getElementById('modalOverlay').onclick = (e) => {
      if (e.target.id === 'modalOverlay') this.hideModal();
    };
    // 录入新计划
    document.getElementById('planInputBtn').onclick = () => this.showPlanInputModal();
    document.getElementById('planInputCancel').onclick = () => this.hidePlanInputModal();
    document.getElementById('planInputSave').onclick = () => this.saveNewPlan();
    document.getElementById('planInputOverlay').onclick = (e) => {
      if (e.target.id === 'planInputOverlay') this.hidePlanInputModal();
    };
    document.getElementById('planFormatToggle').onclick = () => {
      document.getElementById('planFormatHint').classList.toggle('open');
    };
    // 历史计划折叠
    document.getElementById('historyToggle').onclick = () => {
      document.getElementById('historyToggle').classList.toggle('open');
      document.getElementById('historyBody').classList.toggle('open');
    };
    // 训练日历
    document.getElementById('calPrev').onclick = () => this.calendarPrev();
    document.getElementById('calNext').onclick = () => this.calendarNext();
  }
});
