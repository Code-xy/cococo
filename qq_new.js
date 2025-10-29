// ============ QQ钱包账单拦截脚本 - 重定向版 ============
// 功能：将QQ钱包请求重定向到本地后端，返回修改后的响应
// 类型：script-request-header
// 原理：修改请求URL，重定向到后端，后端从body提取openid并返回对应数据

/*
使用说明：
1. 启动后端: python qq_manual_backend.py
2. 在后端管理界面添加QQ账户（QQ号+OpenID）
3. 编辑并保存响应JSON
4. 修改下面的 SERVER_URL 为你的电脑/服务器IP
5. 在圈X中配置：

[rewrite_local]
^https?:\/\/api\.unipay\.qq\.com\/v1\/r\/1450000186\/trade_record_query url script-request-header https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/qq_new.js

[mitm]
hostname = api.unipay.qq.com

注意：这次用 script-request-header（和联通一样的方式）
*/

// ============ 配置区域 ============
const SERVER_URL = 'http://192.168.240.68:8005';

// ============ 主逻辑 ============
const log = (msg) => console.log(`[QQ重定向] ${msg}`);

log("=".repeat(60));
log("🔔 拦截到QQ钱包请求，准备重定向");
log("=".repeat(60));

try {
    log(`📡 原始URL: ${$request.url}`);
    log(`🔧 请求方法: ${$request.method}`);
    
    // 检查请求body
    const hasBody = $request.body && $request.body.length > 0;
    log(`📦 请求Body存在: ${hasBody ? '✅ 是' : '❌ 否'}`);
    
    if (hasBody) {
        const body = $request.body;
        log(`📦 请求Body长度: ${body.length} 字节`);
        
        // 尝试提取openid（仅用于日志）
        const openid_match = body.match(/openid=([^&]+)/);
        if (openid_match) {
            log(`🆔 检测到OpenID: ${openid_match[1]}`);
        }
    }
    
    // 解析URL，保留参数
    const originalUrl = new URL($request.url);
    const params = originalUrl.search;
    
    // 构建新的URL（重定向到后端）
    const newUrl = `${SERVER_URL}/v1/r/1450000186/trade_record_query${params}`;
    
    log(`🎯 重定向目标: ${newUrl}`);
    log(`🔄 保留原始请求头和Body: 是`);
    log(`💡 后端将从Body中提取OpenID匹配账户`);
    
    log("=".repeat(60));
    log("✅ 重定向完成");
    log("=".repeat(60));
    
    // 执行重定向（保留所有原始headers和body）
    $done({ url: newUrl });
    
} catch (error) {
    log("❌ 重定向失败！");
    log(`错误信息: ${error.message || error}`);
    log(`错误堆栈: ${error.stack || '无'}`);
    
    // 发生错误时不修改请求，让它继续访问原始服务器
    log("⚠️ 回退到原始请求");
    $done({});
}

