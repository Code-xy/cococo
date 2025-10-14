// ============ 联通账单拦截脚本 ============
// 功能：拦截联通账单查询响应，删除第一条数据（最新的一条）
// 使用方法：在圈X中配置重写规则

/*
 *
 *
脚本功能：中国联通缴费历史拦截修改 - 删除第一条账单数据
软件版本：圈X
下载地址：苹果商店下载
脚本作者：
更新时间：2025-10-14
电报频道：
问题反馈：
使用声明：⚠️此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！⚠️⚠️⚠️
*******************************
[rewrite_local]

# > 中国联通缴费历史拦截，删除第一条账单记录
^https?:\/\/upay\.10010\.com\/npfwap\/NpfMobAppQuery\/feeSearch\/queryOrderNew.* url script-response-body https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/liantong.js

[mitm] 
hostname = upay.10010.com
*
*


*
*
*/



// ============ 配置区域 ============
const CONFIG = {
    // 是否启用日志
    enableLog: true,
    
    // 是否删除第一条数据
    removeFirstItem: true
};

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[联通账单拦截] ${message}`);
    }
}

// ============ 圈X入口 ============

log("========== 脚本开始执行 ==========");
log(`检测到联通账单查询响应: ${$request.url}`);
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
        
        // 检查是否存在 orderList 字段
        if (body.orderList && Array.isArray(body.orderList)) {
            log(`原始订单列表长度: ${body.orderList.length}`);
            
            if (body.orderList.length > 0) {
                log(`第一条数据月份: ${body.orderList[0].month}, 金额: ${body.orderList[0].totalMoney}`);
                
                // 删除第一条数据
                if (CONFIG.removeFirstItem) {
                    body.orderList.shift(); // 删除数组第一个元素
                    log(`✅ 已删除第一条数据`);
                    log(`修改后订单列表长度: ${body.orderList.length}`);
                    
                    if (body.orderList.length > 0) {
                        log(`新的第一条数据月份: ${body.orderList[0].month}, 金额: ${body.orderList[0].totalMoney}`);
                    } else {
                        log(`订单列表已清空`);
                    }
                }
            } else {
                log("⚠️ 订单列表为空，无需删除");
            }
            
            // 更新响应体
            response.body = JSON.stringify(body);
        } else {
            log("⚠️ 响应结构中没有 orderList 字段或不是数组");
        }
        
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

