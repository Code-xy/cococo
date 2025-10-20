/*
[rewrite_local]

# 请按实际接口调整匹配规则（示例：含“recharge”与“record”的查询接口）
^https?:\/\/[a-z0-9\.-]*189\.cn\/.*recharge.*record.* url script-response-body https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/dianxin2.js

[mitm]
hostname = *.189.cn

说明：
- 如使用远程脚本，请将“电信充值记录拦截脚本.js”替换为远程URL；
- 按需在 CONFIG 中填写要删除的月份（与 subTitle 一致，如“10月”）
  与精确时间（与 stateDate 完整一致，如“2025-10-17 20:23:59”）。
*/

// ============ 配置区域 ============
const CONFIG = {
  // 是否打印日志
  enableLog: true,

  // 要整月删除的月份（与响应中的 subTitle 匹配，例如："10月", "9月"）
  removeMonths: [/* "10月" */],

  // 要删除的精确时间（与 stateDate 完整字符串匹配，例如："2025-10-17 20:23:59"）
  removeExactTimes: [/* "2025-10-17 20:23:59" */],

  // 当某月的充值条目全被删光时，是否移除该月分组
  removeEmptyMonthGroup: true,

  // 是否尝试同步清理 voiceMessage 中对应的语音播报片段
  scrubVoiceMessage: true
};

// ============ 工具函数 ============
function log(message) {
  if (CONFIG.enableLog) {
    console.log(`[电信充值记录拦截] ${message}`);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 尝试从响应体中定位到 data 节点
function locateDataNode(parsed) {
  // 预期结构：headerInfos, responseData.{ data.{ rechargeRecords, title, ... } }
  if (!isObject(parsed)) return null;
  const responseData = parsed.responseData;
  if (!isObject(responseData)) return null;
  const data = responseData.data;
  if (!isObject(data)) return null;
  return data;
}

// 过滤充值记录数据
function filterRechargeRecords(data) {
  const records = data.rechargeRecords;
  if (!Array.isArray(records)) {
    log("⚠️ 未找到 rechargeRecords 数组，跳过修改");
    return { removedTimes: [], removedMonths: [] };
  }

  const removedTimes = [];
  const removedMonths = [];

  // 先处理整月删除
  let processed = records.map(group => ({ ...group }));
  if (CONFIG.removeMonths.length > 0) {
    const before = processed.length;
    processed = processed.filter(group => {
      const monthTitle = group && group.subTitle;
      const shouldRemoveMonth = typeof monthTitle === "string" && CONFIG.removeMonths.includes(monthTitle);
      if (shouldRemoveMonth) {
        removedMonths.push(monthTitle);
        log(`📌 删除整月分组：${monthTitle}`);
        return false;
      }
      return true;
    });
    log(`整月分组删除：${before - processed.length} 个`);
  }

  // 再处理精确时间删除
  if (CONFIG.removeExactTimes.length > 0) {
    for (const group of processed) {
      const list = Array.isArray(group.rechargeRecordInfos) ? group.rechargeRecordInfos : [];
      const beforeLen = list.length;
      group.rechargeRecordInfos = list.filter(item => {
        const timeStr = item && item.stateDate;
        const hit = typeof timeStr === "string" && CONFIG.removeExactTimes.includes(timeStr);
        if (hit) {
          removedTimes.push(timeStr);
          log(`🗑️ 删除记录：${timeStr}（${item.paymentAmount || "金额未知"}）`);
          return false;
        }
        return true;
      });

      if (CONFIG.removeEmptyMonthGroup && beforeLen > 0 && group.rechargeRecordInfos.length === 0) {
        // 打标，稍后统一清理空组
        group.__EMPTY__ = true;
      }
    }

    // 清理空分组
    if (CONFIG.removeEmptyMonthGroup) {
      const before = processed.length;
      processed = processed.filter(g => !g.__EMPTY__);
      const removedEmpty = before - processed.length;
      if (removedEmpty > 0) log(`🧹 删除空分组：${removedEmpty} 个`);
    }
  }

  data.rechargeRecords = processed;
  return { removedTimes, removedMonths };
}

// 清理 voiceMessage 中的对应描述（尽力而为，避免破坏其它内容）
function scrubVoice(voiceMessage, removedTimes, removedMonths) {
  if (typeof voiceMessage !== "string" || voiceMessage.length === 0) return voiceMessage;

  let result = voiceMessage;

  // 1) 先按精确时间删除：从匹配的时间开始，尽量删除到下一个“元”为止
  for (const t of removedTimes) {
    const timeEsc = escapeRegExp(t);
    const reg = new RegExp(timeEsc + "[\\s\\S]*?元", "g");
    result = result.replace(reg, "");
  }

  // 2) 再按月份大致清理：删除形如“10月……元”的句段（可能会过删，故仅在开启整月删除时启用）
  for (const m of removedMonths) {
    const mEsc = escapeRegExp(m);
    const reg = new RegExp(mEsc + "[\\s\\S]*?元", "g");
    result = result.replace(reg, "");
  }

  // 收尾：压缩多余空白
  result = result.replace(/[\u3000\s]{2,}/g, " ")
                 .replace(/，{2,}/g, "，")
                 .replace(/。{2,}/g, "。");
  return result;
}

// ============ 圈X入口 ============
try {
  log("========== 脚本开始执行 ==========");
  log(`请求URL: ${$request && $request.url}`);

  if (!$response || typeof $response.body !== "string") {
    log("❌ 响应为空或不是字符串，直接返回");
    $done({});
  } else {
    const raw = $response.body;
    log(`原始体前120字符: ${raw.slice(0, 120)}`);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      log(`❌ JSON解析失败：${e.message}`);
      return $done({ body: raw });
    }

    const data = locateDataNode(parsed);
    if (!data) {
      log("⚠️ 未定位到 responseData.data 节点，返回原始响应");
      return $done({ body: raw });
    }

    const { removedTimes, removedMonths } = filterRechargeRecords(data);

    if (CONFIG.scrubVoiceMessage && (removedTimes.length > 0 || removedMonths.length > 0)) {
      if (typeof parsed.responseData?.data?.voiceMessage === "string") {
        const oldVoice = parsed.responseData.data.voiceMessage;
        parsed.responseData.data.voiceMessage = scrubVoice(oldVoice, removedTimes, removedMonths);
        log("🗣️ 已尝试同步清理 voiceMessage 文本");
      }
    }

    const newBody = JSON.stringify(parsed);
    log(`✅ 修改完成，新体长度：${newBody.length}`);
    log("========== 脚本执行结束 ==========");
    $done({ body: newBody });
  }
} catch (err) {
  log(`❌ 运行异常：${err.message}`);
  $done({});
}




