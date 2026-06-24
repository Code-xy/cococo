// ============ 联通缴费信息拦截脚本 ============
// 类型：script-response-body
// 功能：拦截联通缴费信息查询响应，修改feeinfo字段
// API: https://upayxx.10010.com/npfwap/NpfMob/Mustpayment/getMustpayment

const log = (msg) => console.log(`[联通缴费信息] ${msg}`);

log("=".repeat(60));
log("📥 拦截到联通缴费信息查询响应");

// 获取响应body
let body = $response.body;

if (!body) {
    log("⚠️ 响应body为空，跳过处理");
    $done({});
    return;
}

try {
    // 解析JSON
    let data = JSON.parse(body);
    
    log(`💰 原始费用信息: ${data.feeinfo || '未找到'}`);
    
    // ============ 配置区：只修改这里设置费用 ============
    const NEW_FEEINFO = "1000000";      // 要显示的费用（字符串格式，保持小数点后两位）
    // =====================================================
    
    // 只修改 feeinfo 字段，其他字段保持原样
    if (data.feeinfo !== undefined) {
        data.feeinfo = NEW_FEEINFO;
        log(`✅ 费用信息已修改为: ${NEW_FEEINFO}`);
    }
    
    // 转换为JSON字符串（紧凑格式，保持原格式）
    const modifiedBody = JSON.stringify(data);
    
    log("=".repeat(60));
    log(`📤 返回修改后的响应`);
    log(`💰 最终费用信息: ${data.feeinfo}`);
    log("=".repeat(60));
    
    // 返回修改后的响应
    $done({
        body: modifiedBody
    });
    
} catch (error) {
    log(`❌ JSON解析失败: ${error.message}`);
    log(`📄 原始响应: ${body.substring(0, 200)}...`);
    $done({});  // 解析失败，返回原响应
}

