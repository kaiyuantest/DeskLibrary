# 在线更新 Cookie 修复

## 🔴 问题

**"更新最新 Cookie"功能只从数据库读取，不从运行中的浏览器读取！**

### 问题流程

1. 用户打开 9222 端口浏览器
2. 用户重新登录，浏览器中有最新的 Cookie
3. 用户点击"更新最新 Cookie"
4. **代码从数据库读取 Cookie**（数据库中是旧的）
5. 结果：更新失败，仍然是旧 Cookie

### 根本原因

```javascript
// 原来的代码
async function loadSourceCookies(cfg, sourceType, sourceId) {
  if (sourceType === 'self_built') {
    // 总是从数据库读取
    const cookiePath = getCookiePath(sourceId);
    return readCookiesFromDb(cookiePath, sourceId);
  }
}
```

**问题**：
- 浏览器正在运行时，数据库中的 Cookie 是旧的
- 最新的 Cookie 在浏览器的内存中
- 应该通过 CDP 从运行中的浏览器读取

## ✅ 修复方案

### 在线读取 Cookie

**正确逻辑**：
1. 检查浏览器是否正在运行
2. 如果运行 → 使用 CDP 读取（在线）
3. 如果未运行 → 从数据库读取（离线）

```javascript
async function loadSourceCookies(cfg, sourceType, sourceId) {
  if (sourceType === 'self_built') {
    // 1. 从路径中提取端口号
    const port = extractPortFromUserDataDir(sourceId);
    
    // 2. 检查浏览器是否正在运行
    if (port && await isPortOpen(port)) {
      try {
        // 3. 使用 CDP 读取（在线）
        return await readCookiesViaCdp(port);
      } catch (error) {
        // CDP 失败，降级到数据库
        console.warn('CDP 读取失败，降级到数据库读取');
      }
    }
    
    // 4. 浏览器未运行，从数据库读取（离线）
    const cookiePath = getCookiePath(sourceId);
    return readCookiesFromDb(cookiePath, sourceId);
  }
}

function extractPortFromUserDataDir(userDataDir) {
  // 从 chrome_user_data_port_9222 提取 9222
  const match = String(userDataDir).match(/port[_-](\d+)/i);
  return match ? Number(match[1]) : 0;
}
```

## 📊 对比

| 场景 | 原代码 | 修复后 |
|------|--------|--------|
| 浏览器未运行 | 从数据库读取 ✅ | 从数据库读取 ✅ |
| 浏览器正在运行 | 从数据库读取 ❌ | 通过 CDP 读取 ✅ |
| CDP 读取失败 | N/A | 降级到数据库 ✅ |

## 🎯 修复效果

### 修复前

```
用户重新登录 → 浏览器中有新 Cookie
↓
点击"更新最新 Cookie" → 从数据库读取（旧的）
↓
结果：更新失败，仍然是旧 Cookie ❌
```

### 修复后

```
用户重新登录 → 浏览器中有新 Cookie
↓
点击"更新最新 Cookie" → 通过 CDP 读取（新的）
↓
结果：成功更新到最新 Cookie ✅
```

## 🧪 测试场景

### 场景 1：浏览器运行时更新（关键）

**步骤**：
1. 使用卡片打开 9222 浏览器
2. 在浏览器中重新登录
3. **点击卡片右上角"更新"按钮**
4. 查看 Cookie 数量和内容

**预期结果**：
- ✅ 成功读取到最新 Cookie
- ✅ Cookie 数量正确
- ✅ 包含新的 session Cookie

### 场景 2：浏览器未运行时更新

**步骤**：
1. 确保 9222 浏览器已关闭
2. 点击卡片右上角"更新"按钮

**预期结果**：
- ✅ 从数据库读取 Cookie
- ✅ 读取成功（如果数据库有数据）

### 场景 3：CDP 失败降级

**步骤**：
1. 浏览器运行但 CDP 端口不可访问
2. 点击"更新"按钮

**预期结果**：
- ⚠️ CDP 读取失败
- ✅ 自动降级到数据库读取
- ✅ 仍然能读取到 Cookie

## 💡 关键改进

### 1. 在线优先

- 浏览器运行时优先使用 CDP
- 获取最新的内存中的 Cookie
- 不依赖数据库的旧数据

### 2. 降级机制

- CDP 失败时自动降级
- 仍然可以从数据库读取
- 提高容错性

### 3. 端口提取

- 从路径中智能提取端口号
- 支持多种命名格式
- 自动检测浏览器状态

## 🔍 技术细节

### 端口提取逻辑

```javascript
function extractPortFromUserDataDir(userDataDir) {
  // 支持的格式：
  // - chrome_user_data_port_9222
  // - chrome_user_data_port-9222
  // - user_data_PORT_9222
  const match = String(userDataDir).match(/port[_-](\d+)/i);
  return match ? Number(match[1]) : 0;
}
```

### CDP 读取流程

```javascript
1. 获取 DevTools WebSocket URL
2. 连接到浏览器
3. 调用 Network.getAllCookies
4. 返回所有 Cookie
```

### 降级流程

```javascript
try {
  return await readCookiesViaCdp(port);  // 尝试 CDP
} catch (error) {
  console.warn('CDP 失败，降级到数据库');
  return readCookiesFromDb(cookiePath);  // 降级到数据库
}
```

## 📝 代码修改

### 修改文件

`src/main/browser-node-service.js`

### 修改内容

1. **loadSourceCookies 函数**：
   - 添加端口检测
   - 添加 CDP 读取
   - 添加降级机制

2. **extractPortFromUserDataDir 函数**（新增）：
   - 从路径提取端口号
   - 支持多种格式

## 🎯 总结

### 问题的本质

**离线读取 vs 在线读取**
- 原代码只支持离线读取（数据库）
- 应该支持在线读取（CDP）
- 浏览器运行时应该优先在线读取

### 修复的关键

1. ✅ 检测浏览器是否运行
2. ✅ 运行时使用 CDP 读取
3. ✅ 未运行时使用数据库读取
4. ✅ CDP 失败时降级到数据库

### 预期效果

- ✅ 浏览器运行时能读取最新 Cookie
- ✅ 用户重新登录后能更新到新 Cookie
- ✅ 注入时使用的是最新 Cookie
- ✅ 提高成功率

这才是正确的"在线更新"功能！
