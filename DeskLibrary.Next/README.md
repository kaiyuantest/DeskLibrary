# DeskLibrary.Next

这是新项目根目录，不是旧项目代码根目录。

它的用途是承载下一代产品的开发文档、架构协议、目录规范、AI 执行规则和后续新实现代码。

当前仓库根目录 `E:\project\Click2Save\Click2Save.Electron` 里同时存在两套东西：

1. 旧项目
位于当前仓库原有结构中，是真实可运行的 Electron 应用，核心代码在 [`src`](E:\project\Click2Save\Click2Save.Electron\src)。

2. 新项目规划
位于 [`DeskLibrary.Next`](E:\project\Click2Save\Click2Save.Electron\DeskLibrary.Next)，用于定义下一代产品。

以后任何新开的 AI 对话，如果目标是理解“为什么要重构、重构成什么样、当前已经定了哪些方向”，应该优先阅读本目录下的文档，而不是只看旧项目代码。

## 先读这个目录的原因

旧项目已经实现了不少功能，但它的核心存储模式仍然偏向：

- Electron `userData` 目录
- JSON 文件分散存储
- 功能模块各自管理自己的数据

而新项目的方向已经明确变化为：

- 本地数据文件夹是主系统
- 桌面软件只是采集器、管理器、执行器
- AI 不只是搜索，而是要在受控规则下整理、归纳、增删改查数据
- 数据格式要长期稳定，未来让其他工具也能读

所以 `DeskLibrary.Next` 的文档是“新项目语义的唯一入口”，不是旧 README 的补充说明。

## 当前目标

新产品的目标可以概括为一句话：

“做一个以本地数据文件夹为核心载体、支持 AI 按固定结构对个人数据进行采集、整理、检索、备份和受控修改的单机数据仓系统。”

更具体地说：

- 本地数据文件夹是主入口
- 桌面软件只是采集器、管理器、执行器
- AI 可以在软件内对话，也可以由外部 AI 面向这个文件夹工作
- AI 的核心职责不是只搜索，而是按规则整理、归纳、增删改查

## 当前已确认原则

- 产品为纯本地单机产品
- 文件夹才是主系统，数据库只能是索引和加速层
- 第一阶段支持文本、图片、链接、文件、浏览器 Cookie / 卡片
- Cookie 主要作为站点登录卡片保存
- 图片检索要支持标题 / 标签和视觉语义搜索
- 原始数据、AI 处理数据、正式数据分层管理
- AI 默认只处理工作层，不直接覆盖原始层
- 查询和整理类动作可直接执行
- 删除、覆盖、批量修改、文件移动、正式发布这类高风险动作必须确认
- 文件夹格式要尽量长期稳定，未来让其他工具也能读取
- 允许用户手动修改数据文件夹，系统要尽量兼容
- 优先云端模型，但上传前允许用户确认

## 旧项目和新项目的关系

旧项目不是废弃物，它是新项目的重要来源。

旧项目当前已经具备的真实能力包括：

- 剪贴板文本 / 图片收藏
- 图片保存
- 资源库文件 / 文件夹导入
- 浏览器卡片 / Cookie 导入
- 悬浮图标和悬浮菜单
- 截图 OCR / 翻译
- 临时便签

但旧项目的问题也很清楚：

- 数据模型按功能拆散，没有统一文档层
- 本地数据目录不是“长期标准格式”
- AI 没有受控执行协议
- 搜索和整理能力没有围绕统一数据仓设计
- 原始数据、AI 结果、正式数据没有明确三层边界

因此新项目不是简单改界面，而是一次架构重构。

## 建议阅读顺序

如果你是第一次接手这个项目，建议按这个顺序看文档：

1. [给新 AI / 新开发者的接手说明](./docs/handoff-for-new-ai.md)
1. [项目背景与重构原因](./docs/project-context.md)
2. [产品定义与边界](./docs/product-definition.md)
3. [数据仓目录结构方案](./docs/data-vault-layout.md)
4. [数据对象模型](./docs/data-object-model.md)
5. [总体架构说明](./docs/system-architecture.md)
6. [AI 操作协议](./docs/ai-operation-protocol.md)
7. [旧项目迁移策略](./docs/migration-strategy.md)
8. [开发阶段与优先级](./docs/development-phases.md)
9. [术语表与已确认决策](./docs/glossary-and-decisions.md)

## 文档索引

- [给新 AI / 新开发者的接手说明](./docs/handoff-for-new-ai.md)
- [项目背景与重构原因](./docs/project-context.md)
- [产品定义与边界](./docs/product-definition.md)
- [数据仓目录结构方案](./docs/data-vault-layout.md)
- [数据对象模型](./docs/data-object-model.md)
- [总体架构说明](./docs/system-architecture.md)
- [AI 操作协议](./docs/ai-operation-protocol.md)
- [旧项目迁移策略](./docs/migration-strategy.md)
- [开发阶段与优先级](./docs/development-phases.md)
- [术语表与已确认决策](./docs/glossary-and-decisions.md)
