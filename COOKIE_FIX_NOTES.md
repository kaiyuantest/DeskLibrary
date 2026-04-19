# Cookie 注入问题修复说明

## 问题描述

在使用自建浏览器（端口 9222）进行 Cookie 导入和注入时，出现以下问题：

1. 登录 https://www.swdtbook.com 后，导出 Cookie 到卡片
2. 使用卡片打开浏览器，登录状态有效
3. 点击"注入"按钮转移到指纹浏览器失败
4. 点击"更新最新 Cookie"后，Cookie 数量从 2 个变成 4 个
5. 退出账号后重新登录，提示成功但立即又要求重新登录
6. 登录状态无法保存，必须删除卡片和用户数据目录才能恢复

## 根本原因

### 1. Cookie 注入时未清理旧 Cookie
- CDP 注入方式：只调用 `Network.setCookie` 添加新 Cookie，没有先删除旧 Cookie
- 数据库写入方式：虽然有删除语句，但只删除完全匹配的 Cookie（domain + name + path），没有清理整个域名下的所有旧 Cookie

### 2. 新旧 Cookie 混合导致冲突
- 当注入 Cookie 后，旧的 session Cookie 仍然存在
- 用户登录时，网站设置新的 session Cookie
- 新旧 Cookie 同时存在，导致：
  - Session ID 冲突
  - 过期的认证 Cookie 覆盖新的有效 Cookie
  - Cookie 数量异常增加（2 个变 4 个）

### 3. 登录状态丢失
- 浏览器可能使用了错误的 Cookie 组合
- 服务器收到混合的新旧 Cookie，无法正确识别会话
- 导致登录成功后立即失效

## 修复方案

### 修改 1：CDP 注入前清理旧 Cookie

在 `src/main/browser-node-service.js` 的 `runCdpScript` 函数中，添加清理逻辑：

```javascript
// 在注入新 Cookie 之前，先收集所有要注入的域名
$domains=New-Object System.Collections.Generic.HashSet[string]
foreach($cookie in $cookies){
  if($cookie.domain){ [void]$domains.Add([string]$cookie.domain) }
}

// 对每个域名，删除所有现有的 Cookie
foreach($domain in $domains){
  $getAllResp=Send-Cdp 'Network.getAllCookies' @{}
  if($getAllResp.result -and $getAllResp.result.cookies){
    foreach($existingCookie in $getAllResp.result.cookies){
      $existingDomain=[string]$existingCookie.domain
      // 匹配域名（包括带点和不带点的变体）
      if($existingDomain -eq $domain -or ...){
        // 删除该 Cookie
        [void](Send-Cdp 'Network.deleteCookies' $deleteParams)
      }
    }
  }
}
```

### 修改 2：数据库写入前批量清理域名

在 `dbWriteCookies` 函数中，改进删除逻辑：

```javascript
// 收集所有需要清理的域名（包括变体）
const domainsToClean = new Set();
for (const cookie of normalized) {
  domainsToClean.add(cookie.domain);
  const trimmed = cookie.domain.replace(/^\.+/, '');
  if (trimmed) {
    domainsToClean.add(trimmed);
    domainsToClean.add(`.${trimmed}`);
  }
}

// 批量删除这些域名下的所有旧 Cookie
for (const domain of domainsToClean) {
  statements.push(`DELETE FROM cookies WHERE host_key='${escapeSqlText(domain)}';`);
}

// 然后插入新 Cookie（不再需要逐个删除）
```

## 修复效果

1. **注入前清理**：确保目标浏览器中不存在该域名的旧 Cookie
2. **避免冲突**：新 Cookie 不会与旧 Cookie 混合
3. **登录状态稳定**：用户登录后，只有新的有效 Cookie 存在
4. **Cookie 数量正确**：不会出现数量异常增加的情况

## 测试步骤

1. 创建端口 9222 的自建浏览器
2. 登录 https://www.swdtbook.com
3. 关闭浏览器，离线导入 Cookie
4. 使用卡片打开浏览器，确认登录有效
5. 点击"注入"按钮转移到指纹浏览器
6. 验证登录状态是否保持
7. 点击"更新最新 Cookie"
8. 验证 Cookie 数量是否正确
9. 退出账号后重新登录
10. 验证登录状态是否能正常保存

## 注意事项

1. **域名匹配**：需要同时处理带点（`.example.com`）和不带点（`example.com`）的域名变体
2. **性能影响**：批量删除可能比逐个删除稍慢，但能确保清理彻底
3. **数据安全**：删除操作在临时数据库副本上进行，失败时不会影响原数据库
4. **CDP 连接**：确保浏览器的 DevTools 端口可访问

## 相关文件

- `src/main/browser-node-service.js` - 主要修改文件
- `src/main/index.js` - IPC 处理逻辑
- `src/main/python_cookie_bridge.py` - Python 桥接（未修改）
