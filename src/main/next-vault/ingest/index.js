const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

function toIsoParts(inputDate = new Date()) {
  const date = inputDate instanceof Date ? inputDate : new Date(inputDate);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return {
    year,
    month,
    day
  };
}

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function hashText(text) {
  return crypto.createHash("sha256").update(String(text || "")).digest("hex");
}

function sanitizeName(name) {
  return String(name || "resource").replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
}

function normalizeBrowserSource(browserSource = {}) {
  return {
    ...browserSource,
    type: browserSource.type || "",
    profileName: browserSource.profileName || browserSource.profile_name || "",
    userDataDir: browserSource.userDataDir || browserSource.user_data_dir || "",
    browserId: browserSource.browserId || browserSource.browser_id || "",
    label: browserSource.label || "",
    name: browserSource.name || "",
    displayName: browserSource.displayName || browserSource.display_name || ""
  };
}

function getBrowserSourceKey(browserSource = {}) {
  const normalized = normalizeBrowserSource(browserSource);
  if (normalized.type === "chrome_profile") {
    return `chrome_profile:${normalized.userDataDir}:${normalized.profileName || normalized.label}`;
  }
  if (normalized.type === "self_built") {
    return `self_built:${normalized.userDataDir || normalized.label}`;
  }
  return `${normalized.type || "unknown"}:${normalized.browserId || normalized.label || normalized.name || normalized.displayName}`;
}

async function copyFileIntoVault(sourcePath, targetPath) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
}

async function copyFileIntoExternalTarget(sourcePath, targetPath) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
}

async function statSafe(targetPath) {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
}

class IngestService {
  constructor(vault, options = {}) {
    this.vault = vault;
    this.options = options;
  }

  resolveBackupRootPath(input = {}) {
    const raw = String(
      input.backupRootPath
      || input.backupDir
      || this.options.backupRootPath
      || ""
    ).trim();
    return raw ? path.resolve(raw) : "";
  }

  async findRecordByContentHash(contentHash) {
    if (!contentHash) return null;
    const records = await this.vault.objects.listRecords();
    return records.find((record) => record?.stats?.contentHash === contentHash) || null;
  }

  async findImageByHash(sha256) {
    if (!sha256) return null;
    const images = await this.vault.objects.listImageAssets();
    return images.find((image) => image?.hash?.sha256 === sha256) || null;
  }

  async findFileAssetBySourcePath(sourcePath, mode) {
    if (!sourcePath) return null;
    const files = await this.vault.objects.listFileAssets();
    return files.find((file) => file?.mode === mode && file?.paths?.sourcePath === sourcePath) || null;
  }

  async findBrowserCard(domain, sourceKey) {
    if (!domain || !sourceKey) return null;
    const cards = await this.vault.objects.listBrowserCards();
    return (
      cards.find((card) => {
        const cardSourceKey = card?.extra?.sourceKey || getBrowserSourceKey(card?.browserSource || {});
        return card?.domain === domain && cardSourceKey === sourceKey;
      }) || null
    );
  }

  async captureText(input = {}) {
    const now = new Date(input.capturedAt || Date.now()).toISOString();
    const text = String(input.text || "").replace(/\r\n/g, "\n").trim();

    if (!text) {
      throw new Error("Text capture requires non-empty text");
    }

    const contentHash = hashText(text);
    const existing = await this.findRecordByContentHash(contentHash);
    if (existing) {
      return this.vault.objects.putRecord({
        ...existing,
        id: existing.id,
        text,
        source: {
          ...(existing.source || {}),
          type: input.sourceType || existing?.source?.type || "clipboard",
          app: input.sourceApp || existing?.source?.app || "",
          windowTitle: input.windowTitle || existing?.source?.windowTitle || ""
        },
        capture: {
          ...(existing.capture || {}),
          method: input.captureMethod || existing?.capture?.method || "auto",
          category: input.category || existing?.capture?.category || "daily"
        },
        stats: {
          ...(existing.stats || {}),
          contentHash,
          hitCount: Math.max(1, Number(existing?.stats?.hitCount || 1) + 1)
        },
        note: input.note || existing.note || "",
        updatedAt: now
      });
    }

    return this.vault.objects.putRecord({
      recordType: "text",
      text,
      language: input.language || "zh-CN",
      source: {
        type: input.sourceType || "clipboard",
        app: input.sourceApp || "",
        windowTitle: input.windowTitle || ""
      },
      capture: {
        method: input.captureMethod || "auto",
        category: input.category || "daily"
      },
      stats: {
        hitCount: 1,
        contentHash
      },
      note: input.note || "",
      createdAt: now,
      updatedAt: now
    });
  }

  async captureImage(input = {}) {
    const buffer = Buffer.isBuffer(input.buffer) ? input.buffer : null;

    if (!buffer || !buffer.length) {
      throw new Error("Image capture requires a non-empty buffer");
    }

    const extension = String(input.extension || ".png").startsWith(".")
      ? String(input.extension || ".png").toLowerCase()
      : `.${String(input.extension || "png").toLowerCase()}`;
    const mimeType = input.mimeType || "image/png";
    const capturedAt = new Date(input.capturedAt || Date.now());
    const capturedAtIso = capturedAt.toISOString();
    const sha256 = hashBuffer(buffer);
    const existing = await this.findImageByHash(sha256);
    if (existing) {
      return this.vault.objects.putImageAsset({
        ...existing,
        id: existing.id,
        source: {
          ...(existing.source || {}),
          type: input.sourceType || existing?.source?.type || "clipboard",
          app: input.sourceApp || existing?.source?.app || "",
          windowTitle: input.windowTitle || existing?.source?.windowTitle || ""
        },
        vision: {
          ...(existing.vision || {}),
          ocrText: input.ocrText || existing?.vision?.ocrText || "",
          caption: input.caption || existing?.vision?.caption || "",
          labels: Array.from(new Set([...(existing?.vision?.labels || []), ...(Array.isArray(input.labels) ? input.labels : [])]))
        },
        note: input.note || existing.note || "",
        updatedAt: capturedAtIso
      });
    }
    const { year, month, day } = toIsoParts(capturedAt);
    const id = input.id || "";
    const fileId = id || `img_${crypto.randomUUID().replace(/-/g, "")}`;
    const fileName = `${fileId}${extension}`;
    const relativePath = path.join("raw", "images", "files", year, month, day, fileName);
    const absolutePath = path.join(this.vault.rootPath, relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);

    return this.vault.objects.putImageAsset({
      id,
      file: {
        path: relativePath,
        name: fileName,
        extension,
        size: buffer.length,
        mimeType
      },
      hash: {
        sha256
      },
      source: {
        type: input.sourceType || "clipboard",
        app: input.sourceApp || "",
        windowTitle: input.windowTitle || ""
      },
      vision: {
        ocrText: input.ocrText || "",
        caption: input.caption || "",
        labels: Array.isArray(input.labels) ? input.labels : []
      },
      note: input.note || "",
      createdAt: capturedAtIso,
      updatedAt: capturedAtIso
    });
  }

  async captureClipboardPayload(payload = {}, options = {}) {
    const contentType = String(payload.contentType || "").trim().toLowerCase();

    if (contentType === "text") {
      return this.captureText({
        text: payload.textContent || "",
        language: options.language || "zh-CN",
        sourceType: options.sourceType || "clipboard",
        sourceApp: options.sourceApp || "",
        windowTitle: options.windowTitle || "",
        captureMethod: options.captureMethod || "auto",
        category: options.category || "daily",
        note: options.note || "",
        capturedAt: options.capturedAt
      });
    }

    if (contentType === "image") {
      return this.captureImage({
        buffer: payload.imageBuffer,
        extension: options.extension || ".png",
        mimeType: options.mimeType || "image/png",
        sourceType: options.sourceType || "clipboard",
        sourceApp: options.sourceApp || "",
        windowTitle: options.windowTitle || "",
        ocrText: options.ocrText || "",
        caption: options.caption || "",
        labels: options.labels || [],
        note: options.note || "",
        capturedAt: options.capturedAt
      });
    }

    throw new Error(`Unsupported clipboard payload contentType: ${contentType || "unknown"}`);
  }

  async importFile(input = {}) {
    const sourcePath = path.resolve(String(input.sourcePath || "").trim());
    const mode = input.mode === "backup" ? "backup" : "link";

    if (!sourcePath) {
      throw new Error("File import requires sourcePath");
    }

    const sourceStats = await statSafe(sourcePath);
    if (!sourceStats) {
      throw new Error(`Source path not found: ${sourcePath}`);
    }

    const entryType = sourceStats.isDirectory() ? "folder" : "file";
    const extension = entryType === "file" ? path.extname(sourcePath).toLowerCase() : "";
    const importedAt = new Date(input.importedAt || Date.now());
    const importedAtIso = importedAt.toISOString();
    const existing = await this.findFileAssetBySourcePath(sourcePath, mode);
    if (existing) {
      return this.vault.objects.putFileAsset({
        ...existing,
        id: existing.id,
        note: input.note || existing.note || "",
        state: {
          ...(existing.state || {}),
          exists: true,
          sourceExists: true,
          backupExists: Boolean(existing?.paths?.storedPath)
        },
        updatedAt: importedAtIso
      });
    }
    const { year, month, day } = toIsoParts(importedAt);
    const id = input.id || "";
    const fileId = id || `file_${crypto.randomUUID().replace(/-/g, "")}`;
    let storedPath = "";
    let primaryPath = sourcePath;

    if (mode === "backup") {
      const baseName = sanitizeName(path.basename(sourcePath));
      if (entryType === "folder") {
        throw new Error("Folder backup is not supported in the current ingest MVP");
      }

      const configuredBackupRoot = this.resolveBackupRootPath(input);
      if (configuredBackupRoot) {
        const absoluteStoredPath = path.join(
          configuredBackupRoot,
          year,
          month,
          day,
          `${fileId}-${baseName}`
        );
        await copyFileIntoExternalTarget(sourcePath, absoluteStoredPath);
        storedPath = absoluteStoredPath;
        primaryPath = absoluteStoredPath;
      } else {
        const relativeStoredPath = path.join(
          "raw",
          "files",
          "backups",
          year,
          month,
          day,
          `${fileId}-${baseName}`
        );
        const absoluteStoredPath = path.join(this.vault.rootPath, relativeStoredPath);
        await copyFileIntoVault(sourcePath, absoluteStoredPath);
        storedPath = relativeStoredPath;
        primaryPath = relativeStoredPath;
      }
    }

    return this.vault.objects.putFileAsset({
      id,
      entryType,
      mode,
      name: path.basename(sourcePath),
      extension,
      paths: {
        sourcePath,
        storedPath,
        primaryPath
      },
      state: {
        exists: true,
        sourceExists: true,
        backupExists: Boolean(storedPath)
      },
      note: input.note || "",
      createdAt: importedAtIso,
      updatedAt: importedAtIso
    });
  }

  async importFiles(entries = [], mode = "link", options = {}) {
    const normalizedEntries = Array.isArray(entries)
      ? entries
          .map((entry) =>
            typeof entry === "string"
              ? { sourcePath: entry }
              : entry && typeof entry === "object"
                ? entry
                : null
          )
          .filter(Boolean)
      : [];

    const imported = [];
    for (const entry of normalizedEntries) {
      const importedAsset = await this.importFile({
        ...entry,
        mode: entry.mode || mode,
        importedAt: options.importedAt || entry.importedAt,
        note: entry.note || options.note || ""
      });
      imported.push(importedAsset);
    }

    return imported;
  }

  async importBrowserCards(cards = []) {
    const normalizedCards = Array.isArray(cards) ? cards : [];
    const imported = [];

    for (const card of normalizedCards) {
      if (!card || typeof card !== "object") {
        continue;
      }

      const now = new Date().toISOString();
      const browserSource = normalizeBrowserSource(card.browserSource || card.browser_source || {});
      const sourceKey = card.sourceKey || getBrowserSourceKey(browserSource);
      const existing = await this.findBrowserCard(card.domain || "", sourceKey);
      const importedCard = await this.vault.objects.putBrowserCard({
        ...(existing || {}),
        id: existing?.id || card.id || "",
        domain: card.domain || "",
        openUrl: card.openUrl || card.open_url || "",
        name: card.name || "",
        remark: card.remark || existing?.remark || "",
        username: card.username || existing?.username || "",
        password: card.password || existing?.password || "",
        cookies: Array.isArray(card.cookies) ? card.cookies : [],
        cookieNames: Array.isArray(card.cookieNames)
          ? card.cookieNames
          : Array.isArray(card.cookies)
            ? card.cookies.map((item) => item && item.name).filter(Boolean)
            : [],
        browserSource,
        createdAt: existing?.createdAt || card.createdAt || now,
        updatedAt: now,
        extra: {
          ...(existing?.extra || {}),
          sourceType: card.sourceType || "",
          sourceLabel: card.sourceLabel || "",
          sourceKey,
          url: card.url || "",
          cookieCount: Number(card.cookieCount || 0),
          savedAt: card.saved_at || "",
          lastUsedAt: card.last_used_at || "",
          lastUsedMethod: card.last_used_method || "",
          testTitle: card.test_title || "",
          testOk: typeof card.test_ok === "boolean" ? card.test_ok : null
        }
      });
      imported.push(importedCard);
    }

    return imported;
  }
}

function createIngestService(vault, options = {}) {
  return new IngestService(vault, options);
}

module.exports = {
  IngestService,
  createIngestService
};
