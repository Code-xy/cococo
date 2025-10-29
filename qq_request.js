// ============ QQ请求处理脚本 ============
// 类型：script-request-body
// 功能：提取openid并保存

const log = (msg) => console.log(`[QQ-Request] ${msg}`);

log("=".repeat(50));
log("📥 拦截到请求");

const requestBody = $request.body || '';

if (requestBody) {
    // 保存完整的请求body
    $prefs.setValueForKey(requestBody, "qq_request_body");
    log(`💾 保存请求Body（长度: ${requestBody.length} 字节）`);
    
    // 提取openid（用于日志）
    const openid_match = requestBody.match(/openid=([^&]+)/);
    if (openid_match) {
        const openid = openid_match[1];
        // 单独保存openid，方便后端使用
        $prefs.setValueForKey(openid, "qq_current_openid");
        log(`🆔 提取到OpenID: ${openid}`);
    } else {
        log(`⚠️ 未找到OpenID`);
    }
} else {
    log(`⚠️ 请求Body为空`);
}

log("=".repeat(50));
$done({});  // 继续原请求
