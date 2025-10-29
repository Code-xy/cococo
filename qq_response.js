// 文件名：qq_response.js
// 类型：script-response-body

const log = (msg) => console.log(`[QQ-Response] ${msg}`);

// 读取存储的openid
const openid = $persistentStore.read("qq_current_openid");
log(`读取到OpenID: ${openid || '(未找到)'}`);

const SERVER_URL = 'http://192.168.240.68:8005';

// 请求后端
$task.fetch({
    url: `${SERVER_URL}/v1/r/1450000186/trade_record_query`,
    method: 'POST',
    body: `openid=${openid}`  // 简化body，只传openid
}).then(response => {
    if (response.statusCode === 200) {
        log(`✅ 后端返回成功`);
        // 替换响应
        $done({ body: response.body });
    } else {
        log(`❌ 后端失败，返回原响应`);
        $done({});
    }
}).catch(error => {
    log(`❌ 请求失败: ${error}`);
    $done({});
});
