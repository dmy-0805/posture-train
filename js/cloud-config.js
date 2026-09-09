/* 云同步配置 — Supabase
 * ------------------------------------------------------------------
 * 开启多设备数据同步的步骤：
 * 1. 打开 https://supabase.com 用 GitHub 账号登录
 * 2. 创建项目（Free 计划，Region 选 Singapore）
 * 3. 建表：在 Dashboard 的 SQL Editor 中执行 README.md 里的建表 SQL
 * 4. Project Settings → API：复制 Project URL 和 publishable key 填到下面
 *
 * 三项留空 = 纯本地模式（和原来完全一样，只用 localStorage，不联网）
 * ------------------------------------------------------------------ */
window.CLOUD_CONFIG = {
  url: 'https://fsxepryhwbxsrjzzqzub.supabase.co',   // Project URL
  key: 'sb_publishable_7GWd0sUkHYFUo37_nIr70g_NBWZ9EEe',  // publishable (anon) key
  secret: 'wbpt-6d66a5d58c7a09f17711b3bc',           // 数据保护密钥，须与建表 SQL 中一致
  table: 'fitness_data'                              // 数据表名，须与建表 SQL 中一致
};
