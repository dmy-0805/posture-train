/* 灵感记录：发布、标签、筛选、图片上传 */
Object.assign(App, {
  // ===== 灵感记录 =====
  saveInspirations() {
    try {
      localStorage.setItem(this.KEYS.inspirations, JSON.stringify(this.inspirationData));
    } catch (e) {
      this.toast('存储空间不足，请删除旧灵感或大图');
    }
  },

  formatInspTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' 天前';
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    if (d.getFullYear() === now.getFullYear()) return m + '-' + day;
    return d.getFullYear() + '-' + m + '-' + day;
  },

  renderInspiration() {
    const list = document.getElementById('inspirationList');
    const countEl = document.getElementById('inspirationCount');
    const filterEl = document.getElementById('inspTagFilter');
    if (!list) return;

    // 收集所有标签及计数
    const tagMap = {};
    this.inspirationData.forEach(item => {
      if (item.tags && item.tags.length) {
        item.tags.forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; });
      }
    });
    const allTags = Object.keys(tagMap).sort((a, b) => tagMap[b] - tagMap[a]);

    // 渲染筛选栏
    if (filterEl) {
      if (allTags.length === 0) {
        filterEl.innerHTML = '';
      } else {
        let filterHtml = '<button class="insp-filter-chip' + (!this._inspFilterTag ? ' active' : '') + '" onclick="App.filterInspByTag(null)">全部<span class="insp-filter-count">' + this.inspirationData.length + '</span></button>';
        allTags.forEach(t => {
          filterHtml += '<button class="insp-filter-chip' + (this._inspFilterTag === t ? ' active' : '') + '" onclick="App.filterInspByTag(\'' + this.escapeHtml(t).replace(/'/g, "\\'") + '\')">' + this.escapeHtml(t) + '<span class="insp-filter-count">' + tagMap[t] + '</span></button>';
        });
        filterEl.innerHTML = filterHtml;
      }
    }

    if (countEl) countEl.textContent = this.inspirationData.length + ' 条灵感';

    if (this.inspirationData.length === 0) {
      list.innerHTML =
        '<div class="insp-empty">' +
          '<div class="insp-empty-icon">✍️</div>' +
          '<div class="insp-empty-text">还没有灵感<br>点击右上角「发布」记录一下吧</div>' +
        '</div>';
      return;
    }

    let filtered = this.inspirationData.slice();
    if (this._inspFilterTag) {
      filtered = filtered.filter(item => item.tags && item.tags.includes(this._inspFilterTag));
    }
    const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);

    if (sorted.length === 0) {
      list.innerHTML = '<div class="insp-empty"><div class="insp-empty-text">没有标签为「' + this.escapeHtml(this._inspFilterTag) + '」的灵感</div></div>';
      return;
    }

    list.innerHTML = sorted.map(item => {
      const content = item.content ? '<div class="insp-content">' + this.escapeHtml(item.content) + '</div>' : '';
      let imgsHtml = '';
      if (item.images && item.images.length) {
        const n = item.images.length;
        const imgs = item.images.map(src => '<img class="insp-img" src="' + src + '" onclick="App.viewInspImg(this.src)" alt="">').join('');
        imgsHtml = '<div class="insp-imgs c' + n + '">' + imgs + '</div>';
      }
      let tagsHtml = '';
      if (item.tags && item.tags.length) {
        tagsHtml = '<div class="insp-card-tags">' + item.tags.map(t => '<span class="insp-card-tag" onclick="App.filterInspByTag(\'' + this.escapeHtml(t).replace(/'/g, "\\'") + '\')">' + this.escapeHtml(t) + '</span>').join('') + '</div>';
      }
      return '<div class="insp-card">' +
        tagsHtml +
        content +
        imgsHtml +
        '<div class="insp-footer">' +
          '<span class="insp-time">' + this.formatInspTime(item.createdAt) + '</span>' +
          '<button class="insp-del" onclick="App.deleteInspiration(\'' + item.id + '\')">删除</button>' +
        '</div>' +
      '</div>';
    }).join('');
  },

  filterInspByTag(tag) {
    this._inspFilterTag = (this._inspFilterTag === tag) ? null : (tag || null);
    this.renderInspiration();
  },

  _renderInspTags() {
    const preview = document.getElementById('inspTagPreview');
    if (!preview) return;
    if (!this._inspPendingTags || this._inspPendingTags.length === 0) {
      preview.innerHTML = '';
      return;
    }
    preview.innerHTML = this._inspPendingTags.map((t, idx) =>
      '<span class="insp-tag-chip">' + this.escapeHtml(t) + '<span class="insp-tag-remove" onclick="App._removePendingInspTag(' + idx + ')">×</span></span>'
    ).join('');
  },

  _addPendingInspTag() {
    const input = document.getElementById('inspTagInput');
    const val = input.value.trim();
    if (!val) return;
    if (!this._inspPendingTags) this._inspPendingTags = [];
    if (this._inspPendingTags.includes(val)) { this.toast('标签已存在'); return; }
    if (this._inspPendingTags.length >= 5) { this.toast('最多 5 个标签'); return; }
    this._inspPendingTags.push(val);
    input.value = '';
    this._renderInspTags();
    this._updateInspSaveBtn();
  },

  _removePendingInspTag(idx) {
    this._inspPendingTags.splice(idx, 1);
    this._renderInspTags();
    this._updateInspSaveBtn();
  },

  _updateInspSaveBtn() {
    const saveBtn = document.getElementById('inspSaveBtn');
    const content = document.getElementById('inspContentInput').value.trim();
    const tagInputVal = (document.getElementById('inspTagInput')?.value || '').trim();
    const hasContent = content.length > 0
      || this._inspPendingImgs.length > 0
      || (this._inspPendingTags && this._inspPendingTags.length > 0)
      || tagInputVal.length > 0;
    saveBtn.disabled = !hasContent;
    saveBtn.style.opacity = hasContent ? '1' : '.5';
  },

  viewInspImg(src) {
    const w = window.open('');
    if (w) { w.document.write('<img src="' + src + '" style="max-width:100%;display:block;margin:auto">'); }
  },

  openInspModal() {
    document.getElementById('inspContentInput').value = '';
    document.getElementById('inspTagInput').value = '';
    this._inspPendingImgs = [];
    this._inspPendingTags = [];
    this._renderInspPreview();
    this._renderInspTags();
    document.getElementById('inspModalOverlay').style.display = 'flex';
    document.getElementById('inspModalOverlay').style.alignItems = 'flex-end';
    setTimeout(() => document.getElementById('inspContentInput').focus(), 50);
  },

  closeInspModal() {
    document.getElementById('inspModalOverlay').style.display = 'none';
  },

  _renderInspPreview() {
    const preview = document.getElementById('inspPreview');
    this._updateInspSaveBtn();
    if (!preview) return;

    let html = this._inspPendingImgs.map((src, idx) =>
      '<div class="insp-preview-item">' +
        '<img src="' + src + '" alt="">' +
        '<button class="insp-preview-remove" onclick="App._removePendingInspImg(' + idx + ')">×</button>' +
      '</div>'
    ).join('');

    if (this._inspPendingImgs.length < 3) {
      html += '<button class="insp-preview-add" onclick="document.getElementById(\'inspImgInput\').click()">+</button>';
    }
    preview.innerHTML = html;
  },

  _removePendingInspImg(idx) {
    this._inspPendingImgs.splice(idx, 1);
    this._renderInspPreview();
  },

  async _handleInspImgInput(files) {
    if (!files || !files.length) return;
    const remaining = 3 - this._inspPendingImgs.length;
    if (remaining <= 0) { this.toast('最多 3 张图'); return; }
    const list = Array.from(files).slice(0, remaining);
    this.toast('图片压缩中...');
    for (let i = 0; i < list.length; i++) {
      try {
        const compressed = await this._compressImage(list[i]);
        this._inspPendingImgs.push(compressed);
      } catch (e) {}
    }
    this._renderInspPreview();
  },

  _compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) { reject(); return; }
      const reader = new FileReader();
      reader.onerror = () => reject();
      reader.onload = e => {
        const img = new Image();
        img.onerror = () => reject();
        img.onload = () => {
          const maxW = 800;
          let w = img.width, h = img.height;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          try {
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl);
          } catch (err) {
            // 回退为原图
            resolve(e.target.result);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  saveInspiration() {
    // 自动收集输入框里还没点添加的标签
    const tagInput = document.getElementById('inspTagInput');
    if (tagInput) {
      const pending = tagInput.value.trim();
      if (pending) {
        if (!this._inspPendingTags) this._inspPendingTags = [];
        if (!this._inspPendingTags.includes(pending) && this._inspPendingTags.length < 5) {
          this._inspPendingTags.push(pending);
        }
      }
    }
    const content = document.getElementById('inspContentInput').value.trim();
    const imgs = this._inspPendingImgs.slice();
    const tags = (this._inspPendingTags || []).slice();
    if (!content && imgs.length === 0 && tags.length === 0) { this.toast('写点什么或加张图吧'); return; }

    this.inspirationData.push({
      id: this.uid(),
      content: content,
      images: imgs,
      tags: tags,
      createdAt: Date.now()
    });
    this.saveInspirations();
    this.closeInspModal();
    this.renderInspiration();
    this.renderDashboard();
    this.toast('发布成功');
  },

  deleteInspiration(id) {
    this.showModal('删除灵感', '确定删除这条灵感吗？', () => {
      this.inspirationData = this.inspirationData.filter(i => i.id !== id);
      this.saveInspirations();
      this.renderInspiration();
      this.renderDashboard();
      this.toast('已删除');
    });
  },

  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  },
});
