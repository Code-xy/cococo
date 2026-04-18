/**
 * taobao_dump.js — script-response-body
 * 匹配 taobao.py：mtop.taobao.detail.data.get 响应，输出到 Surge/Loon 日志。
 * 透传响应，不改包。
 *
 * Quantumult X：若报错可改为顶行添加 const $response = {...}; 或使用 QX 专用模板。
 */

(() => {
  const resp = typeof $response !== "undefined" ? $response : {};
  const raw = resp.body || "";
  const tag = "[mtop.taobao.detail.data.get]";

  try {
    const obj = JSON.parse(raw);
    console.log(`${tag}\n${JSON.stringify(obj, null, 2)}`);
  } catch (e) {
    console.log(`${tag} (非 JSON)\n${raw}`);
  }

  // 透传原始响应（勿传空对象，否则会破坏 body）
  if (typeof $done === "function") {
    $done(resp);
  }
})();
