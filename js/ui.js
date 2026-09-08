/* UI 组件：toast、modal */
Object.assign(App, {
  // ===== UI =====
  showModal(title, msg, onConfirm) {
    document.getElementById('modalTitle').textContent = title;
    const msgEl = document.getElementById('modalMsg');
    const htmlEl = document.getElementById('modalMsgHtml');
    // 如果msg含HTML标签，用innerHTML渲染到htmlEl；否则用textContent到msgEl
    if (msg && msg.indexOf('<') > -1) {
      msgEl.style.display = 'none';
      htmlEl.innerHTML = msg;
    } else {
      msgEl.style.display = '';
      msgEl.textContent = msg;
      htmlEl.innerHTML = '';
    }
    document.getElementById('modalOverlay').classList.remove('hidden');
    this._modalConfirm = onConfirm;
  },

  hideModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('modalMsgHtml').innerHTML = '';
    this._modalConfirm = null;
  },

  toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
  },
});
