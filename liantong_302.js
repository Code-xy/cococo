// ============ 联通账单拦截脚本 - 重定向版 ============
// 功能：将联通账单请求重定向到本地服务器，返回修改后的响应
// 使用方法：在圈X中配置重写规则

/*
脚本功能：中国联通账单查询重定向到本地服务器
软件版本：圈X
使用说明：
1. 启动后端服务器: python liantong_manual_backend.py
2. 在后台查询账单、编辑JSON、保存
3. 在圈X中添加以下配置：

[rewrite_local]
# 联通账单重定向到本地服务器（保留Cookie和参数）
^https?:\/\/upay\.10010\.com\/npfwap\/NpfMobAppQuery\/feeSearch\/queryOrderNew.* url script-request-header https://raw.githubusercontent.com/Code-xy/cococo/refs/heads/main/liantong_302.js

[mitm] 
hostname = upay.10010.com

注意：
- 修改下面的 SERVER_URL 为你的电脑IP
*/

// ============ 配置区域 ============
const SERVER_URL = 'http://192.168.240.68:8004';
// 如果手机和电脑不在同一设备，改为：
// const SERVER_URL = 'http://192.168.1.100:8004';

// ============ 主逻辑 ============
const log = (msg) => console.log(`[联通重定向] ${msg}`);

log("========== 开始重定向 ==========");
log(`原始URL: ${$request.url}`);

// 解析URL，保留参数
const originalUrl = new URL($request.url);
const params = originalUrl.search; // 包含 ?

// 构建新的URL
const newUrl = `${SERVER_URL}/npfwap/NpfMobAppQuery/feeSearch/queryOrderNew${params}`;

log(`新URL: ${newUrl}`);
log(`保留Cookie: ${$request.headers['Cookie'] ? '是' : '否'}`);

// 修改请求URL
$done({ url: newUrl });

