/* 通用工具：日期、uid、escapeHtml、体脂率公式等 */
Object.assign(App, {
  // ===== 工具 =====
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); },
  getToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },
  offsetDate(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },
  formatDate(s) {
    const parts = s.split('-');
    return parts[1] + '月' + parts[2] + '日';
  },
  escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  },

  setDefaultDates() {
    const today = this.getToday();
    const bd = document.getElementById('bodyDate'); if (bd) bd.value = today;
    const ps = document.getElementById('periodStart'); if (ps) ps.value = today;
    const pe = document.getElementById('periodEnd'); if (pe) pe.value = today;
  },

  loadProfile() {
    const meta = JSON.parse(localStorage.getItem(this.KEYS.meta) || '{}');
    const gender = meta.gender || 'female';
    const height = meta.height || '';
    const bg = document.getElementById('bodyGender'); if (bg) bg.value = gender;
    const bh = document.getElementById('bodyHeight'); if (bh) bh.value = height;
    this.updateHipVisibility();
  },

  saveProfile() {
    const meta = JSON.parse(localStorage.getItem(this.KEYS.meta) || '{}');
    meta.gender = document.getElementById('bodyGender').value;
    meta.height = document.getElementById('bodyHeight').value;
    localStorage.setItem(this.KEYS.meta, JSON.stringify(meta));
  },

  calcBodyFat(gender, height, neck, waist, hip) {
    if (!height || !neck || !waist) return null;
    if (height <= 0 || neck <= 0 || waist <= 0) return null;
    if (gender === 'male') {
      if (waist <= neck) return null;
      var bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
      return bf;
    } else {
      if (!hip || hip <= 0) return null;
      if ((waist + hip) <= neck) return null;
      var bf2 = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
      return bf2;
    }
  },

  switchBfMode(mode) {
    this.bfMode = mode;
    document.querySelectorAll('.bf-mode-tab').forEach(function(t) {
      t.classList.toggle('active', t.dataset.mode === mode);
    });
    document.getElementById('bfManualMode').classList.toggle('active', mode === 'manual');
    document.getElementById('bfCalcMode').classList.toggle('active', mode === 'calc');
    if (mode === 'calc') this.updateBfCalc();
  },

  updateHipVisibility() {
    var gender = document.getElementById('bodyGender').value;
    var hipGroup = document.getElementById('hipGroup');
    if (hipGroup) hipGroup.style.display = gender === 'female' ? '' : 'none';
    this.updateBfCalc();
  },

  updateBfCalc() {
    var result = document.getElementById('bfCalcResult');
    if (!result) return;
    var gender = document.getElementById('bodyGender').value;
    var height = parseFloat(document.getElementById('bodyHeight').value);
    var neck = parseFloat(document.getElementById('bodyNeck').value);
    var waist = parseFloat(document.getElementById('bodyWaist').value);
    var hip = parseFloat(document.getElementById('bodyHip').value);
    var bf = this.calcBodyFat(gender, height, neck, waist, hip);
    if (bf !== null && bf > 2 && bf < 60) {
      result.classList.add('has-value');
      result.innerHTML = '<span class="bf-value">' + bf.toFixed(1) + '%</span><span class="bf-label">预计体脂率（美国海军体脂公式）</span>';
    } else {
      result.classList.remove('has-value');
      result.textContent = gender === 'female'
        ? '填写身高、颈围、腰围、臀围后自动计算'
        : '填写身高、颈围、腰围后自动计算';
    }
  },
});
