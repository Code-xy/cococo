// ============ 电信充值记录拦截脚本 - 删除指定月份/时间点 ============
// 功能：拦截 appfuwu.189.cn /query/rechargeRecord 响应，按配置删除整月或指定时间点
// 使用方法：在圈X中配置重写规则

/*
 *
 *
脚本功能：电信充值记录拦截修改 - 支持按“subTitle 月份”与“stateDate 精确时间”删除
软件版本：圈X
更新时间：2025-10-20
使用声明：⚠️此脚本仅供学习与交流，请在下载使用24小时内删除！⚠️
*******************************
[rewrite_local]

# > 电信充值记录拦截，按配置删除月份/时间点
^https?:\/\/appfuwu\.189\.cn(:9021)?\/query\/rechargeRecord$ url script-response-body 电信2.js
# 如使用远程托管，示例：
# ^https?:\/\/appfuwu\.189\.cn(:9021)?\/query\/rechargeRecord$ url script-response-body https://raw.githubusercontent.com/你的用户名/你的仓库/main/电信2.js

[mitm]
hostname = appfuwu.189.cn
*
*
*/

// ============ 配置区域 ============
const CONFIG = {
    // 是否输出日志
    enableLog: true,

    // 按整月删除（匹配 subTitle，如 '10月'；留空表示不按月删除）
    deleteMonth: '10月',

    // 按精确时间删除（匹配 rechargeRecordInfos[].stateDate）
    deleteExactTimes: [
        '2025-10-17 20:23:59',
        // '2025-10-17 16:47:20',
        // '2025-10-07 11:36:58',
    ],

    // 如果某个月被删到 0 条，是否移除该月块
    removeEmptyMonthBlock: true,
};

// ============ 工具函数 ============
function log(msg) {
    if (CONFIG.enableLog) console.log(`[电信充值记录过滤] ${msg}`);
}
function normalizeMonth(s) {
    return String(s || '').replace(/\s+/g, '').trim();
}
function normalizeTime(s) {
    return String(s || '').trim();
}

// ============ 圈X入口 ============
log('========== 脚本开始执行 ==========');
log(`请求: ${$request?.url}`);
let response = $response;

if (!response || !response.body) {
    log('❌ 响应为空，直接返回');
    $done({});
} else {
    try {
        const raw = response.body;
        log(`原始响应体前120字符: ${raw.slice(0, 120)}`);

        const obj = JSON.parse(raw);
        const data = obj?.responseData?.data;
        const months = Array.isArray(data?.rechargeRecords) ? data.rechargeRecords : null;

        if (!months) {
            log('⚠️ 响应中无 data.rechargeRecords，跳过处理');
            return $done({ body: raw });
        }

        const deleteMonthNorm = normalizeMonth(CONFIG.deleteMonth || '');
        const deleteTimesSet = new Set((CONFIG.deleteExactTimes || []).map(normalizeTime));
        const wantDeleteMonth = deleteMonthNorm.length > 0;
        const wantDeleteTimes = deleteTimesSet.size > 0;

        log(`配置：按月删除=${wantDeleteMonth ? deleteMonthNorm : '否'}, 精确时间数量=${deleteTimesSet.size}`);

        const newMonths = [];

        for (const monthBlock of months) {
            const monthTitle = normalizeMonth(monthBlock?.subTitle);

            // 1) 整月删除
            if (wantDeleteMonth && monthTitle === deleteMonthNorm) {
                log(`🗑️ 删除整月块：${monthTitle}`);
                continue;
            }

            // 2) 精确时间点删除
            if (wantDeleteTimes && Array.isArray(monthBlock?.rechargeRecordInfos)) {
                const beforeLen = monthBlock.rechargeRecordInfos.length;

                monthBlock.rechargeRecordInfos = monthBlock.rechargeRecordInfos.filter(rec => {
                    const t = normalizeTime(rec?.stateDate);
                    const hit = deleteTimesSet.has(t);
                    if (hit) log(`🗑️ 删除记录：${monthTitle} - ${t} - 金额=${rec?.paymentAmount || ''}`);
                    return !hit;
                });

                const afterLen = monthBlock.rechargeRecordInfos.length;
                log(`月份 ${monthTitle} 记录数: ${beforeLen} -> ${afterLen}`);

                // 删空后是否移除整月块
                if (CONFIG.removeEmptyMonthBlock && monthBlock.rechargeRecordInfos.length === 0) {
                    log(`🧹 月份 ${monthTitle} 已空，移除该月块`);
                    continue;
                }
            }

            newMonths.push(monthBlock);
        }

        obj.responseData.data.rechargeRecords = newMonths;

        const out = JSON.stringify(obj);
        log(`✅ 处理完成，新长度=${out.length}`);
        if (newMonths.length === 0) {
            log('ℹ️ 所有月份块均被删除或为空');
        }
        log('========== 脚本执行结束 ==========');
        $done({ body: out });
    } catch (e) {
        log(`❌ 处理异常: ${e.message}`);
        log(e.stack || '');
        // 解析失败，原样返回
        $done({ body: response.body });
    }
}
