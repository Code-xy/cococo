// ============ QQ发票拦截脚本 ============
// 功能：拦截QQ发票查询API，替换为后端修改后的响应
// 类型：script-response-body


// ============ 配置区域 ============
const SERVER_URL = 'http://192.168.240.68:8005';

// ============ 主逻辑 ============
const log = (msg) => console.log(`[QQ发票] ${msg}`);

log("=".repeat(60));
log("📄 拦截到QQ发票查询响应，准备替换");
log("=".repeat(60));

// 尝试从之前保存的请求body中获取openid（qq_request.js会保存）
let openid = null;
try {
    const savedRequestBody = $prefs.valueForKey("qq_request_body");
    if (savedRequestBody) {
        const openid_match = savedRequestBody.match(/openid=([^&]+)/);
        if (openid_match) {
            openid = openid_match[1];
            log(`🆔 从保存的请求body提取到OpenID: ${openid}`);
        }
    }
    
    // 如果没找到，尝试从当前保存的openid获取
    if (!openid) {
        openid = $prefs.valueForKey("qq_current_openid");
        if (openid) {
            log(`🆔 从保存的OpenID获取: ${openid}`);
        }
    }
} catch (e) {
    log(`⚠️ 读取保存的OpenID失败: ${e.message}`);
}

if (!openid) {
    log(`⚠️ 未找到OpenID，后端将使用默认匹配策略`);
}

// 构建后端API地址
let backendUrl = `${SERVER_URL}/v1/r/1450000186/elec_invoice_service_front`;
if (openid) {
    backendUrl += `?openid=${encodeURIComponent(openid)}`;
    log(`📡 请求后端（带OpenID）: ${backendUrl}`);
} else {
    log(`📡 请求后端（无OpenID）: ${backendUrl}`);
}

// 从后端获取修改后的响应
$task.fetch({
    url: backendUrl,
    method: 'POST',  // 发票API使用POST
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': $request.headers['User-Agent'] || 'QuantumultX'
    },
    body: $request.body || ''  // 传递原始请求body，后端会从中提取openid
}).then(response => {
    if (response.statusCode === 200) {
        const body = response.body;
        
        try {
            const data = JSON.parse(body);
            
            if (data.ret === 0 || data.ret === '0') {
                log(`✅ 成功获取后端修改后的发票数据`);
                
                // 显示发票信息
                if (data.data && data.data.record && data.data.record.length > 0) {
                    log(`📊 发票记录数: ${data.data.record.length}`);
                    data.data.record.forEach((record, index) => {
                        if (index < 3) {  // 只显示前3条
                            log(`   ${index + 1}. ${record.productName || '未知'} - ¥${record.payAmt || '0'}`);
                        }
                    });
                }
                
                log(`🔄 替换原始响应为修改后的数据`);
                log("=".repeat(60));
                
                // 替换响应body
                $done({ body: body });
                
            } else if (data.ret === 1 || data.ret === '1') {
                log(`⚠️ 后端返回错误: ${data.msg || '未知错误'}`);
                log(`💡 提示: 请在管理界面选择账户并保存发票响应`);
                log(`📄 返回后端的错误信息给APP`);
                
                // 返回后端的错误信息
                $done({ body: body });
                
            } else {
                log(`⚠️ 未知返回码: ${data.ret}`);
                $done({ body: body });
            }
            
        } catch (e) {
            log(`❌ JSON解析失败: ${e.message}`);
            log(`📄 返回原始响应`);
            $done({});
        }
        
    } else {
        log(`❌ 后端请求失败: HTTP ${response.statusCode}`);
        log(`💡 请检查后端是否启动`);
        log(`📄 返回原始响应`);
        
        // 返回原始响应
        $done({});
    }
    
}, reason => {
    log(`❌ 无法连接到后端: ${reason.error}`);
    log(`💡 请检查:`);
    log(`   1. 后端是否启动: python unified_backend.py`);
    log(`   2. IP地址是否正确: ${SERVER_URL}`);
    log(`   3. 手机和电脑是否在同一网络`);
    log(`📄 返回原始响应（不影响正常使用）`);
    
    // 连接失败，返回原始响应
    $done({});
});

