/**
 * 移动账单拦截脚本
 * 功能：拦截移动API响应，解密提取手机号，替换为后端加密后的响应
 * 使用：script-response-body
 * 
 * 特点：
 * 1. 解密原始响应提取手机号
 * 2. 请求后端时带上手机号参数
 * 3. 后端自动进行AES加密，无需脚本处理加密逻辑
 */

const SERVER_URL = 'http://192.168.240.68:8005';

// ============================================================
// 日志函数
// ============================================================
function log(message) {
    console.log(`[移动替换] ${message}`);
}

// ============================================================
// 通过后端解密接口提取手机号
// ============================================================
async function decryptAndExtractPhone(encryptedBody) {
    try {
        // 请求后端解密接口
        const decryptResponse = await new Promise((resolve, reject) => {
            $task.fetch({
                url: `${SERVER_URL}/api/yidong/decrypt_for_phone`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    encrypted_data: encryptedBody
                })
            }).then(response => {
                resolve(response);
            }).catch(error => {
                reject(error);
            });
        });
        
        if (decryptResponse.statusCode === 200) {
            const result = JSON.parse(decryptResponse.body);
            if (result.code === 0 && result.phone) {
                return result.phone;
            }
        }
        return null;
    } catch (e) {
        log(`⚠️ 后端解密提取手机号失败: ${e.message}`);
        return null;
    }
}

// ============================================================
// 主逻辑
// ============================================================
(async function main() {
    try {
        log("============================================================");
        log("🔔 拦截到移动响应，准备替换");
        log("============================================================");

        // 获取原始响应体（加密的）
        const originalBody = $response.body;
        log(`📦 原始响应长度: ${originalBody ? originalBody.length : 0} 字符`);
        
        if (!originalBody) {
            log("⚠️ 原始响应为空，返回原始响应");
            $done({});
            return;
        }

        // 通过后端解密接口提取手机号
        let phone = null;
        try {
            phone = await decryptAndExtractPhone(originalBody);
            if (phone) {
                log(`✅ 从响应中提取到手机号: ${phone}`);
            } else {
                log(`⚠️ 未能提取到手机号，将使用后端默认匹配策略`);
            }
        } catch (e) {
            log(`⚠️ 提取手机号失败: ${e.message}，将使用后端默认匹配策略`);
        }

        // 构建后端请求URL
        let backendUrl = `${SERVER_URL}/api/yidong/proxy`;
        if (phone) {
            backendUrl += `?phone=${encodeURIComponent(phone)}`;
            log(`📡 请求后端（带手机号）: ${backendUrl}`);
        } else {
            log(`📡 请求后端（无手机号）: ${backendUrl}`);
            log(`💡 后端将使用默认账户匹配策略`);
        }

        // 请求后端获取加密后的响应
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
            log(`📦 响应体长度: ${response.body ? response.body.length : 0} 字符`);
            log(`🔐 响应已由后端AES加密`);
            log(`🎉 成功！返回加密后的移动账单数据`);
            log("============================================================");
            
            // 直接返回后端的加密响应
            $done({ body: response.body });
            return;
        } else {
            log(`⚠️ 后端返回状态码: ${response.statusCode}`);
            log(`⚠️ 错误响应内容: ${response.body}`);
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

