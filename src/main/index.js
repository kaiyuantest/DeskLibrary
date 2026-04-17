const { app, BrowserWindow, Tray, Menu, globalShortcut, clipboard, nativeImage, ipcMain, Notification, shell, screen } = require('electron');
const path = require('path');
const { StorageService } = require('./storage');
let uIOhook = null;
try {
  const hookModule = require('uiohook-napi');
  uIOhook = hookModule?.uIOhook || hookModule?.default || hookModule;
} catch {
  uIOhook = null;
}

const HOTKEY_ALT_Q = 'Alt+Q';
const OBSERVE_WINDOW_MS = 1500;
const COPY_SHORTCUT_POLL_DELAY_MS = 120;
const COPY_SHORTCUT_MAX_RETRIES = 15;
const SHORTCUT_POLL_SUPPRESS_MS = 1000;
const FLOATING_WINDOW_SIZE = 56;
const FLOATING_WINDOW_MARGIN = 12;
const FLOATING_VISIBLE_SLIVER = 16;
const FLOATING_SLIDE_STEP = 8;
const FLOATING_SLIDE_INTERVAL_MS = 10;

let mainWindow = null;
let floatingWindow = null;
let tray = null;
let storage = null;
let lastClipboardSignature = '';
let ignoreNextClipboardChange = false;
let pendingPayload = null;
let observing = false;
let observeTimer = null;
let observeContext = null;
let altQFlowActive = false;
let suppressedPollingSignature = '';
let suppressedPollingUntil = 0;
let pressedKeys = {
  shift: false,
  ctrl: false,
  alt: false
};
let floatingSlideTimer = null;
let floatingDragState = null;
let floatingHovered = false;
let floatingPinnedVisible = false;
let floatingBoundsCache = null;

function getLoginItemConfig(enabled) {
  const base = {
    openAtLogin: !!enabled,
    openAsHidden: true
  };

  if (process.platform !== 'win32') {
    return base;
  }

  if (app.isPackaged) {
    return {
      ...base,
      path: process.execPath,
      args: []
    };
  }

  const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
  return {
    ...base,
    path: process.execPath,
    args: entryFile ? [entryFile] : []
  };
}

function readStartupLaunchEnabled() {
  try {
    if (process.platform === 'win32') {
      const config = getLoginItemConfig(false);
      return !!app.getLoginItemSettings({
        path: config.path,
        args: config.args
      }).openAtLogin;
    }

    return !!app.getLoginItemSettings().openAtLogin;
  } catch {
    return null;
  }
}

function syncStartupSettingFromSystem() {
  const openAtLogin = readStartupLaunchEnabled();
  if (openAtLogin === null) {
    return getSettings();
  }

  const current = getSettings();
  if (!!current.startupLaunchEnabled === openAtLogin) {
    return current;
  }

  return storage.saveSettings({
    ...current,
    startupLaunchEnabled: openAtLogin
  });
}

function createTrayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect x="8" y="8" width="48" height="48" rx="14" fill="#2563eb"/>
      <path d="M24 22h16a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6V28a6 6 0 0 1 6-6Z" fill="#fff" opacity="0.96"/>
      <path d="M26 28h12M26 34h12M26 40h8" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`;
  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 860,
    height: 620,
    minWidth: 360,
    minHeight: 520,
    frame: false,
    backgroundColor: '#e9edf5',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setSkipTaskbar(true);
    }
  });
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.setSkipTaskbar(true);
      mainWindow.hide();
    }
  });
}

function getFloatingBounds(mode = 'hidden') {
  const settings = getSettings();
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const workArea = display.workArea;
  const side = settings.floatingDockSide === 'left' ? 'left' : 'right';
  const offsetY = Number.isFinite(settings.floatingOffsetY) ? settings.floatingOffsetY : null;
  const maxY = workArea.y + workArea.height - FLOATING_WINDOW_SIZE - FLOATING_WINDOW_MARGIN;
  const fallbackY = settings.dockToEdgeEnabled
    ? workArea.y + Math.round((workArea.height - FLOATING_WINDOW_SIZE) / 2)
    : workArea.y + workArea.height - FLOATING_WINDOW_SIZE - 96;
  const y = Math.min(maxY, Math.max(workArea.y + FLOATING_WINDOW_MARGIN, offsetY === null ? fallbackY : workArea.y + offsetY));

  let x = workArea.x + workArea.width - FLOATING_WINDOW_SIZE - FLOATING_WINDOW_MARGIN;
  if (settings.dockToEdgeEnabled) {
    if (side === 'left') {
      x = mode === 'visible'
        ? workArea.x + FLOATING_WINDOW_MARGIN
        : workArea.x - FLOATING_WINDOW_SIZE + FLOATING_VISIBLE_SLIVER;
    } else {
      x = mode === 'visible'
        ? workArea.x + workArea.width - FLOATING_WINDOW_SIZE - FLOATING_WINDOW_MARGIN
        : workArea.x + workArea.width - FLOATING_VISIBLE_SLIVER;
    }
  }

  return {
    x,
    y,
    width: FLOATING_WINDOW_SIZE,
    height: FLOATING_WINDOW_SIZE
  };
}

function stopFloatingAnimation() {
  if (floatingSlideTimer) {
    clearInterval(floatingSlideTimer);
    floatingSlideTimer = null;
  }
}

function animateFloatingWindow(mode = 'hidden') {
  if (!floatingWindow || floatingWindow.isDestroyed()) return;
  stopFloatingAnimation();
  const target = getFloatingBounds(mode);
  const current = floatingWindow.getBounds();
  if (current.x === target.x && current.y === target.y) {
    floatingBoundsCache = target;
    return;
  }

  floatingSlideTimer = setInterval(() => {
    if (!floatingWindow || floatingWindow.isDestroyed()) {
      stopFloatingAnimation();
      return;
    }

    const next = floatingWindow.getBounds();
    const deltaX = target.x - next.x;
    const deltaY = target.y - next.y;
    const stepX = Math.abs(deltaX) <= FLOATING_SLIDE_STEP ? deltaX : Math.sign(deltaX) * FLOATING_SLIDE_STEP;
    const stepY = Math.abs(deltaY) <= FLOATING_SLIDE_STEP ? deltaY : Math.sign(deltaY) * FLOATING_SLIDE_STEP;
    const updated = {
      x: next.x + stepX,
      y: next.y + stepY,
      width: FLOATING_WINDOW_SIZE,
      height: FLOATING_WINDOW_SIZE
    };
    floatingWindow.setBounds(updated);

    if (updated.x === target.x && updated.y === target.y) {
      floatingBoundsCache = target;
      stopFloatingAnimation();
    }
  }, FLOATING_SLIDE_INTERVAL_MS);
}

function positionFloatingWindow() {
  if (!floatingWindow || floatingWindow.isDestroyed()) return;
  const mode = getSettings().dockToEdgeEnabled && !floatingHovered && !floatingPinnedVisible ? 'hidden' : 'visible';
  const bounds = getFloatingBounds(mode);
  stopFloatingAnimation();
  floatingBoundsCache = bounds;
  floatingWindow.setBounds(bounds);
}

function createFloatingWindow() {
  floatingWindow = new BrowserWindow({
    width: FLOATING_WINDOW_SIZE,
    height: FLOATING_WINDOW_SIZE,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    show: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    movable: false,
    focusable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'floating-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  floatingWindow.loadFile(path.join(__dirname, '../renderer/floating.html'));
  floatingWindow.once('ready-to-show', () => {
    positionFloatingWindow();
    syncFloatingWindowVisibility();
  });
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('Click2Save');
  const menu = Menu.buildFromTemplate([
    { label: '打开主界面', click: () => showWindow() },
    { type: 'separator' },
    { label: '退出程序', click: () => quitApp() }
  ]);
  tray.setContextMenu(menu);
  tray.on('double-click', showWindow);
}

function showWindow() {
  if (!mainWindow) return;
  if (!mainWindow.isVisible()) {
    mainWindow.setSkipTaskbar(false);
    mainWindow.show();
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
  sendSnapshot();
}

function syncFloatingWindowVisibility() {
  if (!floatingWindow || floatingWindow.isDestroyed()) return;
  try {
    const settings = getSettings();
    const mode = settings.dockToEdgeEnabled && !floatingHovered && !floatingPinnedVisible ? 'hidden' : 'visible';
    if (settings.floatingIconEnabled) {
      if (settings.dockToEdgeEnabled) {
        animateFloatingWindow(mode);
      } else {
        positionFloatingWindow();
      }
      if (floatingWindow.webContents && !floatingWindow.webContents.isLoading()) {
        floatingWindow.showInactive();
      } else {
        floatingWindow.once('ready-to-show', () => {
          if (floatingWindow && !floatingWindow.isDestroyed()) {
            floatingWindow.showInactive();
          }
        });
      }
    } else {
      floatingWindow.hide();
    }
  } catch {
    if (floatingWindow && !floatingWindow.isDestroyed()) {
      try {
        floatingWindow.hide();
      } catch {}
    }
  }
}

function quitApp() {
  app.isQuitting = true;
  app.quit();
}

function notify(title, body) {
  new Notification({ title, body }).show();
}

function getSettings() {
  return storage.getSettings();
}

function normalizeRecord(record) {
  const lastCapturedAt = record.lastCapturedAt || record.updatedAt || record.createdAt;
  return {
    ...record,
    category: record.category || 'daily',
    hitCount: Number(record.hitCount || 1),
    lastCapturedAt,
    contentTypeDisplay: record.contentType === 'text' ? '文本' : '图片',
    captureMethodDisplay: {
      manual: '手动新增',
      auto: '自动判断',
      hotkey_alt_q: 'Alt+Q 主动收藏',
      double_copy: '双复制收藏',
      copy_then_key: '复制后按键收藏'
    }[record.captureMethod] || '未知方式',
    sourceAppDisplay: record.sourceApp || '未知应用',
    windowTitleDisplay: record.windowTitle || '未获取到窗口标题',
    categoryDisplay: (record.category || 'daily') === 'common' ? '常用' : '每日',
    displayTitle: record.contentType === 'text'
      ? ((record.textContent || '').split(/\r?\n/)[0] || '空文本')
      : (path.basename(record.imagePath || '') || '图片记录'),
    preview: record.contentType === 'text'
      ? (((record.textContent || '').length > 120) ? `${record.textContent.slice(0, 120)}...` : (record.textContent || ''))
      : '',
    createdAtDisplay: new Date(record.createdAt).toLocaleString('zh-CN', { hour12: false }),
    lastCapturedAtDisplay: new Date(lastCapturedAt).toLocaleString('zh-CN', { hour12: false })
  };
}

function sendSnapshot(statusText) {
  if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
  const records = storage.getAllRecords().map(normalizeRecord);
  mainWindow.webContents.send('snapshot', {
    records,
    dateFilters: storage.getDateFilters(),
    categoryFilters: storage.getCategoryFilters(),
    settings: getSettings(),
    statusText: statusText || '后台监听中'
  });
}

function clipboardHasImageFormat() {
  return clipboard.availableFormats().some((format) => /png|bmp|bitmap|dib|tiff|image/i.test(format));
}

function readClipboardPayload() {
  const image = clipboard.readImage();
  if (!image.isEmpty()) {
    const pngBuffer = image.toPNG();
    return {
      contentType: 'image',
      imageBuffer: pngBuffer,
      imageDataUrl: `data:image/png;base64,${pngBuffer.toString('base64')}`,
      signature: storage.hashBuffer(pngBuffer)
    };
  }

  const text = clipboard.readText();
  if (text && text.trim()) {
    return {
      contentType: 'text',
      textContent: text,
      signature: storage.hashText(text)
    };
  }

  return null;
}

function processPayload(payload, method, statusLabel, options = {}) {
  const category = options.category || 'daily';
  const duplicate = storage.findDuplicate(payload);
  if (duplicate) {
    const isExplicitCapture = method !== 'auto';
    if (category === 'common' || isExplicitCapture) {
      const nextUpdates = {};
      if (category === 'common' && (duplicate.category || 'daily') !== 'common') {
        nextUpdates.category = 'common';
      }
      storage.touchRecord(duplicate.id, nextUpdates);
      notify('Click2Save', category === 'common' ? '已加入常用' : '已命中现有收藏');
      sendSnapshot(category === 'common' ? '已加入常用' : '已更新现有收藏');
      return;
    }
    if (storage.shouldNotifyDuplicate(duplicate.id)) {
      storage.markDuplicateNotified(duplicate.id);
      notify('Click2Save', '内容已存在');
    }
    sendSnapshot('检测到重复内容');
    return;
  }

  storage.addRecord(payload, method, {
    category,
    sourceApp: '未知应用',
    windowTitle: '暂未接入窗口标题'
  });
  notify('Click2Save', '已收藏');
  sendSnapshot(statusLabel || '收藏成功');
}

function markPollingSuppressed(signature) {
  suppressedPollingSignature = signature || '';
  suppressedPollingUntil = Date.now() + SHORTCUT_POLL_SUPPRESS_MS;
}

function isConfiguredPostCopyKeyPressed() {
  const configured = normalizeConfiguredKey(getSettings().postCopyKey);
  if (configured === 'shift') return pressedKeys.shift;
  if (configured === 'ctrl' || configured === 'control') return pressedKeys.ctrl;
  if (configured === 'alt') return pressedKeys.alt;
  return false;
}

function shouldTriggerPostCopyCaptureNow() {
  return isConfiguredPostCopyKeyPressed();
}

function shouldPromoteToCommonNow() {
  return observing && pressedKeys.alt;
}

function createObserveContext(source) {
  return {
    source,
    copyActionCount: source === 'copy_shortcut' ? 1 : 0,
    startedAt: Date.now()
  };
}

function currentObserveStatusText() {
  if (!observeContext) {
    return '正在观察 1.5 秒复制窗口';
  }

  if (observeContext.source === 'copy_shortcut' && getSettings().doubleCopyEnabled) {
    return observeContext.copyActionCount >= 1
      ? '已记录一次复制，等待第二次复制或按键'
      : '正在等待复制动作';
  }

  return '正在观察 1.5 秒复制窗口';
}

function stopObserving() {
  observing = false;
  pendingPayload = null;
  observeContext = null;
  if (observeTimer) {
    clearTimeout(observeTimer);
    observeTimer = null;
  }
}

function startObserving(payload, source = 'clipboard_poll') {
  pendingPayload = payload;
  observing = true;
  observeContext = createObserveContext(source);

  const settings = getSettings();
  if (shouldPromoteToCommonNow()) {
    const current = pendingPayload;
    stopObserving();
    processPayload(current, 'copy_then_key', '已收藏到常用', { category: 'common' });
    return;
  }

  if (settings.copyThenKeyEnabled && shouldTriggerPostCopyCaptureNow()) {
    const current = pendingPayload;
    stopObserving();
    processPayload(current, 'copy_then_key', '复制后按键已收藏');
    return;
  }

  if (observeTimer) {
    clearTimeout(observeTimer);
  }
  observeTimer = setTimeout(() => {
    observeTimer = null;
    const latestSettings = getSettings();
    const current = pendingPayload;
    stopObserving();
    if (!current) {
      sendSnapshot('等待下一次复制');
      return;
    }
    if (!latestSettings.autoJudgmentEnabled || current.contentType !== 'text') {
      sendSnapshot('等待下一次复制');
      return;
    }
    const text = current.textContent || '';
    const keywordList = ['需求','待办','方案','结论','报错','异常','修复','客户反馈','会议','纪要','优化','requirement','todo','plan','solution','conclusion','error','exception','fix','feedback','meeting','minutes','optimize'];
    const matched = text.length >= 12 || /\r?\n/.test(text) || /https?:\/\//i.test(text) || keywordList.some((item) => text.toLowerCase().includes(item.toLowerCase()));
    if (matched) {
      processPayload(current, 'auto', '自动判断已收藏');
    } else {
      sendSnapshot('自动判断未命中');
    }
  }, OBSERVE_WINDOW_MS);
  sendSnapshot(currentObserveStatusText());
}

function handleClipboardChanged(payload, source = 'clipboard_poll') {
  if (altQFlowActive) return;
  const settings = getSettings();

  if (observing && source === 'copy_shortcut' && observeContext) {
    observeContext.copyActionCount += 1;
  }

  if (observing && settings.doubleCopyEnabled && observeContext && observeContext.source === 'copy_shortcut' && observeContext.copyActionCount >= 2) {
    const current = payload;
    stopObserving();
    processPayload(current, 'double_copy', '双复制已收藏');
    return;
  }

  startObserving(payload, source);
}

function handleCopyShortcutAction(payload) {
  if (!payload) {
    sendSnapshot('等待复制内容写入剪贴板');
    return;
  }

  lastClipboardSignature = payload.signature;
  markPollingSuppressed(payload.signature);
  handleClipboardChanged(payload, 'copy_shortcut');
}

function scheduleCopyShortcutRead(attempt = 0, previousSignature = lastClipboardSignature) {
  setTimeout(() => {
    const payload = readClipboardPayload();
    const imagePending = clipboardHasImageFormat();

    if (payload && payload.contentType === 'image') {
      handleCopyShortcutAction(payload);
      return;
    }

    if (payload && payload.signature !== previousSignature) {
      handleCopyShortcutAction(payload);
      return;
    }

    if (payload && attempt >= 3 && !imagePending) {
      handleCopyShortcutAction(payload);
      return;
    }

    if (attempt < COPY_SHORTCUT_MAX_RETRIES) {
      scheduleCopyShortcutRead(attempt + 1, previousSignature);
      return;
    }

    sendSnapshot('未读取到复制内容');
  }, COPY_SHORTCUT_POLL_DELAY_MS);
}

function isCopyShortcut(event) {
  const keycode = event.keycode;
  const isCKey = keycode === 46;
  const isInsertKey = keycode === 110;
  return (pressedKeys.ctrl && isCKey) || (pressedKeys.ctrl && pressedKeys.shift && isInsertKey);
}

function updateModifierState(event, isPressed) {
  const keycode = event.keycode;
  if (keycode === 42 || keycode === 54) {
    pressedKeys.shift = isPressed;
  }
  if (keycode === 29 || keycode === 3613) {
    pressedKeys.ctrl = isPressed;
  }
  if (keycode === 56 || keycode === 3640) {
    pressedKeys.alt = isPressed;
  }
}

function isConfiguredPostCopyKey(event, configured) {
  if (configured === 'shift') {
    return event.keycode === 42 || event.keycode === 54;
  }
  if (configured === 'ctrl' || configured === 'control') {
    return event.keycode === 29 || event.keycode === 3613;
  }
  if (configured === 'alt') {
    return event.keycode === 56 || event.keycode === 3640;
  }
  return false;
}

function setupClipboardPolling() {
  setInterval(() => {
    const payload = readClipboardPayload();
    if (!payload) return;
    if (payload.signature === suppressedPollingSignature && Date.now() <= suppressedPollingUntil) {
      lastClipboardSignature = payload.signature;
      return;
    }
    if (payload.signature === lastClipboardSignature) return;
    lastClipboardSignature = payload.signature;
    if (ignoreNextClipboardChange) {
      ignoreNextClipboardChange = false;
      return;
    }
    handleClipboardChanged(payload, 'clipboard_poll');
  }, 300);
}

function setupGlobalShortcuts() {
  globalShortcut.register(HOTKEY_ALT_Q, () => {
    const settings = getSettings();
    if (!settings.altQEnabled) return;
    altQFlowActive = true;
    ignoreNextClipboardChange = true;
    const payload = readClipboardPayload();
    if (payload) {
      processPayload(payload, 'hotkey_alt_q', 'Alt+Q 已收藏');
    }
    setTimeout(() => {
      altQFlowActive = false;
    }, 100);
  });
}

function normalizeConfiguredKey(value) {
  return String(value || '').trim().toLowerCase();
}

function applySystemSettings(settings) {
  try {
    app.setLoginItemSettings(getLoginItemConfig(settings.startupLaunchEnabled));
  } catch {}

  syncStartupSettingFromSystem();
  syncFloatingWindowVisibility();
}

function setupKeyboardListener() {
  if (!uIOhook || typeof uIOhook.on !== 'function') {
    uIOhook = null;
    sendSnapshot('全局按键监听不可用，仅保留复制轮询');
    return;
  }

  try {
    uIOhook.on('keydown', (event) => {
      updateModifierState(event, true);

      if (isCopyShortcut(event)) {
        scheduleCopyShortcutRead();
        return;
      }

      const settings = getSettings();
      const configured = normalizeConfiguredKey(settings.postCopyKey);

      if (!observing || !pendingPayload) return;

      if (event.keycode === 56 || event.keycode === 3640) {
        const current = pendingPayload;
        stopObserving();
        processPayload(current, 'copy_then_key', '已收藏到常用', { category: 'common' });
        return;
      }

      if (!settings.copyThenKeyEnabled) return;

      if (!isConfiguredPostCopyKey(event, configured)) {
        return;
      }

      const current = pendingPayload;
      stopObserving();
      processPayload(current, 'copy_then_key', '复制后按键已收藏');
    });

    uIOhook.on('keyup', (event) => {
      updateModifierState(event, false);
    });

    if (typeof uIOhook.start === 'function') {
      uIOhook.start();
    }
  } catch {
    uIOhook = null;
    sendSnapshot('全局按键监听启动失败，仅保留复制轮询');
  }
}

function setupIpc() {
  ipcMain.handle('get-initial-data', async () => ({
    records: storage.getAllRecords().map(normalizeRecord),
    dateFilters: storage.getDateFilters(),
    categoryFilters: storage.getCategoryFilters(),
    settings: getSettings(),
    statusText: '后台监听中'
  }));

  ipcMain.handle('save-settings', async (_, settings) => {
    try {
      const saved = storage.saveSettings({
        ...getSettings(),
        ...settings
      });
      applySystemSettings(saved);
      sendSnapshot('设置已保存');
      return { ok: true };
    } catch (error) {
      const message = error && error.message ? error.message : '保存设置失败';
      sendSnapshot(message);
      return { ok: false, message };
    }
  });

  ipcMain.handle('create-manual-text-record', async (_, text) => {
    const value = String(text || '').trim();
    if (!value) {
      return { ok: false, message: '内容不能为空' };
    }
    const duplicate = storage.findDuplicate({ contentType: 'text', textContent: value, signature: value });
    if (duplicate) {
      return { ok: false, message: '该文本已存在，未重复新增' };
    }
    storage.addManualTextRecord(value);
    sendSnapshot('手动新增成功');
    return { ok: true };
  });

  ipcMain.handle('update-record-content', async (_, payload) => {
    const result = storage.updateRecord(payload.id, { textContent: payload.textContent || '' });
    sendSnapshot('正文已保存');
    return { ok: !!result };
  });

  ipcMain.handle('update-record-note', async (_, payload) => {
    const result = storage.updateRecord(payload.id, { editableNote: payload.editableNote || '' });
    sendSnapshot('备注已保存');
    return { ok: !!result };
  });

  ipcMain.handle('delete-record', async (_, id) => {
    const ok = storage.deleteRecord(id);
    sendSnapshot('记录已删除');
    return { ok };
  });

  ipcMain.handle('open-image-path', async (_, imagePath) => {
    if (imagePath) {
      await shell.openPath(imagePath);
    }
    return { ok: true };
  });

  ipcMain.handle('copy-record-content', async (_, id) => {
    const record = storage.getAllRecords().find((item) => item.id === id);
    if (!record) {
      return { ok: false, message: '记录不存在' };
    }

    if (record.contentType === 'text') {
      clipboard.writeText(record.textContent || '');
      return { ok: true };
    }

    if (record.contentType === 'image' && record.imageDataUrl) {
      const image = nativeImage.createFromDataURL(record.imageDataUrl);
      clipboard.writeImage(image);
      return { ok: true };
    }

    return { ok: false, message: '该记录没有可复制内容' };
  });

  ipcMain.handle('move-record-to-common', async (_, id) => {
    const result = storage.updateRecord(id, { category: 'common' });
    sendSnapshot('已加入常用');
    return { ok: !!result };
  });

  ipcMain.handle('move-record-to-daily', async (_, id) => {
    const result = storage.updateRecord(id, { category: 'daily' });
    sendSnapshot('已移出常用');
    return { ok: !!result };
  });

  ipcMain.handle('open-main-window', async () => {
    showWindow();
    return { ok: true };
  });

  ipcMain.handle('floating-set-hovered', async (_, hovered) => {
    floatingHovered = !!hovered;
    const settings = getSettings();
    if (!settings.floatingIconEnabled || !settings.dockToEdgeEnabled || floatingDragState) {
      return { ok: true };
    }
    animateFloatingWindow(floatingHovered ? 'visible' : 'hidden');
    return { ok: true };
  });

  ipcMain.handle('floating-drag-start', async (_, payload = {}) => {
    if (!floatingWindow || floatingWindow.isDestroyed()) return { ok: false };
    stopFloatingAnimation();
    floatingPinnedVisible = true;
    floatingHovered = true;
    floatingDragState = {
      offsetX: Number(payload.offsetX) || 0,
      offsetY: Number(payload.offsetY) || 0
    };
    return { ok: true };
  });

  ipcMain.handle('floating-drag-move', async (_, payload = {}) => {
    if (!floatingWindow || floatingWindow.isDestroyed() || !floatingDragState) return { ok: false };
    const display = screen.getDisplayNearestPoint({ x: Number(payload.screenX) || 0, y: Number(payload.screenY) || 0 });
    const workArea = display.workArea;
    const nextX = Math.min(
      workArea.x + workArea.width - FLOATING_WINDOW_SIZE,
      Math.max(workArea.x, (Number(payload.screenX) || 0) - floatingDragState.offsetX)
    );
    const nextY = Math.min(
      workArea.y + workArea.height - FLOATING_WINDOW_SIZE,
      Math.max(workArea.y, (Number(payload.screenY) || 0) - floatingDragState.offsetY)
    );
    floatingWindow.setBounds({
      x: nextX,
      y: nextY,
      width: FLOATING_WINDOW_SIZE,
      height: FLOATING_WINDOW_SIZE
    });
    return { ok: true };
  });

  ipcMain.handle('floating-drag-end', async () => {
    if (!floatingWindow || floatingWindow.isDestroyed()) return { ok: false };
    const bounds = floatingWindow.getBounds();
    const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
    const workArea = display.workArea;
    const side = bounds.x + (FLOATING_WINDOW_SIZE / 2) < workArea.x + (workArea.width / 2) ? 'left' : 'right';
    const nextSettings = storage.saveSettings({
      ...getSettings(),
      floatingDockSide: side,
      floatingOffsetY: Math.max(0, bounds.y - workArea.y)
    });
    floatingDragState = null;
    floatingPinnedVisible = false;
    floatingHovered = false;
    if (nextSettings.dockToEdgeEnabled) {
      animateFloatingWindow('hidden');
    } else {
      positionFloatingWindow();
    }
    sendSnapshot('悬浮图标位置已更新');
    return { ok: true };
  });

  ipcMain.handle('window-minimize', async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
    return { ok: true };
  });

  ipcMain.handle('window-toggle-maximize', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return { ok: false };
    }

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return { ok: true, maximized: false };
    }

    mainWindow.maximize();
    return { ok: true, maximized: true };
  });

  ipcMain.handle('window-close', async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
    return { ok: true };
  });
}

app.whenReady().then(() => {
  storage = new StorageService(app.getPath('userData'));
  syncStartupSettingFromSystem();
  setupIpc();
  createWindow();
  createFloatingWindow();
  createTray();
  setupGlobalShortcuts();
  setupClipboardPolling();
  setupKeyboardListener();
  applySystemSettings(getSettings());
  screen.on('display-metrics-changed', positionFloatingWindow);
  sendSnapshot('后台监听中');
}).catch((error) => {
  console.error('App bootstrap failed:', error);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (uIOhook) {
    try { uIOhook.stop(); } catch {}
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    showWindow();
  }
});
