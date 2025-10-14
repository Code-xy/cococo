
// ============ 配置区域 ============
const CONFIG = {
    // 是否启用日志
    enableLog: true,
    
    // 要替换的空值
    replaceValue: ""
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
        log(`原始响应体: ${response.body}`);
        
        // 解析响应
        let body = JSON.parse(response.body);
        log(`解析后的对象: ${JSON.stringify(body)}`);
        log(`对象的 keys: ${Object.keys(body).join(', ')}`);
        
        // 检查响应结构 - 先打印日志再判断
        if (!body.body) {
            log(`响应数据结构不正确，body.body 不存在`);
            log(`body 的类型: ${typeof body.body}`);
            // 即使结构不对，也尝试替换整个响应
            response.body = CONFIG.replaceValue;
            return response;
        }
        
        log(`原始数据: ${body.body.substring(0, 50)}...`);
        
        // 直接替换为空值
        body.body = CONFIG.replaceValue;
        response.body = JSON.stringify(body);
        
        log("响应已替换为空值");
        log("响应修改完成");
        
    } catch (e) {
        log(`处理出错: ${e.message}`);
        log(`错误堆栈: ${e.stack}`);
        // 如果解析失败，直接替换整个响应
        response.body = CONFIG.replaceValue;
    }
    
    return response;
}

// ============ 圈X入口 ============

// 检测是否是目标请求
if ($request.url.indexOf("getPayFeesHistory") !== -1) {
    log("检测到缴费历史查询请求");
    
    // 获取响应
    let response = $response;
    
    // 修改响应
    response = modifyResponse(response);
    
    // 返回修改后的响应
    $done(response);
} else {
    $done({});
}
