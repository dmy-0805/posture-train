/* 数据管理：导出 JSON、导入恢复 */
Object.assign(App, {
  // ===== 数据管理 =====
  exportData() {
    const meta = JSON.parse(localStorage.getItem(this.KEYS.meta) || '{}');
    const data = {
      bodyData: this.bodyData,
      types: this.types,
      meta: meta,
      planData: this.planData,
      checkins: this.checkins,
      periodData: this.periodData,
      bookData: this.bookData,
      inspirationData: this.inspirationData,
      exportDate: new Date().toISOString(),
      version: 8
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '体态训练台备份_' + this.getToday() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    this.toast('已导出备份文件');
  },

  importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.bodyData) {
          this.toast('文件格式不正确');
          return;
        }
        this.showModal('导入数据', '将覆盖当前所有数据，确定继续吗？', () => {
          if (data.bodyData) this.bodyData = data.bodyData;
          if (data.types) this.types = data.types;
          if (data.meta) localStorage.setItem(this.KEYS.meta, JSON.stringify(data.meta));
          if (data.planData) this.planData = data.planData;
          if (data.checkins) this.checkins = data.checkins;
          if (data.periodData) this.periodData = data.periodData;
          if (data.bookData) this.bookData = data.bookData;
          if (data.inspirationData) this.inspirationData = data.inspirationData;
          this.isSample = false;
          this.saveAll();
          this.saveTypes();
          this.savePlans();
          this.saveCheckins();
          this.savePeriods();
          this.saveBooks();
          this.saveInspirations();
          this.loadProfile();
          this.renderAll();
          this.checkReminder();
          this.toast('数据导入成功');
        });
      } catch(err) {
        this.toast('文件解析失败：' + err.message);
      }
    };
    reader.readAsText(file);
  },

  clearSample() {
    if (!this.isSample) {
      this.toast('当前不是示例数据');
      return;
    }
    this.showModal('清空示例数据', '将删除所有预置的示例数据，确定吗？', () => {
      this.bodyData = [];
      this.isSample = false;
      this.saveAll();
      this.renderAll();
      this.checkReminder();
      this.toast('示例数据已清空');
    });
  },

  clearAll() {
    this.showModal('清空全部数据', '此操作将删除所有数据（含生理期），且不可恢复！确定继续吗？', () => {
      this.bodyData = [];
      this.records = [];
      this.planData = [];
      this.checkins = {};
      this.periodData = [];
      this.bookData = [];
      this.inspirationData = [];
      this.isSample = false;
      this.saveAll();
      this.savePlans();
      this.saveCheckins();
      this.savePeriods();
      this.saveBooks();
      this.saveInspirations();
      this.initDefaultPlan();
      this.renderAll();
      this.checkReminder();
      this.toast('全部数据已清空');
    });
  },

  checkReminder() {
    const total = this.bodyData.length;
    const el = document.getElementById('backupReminder');
    const text = document.getElementById('reminderText');
    if (total >= 30 && total % 10 === 0) {
      text.textContent = '数据已积累 ' + total + ' 条，建议导出备份以免丢失';
      el.classList.remove('hidden');
    } else if (total >= 30) {
      text.textContent = '数据已积累 ' + total + ' 条，建议定期导出备份';
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  },
});
