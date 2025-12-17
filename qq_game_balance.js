

const SERVER_URL = 'http://155.94.157.70:8005';

// ============ 主逻辑 ============
const log = (msg) => console.log(`[QQ外部余额] ${msg}`);

log("=".repeat(60));
log("💳 拦截到QQ外部余额查询响应，准备替换");
log("=".repeat(60));

// 尝试从之前保存的请求body中获取openid（qq_request.js会保存）
let openid = null;
try {
    const savedRequestBody = $prefs.valueForKey("qq_request_body");
    if (savedRequestBody) {
        const openid_match = savedRequestBody.match(/openid=([^&]+)/);
        if (openid_match) {
            openid = openid_match[1];
            log(`🆔 从保存的请求body提取到OpenID: ${openid}`);
        }
    }
    
    // 如果没找到，尝试从当前保存的openid获取
    if (!openid) {
        openid = $prefs.valueForKey("qq_current_openid");
        if (openid) {
            log(`🆔 从保存的OpenID获取: ${openid}`);
        }
    }
} catch (e) {
    log(`⚠️ 读取保存的OpenID失败: ${e.message}`);
}

if (!openid) {
    log(`⚠️ 未找到OpenID，后端将使用默认匹配策略`);
