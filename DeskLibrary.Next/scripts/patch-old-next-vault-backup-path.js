const fs = require("node:fs");

const targetPath = "E:\\project\\Click2Save\\Click2Save.Electron\\src\\main\\index.js";

function replaceOrThrow(source, before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Patch anchor not found: ${label}`);
  }
  return source.replace(before, after);
}

let source = fs.readFileSync(targetPath, "utf8").replace(/\r\n/g, "\n");

source = replaceOrThrow(
  source,
  `function getNextVaultMirrorStatus() {
  return {
    ...legacyIngestBridgeState,
    ready: Boolean(legacyIngestBridge),
    rootPath: legacyIngestBridgeState.rootPath || getNextVaultRootPath(),
    readEnabled: isNextVaultReadEnabled()
  };
}`,
  `function getNextVaultMirrorStatus() {
  return {
    ...legacyIngestBridgeState,
    ready: Boolean(legacyIngestBridge),
    rootPath: legacyIngestBridgeState.rootPath || getNextVaultRootPath(),
    readEnabled: isNextVaultReadEnabled()
  };
}

function resolveNextVaultStoredPath(rawPath = '') {
  const clean = String(rawPath || '').trim();
  if (!clean || !legacyIngestBridge?.vault?.rootPath) {
    return '';
  }
  return path.isAbsolute(clean) ? clean : path.join(legacyIngestBridge.vault.rootPath, clean);
}

function getConfiguredAssetBackupRoot() {
  const raw = String(getSettings().assetBackupPath || '').trim();
  return raw ? path.resolve(raw) : '';
}`,
  "helpers before search"
);

source = replaceOrThrow(
  source,
  `      const sourcePath = asset?.paths?.sourcePath || '';
      const storedPath = asset?.paths?.storedPath
        ? path.join(legacyIngestBridge.vault.rootPath, asset.paths.storedPath)
        : '';
      const primaryPath = asset?.paths?.primaryPath
        ? (asset.mode === 'backup'
          ? path.join(legacyIngestBridge.vault.rootPath, asset.paths.primaryPath)
          : asset.paths.primaryPath)
        : '';`,
  `      const sourcePath = asset?.paths?.sourcePath || '';
      const storedPath = asset?.paths?.storedPath
        ? resolveNextVaultStoredPath(asset.paths.storedPath)
        : '';
      const primaryPath = asset?.paths?.primaryPath
        ? (asset.mode === 'backup'
          ? resolveNextVaultStoredPath(asset.paths.primaryPath)
          : asset.paths.primaryPath)
        : '';`,
  "snapshot asset path mapping"
);

source = replaceOrThrow(
  source,
  `async function removeManagedNextVaultPath(targetPath) {
  const raw = String(targetPath || '').trim();
  const rootPath = legacyIngestBridge?.vault?.rootPath;
  if (!raw || !rootPath) {
    return false;
  }

  const resolvedRoot = path.resolve(rootPath);
  const resolvedTarget = path.resolve(path.isAbsolute(raw) ? raw : path.join(rootPath, raw));
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(\`\${resolvedRoot}\${path.sep}\`)) {
    return false;
  }

  try {
    await fsp.unlink(resolvedTarget);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }
    console.warn('Remove managed NextVault path failed:', resolvedTarget, error);
    return false;
  }
}`,
  `async function removeManagedNextVaultPath(targetPath) {
  const raw = String(targetPath || '').trim();
  const rootPath = legacyIngestBridge?.vault?.rootPath;
  if (!raw || !rootPath) {
    return false;
  }

  const resolvedRoot = path.resolve(rootPath);
  const configuredBackupRoot = getConfiguredAssetBackupRoot();
  const allowedRoots = [resolvedRoot];
  if (configuredBackupRoot) {
    allowedRoots.push(configuredBackupRoot);
  }

  const resolvedTarget = path.resolve(path.isAbsolute(raw) ? raw : path.join(rootPath, raw));
  const allowed = allowedRoots.some((allowedRoot) =>
    resolvedTarget === allowedRoot || resolvedTarget.startsWith(\`\${allowedRoot}\${path.sep}\`)
  );
  if (!allowed) {
    return false;
  }

  try {
    await fsp.rm(resolvedTarget, { recursive: true, force: false });
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }
    console.warn('Remove managed NextVault path failed:', resolvedTarget, error);
    return false;
  }
}`,
  "remove managed path"
);

source = replaceOrThrow(
  source,
  `      if (isNextVaultReadEnabled() && legacyIngestBridge) {
        const imported = await legacyIngestBridge.importAssets({
          mode,
          paths
        });`,
  `      if (isNextVaultReadEnabled() && legacyIngestBridge) {
        const imported = await legacyIngestBridge.importAssets({
          mode,
          paths,
          backupRootPath: getConfiguredAssetBackupRoot()
        });`,
  "import-assets payload"
);

fs.writeFileSync(targetPath, source.replace(/\n/g, "\r\n"), "utf8");
console.log(`patched ${targetPath}`);
