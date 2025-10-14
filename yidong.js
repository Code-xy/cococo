
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
        
        // 解析响应
        let body = JSON.parse(response.body);
        
        // 检查响应结构
        if (!body.body) {
            log("响应数据结构不正确");
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
