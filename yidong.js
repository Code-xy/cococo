
// ============ 配置区域 ============
const CONFIG = {
    // 是否启用日志
    enableLog: true,
    
    // 要替换的空值 - 可以尝试以下几种：
    // 1. 空字符串: ""
    // 2. 空对象: {}
    // 3. 空数组: []
    // 4. null
    // 根据实际情况选择合适的值
    replaceValue: "",
    
    // 是否直接替换整个响应体（不保留JSON结构）
    replaceWholeBody: false
};

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[账单拦截] ${message}`);
    }
}

// ============ 主函数 ============

function modifyResponse(response) {
    try {
        log("开始处理响应...");
        log(`原始响应体前200字符: ${response.body.substring(0, 200)}`);
        
        // 如果配置为直接替换整个响应体
        if (CONFIG.replaceWholeBody) {
            log("使用配置：直接替换整个响应体");
            response.body = typeof CONFIG.replaceValue === 'string' 
                ? CONFIG.replaceValue 
                : JSON.stringify(CONFIG.replaceValue);
            log(`响应已替换为: ${response.body}`);
            return response;
        }
        
        // 否则，尝试解析JSON并替换其中的body字段
        let body = JSON.parse(response.body);
        log(`解析后的对象: ${JSON.stringify(body)}`);
        log(`对象的 keys: ${Object.keys(body).join(', ')}`);
        
        // 检查响应结构
        if (!body.body) {
            log(`警告：body.body 不存在，对象中的字段有: ${Object.keys(body).join(', ')}`);
            // 尝试替换整个响应
            response.body = typeof CONFIG.replaceValue === 'string' 
                ? CONFIG.replaceValue 
                : JSON.stringify(CONFIG.replaceValue);
            log(`已替换整个响应体为: ${response.body}`);
            return response;
        }
        
        log(`原始 body.body 前50字符: ${body.body.substring(0, 50)}...`);
        
        // 替换 body.body 字段
        body.body = CONFIG.replaceValue;
        response.body = JSON.stringify(body);
        
        log(`响应已替换，新的响应: ${response.body}`);
        log("响应修改完成");
        
    } catch (e) {
        log(`处理出错: ${e.message}`);
        log(`错误堆栈: ${e.stack}`);
        // 如果解析失败，直接替换整个响应
        response.body = typeof CONFIG.replaceValue === 'string' 
            ? CONFIG.replaceValue 
            : JSON.stringify(CONFIG.replaceValue);
        log(`异常处理：已替换整个响应体为: ${response.body}`);
    }
    
    return response;
}

// ============ 圈X入口 ============

// 检测是否是目标请求
if ($request.url.indexOf("getPayFeesHistory") !== -1) {
    // 跳过 OPTIONS 预检请求，只处理实际数据请求
    if ($request.method === "OPTIONS") {
        log("检测到 OPTIONS 预检请求，跳过处理");
        $done({});
    } else {
        log(`检测到缴费历史查询请求，请求方法: ${$request.method}`);
        
        // 获取响应
        let response = $response;
        
        // 修改响应
        response = modifyResponse(response);
        
        // 返回修改后的响应
        $done(response);
    }
} else {
    $done({});
}
