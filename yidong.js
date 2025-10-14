
// ============ 配置区域 ============
const CONFIG = {
    // 是否启用日志
    enableLog: true,
    
    // 空值类型：
    // 1. "empty_string" - 空字符串 ""
    // 2. "fixed_encrypted" - 固定的加密空数据
    // 3. "keep_original" - 保持原响应不变（用于调试）
    emptyType: "empty_string",
    
    // 固定的加密空数据（当 emptyType = "fixed_encrypted" 时使用）
    fixedEmptyData: ""
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
        
        // 根据配置决定如何处理
        if (CONFIG.emptyType === "keep_original") {
            log("配置为保持原响应，不做修改");
            // 不修改，直接返回
        } else if (body.body !== undefined) {
            log(`原始 body.body 前50字符: ${body.body.substring(0, 50)}...`);
            
            // 根据配置类型替换
            if (CONFIG.emptyType === "empty_string") {
                body.body = "";
                log(`已替换为空字符串`);
            } else if (CONFIG.emptyType === "fixed_encrypted") {
                body.body = CONFIG.fixedEmptyData;
                log(`已替换为固定的加密空数据呢`);
            }
            
            response.body = JSON.stringify(body);
        } else {
            log("警告：响应结构中没有 body 字段，直接替换整个响应体");
            let emptyValue = CONFIG.emptyType === "empty_string" ? "" : CONFIG.fixedEmptyData;
            response.body = JSON.stringify({ body: emptyValue });
        }
        
        log(`新响应: ${response.body}`);
        
    } catch (e) {
        log(`处理出错: ${e.message}`);
        log(`错误堆栈: ${e.stack}`);
        // 如果解析失败，根据配置构造响应
        if (CONFIG.emptyType !== "keep_original") {
            let emptyValue = CONFIG.emptyType === "empty_string" ? "" : CONFIG.fixedEmptyData;
            response.body = JSON.stringify({ body: emptyValue });
        }
    }
    
    log("响应处理完成");
    $done({ body: response.body });
}
