# Cookie 注入问题修复 V2 - 精确删除方案

## ❌ V1 方案的问题

### 错误的逻辑

V1 方案采用了**批量删除整个域名**的策略：

```javascript
// V1 的错误做法
for (const domain of domainsToClean) {
  DELETE FROM cookies WHERE host_key='${domain}';  // 删除整个域名的所有 Cookie
}
```

### 导致的问题

1. **过度删除**：删除了该域名下的所有 Cookie，包括：
   - ❌ 网站的 session Cookie
   - ❌ CSRF token
   - ❌ 用户偏好设置
   - ❌ 功能性 Cookie
   - ❌ 其他重要的 Cookie

2. **无法登录**：
   - 注入后，网站失去了所有必要的 Cookie
   - 用户登录时，网站无法维持会话
   - 登录成功后立即失效
   - 无法重新登录

3. **破坏性操作**：
   - 一旦注入，原有的登录状态完全丢失
   - 必须删除用户数据目录才能恢复

## ✅ V2 方案 - 精确删除

### 正确的逻辑

**只删除我们要注入的那些具体的 Cookie**，而不是整个域名的所有 Cookie。

### 实现方式

#### 1. 数据库写入方式

```javascript
// V2 的正确做法：精确匹配 domain + name + path
for (const cookie of normalized) {
  // 处理域名变体（.example.com 和 example.com）
  const domainVariants = [cookie.domain];
  const trimmed = cookie.domain.replace(/^\.+/, '');
  if (trimmed && trimmed !== cookie.domain) {
    domainVariants.push(trimmed);
    domainVariants.push(`.${trimmed}`);
  }
  
  // 只删除完全匹配的 Cookie
  for (const domainVariant of domainVariants) {
    DELETE FROM cookies 
    WHERE host_key='${domainVariant}' 
      AND name='${cookie.name}' 
      AND path='${cookie.path}';
  }
  
  // 然后插入新 Cookie
  INSERT INTO cookies (...) VALUES (...);
}
```

**关键点**：
- ✅ 只删除 `domain + name + path` 完全匹配的 Cookie
- ✅ 保留其他所有 Cookie
- ✅ 处理域名变体（带点和不带点）

#### 2. CDP 注入方式

```javascript
// 1. 先获取所有现有 Cookie
$getAllResp=Send-Cdp 'Network.getAllCookies' @{}
$existingCookies=@($getAllResp.result.cookies)

// 2. 对每个要注入的 Cookie，精确删除旧版本
foreach($cookie in $cookies){
  $targetDomain=[string]$cookie.domain
  $targetName=[string]$cookie.name
  $targetPath=[string]$cookie.path
  
  foreach($existing in $existingCookies){
    // 检查 domain + name + path 是否匹配
    if(域名匹配 && 名称匹配 && 路径匹配){
      // 只删除这一个 Cookie
      Send-Cdp 'Network.deleteCookies' @{
        name=$existingName
        domain=$existingDomain
        path=$existingPath
      }
    }
  }
}

// 3. 然后注入新 Cookie
foreach($cookie in $cookies){
  Send-Cdp 'Network.setCookie' $cookie
}
```

**关键点**：
- ✅ 只删除要替换的那个具体 Cookie
- ✅ 保留所有其他 Cookie
- ✅ 一次性获取所有 Cookie，避免重复调用

## 🎯 修复效果

### 场景对比

#### 场景：用户已登录，然后注入 Cookie

**V1 方案（错误）**：
1. 用户登录 → 网站设置 Cookie A、B、C、D
2. 注入 Cookie E、F → **删除整个域名的所有 Cookie**
3. 结果：A、B、C、D 全部丢失，只剩 E、F
4. 用户无法维持登录状态 ❌

**V2 方案（正确）**：
1. 用户登录 → 网站设置 Cookie A、B、C、D
2. 注入 Cookie E、F → **只删除旧的 E、F（如果存在）**
3. 结果：A、B、C、D 保留，E、F 更新
4. 用户登录状态正常 ✅

#### 场景：导入 Cookie 后打开浏览器

**V1 方案（错误）**：
1. 导入 Cookie A、B
2. 打开浏览器 → 注入 A、B → **删除整个域名的所有 Cookie**
3. 结果：只有 A、B，其他 Cookie 全部丢失
4. 登录状态可能无效（如果 A、B 不完整）❌

**V2 方案（正确）**：
1. 导入 Cookie A、B
2. 打开浏览器 → 注入 A、B → **只删除旧的 A、B**
3. 结果：A、B 更新，其他 Cookie 保留
4. 登录状态正常 ✅

## 📊 技术对比

| 特性 | V1 方案（批量删除） | V2 方案（精确删除） |
|------|-------------------|-------------------|
| 删除范围 | 整个域名的所有 Cookie | 只删除要替换的 Cookie |
| 保留其他 Cookie | ❌ 全部删除 | ✅ 全部保留 |
| 登录状态 | ❌ 丢失 | ✅ 保持 |
| 功能性 Cookie | ❌ 丢失 | ✅ 保持 |
| 用户偏好 | ❌ 丢失 | ✅ 保持 |
| 破坏性 | ⚠️ 高 | ✅ 低 |
| 可恢复性 | ❌ 需删除数据 | ✅ 无需删除 |

## 🔍 为什么 V1 方案是错误的

### 误解 1：新旧 Cookie 混合

**错误理解**：
- 认为问题是新旧 Cookie 混合导致冲突
- 所以要删除整个域名的所有旧 Cookie

**实际情况**：
- 问题不是新旧混合，而是**同名 Cookie 的版本冲突**
- 只需要删除同名的旧版本，不需要删除其他 Cookie

### 误解 2：Cookie 数量增加

**错误理解**：
- Cookie 从 2 个变 4 个是因为新旧混合
- 所以要全部删除再重新注入

**实际情况**：
- Cookie 数量增加是正常的（用户登录后网站会设置新 Cookie）
- 只需要更新我们导入的那些 Cookie，不需要删除网站自己设置的 Cookie

### 误解 3：登录状态失效

**错误理解**：
- 登录状态失效是因为旧 Cookie 干扰
- 所以要删除所有旧 Cookie

**实际情况**：
- 登录状态失效是因为**我们删除了网站的 session Cookie**
- 应该保留网站的 Cookie，只更新我们导入的 Cookie

## ✅ V2 方案的优势

### 1. 精确控制

- 只影响我们要注入的 Cookie
- 不影响其他任何 Cookie
- 最小化副作用

### 2. 保持状态

- 用户的登录状态保持不变
- 网站的功能性 Cookie 保持不变
- 用户的偏好设置保持不变

### 3. 可重复操作

- 可以多次注入而不破坏状态
- 可以更新 Cookie 而不影响其他功能
- 可以在已登录的浏览器中注入

### 4. 符合预期

- 用户期望：注入 Cookie 后登录状态应该保持
- 实际效果：登录状态确实保持
- 行为一致

## 🧪 测试验证

### 测试场景 1：已登录状态下注入

**步骤**：
1. 打开 9222 端口浏览器
2. 登录 swdtbook.com
3. 导入 Cookie 到卡片
4. 使用卡片注入到同一浏览器

**预期结果**：
- ✅ 登录状态保持
- ✅ 可以正常访问个人信息
- ✅ Cookie 数量合理增加（不是替换）

### 测试场景 2：未登录状态下注入

**步骤**：
1. 打开 9222 端口浏览器（未登录）
2. 使用卡片注入 Cookie

**预期结果**：
- ✅ 注入的 Cookie 生效
- ✅ 登录状态有效
- ✅ 可以正常访问

### 测试场景 3：多次注入

**步骤**：
1. 第一次注入 Cookie
2. 用户登录
3. 第二次注入 Cookie

**预期结果**：
- ✅ 第一次注入成功
- ✅ 用户登录成功
- ✅ 第二次注入不影响登录状态

## 📝 代码修改总结

### 修改文件

`src/main/browser-node-service.js`

### 修改内容

#### 1. `dbWriteCookies` 函数

**修改前（V1）**：
```javascript
// 批量删除整个域名
for (const domain of domainsToClean) {
  DELETE FROM cookies WHERE host_key='${domain}';
}
```

**修改后（V2）**：
```javascript
// 精确删除每个 Cookie（包括域名变体）
for (const domainVariant of domainVariants) {
  DELETE FROM cookies 
  WHERE host_key='${domainVariant}' 
    AND name='${cookie.name}' 
    AND path='${cookie.path}';
}
```

#### 2. `runCdpScript` 函数

**修改前（V1）**：
```javascript
// 按域名批量删除
foreach($domain in $domains){
  获取所有 Cookie
  删除该域名的所有 Cookie
}
```

**修改后（V2）**：
```javascript
// 一次性获取所有 Cookie
$existingCookies = 获取所有 Cookie

// 精确删除每个要注入的 Cookie
foreach($cookie in $cookies){
  foreach($existing in $existingCookies){
    if(domain + name + path 匹配){
      删除这一个 Cookie
    }
  }
}
```

## 🎯 总结

### V1 方案的问题

- ❌ 过度删除，破坏了网站的其他 Cookie
- ❌ 导致登录状态丢失
- ❌ 无法在已登录的浏览器中注入
- ❌ 破坏性太强，不可恢复

### V2 方案的优势

- ✅ 精确删除，只影响要注入的 Cookie
- ✅ 保持登录状态和其他功能
- ✅ 可以在任何状态下注入
- ✅ 最小化副作用，可重复操作

### 关键教训

**问题的本质不是新旧 Cookie 混合，而是如何正确地替换 Cookie**

- 不要删除整个域名的 Cookie
- 只删除要替换的那个具体的 Cookie
- 保留所有其他 Cookie

这才是正确的 Cookie 注入逻辑！
