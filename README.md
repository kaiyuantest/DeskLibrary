# DeskLibrary

<div align="center">

**桌面收藏工作台 - 让碎片信息集中管理**

一款基于 Electron 的 Windows 桌面应用，帮助你快速收藏剪贴板内容、管理本地资源、导入浏览器会话。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-31-47848F.svg)](https://www.electronjs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows-0078D6.svg)](https://www.microsoft.com/windows)

</div>

---

## 📸 应用截图

### 每日内容 - 剪贴板收藏
![每日内容](1.png)

### 常用内容 - 高频访问
![常用内容](2.png)

### 资源库 - 文件管理
![资源库](3.png)

### 浏览器卡片 - Cookie 管理
![浏览器卡片](4.png)

### 设置中心 - 个性化配置
![设置中心](5.png)

---

## ✨ 核心功能

### 📋 剪贴板收藏
- **自动监听** - 实时监听剪贴板变化，智能判断是否收藏
- **多种触发方式** - 支持连按两次复制、复制后按修饰键等多种收藏方式
- **累计复制** - 连续复制的片段自动合并为一条记录
- **智能分类** - 自动识别文本、图片、链接等内容类型
- **全文搜索** - 快速搜索历史记录，支持关键词、日期筛选
- **常用标记** - 将重要内容标记为常用，按命中次数排序

### 📦 资源库
- **备份存储** - 导入文件/文件夹并自动备份到指定目录
- **快捷入口** - 保存文件路径作为快速访问入口
- **类型筛选** - 支持按文件类型筛选（图片、视频、文档等）
- **拖拽导入** - 直接拖入文件即可完成导入
- **备注管理** - 为每个资源添加说明和关键词
- **快速打开** - 一键打开文件或所在目录

### 🌐 浏览器卡片
- **Cookie 导入** - 从 Chrome、自建浏览器、比特浏览器导入 Cookie
- **在线刷新** - 支持远程浏览器 Cookie 在线刷新
- **批量管理** - 批量测试、删除、导出浏览器卡片
- **分组展示** - 按来源自动分组，便于管理
- **快速注入** - 一键将 Cookie 注入到目标浏览器

### ⚙️ 系统功能
- **悬浮图标** - 桌面悬浮球，快速访问常用功能
- **靠边停靠** - 主窗口和悬浮窗支持靠边自动隐藏
- **全局快捷键** - 自定义快捷键，随时随地快速操作
- **开机启动** - 支持开机自动启动，后台驻留
- **托盘驻留** - 最小化到系统托盘，不占用任务栏

---

## 🚀 快速开始

### 环境要求
- Windows 10/11
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发运行
```bash
npm run dev
```

### 构建应用
```bash
# 构建安装包
npm run dist

# 仅输出解包目录
npm run pack
```

构建产物输出到 `release/` 目录。

---

## 📁 项目结构

```
DeskLibrary/
├── src/
│   ├── main/              # 主进程
│   │   ├── index.js       # 主进程入口
│   │   ├── preload.js     # 预加载脚本
│   │   ├── storage.js     # 数据存储
│   │   ├── browser-import.js  # 浏览器导入
│   │   └── bin/           # 辅助工具
│   ├── renderer/          # 渲染进程
│   │   ├── index.html     # 主界面
│   │   ├── renderer.js    # 主界面逻辑
│   │   ├── styles.css     # 样式
│   │   ├── floating.html  # 悬浮窗
│   │   └── floating.js    # 悬浮窗逻辑
│   └── img/               # 图片资源
├── package.json
└── README.md
```

---

## 💾 数据存储

应用数据保存在 Electron 的 `userData` 目录：

**Windows 路径**：
```
C:\Users\<用户名>\AppData\Roaming\desklibrary-electron\data\
```

**数据文件**：
- `records.json` - 剪贴板收藏记录
- `assets.json` - 资源库索引
- `browserCards.json` - 浏览器卡片
- `settings.json` - 用户设置
- `images/` - 图片文件
- `assets-backups/` - 备份文件

---

## 🛠️ 技术栈

- **框架**: Electron 31
- **UI**: 原生 JavaScript + CSS
- **全局监听**: uiohook-napi
- **数据存储**: JSON 文件
- **构建工具**: electron-builder

---

## ⚙️ 配置说明

### 快捷键设置
- **删除上次收藏**: `Ctrl+Alt+Z`
- **开始累计**: `Ctrl+Alt+A`
- **结束累计**: `Ctrl+Alt+S`
- 所有快捷键均可在设置中自定义

### 行为设置
- **复制后智能判断** - 自动判断是否收藏文本内容
- **连按两次复制** - 在观察窗口内连续复制两次自动收藏
- **复制后按修饰键** - 复制后按 Shift/Ctrl/Alt 立即收藏
- **靠边停靠** - 主窗口和悬浮窗靠边自动隐藏

### 路径配置
- **自建浏览器工作目录** - 自建浏览器的安装路径
- **资源备份存储路径** - 备份文件的保存位置

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [uiohook-napi](https://github.com/SnosMe/uiohook-napi) - 全局键盘监听
- [electron-builder](https://www.electron.build/) - 应用打包工具

---

## 📮 联系方式

- **Issues**: [GitHub Issues](https://github.com/yourusername/DeskLibrary/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/DeskLibrary/discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！**

Made with ❤️ by DeskLibrary Team

</div>
