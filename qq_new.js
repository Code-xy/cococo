// ============ QQ钱包账单拦截脚本 - Request Body版 ============
// 功能：拦截请求，提取openid，请求后端，返回修改后的响应
// 类型：script-request-body

/*
[rewrite_local]
^https?:\/\/api\.unipay\.qq\.com\/v1\/r\/1450000186\/trade_record_query url script-request-body https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/qq_new.js

[mitm]
hostname = api.unipay.qq.com
*/

// ============ 配置区域 ============
const SERVER_URL = 'http://192.168.240.68:8005';

// ============ 主逻辑 ============
const log = (msg) => console.log(`[QQ拦截] ${msg}`);

log("=".repeat(60));
log("🔔 拦截到QQ钱包请求");
log("=".repeat(60));

// 获取请求信息
const requestBody = $request.body || '';
const requestUrl = $request.url;
const requestHeaders = $request.headers;

log(`📡 请求URL: ${requestUrl}`);
log(`📦 请求Body长度: ${requestBody.length} 字节`);
log(`📦 请求Body前100字符: ${requestBody.substring(0, 100)}`);

// 提取openid
const openid_match = requestBody.match(/openid=([^&]+)/);
const openid = openid_match ? openid_match[1] : '(未找到)';

if (openid_match) {
    log(`✅ 成功提取OpenID: ${openid}`);
} else {
    log(`⚠️ 未找到OpenID`);
}

log(`💡 向后端请求修改后的数据`);

// 请求后端
const backendUrl = `${SERVER_URL}/v1/r/1450000186/trade_record_query`;
log(`📡 后端地址: ${backendUrl}`);

$task.fetch({
    url: backendUrl,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': requestHeaders['User-Agent'] || 'QQ'
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
        
        // 返回后端的响应（关键！）
        $done({
            response: {
                status: 200,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Connection": "keep-alive"
                },
                body: body
            }
        });
        
    } else {
        log(`❌ 后端请求失败: HTTP ${response.statusCode}`);
        log(`💡 返回错误响应`);
        
        // 返回错误响应
        $done({
            response: {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ret: 1,
                    msg: `后端请求失败: HTTP ${response.statusCode}`
                })
            }
        });
    }
    
}).catch(error => {
    log(`❌ 无法连接到后端: ${error}`);
    log(`💡 请检查:`);
    log(`   1. 后端是否启动: python qq_manual_backend.py`);
    log(`   2. IP地址是否正确: ${SERVER_URL}`);
    log(`   3. 手机和电脑/服务器是否在同一网络`);
    
    // 返回错误响应
    $done({
        response: {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ret: 1,
                msg: `无法连接到后端: ${error}`
            })
        }
    });
});
