# CDP 连接调试指南

## 🔴 问题

点击"更新最新 Cookie"时报错：
```
EBUSY: resource busy or locked, copyfile ...
```

**原因**：浏览器正在运行，CDP 读取失败，尝试降级到数据库时文件被锁定。

## ✅ 已修复

现在浏览器运行时不会降级到数据库，而是直接抛出 CDP 错误。

## 🔍 CDP 为什么会失败

### 可能的原因

1. **浏览器没有开启调试端口**
   - 启动时缺少 `--remote-debugging-port=9222` 参数

2. **端口被占用或不可访问**
   - 防火墙阻止
   - 端口被其他程序占用

3. **WebSocket 连接失败**
   - 浏览器版本不兼容
   - CDP 协议问题

## 🧪 测试 CDP 连接

### 方法 1：浏览器测试

1. 确保 9222 浏览器正在运行
2. 打开另一个浏览器
3. 访问：`http://127.0.0.1:9222/json`

**预期结果**：
```json
[
  {
    "description": "",
    "devtoolsFrontendUrl": "/devtools/inspector.html?ws=127.0.0.1:9222/devtools/page/...",
    "id": "...",
    "title": "...",
    "type": "page",
    "url": "https://www.swdtbook.com/...",
    "webSocketDebuggerUrl": "ws://127.0.0.1:9222/devtools/page/..."
  }
]
```

**如果失败**：
- 404 错误 → 调试端口未开启
- 连接超时 → 端口不可访问
- 空数组 → 没有打开的页面

### 方法 2：命令行测试

```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://127.0.0.1:9222/json" -UseBasicParsing

# 或者
curl http://127.0.0.1:9222/json
```

### 方法 3：检查浏览器启动参数

查看浏览器进程的命令行参数：

```powershell
Get-Process chrome | Select-Object -ExpandProperty CommandLine
```

**应该包含**：
```
--remote-debugging-port=9222
--user-data-dir=E:\日常笔记\归档笔记\test\chrome_user_data_port_9222
```

## 🔧 解决方案

### 方案 1：重启浏览器

1. 关闭 9222 端口的浏览器
2. 使用卡片重新打开
3. 确认调试端口已开启

### 方案 2：手动启动浏览器

```bash
# 找到 Chrome 路径
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

# 启动带调试端口的浏览器
& $chromePath `
  --remote-debugging-port=9222 `
  --user-data-dir="E:\日常笔记\归档笔记\test\chrome_user_data_port_9222" `
  --no-first-run `
  --no-default-browser-check `
  "https://www.swdtbook.com"
```

### 方案 3：检查防火墙

1. 打开 Windows 防火墙设置
2. 允许 Chrome 访问本地端口
3. 或者临时关闭防火墙测试

### 方案 4：更换端口

如果 9222 端口有问题，尝试其他端口：

1. 删除旧的用户数据目录
2. 创建新的浏览器，使用端口 9223
3. 重新测试

## 📝 调试步骤

### 步骤 1：确认浏览器运行

```powershell
# 检查端口是否开放
Test-NetConnection -ComputerName 127.0.0.1 -Port 9222
```

**预期结果**：
```
TcpTestSucceeded : True
```

### 步骤 2：测试 HTTP 接口

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:9222/json/version"
```

**预期结果**：
```json
{
  "Browser": "Chrome/...",
  "Protocol-Version": "1.3",
  "User-Agent": "...",
  "V8-Version": "...",
  "WebKit-Version": "...",
  "webSocketDebuggerUrl": "ws://127.0.0.1:9222/devtools/browser/..."
}
```

### 步骤 3：测试 WebSocket 连接

使用浏览器开发者工具：

1. 打开 Chrome DevTools（F12）
2. Console 标签
3. 运行：

```javascript
const ws = new WebSocket('ws://127.0.0.1:9222/devtools/browser');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
```

**预期结果**：
```
Connected!
```

### 步骤 4：查看应用日志

**主进程日志**（启动应用的终端）：
- 查找 "CDP"
- 查找 "readCookiesViaCdp"
- 查找错误信息

**预期看到**：
```
CDP 读取成功
已更新 X 条 Cookie
```

**如果看到错误**：
```
CDP 读取失败: ...
```

记录完整的错误信息。

## 🎯 常见错误和解决方案

### 错误 1：ECONNREFUSED

```
Error: connect ECONNREFUSED 127.0.0.1:9222
```

**原因**：端口未开放

**解决**：
1. 确认浏览器正在运行
2. 确认启动参数包含 `--remote-debugging-port=9222`
3. 重启浏览器

### 错误 2：ETIMEDOUT

```
Error: connect ETIMEDOUT
```

**原因**：连接超时

**解决**：
1. 检查防火墙设置
2. 检查端口是否被占用
3. 尝试其他端口

### 错误 3：WebSocket connection failed

```
Error: WebSocket connection failed
```

**原因**：WebSocket 协议问题

**解决**：
1. 更新 Chrome 到最新版本
2. 检查浏览器兼容性
3. 查看详细错误日志

### 错误 4：未找到可用的 DevTools 页面

```
Error: 未找到可用的 DevTools 页面连接
```

**原因**：浏览器没有打开任何页面

**解决**：
1. 在浏览器中打开任意网页
2. 重试更新 Cookie

## 💡 临时解决方案

如果 CDP 一直失败，可以：

### 方案 A：关闭浏览器后更新

1. 关闭 9222 端口的浏览器
2. 点击"更新最新 Cookie"
3. 从数据库读取（离线模式）

**缺点**：读取的是旧数据，不是最新的

### 方案 B：重新导入

1. 关闭浏览器
2. 删除旧卡片
3. 重新扫描和导入 Cookie

**缺点**：需要手动操作

### 方案 C：使用离线导入

1. 不使用"更新"功能
2. 每次都重新扫描和导入
3. 覆盖旧卡片

**缺点**：流程繁琐

## 📊 检查清单

在报告问题前，请检查：

- [ ] 浏览器正在运行
- [ ] 访问 `http://127.0.0.1:9222/json` 有响应
- [ ] 浏览器启动参数包含 `--remote-debugging-port=9222`
- [ ] 防火墙允许本地连接
- [ ] 端口 9222 未被其他程序占用
- [ ] 浏览器中至少打开了一个页面
- [ ] Chrome 版本较新（建议 90+）

## 🚀 快速测试

```bash
# 1. 启动应用
npm run dev

# 2. 打开 PowerShell，测试 CDP
Invoke-WebRequest -Uri "http://127.0.0.1:9222/json"

# 3. 如果成功，点击"更新最新 Cookie"
# 4. 查看主进程日志
```

如果 PowerShell 测试成功但应用仍然失败，请提供：
1. PowerShell 的完整输出
2. 应用的主进程日志
3. 浏览器的启动参数

这样我们才能定位问题！
