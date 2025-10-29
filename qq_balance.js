/**
 * QQ余额查询拦截脚本
 * 功能：拦截QQ余额查询响应，直接返回后端设置的余额
 * 使用：script-response-body
 */

const SERVER_URL = 'http://192.168.240.68:8005';

// ============================================================
// 日志函数
// ============================================================
function log(message) {
    console.log(`[QQ余额] ${message}`);
}

// ============================================================
// 主逻辑
// ============================================================
(async function main() {
    try {
        log("============================================================");
        log("🔔 拦截到QQ余额查询响应，准备替换");
        log("============================================================");

        // 从请求URL中提取openid
        const requestUrl = $request.url || '';
        log(`📍 请求URL: ${requestUrl.substring(0, 100)}...`);

        let openid = null;
        const openidMatch = requestUrl.match(/openid=([^&]+)/);
        if (openidMatch) {
            openid = openidMatch[1];
            log(`✅ 从URL提取到OpenID: ${openid}`);
        } else {
            log(`⚠️ 未从URL中提取到OpenID`);
        }

        // 构建后端请求URL（保留原始URL参数）
        const backendUrl = requestUrl.replace(
            'https://api.unipay.qq.com',
            SERVER_URL
        );
        
        log(`📡 请求后端: ${backendUrl.substring(0, 100)}...`);

        // 请求后端获取修改后的余额
        const response = await new Promise((resolve, reject) => {
            $task.fetch({
                url: backendUrl,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                resolve(response);
            }).catch(error => {
                reject(error);
            });
        });

        log(`✅ 后端响应状态: ${response.statusCode}`);

        if (response.statusCode === 200) {
            try {
                const data = JSON.parse(response.body);
                log(`📋 返回码: ${data.ret}`);

                if (data.ret === 0) {
                    log(`💰 Q币余额: ${data.qb_balance}`);
                    log(`💎 Q点余额: ${data.qd_balance}`);
                    log(`🎉 成功！返回修改后的余额数据`);
                    log("============================================================");
                    $done({ body: response.body });
                    return;
                } else {
                    log(`⚠️ 后端返回错误: ${data.msg || '未知错误'}`);
                }
            } catch (e) {
                log(`❌ 解析后端响应失败: ${e.message}`);
            }
        } else {
            log(`⚠️ 后端返回状态码: ${response.statusCode}`);
        }

        // 如果后端失败，返回原始响应
        log("💡 后端失败，返回原始响应");
        log("============================================================");
        $done({});

    } catch (error) {
        log(`❌ 脚本执行出错: ${error.message || error}`);
        log("============================================================");
        $done({});
    }
})();

