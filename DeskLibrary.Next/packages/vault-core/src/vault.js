const fs = require("node:fs/promises");
const path = require("node:path");

const {
  OBJECT_KINDS,
  OPERATION_STATUSES,
  VAULT_DIRECTORIES,
  VAULT_FORMAT_VERSION
} = require("./constants");
const { createId } = require("./ids");
const { ObjectStore } = require("./object-store");

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectories(vaultRoot) {
  await Promise.all(
    VAULT_DIRECTORIES.map((relativeDir) =>
      fs.mkdir(path.join(vaultRoot, relativeDir), { recursive: true })
    )
  );
}

async function writeJson(targetPath, value) {
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJson(targetPath) {
  const content = await fs.readFile(targetPath, "utf8");
  return JSON.parse(content);
}

async function copyJson(sourcePath, targetPath) {
  const value = await readJson(sourcePath);
  await writeJson(targetPath, value);
}

function createOperationEvent(type, detail = {}) {
  return {
    type,
    at: new Date().toISOString(),
    detail
  };
}

async function createVault(options = {}) {
  const vaultRoot = path.resolve(options.rootPath || "VaultRoot");

  if (await pathExists(path.join(vaultRoot, "vault.json"))) {
    throw new Error(`Vault already exists at ${vaultRoot}`);
  }

  await fs.mkdir(vaultRoot, { recursive: true });
  await ensureDirectories(vaultRoot);

  const now = new Date().toISOString();
  const manifest = {
    vaultId: options.vaultId || createId("vault"),
    formatVersion: VAULT_FORMAT_VERSION,
    displayName: options.displayName || path.basename(vaultRoot),
    createdAt: now,
    updatedAt: now,
    defaultLanguage: options.defaultLanguage || "zh-CN",
    capabilities: {
      supportsVisionSearch: true,
      supportsCloudAi: true,
      supportsClipboardCapture: true,
      ...options.capabilities
    }
  };

  await writeJson(path.join(vaultRoot, "vault.json"), manifest);

  return openVault(vaultRoot);
}

async function openVault(rootPath) {
  const vaultRoot = path.resolve(rootPath);
  const manifestPath = path.join(vaultRoot, "vault.json");

  if (!(await pathExists(manifestPath))) {
    throw new Error(`vault.json not found under ${vaultRoot}`);
  }

  const manifest = await readJson(manifestPath);
  const store = new ObjectStore(vaultRoot);

  async function updateHistoricalOperation(operationId, updater) {
    const existing = await store.getByLocator(OBJECT_KINDS.OPERATION, operationId, "history");

    if (!existing) {
      throw new Error(`Historical operation not found: ${operationId}`);
    }

    const next = updater({ ...existing });
    if (!next || typeof next !== "object") {
      throw new Error("Operation updater must return an object");
    }

    return store.put(OBJECT_KINDS.OPERATION, {
      ...existing,
      ...next,
      id: operationId,
      layer: "history"
    });
  }

  async function createOperation(input) {
    const requiresConfirmation =
      input.requiresConfirmation !== undefined
        ? Boolean(input.requiresConfirmation)
        : input.riskLevel === "high";
    const initialStatus = requiresConfirmation
      ? OPERATION_STATUSES.PENDING_CONFIRMATION
      : OPERATION_STATUSES.QUEUED;

    return store.put(OBJECT_KINDS.OPERATION, {
      ...input,
      layer: "queue",
      status: initialStatus,
      requiresConfirmation,
      events: [
        createOperationEvent("created", {
          status: initialStatus
        })
      ]
    });
  }

  async function updateQueuedOperation(operationId, updater) {
    const existing = await store.getByLocator(OBJECT_KINDS.OPERATION, operationId, "queue");

    if (!existing) {
      throw new Error(`Queued operation not found: ${operationId}`);
    }

    const next = updater({ ...existing });
    if (!next || typeof next !== "object") {
      throw new Error("Operation updater must return an object");
    }

    return store.put(OBJECT_KINDS.OPERATION, {
      ...existing,
      ...next,
      id: operationId,
      layer: "queue"
    });
  }

  async function approveOperation(operationId, options = {}) {
    return updateQueuedOperation(operationId, (operation) => ({
      ...operation,
      status: OPERATION_STATUSES.APPROVED,
      updatedAt: new Date().toISOString(),
      updatedBy: options.actorName || "vault-core",
      events: [
        ...(operation.events || []),
        createOperationEvent("approved", {
          actorType: options.actorType || "system",
          actorName: options.actorName || "vault-core"
        })
      ]
    }));
  }

  async function cancelOperation(operationId, options = {}) {
    const cancelled = await updateQueuedOperation(operationId, (operation) => ({
      ...operation,
      status: OPERATION_STATUSES.CANCELLED,
      updatedAt: new Date().toISOString(),
      updatedBy: options.actorName || "vault-core",
      events: [
        ...(operation.events || []),
        createOperationEvent("cancelled", {
          actorType: options.actorType || "system",
          actorName: options.actorName || "vault-core",
          reason: options.reason || ""
        })
      ]
    }));

    return store.moveBetweenLocators(
      OBJECT_KINDS.OPERATION,
      operationId,
      "queue",
      "history",
      (operation) => ({
        ...operation,
        layer: "history"
      })
    );
  }

  async function executeOperation(operationId, executor) {
    const queued = await store.getByLocator(OBJECT_KINDS.OPERATION, operationId, "queue");

    if (!queued) {
      throw new Error(`Queued operation not found: ${operationId}`);
    }

    if (
      queued.status !== OPERATION_STATUSES.QUEUED &&
      queued.status !== OPERATION_STATUSES.APPROVED
    ) {
      throw new Error(`Operation is not executable in status ${queued.status}`);
    }

    const running = await updateQueuedOperation(operationId, (operation) => ({
      ...operation,
      status: OPERATION_STATUSES.RUNNING,
      updatedAt: new Date().toISOString(),
      events: [
        ...(operation.events || []),
        createOperationEvent("running")
      ]
    }));

    try {
      const result = await executor(running);
      const completed = await updateQueuedOperation(operationId, (operation) => ({
        ...operation,
        status: OPERATION_STATUSES.COMPLETED,
        updatedAt: new Date().toISOString(),
        payload: {
          ...(operation.payload || {}),
          result: result && typeof result === "object" ? result : {}
        },
        events: [
          ...(operation.events || []),
          createOperationEvent("completed")
        ]
      }));

      const archived = await store.moveBetweenLocators(
        OBJECT_KINDS.OPERATION,
        operationId,
        "queue",
        "history",
        (operation) => ({
          ...operation,
          ...completed,
          layer: "history"
        })
      );

      return {
        operation: archived,
        result
      };
    } catch (error) {
      const failed = await updateQueuedOperation(operationId, (operation) => ({
        ...operation,
        status: OPERATION_STATUSES.FAILED,
        updatedAt: new Date().toISOString(),
        payload: {
          ...(operation.payload || {}),
          error: {
            message: error.message
          }
        },
        events: [
          ...(operation.events || []),
          createOperationEvent("failed", {
            message: error.message
          })
        ]
      }));

      await store.moveBetweenLocators(
        OBJECT_KINDS.OPERATION,
        operationId,
        "queue",
        "history",
        (operation) => ({
          ...operation,
          ...failed,
          layer: "history"
        })
      );

      throw error;
    }
  }

  async function publishDocumentToFinal(documentId, options = {}) {
    const stagingDocument = await store.getByLocator(OBJECT_KINDS.DOCUMENT, documentId, "staging");

    if (!stagingDocument) {
      throw new Error(`Staging document not found: ${documentId}`);
    }

    let operation = await createOperation({
      action: "publish_to_final",
      riskLevel: "high",
      actor: {
        type: options.actorType || "system",
        name: options.actorName || "vault-core"
      },
      targets: [documentId],
      payload: {
        fromLayer: "staging",
        toLayer: "final"
      },
      backupRef: "",
      requiresBackup: true,
      reason: options.reason || "Publish staging document to final"
    });

    if (operation.status === OPERATION_STATUSES.PENDING_CONFIRMATION && options.autoApprove !== false) {
      operation = await approveOperation(operation.id, {
        actorType: options.actorType || "system",
        actorName: options.actorName || "vault-core"
      });
    }

    if (operation.status === OPERATION_STATUSES.PENDING_CONFIRMATION) {
      return {
        operation,
        snapshot: null,
        finalDocument: null
      };
    }

    const execution = await executeOperation(operation.id, async () => {
      const now = new Date().toISOString();
      const snapshotId = options.snapshotId || createId("snap");
      const snapshotStoragePath = path.join(
        "operations",
        "snapshots",
        "data",
        `${snapshotId}-${documentId}.json`
      );

      const snapshot = await store.put(OBJECT_KINDS.SNAPSHOT, {
        id: snapshotId,
        layer: "system",
        snapshotType: "pre_publish_backup",
        targetRefs: [documentId],
        storagePath: snapshotStoragePath,
        restoreTarget: {
          kind: OBJECT_KINDS.DOCUMENT,
          layer: "final",
          id: documentId
        },
        retention: {
          policy: "keep_latest_n",
          maxCount: 20
        },
        createdBy: options.actorName || "vault-core",
        sourceOperationId: operation.id
      });

      const snapshotAbsolutePath = path.join(vaultRoot, snapshotStoragePath);
      await fs.mkdir(path.dirname(snapshotAbsolutePath), { recursive: true });
      await copyJson(
        path.join(vaultRoot, "staging", "documents", `${documentId}.json`),
        snapshotAbsolutePath
      );

      const finalDocument = await store.put(OBJECT_KINDS.DOCUMENT, {
        ...stagingDocument,
        layer: "final",
        updatedAt: now,
        updatedBy: options.actorName || "vault-core",
        finalRefs: Array.from(new Set([...(stagingDocument.finalRefs || []), documentId]))
      });

      return {
        snapshotId: snapshot.id,
        finalDocumentId: finalDocument.id
      };
    });

    const snapshot = execution.result
      ? await store.get(OBJECT_KINDS.SNAPSHOT, execution.result.snapshotId)
      : null;
    const finalDocument = execution.result
      ? await store.getByLocator(OBJECT_KINDS.DOCUMENT, execution.result.finalDocumentId, "final")
      : null;
    const historyOperation = await store.getByLocator(
      OBJECT_KINDS.OPERATION,
      operation.id,
      "history"
    );

    return {
      snapshot,
      operation: historyOperation,
      finalDocument
    };
  }

  async function restoreSnapshot(snapshotId, options = {}) {
    const snapshot = await store.get(OBJECT_KINDS.SNAPSHOT, snapshotId);

    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    let operation = await createOperation({
      action: "restore_snapshot",
      riskLevel: "high",
      actor: {
        type: options.actorType || "system",
        name: options.actorName || "vault-core"
      },
      targets: snapshot.targetRefs || [],
      payload: {
        snapshotId
      },
      requiresBackup: false,
      reason: options.reason || "Restore from snapshot"
    });

    if (operation.status === OPERATION_STATUSES.PENDING_CONFIRMATION && options.autoApprove !== false) {
      operation = await approveOperation(operation.id, {
        actorType: options.actorType || "system",
        actorName: options.actorName || "vault-core"
      });
    }

    if (operation.status === OPERATION_STATUSES.PENDING_CONFIRMATION) {
      return {
        operation,
        restoredObject: null,
        restoredOperation: null
      };
    }

    const execution = await executeOperation(operation.id, async () => {
      const snapshotAbsolutePath = path.join(vaultRoot, snapshot.storagePath);
      const snapshotContent = await readJson(snapshotAbsolutePath);
      const restoreTarget = snapshot.restoreTarget || {};

      if (restoreTarget.kind !== OBJECT_KINDS.DOCUMENT) {
        throw new Error(`Unsupported restore target kind: ${restoreTarget.kind || "unknown"}`);
      }

      const restoredDocument = await store.put(OBJECT_KINDS.DOCUMENT, {
        ...snapshotContent,
        id: restoreTarget.id || snapshotContent.id,
        layer: restoreTarget.layer || "final",
        updatedAt: new Date().toISOString(),
        updatedBy: options.actorName || "vault-core"
      });

      let rolledBackOperationId = "";
      if (snapshot.sourceOperationId) {
        const rolledBack = await updateHistoricalOperation(snapshot.sourceOperationId, (historical) => ({
          ...historical,
          status: OPERATION_STATUSES.ROLLED_BACK,
          updatedAt: new Date().toISOString(),
          updatedBy: options.actorName || "vault-core",
          events: [
            ...(historical.events || []),
            createOperationEvent("rolled_back", {
              snapshotId,
              restoreOperationId: operation.id
            })
          ]
        }));
        rolledBackOperationId = rolledBack.id;
      }

      return {
        restoredKind: OBJECT_KINDS.DOCUMENT,
        restoredId: restoredDocument.id,
        restoredLayer: restoredDocument.layer,
        rolledBackOperationId
      };
    });

    const restoredObject =
      execution.result &&
      execution.result.restoredKind === OBJECT_KINDS.DOCUMENT
        ? await store.getByLocator(
            OBJECT_KINDS.DOCUMENT,
            execution.result.restoredId,
            execution.result.restoredLayer
          )
        : null;
    const restoredOperation = execution.result && execution.result.rolledBackOperationId
      ? await store.getByLocator(
          OBJECT_KINDS.OPERATION,
          execution.result.rolledBackOperationId,
          "history"
        )
      : null;
    const historyOperation = await store.getByLocator(
      OBJECT_KINDS.OPERATION,
      operation.id,
      "history"
    );

    return {
      operation: historyOperation,
      restoredObject,
      restoredOperation
    };
  }

  return {
    rootPath: vaultRoot,
    manifest,
    objects: {
      putRecord: (input) => store.put(OBJECT_KINDS.RECORD, input),
      putImageAsset: (input) => store.put(OBJECT_KINDS.IMAGE_ASSET, input),
      putLinkRecord: (input) => store.put(OBJECT_KINDS.LINK_RECORD, input),
      putFileAsset: (input) => store.put(OBJECT_KINDS.FILE_ASSET, input),
      putBrowserCard: (input) => store.put(OBJECT_KINDS.BROWSER_CARD, input),
      putDocument: (input) => store.put(OBJECT_KINDS.DOCUMENT, input),
      putTask: (input) => store.put(OBJECT_KINDS.TASK, input),
      putOperation: (input) => store.put(OBJECT_KINDS.OPERATION, input),
      putSnapshot: (input) => store.put(OBJECT_KINDS.SNAPSHOT, input),
      getRecord: (id) => store.get(OBJECT_KINDS.RECORD, id),
      getImageAsset: (id) => store.get(OBJECT_KINDS.IMAGE_ASSET, id),
      getLinkRecord: (id) => store.get(OBJECT_KINDS.LINK_RECORD, id),
      getFileAsset: (id) => store.get(OBJECT_KINDS.FILE_ASSET, id),
      getBrowserCard: (id) => store.get(OBJECT_KINDS.BROWSER_CARD, id),
      getDocument: (id, layer) => store.getByLocator(OBJECT_KINDS.DOCUMENT, id, layer),
      getTask: (id) => store.get(OBJECT_KINDS.TASK, id),
      getOperation: (id, bucket) => store.getByLocator(OBJECT_KINDS.OPERATION, id, bucket),
      getSnapshot: (id) => store.get(OBJECT_KINDS.SNAPSHOT, id),
      listRecords: () => store.list(OBJECT_KINDS.RECORD),
      listImageAssets: () => store.list(OBJECT_KINDS.IMAGE_ASSET),
      listLinkRecords: () => store.list(OBJECT_KINDS.LINK_RECORD),
      listFileAssets: () => store.list(OBJECT_KINDS.FILE_ASSET),
      listBrowserCards: () => store.list(OBJECT_KINDS.BROWSER_CARD),
      listDocuments: (layer) => store.list(OBJECT_KINDS.DOCUMENT, layer),
      listTasks: () => store.list(OBJECT_KINDS.TASK),
      listOperations: (bucket) => store.list(OBJECT_KINDS.OPERATION, bucket),
      listSnapshots: () => store.list(OBJECT_KINDS.SNAPSHOT),
      deleteRecord: (id) => store.removeByLocator(OBJECT_KINDS.RECORD, id, 'raw'),
      deleteImageAsset: (id) => store.removeByLocator(OBJECT_KINDS.IMAGE_ASSET, id, 'raw'),
      deleteLinkRecord: (id) => store.removeByLocator(OBJECT_KINDS.LINK_RECORD, id, 'raw'),
      deleteFileAsset: (id) => store.removeByLocator(OBJECT_KINDS.FILE_ASSET, id, 'raw'),
      deleteBrowserCard: (id) => store.removeByLocator(OBJECT_KINDS.BROWSER_CARD, id, 'raw'),
      deleteDocument: (id, layer) => store.removeByLocator(OBJECT_KINDS.DOCUMENT, id, layer),
      deleteTask: (id) => store.removeByLocator(OBJECT_KINDS.TASK, id, 'staging')
    },
    workflows: {
      createOperation,
      approveOperation,
      cancelOperation,
      executeOperation,
      publishDocumentToFinal,
      restoreSnapshot
    }
  };
}

module.exports = {
  createVault,
  openVault
};
