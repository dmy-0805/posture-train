/* 云同步：LeanCloud REST 客户端 + 双写适配器
 * - 云端为主，localStorage 为离线缓存兜底
 * - 断网照常记录，联网后自动同步（同一数据集最后写入者优先）
 * - 未配置凭证或请求失败时自动降级为纯本地模式，功能不受影响
 * - 通过包装 App 的 save* 方法挂钩，业务代码零改动 */
(function () {
  var CFG = window.CLOUD_CONFIG || {};
  var API = (CFG.appId && CFG.appKey && CFG.apiBase) ? {
    base: String(CFG.apiBase).replace(/\/+$/, ''),
    headers: function () {
      return {
        'X-LC-Id': CFG.appId,
        'X-LC-Key': CFG.appKey,
        'Content-Type': 'application/json'
      };
    }
  } : null;

  var CLASS = 'WorkspaceData';        // LeanCloud 数据表名
  var TS_KEY = 'wb_fitness_syncts';   // 本地各数据集最后修改时间
  var OBJ_KEY = 'wb_fitness_cloudobjs'; // 云端 objectId 映射，避免每次查询

  // save 方法 → 数据集 key 映射（与 App.KEYS 对应）
  var HOOKS = [
    ['savePeriods',      ['periods']],
    ['saveBooks',        ['books']],
    ['saveInspirations', ['inspirations']],
    ['saveAll',          ['records', 'body', 'meta']],
    ['savePlans',        ['plans']],
    ['saveCheckins',     ['checkins']],
    ['saveTypes',        ['types']],
    ['saveProfile',      ['meta']]
  ];

  var Sync = {
    enabled: !!API,
    status: 'local',      // local | sync | ok | offline
    timers: {},
    pending: {},          // 待重试的数据集
    _pulling: false,      // 拉取云端期间暂停推送，防止旧数据覆盖新数据

    /* ---------- 状态指示 ---------- */
    setStatus: function (s, text) {
      this.status = s;
      var el = document.getElementById('syncStatus');
      if (!el) return;
      if (!API) { el.classList.add('hidden'); return; }
      el.classList.remove('hidden');
      el.className = 'sync-status ' + s;
      var t = document.getElementById('syncText');
      if (t) t.textContent = text || ({ sync: '同步中', ok: '已同步', offline: '离线模式' }[s] || '');
    },

    /* ---------- 本地辅助 ---------- */
    tsMap: function () { return JSON.parse(localStorage.getItem(TS_KEY) || '{}'); },
    saveTs: function (m) { localStorage.setItem(TS_KEY, JSON.stringify(m)); },
    objMap: function () { return JSON.parse(localStorage.getItem(OBJ_KEY) || '{}'); },
    saveObj: function (m) { localStorage.setItem(OBJ_KEY, JSON.stringify(m)); },

    /* ---------- 挂钩：包装 App 的 save 方法 ---------- */
    hook: function () {
      var self = this;
      HOOKS.forEach(function (h) {
        var name = h[0], keys = h[1];
        var orig = App[name];
        if (typeof orig !== 'function') return;
        App[name] = function () {
          var r = orig.apply(this, arguments);
          var m = self.tsMap();
          var now = Date.now();
          keys.forEach(function (k) { m[k] = now; });
          self.saveTs(m);
          keys.forEach(function (k) { self.queue(k); });
          return r;
        };
      });
    },

    /* ---------- 推送（防抖 1.5s） ---------- */
    queue: function (key) {
      if (!API) return;
      var self = this;
      if (this._pulling) { this.pending[key] = 1; return; } // 拉取期间先记账
      if (this.timers[key]) clearTimeout(this.timers[key]);
      this.timers[key] = setTimeout(function () { self.push(key); }, 1500);
    },

    pushAll: function () {
      var self = this;
      Object.keys(App.KEYS).forEach(function (k) { self.queue(k); });
    },

    push: function (key) {
      if (!API) return;
      var self = this;
      var lsKey = App.KEYS[key];
      var value = localStorage.getItem(lsKey);
      if (value == null) return;
      var ts = (this.tsMap()[key] || Date.now());
      this.setStatus('sync');
      var objId = this.objMap()[key];
      var payload = JSON.stringify({ key: key, value: value, savedAt: ts });
      var req;
      if (objId) {
        req = fetch(API.base + '/1.1/classes/' + CLASS + '/' + objId, {
          method: 'PUT', headers: API.headers(), body: payload
        }).then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
        });
      } else {
        req = fetch(API.base + '/1.1/classes/' + CLASS, {
          method: 'POST', headers: API.headers(), body: payload
        }).then(function (res) {
          return res.json().then(function (d) {
            if (!d || !d.objectId) throw new Error('create failed');
            var m = self.objMap();
            m[key] = d.objectId;
            self.saveObj(m);
          });
        });
      }
      req.then(function () {
        delete self.pending[key];
        self.setStatus('ok');
      }).catch(function () {
        self.pending[key] = 1;
        self.setStatus('offline');
      });
    },

    flush: function () {
      var self = this;
      Object.keys(this.pending).forEach(function (k) { self.push(k); });
    },

    /* ---------- 拉取与合并（启动时执行一次） ---------- */
    start: function () {
      if (!API) { this.setStatus('local'); return; }
      var self = this;
      this._pulling = true;
      this.setStatus('sync');
      var keys = Object.keys(App.KEYS);
      var where = encodeURIComponent(JSON.stringify({ key: { $in: keys } }));
      fetch(API.base + '/1.1/classes/' + CLASS + '?where=' + where + '&limit=100&order=-updatedAt', {
        headers: API.headers()
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.results) throw new Error('bad response');
          // 每个 key 只取最新一条（已按 updatedAt 降序）
          var latest = {};
          data.results.forEach(function (doc) {
            if (doc.key && !latest[doc.key]) latest[doc.key] = doc;
          });
          var objM = self.objMap();
          Object.keys(latest).forEach(function (k) { objM[k] = latest[k].objectId; });
          self.saveObj(objM);

          var ts = self.tsMap();
          var changed = false;
          keys.forEach(function (k) {
            var doc = latest[k];
            var local = localStorage.getItem(App.KEYS[k]);
            if (doc && (doc.savedAt || 0) > (ts[k] || 0) && doc.value !== local) {
              // 云端较新 → 采纳云端
              localStorage.setItem(App.KEYS[k], doc.value);
              ts[k] = doc.savedAt || Date.now();
              changed = true;
            } else if (local != null && (!doc || doc.value !== local)) {
              // 本地较新或云端缺失 → 待上传
              self.pending[k] = 1;
            }
          });
          self.saveTs(ts);
          if (changed) {
            // 云端数据已合并进本地，重新加载渲染
            App.loadData();
            App.setDefaultDates();
            App.loadProfile();
            App.renderAll();
            App.switchModule(App.currentModule);
          }
          if (!Object.keys(latest).length) {
            self.pushAll(); // 云端为空（首次启用）→ 全量上传
          }
          self.setStatus('ok');
        })
        .catch(function () {
          self.setStatus('offline');
        })
        .then(function () {
          // 无论成败，拉取结束后再推送积压的本地变更
          self._pulling = false;
          self.flush();
        });
    },

    /* ---------- 网络状态监听 ---------- */
    bind: function () {
      var self = this;
      window.addEventListener('online', function () { self.flush(); });
      window.addEventListener('offline', function () { if (API) self.setStatus('offline'); });
    }
  };

  window.Sync = Sync;
})();
