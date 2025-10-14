/*
 *
 *
脚本功能：中国移动账单拦截修改 - 支持按时间区间过滤账单
软件版本：圈X
下载地址：苹果商店下载
脚本作者：
更新时间：2025-10-14
电报频道：
问题反馈：
使用声明：⚠️此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！⚠️⚠️⚠️
*******************************
[rewrite_local]

# > 中国移动账单拦截，支持按时间区间过滤账单
^https?:\/\/touch\.10086\.cn\/i\/v1\/cust\/orderlistqryv3.* url script-response-body https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/yidong.js

[mitm] 
hostname = touch.10086.cn
*
*


*
*
*/

/**
 * @require https://cdn.bootcdn.net/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
 */

// ============ 配置区域 ============
const CONFIG = {
    // 设置要过滤的时间区间（格式：YYYYMMDDHHmmss）
    startTime: "20251014000000",  // 开始时间
    endTime: "20251014235959",    // 结束时间
    
    // 过滤模式：
    // "delete" - 删除时间区间内的账单
    // "keep" - 只保留时间区间内的账单
    filterMode: "delete",
    
    // 是否启用日志
    enableLog: true
};

// AES 密钥和IV（从decode_test.py中获取）
const KEY_WORDS = [808727361, 1330726731, 913927019, 1819892289];
const IV_WORDS = [808727361, 1330726731, 913927019, 1819892289];

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[账单拦截] ${message}`);
    }
}

// 将CryptoJS的WordArray转换为字节数组
function wordsToBytes(words, sigBytes) {
    let bytes = [];
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        bytes.push((word >>> 24) & 0xFF);
        bytes.push((word >>> 16) & 0xFF);
        bytes.push((word >>> 8) & 0xFF);
        bytes.push(word & 0xFF);
    }
    return bytes.slice(0, sigBytes);
}

// Base64解码
function base64Decode(str) {
    return CryptoJS.enc.Base64.parse(str);
}

// Base64编码
function base64Encode(wordArray) {
    return CryptoJS.enc.Base64.stringify(wordArray);
}

// AES解密函数
function aesDecrypt(encryptedData) {
    try {
        // 第一次Base64解码
        let decodedOnce = base64Decode(encryptedData);
        let decodedOnceStr = CryptoJS.enc.Utf8.stringify(decodedOnce);
        
        // 第二次Base64解码得到密文
        let ciphertext = base64Decode(decodedOnceStr);
        
        // 构建密钥和IV
        let keyBytes = wordsToBytes(KEY_WORDS, 16);
        let ivBytes = wordsToBytes(IV_WORDS, 16);
        
        let key = CryptoJS.lib.WordArray.create(keyBytes);
        let iv = CryptoJS.lib.WordArray.create(ivBytes);
        
        // 解密
        let decrypted = CryptoJS.AES.decrypt(
            { ciphertext: ciphertext },
            key,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        
        return CryptoJS.enc.Utf8.stringify(decrypted);
    } catch (e) {
        log(`解密失败: ${e.message}`);
        return null;
    }
}

// AES加密函数
function aesEncrypt(plaintext) {
    try {
        // 构建密钥和IV
        let keyBytes = wordsToBytes(KEY_WORDS, 16);
        let ivBytes = wordsToBytes(IV_WORDS, 16);
        
        let key = CryptoJS.lib.WordArray.create(keyBytes);
        let iv = CryptoJS.lib.WordArray.create(ivBytes);
        
        // 加密
        let encrypted = CryptoJS.AES.encrypt(
            plaintext,
            key,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        
        // 获取密文的Base64
        let ciphertextBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
        
        // 第二次Base64编码
        let secondEncode = CryptoJS.enc.Utf8.parse(ciphertextBase64);
        let finalResult = CryptoJS.enc.Base64.stringify(secondEncode);
        
        return finalResult;
    } catch (e) {
        log(`加密失败: ${e.message}`);
        return null;
    }
}

// 时间比较函数
function isInTimeRange(createTime, startTime, endTime) {
    return createTime >= startTime && createTime <= endTime;
}

// 过滤账单数据
function filterOrderInfo(orderInfo) {
    if (!orderInfo || !Array.isArray(orderInfo)) {
        return orderInfo;
    }
    
    let filteredOrders = orderInfo.filter(order => {
        let createTime = order.createTime || "";
        let inRange = isInTimeRange(createTime, CONFIG.startTime, CONFIG.endTime);
        
        if (CONFIG.filterMode === "delete") {
            // 删除模式：保留不在时间区间内的
            return !inRange;
        } else {
            // 保留模式：只保留在时间区间内的
            return inRange;
        }
    });
    
    log(`原始账单数量: ${orderInfo.length}, 过滤后: ${filteredOrders.length}`);
    
    return filteredOrders;
}

// ============ 主函数 ============

function modifyResponse(response) {
    try {
        log("开始处理响应...");
        
        // 解析响应
        let body = JSON.parse(response.body);
        
        // 检查响应结构
        if (!body.data || !body.data.outParam) {
            log("响应数据结构不正确");
            return response;
        }
        
        // 获取加密的数据
        let encryptedData = body.data.outParam;
        log(`加密数据: ${encryptedData.substring(0, 50)}...`);
        
        // 解密
        let decryptedStr = aesDecrypt(encryptedData);
        if (!decryptedStr) {
            log("解密失败，返回原始响应");
            return response;
        }
        
        log("解密成功");
        
        // 解析解密后的JSON
        let decryptedData = JSON.parse(decryptedStr);
        
        // 过滤账单
        if (decryptedData.orderInfo) {
            let originalCount = decryptedData.orderInfo.length;
            decryptedData.orderInfo = filterOrderInfo(decryptedData.orderInfo);
            let filteredCount = decryptedData.orderInfo.length;
            
            // 更新总数
            decryptedData.totalCount = filteredCount.toString();
            
            log(`账单过滤完成: ${originalCount} -> ${filteredCount}`);
            log(`时间区间: ${CONFIG.startTime} - ${CONFIG.endTime}`);
            log(`过滤模式: ${CONFIG.filterMode}`);
        }
        
        // 重新加密
        let modifiedJson = JSON.stringify(decryptedData);
        let reencrypted = aesEncrypt(modifiedJson);
        
        if (!reencrypted) {
            log("重新加密失败，返回原始响应");
            return response;
        }
        
        log("重新加密成功");
        
        // 替换响应数据
        body.data.outParam = reencrypted;
        response.body = JSON.stringify(body);
        
        log("响应修改完成");
        
    } catch (e) {
        log(`处理出错: ${e.message}`);
        log(`错误堆栈: ${e.stack}`);
    }
    
    return response;
}

// ============ 圈X入口 ============

// 检测是否是目标请求
if ($request.url.indexOf("orderlistqryv3") !== -1) {
    log("检测到账单查询请求");
    
    // 获取响应
    let response = $response;
    
    // 修改响应
    response = modifyResponse(response);
    
    // 返回修改后的响应
    $done(response);
} else {
    $done({});
}
