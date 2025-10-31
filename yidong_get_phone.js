/**
 * 移动用户信息拦截脚本
 * 功能：拦截getUserInformation API，提取手机号并存储
 * 使用：script-response-body
 * 
 * 特点：
 * 1. 拦截用户信息API响应
 * 2. 解密提取userNum（手机号）
 * 3. 存储到$prefs供账单脚本使用
 */

const SERVER_URL = 'http://155.94.157.70:8005';
const PHONE_STORAGE_KEY = 'yidong_phone'; // 存储手机号的key

// ============================================================
// 日志函数
// ============================================================
function log(message) {
    console.log(`[移动用户信息] ${message}`);
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
        log("👤 拦截到移动用户信息响应，提取手机号");
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
                log(`✅ 提取到手机号: ${phone}`);
                
                // 存储手机号到$prefs（Quantumult X的持久化存储）
                $prefs.setValueForKey(phone, PHONE_STORAGE_KEY);
                log(`💾 手机号已存储，供账单脚本使用`);
            } else {
                log(`⚠️ 未能提取到手机号`);
            }
        } catch (e) {
            log(`⚠️ 提取手机号失败: ${e.message}`);
        }

        // 返回原始响应（不做修改，只是提取手机号）
        log("✅ 返回原始用户信息响应");
        log("============================================================");
        $done({});

    } catch (error) {
        log(`❌ 脚本执行出错: ${error.message || error}`);
        log("============================================================");
        $done({});
    }
})();
