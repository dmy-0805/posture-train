# 体态训练台

个人体态训练记录工作台，纯前端、轻量模块化，支持手机/电脑数据同步。

**在线地址**：https://dmy-0805.github.io/posture-train/

---

## 项目结构

```
index.html          页面入口
README.md           项目说明
css/
  base.css          基础：变量、侧边栏、顶栏、仪表盘
  workout.css       锻炼台：训练计划、身体数据、训练日历
  period.css        生理期
  extras.css        想买的书 + 灵感记录
  responsive.css    响应式断点适配
js/
  cloud-config.js   云同步配置（LeanCloud AppID/AppKey/API域名）
  cloud.js          LeanCloud REST 客户端 + 双写适配器
  core.js           常量 + App 核心状态、init、模块切换
  utils.js          通用工具方法
  data.js           数据加载 + 示例数据
  render.js         身体数据渲染 + SVG 折线图
  actions.js        身体数据录入/删除
  datamanage.js     数据导出/导入
  plan.js           训练计划
  calendar.js       训练日历
  period.js         生理期：统计、日历、记录管理
  inspiration.js    灵感记录
  books.js          想买的书
  ui.js             toast、modal
  events.js         DOM 事件绑定
  main.js           启动入口
```

---

## 开启多设备数据同步

应用默认使用浏览器 `localStorage`，数据保存在本机。要实现手机、电脑数据同步，需要接入 LeanCloud 云端：

### 1. 注册 LeanCloud

打开 https://console.leancloud.app（国际版，无需备案域名），注册账号并创建一个应用。

### 2. 获取凭证

进入应用 → 左下角「设置」→「应用凭证」，复制以下三项：

- AppID
- AppKey
- API 域名（形如 `https://xxxxxxxx.api.lncldglobal.com`，末尾不要带 `/`）

### 3. 填写配置

编辑 `js/cloud-config.js`，把三项分别填入对应引号内：

```js
window.CLOUD_CONFIG = {
  appId: '你的 AppID',
  appKey: '你的 AppKey',
  apiBase: 'https://xxxxxxxx.api.lncldglobal.com'
};
```

### 4. 重新部署

把修改后的 `cloud-config.js` 推送到 GitHub，等待 GitHub Pages 刷新即可（通常 1~2 分钟，最多 10 分钟）。

---

## 同步机制说明

- **云端为主，本地兜底**：每个数据集（身体数据、生理期、想买的书等）在云上一份，`localStorage` 作为离线缓存。
- **自动合并**：打开页面时自动拉取云端，与本机对比时间戳，保留较新的那份。
- **断网可用**：没有网络时正常记录，联网后自动同步。
- **最后写入优先**：同一数据集以最新保存时间为准，适合个人单用户场景。
- **未配置时**：三个字段都为空则自动降级为纯本地模式，和原来完全一致。

---

## 本地预览

```bash
python -m http.server 8000
# 然后打开 http://localhost:8000
```

注意：因为涉及 localStorage，请尽量用 `localhost` 或真实域名访问，不要直接双击 `index.html` 用 `file://` 协议打开（部分浏览器会限制功能）。

---

## 技术要点

- 单页应用、零外部框架、零外部字体/图标 CDN
- 图表使用内联 SVG 手写
- 所有图标使用内联 SVG path
- 响应式适配 PC / 平板 / 手机
