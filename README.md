# Click2Save Electron

从主产品文档迁移而来的 Click2Save Electron 版本。

## 功能

- 文本与图片采集
- 日期筛选
- 记录列表与详情面板
- 图片缩略图展示
- 备注编辑
- 手动创建文本
- 删除记录
- 托盘与通知
- 自动判断
- 先复制后按键采集
- 双击复制采集
- `Alt+Q` 采集当前剪贴板内容

## 目录结构

- `src/main`：主进程、存储、托盘、剪贴板监听
- `src/renderer`：界面与交互
- `data`：本地开发数据目录

## 安装

在 `Click2Save.Electron` 目录下执行：

```bash
npm install
```

## 启动

```bash
npm run dev
```

## 构建

```bash
npm run dist
```

## 说明

- 当前存储层使用 JSON 文件，以便更快启动
- 当前 `Alt+Q` 实现会采集当前剪贴板内容
- 若要在 `Alt+Q` 下完整模拟“从选区复制”，后续可接入系统自动化库
- `copy-then-key` 依赖 `uiohook-napi`
