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
  `  const mappedImageRecords = await Promise.all(
    vaultImages.map(async (image, index) => ({
      id: 200000 + index,
      nextVaultId: image.id,
      contentType: 'image',
      textContent: '',
      imagePath: path.join(legacyIngestBridge.vault.rootPath, image?.file?.path || ''),
      imageDataUrl: await readImageDataUrlFromVault(image?.file?.path || ''),
      contentHash: image?.hash?.sha256 || '',
      captureMethod: 'manual',
      category: 'daily',
      hitCount: 1,
      lastCapturedAt: image.updatedAt || image.createdAt || '',
      sourceApp: image?.source?.app || '',
      windowTitle: image?.source?.windowTitle || '',
      editableNote: image.note || '',
      createdAt: image.createdAt,
      createdDate: formatLocalDateString(image.createdAt),
      updatedAt: image.updatedAt,
      source: 'next-vault'
    }))
  );`,
  `  const mappedImageRecords = await Promise.all(
    vaultImages.map(async (image, index) => ({
      id: 200000 + index,
      nextVaultId: image.id,
      contentType: 'image',
      textContent: '',
      imagePath: path.join(legacyIngestBridge.vault.rootPath, image?.file?.path || ''),
      imageDataUrl: await readImageDataUrlFromVault(image?.file?.path || ''),
      contentHash: image?.hash?.sha256 || '',
      captureMethod: image?.capture?.method || 'manual',
      category: image?.capture?.category || 'daily',
      hitCount: Number(image?.stats?.hitCount || 1),
      lastCapturedAt: image.updatedAt || image.createdAt || '',
      sourceApp: image?.source?.app || '',
      windowTitle: image?.source?.windowTitle || '',
      editableNote: image.note || '',
      createdAt: image.createdAt,
      createdDate: formatLocalDateString(image.createdAt),
      updatedAt: image.updatedAt,
      source: 'next-vault'
    }))
  );`,
  "mapped image records"
);

source = replaceOrThrow(
  source,
  `function ensureApiConfigTemplate() {`,
  `async function buildNextVaultUiMaps() {
  if (!isNextVaultReadEnabled() || !legacyIngestBridge?.vault?.objects) {
    return null;
  }

  const snapshot = await buildNextVaultSnapshot();
  if (!snapshot) {
    return null;
  }

  return {
    snapshot,
    records: new Map((snapshot.records || []).map((item) => [String(item.id), item])),
    assets: new Map((snapshot.assets || []).map((item) => [String(item.id), item])),
    browserCards: new Map((snapshot.browserCards || []).map((item) => [String(item.id), item]))
  };
}

async function findNextVaultRecordByUiId(uiId) {
  const lookup = await buildNextVaultUiMaps();
  const uiRecord = lookup?.records?.get(String(uiId)) || null;
  if (!uiRecord?.nextVaultId || !legacyIngestBridge?.vault?.objects) {
    return null;
  }

  if (uiRecord.contentType === 'image') {
    const image = await legacyIngestBridge.vault.objects.getImageAsset(uiRecord.nextVaultId);
    return image ? { uiRecord, kind: 'image', object: image } : null;
  }

  const record = await legacyIngestBridge.vault.objects.getRecord(uiRecord.nextVaultId);
  return record ? { uiRecord, kind: 'text', object: record } : null;
}

async function findNextVaultAssetByUiId(uiId) {
  const lookup = await buildNextVaultUiMaps();
  const uiAsset = lookup?.assets?.get(String(uiId)) || null;
  if (!uiAsset?.nextVaultId || !legacyIngestBridge?.vault?.objects) {
    return null;
  }

  const asset = await legacyIngestBridge.vault.objects.getFileAsset(uiAsset.nextVaultId);
  return asset ? { uiAsset, asset } : null;
}

async function findNextVaultBrowserCardByUiId(uiId) {
  const lookup = await buildNextVaultUiMaps();
  const uiCard = lookup?.browserCards?.get(String(uiId)) || null;
  if (!uiCard?.id || !legacyIngestBridge?.vault?.objects) {
    return null;
  }

  const card = await legacyIngestBridge.vault.objects.getBrowserCard(uiCard.id);
  return card ? { uiCard, card } : null;
}

async function removeManagedNextVaultPath(targetPath) {
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
}

async function updateNextVaultRecordContent(payload = {}) {
  const target = await findNextVaultRecordByUiId(payload.id);
  if (!target) {
    return null;
  }
  if (target.kind !== 'text') {
    throw new Error('仅文本记录支持编辑正文');
  }

  return legacyIngestBridge.vault.objects.putRecord({
    ...target.object,
    id: target.object.id,
    text: String(payload.textContent || ''),
    updatedAt: new Date().toISOString()
  });
}

async function updateNextVaultRecordNote(payload = {}) {
  const target = await findNextVaultRecordByUiId(payload.id);
  if (!target) {
    return null;
  }

  const now = new Date().toISOString();
  if (target.kind === 'image') {
    return legacyIngestBridge.vault.objects.putImageAsset({
      ...target.object,
      id: target.object.id,
      note: String(payload.editableNote || ''),
      updatedAt: now
    });
  }

  return legacyIngestBridge.vault.objects.putRecord({
    ...target.object,
    id: target.object.id,
    note: String(payload.editableNote || ''),
    updatedAt: now
  });
}

async function updateNextVaultRecordCategory(uiId, category) {
  const target = await findNextVaultRecordByUiId(uiId);
  if (!target) {
    return null;
  }

  const nextCategory = category === 'common' ? 'common' : 'daily';
  const now = new Date().toISOString();
  const nextCapture = {
    ...(target.object.capture || {}),
    category: nextCategory
  };

  if (target.kind === 'image') {
    return legacyIngestBridge.vault.objects.putImageAsset({
      ...target.object,
      id: target.object.id,
      capture: nextCapture,
      updatedAt: now
    });
  }

  return legacyIngestBridge.vault.objects.putRecord({
    ...target.object,
    id: target.object.id,
    capture: nextCapture,
    updatedAt: now
  });
}

async function deleteNextVaultRecordByUiId(uiId) {
  const target = await findNextVaultRecordByUiId(uiId);
  if (!target) {
    return false;
  }

  if (target.kind === 'image') {
    await removeManagedNextVaultPath(target.object?.file?.path || '');
    await legacyIngestBridge.vault.objects.deleteImageAsset(target.object.id);
    return true;
  }

  await legacyIngestBridge.vault.objects.deleteRecord(target.object.id);
  return true;
}

async function updateNextVaultAssetNote(payload = {}) {
  const target = await findNextVaultAssetByUiId(payload.id);
  if (!target) {
    return null;
  }

  return legacyIngestBridge.vault.objects.putFileAsset({
    ...target.asset,
    id: target.asset.id,
    note: String(payload.note || ''),
    updatedAt: new Date().toISOString()
  });
}

async function deleteNextVaultAssetByUiId(uiId) {
  const target = await findNextVaultAssetByUiId(uiId);
  if (!target) {
    return false;
  }

  await removeManagedNextVaultPath(target.asset?.paths?.storedPath || '');
  await legacyIngestBridge.vault.objects.deleteFileAsset(target.asset.id);
  return true;
}

async function updateNextVaultBrowserCardByUiId(uiId, updater) {
  const target = await findNextVaultBrowserCardByUiId(uiId);
  if (!target) {
    return null;
  }

  const nextPartial = updater({ ...target.card }, { ...target.uiCard });
  if (!nextPartial || typeof nextPartial !== 'object') {
    throw new Error('浏览器卡片更新失败');
  }

  const mergedExtra = nextPartial.extra
    ? {
      ...(target.card.extra || {}),
      ...nextPartial.extra
    }
    : (target.card.extra || {});

  return legacyIngestBridge.vault.objects.putBrowserCard({
    ...target.card,
    ...nextPartial,
    id: target.card.id,
    extra: mergedExtra,
    updatedAt: new Date().toISOString()
  });
}

async function updateNextVaultBrowserCard(payload = {}) {
  return updateNextVaultBrowserCardByUiId(payload.id, () => ({
    name: String(payload.name || ''),
    remark: String(payload.remark || ''),
    openUrl: String(payload.openUrl || ''),
    username: String(payload.username || ''),
    password: String(payload.password || '')
  }));
}

async function deleteNextVaultBrowserCardByUiId(uiId) {
  const target = await findNextVaultBrowserCardByUiId(uiId);
  if (!target) {
    return false;
  }

  await legacyIngestBridge.vault.objects.deleteBrowserCard(target.card.id);
  return true;
}

function ensureApiConfigTemplate() {`,
  "next vault helpers"
);

source = replaceOrThrow(
  source,
  `function sendSnapshot(statusText) {
  if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
  const records = storage.getAllRecords().map(normalizeRecord);
  const assets = storage.getAllAssets().map(normalizeAsset);
  const browserCards = storage.getAllBrowserCards().map(normalizeBrowserCard);
  mainWindow.webContents.send('snapshot', {
    records,
    assets,
    browserCards,
    dateFilters: storage.getDateFilters(),
    categoryFilters: storage.getCategoryFilters(),
    settings: getSettings(),
    statusText: statusText || defaultStatusText()
  });
}`,
  `function sendSnapshot(statusText) {
  if (!mainWindow || mainWindow.webContents.isDestroyed()) return;

  if (isNextVaultReadEnabled()) {
    buildNextVaultSnapshot()
      .then((snapshot) => {
        if (!snapshot || !mainWindow || mainWindow.webContents.isDestroyed()) {
          return;
        }
        mainWindow.webContents.send('snapshot', {
          ...snapshot,
          settings: getSettings(),
          statusText: statusText || snapshot.statusText || defaultStatusText()
        });
      })
      .catch((error) => {
        legacyIngestBridgeState.lastError = error && error.message ? error.message : String(error || '');
        console.error('Send NextVault snapshot failed:', error);
      });
    return;
  }

  const records = storage.getAllRecords().map(normalizeRecord);
  const assets = storage.getAllAssets().map(normalizeAsset);
  const browserCards = storage.getAllBrowserCards().map(normalizeBrowserCard);
  mainWindow.webContents.send('snapshot', {
    records,
    assets,
    browserCards,
    dateFilters: storage.getDateFilters(),
    categoryFilters: storage.getCategoryFilters(),
    settings: getSettings(),
    statusText: statusText || defaultStatusText()
  });
}`,
  "send snapshot"
);

const replacements = [
  {
    label: "update-record-content",
    before: `  ipcMain.handle('update-record-content', async (_, payload) => {
    const result = storage.updateRecord(payload.id, { textContent: payload.textContent || '' });
    sendSnapshot('正文已保存');
    return { ok: !!result };
  });`,
    after: `  ipcMain.handle('update-record-content', async (_, payload) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      try {
        const result = await updateNextVaultRecordContent(payload);
        sendSnapshot(result ? '正文已保存' : '记录不存在');
        return { ok: !!result, message: result ? '' : '记录不存在' };
      } catch (error) {
        return { ok: false, message: error && error.message ? error.message : '正文保存失败' };
      }
    }

    const result = storage.updateRecord(payload.id, { textContent: payload.textContent || '' });
    sendSnapshot('正文已保存');
    return { ok: !!result };
  });`
  },
  {
    label: "update-record-note",
    before: `  ipcMain.handle('update-record-note', async (_, payload) => {
    const result = storage.updateRecord(payload.id, { editableNote: payload.editableNote || '' });
    sendSnapshot('备注已保存');
    return { ok: !!result };
  });`,
    after: `  ipcMain.handle('update-record-note', async (_, payload) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      try {
        const result = await updateNextVaultRecordNote(payload);
        sendSnapshot(result ? '备注已保存' : '记录不存在');
        return { ok: !!result, message: result ? '' : '记录不存在' };
      } catch (error) {
        return { ok: false, message: error && error.message ? error.message : '备注保存失败' };
      }
    }

    const result = storage.updateRecord(payload.id, { editableNote: payload.editableNote || '' });
    sendSnapshot('备注已保存');
    return { ok: !!result };
  });`
  },
  {
    label: "delete-record",
    before: `  ipcMain.handle('delete-record', async (_, id) => {
    const ok = storage.deleteRecord(id);
    sendSnapshot('记录已删除');
    sendFloatingMenuState();
    return { ok };
  });`,
    after: `  ipcMain.handle('delete-record', async (_, id) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      try {
        const ok = await deleteNextVaultRecordByUiId(id);
        sendSnapshot(ok ? '记录已删除' : '记录不存在');
        sendFloatingMenuState();
        return { ok, message: ok ? '' : '记录不存在' };
      } catch (error) {
        return { ok: false, message: error && error.message ? error.message : '删除失败' };
      }
    }

    const ok = storage.deleteRecord(id);
    sendSnapshot('记录已删除');
    sendFloatingMenuState();
    return { ok };
  });`
  },
  {
    label: "delete-records",
    before: `  ipcMain.handle('delete-records', async (_, ids = []) => {
    const list = Array.isArray(ids) ? ids : [];
    let count = 0;
    for (const id of list) {
      if (storage.deleteRecord(id)) {
        count += 1;
      }
    }
    sendSnapshot(count ? \`已删除 \${count} 条记录\` : '没有删除任何记录');
    sendFloatingMenuState();
    return { ok: true, count };
  });`,
    after: `  ipcMain.handle('delete-records', async (_, ids = []) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      try {
        const list = Array.isArray(ids) ? ids : [];
        let count = 0;
        for (const id of list) {
          if (await deleteNextVaultRecordByUiId(id)) {
            count += 1;
          }
        }
        sendSnapshot(count ? \`已删除 \${count} 条记录\` : '没有删除任何记录');
        sendFloatingMenuState();
        return { ok: true, count };
      } catch (error) {
        return { ok: false, message: error && error.message ? error.message : '批量删除失败' };
      }
    }

    const list = Array.isArray(ids) ? ids : [];
    let count = 0;
    for (const id of list) {
      if (storage.deleteRecord(id)) {
        count += 1;
      }
    }
    sendSnapshot(count ? \`已删除 \${count} 条记录\` : '没有删除任何记录');
    sendFloatingMenuState();
    return { ok: true, count };
  });`
  },
  {
    label: "copy-record-content",
    before: `  ipcMain.handle('copy-record-content', async (_, id) => {
    const record = storage.getAllRecords().find((item) => item.id === id);
    if (!record) {
      return { ok: false, message: '记录不存在' };
    }

    if (record.contentType === 'text') {
      writeInternalTextToClipboard(record.textContent || '');
      return { ok: true };
    }

    if (record.contentType === 'image' && record.imageDataUrl) {
      const image = nativeImage.createFromDataURL(record.imageDataUrl);
      clipboard.writeImage(image);
      return { ok: true };
    }

    return { ok: false, message: '该记录没有可复制内容' };
  });`,
    after: `  ipcMain.handle('copy-record-content', async (_, id) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      const target = await findNextVaultRecordByUiId(id);
      if (!target?.uiRecord) {
        return { ok: false, message: '记录不存在' };
      }

      if (target.uiRecord.contentType === 'text') {
        writeInternalTextToClipboard(target.uiRecord.textContent || '');
        return { ok: true };
      }

      if (target.uiRecord.contentType === 'image' && target.uiRecord.imageDataUrl) {
        const image = nativeImage.createFromDataURL(target.uiRecord.imageDataUrl);
        clipboard.writeImage(image);
        return { ok: true };
      }

      return { ok: false, message: '该记录没有可复制内容' };
    }

    const record = storage.getAllRecords().find((item) => item.id === id);
    if (!record) {
      return { ok: false, message: '记录不存在' };
    }

    if (record.contentType === 'text') {
      writeInternalTextToClipboard(record.textContent || '');
      return { ok: true };
    }

    if (record.contentType === 'image' && record.imageDataUrl) {
      const image = nativeImage.createFromDataURL(record.imageDataUrl);
      clipboard.writeImage(image);
      return { ok: true };
    }

    return { ok: false, message: '该记录没有可复制内容' };
  });`
  },
  {
    label: "update-browser-card",
    before: `  ipcMain.handle('update-browser-card', async (_, payload = {}) => {
    const result = storage.updateBrowserCard(payload.id, {
      name: payload.name || '',
      remark: payload.remark || '',
      openUrl: payload.openUrl || '',
      username: payload.username || '',
      password: payload.password || ''
    });
    sendSnapshot('浏览器卡片已保存');
    return { ok: !!result };
  });`,
    after: `  ipcMain.handle('update-browser-card', async (_, payload = {}) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      try {
        const result = await updateNextVaultBrowserCard(payload);
        sendSnapshot(result ? '浏览器卡片已保存' : '浏览器卡片不存在');
        return { ok: !!result, message: result ? '' : '浏览器卡片不存在' };
      } catch (error) {
        return { ok: false, message: error && error.message ? error.message : '保存失败' };
      }
    }

    const result = storage.updateBrowserCard(payload.id, {
      name: payload.name || '',
      remark: payload.remark || '',
      openUrl: payload.openUrl || '',
      username: payload.username || '',
      password: payload.password || ''
    });
    sendSnapshot('浏览器卡片已保存');
    return { ok: !!result };
  });`
  },
  {
    label: "refresh-browser-card-cookies",
    before: `  ipcMain.handle('refresh-browser-card-cookies', async (_, id) => {
    try {
      const card = storage.getAllBrowserCards().find((item) => item.id === id);
      if (!card) {
        return { ok: false, message: '浏览器卡片不存在' };
      }
      const result = await runPythonBridge('refresh-card-cookies', {
        ...getPythonBridgeConfig(),
        cardJson: JSON.stringify(card)
      });
      if (!result.ok) {
        return result;
      }
      const mergedCookies = mergeBrowserCardCookies(card.cookies, Array.isArray(result.cookies) ? result.cookies : []);
      const mergedCookieNames = [...new Set(mergedCookies.map((item) => item?.name).filter(Boolean))];
      const updated = storage.updateBrowserCard(id, {
        cookies: mergedCookies,
        cookieNames: mergedCookieNames,
        cookieCount: mergedCookies.length
      });
      if (!updated) {
        return { ok: false, message: '卡片更新失败' };
      }
      const incomingCount = Array.isArray(result.cookies) ? result.cookies.length : 0;
      const message = \`\${result.message || 'Cookie 已更新'}；已合并保存 \${mergedCookies.length} 条（本次更新 \${incomingCount} 条，新值优先覆盖旧值）\`;
      sendSnapshot(message);
      return { ok: true, message };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '更新 Cookie 失败'
      };
    }
  });`,
    after: `  ipcMain.handle('refresh-browser-card-cookies', async (_, id) => {
    try {
      if (isNextVaultReadEnabled() && legacyIngestBridge) {
        const target = await findNextVaultBrowserCardByUiId(id);
        if (!target) {
          return { ok: false, message: '浏览器卡片不存在' };
        }
        const result = await runPythonBridge('refresh-card-cookies', {
          ...getPythonBridgeConfig(),
          cardJson: JSON.stringify(target.uiCard)
        });
        if (!result.ok) {
          return result;
        }
        const mergedCookies = mergeBrowserCardCookies(target.uiCard.cookies, Array.isArray(result.cookies) ? result.cookies : []);
        const mergedCookieNames = [...new Set(mergedCookies.map((item) => item?.name).filter(Boolean))];
        const updated = await updateNextVaultBrowserCardByUiId(id, (card) => ({
          cookies: mergedCookies,
          cookieNames: mergedCookieNames,
          extra: {
            ...(card.extra || {}),
            cookieCount: mergedCookies.length
          }
        }));
        if (!updated) {
          return { ok: false, message: '卡片更新失败' };
        }
        const incomingCount = Array.isArray(result.cookies) ? result.cookies.length : 0;
        const message = \`\${result.message || 'Cookie 已更新'}；已合并保存 \${mergedCookies.length} 条（本次更新 \${incomingCount} 条，新值优先覆盖旧值）\`;
        sendSnapshot(message);
        return { ok: true, message };
      }

      const card = storage.getAllBrowserCards().find((item) => item.id === id);
      if (!card) {
        return { ok: false, message: '浏览器卡片不存在' };
      }
      const result = await runPythonBridge('refresh-card-cookies', {
        ...getPythonBridgeConfig(),
        cardJson: JSON.stringify(card)
      });
      if (!result.ok) {
        return result;
      }
      const mergedCookies = mergeBrowserCardCookies(card.cookies, Array.isArray(result.cookies) ? result.cookies : []);
      const mergedCookieNames = [...new Set(mergedCookies.map((item) => item?.name).filter(Boolean))];
      const updated = storage.updateBrowserCard(id, {
        cookies: mergedCookies,
        cookieNames: mergedCookieNames,
        cookieCount: mergedCookies.length
      });
      if (!updated) {
        return { ok: false, message: '卡片更新失败' };
      }
      const incomingCount = Array.isArray(result.cookies) ? result.cookies.length : 0;
      const message = \`\${result.message || 'Cookie 已更新'}；已合并保存 \${mergedCookies.length} 条（本次更新 \${incomingCount} 条，新值优先覆盖旧值）\`;
      sendSnapshot(message);
      return { ok: true, message };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '更新 Cookie 失败'
      };
    }
  });`
  },
  {
    label: "rewrite-browser-card-cookies",
    before: `  ipcMain.handle('rewrite-browser-card-cookies', async (_, id) => {
    try {
      const card = storage.getAllBrowserCards().find((item) => item.id === id);
      if (!card) {
        return { ok: false, message: '浏览器卡片不存在' };
      }
      const result = await runPythonBridge('rewrite-card-cookies', {
        ...getPythonBridgeConfig(),
        cardJson: JSON.stringify(card)
      });
      const rewriteDebug = result && result.rewriteDebug !== undefined ? result.rewriteDebug : null;
      if (!result.ok) {
        return { ok: false, message: result.message || '重写失败', rewriteDebug };
      }
      const updated = storage.updateBrowserCard(id, {
        cookies: Array.isArray(result.cookies) ? result.cookies : [],
        cookieNames: Array.isArray(result.cookieNames) ? result.cookieNames : [],
        cookieCount: Number(result.cookieCount || 0)
      });
      if (!updated) {
        return { ok: false, message: '卡片更新失败', rewriteDebug };
      }
      sendSnapshot(result.message || 'Cookie 已重写');
      return { ok: true, message: result.message || 'Cookie 已重写', rewriteDebug };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '重写 Cookie 失败'
      };
    }
  });`,
    after: `  ipcMain.handle('rewrite-browser-card-cookies', async (_, id) => {
    try {
      if (isNextVaultReadEnabled() && legacyIngestBridge) {
        const target = await findNextVaultBrowserCardByUiId(id);
        if (!target) {
          return { ok: false, message: '浏览器卡片不存在' };
        }
        const result = await runPythonBridge('rewrite-card-cookies', {
          ...getPythonBridgeConfig(),
          cardJson: JSON.stringify(target.uiCard)
        });
        const rewriteDebug = result && result.rewriteDebug !== undefined ? result.rewriteDebug : null;
        if (!result.ok) {
          return { ok: false, message: result.message || '重写失败', rewriteDebug };
        }
        const updated = await updateNextVaultBrowserCardByUiId(id, (card) => ({
          cookies: Array.isArray(result.cookies) ? result.cookies : [],
          cookieNames: Array.isArray(result.cookieNames) ? result.cookieNames : [],
          extra: {
            ...(card.extra || {}),
            cookieCount: Number(result.cookieCount || 0)
          }
        }));
        if (!updated) {
          return { ok: false, message: '卡片更新失败', rewriteDebug };
        }
        sendSnapshot(result.message || 'Cookie 已重写');
        return { ok: true, message: result.message || 'Cookie 已重写', rewriteDebug };
      }

      const card = storage.getAllBrowserCards().find((item) => item.id === id);
      if (!card) {
        return { ok: false, message: '浏览器卡片不存在' };
      }
      const result = await runPythonBridge('rewrite-card-cookies', {
        ...getPythonBridgeConfig(),
        cardJson: JSON.stringify(card)
      });
      const rewriteDebug = result && result.rewriteDebug !== undefined ? result.rewriteDebug : null;
      if (!result.ok) {
        return { ok: false, message: result.message || '重写失败', rewriteDebug };
      }
      const updated = storage.updateBrowserCard(id, {
        cookies: Array.isArray(result.cookies) ? result.cookies : [],
        cookieNames: Array.isArray(result.cookieNames) ? result.cookieNames : [],
        cookieCount: Number(result.cookieCount || 0)
      });
      if (!updated) {
        return { ok: false, message: '卡片更新失败', rewriteDebug };
      }
      sendSnapshot(result.message || 'Cookie 已重写');
      return { ok: true, message: result.message || 'Cookie 已重写', rewriteDebug };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '重写 Cookie 失败'
      };
    }
  });`
  },
  {
    label: "open-browser-card",
    before: `  ipcMain.handle('open-browser-card', async (_, id) => {
    try {
      const card = storage.getAllBrowserCards().find((item) => item.id === id);
      if (!card) {
        return { ok: false, message: '浏览器卡片不存在' };
      }
      let result;
      try {
        result = await runPythonBridge('default-open', {
          ...getPythonBridgeConfig(),
          cardJson: JSON.stringify(card)
        });
      } catch {
        result = openBrowserCard(card);
      }
      if (result.ok) {
        storage.updateBrowserCard(id, {
          last_used_at: new Date().toLocaleString('zh-CN', { hour12: false }),
          last_used_method: 'default_open'
        });
        sendSnapshot('浏览器卡片已打开');
      }
      return result;
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '打开失败'
      };
    }
  });`,
    after: `  ipcMain.handle('open-browser-card', async (_, id) => {
    try {
      if (isNextVaultReadEnabled() && legacyIngestBridge) {
        const target = await findNextVaultBrowserCardByUiId(id);
        if (!target) {
          return { ok: false, message: '浏览器卡片不存在' };
        }
        let result;
        try {
          result = await runPythonBridge('default-open', {
            ...getPythonBridgeConfig(),
            cardJson: JSON.stringify(target.uiCard)
          });
        } catch {
          result = openBrowserCard(target.uiCard);
        }
        if (result.ok) {
          await updateNextVaultBrowserCardByUiId(id, (card) => ({
            extra: {
              ...(card.extra || {}),
              lastUsedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
              lastUsedMethod: 'default_open'
            }
          }));
          sendSnapshot('浏览器卡片已打开');
        }
        return result;
      }

      const card = storage.getAllBrowserCards().find((item) => item.id === id);
      if (!card) {
        return { ok: false, message: '浏览器卡片不存在' };
      }
      let result;
      try {
        result = await runPythonBridge('default-open', {
          ...getPythonBridgeConfig(),
          cardJson: JSON.stringify(card)
        });
      } catch {
        result = openBrowserCard(card);
      }
      if (result.ok) {
        storage.updateBrowserCard(id, {
          last_used_at: new Date().toLocaleString('zh-CN', { hour12: false }),
          last_used_method: 'default_open'
        });
        sendSnapshot('浏览器卡片已打开');
      }
      return result;
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '打开失败'
      };
    }
  });`
  },
  {
    label: "inject-browser-card",
    before: `  ipcMain.handle('inject-browser-card', async (_, id) => {
    try {
      const card = storage.getAllBrowserCards().find((item) => item.id === id);
      if (!card) {
        return { ok: false, message: '浏览器卡片不存在' };
      }
      const result = await runPythonBridge('inject-open', {
        ...getPythonBridgeConfig(),
        cardJson: JSON.stringify(card)
      });
      if (result.ok) {
        storage.updateBrowserCard(id, {
          last_used_at: new Date().toLocaleString('zh-CN', { hour12: false }),
          last_used_method: 'inject'
        });
        sendSnapshot('Cookie 转移完成');
      }
      return result;
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : 'Cookie 转移失败'
      };
    }
  });`,
    after: `  ipcMain.handle('inject-browser-card', async (_, id) => {
    try {
      if (isNextVaultReadEnabled() && legacyIngestBridge) {
        const target = await findNextVaultBrowserCardByUiId(id);
        if (!target) {
          return { ok: false, message: '浏览器卡片不存在' };
        }
        const result = await runPythonBridge('inject-open', {
          ...getPythonBridgeConfig(),
          cardJson: JSON.stringify(target.uiCard)
        });
        if (result.ok) {
          await updateNextVaultBrowserCardByUiId(id, (card) => ({
            extra: {
              ...(card.extra || {}),
              lastUsedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
              lastUsedMethod: 'inject'
            }
          }));
          sendSnapshot('Cookie 转移完成');
        }
        return result;
      }

      const card = storage.getAllBrowserCards().find((item) => item.id === id);
      if (!card) {
        return { ok: false, message: '浏览器卡片不存在' };
      }
      const result = await runPythonBridge('inject-open', {
        ...getPythonBridgeConfig(),
        cardJson: JSON.stringify(card)
      });
      if (result.ok) {
        storage.updateBrowserCard(id, {
          last_used_at: new Date().toLocaleString('zh-CN', { hour12: false }),
          last_used_method: 'inject'
        });
        sendSnapshot('Cookie 转移完成');
      }
      return result;
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : 'Cookie 转移失败'
      };
    }
  });`
  },
  {
    label: "execute-browser-card-inject",
    before: `  ipcMain.handle('execute-browser-card-inject', async (_, payload = {}) => {
    try {
      const id = String(payload.id || '');
      const method = payload.method === 'db_write' ? 'db_write' : 'inject';
      const target = payload.target && typeof payload.target === 'object' ? payload.target : null;
      const card = storage.getAllBrowserCards().find((item) => item.id === id);
      if (!card) {
        return { ok: false, message: '浏览器卡片不存在' };
      }
      if (!target) {
        return { ok: false, message: '未选择目标浏览器' };
      }
      const result = await runPythonBridge('inject-to-target', {
        ...getPythonBridgeConfig(),
        method,
        cardJson: JSON.stringify(card),
        targetJson: JSON.stringify(target)
      });
      if (result.ok) {
        storage.updateBrowserCard(id, {
          last_used_at: new Date().toLocaleString('zh-CN', { hour12: false }),
          last_used_method: method
        });
        sendSnapshot(result.message || 'Cookie 转移完成');
      }
      return result;
    } catch (error) {
      return { ok: false, message: error && error.message ? error.message : 'Cookie 转移失败' };
    }
  });`,
    after: `  ipcMain.handle('execute-browser-card-inject', async (_, payload = {}) => {
    try {
      const id = String(payload.id || '');
      const method = payload.method === 'db_write' ? 'db_write' : 'inject';
      const target = payload.target && typeof payload.target === 'object' ? payload.target : null;
      if (isNextVaultReadEnabled() && legacyIngestBridge) {
        const cardTarget = await findNextVaultBrowserCardByUiId(id);
        if (!cardTarget) {
          return { ok: false, message: '浏览器卡片不存在' };
        }
        if (!target) {
          return { ok: false, message: '未选择目标浏览器' };
        }
        const result = await runPythonBridge('inject-to-target', {
          ...getPythonBridgeConfig(),
          method,
          cardJson: JSON.stringify(cardTarget.uiCard),
          targetJson: JSON.stringify(target)
        });
        if (result.ok) {
          await updateNextVaultBrowserCardByUiId(id, (card) => ({
            extra: {
              ...(card.extra || {}),
              lastUsedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
              lastUsedMethod: method
            }
          }));
          sendSnapshot(result.message || 'Cookie 转移完成');
        }
        return result;
      }

      const card = storage.getAllBrowserCards().find((item) => item.id === id);
      if (!card) {
        return { ok: false, message: '浏览器卡片不存在' };
      }
      if (!target) {
        return { ok: false, message: '未选择目标浏览器' };
      }
      const result = await runPythonBridge('inject-to-target', {
        ...getPythonBridgeConfig(),
        method,
        cardJson: JSON.stringify(card),
        targetJson: JSON.stringify(target)
      });
      if (result.ok) {
        storage.updateBrowserCard(id, {
          last_used_at: new Date().toLocaleString('zh-CN', { hour12: false }),
          last_used_method: method
        });
        sendSnapshot(result.message || 'Cookie 转移完成');
      }
      return result;
    } catch (error) {
      return { ok: false, message: error && error.message ? error.message : 'Cookie 转移失败' };
    }
  });`
  },
  {
    label: "open-browser-card-source",
    before: `  ipcMain.handle('open-browser-card-source', async (_, id) => {
    const card = storage.getAllBrowserCards().find((item) => item.id === id);
    if (!card) return { ok: false, message: '浏览器卡片不存在' };
    const userDataDir = card.browserSource?.userDataDir;
    if (!userDataDir) return { ok: false, message: '来源目录不存在' };
    shell.showItemInFolder(userDataDir);
    return { ok: true };
  });`,
    after: `  ipcMain.handle('open-browser-card-source', async (_, id) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      const target = await findNextVaultBrowserCardByUiId(id);
      const userDataDir = target?.uiCard?.browserSource?.userDataDir;
      if (!target) return { ok: false, message: '浏览器卡片不存在' };
      if (!userDataDir) return { ok: false, message: '来源目录不存在' };
      shell.showItemInFolder(userDataDir);
      return { ok: true };
    }

    const card = storage.getAllBrowserCards().find((item) => item.id === id);
    if (!card) return { ok: false, message: '浏览器卡片不存在' };
    const userDataDir = card.browserSource?.userDataDir;
    if (!userDataDir) return { ok: false, message: '来源目录不存在' };
    shell.showItemInFolder(userDataDir);
    return { ok: true };
  });`
  },
  {
    label: "delete-browser-card",
    before: `  ipcMain.handle('delete-browser-card', async (_, id) => {
    const ok = storage.deleteBrowserCard(id);
    sendSnapshot(ok ? '浏览器卡片已删除' : '删除失败');
    return { ok };
  });`,
    after: `  ipcMain.handle('delete-browser-card', async (_, id) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      try {
        const ok = await deleteNextVaultBrowserCardByUiId(id);
        sendSnapshot(ok ? '浏览器卡片已删除' : '浏览器卡片不存在');
        return { ok, message: ok ? '' : '浏览器卡片不存在' };
      } catch (error) {
        return { ok: false, message: error && error.message ? error.message : '删除失败' };
      }
    }

    const ok = storage.deleteBrowserCard(id);
    sendSnapshot(ok ? '浏览器卡片已删除' : '删除失败');
    return { ok };
  });`
  },
  {
    label: "delete-browser-cards",
    before: `  ipcMain.handle('delete-browser-cards', async (_, ids = []) => {
    try {
      const targets = Array.isArray(ids) ? ids : [];
      let count = 0;
      targets.forEach((id) => {
        if (storage.deleteBrowserCard(id)) {
          count += 1;
        }
      });
      sendSnapshot(count ? \`已删除 \${count} 张浏览器卡片\` : '没有删除任何卡片');
      return { ok: true, count };
    } catch (error) {
      return { ok: false, message: error && error.message ? error.message : '批量删除失败' };
    }
  });`,
    after: `  ipcMain.handle('delete-browser-cards', async (_, ids = []) => {
    try {
      if (isNextVaultReadEnabled() && legacyIngestBridge) {
        const targets = Array.isArray(ids) ? ids : [];
        let count = 0;
        for (const id of targets) {
          if (await deleteNextVaultBrowserCardByUiId(id)) {
            count += 1;
          }
        }
        sendSnapshot(count ? \`已删除 \${count} 张浏览器卡片\` : '没有删除任何卡片');
        return { ok: true, count };
      }

      const targets = Array.isArray(ids) ? ids : [];
      let count = 0;
      targets.forEach((id) => {
        if (storage.deleteBrowserCard(id)) {
          count += 1;
        }
      });
      sendSnapshot(count ? \`已删除 \${count} 张浏览器卡片\` : '没有删除任何卡片');
      return { ok: true, count };
    } catch (error) {
      return { ok: false, message: error && error.message ? error.message : '批量删除失败' };
    }
  });`
  },
  {
    label: "check-browser-card-connectivity",
    before: `  ipcMain.handle('check-browser-card-connectivity', async (_, ids = []) => {
    try {
      const targets = Array.isArray(ids) ? ids : [];
      const cards = storage.getAllBrowserCards();
      const results = [];
      for (const id of targets) {
        const card = cards.find((item) => item.id === id);
        if (!card) {
          continue;
        }
        const result = await requestUrlStatus(card.openUrl || card.url || '');
        storage.updateBrowserCard(id, {
          test_ok: !!result.ok,
          test_title: result.title || ''
        }, { preserveUpdatedAt: true });
        results.push({ id, ...result });
      }
      sendSnapshot(results.length ? \`已完成 \${results.length} 张卡片连通性测试\` : '没有可测试的卡片');
      return { ok: true, results };
    } catch (error) {
      return { ok: false, message: error && error.message ? error.message : '批量测试失败' };
    }
  });`,
    after: `  ipcMain.handle('check-browser-card-connectivity', async (_, ids = []) => {
    try {
      if (isNextVaultReadEnabled() && legacyIngestBridge) {
        const targets = Array.isArray(ids) ? ids : [];
        const results = [];
        for (const id of targets) {
          const target = await findNextVaultBrowserCardByUiId(id);
          if (!target) {
            continue;
          }
          const result = await requestUrlStatus(target.uiCard.openUrl || target.uiCard.url || '');
          await updateNextVaultBrowserCardByUiId(id, (card) => ({
            extra: {
              ...(card.extra || {}),
              testOk: !!result.ok,
              testTitle: result.title || ''
            }
          }));
          results.push({ id, ...result });
        }
        sendSnapshot(results.length ? \`已完成 \${results.length} 张卡片连通性测试\` : '没有可测试的卡片');
        return { ok: true, results };
      }

      const targets = Array.isArray(ids) ? ids : [];
      const cards = storage.getAllBrowserCards();
      const results = [];
      for (const id of targets) {
        const card = cards.find((item) => item.id === id);
        if (!card) {
          continue;
        }
        const result = await requestUrlStatus(card.openUrl || card.url || '');
        storage.updateBrowserCard(id, {
          test_ok: !!result.ok,
          test_title: result.title || ''
        }, { preserveUpdatedAt: true });
        results.push({ id, ...result });
      }
      sendSnapshot(results.length ? \`已完成 \${results.length} 张卡片连通性测试\` : '没有可测试的卡片');
      return { ok: true, results };
    } catch (error) {
      return { ok: false, message: error && error.message ? error.message : '批量测试失败' };
    }
  });`
  },
  {
    label: "update-asset-note",
    before: `  ipcMain.handle('update-asset-note', async (_, payload = {}) => {
    const result = storage.updateAsset(payload.id, { note: payload.note || '' });
    sendSnapshot('资源备注已保存');
    sendFloatingMenuState();
    return { ok: !!result };
  });`,
    after: `  ipcMain.handle('update-asset-note', async (_, payload = {}) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      try {
        const result = await updateNextVaultAssetNote(payload);
        sendSnapshot(result ? '资源备注已保存' : '资源不存在');
        sendFloatingMenuState();
        return { ok: !!result, message: result ? '' : '资源不存在' };
      } catch (error) {
        return { ok: false, message: error && error.message ? error.message : '备注保存失败' };
      }
    }

    const result = storage.updateAsset(payload.id, { note: payload.note || '' });
    sendSnapshot('资源备注已保存');
    sendFloatingMenuState();
    return { ok: !!result };
  });`
  },
  {
    label: "open-asset-primary",
    before: `  ipcMain.handle('open-asset-primary', async (_, id) => {
    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.primaryPath) return { ok: false, message: '资源不存在' };
    const errorMessage = await shell.openPath(asset.primaryPath);
    return { ok: !errorMessage, message: errorMessage || '' };
  });`,
    after: `  ipcMain.handle('open-asset-primary', async (_, id) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      const target = await findNextVaultAssetByUiId(id);
      if (!target?.uiAsset || !target.uiAsset.primaryPath) return { ok: false, message: '资源不存在' };
      const errorMessage = await shell.openPath(target.uiAsset.primaryPath);
      return { ok: !errorMessage, message: errorMessage || '' };
    }

    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.primaryPath) return { ok: false, message: '资源不存在' };
    const errorMessage = await shell.openPath(asset.primaryPath);
    return { ok: !errorMessage, message: errorMessage || '' };
  });`
  },
  {
    label: "open-asset-source",
    before: `  ipcMain.handle('open-asset-source', async (_, id) => {
    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.sourcePath) return { ok: false, message: '原路径不存在' };
    const errorMessage = await shell.openPath(asset.sourcePath);
    return { ok: !errorMessage, message: errorMessage || '' };
  });`,
    after: `  ipcMain.handle('open-asset-source', async (_, id) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      const target = await findNextVaultAssetByUiId(id);
      if (!target?.uiAsset || !target.uiAsset.sourcePath) return { ok: false, message: '原路径不存在' };
      const errorMessage = await shell.openPath(target.uiAsset.sourcePath);
      return { ok: !errorMessage, message: errorMessage || '' };
    }

    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.sourcePath) return { ok: false, message: '原路径不存在' };
    const errorMessage = await shell.openPath(asset.sourcePath);
    return { ok: !errorMessage, message: errorMessage || '' };
  });`
  },
  {
    label: "open-asset-location",
    before: `  ipcMain.handle('open-asset-location', async (_, id) => {
    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.sourcePath) return { ok: false, message: '资源不存在' };
    shell.showItemInFolder(asset.sourcePath);
    return { ok: true };
  });`,
    after: `  ipcMain.handle('open-asset-location', async (_, id) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      const target = await findNextVaultAssetByUiId(id);
      if (!target?.uiAsset || !target.uiAsset.sourcePath) return { ok: false, message: '资源不存在' };
      shell.showItemInFolder(target.uiAsset.sourcePath);
      return { ok: true };
    }

    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.sourcePath) return { ok: false, message: '资源不存在' };
    shell.showItemInFolder(asset.sourcePath);
    return { ok: true };
  });`
  },
  {
    label: "open-asset-stored",
    before: `  ipcMain.handle('open-asset-stored', async (_, id) => {
    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.storedPath) return { ok: false, message: '备份文件不存在' };
    const errorMessage = await shell.openPath(asset.storedPath);
    return { ok: !errorMessage, message: errorMessage || '' };
  });`,
    after: `  ipcMain.handle('open-asset-stored', async (_, id) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      const target = await findNextVaultAssetByUiId(id);
      if (!target?.uiAsset || !target.uiAsset.storedPath) return { ok: false, message: '备份文件不存在' };
      const errorMessage = await shell.openPath(target.uiAsset.storedPath);
      return { ok: !errorMessage, message: errorMessage || '' };
    }

    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.storedPath) return { ok: false, message: '备份文件不存在' };
    const errorMessage = await shell.openPath(asset.storedPath);
    return { ok: !errorMessage, message: errorMessage || '' };
  });`
  },
  {
    label: "open-asset-stored-location",
    before: `  ipcMain.handle('open-asset-stored-location', async (_, id) => {
    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.storedPath) return { ok: false, message: '备份文件不存在' };
    shell.showItemInFolder(asset.storedPath);
    return { ok: true };
  });`,
    after: `  ipcMain.handle('open-asset-stored-location', async (_, id) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      const target = await findNextVaultAssetByUiId(id);
      if (!target?.uiAsset || !target.uiAsset.storedPath) return { ok: false, message: '备份文件不存在' };
      shell.showItemInFolder(target.uiAsset.storedPath);
      return { ok: true };
    }

    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.storedPath) return { ok: false, message: '备份文件不存在' };
    shell.showItemInFolder(asset.storedPath);
    return { ok: true };
  });`
  },
  {
    label: "delete-asset",
    before: `  ipcMain.handle('delete-asset', async (_, id) => {
    const ok = storage.deleteAsset(id);
    sendSnapshot('资源已删除');
    sendFloatingMenuState();
    return { ok };
  });`,
    after: `  ipcMain.handle('delete-asset', async (_, id) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      try {
        const ok = await deleteNextVaultAssetByUiId(id);
        sendSnapshot(ok ? '资源已删除' : '资源不存在');
        sendFloatingMenuState();
        return { ok, message: ok ? '' : '资源不存在' };
      } catch (error) {
        return { ok: false, message: error && error.message ? error.message : '删除失败' };
      }
    }

    const ok = storage.deleteAsset(id);
    sendSnapshot('资源已删除');
    sendFloatingMenuState();
    return { ok };
  });`
  },
  {
    label: "move-record-to-common",
    before: `  ipcMain.handle('move-record-to-common', async (_, id) => {
    const result = storage.updateRecord(id, { category: 'common' });
    sendSnapshot('已加入常用');
    sendFloatingMenuState();
    return { ok: !!result };
  });`,
    after: `  ipcMain.handle('move-record-to-common', async (_, id) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      try {
        const result = await updateNextVaultRecordCategory(id, 'common');
        sendSnapshot(result ? '已加入常用' : '记录不存在');
        sendFloatingMenuState();
        return { ok: !!result, message: result ? '' : '记录不存在' };
      } catch (error) {
        return { ok: false, message: error && error.message ? error.message : '更新失败' };
      }
    }

    const result = storage.updateRecord(id, { category: 'common' });
    sendSnapshot('已加入常用');
    sendFloatingMenuState();
    return { ok: !!result };
  });`
  },
  {
    label: "move-record-to-daily",
    before: `  ipcMain.handle('move-record-to-daily', async (_, id) => {
    const result = storage.updateRecord(id, { category: 'daily' });
    sendSnapshot('已移出常用');
    sendFloatingMenuState();
    return { ok: !!result };
  });`,
    after: `  ipcMain.handle('move-record-to-daily', async (_, id) => {
    if (isNextVaultReadEnabled() && legacyIngestBridge) {
      try {
        const result = await updateNextVaultRecordCategory(id, 'daily');
        sendSnapshot(result ? '已移出常用' : '记录不存在');
        sendFloatingMenuState();
        return { ok: !!result, message: result ? '' : '记录不存在' };
      } catch (error) {
        return { ok: false, message: error && error.message ? error.message : '更新失败' };
      }
    }

    const result = storage.updateRecord(id, { category: 'daily' });
    sendSnapshot('已移出常用');
    sendFloatingMenuState();
    return { ok: !!result };
  });`
  }
];

for (const { before, after, label } of replacements) {
  source = replaceOrThrow(source, before, after, label);
}

fs.writeFileSync(targetPath, source.replace(/\n/g, "\r\n"), "utf8");
console.log(`patched ${targetPath}`);
