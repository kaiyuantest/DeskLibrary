const path = require("node:path");

const { createVault, openVault } = require("../vault-core");
const { createIngestService } = require("./index");

async function ensureVault(rootPath, options = {}) {
  try {
    return await openVault(rootPath);
  } catch (error) {
    const message = error && error.message ? error.message : "";
    if (!message.includes("vault.json not found")) {
      throw error;
    }

    return createVault({
      rootPath,
      displayName: options.displayName || path.basename(rootPath),
      defaultLanguage: options.defaultLanguage || "zh-CN",
      capabilities: options.capabilities || {}
    });
  }
}

class LegacyIngestBridge {
  constructor(vault, ingest, options = {}) {
    this.vault = vault;
    this.ingest = ingest;
    this.options = options;
  }

  async ingestClipboardPayload(payload = {}, context = {}) {
    const sourceContext = context.sourceContext && typeof context.sourceContext === "object"
      ? context.sourceContext
      : {};

    return this.ingest.captureClipboardPayload(payload, {
      sourceType: context.sourceType || "clipboard",
      sourceApp: sourceContext.sourceApp || context.sourceApp || "",
      windowTitle: sourceContext.windowTitle || context.windowTitle || "",
      captureMethod: context.captureMethod || "manual",
      category: context.category || "daily",
      note: context.note || "",
      capturedAt: context.capturedAt,
      language: context.language || "zh-CN",
      extension: context.extension || ".png",
      mimeType: context.mimeType || "image/png",
      ocrText: context.ocrText || "",
      caption: context.caption || "",
      labels: context.labels || []
    });
  }

  async importAssets(payload = {}) {
    const mode = payload.mode === "backup" ? "backup" : "link";
    const paths = Array.isArray(payload.paths) ? payload.paths : [];

    return this.ingest.importFiles(
      paths.map((sourcePath) => ({ sourcePath })),
      mode,
      {
        importedAt: payload.importedAt,
        note: payload.note || "",
        backupRootPath: payload.backupRootPath || payload.backupDir || this.options.backupRootPath || ""
      }
    );
  }

  async ingestTextRecord(text, context = {}) {
    return this.ingest.captureText({
      text,
      language: context.language || "zh-CN",
      sourceType: context.sourceType || "manual",
      sourceApp: context.sourceApp || "",
      windowTitle: context.windowTitle || "",
      captureMethod: context.captureMethod || "manual",
      category: context.category || "daily",
      note: context.note || "",
      capturedAt: context.capturedAt
    });
  }

  async importBrowserCards(payload = {}) {
    const cards = Array.isArray(payload.cards) ? payload.cards : [];
    return this.ingest.importBrowserCards(cards);
  }
}

async function createLegacyIngestBridge(options = {}) {
  const vault = await ensureVault(options.vaultRootPath, {
    displayName: options.displayName,
    defaultLanguage: options.defaultLanguage,
    capabilities: options.capabilities
  });
  const ingest = createIngestService(vault, {
    backupRootPath: options.backupRootPath || ""
  });

  return new LegacyIngestBridge(vault, ingest, options);
}

module.exports = {
  LegacyIngestBridge,
  createLegacyIngestBridge,
  ensureVault
};
