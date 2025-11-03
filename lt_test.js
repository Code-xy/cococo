// ============ 联通手机号查询拦截脚本 ============
// 类型：script-response-body
// 功能：拦截联通手机号查询响应，修改 certNum 和 phoneNum
// API: https://m.10010.com/mall-order/ticket/check/v1

const log = (msg) => console.log(`[联通手机号修改] ${msg}`);

log("=".repeat(60));
log("📥 拦截到手机号查询响应");

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
    
    log(`📱 原始手机号: ${data.phoneNum || '未找到'}`);
    log(`🆔 原始身份证: ${data.certNum || '未找到'}`);
    
    // ============ 配置区：修改这里 ============
    const NEW_PHONE = "13800138000";  // 要显示的新手机号
    const NEW_CERT_NUM = "110101********1234";  // 要显示的新身份证号
    // ==========================================
    
    // 修改字段
    if (data.phoneNum) {
        data.phoneNum = NEW_PHONE;
        log(`✅ 手机号已修改为: ${NEW_PHONE}`);
    }
    
    if (data.certNum) {
        data.certNum = NEW_CERT_NUM;
        log(`✅ 身份证号已修改为: ${NEW_CERT_NUM}`);
    }
    
    // 如果有加密的手机号，也可以修改
    if (data.enPhone) {
        // 注意：enPhone可能是加密的，如果不确定格式，可以先不修改
        // data.enPhone = "加密后的新手机号";
    }
    
    // 转换为JSON字符串（紧凑格式，保持原格式）
    const modifiedBody = JSON.stringify(data);
    
    log("=".repeat(60));
    log(`📤 返回修改后的响应`);
    
    // 返回修改后的响应
    $done({
        body: modifiedBody
    });
    
} catch (error) {
    log(`❌ JSON解析失败: ${error.message}`);
    log(`📄 原始响应: ${body.substring(0, 200)}...`);
    $done({});  // 解析失败，返回原响应
}

