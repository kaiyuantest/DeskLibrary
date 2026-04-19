# 贡献指南

感谢你对 DeskLibrary 项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请：

1. 在 [Issues](https://github.com/yourusername/DeskLibrary/issues) 中搜索是否已有相关问题
2. 如果没有，创建新的 Issue，包含：
   - 清晰的标题
   - 详细的问题描述
   - 复现步骤
   - 预期行为和实际行为
   - 系统环境（Windows 版本、应用版本等）
   - 截图或错误日志（如果有）

### 提出新功能

如果你有好的想法，请：

1. 在 [Discussions](https://github.com/yourusername/DeskLibrary/discussions) 中讨论
2. 或创建 Feature Request Issue，说明：
   - 功能描述
   - 使用场景
   - 预期效果
   - 可能的实现方案（可选）

### 提交代码

#### 开发流程

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **克隆到本地**
   ```bash
   git clone https://github.com/your-username/DeskLibrary.git
   cd DeskLibrary
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

5. **开发和测试**
   ```bash
   npm run dev
   ```

6. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   # 或
   git commit -m "fix: 修复某个问题"
   ```

7. **推送到你的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **创建 Pull Request**
   - 在 GitHub 上打开你的 Fork
   - 点击 "New Pull Request"
   - 填写 PR 描述
   - 等待审核

#### 提交信息规范

使用语义化的提交信息：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式调整（不影响功能）
- `refactor:` 代码重构
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建或辅助工具的变动

示例：
```
feat: 添加资源库类型筛选功能
fix: 修复剪贴板监听在某些情况下失效的问题
docs: 更新 README 中的安装说明
```

#### 代码规范

- 使用 2 空格缩进
- 使用有意义的变量和函数名
- 添加必要的注释
- 保持代码简洁清晰
- 遵循现有代码风格

#### 测试

在提交 PR 前，请确保：

- [ ] 代码能正常运行
- [ ] 没有引入新的 Bug
- [ ] 功能符合预期
- [ ] 不影响现有功能

### 文档贡献

文档同样重要！你可以：

- 改进 README
- 添加使用教程
- 翻译文档
- 修正错别字

## 开发环境

### 必需工具

- Node.js 16+
- npm 或 yarn
- Git
- Windows 10/11（用于测试）

### 推荐工具

- VS Code
- Git GUI 工具（如 GitHub Desktop）

### 项目结构

```
DeskLibrary/
├── src/
│   ├── main/              # 主进程
│   │   ├── index.js       # 主进程入口
│   │   ├── preload.js     # 预加载脚本
│   │   ├── storage.js     # 数据存储
│   │   └── browser-import.js  # 浏览器导入
│   └── renderer/          # 渲染进程
│       ├── index.html     # 主界面
│       ├── renderer.js    # 主界面逻辑
│       └── styles.css     # 样式
├── package.json
└── README.md
```

## 行为准则

### 我们的承诺

为了营造开放和友好的环境，我们承诺：

- 尊重不同的观点和经验
- 接受建设性的批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性暗示的语言或图像
- 人身攻击或侮辱性评论
- 公开或私下的骚扰
- 未经许可发布他人的私人信息
- 其他不道德或不专业的行为

## 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。

## 问题？

如有任何问题，请：

- 查看 [FAQ](https://github.com/yourusername/DeskLibrary/wiki/FAQ)
- 在 [Discussions](https://github.com/yourusername/DeskLibrary/discussions) 中提问
- 发送邮件到项目维护者

---

再次感谢你的贡献！🎉
