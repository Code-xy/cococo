
// ============ 配置区域 ============
const CONFIG = {
    // 是否启用日志
    enableLog: true,
    
    // 返回的空数据（有效的加密空列表）
    emptyDataResponse: "TDdnLzJZN1FBOG5KWFhwWC8ydlBhUnRsd3FlODBJUkQvdUtVNTVJV3BMQm5VSGp5WjI1ZkJHQnJVcGxtM2VNYTdoa0JDSVl5RDB1bgpqVHRQQWczOHpRPT0="
};

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[账单拦截] ${message}`);
    }
}

// ============ 圈X入口 ============

log(`检测到缴费历史查询响应: ${$request.url}`);
log(`请求方法: ${$request.method}`);

// 获取响应
let response = $response;

if (!response || !response.body) {
    log("响应为空，直接返回");
    $done({});
} else {
    try {
        log(`原始响应体前100字符: ${response.body.substring(0, 100)}`);
        
        // 解析响应体
        let body = JSON.parse(response.body);
        
        log(`响应结构 keys: ${Object.keys(body).join(', ')}`);
        
        // 替换 body 字段为空数据
        if (body.body !== undefined) {
            log(`原始 body.body 前50字符: ${body.body.substring(0, 50)}...`);
            body.body = CONFIG.emptyDataResponse;
            response.body = JSON.stringify(body);
            log(`已替换为空数据响应`);
        } else {
            log("警告：响应结构中没有 body 字段，直接替换整个响应体");
            response.body = JSON.stringify({ body: CONFIG.emptyDataResponse });
        }
        
        log(`新响应: ${response.body}`);
        
    } catch (e) {
        log(`处理出错: ${e.message}`);
        log(`错误堆栈: ${e.stack}`);
        // 如果解析失败，构造一个简单的响应
        response.body = JSON.stringify({ body: CONFIG.emptyDataResponse });
    }
    
    log("响应处理完成");
    $done({ body: response.body });
}
