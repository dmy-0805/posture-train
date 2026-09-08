/* 身体数据操作：录入、删除 */
Object.assign(App, {
  // ===== 操作 =====
  addBodyData() {
    var date = document.getElementById('bodyDate').value;
    var weight = parseFloat(document.getElementById('bodyWeight').value);
    var gender = document.getElementById('bodyGender').value;
    var height = parseFloat(document.getElementById('bodyHeight').value);

    if (!date) { this.toast('请选择日期'); return; }
    if (!weight || weight <= 0) { this.toast('请输入体重'); return; }
    if (!height || height <= 0) { this.toast('请输入身高'); return; }

    this.saveProfile();

    var bodyFat, entry = { gender: gender, height: height };

    if (this.bfMode === 'calc') {
      var neck = parseFloat(document.getElementById('bodyNeck').value);
      var waist = parseFloat(document.getElementById('bodyWaist').value);
      var hip = parseFloat(document.getElementById('bodyHip').value);
      if (!neck || !waist) { this.toast('请填写颈围和腰围'); return; }
      if (gender === 'female' && !hip) { this.toast('女性需填写臀围'); return; }
      bodyFat = this.calcBodyFat(gender, height, neck, waist, hip);
      if (bodyFat === null || bodyFat <= 2 || bodyFat >= 60) { this.toast('围度数据不合理，请检查'); return; }
      entry.neck = neck;
      entry.waist = waist;
      if (hip) entry.hip = hip;
      entry.bodyFatSource = 'calc';
    } else {
      bodyFat = parseFloat(document.getElementById('bodyFat').value);
      if (!bodyFat || bodyFat <= 0) { this.toast('请输入体脂率'); return; }
      entry.bodyFatSource = 'manual';
    }

    this.isSample = false;
    this.bodyData.push(Object.assign({
      id: this.uid(), date: date, weight: weight, bodyFat: bodyFat,
      createdAt: Date.now()
    }, entry));
    this.saveAll();
    document.getElementById('bodyWeight').value = '';
    document.getElementById('bodyFat').value = '';
    document.getElementById('bodyNeck').value = '';
    document.getElementById('bodyWaist').value = '';
    document.getElementById('bodyHip').value = '';
    this.renderBodyData();
    this.checkReminder();
    this.toast('身体数据已保存');
  },

  deleteBodyData(id) {
    this.bodyData = this.bodyData.filter(d => d.id !== id);
    this.saveAll();
    this.renderBodyData();
    this.checkReminder();
    this.toast('数据已删除');
  },
});
