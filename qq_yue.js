// ============ QQ钱包余额修改脚本 ============
// 功能：拦截QQ钱包首页余额查询响应，修改Q币余额显示
// 使用方法：在圈X中配置重写规则

/*
 *
 *
脚本功能：QQ钱包余额修改 - 修改Q币余额显示数量
软件版本：圈X
下载地址：苹果商店下载
脚本作者：
更新时间：2025-10-16
使用声明：⚠️此脚本仅供学习与交流，请在下载使用24小时内删除！⚠️
*******************************
[rewrite_local]

# > QQ钱包余额修改，修改Q币显示数量
^https?:\/\/api\.unipay\.qq\.com\/v1\/r\/\d+\/wechat_query\?cmd=4.* url script-response-body https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/qq_yue.js

[mitm] 
hostname = api.unipay.qq.com
*
*
*/

// ============ 配置区域 ============
const CONFIG = {
    // 是否启用日志
    enableLog: true,
    
    // 修改后的Q币余额（400 对应 4个Q币，40000 对应 400个Q币）
    // 默认设置为 4000000000（相当于4000万个Q币）
    newQbBalance: 4000000000,
    
    // 是否同时修改Q点余额
    modifyQdBalance: false,
    
    // 修改后的Q点余额
    newQdBalance: 4000000000
};

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[QQ余额修改] ${message}`);
    }
}

// ============ 圈X入口 ============

log("========== 脚本开始执行 ==========");
log(`检测到QQ钱包余额查询响应: ${$request.url}`);
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
        log(`原始响应体: ${response.body}`);
        
        // 解析响应体
        let body = JSON.parse(response.body);
        
        log(`响应结构 keys: ${Object.keys(body).join(', ')}`);
        log(`响应状态 ret: ${body.ret}`);
        
        // 检查响应结构
        if (body.qb_balance !== undefined) {
            const originalQbBalance = body.qb_balance;
            const originalQbCoins = (originalQbBalance / 100).toFixed(2);
            
            log(`原始Q币余额: ${originalQbBalance} (${originalQbCoins}个Q币)`);
            
            // 修改Q币余额
            body.qb_balance = CONFIG.newQbBalance;
            
            const newQbCoins = (CONFIG.newQbBalance / 100).toFixed(2);
            log(`✅ 已修改Q币余额: ${CONFIG.newQbBalance} (${newQbCoins}个Q币)`);
        } else {
            log("⚠️ 响应结构中没有 qb_balance 字段");
        }
        
        // 是否修改Q点余额
        if (CONFIG.modifyQdBalance && body.qd_balance !== undefined) {
            const originalQdBalance = body.qd_balance;
            const originalQdPoints = (originalQdBalance / 100).toFixed(2);
            
            log(`原始Q点余额: ${originalQdBalance} (${originalQdPoints}个Q点)`);
            
            // 修改Q点余额
            body.qd_balance = CONFIG.newQdBalance;
            
            const newQdPoints = (CONFIG.newQdBalance / 100).toFixed(2);
            log(`✅ 已修改Q点余额: ${CONFIG.newQdBalance} (${newQdPoints}个Q点)`);
        }
        
        // 更新响应体
        response.body = JSON.stringify(body);
        log(`新响应体: ${response.body}`);
        log(`新响应体长度: ${response.body.length}`);
        
    } catch (e) {
        log(`❌ 处理出错: ${e.message}`);
        log(`错误堆栈: ${e.stack}`);
        // 如果解析失败，返回原响应
    }
    
    log("✅ 响应处理完成");
    log("========== 脚本执行结束 ==========");
    $done({ body: response.body });
}

