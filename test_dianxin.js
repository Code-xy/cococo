// ============ 电信连接测试脚本 ============
// 功能：测试电信APP连接是否正常
// 使用方法：在圈X中配置重写规则

/*
[rewrite_local]

# > 电信连接测试
^https?:\/\/appfuwu\.189\.cn.* url script-response-body test_dianxin.js

[mitm] 
hostname = appfuwu.189.cn
*/

// ============ 配置区域 ============
const CONFIG = {
    // 是否启用日志
    enableLog: true
};

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[电信连接测试] ${message}`);
    }
}

// ============ 圈X入口 ============

log("========== 测试脚本开始执行 ==========");
log(`检测到请求: ${$request.url}`);
log(`请求方法: ${$request.method}`);
log(`请求头: ${JSON.stringify($request.headers)}`);

// 检查响应
if ($response) {
    log(`响应状态: ${$response.status}`);
    log(`响应头: ${JSON.stringify($response.headers)}`);
    log(`响应体长度: ${$response.body ? $response.body.length : 0}`);
    
    if ($response.body) {
        log(`响应体前200字符: ${$response.body.substring(0, 200)}`);
    }
} else {
    log("❌ 没有响应数据");
}

log("========== 测试脚本执行结束 ==========");

// 直接返回原响应，不做任何修改
$done({});
