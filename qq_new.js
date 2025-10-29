// ============ QQ钱包账单拦截脚本 - 直接返回版 ============
// 功能：拦截QQ钱包请求，直接从后端获取并返回修改后的数据
// 类型：script-echo-response

/*
使用说明：
1. 启动后端: python qq_manual_backend.py
2. 在后端管理界面添加QQ账户（QQ号+OpenID）
3. 编辑并保存响应JSON
4. 修改下面的 SERVER_URL 为你的电脑/服务器IP
5. 在圈X中配置：

[rewrite_local]
^https?:\/\/api\.unipay\.qq\.com\/v1\/r\/1450000186\/trade_record_query url script-echo-response https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/qq_new.js

[mitm]
hostname = api.unipay.qq.com

注意：改成 script-echo-response 才能拿到请求body！
*/

// ============ 配置区域 ============
const SERVER_URL = 'http://192.168.240.68:8005';

// ============ 主逻辑 ============
const log = (msg) => console.log(`[QQ直接返回] ${msg}`);

log("=".repeat(60));
log("🔔 拦截到QQ钱包请求，准备直接返回");
log("=".repeat(60));

// 从请求body中提取openid
const requestBody = $request.body || '';

log(`📦 请求Body长度: ${requestBody.length} 字节`);
log(`📦 请求Body前100字符: ${requestBody.substring(0, 100)}`);

const openid_match = requestBody.match(/openid=([^&]+)/);
const openid = openid_match ? openid_match[1] : '(未找到)';

if (openid_match) {
    log(`✅ 成功提取OpenID: ${openid}`);
} else {
    log(`⚠️ 未找到OpenID，请检查请求格式`);
    log(`📦 完整Body: ${requestBody}`);
}

log(`💡 后端将根据OpenID自动匹配QQ账户`);

// 构建后端API地址
const backendUrl = `${SERVER_URL}/v1/r/1450000186/trade_record_query`;

log(`📡 请求后端: ${backendUrl}`);

// 请求后端获取修改后的响应
$task.fetch({
    url: backendUrl,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': $request.headers['User-Agent'] || 'QQ'
    },
    body: requestBody
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
        
        // 直接返回后端的响应
        $done({
            status: 'HTTP/1.1 200 OK',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Connection': 'keep-alive'
            },
            body: body
        });
        
    } else {
        log(`❌ 后端请求失败: HTTP ${response.statusCode}`);
        log(`💡 请检查后端是否启动`);
        
        // 返回错误响应
        $done({
            status: 'HTTP/1.1 200 OK',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ret: 1,
                msg: `后端请求失败: HTTP ${response.statusCode}`
            })
        });
    }
    
}, reason => {
    log(`❌ 无法连接到后端: ${reason.error}`);
    log(`💡 请检查:`);
    log(`   1. 后端是否启动: python qq_manual_backend.py`);
    log(`   2. IP地址是否正确: ${SERVER_URL}`);
    log(`   3. 手机和电脑/服务器是否在同一网络`);
    
    // 返回错误响应
    $done({
        status: 'HTTP/1.1 200 OK',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ret: 1,
            msg: `无法连接到后端: ${reason.error}`
        })
    });
});

