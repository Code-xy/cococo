// ============ 电信充值记录删除第一条脚本 ============
// 功能：拦截电信充值记录查询响应，自动删除最新的第一条充值记录
// 使用方法：在圈X中配置重写规则

/*
 *
 *
脚本功能：中国电信充值记录拦截修改 - 自动删除最新的第一条充值记录
软件版本：圈X
下载地址：苹果商店下载
脚本作者：
更新时间：2025-10-20
电报频道：
问题反馈：
使用声明：⚠️此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！⚠️⚠️⚠️
*******************************
[rewrite_local]

# > 中国电信充值记录拦截，删除最新的第一条记录
# 适配接口：充值明细查询
^https?:\/\/[^\/]+\appfuwu.189\.cn\/.+ url script-response-body https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/dianxin2.js

[mitm] 
hostname = appfuwu.189.cn
*
*


*
*
*/



// ============ 配置区域 ============
const CONFIG = {
    // 是否启用日志
    enableLog: true,
    
    // 要删除的记录数量（从最新的开始删除）
    removeCount: 1,
    
    // 是否删除整个月份（如果该月只有一条记录）
    removeEmptyMonth: true
};

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[电信账单删除第一条] ${message}`);
    }
}

// ============ 圈X入口 ============

// 检查是否在圈X环境中运行
if (typeof $request === 'undefined' || typeof $response === 'undefined') {
    console.log("❌ 脚本未在圈X环境中运行，请检查配置");
    // 不要直接退出，让脚本继续执行以便调试
}

log("========== 脚本开始执行 ==========");
log(`检测到电信充值记录查询响应: ${$request.url}`);
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
        
        // 检查响应结构：responseData.data.rechargeRecords
        if (body.responseData && 
            body.responseData.data && 
            body.responseData.data.rechargeRecords && 
            Array.isArray(body.responseData.data.rechargeRecords)) {
            
            const rechargeRecords = body.responseData.data.rechargeRecords;
            log(`充值记录月份数量: ${rechargeRecords.length}`);
            
            if (rechargeRecords.length > 0 && rechargeRecords[0].rechargeRecordInfos && 
                Array.isArray(rechargeRecords[0].rechargeRecordInfos) && 
                rechargeRecords[0].rechargeRecordInfos.length > 0) {
                
                const firstMonth = rechargeRecords[0];
                const firstRecord = firstMonth.rechargeRecordInfos[0];
                
                log(`当前最新记录所属月份: ${firstMonth.subTitle}`);
                log(`当前第一条记录: 时间=${firstRecord.stateDate}, 金额=${firstRecord.paymentAmount}, 渠道=${firstRecord.payChannel}`);
                
                let removedCount = 0;
                
                // 删除最新的第一条记录
                for (let i = 0; i < CONFIG.removeCount && rechargeRecords.length > 0; i++) {
                    if (rechargeRecords[0].rechargeRecordInfos.length > 0) {
                        const removedItem = rechargeRecords[0].rechargeRecordInfos.shift();
                        log(`📌 删除记录: 时间=${removedItem.stateDate}, 金额=${removedItem.paymentAmount}, 渠道=${removedItem.payChannel}`);
                        removedCount++;
                        
                        // 如果该月份已经没有记录了，删除整个月份
                        if (CONFIG.removeEmptyMonth && rechargeRecords[0].rechargeRecordInfos.length === 0) {
                            const removedMonth = rechargeRecords.shift();
                            log(`📌 删除空月份: ${removedMonth.subTitle}`);
                        }
                    }
                }
                
                if (removedCount > 0) {
                    log(`✅ 成功删除 ${removedCount} 条记录`);
                    
                    // 统计剩余记录
                    let totalRecords = 0;
                    rechargeRecords.forEach(month => {
                        totalRecords += month.rechargeRecordInfos.length;
                    });
                    log(`剩余充值记录总数: ${totalRecords} 条，分布在 ${rechargeRecords.length} 个月份`);
                    
                    if (rechargeRecords.length > 0 && rechargeRecords[0].rechargeRecordInfos.length > 0) {
                        const newFirstRecord = rechargeRecords[0].rechargeRecordInfos[0];
                        log(`新的第一条记录: 时间=${newFirstRecord.stateDate}, 金额=${newFirstRecord.paymentAmount}`);
                    } else {
                        log(`充值记录列表已清空`);
                    }
                } else {
                    log("⚠️ 没有符合条件的记录可以删除");
                }
            } else {
                log("⚠️ 充值记录列表为空，无需删除");
            }
            
            // 更新响应体
            response.body = JSON.stringify(body);
        } else {
            log("⚠️ 响应结构中没有 responseData.data.rechargeRecords 字段或不是数组");
            if (body.responseData) {
                log(`responseData keys: ${Object.keys(body.responseData).join(', ')}`);
            }
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


