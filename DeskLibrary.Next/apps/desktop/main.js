const path = require("node:path");
const fs = require("node:fs/promises");
const os = require("node:os");
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");

const { createVault, openVault } = require("../../packages/vault-core/src");

const APP_NAME = "DeskLibrary.Next";
const APPDATA_ROOT =
  process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
const LOCALAPPDATA_ROOT =
  process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
const RUNTIME_ROOT = path.join(APPDATA_ROOT, "DeskLibrary.Next");
const SESSION_ROOT = path.join(LOCALAPPDATA_ROOT, "DeskLibrary.Next");

app.setPath("userData", path.join(RUNTIME_ROOT, "userData"));
app.setPath("sessionData", path.join(SESSION_ROOT, "sessionData"));

let mainWindow = null;
let currentVaultPath = "";

function getDefaultVaultPath() {
  const override = String(process.env.DESKLIBRARY_NEXT_VAULT_PATH || "").trim();
  if (override) {
    return override;
  }
  return path.join(app.getPath("documents"), "DeskLibrary.NextVault");
}

async function ensureVaultAt(targetPath) {
  try {
    return await openVault(targetPath);
  } catch (error) {
    const message = error && error.message ? error.message : "";
    if (!message.includes("vault.json not found")) {
      throw error;
    }
    return createVault({
      rootPath: targetPath,
      displayName: "DeskLibrary Next Vault"
    });
  }
}

async function readImagePreview(vaultRoot, relativePath) {
  if (!relativePath) return "";
  try {
    const absolutePath = path.join(vaultRoot, relativePath);
    const buffer = await fs.readFile(absolutePath);
    const ext = path.extname(relativePath).toLowerCase();
    const mimeType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}

async function buildVaultSnapshot(vaultPath) {
  const vault = await ensureVaultAt(vaultPath);
  const [records, images, files, cards, stagingDocs, finalDocs] = await Promise.all([
    vault.objects.listRecords(),
    vault.objects.listImageAssets(),
    vault.objects.listFileAssets(),
    vault.objects.listBrowserCards(),
    vault.objects.listDocuments("staging"),
    vault.objects.listDocuments("final")
  ]);

  const recordSamples = records
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
    .slice(0, 8)
    .map((record) => ({
      id: record.id,
      title: (record.text || "").split(/\r?\n/)[0] || "空文本",
      preview: (record.text || "").slice(0, 120),
      sourceApp: record?.source?.app || "",
      updatedAt: record.updatedAt || record.createdAt || ""
    }));

  const imageSamples = await Promise.all(
    images
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      .slice(0, 6)
      .map(async (image) => ({
        id: image.id,
        name: image?.file?.name || image.id,
        caption: image?.vision?.caption || "",
        updatedAt: image.updatedAt || image.createdAt || "",
        previewUrl: await readImagePreview(vault.rootPath, image?.file?.path || "")
      }))
  );

  const fileSamples = files
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
    .slice(0, 8)
    .map((file) => ({
      id: file.id,
      name: file.name || "",
      mode: file.mode || "",
      entryType: file.entryType || "",
      sourcePath: file?.paths?.sourcePath || "",
      primaryPath: file?.paths?.primaryPath || ""
    }));

  const cardSamples = cards
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
    .slice(0, 8)
    .map((card) => ({
      id: card.id,
      name: card.name || "",
      domain: card.domain || "",
      sourceType: card?.extra?.sourceType || card?.browserSource?.type || ""
    }));

  return {
    vaultPath: vault.rootPath,
    manifest: vault.manifest,
    counts: {
      rawRecords: records.length,
      rawImages: images.length,
      rawFiles: files.length,
      rawBrowserCards: cards.length,
      stagingDocuments: stagingDocs.length,
      finalDocuments: finalDocs.length
    },
    samples: {
      records: recordSamples,
      images: imageSamples,
      files: fileSamples,
      cards: cardSamples
    }
  };
}

async function createMainWindow() {
  currentVaultPath = getDefaultVaultPath();
  await ensureVaultAt(currentVaultPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1080,
    minHeight: 720,
    title: APP_NAME,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  await mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

ipcMain.handle("desktop:get-vault-snapshot", async () => {
  return buildVaultSnapshot(currentVaultPath);
});

ipcMain.handle("desktop:select-vault-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "选择 DeskLibrary.NextVault 目录",
    properties: ["openDirectory"]
  });

  if (result.canceled || !result.filePaths?.[0]) {
    return {
      ok: false,
      cancelled: true
    };
  }

  currentVaultPath = result.filePaths[0];
  await ensureVaultAt(currentVaultPath);
  return {
    ok: true,
    snapshot: await buildVaultSnapshot(currentVaultPath)
  };
});

ipcMain.handle("desktop:open-vault-folder", async () => {
  if (!currentVaultPath) return { ok: false };
  await shell.openPath(currentVaultPath);
  return { ok: true };
});

app.whenReady().then(async () => {
  app.setName(APP_NAME);
  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
