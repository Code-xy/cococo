// 文件名：qq_request.js
// 类型：script-request-body

const requestBody = $request.body || '';
const openid_match = requestBody.match(/openid=([^&]+)/);

if (openid_match) {
    const openid = openid_match[1];
    // 存储到持久化存储
    $persistentStore.write(openid, "qq_current_openid");
    console.log(`[QQ-Request] 存储OpenID: ${openid}`);
}

$done({});  // 继续原请求
