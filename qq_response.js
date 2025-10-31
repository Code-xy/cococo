// ============ QQ响应处理脚本 ============
// 类型：script-response-body
// 功能：读取openid，请求后端，替换响应

const log = (msg) => console.log(`[QQ-Response] ${msg}`);

log("=".repeat(50));
log("📤 拦截到响应，准备替换");

const SERVER_URL = 'http://155.94.157.70:8005';

// 读取保存的请求body和openid
const savedRequestBody = $prefs.valueForKey("qq_request_body");
const savedOpenID = $prefs.valueForKey("qq_current_openid");

log(`📋 读取保存的OpenID: ${savedOpenID || '(未找到)'}`);

if (!savedRequestBody || !savedOpenID) {
    log(`⚠️ 没有保存的请求数据，返回原响应`);
    $done({});
} else {
    log(`📡 请求后端获取修改后的数据...`);
    
    // 请求后端
    $task.fetch({
        url: `${SERVER_URL}/v1/r/1450000186/trade_record_query`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: savedRequestBody  // 转发完整的请求body
    }).then(response => {
        log(`✅ 后端响应: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            const body = response.body;
            
            try {
                const data = JSON.parse(body);
                
                if (data.ret === 0) {
                    log(`🎉 成功！替换为修改后的响应`);
                    
                    // 统计信息
                    if (data.data && data.data.record_list) {
                        log(`📊 账单记录数: ${data.data.record_list.length}`);
                    }
                    
                    log("=".repeat(50));
                    
                    // 替换响应
                    $done({ body: body });
                } else {
                    log(`⚠️ 后端错误: ${data.msg}`);
                    log(`📄 返回原始响应`);
                    $done({});
                }
            } catch (e) {
                log(`❌ JSON解析失败: ${e.message}`);
                log(`📄 返回原始响应`);
                $done({});
            }
        } else {
            log(`❌ 后端请求失败: HTTP ${response.statusCode}`);
            log(`📄 返回原始响应`);
            $done({});
        }
        
    }).catch(error => {
        log(`❌ 请求后端失败: ${error}`);
        log(`💡 请检查后端是否启动`);
        log(`📄 返回原始响应`);
        $done({});
    });
}
