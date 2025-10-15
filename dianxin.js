// ============ 电信账单拦截脚本 ============
// 功能：拦截电信账单查询响应，删除指定充值金额的记录
// 使用方法：在圈X中配置重写规则

/*
 *
 *
脚本功能：中国电信缴费历史拦截修改 - 删除指定金额的充值记录
软件版本：圈X
下载地址：苹果商店下载
脚本作者：
更新时间：2025-10-14
电报频道：
问题反馈：
使用声明：⚠️此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！⚠️⚠️⚠️
*******************************
[rewrite_local]

# > 中国电信缴费历史拦截，删除指定金额充值记录
^https?:\/\/gd\.189\.cn\/J\/J10165\.j.* url script-response-body https://raw.githubusercontent.com/你的用户名/你的仓库/main/电信账单拦截脚本.js

[mitm] 
hostname = gd.189.cn
*
*


*
*
*/



// ============ 配置区域 ============
const CONFIG = {
    // 是否启用日志
    enableLog: true,
    
    // 要删除的充值金额（可以是数组，支持删除多个金额）
    removeAmounts: ["9.98"],
    
    // 是否只删除充值类型的记录（true=只删除充值，false=删除所有匹配金额的记录）
    onlyRemoveRecharge: true
};

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[电信账单拦截] ${message}`);
    }
}

// ============ 圈X入口 ============

log("========== 脚本开始执行 ==========");
log(`检测到电信账单查询响应: ${$request.url}`);
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
        
        // 检查响应结构：body.r.r01
        if (body.r && body.r.r01 && Array.isArray(body.r.r01)) {
            log(`原始记录列表长度: ${body.r.r01.length}`);
            
            if (body.r.r01.length > 0) {
                log(`第一条记录: 时间=${body.r.r01[0].r0102}, 金额=${body.r.r01[0].r0103}, 类型=${body.r.r01[0].r0104}`);
                
                // 记录删除前的长度
                const originalLength = body.r.r01.length;
                
                // 过滤掉要删除的记录
                body.r.r01 = body.r.r01.filter((item, index) => {
                    const amount = item.r0103; // 充值金额
                    const type = item.r0104;   // 类型（充值/缴费）
                    
                    // 判断是否需要删除
                    const shouldRemove = CONFIG.removeAmounts.includes(amount) && 
                                        (!CONFIG.onlyRemoveRecharge || type === "充值");
                    
                    if (shouldRemove) {
                        log(`📌 删除第 ${index + 1} 条记录: 时间=${item.r0102}, 金额=${amount}, 类型=${type}`);
                        return false; // 不保留（删除）
                    }
                    return true; // 保留
                });
                
                const removedCount = originalLength - body.r.r01.length;
                
                if (removedCount > 0) {
                    log(`✅ 成功删除 ${removedCount} 条记录`);
                    log(`修改后记录列表长度: ${body.r.r01.length}`);
                    
                    if (body.r.r01.length > 0) {
                        log(`新的第一条记录: 时间=${body.r.r01[0].r0102}, 金额=${body.r.r01[0].r0103}, 类型=${body.r.r01[0].r0104}`);
                    } else {
                        log(`记录列表已清空`);
                    }
                } else {
                    log("⚠️ 没有找到需要删除的记录");
                }
            } else {
                log("⚠️ 记录列表为空，无需删除");
            }
            
            // 更新响应体
            response.body = JSON.stringify(body);
        } else {
            log("⚠️ 响应结构中没有 r.r01 字段或不是数组");
            log(`响应结构: ${JSON.stringify(body).substring(0, 200)}`);
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

