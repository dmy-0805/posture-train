/* 云同步配置 — LeanCloud
 * ------------------------------------------------------------------
 * 开启多设备数据同步的步骤：
 * 1. 打开 https://console.leancloud.app （国际版，无需备案域名）
 *    注册账号 → 创建一个应用（开发版免费额度足够个人使用）
 * 2. 进入应用 → 左下角「设置」→「应用凭证」
 *    找到 AppID、AppKey、API 域名 三项
 * 3. 填入下面三个引号内，保存文件，重新打开页面即自动开启同步
 *
 * 三项留空 = 纯本地模式（和原来完全一样，只用 localStorage，不联网）
 * ------------------------------------------------------------------ */
window.CLOUD_CONFIG = {
  appId: '',    // AppID，形如 xxxxxxxx-yyyy-...
  appKey: '',   // AppKey
  apiBase: ''   // API 域名，形如 https://xxxxxxxx.api.lncldglobal.com（末尾不要带斜杠）
};
