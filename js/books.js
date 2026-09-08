/* 想买的书：增删、标记已买、渲染 */
Object.assign(App, {
  // ===== 想买的书 =====
  saveBooks() {
    localStorage.setItem(this.KEYS.books, JSON.stringify(this.bookData));
  },

  switchBookTab(tab) {
    this.bookTab = tab;
    document.querySelectorAll('.books-tab').forEach(t => t.classList.toggle('active', t.dataset.btab === tab));
    this.renderBooksList();
  },

  renderBooks() {
    this.renderBooksList();
  },

  renderBooksList() {
    const list = document.getElementById('booksList');
    if (!list) return;
    const wishlist = this.bookData.filter(b => b.status === 'wishlist');
    const purchased = this.bookData.filter(b => b.status === 'purchased');
    document.getElementById('booksWishlistCount').textContent = wishlist.length;
    document.getElementById('booksPurchasedCount').textContent = purchased.length;

    const show = this.bookTab === 'wishlist' ? wishlist : purchased;
    if (show.length === 0) {
      list.innerHTML = '<div class="book-empty">' + (this.bookTab === 'wishlist' ? '还没有想买的书，点击右上角添加吧' : '还没有已买的书') + '</div>';
      return;
    }
    // 按创建时间降序
    show.sort((a, b) => b.createdAt - a.createdAt);
    list.innerHTML = show.map(b => {
      let actions = '';
      if (b.status === 'wishlist') {
        actions += '<button class="book-action-btn primary" onclick="App.markBookPurchased(\'' + b.id + '\')">已买</button>';
      }
      actions += '<button class="book-action-btn danger" onclick="App.deleteBook(\'' + b.id + '\')">删除</button>';
      return '<div class="book-card">' +
        '<div class="book-info">' +
          '<div class="book-title">' + this.escapeHtml(b.title) + '</div>' +
          (b.author ? '<div class="book-author">' + this.escapeHtml(b.author) + '</div>' : '') +
          (b.note ? '<div class="book-note">' + this.escapeHtml(b.note) + '</div>' : '') +
        '</div>' +
        '<div class="book-actions">' + actions + '</div>' +
      '</div>';
    }).join('');
  },

  openBookModal() {
    document.getElementById('bookTitleInput').value = '';
    document.getElementById('bookAuthorInput').value = '';
    document.getElementById('bookNoteInput').value = '';
    document.getElementById('bookModalOverlay').style.display = 'flex';
    setTimeout(() => document.getElementById('bookTitleInput').focus(), 50);
  },

  closeBookModal() {
    document.getElementById('bookModalOverlay').style.display = 'none';
  },

  saveBook() {
    const title = document.getElementById('bookTitleInput').value.trim();
    if (!title) { this.toast('请输入书名'); return; }
    const author = document.getElementById('bookAuthorInput').value.trim();
    const note = document.getElementById('bookNoteInput').value.trim();
    this.bookData.push({
      id: this.uid(),
      title: title,
      author: author,
      note: note,
      status: 'wishlist',
      createdAt: Date.now()
    });
    this.saveBooks();
    this.closeBookModal();
    this.renderBooksList();
    this.toast('已添加到想买列表');
  },

  markBookPurchased(id) {
    const book = this.bookData.find(b => b.id === id);
    if (book) {
      book.status = 'purchased';
      this.saveBooks();
      this.renderBooksList();
      this.toast('已移到已买列表');
    }
  },

  deleteBook(id) {
    this.showModal('删除书目', '确定删除这本书吗？', () => {
      this.bookData = this.bookData.filter(b => b.id !== id);
      this.saveBooks();
      this.renderBooksList();
      this.toast('已删除');
    });
  },
});
