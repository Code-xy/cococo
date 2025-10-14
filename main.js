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


