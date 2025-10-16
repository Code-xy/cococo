// ============ QQ币充值记录拦截脚本 ============
// 功能：拦截QQ币充值记录查询响应，删除指定OfferID的记录
// 使用方法：在圈X中配置重写规则

/*
 *
 *
脚本功能：QQ币充值记录拦截修改 - 删除指定OfferID的充值记录
软件版本：圈X
下载地址：苹果商店下载
脚本作者：
更新时间：2025-10-16
使用声明：⚠️此脚本仅供学习与交流，请在下载使用24小时内删除！⚠️
*******************************
[rewrite_local]

# > QQ币充值记录拦截，删除指定OfferID的记录
^https?:\/\/api\.unipay\.qq\.com\/v1\/r\/\d+\/trade_record_query url script-response-body https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/qq.js

[mitm] 
hostname = api.unipay.qq.com
*
*
*/

// ============ 配置区域 ============
const CONFIG = {
    // 是否启用日志
    enableLog: true,
    
    // 要删除的OfferID列表（可以配置多个）
    removeOfferIDs: ["1450000490"],
    
    // 是否只删除特定服务类型的记录（true=只删除充值类型，false=删除所有匹配OfferID的记录）
    onlyRemoveSave: true,
    
    // 特定服务类型过滤（当 onlyRemoveSave=true 时生效）
    serviceTypeFilter: "save"  // save=充值, consume=消费
};

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[QQ币记录拦截] ${message}`);
    }
}

// ============ 圈X入口 ============

log("========== 脚本开始执行 ==========");
log(`检测到QQ币充值记录查询响应: ${$request.url}`);
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
        log(`响应状态 ret: ${body.ret}, msg: ${body.msg}`);
        
        // 检查响应结构：body.WaterList
        if (body.WaterList && Array.isArray(body.WaterList)) {
            log(`原始记录列表长度: ${body.WaterList.length}`);
            
            if (body.WaterList.length > 0) {
                log(`第一条记录: OfferID=${body.WaterList[0].OfferID}, 金额=${body.WaterList[0].PayAmt}, 类型=${body.WaterList[0].ServiceType}, 名称=${body.WaterList[0].ProductName}`);
                
                // 记录删除前的长度
                const originalLength = body.WaterList.length;
                
                // 过滤掉要删除的记录
                body.WaterList = body.WaterList.filter((item, index) => {
                    const offerID = item.OfferID;
                    const serviceType = item.ServiceType;
                    const payAmt = item.PayAmt;
                    const productName = item.ProductName;
                    
                    // 判断是否需要删除
                    const shouldRemove = CONFIG.removeOfferIDs.includes(offerID) && 
                                        (!CONFIG.onlyRemoveSave || serviceType === CONFIG.serviceTypeFilter);
                    
                    if (shouldRemove) {
                        log(`📌 删除第 ${index + 1} 条记录: OfferID=${offerID}, 金额=${payAmt}, 类型=${serviceType}, 名称=${productName}, 时间=${item.PayTime}`);
                        return false; // 不保留（删除）
                    }
                    return true; // 保留
                });
                
                const removedCount = originalLength - body.WaterList.length;
                
                if (removedCount > 0) {
                    log(`✅ 成功删除 ${removedCount} 条记录`);
                    log(`修改后记录列表长度: ${body.WaterList.length}`);
                    
                    if (body.WaterList.length > 0) {
                        log(`新的第一条记录: OfferID=${body.WaterList[0].OfferID}, 金额=${body.WaterList[0].PayAmt}, 类型=${body.WaterList[0].ServiceType}`);
                    } else {
                        log(`✅ 记录列表已清空（WaterList = []）`);
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
            log("⚠️ 响应结构中没有 WaterList 字段或不是数组");
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

