# 数据仓目录结构方案

本文档定义新产品第一版的数据仓目录结构。

目标不是先追求界面，而是先定义：

- 文件夹如何成为主系统
- `raw / staging / final` 三层如何落地
- AI 如何引用和处理数据
- 软件如何在允许用户手改目录的前提下保持稳定

## 1. 设计目标

这个数据仓必须同时满足几件事：

1. 数据长期保存在用户可控的本地文件夹中
2. 软件和 AI 都能稳定读取
3. AI 处理结果不会直接污染原始底稿
4. 用户允许手动改目录后，系统还能尽量自修复
5. 后续别的工具也能基于同一格式接入

所以这里不采用“单一数据库即主系统”的模式，而采用：

- 文件夹是主系统
- 索引是加速层
- AI 操作通过受控协议执行

## 2. 总体目录

建议第一版目录结构如下：

```text
VaultRoot/
├── vault.json
├── raw/
│   ├── records/
│   ├── images/
│   ├── links/
│   ├── files/
│   └── browser-cards/
├── staging/
│   ├── tasks/
│   ├── documents/
│   ├── labels/
│   ├── summaries/
│   └── plans/
├── final/
│   ├── documents/
│   ├── topics/
│   ├── collections/
│   └── exports/
├── operations/
│   ├── queue/
│   ├── history/
│   └── snapshots/
├── index/
│   ├── sqlite/
│   ├── fts/
│   ├── vectors/
│   └── cache/
├── manifests/
│   ├── schemas/
│   ├── types/
│   └── stats/
└── system/
    ├── prompts/
    ├── policies/
    └── settings/
```

说明：

- `raw` 是原始数据层
- `staging` 是 AI 工作层
- `final` 是确认发布层
- `operations` 是操作和备份层
- `index` 是检索加速层
- `system` 是规则和执行配置层

## 3. 顶层文件

### 3.1 `vault.json`

这个文件是整个数据仓的入口清单，至少包含：

```json
{
  "vaultId": "vault_xxx",
  "formatVersion": "1.0.0",
  "displayName": "My Vault",
  "createdAt": "2026-04-22T00:00:00.000Z",
  "updatedAt": "2026-04-22T00:00:00.000Z",
  "defaultLanguage": "zh-CN",
  "capabilities": {
    "supportsVisionSearch": true,
    "supportsCloudAi": true,
    "supportsClipboardCapture": true
  }
}
```

作用：

- 声明当前数据仓格式版本
- 提供基础能力标识
- 让软件和外部 AI 快速识别这是一个合法数据仓

## 4. `raw` 原始层

`raw` 只存用户真实采集或导入的底稿，原则上不被 AI 直接覆盖。

### 4.1 `raw/records/`

保存文本型原始记录。

示例：

```text
raw/records/2026/04/22/rec_xxx.json
```

单条记录建议结构：

```json
{
  "id": "rec_xxx",
  "kind": "text",
  "text": "原始文本内容",
  "source": {
    "type": "clipboard",
    "app": "Chrome",
    "windowTitle": "公务员考试资料"
  },
  "timestamps": {
    "capturedAt": "2026-04-22T00:00:00.000Z",
    "createdAt": "2026-04-22T00:00:00.000Z",
    "updatedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

### 4.2 `raw/images/`

保存原始图片和图片元数据。

建议分成：

- `raw/images/files/` 存实际图片
- `raw/images/meta/` 存图片元数据

元数据示例：

```json
{
  "id": "img_xxx",
  "kind": "image",
  "filePath": "raw/images/files/2026/04/22/img_xxx.png",
  "title": "",
  "source": {
    "type": "clipboard"
  },
  "hash": {
    "sha256": "..."
  },
  "timestamps": {
    "capturedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

### 4.3 `raw/links/`

保存原始链接记录。

### 4.4 `raw/files/`

保存文件导入记录。

这里不要求所有文件都复制进仓库，但必须把两种模式区分清楚：

- `link`
- `backup`

如果是 `backup`，真实备份文件也落在 `raw/files/backups/` 下。

### 4.5 `raw/browser-cards/`

保存站点登录卡片和 Cookie 快照。

这里的 Cookie 定位是归档和执行辅助，不作为第一版主要语义理解对象。

## 5. `staging` AI 工作层

`staging` 是 AI 默认工作的地方。

AI 的整理、归纳、打标签、摘要、结构化提取、改名建议、归档建议，都先写这里。

### 5.1 `staging/tasks/`

保存一次 AI 任务的输入、执行状态和结果引用。

示例：

```json
{
  "taskId": "task_xxx",
  "type": "organize_topic",
  "status": "completed",
  "prompt": "找出所有考公相关图片和文本并整理",
  "inputRefs": ["rec_x1", "img_x2"],
  "outputRefs": ["stg_doc_x1", "stg_topic_x1"],
  "createdAt": "2026-04-22T00:00:00.000Z"
}
```

### 5.2 `staging/documents/`

保存 AI 归一化后的工作文档。

这里的文档可能来自：

- 原始文本
- OCR 结果
- 图片视觉理解结果
- 链接页面摘要
- 文件抽取文本
- 浏览器卡片描述

### 5.3 `staging/labels/`

保存标签建议、分类建议、主题归类建议。

### 5.4 `staging/summaries/`

保存 AI 摘要、专题整理结果、阶段性汇总。

### 5.5 `staging/plans/`

保存 AI 建议执行但尚未发布的动作计划。

例如：

- 建议把哪些文件移到哪个专题
- 建议把哪些文本合并
- 建议给哪些图片加什么标签
- 建议备份哪些文件到哪个位置

## 6. `final` 正式层

`final` 只存“用户确认采用”的结果。

它不是复制整个 `raw`，而是存稳定、可供检索和展示的正式结果。

### 6.1 `final/documents/`

保存确认后的正式文档。

比如：

- 正式标题
- 正式摘要
- 正式标签
- 正式结构化字段
- 与原始对象的关联引用

### 6.2 `final/topics/`

保存确认后的专题聚合结果。

例如：

- `考公`
- `行测`
- `申论`
- `面试`

### 6.3 `final/collections/`

保存确认后的收藏集、资料夹、主题集。

### 6.4 `final/exports/`

保存导出结果，例如：

- 导出给外部 AI 的上下文包
- 导出的 Markdown 摘要
- 导出的专题资料包

## 7. `operations` 操作和备份层

这个目录用于落实你已经决定的“分级执行”和“自动备份”。

### 7.1 `operations/queue/`

保存待执行操作。

AI 不直接改文件，而是先生成结构化操作请求。

### 7.2 `operations/history/`

保存执行历史。

至少记录：

- 谁触发的
- 何时执行
- 执行了什么
- 改动了哪些对象
- 是否需要用户确认
- 执行是否成功

### 7.3 `operations/snapshots/`

保存自动备份快照。

这里需要配合设置项：

- 是否开启 AI 自动备份
- 每类对象保留多少份
- 是否允许清理旧备份

## 8. `index` 检索加速层

`index` 不是主数据，只是加速层，可以重建。

建议包含：

- `sqlite/` 元数据索引
- `fts/` 全文检索索引
- `vectors/` 向量检索索引
- `cache/` 临时缓存

约束：

- 索引损坏时可以重建
- 不能把唯一真相放在索引里
- 任何正式数据都必须能回溯到 `raw` 或 `final`

## 9. `manifests` 协议描述层

这里用于描述数据仓支持的对象类型、字段规则和统计信息。

建议包括：

- `schemas/` 数据结构 schema
- `types/` 对象类型说明
- `stats/` 统计快照

作用：

- 给软件读
- 给外部 AI 读
- 给未来第三方工具读

## 10. `system` 规则层

这个目录很关键，因为你已经明确：

AI 必须靠内置提示词和结构规则工作，不能乱改。

建议包含：

- `prompts/` 内置系统提示词
- `policies/` 执行策略和权限规则
- `settings/` 数据仓级别设置

### 10.1 提示词职责

提示词不应只写“你是助手”，而要明确：

- AI 只能通过结构化操作协议工作
- AI 默认只写 `staging`
- 高风险动作必须进入确认流
- 不得绕过备份和操作日志
- 不得直接修改未授权路径

### 10.2 策略职责

策略需要定义：

- 哪些动作可直接执行
- 哪些动作必须确认
- 哪些动作默认拒绝
- 哪些目录允许写入
- 如何处理用户手动改目录后的索引修复

## 11. 对象关联规则

目录结构之外，还要统一对象关联方式。

建议任何对象都包含：

- `id`
- `kind`
- `sourceRef`
- `rawRefs`
- `finalRefs`
- `derivedFrom`
- `createdAt`
- `updatedAt`

例如：

- 一条 `final/document` 可以引用多个 `raw/records`
- 一条 `staging/summary` 可以来源于多个 `raw/images` 和 `raw/links`
- 一个 `operations/history` 记录可以引用一次 `staging -> final` 的发布动作

## 12. 执行规则和目录联动

结合你已确认的分级执行，目录层要支持下面的行为：

### 可直接执行

- 查询
- 检索
- 汇总
- 打标签建议
- 分类建议
- 生成摘要
- 写入 `staging`

### 必须确认后执行

- 删除
- 覆盖
- 批量修改
- 文件移动
- 备份到指定位置
- 清理历史版本
- 修改敏感卡片 / Cookie
- 将 `staging` 发布到 `final`
- 任何影响 `raw` 的动作

## 13. 对用户手改目录的兼容

因为你允许用户直接改文件夹，所以系统必须支持：

1. 启动时扫描差异
2. 识别新增、删除、重命名、移动
3. 标记失效索引
4. 尝试自动修复关联
5. 修复失败时给出可恢复提示

这里建议以后单独补一份：

- 目录变更检测协议
- 索引重建协议

## 14. 第一阶段最小落地范围

如果按 MVP 推进，这份目录结构第一阶段只需要先跑通：

1. `raw/records`
2. `raw/images`
3. `raw/files`
4. `raw/browser-cards`
5. `staging/documents`
6. `staging/labels`
7. `final/documents`
8. `operations/history`
9. `operations/snapshots`
10. `index/sqlite`

这样已经足够支撑第一阶段能力：

- 文本采集
- 图片采集
- 文件导入
- Cookie 卡片归档
- AI 整理
- 用户确认发布
- 自动备份
- 检索和回溯

## 15. 当前结论

这一版目录结构的核心不是“把数据分类放好”这么简单，而是建立三件事：

1. 文件夹主系统
2. `raw / staging / final` 三层执行模型
3. AI 受控操作的目录基础

下一份文档建议继续写：

- 数据对象模型
- AI 操作协议
- 备份与回滚协议
- 索引重建机制
