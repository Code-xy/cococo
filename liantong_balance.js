// ============ 联通余额拦截脚本 ============
// 功能：拦截联通余额查询API，替换为后端修改后的响应
// 类型：script-response-body



// ============ 配置区域 ============
const SERVER_URL = 'http://155.94.157.70:8005';

// ============ 主逻辑 ============
const log = (msg) => console.log(`[联通余额] ${msg}`);

log("=".repeat(60));
log("💰 拦截到联通余额查询响应，准备替换");
log("=".repeat(60));

// 从Cookie中提取c_mobile（用于调试）
const cookies = $request.headers['Cookie'] || '';
const c_mobile_match = cookies.match(/c_mobile=([^;]+)/);
const c_mobile = c_mobile_match ? c_mobile_match[1] : '(未找到)';

log(`📱 Cookie中的手机号: ${c_mobile}`);
log(`💡 后端将根据手机号自动匹配账户`);

// 构建后端API地址（用于获取修改后的响应）
const backendUrl = `${SERVER_URL}/mobileserviceimportant/home/queryUserInfoSeven`;

log(`📡 请求后端: ${backendUrl}`);

// 从后端获取修改后的响应
$task.fetch({
    url: backendUrl,
    method: 'GET',
    headers: {
        'Cookie': $request.headers['Cookie'] || '',
        'User-Agent': $request.headers['User-Agent'] || 'QuantumultX'
    }
}).then(response => {
    if (response.statusCode === 200) {
        const body = response.body;
        
        try {
            const data = JSON.parse(body);
            
            if (data.code === 'Y' || data.code === '0000') {
                log(`✅ 成功获取后端修改后的余额数据`);
                
                // 显示余额信息
                if (data.data && data.data.dataList) {
                    const dataList = data.data.dataList;
                    log(`📊 余额项目数: ${dataList.length}`);
                    dataList.forEach((item, index) => {
                        if (item.type === 'fee') {
                            log(`💰 话费: ${item.number} ${item.unit}`);
                        } else if (item.type === 'flow') {
                            log(`📶 流量: ${item.number} ${item.unit}`);
                        } else if (item.type === 'voice') {
                            log(`📞 语音: ${item.number} ${item.unit}`);
                        }
                    });
                }
                
                log(`🔄 替换原始响应为修改后的数据`);
                log("=".repeat(60));
                
                // 替换响应body
                $done({ body: body });
                
            } else if (data.code === '9999') {
                log(`⚠️ 后端返回错误: ${data.message || data.RETURN_DESC}`);
                log(`💡 提示: 请在管理界面选择账户并保存余额响应`);
                log(`📄 返回后端的错误信息给APP`);
                
                // 返回后端的错误信息
                $done({ body: body });
                
            } else {
                log(`⚠️ 未知返回码: ${data.code}`);
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

