// ============ 联通账单拦截脚本 - 替换响应版 ============
// 功能：拦截联通API响应，替换为后端修改后的数据
// 类型：script-response-body
// 最简单直接的方式！

/*
使用说明：
1. 启动后端: python liantong_manual_backend_v2.py
2. 在后端管理界面选择账户、查询并保存修改后的响应
3. 修改下面的 SERVER_URL 为你的电脑IP
4. 在圈X中配置：

[rewrite_local]
^https?:\/\/upay\.10010\.com\/npfwap\/NpfMobAppQuery\/feeSearch\/queryOrderNew.* url script-response-body https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/liantong_302.js

[mitm]
hostname = upay.10010.com
*/

// ============ 配置区域 ============
const SERVER_URL = 'http://192.168.240.68:8004';

// ============ 主逻辑 ============
const log = (msg) => console.log(`[联通替换] ${msg}`);

log("=".repeat(60));
log("🔔 拦截到联通响应，准备替换");
log("=".repeat(60));

// 从Cookie中提取c_mobile（用于调试）
const cookies = $request.headers['Cookie'] || '';
const c_mobile_match = cookies.match(/c_mobile=([^;]+)/);
const c_mobile = c_mobile_match ? c_mobile_match[1] : '(未找到)';

log(`📱 Cookie中的手机号: ${c_mobile}`);
log(`💡 后端将根据手机号自动匹配账户`);

// 构建后端API地址（用于获取修改后的响应）
const backendUrl = `${SERVER_URL}/npfwap/NpfMobAppQuery/feeSearch/queryOrderNew`;

log(`📡 请求后端: ${backendUrl}`);

// 从后端获取修改后的响应
$task.fetch({
    url: backendUrl,
    method: 'GET',
    headers: {
        'Cookie': $request.headers['Cookie'] || '',
        'User-Agent': 'QuantumultX'
    }
}).then(response => {
    if (response.statusCode === 200) {
        const body = response.body;
        
        try {
            const data = JSON.parse(body);
            
            if (data.RETURN_CODE === '0000') {
                log(`✅ 成功获取后端修改后的数据`);
                
                // 显示统计信息
                if (data.payfee && data.payfee.length > 0) {
                    log(`📊 账单记录数: ${data.payfee.length}`);
                } else if (data.feeDetails && data.feeDetails.length > 0) {
                    log(`📊 账单记录数: ${data.feeDetails.length}`);
                }
                
                log(`🔄 替换原始响应为修改后的数据`);
                log("=".repeat(60));
                
                // 替换响应body
                $done({ body: body });
                
            } else if (data.RETURN_CODE === '9999') {
                log(`⚠️ 后端返回错误: ${data.RETURN_DESC}`);
                log(`💡 提示: 请在管理界面选择账户并保存修改后的响应`);
                log(`📄 返回后端的错误信息给APP`);
                
                // 返回后端的错误信息
                $done({ body: body });
                
            } else {
                log(`⚠️ 未知返回码: ${data.RETURN_CODE}`);
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
    log(`   1. 后端是否启动: python liantong_manual_backend_v2.py`);
    log(`   2. IP地址是否正确: ${SERVER_URL}`);
    log(`   3. 手机和电脑是否在同一网络`);
    log(`📄 返回原始响应（不影响正常使用）`);
    
    // 连接失败，返回原始响应
    $done({});
});

