# Cookie 注入修复测试指南

## 修复内容

已修复 Cookie 注入时新旧 Cookie 混合导致登录状态失效的问题。

### 主要改进

1. **CDP 注入方式**：在注入新 Cookie 前，先删除目标域名下的所有旧 Cookie
2. **数据库写入方式**：批量删除整个域名的旧 Cookie，而不是逐个匹配删除

## 测试场景

### 场景 1：基本 Cookie 导入和注入

**步骤：**
1. 启动应用：`npm run dev`
2. 创建端口 9222 的自建浏览器窗口
3. 访问 https://www.swdtbook.com/index.php/index/user/login
4. 输入账号密码登录
5. 确认登录成功，能看到个人信息
6. 关闭浏览器窗口

**预期结果：**
- 浏览器正常启动
- 登录成功
- 个人信息显示正常

### 场景 2：离线导入 Cookie

**步骤：**
1. 在应用中点击"离线导入 Cookie"
2. 点击"开始扫描来源"
3. 选中端口 9222 的来源
4. 点击"加载 Cookie"
5. 选中 swdtbook.com 域名
6. 点击"导入"

**预期结果：**
- 成功扫描到端口 9222
- 成功加载 Cookie（应该有 2-4 条）
- 导入成功，创建浏览器卡片

### 场景 3：使用卡片打开浏览器

**步骤：**
1. 在浏览器卡片列表中找到 swdtbook.com 卡片
2. 点击"打开"按钮
3. 等待浏览器启动
4. 检查登录状态

**预期结果：**
- 浏览器成功启动
- 自动跳转到 swdtbook.com
- **登录状态有效**，能看到个人信息

### 场景 4：注入到指纹浏览器（关键测试）

**前提：**
- 已安装并配置指纹浏览器（如比特浏览器）
- 指纹浏览器 API 可访问

**步骤：**
1. 在 swdtbook.com 卡片上点击"注入"按钮
2. 选择目标指纹浏览器
3. 点击"开始转移"
4. 等待注入完成
5. 在指纹浏览器中访问 swdtbook.com
6. 检查登录状态

**预期结果：**
- 注入成功提示
- 指纹浏览器中**登录状态有效**
- 能正常访问个人信息
- **不会出现登录后立即失效的问题**

### 场景 5：更新最新 Cookie（关键测试）

**步骤：**
1. 确保端口 9222 的浏览器正在运行
2. 在浏览器中访问 swdtbook.com（保持登录状态）
3. 在应用中找到 swdtbook.com 卡片
4. 点击右上角的"更新最新 Cookie"按钮
5. 等待更新完成
6. 检查 Cookie 数量

**预期结果：**
- 更新成功提示
- **Cookie 数量保持合理**（不会从 2 个变成 4 个）
- Cookie 内容是最新的

### 场景 6：登录状态持久性测试（关键测试）

**步骤：**
1. 使用卡片打开端口 9222 浏览器
2. 确认登录状态有效
3. 在浏览器中点击"退出登录"
4. 重新输入正确的账号密码
5. 点击登录
6. 检查登录状态
7. 点击"个人信息"或其他需要登录的页面

**预期结果：**
- 登录成功提示
- **登录状态持续有效**
- 点击个人信息时**不会再次要求登录**
- **不需要删除卡片和用户数据目录**

### 场景 7：多次注入测试

**步骤：**
1. 使用卡片注入到指纹浏览器 A
2. 验证登录状态
3. 再次使用同一卡片注入到指纹浏览器 B
4. 验证登录状态
5. 回到指纹浏览器 A，刷新页面
6. 验证登录状态

**预期结果：**
- 两次注入都成功
- 两个浏览器的登录状态都有效
- **不会因为多次注入导致 Cookie 混乱**

## 问题排查

### 如果注入后登录状态仍然失效

1. **检查浏览器是否关闭**
   - 数据库写入方式需要目标浏览器关闭
   - CDP 注入方式需要浏览器运行

2. **检查 Cookie 域名**
   - 确认 Cookie 的 domain 字段正确
   - 检查是否包含 `.swdtbook.com` 和 `swdtbook.com` 两种形式

3. **查看控制台日志**
   - 检查是否有 CDP 连接错误
   - 查看 Cookie 删除和注入的日志

4. **验证 Cookie 内容**
   - 使用浏览器开发者工具查看 Cookie
   - 确认没有重复的 Cookie
   - 检查 Cookie 的过期时间

### 如果 Cookie 数量异常

1. **检查域名变体**
   - 确认代码正确处理了 `.example.com` 和 `example.com`
   - 查看数据库中的 `host_key` 字段

2. **查看删除日志**
   - 确认删除操作执行成功
   - 检查 SQL 语句是否正确

## 技术细节

### CDP 删除逻辑

```javascript
// 收集所有域名
$domains=New-Object System.Collections.Generic.HashSet[string]
foreach($cookie in $cookies){
  if($cookie.domain){ [void]$domains.Add([string]$cookie.domain) }
}

// 删除每个域名下的所有 Cookie
foreach($domain in $domains){
  $getAllResp=Send-Cdp 'Network.getAllCookies' @{}
  foreach($existingCookie in $getAllResp.result.cookies){
    if(域名匹配){
      Send-Cdp 'Network.deleteCookies' $deleteParams
    }
  }
}
```

### 数据库删除逻辑

```javascript
// 收集域名变体
const domainsToClean = new Set();
for (const cookie of normalized) {
  domainsToClean.add(cookie.domain);
  domainsToClean.add(cookie.domain.replace(/^\.+/, ''));
  domainsToClean.add(`.${cookie.domain.replace(/^\.+/, '')}`);
}

// 批量删除
for (const domain of domainsToClean) {
  DELETE FROM cookies WHERE host_key='${domain}';
}
```

## 回归测试

确保修复没有影响其他功能：

- [ ] 系统 Chrome Profile 导入
- [ ] 比特浏览器 Cookie 导入
- [ ] 手动新增文本记录
- [ ] 图片收藏功能
- [ ] 资源库导入
- [ ] 悬浮窗功能
- [ ] 托盘菜单

## 性能影响

- **CDP 方式**：增加了一次 `getAllCookies` 调用和多次 `deleteCookies` 调用，预计增加 100-500ms
- **数据库方式**：批量删除比逐个删除更快，预计减少 50-200ms

## 相关 Issue

- 登录状态无法保存
- Cookie 数量异常增加
- 注入后立即失效

## 修改文件

- `src/main/browser-node-service.js` - 主要修改
- `COOKIE_FIX_NOTES.md` - 修复说明
- `TEST_COOKIE_FIX.md` - 本测试指南
