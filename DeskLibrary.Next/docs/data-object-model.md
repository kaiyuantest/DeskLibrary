# 数据对象模型

本文档定义新产品第一版的核心数据对象。

目标不是把所有业务对象做得很细，而是先建立一套稳定、能支撑 AI 增删改查和长期兼容的公共模型。

## 1. 建模原则

第一版对象模型要满足这几个条件：

1. 能映射到 `raw / staging / final` 三层
2. 能支持文本、图片、链接、文件、浏览器卡片
3. 能支持 AI 派生结果和用户确认结果
4. 能回溯原始对象
5. 能给软件和外部 AI 共同读取

所以对象模型采用：

- 通用基础字段
- 少量核心对象
- 派生对象和操作对象分离

## 2. 通用基础字段

所有主要对象建议都包含这些字段：

```json
{
  "id": "obj_xxx",
  "kind": "document",
  "layer": "raw",
  "schemaVersion": "1.0.0",
  "status": "active",
  "createdAt": "2026-04-22T00:00:00.000Z",
  "updatedAt": "2026-04-22T00:00:00.000Z",
  "createdBy": "system",
  "updatedBy": "system",
  "sourceRef": "",
  "rawRefs": [],
  "stagingRefs": [],
  "finalRefs": [],
  "derivedFrom": [],
  "tags": [],
  "extra": {}
}
```

字段说明：

- `id`：全局唯一 ID
- `kind`：对象类型
- `layer`：对象所在层，值通常为 `raw`、`staging`、`final`
- `schemaVersion`：当前对象结构版本
- `status`：对象状态，例如 `active`、`archived`、`deleted`
- `sourceRef`：直接来源对象
- `rawRefs`：关联的原始对象
- `derivedFrom`：派生来源
- `extra`：预留扩展字段

## 3. 核心对象列表

第一版建议先固定这些核心对象：

1. `Record`
2. `ImageAsset`
3. `LinkRecord`
4. `FileAsset`
5. `BrowserCard`
6. `Document`
7. `Topic`
8. `Collection`
9. `Task`
10. `Operation`
11. `Snapshot`

其中：

- `Record / ImageAsset / LinkRecord / FileAsset / BrowserCard` 偏原始对象
- `Document / Topic / Collection` 偏 AI 和检索对象
- `Task / Operation / Snapshot` 偏执行与治理对象

## 4. `Record`

`Record` 用于保存原始文本记录。

主要适用于：

- 剪贴板文本
- 手动新增文本
- OCR 提取后作为独立原文保存的文本

建议结构：

```json
{
  "id": "rec_xxx",
  "kind": "record",
  "layer": "raw",
  "recordType": "text",
  "text": "这里是原始文本",
  "language": "zh-CN",
  "source": {
    "type": "clipboard",
    "app": "Chrome",
    "windowTitle": "公务员考试资料"
  },
  "capture": {
    "method": "auto",
    "category": "daily"
  },
  "stats": {
    "hitCount": 1
  },
  "timestamps": {
    "capturedAt": "2026-04-22T00:00:00.000Z",
    "createdAt": "2026-04-22T00:00:00.000Z",
    "updatedAt": "2026-04-22T00:00:00.000Z"
  },
  "note": ""
}
```

## 5. `ImageAsset`

`ImageAsset` 用于表示原始图片对象。

主要适用于：

- 剪贴板图片
- 截图图片
- 手动导入图片

建议结构：

```json
{
  "id": "img_xxx",
  "kind": "image_asset",
  "layer": "raw",
  "file": {
    "path": "raw/images/files/2026/04/22/img_xxx.png",
    "name": "img_xxx.png",
    "extension": ".png",
    "size": 12345,
    "mimeType": "image/png"
  },
  "hash": {
    "sha256": "..."
  },
  "source": {
    "type": "clipboard",
    "app": "SnippingTool",
    "windowTitle": ""
  },
  "vision": {
    "ocrText": "",
    "caption": "",
    "labels": []
  },
  "timestamps": {
    "capturedAt": "2026-04-22T00:00:00.000Z",
    "createdAt": "2026-04-22T00:00:00.000Z",
    "updatedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

说明：

- `ocrText` 可以来自 OCR
- `caption` 可以来自视觉模型生成的图片描述
- `labels` 可以来自 AI 标注

## 6. `LinkRecord`

`LinkRecord` 用于表示原始链接记录。

建议结构：

```json
{
  "id": "lnk_xxx",
  "kind": "link_record",
  "layer": "raw",
  "url": "https://example.com",
  "domain": "example.com",
  "title": "",
  "excerpt": "",
  "source": {
    "type": "clipboard"
  },
  "timestamps": {
    "capturedAt": "2026-04-22T00:00:00.000Z",
    "createdAt": "2026-04-22T00:00:00.000Z",
    "updatedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

## 7. `FileAsset`

`FileAsset` 用于表示导入的文件或文件夹。

建议结构：

```json
{
  "id": "file_xxx",
  "kind": "file_asset",
  "layer": "raw",
  "entryType": "file",
  "mode": "backup",
  "name": "资料.pdf",
  "extension": ".pdf",
  "paths": {
    "sourcePath": "D:/资料/资料.pdf",
    "storedPath": "raw/files/backups/file_xxx.pdf",
    "primaryPath": "raw/files/backups/file_xxx.pdf"
  },
  "state": {
    "exists": true,
    "sourceExists": true,
    "backupExists": true
  },
  "note": "",
  "timestamps": {
    "createdAt": "2026-04-22T00:00:00.000Z",
    "updatedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

## 8. `BrowserCard`

`BrowserCard` 用于表示站点登录卡片。

第一版里它更偏：

- 登录态归档对象
- 浏览器来源对象
- 辅助执行对象

建议结构：

```json
{
  "id": "card_xxx",
  "kind": "browser_card",
  "layer": "raw",
  "domain": ".example.com",
  "openUrl": "https://example.com",
  "name": "example",
  "remark": "",
  "username": "",
  "password": "",
  "cookies": [
    {
      "name": "sessionid",
      "value": "...",
      "domain": ".example.com",
      "path": "/",
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax",
      "expirationDate": 0
    }
  ],
  "cookieNames": ["sessionid"],
  "browserSource": {
    "type": "chrome_profile",
    "profileName": "Default",
    "userDataDir": "C:/Users/xxx/AppData/Local/Google/Chrome/User Data"
  },
  "timestamps": {
    "createdAt": "2026-04-22T00:00:00.000Z",
    "updatedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

## 9. `Document`

`Document` 是新系统最关键的统一对象。

它不是原始对象，而是供 AI 检索、整理、归纳和回答使用的标准化文档。

它可以来源于：

- `Record`
- `ImageAsset`
- `LinkRecord`
- `FileAsset`
- `BrowserCard`

建议结构：

```json
{
  "id": "doc_xxx",
  "kind": "document",
  "layer": "staging",
  "documentType": "image_note",
  "title": "考公面试资料截图",
  "summary": "这是一张关于考公面试流程的截图",
  "content": "OCR 文本和视觉理解后得到的主文本",
  "searchText": "供全文检索和向量检索的拼接文本",
  "tags": ["考公", "面试"],
  "topics": ["topic_exam"],
  "sourceRefs": ["img_xxx"],
  "rawRefs": ["img_xxx"],
  "derivedFrom": ["img_xxx"],
  "evidence": {
    "imagePaths": ["raw/images/files/2026/04/22/img_xxx.png"],
    "quotes": []
  },
  "quality": {
    "confidence": 0.89,
    "reviewStatus": "pending"
  },
  "timestamps": {
    "createdAt": "2026-04-22T00:00:00.000Z",
    "updatedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

说明：

- `Document` 是 AI 工作和检索主对象
- `staging/document` 是 AI 生成的候选文档
- `final/document` 是确认后的正式文档

## 10. `Topic`

`Topic` 用于表示主题聚合结果。

例如：

- 考公
- 行测
- 申论
- 面试

建议结构：

```json
{
  "id": "topic_exam",
  "kind": "topic",
  "layer": "final",
  "name": "考公",
  "description": "与公务员考试相关的资料集合",
  "documentRefs": ["doc_x1", "doc_x2"],
  "keywords": ["考公", "公务员考试", "申论", "行测"],
  "timestamps": {
    "createdAt": "2026-04-22T00:00:00.000Z",
    "updatedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

## 11. `Collection`

`Collection` 用于表示用户确认后的资料集合、文件夹视图或专题集。

建议结构：

```json
{
  "id": "col_xxx",
  "kind": "collection",
  "layer": "final",
  "name": "考公图片资料",
  "description": "",
  "itemRefs": ["doc_x1", "img_x2", "file_x3"],
  "rule": null,
  "timestamps": {
    "createdAt": "2026-04-22T00:00:00.000Z",
    "updatedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

## 12. `Task`

`Task` 记录一次 AI 任务。

它是理解“这次 AI 做了什么”的关键对象。

建议结构：

```json
{
  "id": "task_xxx",
  "kind": "task",
  "layer": "staging",
  "taskType": "generate_labels",
  "status": "completed",
  "prompt": "请整理这些考公相关图片并生成标签",
  "scope": {
    "inputRefs": ["img_x1", "img_x2"],
    "filters": {
      "types": ["image"]
    }
  },
  "resultRefs": ["doc_x1", "stg_label_x1"],
  "timestamps": {
    "createdAt": "2026-04-22T00:00:00.000Z",
    "updatedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

## 13. `Operation`

`Operation` 表示一次结构化操作请求或执行记录。

建议结构：

```json
{
  "id": "op_xxx",
  "kind": "operation",
  "layer": "system",
  "action": "publish_to_final",
  "riskLevel": "high",
  "status": "pending_confirmation",
  "actor": {
    "type": "ai",
    "name": "builtin-agent"
  },
  "targets": ["doc_x1"],
  "payload": {
    "fromLayer": "staging",
    "toLayer": "final"
  },
  "backupRef": "snap_xxx",
  "timestamps": {
    "createdAt": "2026-04-22T00:00:00.000Z",
    "updatedAt": "2026-04-22T00:00:00.000Z"
  }
}
```

## 14. `Snapshot`

`Snapshot` 表示一次备份快照。

建议结构：

```json
{
  "id": "snap_xxx",
  "kind": "snapshot",
  "layer": "system",
  "snapshotType": "pre_publish_backup",
  "targetRefs": ["doc_x1"],
  "storagePath": "operations/snapshots/2026/04/22/snap_xxx.zip",
  "retention": {
    "policy": "keep_latest_n",
    "maxCount": 20
  },
  "timestamps": {
    "createdAt": "2026-04-22T00:00:00.000Z"
  }
}
```

## 15. 关键关系

第一版至少要稳定支持这几种关系：

1. `raw -> staging`
原始对象生成 AI 工作文档。

2. `staging -> final`
用户确认后发布正式结果。

3. `task -> document`
一次 AI 任务产出若干文档、标签、摘要。

4. `operation -> snapshot`
高风险操作必须绑定快照。

5. `topic / collection -> document`
主题和集合通过文档聚合内容。

## 16. 与检索的关系

检索时，不建议直接混搜所有对象，而应分层：

1. 优先搜 `final/document`
2. 再补 `staging/document`
3. 必要时回查 `raw`

这样可以保证：

- 默认结果更稳定
- 用户看到的优先是确认后的整理结果
- 需要细查时还能回到底稿

## 17. 第一阶段必须先实现的对象

如果按 MVP 推进，第一阶段优先做：

1. `Record`
2. `ImageAsset`
3. `FileAsset`
4. `BrowserCard`
5. `Document`
6. `Task`
7. `Operation`
8. `Snapshot`

`Topic` 和 `Collection` 可以先做最小版，不一定要一次做完整。

## 18. 当前结论

这套对象模型的核心是：

1. 原始对象负责存底稿
2. `Document` 负责统一 AI 理解和检索入口
3. `Task / Operation / Snapshot` 负责把 AI 行为管起来
4. `Topic / Collection` 负责承接整理结果

下一份文档建议继续写：

- AI 操作协议
- 高低风险动作分级
- 发布到 `final` 的确认流程
