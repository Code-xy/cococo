// ============ 联通账单拦截脚本 - 重定向版 ============
// 功能：将联通账单请求重定向到本地服务器，返回修改后的响应
// 使用方法：在圈X中配置重写规则

/*
脚本功能：中国联通账单查询重定向到本地服务器
软件版本：圈X
使用说明：
1. 启动后端服务器: python liantong_manual_backend.py
2. 在后台查询账单、编辑JSON、保存
3. 在圈X中添加以下配置：

[rewrite_local]
# 联通账单重定向到本地服务器（保留Cookie和参数）
^https?:\/\/upay\.10010\.com\/npfwap\/NpfMobAppQuery\/feeSearch\/queryOrderNew.* url script-request-header https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/liantong_302.js

[mitm] 
hostname = upay.10010.com

注意：
- 修改下面的 SERVER_URL 为你的电脑IP
*/

// ============ 配置区域 ============
const SERVER_URL = 'http://192.168.240.68:8004';

// ============ 主逻辑 ============
const log = (msg) => {
    console.log(`[联通重定向] ${msg}`);
};

// 分隔线
log("=".repeat(60));
log("🔔 拦截到联通账单请求");
log("=".repeat(60));

try {
    // 输出原始请求信息
    log(`📡 原始URL: ${$request.url}`);
    log(`🔧 请求方法: ${$request.method}`);
    
    // 检查Cookie
    const hasCookie = $request.headers['Cookie'] || $request.headers['cookie'];
    log(`🍪 Cookie存在: ${hasCookie ? '✅ 是' : '❌ 否'}`);
    
    if (hasCookie) {
        const cookieLength = hasCookie.length;
        log(`🍪 Cookie长度: ${cookieLength} 字符`);
        
        // 检查关键Cookie字段
        const hasJUT = hasCookie.includes('JUT=');
        const hasLoginflag = hasCookie.includes('loginflag=');
        log(`🍪 关键字段: JUT=${hasJUT ? '✅' : '❌'}, loginflag=${hasLoginflag ? '✅' : '❌'}`);
    }
    
    // 解析URL，保留所有参数
    const originalUrl = new URL($request.url);
    const params = originalUrl.search;
    log(`📋 URL参数: ${params || '(无)'}`);
    
    // 构建新的URL
    const newUrl = `${SERVER_URL}/npfwap/NpfMobAppQuery/feeSearch/queryOrderNew${params}`;
    
    log(`🎯 重定向目标: ${newUrl}`);
    log(`🔄 保留原始请求头: 是`);
    log(`🔄 保留Cookie: 是`);
    
    // 测试后端连通性提示
    log(`💡 提示: 请确保手机能访问 ${SERVER_URL}`);
    
    log("=".repeat(60));
    log("✅ 重定向完成");
    log("=".repeat(60));
    
    // 执行重定向（保留所有原始headers，包括Cookie）
    $done({ url: newUrl });
    
} catch (error) {
    log("❌ 重定向失败！");
    log(`错误信息: ${error.message || error}`);
    log(`错误堆栈: ${error.stack || '无'}`);
    
    // 发生错误时不修改请求，让它继续访问原始服务器
    log("⚠️  回退到原始请求");
    $done({});
}

