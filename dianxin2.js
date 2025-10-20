// ============ 电信充值记录拦截脚本 ============
// 功能：拦截电信充值记录查询响应，删除指定月份或指定时间的记录
// 使用方法：在圈X中配置重写规则

/*
 *
 *
脚本功能：电信充值记录拦截修改 - 删除某月或某个固定时间的充值记录
软件版本：圈X
下载地址：苹果商店下载
脚本作者：
更新时间：2025-10-20
使用声明：⚠️此脚本仅供学习与交流，请在下载使用24小时内删除！⚠️
*******************************
[rewrite_local]

# > 电信充值记录拦截，按月份或精确时间删除
^https?:\/\/[a-z0-9\.-]*189\.cn\/.*recharge.*record.* url script-response-body https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/dianxin2.js

[mitm] 
hostname = appfuwu.189.cn
*
*
*/

// ============ 配置区域 ============
const CONFIG = {
    // 是否启用日志
    enableLog: true,

    // 整月删除：与响应分组标题 subTitle 完全一致，例如 "10月"、"9月"
    removeMonths: [/* "10月" */],

    // 精确时间删除：与记录字段 stateDate 完全一致，例如 "2025-10-17 20:23:59"
    removeExactTimes: [/* "2025-10-17 20:23:59" */],

    // 删除后该月无记录则移除该月分组
    removeEmptyMonthGroup: true,

    // 是否尝试同步清理 voiceMessage 文本中的对应语句
    scrubVoiceMessage: true
};

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[电信记录拦截] ${message}`);
    }
}

function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 从顶层定位到 data 节点（responseData.data）
function locateDataNode(parsed) {
    if (!isObject(parsed)) return null;
    const responseData = parsed.responseData;
    if (!isObject(responseData)) return null;
    const data = responseData.data;
    if (!isObject(data)) return null;
    return data;
}

// 过滤充值记录：按月份/时间删除
function filterRechargeRecords(data) {
    const groups = data.rechargeRecords;
    if (!Array.isArray(groups)) {
        log("⚠️ 响应结构中没有 rechargeRecords 或不是数组");
        return { removedTimes: [], removedMonths: [] };
    }

    const removedTimes = [];
    const removedMonths = [];

    // 深拷贝一层分组
    let processed = groups.map(g => ({ ...g }));

    // 1) 整月分组删除
    if (CONFIG.removeMonths.length > 0) {
        const before = processed.length;
        processed = processed.filter(group => {
            const monthTitle = group && group.subTitle;
            const hit = typeof monthTitle === "string" && CONFIG.removeMonths.includes(monthTitle);
            if (hit) {
                removedMonths.push(monthTitle);
                log(`📌 删除整月分组: ${monthTitle}`);
                return false;
            }
            return true;
        });
        const rm = before - processed.length;
        log(rm > 0 ? `✅ 成功删除整月分组 ${rm} 个` : "⚠️ 未匹配到需要整月删除的分组");
    }

    // 2) 精确时间删除
    if (CONFIG.removeExactTimes.length > 0) {
        for (const group of processed) {
            const list = Array.isArray(group.rechargeRecordInfos) ? group.rechargeRecordInfos : [];
            const beforeLen = list.length;
            group.rechargeRecordInfos = list.filter((item, index) => {
                const timeStr = item && item.stateDate;
                const hit = typeof timeStr === "string" && CONFIG.removeExactTimes.includes(timeStr);
                if (hit) {
                    removedTimes.push(timeStr);
                    log(`🗑️ 删除第 ${index + 1} 条：时间=${timeStr}, 金额=${item.paymentAmount || "未知"}`);
                    return false;
                }
                return true;
            });

            if (CONFIG.removeEmptyMonthGroup && beforeLen > 0 && group.rechargeRecordInfos.length === 0) {
                group.__EMPTY__ = true; // 标记空组
            }
        }

        // 清理空分组
        if (CONFIG.removeEmptyMonthGroup) {
            const b = processed.length;
            processed = processed.filter(g => !g.__EMPTY__);
            const removedEmpty = b - processed.length;
            if (removedEmpty > 0) log(`🧹 删除空分组：${removedEmpty} 个`);
        }
    }

    data.rechargeRecords = processed;
    return { removedTimes, removedMonths };
}

// 清理 voiceMessage 中的对应描述（尽力而为）
function scrubVoice(voiceMessage, removedTimes, removedMonths) {
    if (typeof voiceMessage !== "string" || voiceMessage.length === 0) return voiceMessage;

    let result = voiceMessage;

    // 先按精确时间：从时间到“元”的片段删掉
    for (const t of removedTimes) {
        const timeEsc = escapeRegExp(t);
        const reg = new RegExp(timeEsc + "[\\s\\S]*?元", "g");
        result = result.replace(reg, "");
    }

    // 再按月份：大致删除“10月……元”的片段（可能过删）
    for (const m of removedMonths) {
        const mEsc = escapeRegExp(m);
        const reg = new RegExp(mEsc + "[\\s\\S]*?元", "g");
        result = result.replace(reg, "");
    }

    // 收尾：压缩空白和多余标点
    result = result.replace(/[\u3000\s]{2,}/g, " ")
                   .replace(/，{2,}/g, "，")
                   .replace(/。{2,}/g, "。");
    return result;
}

// ============ 圈X入口 ============

log("========== 脚本开始执行 ==========");
log(`检测到电信充值记录查询响应: ${$request && $request.url}`);
log(`请求方法: ${$request && $request.method}`);

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

        // 定位数据节点并处理
        const data = locateDataNode(body);
        if (data) {
            if (Array.isArray(data.rechargeRecords) && data.rechargeRecords.length > 0) {
                const g0 = data.rechargeRecords[0];
                const firstItem = Array.isArray(g0.rechargeRecordInfos) && g0.rechargeRecordInfos[0] ? g0.rechargeRecordInfos[0] : null;
                if (firstItem) {
                    log(`第一条记录: 时间=${firstItem.stateDate}, 金额=${firstItem.paymentAmount}, 分组=${g0.subTitle}`);
                }
            }

            const { removedTimes, removedMonths } = filterRechargeRecords(data);

            // 可选：清理 voiceMessage
            if (CONFIG.scrubVoiceMessage && (removedTimes.length > 0 || removedMonths.length > 0)) {
                if (typeof body.responseData?.data?.voiceMessage === "string") {
                    const oldVoice = body.responseData.data.voiceMessage;
                    body.responseData.data.voiceMessage = scrubVoice(oldVoice, removedTimes, removedMonths);
                    log("🗣️ 已尝试同步清理 voiceMessage 文本");
                }
            }

            // 更新响应体
            response.body = JSON.stringify(body);
            log(`新响应体长度: ${response.body.length}`);
        } else {
            log("⚠️ 未定位到 responseData.data 节点，返回原始响应");
        }
    } catch (e) {
        log(`❌ 处理出错: ${e.message}`);
        log(`错误堆栈: ${e.stack}`);
        // 解析失败则不改动
    }

    log("✅ 响应处理完成");
    log("========== 脚本执行结束 ==========");
    $done({ body: response.body });
}


