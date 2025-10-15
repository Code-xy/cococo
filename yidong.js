
// ============ 配置区域 ============
const data= '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'
const CONFIG = {
    // 是否启用日志
    enableLog: true,
    
    // 空值类型：
    // 1. "empty_string" - 空字符串 ""
    // 2. "fixed_encrypted" - 固定的加密空数据
    // 3. "keep_original" - 保持原响应不变（用于调试）
    emptyType: "fixed_encrypted",
    
    // 固定的加密空数据（当 emptyType = "fixed_encrypted" 时使用）
    fixedEmptyData: data
};

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[账单拦截] ${message}`);
    }
}

// ============ 圈X入口 ============

log("========== 脚本开始执行 ==========");
log(`检测到缴费历史查询响应: ${$request.url}`);
log(`请求方法: ${$request.method}`);

// 获取响应
let response = $response;

log(`response 是否存在: ${!!response}`);
log(`response.body 是否存在: ${!!(response && response.body)}`);

if (!response || !response.body) {
    log("❌ 响应为空，直接返回（脚本提前结束）");
    $done({});
} else {
    log("✅ 响应存在，开始处理...");
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
    
    log("✅ 响应处理完成哈哈哈");
    log(`准备返回的响应长度: ${response.body.length}`);
    log("========== 脚本执行结束 ==========");
    $done({ body: response.body });
}
