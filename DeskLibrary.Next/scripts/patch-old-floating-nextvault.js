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
  `function buildFloatingMenuPayload() {
  const settings = getSettings();
  const customPath = String(settings.floatingIconCustomPath || '').trim();
  const customIconUrl = customPath && fs.existsSync(customPath)
    ? pathToFileURL(customPath).href
    : '';
  const opacityRaw = Number(settings.floatingIconOpacity);
  const floatingIconOpacity = Number.isFinite(opacityRaw) ? Math.max(0.2, Math.min(1, opacityRaw)) : 1;
  let menuCenter = null;
  if (floatingMenuOpen) {
    const menuBounds = getFloatingBounds('visible', true);
    const anchor = floatingAnchorBoundsCache || getStableFloatingAnchorForMenuOpen();
    if (menuBounds && anchor) {
      const rawCenterX = (anchor.x + ((Number(anchor.width) || FLOATING_WINDOW_SIZE) / 2)) - menuBounds.x;
      const rawCenterY = (anchor.y + ((Number(anchor.height) || FLOATING_WINDOW_SIZE) / 2)) - menuBounds.y;
      const margin = 22;
      menuCenter = {
        x: Math.max(margin, Math.min(menuBounds.width - margin, Math.round(rawCenterX))),
        y: Math.max(margin, Math.min(menuBounds.height - margin, Math.round(rawCenterY)))
      };
    }
  }

  const dockSideRaw = String(settings.floatingDockSide || '').trim().toLowerCase();
  const dockSide = dockSideRaw === 'left' || dockSideRaw === 'right' ? dockSideRaw : 'free';

  return {
    open: floatingMenuOpen,
    dockSide,
    menuSide: floatingMenuSide,
    accumulation: getAccumulationState(),
    lastCapture: getLastCaptureState(),
    floatingIconOpacity,
    floatingIconCustomPath: customPath,
    floatingIconCustomUrl: customIconUrl,
    menuCenter,
    recentDailyRecords: getFloatingRecentRecords('daily', 4),
    recentCommonRecords: getFloatingRecentRecords('common', 4),
    recentAssets: getFloatingRecentAssets(4)
  };
}

function sendFloatingMenuState() {
  const payload = buildFloatingMenuPayload();

  const windows = [floatingWindow, floatingMenuWindow];
  windows.forEach((win) => {
    if (!win || win.isDestroyed() || !win.webContents || win.webContents.isDestroyed()) {
      return;
    }
    win.webContents.send('floating-menu-state', payload);
  });
}`,
  `function buildFloatingMenuPayload() {
  const settings = getSettings();
  const customPath = String(settings.floatingIconCustomPath || '').trim();
  const customIconUrl = customPath && fs.existsSync(customPath)
    ? pathToFileURL(customPath).href
    : '';
  const opacityRaw = Number(settings.floatingIconOpacity);
  const floatingIconOpacity = Number.isFinite(opacityRaw) ? Math.max(0.2, Math.min(1, opacityRaw)) : 1;
  let menuCenter = null;
  if (floatingMenuOpen) {
    const menuBounds = getFloatingBounds('visible', true);
    const anchor = floatingAnchorBoundsCache || getStableFloatingAnchorForMenuOpen();
    if (menuBounds && anchor) {
      const rawCenterX = (anchor.x + ((Number(anchor.width) || FLOATING_WINDOW_SIZE) / 2)) - menuBounds.x;
      const rawCenterY = (anchor.y + ((Number(anchor.height) || FLOATING_WINDOW_SIZE) / 2)) - menuBounds.y;
      const margin = 22;
      menuCenter = {
        x: Math.max(margin, Math.min(menuBounds.width - margin, Math.round(rawCenterX))),
        y: Math.max(margin, Math.min(menuBounds.height - margin, Math.round(rawCenterY)))
      };
    }
  }

  const dockSideRaw = String(settings.floatingDockSide || '').trim().toLowerCase();
  const dockSide = dockSideRaw === 'left' || dockSideRaw === 'right' ? dockSideRaw : 'free';

  return {
    open: floatingMenuOpen,
    dockSide,
    menuSide: floatingMenuSide,
    accumulation: getAccumulationState(),
    lastCapture: getLastCaptureState(),
    floatingIconOpacity,
    floatingIconCustomPath: customPath,
    floatingIconCustomUrl: customIconUrl,
    menuCenter,
    recentDailyRecords: getFloatingRecentRecords('daily', 4),
    recentCommonRecords: getFloatingRecentRecords('common', 4),
    recentAssets: getFloatingRecentAssets(4)
  };
}

async function buildNextVaultFloatingMenuPayload() {
  const settings = getSettings();
  const customPath = String(settings.floatingIconCustomPath || '').trim();
  const customIconUrl = customPath && fs.existsSync(customPath)
    ? pathToFileURL(customPath).href
    : '';
  const opacityRaw = Number(settings.floatingIconOpacity);
  const floatingIconOpacity = Number.isFinite(opacityRaw) ? Math.max(0.2, Math.min(1, opacityRaw)) : 1;
  let menuCenter = null;
  if (floatingMenuOpen) {
    const menuBounds = getFloatingBounds('visible', true);
    const anchor = floatingAnchorBoundsCache || getStableFloatingAnchorForMenuOpen();
    if (menuBounds && anchor) {
      const rawCenterX = (anchor.x + ((Number(anchor.width) || FLOATING_WINDOW_SIZE) / 2)) - menuBounds.x;
      const rawCenterY = (anchor.y + ((Number(anchor.height) || FLOATING_WINDOW_SIZE) / 2)) - menuBounds.y;
      const margin = 22;
      menuCenter = {
        x: Math.max(margin, Math.min(menuBounds.width - margin, Math.round(rawCenterX))),
        y: Math.max(margin, Math.min(menuBounds.height - margin, Math.round(rawCenterY)))
      };
    }
  }

  const dockSideRaw = String(settings.floatingDockSide || '').trim().toLowerCase();
  const dockSide = dockSideRaw === 'left' || dockSideRaw === 'right' ? dockSideRaw : 'free';
  const snapshot = await buildNextVaultSnapshot();
  const records = Array.isArray(snapshot?.records) ? snapshot.records.map((item) => normalizeRecord(item)) : [];
  const assets = Array.isArray(snapshot?.assets) ? snapshot.assets.map((item) => normalizeAsset(item)) : [];
  const lastRecord = records[0] || null;

  const mapRecordSummary = (item) => ({
    id: item.id,
    title: item.displayTitle || '未命名记录',
    preview: item.preview || '',
    contentType: item.contentType || 'text',
    sourceApp: item.sourceAppDisplay || '未知应用',
    updatedAt: item.lastCapturedAt || item.updatedAt || item.createdAt || ''
  });

  const mapAssetSummary = (item) => ({
    id: item.id,
    title: item.name || '未命名资源',
    preview: item.note || item.primaryPath || '',
    entryType: item.entryType || 'file',
    mode: item.mode || 'link',
    status: item.statusDisplay || '',
    updatedAt: item.updatedAt || item.createdAt || ''
  });

  return {
    open: floatingMenuOpen,
    dockSide,
    menuSide: floatingMenuSide,
    accumulation: getAccumulationState(),
    lastCapture: lastRecord
      ? {
        available: true,
        preview: buildRecordPreview(lastRecord),
        shortcutLabel: settings.deleteLastCaptureShortcut || ''
      }
      : {
        available: false,
        preview: '',
        shortcutLabel: settings.deleteLastCaptureShortcut || ''
      },
    floatingIconOpacity,
    floatingIconCustomPath: customPath,
    floatingIconCustomUrl: customIconUrl,
    menuCenter,
    recentDailyRecords: records
      .filter((item) => (item.category || 'daily') === 'daily')
      .slice(0, 4)
      .map(mapRecordSummary),
    recentCommonRecords: records
      .filter((item) => (item.category || 'daily') === 'common')
      .slice(0, 4)
      .map(mapRecordSummary),
    recentAssets: assets
      .slice(0, 4)
      .map(mapAssetSummary)
  };
}

function sendFloatingMenuState() {
  const windows = [floatingWindow, floatingMenuWindow];
  const emitPayload = (payload) => {
    windows.forEach((win) => {
      if (!win || win.isDestroyed() || !win.webContents || win.webContents.isDestroyed()) {
        return;
      }
      win.webContents.send('floating-menu-state', payload);
    });
  };

  if (isNextVaultReadEnabled()) {
    buildNextVaultFloatingMenuPayload()
      .then(emitPayload)
      .catch((error) => {
        legacyIngestBridgeState.lastError = error && error.message ? error.message : String(error || '');
        console.error('Send NextVault floating menu state failed:', error);
        emitPayload(buildFloatingMenuPayload());
      });
    return;
  }

  emitPayload(buildFloatingMenuPayload());
}`,
  "floating payload block"
);

source = replaceOrThrow(
  source,
  `  ipcMain.handle('floating-get-menu-state', async () => ({
    ...buildFloatingMenuPayload()
  }));`,
  `  ipcMain.handle('floating-get-menu-state', async () => {
    if (isNextVaultReadEnabled()) {
      try {
        return await buildNextVaultFloatingMenuPayload();
      } catch (error) {
        legacyIngestBridgeState.lastError = error && error.message ? error.message : String(error || '');
        console.error('Build NextVault floating menu payload failed:', error);
      }
    }

    return {
      ...buildFloatingMenuPayload()
    };
  });`,
  "floating-get-menu-state"
);

fs.writeFileSync(targetPath, source.replace(/\n/g, "\r\n"), "utf8");
console.log(`patched ${targetPath}`);
