
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

// 检测是否是目标请求
if ($request.url.indexOf("getPayFeesHistory") !== -1) {
    log(`检测到缴费历史查询请求: ${$request.url}`);
    log(`请求方法: ${$request.method}`);
    
    // 跳过 OPTIONS 预检请求
    if ($request.method === "OPTIONS") {
        log("OPTIONS 预检请求，放行");
        $done({});
    } else {
        log("直接拦截请求，返回空数据，不发送到服务器");
        
        // 构造一个假的响应，直接返回，不让请求发送到服务器
        const fakeResponse = {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                body: CONFIG.emptyDataResponse
            })
        };
        
        log(`返回假响应: ${fakeResponse.body}`);
        log("请求已被拦截，未发送到服务器");
        
        // 返回假响应
        $done({ response: fakeResponse });
    }
} else {
    $done({});
}
