/**
 * 移动缴费查询拦截脚本 (getPayFeesQueryInfo)
 * 功能：拦截移动缴费查询API，返回后端修改后的加密响应
 * 配合 unified_backend.py 使用
 */

const BACKEND_URL = "http://192.168.240.68:8005/api/yidong/payfees_proxy";

// 获取响应对象
let response = typeof $response !== 'undefined' ? $response : {};

console.log("\n" + "=".repeat(60));
console.log("[移动缴费查询] 🔔 拦截到移动缴费查询响应，准备替换");
console.log("=".repeat(60));

try {
    // 直接请求后端获取修改后的加密响应
    console.log(`[移动缴费查询] 📡 请求后端: ${BACKEND_URL}`);
    
    // 发起请求到后端
    const backendResponse = new Promise((resolve, reject) => {
        $httpClient.get(BACKEND_URL, (error, response, data) => {
            if (error) {
                console.log(`[移动缴费查询] ❌ 后端请求失败: ${error}`);
                reject(error);
            } else {
                console.log(`[移动缴费查询] ✅ 后端响应状态: ${response.status}`);
                console.log(`[移动缴费查询] 📦 响应内容类型: ${response.headers['Content-Type'] || 'unknown'}`);
                console.log(`[移动缴费查询] 📦 响应体长度: ${data.length} 字符`);
                console.log(`[移动缴费查询] 📦 响应体前100字符: ${data.substring(0, 100)}`);
                console.log(`[移动缴费查询] 📦 响应体完整内容: ${data}`);
                
                if (response.status === 200) {
                    console.log("[移动缴费查询] 🔐 响应已由后端AES加密");
                    console.log("[移动缴费查询] 🎉 成功！返回加密后的移动缴费查询数据");
                    resolve(data);
                } else {
                    console.log(`[移动缴费查询] ⚠️ 后端返回非200状态: ${response.status}`);
                    reject(`后端返回状态码: ${response.status}`);
                }
            }
        });
    });
    
    // 等待后端响应并替换原始响应
    backendResponse.then(modifiedData => {
        // 替换响应体为后端返回的加密数据
        $done({ body: modifiedData });
    }).catch(error => {
        console.log(`[移动缴费查询] ❌ 处理失败: ${error}`);
        console.log("[移动缴费查询] 🔄 返回原始响应");
        // 失败时返回原始响应
        $done({});
    });
    
} catch (error) {
    console.log(`[移动缴费查询] ❌ 脚本执行异常: ${error}`);
    console.log(`[移动缴费查询] 错误堆栈: ${error.stack}`);
    console.log("[移动缴费查询] 🔄 返回原始响应");
    $done({});
}

console.log("=".repeat(60));

