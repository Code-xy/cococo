// ============ QQ外部余额拦截脚本（简单版） ============
// 类型：script-response-body
// 功能：拦截QQ外部余额查询，直接修改响应中的余额值
// API: https://mq.api.unipay.qq.com/v1/r/1450000299/get_qqacct_info

const log = (msg) => console.log(`[QQ外部余额] ${msg}`);

log("=".repeat(60));
log("📥 拦截到QQ外部余额查询响应");

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
    
    log(`💰 原始Q币余额: ${data.qb_balance || 0}`);
    
    // ============ 配置区：只修改这里设置Q币余额 ============
    const NEW_QB_BALANCE = 100;      // 要显示的Q币余额
    // =====================================================
    
    // 只修改 qb_balance 字段，其他字段保持原样
    if (data.qb_balance !== undefined) {
        data.qb_balance = NEW_QB_BALANCE;
        log(`✅ Q币余额已修改为: ${NEW_QB_BALANCE}`);
    }
    
    // 转换为JSON字符串（紧凑格式，保持原格式）
    const modifiedBody = JSON.stringify(data);
    
    log("=".repeat(60));
    log(`📤 返回修改后的响应`);
    log(`💰 最终Q币余额: ${data.qb_balance}`);
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

