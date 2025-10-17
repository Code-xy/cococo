// ============ QQ币充值记录拦截脚本 - 删除第一条 ============
// 功能：拦截QQ币充值记录查询响应，自动删除列表中的第一条记录
// 使用方法：在圈X中配置重写规则

/*
 *
 *
脚本功能：QQ币充值记录拦截修改 - 自动删除第一条记录
软件版本：圈X
下载地址：苹果商店下载
脚本作者：
更新时间：2025-10-17
使用声明：⚠️此脚本仅供学习与交流，请在下载使用24小时内删除！⚠️
*******************************
[rewrite_local]

# > QQ币充值记录拦截，删除第一条记录
^https?:\/\/api\.unipay\.qq\.com\/v1\/r\/\d+\/trade_record_query url script-response-body https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/qq_delete_first.js

[mitm] 
hostname = api.unipay.qq.com
*
*
*/

// ============ 配置区域 ============
const CONFIG = {
    // 是否启用日志
    enableLog: true,
    
    // 列表最小长度（只有当记录数大于此值时才删除第一条）
    minListLength: 1,
    
    // 是否只删除特定服务类型的记录（true=只删除充值类型，false=删除任意类型）
    onlyRemoveSave: false,
    
    // 特定服务类型过滤（当 onlyRemoveSave=true 时生效）
    serviceTypeFilter: "save"  // save=充值, consume=消费
};

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[QQ币记录删除第一条] ${message}`);
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
            
            if (body.WaterList.length > CONFIG.minListLength) {
                // 显示第一条记录信息
                const firstRecord = body.WaterList[0];
                log(`准备删除第一条记录: OfferID=${firstRecord.OfferID}, 金额=${firstRecord.PayAmt}, 类型=${firstRecord.ServiceType}, 名称=${firstRecord.ProductName}, 时间=${firstRecord.PayTime}`);
                
                // 检查是否需要根据服务类型过滤
                if (CONFIG.onlyRemoveSave) {
                    if (firstRecord.ServiceType === CONFIG.serviceTypeFilter) {
                        // 删除第一条记录
                        body.WaterList.shift();
                        log(`✅ 成功删除第一条记录（匹配服务类型: ${CONFIG.serviceTypeFilter}）`);
                    } else {
                        log(`⚠️ 第一条记录服务类型为 ${firstRecord.ServiceType}，不匹配过滤条件，跳过删除`);
                    }
                } else {
                    // 直接删除第一条记录
                    body.WaterList.shift();
                    log(`✅ 成功删除第一条记录`);
                }
                
                log(`修改后记录列表长度: ${body.WaterList.length}`);
                
                if (body.WaterList.length > 0) {
                    log(`新的第一条记录: OfferID=${body.WaterList[0].OfferID}, 金额=${body.WaterList[0].PayAmt}, 类型=${body.WaterList[0].ServiceType}`);
                } else {
                    log(`✅ 记录列表已清空（WaterList = []）`);
                }
            } else {
                log(`⚠️ 记录列表长度为 ${body.WaterList.length}，不满足最小长度要求（${CONFIG.minListLength}），无需删除`);
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


