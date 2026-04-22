const fs = require("node:fs/promises");
const path = require("node:path");

const { OBJECT_KINDS } = require("./constants");
const { createId } = require("./ids");

const KIND_CONFIG = {
  [OBJECT_KINDS.RECORD]: {
    prefix: "rec",
    relativeDir: path.join("raw", "records"),
    defaultLayer: "raw"
  },
  [OBJECT_KINDS.IMAGE_ASSET]: {
    prefix: "img",
    relativeDir: path.join("raw", "images", "meta"),
    defaultLayer: "raw"
  },
  [OBJECT_KINDS.LINK_RECORD]: {
    prefix: "lnk",
    relativeDir: path.join("raw", "links"),
    defaultLayer: "raw"
  },
  [OBJECT_KINDS.FILE_ASSET]: {
    prefix: "file",
    relativeDir: path.join("raw", "files"),
    defaultLayer: "raw"
  },
  [OBJECT_KINDS.BROWSER_CARD]: {
    prefix: "card",
    relativeDir: path.join("raw", "browser-cards"),
    defaultLayer: "raw"
  },
  [OBJECT_KINDS.DOCUMENT]: {
    prefix: "doc",
    relativeDir: {
      staging: path.join("staging", "documents"),
      final: path.join("final", "documents")
    },
    defaultLayer: "staging"
  },
  [OBJECT_KINDS.TASK]: {
    prefix: "task",
    relativeDir: path.join("staging", "tasks"),
    defaultLayer: "staging"
  },
  [OBJECT_KINDS.OPERATION]: {
    prefix: "op",
    relativeDir: {
      queue: path.join("operations", "queue"),
      history: path.join("operations", "history")
    },
    defaultLayer: "queue"
  },
  [OBJECT_KINDS.SNAPSHOT]: {
    prefix: "snap",
    relativeDir: path.join("operations", "snapshots"),
    defaultLayer: "system"
  }
};

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function buildBaseObject(kind, input, defaultLayer) {
  const now = new Date().toISOString();

  return {
    id: input.id,
    kind,
    layer: input.layer || defaultLayer,
    schemaVersion: "1.0.0",
    status: "active",
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    createdBy: input.createdBy || "system",
    updatedBy: input.updatedBy || "system",
    sourceRef: input.sourceRef || "",
    rawRefs: Array.isArray(input.rawRefs) ? input.rawRefs : [],
    stagingRefs: Array.isArray(input.stagingRefs) ? input.stagingRefs : [],
    finalRefs: Array.isArray(input.finalRefs) ? input.finalRefs : [],
    derivedFrom: Array.isArray(input.derivedFrom) ? input.derivedFrom : [],
    tags: Array.isArray(input.tags) ? input.tags : [],
    extra: input.extra && typeof input.extra === "object" ? input.extra : {}
  };
}

function normalizeRecord(input, config) {
  const base = buildBaseObject(OBJECT_KINDS.RECORD, input, config.defaultLayer);

  return {
    ...base,
    recordType: input.recordType || "text",
    text: input.text || "",
    language: input.language || "zh-CN",
    source: input.source || {},
    capture: input.capture || {},
    stats: input.stats || {},
    note: input.note || ""
  };
}

function normalizeImageAsset(input, config) {
  const base = buildBaseObject(OBJECT_KINDS.IMAGE_ASSET, input, config.defaultLayer);

  return {
    ...base,
    file: input.file || {},
    hash: input.hash || {},
    source: input.source || {},
    vision: input.vision || {},
    note: input.note || ""
  };
}

function normalizeLinkRecord(input, config) {
  const base = buildBaseObject(OBJECT_KINDS.LINK_RECORD, input, config.defaultLayer);

  return {
    ...base,
    url: input.url || "",
    domain: input.domain || "",
    title: input.title || "",
    excerpt: input.excerpt || "",
    source: input.source || {}
  };
}

function normalizeFileAsset(input, config) {
  const base = buildBaseObject(OBJECT_KINDS.FILE_ASSET, input, config.defaultLayer);

  return {
    ...base,
    entryType: input.entryType || "file",
    mode: input.mode || "link",
    name: input.name || "",
    extension: input.extension || "",
    paths: input.paths || {},
    state: input.state || {},
    note: input.note || ""
  };
}

function normalizeBrowserCard(input, config) {
  const base = buildBaseObject(OBJECT_KINDS.BROWSER_CARD, input, config.defaultLayer);

  return {
    ...base,
    domain: input.domain || "",
    openUrl: input.openUrl || "",
    name: input.name || "",
    remark: input.remark || "",
    username: input.username || "",
    password: input.password || "",
    cookies: Array.isArray(input.cookies) ? input.cookies : [],
    cookieNames: Array.isArray(input.cookieNames) ? input.cookieNames : [],
    browserSource: input.browserSource || {}
  };
}

function normalizeDocument(input, config) {
  const base = buildBaseObject(OBJECT_KINDS.DOCUMENT, input, config.defaultLayer);

  return {
    ...base,
    documentType: input.documentType || "generic",
    title: input.title || "",
    summary: input.summary || "",
    content: input.content || "",
    searchText: input.searchText || input.content || "",
    topics: Array.isArray(input.topics) ? input.topics : [],
    sourceRefs: Array.isArray(input.sourceRefs) ? input.sourceRefs : [],
    evidence: input.evidence && typeof input.evidence === "object" ? input.evidence : {},
    quality: input.quality && typeof input.quality === "object" ? input.quality : {}
  };
}

function normalizeTask(input, config) {
  const base = buildBaseObject(OBJECT_KINDS.TASK, input, config.defaultLayer);

  return {
    ...base,
    taskType: input.taskType || "generic_task",
    status: input.status || "completed",
    prompt: input.prompt || "",
    scope: input.scope && typeof input.scope === "object" ? input.scope : {},
    resultRefs: Array.isArray(input.resultRefs) ? input.resultRefs : []
  };
}

function normalizeOperation(input, config) {
  const base = buildBaseObject(OBJECT_KINDS.OPERATION, input, config.defaultLayer);

    return {
      ...base,
      action: input.action || "",
      riskLevel: input.riskLevel || "low",
      status: input.status || "draft",
    actor: input.actor && typeof input.actor === "object" ? input.actor : { type: "system", name: "vault-core" },
    targets: Array.isArray(input.targets) ? input.targets : [],
      payload: input.payload && typeof input.payload === "object" ? input.payload : {},
      backupRef: input.backupRef || "",
      requiresConfirmation: Boolean(input.requiresConfirmation),
      requiresBackup: input.requiresBackup !== undefined ? Boolean(input.requiresBackup) : false,
      reason: input.reason || "",
      events: Array.isArray(input.events) ? input.events : []
    };
}

function normalizeSnapshot(input, config) {
  const base = buildBaseObject(OBJECT_KINDS.SNAPSHOT, input, config.defaultLayer);

  return {
    ...base,
    snapshotType: input.snapshotType || "generic_snapshot",
    targetRefs: Array.isArray(input.targetRefs) ? input.targetRefs : [],
    storagePath: input.storagePath || "",
    retention: input.retention && typeof input.retention === "object" ? input.retention : {},
    restoreTarget: input.restoreTarget && typeof input.restoreTarget === "object" ? input.restoreTarget : {},
    sourceOperationId: input.sourceOperationId || ""
  };
}

const NORMALIZERS = {
  [OBJECT_KINDS.RECORD]: normalizeRecord,
  [OBJECT_KINDS.IMAGE_ASSET]: normalizeImageAsset,
  [OBJECT_KINDS.LINK_RECORD]: normalizeLinkRecord,
  [OBJECT_KINDS.FILE_ASSET]: normalizeFileAsset,
  [OBJECT_KINDS.BROWSER_CARD]: normalizeBrowserCard,
  [OBJECT_KINDS.DOCUMENT]: normalizeDocument,
  [OBJECT_KINDS.TASK]: normalizeTask,
  [OBJECT_KINDS.OPERATION]: normalizeOperation,
  [OBJECT_KINDS.SNAPSHOT]: normalizeSnapshot
};

function resolveRelativeDir(kindConfig, layerOrBucket) {
  if (typeof kindConfig.relativeDir === "string") {
    return kindConfig.relativeDir;
  }

  const resolved = kindConfig.relativeDir[layerOrBucket];
  if (!resolved) {
    throw new Error(`Unsupported layer or bucket: ${layerOrBucket}`);
  }

  return resolved;
}

class ObjectStore {
  constructor(vaultRoot) {
    this.vaultRoot = vaultRoot;
  }

  resolveFilePath(kind, id, layerOrBucket) {
    const kindConfig = KIND_CONFIG[kind];

    if (!kindConfig) {
      throw new Error(`Unsupported object kind: ${kind}`);
    }

    const relativeDir = resolveRelativeDir(kindConfig, layerOrBucket || kindConfig.defaultLayer);
    return path.join(this.vaultRoot, relativeDir, `${id}.json`);
  }

  async put(kind, input) {
    const kindConfig = KIND_CONFIG[kind];
    const normalize = NORMALIZERS[kind];

    if (!kindConfig || !normalize) {
      throw new Error(`Unsupported object kind: ${kind}`);
    }

    const id = input.id || createId(kindConfig.prefix);
    const object = normalize({ ...input, id }, kindConfig);
    const filePath = this.resolveFilePath(kind, id, object.layer || kindConfig.defaultLayer);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(object, null, 2)}\n`, "utf8");

    return object;
  }

  async get(kind, id) {
    return this.getByLocator(kind, id);
  }

  async getByLocator(kind, id, layerOrBucket) {
    const kindConfig = KIND_CONFIG[kind];

    if (!kindConfig) {
      throw new Error(`Unsupported object kind: ${kind}`);
    }

    const candidates =
      typeof kindConfig.relativeDir === "string"
        ? [kindConfig.relativeDir]
        : layerOrBucket
          ? [resolveRelativeDir(kindConfig, layerOrBucket)]
          : Object.values(kindConfig.relativeDir);

    for (const relativeDir of candidates) {
      const filePath = path.join(this.vaultRoot, relativeDir, `${id}.json`);

      if (!(await fileExists(filePath))) {
        continue;
      }

      const raw = await fs.readFile(filePath, "utf8");
      return JSON.parse(raw);
    }

    return null;
  }

  async list(kind, layerOrBucket) {
    const kindConfig = KIND_CONFIG[kind];

    if (!kindConfig) {
      throw new Error(`Unsupported object kind: ${kind}`);
    }

    const directories =
      typeof kindConfig.relativeDir === "string"
        ? [kindConfig.relativeDir]
        : layerOrBucket
          ? [resolveRelativeDir(kindConfig, layerOrBucket)]
          : Object.values(kindConfig.relativeDir);

    const objects = [];

    for (const relativeDir of directories) {
      const directory = path.join(this.vaultRoot, relativeDir);
      if (!(await fileExists(directory))) {
        continue;
      }

      const entries = await fs.readdir(directory, { withFileTypes: true });
      const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));
      const parsedObjects = await Promise.all(
        files.map(async (entry) => {
          const content = await fs.readFile(path.join(directory, entry.name), "utf8");
          return JSON.parse(content);
        })
      );

      objects.push(...parsedObjects);
    }

    return objects.sort((left, right) => left.id.localeCompare(right.id));
  }

  async removeByLocator(kind, id, layerOrBucket) {
    const filePath = this.resolveFilePath(kind, id, layerOrBucket);

    if (!(await fileExists(filePath))) {
      return false;
    }

    await fs.unlink(filePath);
    return true;
  }

  async moveBetweenLocators(kind, id, fromLayerOrBucket, toLayerOrBucket, mutator) {
    const currentObject = await this.getByLocator(kind, id, fromLayerOrBucket);

    if (!currentObject) {
      throw new Error(`Object not found for move: ${kind}:${id}`);
    }

    const nextObject =
      typeof mutator === "function"
        ? mutator({ ...currentObject })
        : { ...currentObject, layer: toLayerOrBucket };

    if (!nextObject || typeof nextObject !== "object") {
      throw new Error("Mutator must return an object");
    }

    await this.put(kind, { ...nextObject, id, layer: toLayerOrBucket });
    await this.removeByLocator(kind, id, fromLayerOrBucket);

    return this.getByLocator(kind, id, toLayerOrBucket);
  }
}

module.exports = {
  ObjectStore
};
