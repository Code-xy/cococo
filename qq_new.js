// ============ QQ钱包账单拦截脚本 - 替换响应版 ============
// 功能：拦截QQ钱包API响应，替换为后端修改后的数据
// 类型：script-response-body

/*
使用说明：
1. 启动后端: python qq_manual_backend.py
2. 在后端管理界面添加QQ账户（QQ号+OpenID）
3. 编辑并保存响应JSON
4. 修改下面的 SERVER_URL 为你的电脑/服务器IP
5. 在圈X中配置：

[rewrite_local]
^https?:\/\/api\.unipay\.qq\.com\/v1\/r\/1450000186\/trade_record_query url script-response-body https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/qq_new.js

[mitm]
hostname = api.unipay.qq.com
*/

// ============ 配置区域 ============
const SERVER_URL = 'http://192.168.240.68:8005';

// ============ 主逻辑 ============
const log = (msg) => console.log(`[QQ替换] ${msg}`);

log("=".repeat(60));
log("🔔 拦截到QQ钱包响应，准备替换");
log("=".repeat(60));

// 从请求body中提取openid（用于调试）
const requestBody = $request.body || '';
const openid_match = requestBody.match(/openid=([^&]+)/);
const openid = openid_match ? openid_match[1] : '(未找到)';

log(`🆔 请求中的OpenID: ${openid}`);
log(`💡 后端将根据OpenID自动匹配QQ账户`);

// 构建后端API地址
const backendUrl = `${SERVER_URL}/v1/r/1450000186/trade_record_query`;

log(`📡 请求后端: ${backendUrl}`);

// 从后端获取修改后的响应
$task.fetch({
    url: backendUrl,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': $request.headers['User-Agent'] || 'QQ'
    },
    body: $request.body
}).then(response => {
    log(`✅ 后端响应状态: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
        const body = response.body;
        
        try {
            const data = JSON.parse(body);
            log(`📋 返回码: ${data.ret}`);
            
            if (data.ret === 0) {
                log(`🎉 成功！返回修改后的QQ账单数据`);
                
                // 显示统计信息
                if (data.data && data.data.record_list) {
                    log(`📊 账单记录数: ${data.data.record_list.length}`);
                }
            } else {
                log(`⚠️ 后端错误: ${data.msg}`);
            }
        } catch (e) {
            log(`⚠️ JSON解析失败: ${e.message}`);
        }
        
        log("=".repeat(60));
        
        // 替换响应body
        $done({ body: body });
        
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
    log(`   1. 后端是否启动: python qq_manual_backend.py`);
    log(`   2. IP地址是否正确: ${SERVER_URL}`);
    log(`   3. 手机和电脑/服务器是否在同一网络`);
    log(`📄 返回原始响应（不影响正常使用）`);
    
    // 连接失败，返回原始响应
    $done({});
});

