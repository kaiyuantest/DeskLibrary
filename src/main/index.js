const { execFileSync } = require('child_process');
const { app, BrowserWindow, Tray, Menu, globalShortcut, clipboard, nativeImage, ipcMain, Notification, shell, screen, dialog } = require('electron');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { pathToFileURL } = require('url');
const { StorageService } = require('./storage');
const { getDefaultSelfBuiltRoot, normalizeSelfBuiltRoot, openBrowserCard, runPythonBridge, scanBrowserCards } = require('./browser-import');
const { listSelfBuiltProfiles } = require('./browser-node-service');
let uIOhook = null;
try {
  const hookModule = require('uiohook-napi');
  uIOhook = hookModule?.uIOhook || hookModule?.default || hookModule;
} catch {
  uIOhook = null;
}

const OBSERVE_WINDOW_MS = 1500;
const COPY_SHORTCUT_POLL_DELAY_MS = 120;
const COPY_SHORTCUT_MAX_RETRIES = 15;
const SHORTCUT_POLL_SUPPRESS_MS = 1000;
const FLOATING_WINDOW_SIZE = 48;
const FLOATING_WINDOW_MARGIN = 6;
const FLOATING_VISIBLE_SLIVER = 16;
const FLOATING_SLIDE_STEP = 8;
const FLOATING_SLIDE_INTERVAL_MS = 10;
const FLOATING_HIDE_DELAY_MS = 180;
const FLOATING_EDGE_TRIGGER_SIZE = 18;
const FLOATING_MENU_GAP = 0;
const FLOATING_MENU_WIDTH = 228;
const FLOATING_MENU_HEIGHT = 228;
const MAIN_WINDOW_DOCK_THRESHOLD = 12;
const MAIN_WINDOW_VISIBLE_SLIVER = 2;
const MAIN_WINDOW_HIDDEN_OVERDRAW = 14;
const MAIN_WINDOW_EDGE_TRIGGER_SIZE = 18;
const MAIN_WINDOW_SLIDE_STEP = 20;
const MAIN_WINDOW_SLIDE_INTERVAL_MS = 10;
const MAIN_WINDOW_HIDE_DELAY_MS = 220;
const HOVER_SYNC_INTERVAL_MS = 120;
const ACTIVE_WINDOW_HELPER_PATH = path.join(__dirname, 'bin', 'ActiveWindowInfo.exe');

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
let suppressedPollingSignature = '';
let suppressedPollingUntil = 0;
let lastShortcutSourceContext = null;
let pressedKeys = {
  shift: false,
  ctrl: false,
  alt: false,
  meta: false
};
let floatingSlideTimer = null;
let floatingDragState = null;
let floatingHovered = false;
let floatingPinnedVisible = false;
let floatingBoundsCache = null;
let floatingAnchorBoundsCache = null;
let floatingHideTimer = null;
let floatingMenuOpen = false;
let floatingMenuSide = 'right';
let accumulationSession = null;
let mainWindowHovered = false;
let mainWindowSlideTimer = null;
let mainWindowDockMode = 'visible';
let mainWindowDockCache = null;
let mainWindowHideTimer = null;
let hoverSyncTimer = null;
let registeredGlobalAccelerators = [];

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

function mergeBrowserCardCookies(existingCookies = [], incomingCookies = []) {
  const merged = new Map();
  const makeKey = (cookie = {}) => [
    String(cookie.domain || '').trim().toLowerCase(),
    String(cookie.path || '/').trim() || '/',
    String(cookie.name || '').trim()
  ].join('|');

  for (const cookie of Array.isArray(existingCookies) ? existingCookies : []) {
    if (!cookie || typeof cookie !== 'object') continue;
    merged.set(makeKey(cookie), cookie);
  }

  // 新 Cookie 优先覆盖旧 Cookie，避免卡片中的陈旧会话再次被注入。
  for (const cookie of Array.isArray(incomingCookies) ? incomingCookies : []) {
    if (!cookie || typeof cookie !== 'object') continue;
    merged.set(makeKey(cookie), cookie);
  }

  return [...merged.values()];
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
  mainWindow.on('move', () => {
    if (mainWindowSlideTimer || !mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible() || mainWindow.isMaximized()) {
      return;
    }
    if (mainWindowDockMode === 'visible') {
      updateMainWindowDockCache();
    }
  });
  mainWindow.on('resize', () => {
    if (mainWindowSlideTimer || !mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible() || mainWindow.isMaximized()) {
      return;
    }
    if (mainWindowDockMode === 'visible') {
      updateMainWindowDockCache();
    }
  });
  mainWindow.on('maximize', () => {
    stopMainWindowAnimation();
    mainWindowDockMode = 'visible';
  });
  mainWindow.on('unmaximize', () => {
    updateMainWindowDockCache();
    syncMainWindowDockVisibility();
  });
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      clearMainWindowHideTimer();
      stopMainWindowAnimation();
      mainWindow.setSkipTaskbar(true);
      mainWindow.hide();
    }
  });
}

function getFloatingAnchorBounds(mode = 'hidden') {
  const settings = getSettings();
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const workArea = display.workArea;
  const side = settings.floatingDockSide === 'left' ? 'left' : 'right';
  const offsetX = Number.isFinite(settings.floatingOffsetX) ? settings.floatingOffsetX : null;
  const offsetY = Number.isFinite(settings.floatingOffsetY) ? settings.floatingOffsetY : null;
  const maxX = workArea.x + workArea.width - FLOATING_WINDOW_SIZE - FLOATING_WINDOW_MARGIN;
  const maxY = workArea.y + workArea.height - FLOATING_WINDOW_SIZE - FLOATING_WINDOW_MARGIN;
  const fallbackY = settings.dockToEdgeEnabled
    ? workArea.y + Math.round((workArea.height - FLOATING_WINDOW_SIZE) / 2)
    : workArea.y + workArea.height - FLOATING_WINDOW_SIZE - 96;
  const y = Math.min(maxY, Math.max(workArea.y + FLOATING_WINDOW_MARGIN, offsetY === null ? fallbackY : workArea.y + offsetY));

  let x = Math.min(maxX, Math.max(workArea.x + FLOATING_WINDOW_MARGIN, offsetX === null ? maxX : workArea.x + offsetX));
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
    height: FLOATING_WINDOW_SIZE,
    side,
    workArea
  };
}

function getFloatingBounds(mode = 'hidden', expanded = floatingMenuOpen) {
  const anchor = floatingAnchorBoundsCache || getFloatingAnchorBounds(mode);
  const display = screen.getDisplayMatching(anchor);
  const workArea = display.workArea;
  const side = anchor.side || (getSettings().floatingDockSide === 'left' ? 'left' : 'right');
  const buttonSize = FLOATING_WINDOW_SIZE;
  const width = expanded ? FLOATING_MENU_WIDTH : buttonSize;
  const availableHeight = Math.max(buttonSize, workArea.height - FLOATING_WINDOW_MARGIN * 2);
  const height = expanded ? Math.min(availableHeight, FLOATING_MENU_HEIGHT) : buttonSize;
  const maxX = workArea.x + workArea.width - width;
  const maxY = workArea.y + workArea.height - height;
  let x = anchor.x;
  let y = Math.max(workArea.y, Math.min(anchor.y, maxY));

  if (expanded) {
    const centerX = anchor.x + (buttonSize / 2);
    const centerY = anchor.y + (buttonSize / 2);
    x = Math.round(centerX - (width / 2));
    y = Math.round(centerY - (height / 2));
    x = Math.max(workArea.x, Math.min(x, maxX));
    y = Math.max(workArea.y, Math.min(y, maxY));
    floatingMenuSide = side === 'left' ? 'left' : 'right';
  } else {
    floatingMenuSide = side === 'left' ? 'left' : 'right';
    x = Math.max(workArea.x, Math.min(anchor.x, maxX));
  }

  return {
    x,
    y,
    width,
    height,
    anchorX: anchor.x,
    anchorY: anchor.y,
    side,
    workArea
  };
}

function stopFloatingAnimation() {
  if (floatingSlideTimer) {
    clearInterval(floatingSlideTimer);
    floatingSlideTimer = null;
  }
}

function clearFloatingHideTimer() {
  if (floatingHideTimer) {
    clearTimeout(floatingHideTimer);
    floatingHideTimer = null;
  }
}

function clearMainWindowHideTimer() {
  if (mainWindowHideTimer) {
    clearTimeout(mainWindowHideTimer);
    mainWindowHideTimer = null;
  }
}

function isPointInsideBounds(point, bounds) {
  if (!point || !bounds) return false;
  return point.x >= bounds.x
    && point.x < bounds.x + bounds.width
    && point.y >= bounds.y
    && point.y < bounds.y + bounds.height;
}

function isPointInsideVerticalEdgeZone(point, workArea, side, top, height, triggerSize) {
  if (!point || !workArea) return false;
  const withinY = point.y >= top && point.y < top + height;
  if (!withinY) return false;

  if (side === 'left') {
    return point.x >= workArea.x && point.x < workArea.x + triggerSize;
  }

  return point.x >= workArea.x + workArea.width - triggerSize
    && point.x < workArea.x + workArea.width;
}

function stopMainWindowAnimation() {
  if (mainWindowSlideTimer) {
    clearInterval(mainWindowSlideTimer);
    mainWindowSlideTimer = null;
  }
}

function animateWindowToBounds(windowRef, target, options = {}) {
  const {
    stop,
    setTimer,
    step = MAIN_WINDOW_SLIDE_STEP,
    interval = MAIN_WINDOW_SLIDE_INTERVAL_MS,
    onReached
  } = options;

  if (!windowRef || windowRef.isDestroyed()) return;
  stop();
  const current = windowRef.getBounds();
  if (current.x === target.x && current.y === target.y && current.width === target.width && current.height === target.height) {
    if (typeof onReached === 'function') {
      onReached(target);
    }
    return;
  }

  const timer = setInterval(() => {
    if (!windowRef || windowRef.isDestroyed()) {
      stop();
      return;
    }

    const next = windowRef.getBounds();
    const deltaX = target.x - next.x;
    const deltaY = target.y - next.y;
    const stepX = Math.abs(deltaX) <= step ? deltaX : Math.sign(deltaX) * step;
    const stepY = Math.abs(deltaY) <= step ? deltaY : Math.sign(deltaY) * step;
    const updated = {
      x: next.x + stepX,
      y: next.y + stepY,
      width: target.width,
      height: target.height
    };
    windowRef.setBounds(updated);

    if (updated.x === target.x && updated.y === target.y) {
      stop();
      if (typeof onReached === 'function') {
        onReached(target);
      }
    }
  }, interval);

  setTimer(timer);
}

function animateFloatingWindow(mode = 'hidden') {
  if (!floatingWindow || floatingWindow.isDestroyed()) return;
  const target = getFloatingBounds(mode, false);
  animateWindowToBounds(floatingWindow, target, {
    stop: stopFloatingAnimation,
    setTimer: (timer) => {
      floatingSlideTimer = timer;
    },
    step: FLOATING_SLIDE_STEP,
    interval: FLOATING_SLIDE_INTERVAL_MS,
    onReached: (bounds) => {
      floatingBoundsCache = bounds;
      floatingAnchorBoundsCache = {
        x: bounds.x,
        y: bounds.y,
        width: FLOATING_WINDOW_SIZE,
        height: FLOATING_WINDOW_SIZE,
        side: getSettings().floatingDockSide === 'left' ? 'left' : 'right'
      };
    }
  });
}

function getCurrentFloatingAnchorBounds() {
  if (!floatingWindow || floatingWindow.isDestroyed()) {
    return floatingAnchorBoundsCache;
  }

  const bounds = floatingWindow.getBounds();
  if (floatingMenuOpen) {
    const anchorX = Math.round(bounds.x + ((bounds.width - FLOATING_WINDOW_SIZE) / 2));
    const anchorY = Math.round(bounds.y + ((bounds.height - FLOATING_WINDOW_SIZE) / 2));
    return {
      x: anchorX,
      y: anchorY,
      width: FLOATING_WINDOW_SIZE,
      height: FLOATING_WINDOW_SIZE,
      side: getSettings().floatingDockSide === 'left' ? 'left' : 'right'
    };
  }

  return {
    x: bounds.x,
    y: bounds.y,
    width: FLOATING_WINDOW_SIZE,
    height: FLOATING_WINDOW_SIZE,
    side: (() => {
      const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
      const workArea = display.workArea;
      return bounds.x + (FLOATING_WINDOW_SIZE / 2) < workArea.x + (workArea.width / 2) ? 'left' : 'right';
    })()
  };
}

function positionFloatingWindow() {
  if (!floatingWindow || floatingWindow.isDestroyed()) return;
  const dockable = getSettings().dockToEdgeEnabled && !(accumulationSession && accumulationSession.active);
  const mode = dockable && !floatingHovered && !floatingPinnedVisible && !floatingMenuOpen ? 'hidden' : 'visible';
  const anchor = getFloatingAnchorBounds(mode);
  floatingAnchorBoundsCache = anchor;
  const bounds = getFloatingBounds(mode, floatingMenuOpen);
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
    backgroundColor: '#00000000',
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
    sendFloatingMenuState();
  });
  floatingWindow.on('blur', () => {
    if (floatingMenuOpen && !floatingDragState) {
      closeFloatingMenu();
    }
  });
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('DeskLibrary');
  const menu = Menu.buildFromTemplate([
    { label: '打开主界面', click: () => showWindow() },
    { type: 'separator' },
    { label: '退出程序', click: () => quitApp() }
  ]);
  tray.setContextMenu(menu);
  tray.on('double-click', showWindow);
}

function openFloatingMenu() {
  floatingAnchorBoundsCache = getCurrentFloatingAnchorBounds() || floatingAnchorBoundsCache;
  floatingMenuOpen = true;
  floatingPinnedVisible = true;
  floatingHovered = true;
  clearFloatingHideTimer();
  positionFloatingWindow();
  sendFloatingMenuState();
}

function closeFloatingMenu() {
  if (!floatingMenuOpen) return;
  floatingAnchorBoundsCache = getCurrentFloatingAnchorBounds() || floatingAnchorBoundsCache;
  floatingMenuOpen = false;
  floatingPinnedVisible = false;
  positionFloatingWindow();
  sendFloatingMenuState();
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
  mainWindowHovered = true;
  clearMainWindowHideTimer();
  updateMainWindowDockCache();
  syncMainWindowDockVisibility(true);
  mainWindow.focus();
  sendSnapshot();
}

function hideMainWindowToDock(side = null) {
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible() || mainWindow.isMinimized() || mainWindow.isMaximized()) {
    return false;
  }

  const currentBounds = mainWindow.getBounds();
  const display = screen.getDisplayMatching(currentBounds);
  const workArea = display.workArea;
  const nextSide = side === 'left' || side === 'right'
    ? side
    : ((mainWindowDockCache && (mainWindowDockCache.side === 'left' || mainWindowDockCache.side === 'right'))
      ? mainWindowDockCache.side
      : 'right');
  const y = Math.max(workArea.y, Math.min(currentBounds.y, workArea.y + workArea.height - currentBounds.height));
  const visibleBounds = {
    x: nextSide === 'left' ? workArea.x : workArea.x + workArea.width - currentBounds.width,
    y,
    width: currentBounds.width,
    height: currentBounds.height
  };

  mainWindowDockCache = {
    ...visibleBounds,
    side: nextSide
  };
  mainWindowHovered = false;
  clearMainWindowHideTimer();
  animateMainWindow('hidden');
  return true;
}

function getMainWindowDockState() {
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible() || mainWindow.isMinimized() || mainWindow.isMaximized()) {
    return null;
  }

  const currentBounds = mainWindow.getBounds();
  const referenceBounds = mainWindowDockMode === 'hidden' && mainWindowDockCache
    ? mainWindowDockCache
    : currentBounds;
  const display = screen.getDisplayMatching(referenceBounds);
  const workArea = display.workArea;
  const width = referenceBounds.width;
  const height = referenceBounds.height;
  const leftVisibleX = workArea.x;
  const workAreaRightX = workArea.x + workArea.width;
  const rightVisibleX = workArea.x + workArea.width - width;
  const referenceRightX = referenceBounds.x + width;
  const distanceLeft = Math.abs(referenceBounds.x - leftVisibleX);
  const distanceRight = Math.abs(referenceBounds.x - rightVisibleX);
  const overflowLeft = referenceBounds.x < leftVisibleX;
  const overflowRight = referenceRightX > workAreaRightX;
  const touchLeftEdge = referenceBounds.x <= leftVisibleX;
  const touchRightEdge = referenceRightX >= workAreaRightX;
  const nearDockEdge = Math.min(distanceLeft, distanceRight) <= MAIN_WINDOW_DOCK_THRESHOLD;
  const dockEligible = mainWindowDockMode === 'hidden' || nearDockEdge || touchLeftEdge || touchRightEdge;
  let side = distanceLeft <= distanceRight ? 'left' : 'right';
  if (overflowLeft && !overflowRight) {
    side = 'left';
  } else if (overflowRight && !overflowLeft) {
    side = 'right';
  }

  if (!dockEligible) {
    return null;
  }

  const y = Math.max(workArea.y, Math.min(referenceBounds.y, workArea.y + workArea.height - height));
  const visibleBounds = {
    x: side === 'left' ? leftVisibleX : rightVisibleX,
    y,
    width,
    height
  };
  const hiddenBounds = {
    x: side === 'left'
      ? workArea.x - width + MAIN_WINDOW_VISIBLE_SLIVER - MAIN_WINDOW_HIDDEN_OVERDRAW
      : workArea.x + workArea.width - MAIN_WINDOW_VISIBLE_SLIVER + MAIN_WINDOW_HIDDEN_OVERDRAW,
    y,
    width,
    height
  };

  return {
    side,
    workArea,
    visibleBounds,
    hiddenBounds
  };
}

function updateMainWindowDockCache() {
  const dockState = getMainWindowDockState();
  if (!dockState) {
    return null;
  }

  mainWindowDockCache = {
    ...dockState.visibleBounds,
    side: dockState.side
  };
  return dockState;
}

function animateMainWindow(mode = 'hidden') {
  const dockState = getMainWindowDockState();
  if (!dockState) {
    return;
  }

  const target = mode === 'visible' ? dockState.visibleBounds : dockState.hiddenBounds;
  animateWindowToBounds(mainWindow, target, {
    stop: stopMainWindowAnimation,
    setTimer: (timer) => {
      mainWindowSlideTimer = timer;
    },
    step: MAIN_WINDOW_SLIDE_STEP,
    interval: MAIN_WINDOW_SLIDE_INTERVAL_MS,
    onReached: () => {
      mainWindowDockMode = mode;
      if (mode === 'visible') {
        mainWindowDockCache = {
          ...dockState.visibleBounds,
          side: dockState.side
        };
      }
    }
  });
}

function syncMainWindowDockVisibility(forceVisible = false) {
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible()) {
    return;
  }

  const settings = getSettings();
  if (!settings.dockToEdgeEnabled || mainWindow.isMaximized()) {
    clearMainWindowHideTimer();
    if (mainWindowDockMode === 'hidden' && mainWindowDockCache) {
      animateMainWindow('visible');
    } else {
      stopMainWindowAnimation();
      mainWindowDockMode = 'visible';
    }
    return;
  }

  const dockState = updateMainWindowDockCache();
  if (!dockState) {
    clearMainWindowHideTimer();
    stopMainWindowAnimation();
    mainWindowDockMode = 'visible';
    return;
  }

  if (forceVisible || mainWindowHovered) {
    clearMainWindowHideTimer();
    animateMainWindow('visible');
    return;
  }

  if (mainWindowDockMode === 'hidden') {
    return;
  }

  clearMainWindowHideTimer();
  mainWindowHideTimer = setTimeout(() => {
    mainWindowHideTimer = null;
    if (!mainWindowHovered) {
      animateMainWindow('hidden');
    }
  }, MAIN_WINDOW_HIDE_DELAY_MS);
}

function syncFloatingWindowVisibility() {
  if (!floatingWindow || floatingWindow.isDestroyed()) return;
  try {
    const settings = getSettings();
    const dockable = settings.dockToEdgeEnabled
      && (settings.floatingDockSide === 'left' || settings.floatingDockSide === 'right')
      && !(accumulationSession && accumulationSession.active)
      && !floatingMenuOpen;
    const mode = dockable && !floatingHovered && !floatingPinnedVisible ? 'hidden' : 'visible';
    if (settings.floatingIconEnabled) {
      clearFloatingHideTimer();
      if (dockable) {
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
    sendFloatingMenuState();
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

function getAccumulationState() {
  const settings = getSettings();
  return {
    active: !!(accumulationSession && accumulationSession.active),
    count: accumulationSession ? Number(accumulationSession.segmentCount || 0) : 0,
    finishShortcutLabel: settings.accumulationFinishShortcut || '',
    cancelShortcutLabel: settings.accumulationCancelShortcut || ''
  };
}

function buildRecordPreview(record) {
  if (!record) return '';
  if (record.contentType === 'text') {
    const text = String(record.textContent || '').replace(/\s+/g, ' ').trim();
    return text.length > 16 ? `${text.slice(0, 16)}...` : (text || '文本记录');
  }
  return path.basename(record.imagePath || '') || '图片记录';
}

function getLastCaptureState() {
  const settings = getSettings();
  const record = storage.getAllRecords()[0];
  if (!record) {
    return {
      available: false,
      preview: '',
      shortcutLabel: settings.deleteLastCaptureShortcut || ''
    };
  }

  return {
    available: true,
    preview: buildRecordPreview(record),
    shortcutLabel: settings.deleteLastCaptureShortcut || ''
  };
}

function sendFloatingMenuState() {
  if (!floatingWindow || floatingWindow.isDestroyed() || !floatingWindow.webContents || floatingWindow.webContents.isDestroyed()) {
    return;
  }
  const settings = getSettings();
  const customPath = String(settings.floatingIconCustomPath || '').trim();
  const customIconUrl = customPath && fs.existsSync(customPath)
    ? pathToFileURL(customPath).href
    : '';
  const opacityRaw = Number(settings.floatingIconOpacity);
  const floatingIconOpacity = Number.isFinite(opacityRaw) ? Math.max(0.2, Math.min(1, opacityRaw)) : 1;
  floatingWindow.webContents.send('floating-menu-state', {
    open: floatingMenuOpen,
    dockSide: settings.floatingDockSide === 'left' ? 'left' : 'right',
    menuSide: floatingMenuSide,
    accumulation: getAccumulationState(),
    lastCapture: getLastCaptureState(),
    floatingIconOpacity,
    floatingIconCustomPath: customPath,
    floatingIconCustomUrl: customIconUrl
  });
}

function execForegroundProbe(command, args, parser) {
  try {
    const output = execFileSync(command, args, {
      windowsHide: true,
      encoding: 'utf8',
      timeout: 1200
    }).trim();
    return parser(output);
  } catch {
    return null;
  }
}

function readForegroundWindowViaHelper() {
  if (process.platform !== 'win32') return null;
  if (!fs.existsSync(ACTIVE_WINDOW_HELPER_PATH)) return null;
  return execForegroundProbe(ACTIVE_WINDOW_HELPER_PATH, [], (output) => {
    if (!output) return null;
    const [processName = '', ...titleParts] = String(output).split('|');
    return {
      processName: processName.trim(),
      processPath: '',
      title: titleParts.join('|').trim()
    };
  });
}

function readForegroundWindowViaPowerShell() {
  const script = [
    'Add-Type @\'',
    'using System;',
    'using System.Runtime.InteropServices;',
    'using System.Text;',
    'public static class DeskLibraryNative {',
    '  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();',
    '  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);',
    '  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);',
    '}',
    '\'@',
    '$hwnd = [DeskLibraryNative]::GetForegroundWindow()',
    'if ($hwnd -eq [IntPtr]::Zero) { return }',
    '$titleBuilder = New-Object System.Text.StringBuilder 1024',
    '[void][DeskLibraryNative]::GetWindowText($hwnd, $titleBuilder, $titleBuilder.Capacity)',
    '$pid = 0',
    '[void][DeskLibraryNative]::GetWindowThreadProcessId($hwnd, [ref]$pid)',
    '$process = Get-Process -Id $pid -ErrorAction SilentlyContinue',
    '$processName = ""',
    '$processPath = ""',
    'if ($process) {',
    '  try { $processName = [string]$process.ProcessName } catch {}',
    '  try { $processPath = [string]$process.Path } catch {}',
    '  if (-not $processPath) {',
    '    try { $processPath = [string]$process.MainModule.FileName } catch {}',
    '  }',
    '}',
    '[pscustomobject]@{',
    '  title = [string]$titleBuilder.ToString()',
    '  processName = $processName',
    '  processPath = $processPath',
    '  pid = [int]$pid',
    '} | ConvertTo-Json -Compress'
  ].join('\n');

  return execForegroundProbe('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], (output) => {
    if (!output) return null;
    return JSON.parse(output);
  });
}

function readForegroundWindowViaPidOnly() {
  const script = [
    'Add-Type @\'',
    'using System;',
    'using System.Runtime.InteropServices;',
    'public static class DeskLibraryPidOnly {',
    '  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();',
    '  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);',
    '}',
    '\'@',
    '$hwnd = [DeskLibraryPidOnly]::GetForegroundWindow()',
    'if ($hwnd -eq [IntPtr]::Zero) { return }',
    '$pid = 0',
    '[void][DeskLibraryPidOnly]::GetWindowThreadProcessId($hwnd, [ref]$pid)',
    '$process = Get-Process -Id $pid -ErrorAction SilentlyContinue',
    '[pscustomobject]@{',
    '  processName = if ($process) { [string]$process.ProcessName } else { "" }',
    '  processPath = ""',
    '  title = ""',
    '  pid = [int]$pid',
    '} | ConvertTo-Json -Compress'
  ].join('\n');

  return execForegroundProbe('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], (output) => {
    if (!output) return null;
    return JSON.parse(output);
  });
}

function getForegroundWindowContext() {
  if (process.platform !== 'win32') {
    return {
      sourceApp: '未知应用',
      windowTitle: '未获取到窗口标题'
    };
  }

  const payload = readForegroundWindowViaHelper()
    || readForegroundWindowViaPowerShell()
    || readForegroundWindowViaPidOnly()
    || {};

  return {
    sourceApp: normalizeSourceAppName(payload.processName, payload.processPath),
    windowTitle: String(payload.title || '').trim() || '未获取到窗口标题'
  };
}

function normalizeSourceAppName(processName = '', processPath = '') {
  const rawName = String(processName || '').trim();
  const lowerName = rawName.toLowerCase();
  const fileName = path.basename(String(processPath || '').trim() || rawName).toLowerCase();
  const identity = `${lowerName}|${fileName}`;

  if (identity.includes('weixin') || identity.includes('wechat')) return '微信';
  if (identity.includes('qq')) return 'QQ';
  if (identity.includes('chrome')) return 'Google Chrome';
  if (identity.includes('msedge')) return 'Microsoft Edge';
  if (identity.includes('firefox')) return 'Firefox';
  if (identity.includes('explorer')) return '资源管理器';
  if (identity.includes('code')) return 'Visual Studio Code';
  if (identity.includes('powershell') || identity.includes('pwsh')) return 'PowerShell';
  return rawName || '未知应用';
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
      accumulation: '累计复制',
      double_copy: '累计复制收藏',
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

function normalizeAsset(asset) {
  const primaryPath = asset.primaryPath || (asset.mode === 'backup' && asset.storedPath ? asset.storedPath : asset.sourcePath);
  return {
    ...asset,
    primaryPath,
    modeDisplay: asset.mode === 'backup' ? '完整备份' : '快捷入口',
    entryTypeDisplay: asset.entryType === 'folder' ? '文件夹' : '文件',
    statusDisplay: asset.exists ? '可用' : '路径失效',
    createdAtDisplay: new Date(asset.createdAt).toLocaleString('zh-CN', { hour12: false }),
    updatedAtDisplay: new Date(asset.updatedAt).toLocaleString('zh-CN', { hour12: false }),
    sourcePathDisplay: asset.sourcePath || '未记录原路径',
    storedPathDisplay: asset.storedPath || '未生成备份副本',
    previewUrl: asset.isImage && primaryPath ? pathToFileURL(primaryPath).href : '',
    hasSecondaryOpen: !!asset.storedPath && !!asset.sourcePath && asset.storedPath !== asset.sourcePath
  };
}

function normalizeBrowserCard(card) {
  return {
    ...card,
    nameDisplay: card.name || String(card.domain || '').replace(/^\.+/, '') || '未命名卡片',
    domainDisplay: String(card.domain || '').replace(/^\.+/, '') || 'unknown',
    sourceTypeDisplay: card.sourceType === 'chrome_profile'
      ? '系统 Chrome'
      : card.sourceType === 'self_built'
        ? '自建浏览器'
        : card.sourceType === 'bitbrowser'
          ? '比特浏览器'
        : '未知来源',
    cookiePreview: Array.isArray(card.cookieNames) ? card.cookieNames.slice(0, 8).join(', ') : '',
    lastUsedMethodDisplay: {
      inject: '注入',
      db_write: 'DB写入',
      default_open: '默认打开'
    }[card.last_used_method] || '',
    updatedAtDisplay: new Date(card.updatedAt || card.createdAt || Date.now()).toLocaleString('zh-CN', { hour12: false })
  };
}

function defaultStatusText() {
  if (accumulationSession && accumulationSession.active) {
    return `累计复制中，已收集 ${accumulationSession.segmentCount || 0} 段`;
  }
  if (observing) {
    return currentObserveStatusText();
  }
  return '后台监听中';
}

function getPythonBridgeConfig(projectPathOverride = '') {
  const settings = getSettings();
  const selfBuiltWorkspaceDir = settings.selfBuiltWorkspaceDir || settings.selfBuiltUserDataRoot || settings.browserScanRoot || '';
  return {
    projectPath: projectPathOverride || settings.pythonCookieProjectPath,
    cfg: {
      self_built_workspace_dir: selfBuiltWorkspaceDir,
      self_built_root: selfBuiltWorkspaceDir,
      self_built_chrome_path: settings.selfBuiltChromePath || '',
      self_built_chromedriver_path: settings.selfBuiltChromedriverPath || '',
      bit_api_url: settings.bitApiUrl || 'http://127.0.0.1:54345',
      bit_api_token: settings.bitApiToken || ''
    }
  };
}

function getPythonBridgeConfigFromPayload(payload = {}) {
  const settings = getSettings();
  const selfBuiltWorkspaceDir = settings.selfBuiltWorkspaceDir
    || settings.selfBuiltUserDataRoot
    || settings.browserScanRoot
    || String(payload.selfBuiltWorkspaceDir || payload.selfBuiltRoot || '').trim()
    || '';
  return {
    projectPath: String(payload.projectPath || '').trim() || settings.pythonCookieProjectPath,
    cfg: {
      self_built_workspace_dir: selfBuiltWorkspaceDir,
      self_built_root: selfBuiltWorkspaceDir,
      self_built_chrome_path: String(payload.selfBuiltChromePath || '').trim() || settings.selfBuiltChromePath || '',
      self_built_chromedriver_path: String(payload.selfBuiltChromedriverPath || '').trim() || settings.selfBuiltChromedriverPath || '',
      bit_api_url: String(payload.bitApiUrl || '').trim() || settings.bitApiUrl || 'http://127.0.0.1:54345',
      bit_api_token: String(payload.bitApiToken || '').trim() || settings.bitApiToken || ''
    }
  };
}

function sendSnapshot(statusText) {
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
}

function requestUrlStatus(targetUrl) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      resolve({ ok: false, title: 'URL 无效' });
      return;
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(parsed, {
      method: 'GET',
      timeout: 8000,
      headers: {
        'User-Agent': 'DeskLibrary/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      const ok = Number(res.statusCode || 0) >= 200 && Number(res.statusCode || 0) < 400;
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        if (body.length < 32768) {
          body += chunk;
        }
      });
      res.on('end', () => {
        const match = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const pageTitle = match ? match[1].replace(/\s+/g, ' ').trim() : '';
        resolve({
          ok,
          title: pageTitle || `${res.statusCode || 0} ${res.statusMessage || ''}`.trim()
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.on('error', (error) => {
      resolve({ ok: false, title: error && error.message ? error.message : '连接失败' });
    });
    req.end();
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
  const sourceContext = {
    ...getForegroundWindowContext(),
    ...(options.sourceContext || {})
  };
  const duplicate = storage.findDuplicate(payload);
  if (duplicate) {
    const isExplicitCapture = method !== 'auto';
    const nextUpdates = {
      sourceApp: sourceContext.sourceApp || duplicate.sourceApp || '',
      windowTitle: sourceContext.windowTitle || duplicate.windowTitle || ''
    };
    if (category === 'common' || isExplicitCapture) {
      if (category === 'common' && (duplicate.category || 'daily') !== 'common') {
        nextUpdates.category = 'common';
      }
      storage.touchRecord(duplicate.id, nextUpdates);
      notify('DeskLibrary', category === 'common' ? '已加入常用' : '已命中现有收藏');
      sendSnapshot(category === 'common' ? '已加入常用' : '已更新现有收藏');
      return;
    }
    if (storage.shouldNotifyDuplicate(duplicate.id)) {
      storage.touchRecord(duplicate.id, nextUpdates);
      storage.markDuplicateNotified(duplicate.id);
      notify('DeskLibrary', '内容已存在');
    } else {
      storage.touchRecord(duplicate.id, nextUpdates);
    }
    sendSnapshot('检测到重复内容');
    return;
  }

  storage.addRecord(payload, method, {
    category,
    sourceApp: sourceContext.sourceApp,
    windowTitle: sourceContext.windowTitle
  });
  notify('DeskLibrary', '已收藏');
  sendSnapshot(statusLabel || '收藏成功');
  sendFloatingMenuState();
}

function quickCaptureClipboard(options = {}) {
  const clip = readClipboardPayload();
  if (!clip) {
    sendSnapshot('剪贴板里没有可收藏内容');
    sendFloatingMenuState();
    return { ok: false, message: '剪贴板里没有可收藏内容' };
  }

  processPayload(
    clip,
    options.method || 'manual',
    options.category === 'common' ? '已加入常用' : '已收藏',
    { category: options.category === 'common' ? 'common' : 'daily' }
  );
  return { ok: true };
}

function formatAccumulationText(segments = []) {
  return segments.map((item) => String(item.text || '').trim()).filter(Boolean).join('\n');
}

function startAccumulation() {
  stopObserving();
  accumulationSession = {
    active: true,
    recordId: null,
    segments: [],
    segmentCount: 0,
    lastPayloadSignature: '',
    lastPayloadAt: 0
  };
  floatingPinnedVisible = true;
  floatingHovered = true;
  clearFloatingHideTimer();
  sendFloatingMenuState();
  syncFloatingWindowVisibility();
  sendSnapshot('累计复制已开始');
  return { ok: true };
}

function appendAccumulationPayload(payload) {
  if (!accumulationSession || !accumulationSession.active) {
    return { ok: false, message: '当前没有进行中的累计复制' };
  }

  if (!payload || payload.contentType !== 'text') {
    sendSnapshot('累计复制仅支持文本内容');
    return { ok: false, message: '累计复制仅支持文本内容' };
  }

  const text = String(payload.textContent || '').trim();
  if (!text) {
    return { ok: false, message: '内容不能为空' };
  }

  const now = Date.now();
  const signature = String(payload.signature || '');
  if (
    signature
    && accumulationSession.lastPayloadSignature === signature
    && now - Number(accumulationSession.lastPayloadAt || 0) < 1200
  ) {
    sendSnapshot(`累计复制中，已收集 ${accumulationSession.segmentCount} 段`);
    return {
      ok: true,
      duplicated: true,
      recordId: accumulationSession.recordId,
      count: accumulationSession.segmentCount
    };
  }

  accumulationSession.segments.push({ text });
  accumulationSession.segmentCount = accumulationSession.segments.length;
  accumulationSession.lastPayloadSignature = signature;
  accumulationSession.lastPayloadAt = now;
  const mergedText = formatAccumulationText(accumulationSession.segments);

  if (!accumulationSession.recordId) {
    const sourceContext = getForegroundWindowContext();
    const created = storage.addRecord({
      contentType: 'text',
      textContent: mergedText,
      signature: storage.hashText(mergedText)
    }, 'accumulation', {
      category: 'daily',
      sourceApp: sourceContext.sourceApp,
      windowTitle: sourceContext.windowTitle
    });
    storage.updateRecord(created.id, {
      accumulationActive: true,
      accumulationCount: accumulationSession.segmentCount,
      accumulationSegments: accumulationSession.segments
    });
    accumulationSession.recordId = created.id;
  } else {
    storage.updateRecord(accumulationSession.recordId, {
      textContent: mergedText,
      accumulationActive: true,
      accumulationCount: accumulationSession.segmentCount,
      accumulationSegments: accumulationSession.segments,
      lastCapturedAt: new Date().toISOString()
    });
  }

  sendFloatingMenuState();
  sendSnapshot(`累计复制中，已收集 ${accumulationSession.segmentCount} 段`);
  return { ok: true, recordId: accumulationSession.recordId, count: accumulationSession.segmentCount };
}

function undoAccumulation() {
  if (!accumulationSession || !accumulationSession.active) {
    sendSnapshot('当前没有进行中的累计复制');
    return { ok: false, message: '当前没有进行中的累计复制' };
  }

  accumulationSession.segments.pop();
  accumulationSession.segmentCount = accumulationSession.segments.length;

  if (!accumulationSession.segmentCount) {
    if (accumulationSession.recordId) {
      storage.deleteRecord(accumulationSession.recordId);
    }
    accumulationSession.recordId = null;
    sendFloatingMenuState();
    sendSnapshot('已撤销到空白累计');
    return { ok: true, empty: true };
  }

  const mergedText = formatAccumulationText(accumulationSession.segments);
  storage.updateRecord(accumulationSession.recordId, {
    textContent: mergedText,
    accumulationActive: true,
    accumulationCount: accumulationSession.segmentCount,
    accumulationSegments: accumulationSession.segments,
    lastCapturedAt: new Date().toISOString()
  });
  sendFloatingMenuState();
  sendSnapshot(`已撤销上一段，剩余 ${accumulationSession.segmentCount} 段`);
  return { ok: true, count: accumulationSession.segmentCount };
}

function finishAccumulation() {
  if (!accumulationSession || !accumulationSession.active) {
    sendSnapshot('当前没有进行中的累计复制');
    return { ok: false, message: '当前没有进行中的累计复制' };
  }

  if (accumulationSession.recordId) {
    storage.updateRecord(accumulationSession.recordId, {
      accumulationActive: false,
      accumulationCount: accumulationSession.segmentCount,
      accumulationSegments: accumulationSession.segments
    });
  }

  accumulationSession = null;
  floatingPinnedVisible = false;
  sendFloatingMenuState();
  syncFloatingWindowVisibility();
  sendSnapshot('累计复制已结束');
  return { ok: true };
}

function cancelAccumulation() {
  if (!accumulationSession || !accumulationSession.active) {
    sendSnapshot('当前没有进行中的累计复制');
    return { ok: false, message: '当前没有进行中的累计复制' };
  }

  if (accumulationSession.recordId) {
    storage.deleteRecord(accumulationSession.recordId);
  }

  accumulationSession = null;
  floatingPinnedVisible = false;
  sendFloatingMenuState();
  syncFloatingWindowVisibility();
  sendSnapshot('累计复制已取消');
  return { ok: true };
}

function deleteLastCapture() {
  const latest = storage.getAllRecords()[0];
  if (!latest) {
    sendSnapshot('暂无可删除的最近收藏');
    sendFloatingMenuState();
    return { ok: false, message: '暂无可删除的最近收藏' };
  }

  if (accumulationSession && accumulationSession.recordId === latest.id) {
    accumulationSession = null;
    floatingPinnedVisible = false;
  }

  const ok = storage.deleteRecord(latest.id);
  sendFloatingMenuState();
  sendSnapshot(ok ? '已删除上次收藏' : '删除失败');
  return { ok };
}

function markPollingSuppressed(signature) {
  suppressedPollingSignature = signature || '';
  suppressedPollingUntil = Date.now() + SHORTCUT_POLL_SUPPRESS_MS;
}

function isConfiguredPostCopyKeyPressed() {
  const configured = parseShortcutTokens(getSettings().postCopyKey);
  if (!configured) return false;
  if (configured.key) return false;
  if (configured.modifiers.size === 0) return false;
  if (configured.modifiers.has('ctrl') && !pressedKeys.ctrl) return false;
  if (configured.modifiers.has('alt') && !pressedKeys.alt) return false;
  if (configured.modifiers.has('shift') && !pressedKeys.shift) return false;
  if (configured.modifiers.has('meta') && !pressedKeys.meta) return false;

  const activeMods = Number(pressedKeys.ctrl) + Number(pressedKeys.alt) + Number(pressedKeys.shift) + Number(pressedKeys.meta);
  if (activeMods !== configured.modifiers.size) return false;
  return true;
}

function shouldTriggerPostCopyCaptureNow() {
  return isConfiguredPostCopyKeyPressed();
}

function shouldPromoteToCommonNow() {
  return observing && pressedKeys.alt && !pressedKeys.ctrl && !pressedKeys.shift && !pressedKeys.meta;
}

function createObserveContext(source) {
  return {
    source,
    copyActionCount: source === 'copy_shortcut' ? 1 : 0,
    startedAt: Date.now(),
    sourceContext: source === 'copy_shortcut' ? (lastShortcutSourceContext || getForegroundWindowContext()) : getForegroundWindowContext()
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

function startObserving(payload, source = 'clipboard_poll', sourceContext = null) {
  pendingPayload = payload;
  observing = true;
  observeContext = createObserveContext(source);
  if (sourceContext) {
    observeContext.sourceContext = sourceContext;
  }

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
    processPayload(current, 'copy_then_key', '复制后按键已收藏', { sourceContext: observeContext?.sourceContext });
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
      processPayload(current, 'auto', '自动判断已收藏', { sourceContext: observeContext?.sourceContext });
    } else {
      sendSnapshot('自动判断未命中');
    }
  }, OBSERVE_WINDOW_MS);
  sendSnapshot(currentObserveStatusText());
}

function handleClipboardChanged(payload, source = 'clipboard_poll', sourceContext = null) {
  const settings = getSettings();

  if (accumulationSession && accumulationSession.active) {
    stopObserving();
    appendAccumulationPayload(payload);
    return;
  }

  if (observing && source === 'copy_shortcut' && observeContext) {
    observeContext.copyActionCount += 1;
  }

  if (observing && settings.doubleCopyEnabled && observeContext && observeContext.source === 'copy_shortcut' && observeContext.copyActionCount >= 2) {
    const current = payload;
    const captureSourceContext = sourceContext || observeContext.sourceContext;
    stopObserving();
    processPayload(current, 'double_copy', '累计复制已收藏', { sourceContext: captureSourceContext });
    return;
  }

  startObserving(payload, source, sourceContext);
}

function handleCopyShortcutAction(payload, sourceContext = null) {
  if (!payload) {
    sendSnapshot('等待复制内容写入剪贴板');
    return;
  }

  lastClipboardSignature = payload.signature;
  markPollingSuppressed(payload.signature);
  handleClipboardChanged(payload, 'copy_shortcut', sourceContext || lastShortcutSourceContext || getForegroundWindowContext());
}

function scheduleCopyShortcutRead(attempt = 0, previousSignature = lastClipboardSignature, sourceContext = lastShortcutSourceContext || getForegroundWindowContext()) {
  setTimeout(() => {
    const payload = readClipboardPayload();
    const imagePending = clipboardHasImageFormat();

    if (payload && payload.contentType === 'image') {
      handleCopyShortcutAction(payload, sourceContext);
      return;
    }

    if (payload && payload.signature !== previousSignature) {
      handleCopyShortcutAction(payload, sourceContext);
      return;
    }

    if (payload && attempt >= 3 && !imagePending) {
      handleCopyShortcutAction(payload, sourceContext);
      return;
    }

    if (attempt < COPY_SHORTCUT_MAX_RETRIES) {
      scheduleCopyShortcutRead(attempt + 1, previousSignature, sourceContext);
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
  if (keycode === 3675 || keycode === 3676) {
    pressedKeys.meta = isPressed;
  }
}

function normalizeShortcutToken(rawToken) {
  const token = String(rawToken || '').trim().toLowerCase();
  if (!token) return '';
  if (token === 'control') return 'ctrl';
  if (token === 'cmd' || token === 'command' || token === 'win' || token === 'windows') return 'meta';
  if (token === 'super') return 'meta';
  if (token === 'esc') return 'escape';
  if (token === 'spacebar') return 'space';
  return token;
}

function parseShortcutTokens(shortcut) {
  const raw = String(shortcut || '').trim();
  if (!raw) return null;
  const parts = raw
    .split('+')
    .map((part) => normalizeShortcutToken(part))
    .filter(Boolean);
  if (!parts.length) return null;

  const modifiers = new Set();
  let key = '';
  for (const part of parts) {
    if (part === 'ctrl' || part === 'alt' || part === 'shift' || part === 'meta') {
      modifiers.add(part);
      continue;
    }
    key = part;
  }

  return {
    modifiers,
    key
  };
}

function keyTokenFromUiohookEvent(event) {
  const keycode = Number(event?.keycode || 0);
  const letterMap = {
    16: 'q', 17: 'w', 18: 'e', 19: 'r', 20: 't', 21: 'y', 22: 'u', 23: 'i', 24: 'o', 25: 'p',
    30: 'a', 31: 's', 32: 'd', 33: 'f', 34: 'g', 35: 'h', 36: 'j', 37: 'k', 38: 'l',
    44: 'z', 45: 'x', 46: 'c', 47: 'v', 48: 'b', 49: 'n', 50: 'm'
  };
  if (letterMap[keycode]) return letterMap[keycode];

  const numberMap = {
    2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0'
  };
  if (numberMap[keycode]) return numberMap[keycode];

  const otherMap = {
    1: 'escape',
    14: 'backspace',
    15: 'tab',
    28: 'enter',
    57: 'space',
    102: 'home',
    103: 'up',
    104: 'pageup',
    105: 'left',
    106: 'right',
    107: 'end',
    108: 'down',
    109: 'pagedown',
    110: 'insert',
    111: 'delete',
    59: 'f1',
    60: 'f2',
    61: 'f3',
    62: 'f4',
    63: 'f5',
    64: 'f6',
    65: 'f7',
    66: 'f8',
    67: 'f9',
    68: 'f10',
    87: 'f11',
    88: 'f12',
    29: 'ctrl',
    3613: 'ctrl',
    42: 'shift',
    54: 'shift',
    56: 'alt',
    3640: 'alt',
    3675: 'meta',
    3676: 'meta'
  };
  return otherMap[keycode] || '';
}

function isConfiguredPostCopyKey(event, configuredShortcut) {
  const configured = parseShortcutTokens(configuredShortcut);
  if (!configured) return false;
  const currentToken = normalizeShortcutToken(keyTokenFromUiohookEvent(event));
  if (!currentToken) return false;

  const requiredModifiers = configured.modifiers;
  const ctrl = !!pressedKeys.ctrl;
  const alt = !!pressedKeys.alt;
  const shift = !!pressedKeys.shift;
  const meta = !!pressedKeys.meta;

  if (requiredModifiers.has('ctrl') !== ctrl) return false;
  if (requiredModifiers.has('alt') !== alt) return false;
  if (requiredModifiers.has('shift') !== shift) return false;
  if (requiredModifiers.has('meta') !== meta) return false;

  if (!configured.key) {
    return requiredModifiers.has(currentToken);
  }

  return configured.key === currentToken;
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

function unregisterTrackedGlobalShortcuts() {
  registeredGlobalAccelerators.forEach((acc) => {
    try {
      globalShortcut.unregister(acc);
    } catch {}
  });
  registeredGlobalAccelerators = [];
}

function registerGlobalAccelerator(accelerator, handler) {
  const acc = String(accelerator || '').trim();
  if (!acc) return false;
  try {
    if (globalShortcut.register(acc, handler)) {
      registeredGlobalAccelerators.push(acc);
      return true;
    }
  } catch {}
  return false;
}

function refreshGlobalShortcuts() {
  unregisterTrackedGlobalShortcuts();
  const settings = getSettings();

  const del = String(settings.deleteLastCaptureShortcut || '').trim();
  if (settings.hotkeyDeleteLastEnabled !== false && del) {
    registerGlobalAccelerator(del, () => {
      if (getSettings().hotkeyDeleteLastEnabled === false) return;
      deleteLastCapture();
    });
  }

  const startAcc = String(settings.accumulationStartShortcut || '').trim();
  if (settings.hotkeyStartAccumEnabled !== false && startAcc) {
    registerGlobalAccelerator(startAcc, () => {
      if (getSettings().hotkeyStartAccumEnabled === false) return;
      startAccumulation();
    });
  }

  const finishAcc = String(settings.accumulationFinishShortcut || '').trim();
  if (settings.hotkeyFinishAccumEnabled !== false && finishAcc) {
    registerGlobalAccelerator(finishAcc, () => {
      if (getSettings().hotkeyFinishAccumEnabled === false) return;
      finishAccumulation();
    });
  }

  const undoAcc = String(settings.accumulationUndoShortcut || '').trim();
  if (settings.hotkeyUndoAccumEnabled && undoAcc) {
    registerGlobalAccelerator(undoAcc, () => {
      if (!getSettings().hotkeyUndoAccumEnabled) return;
      undoAccumulation();
    });
  }
}

function applySystemSettings(settings) {
  try {
    app.setLoginItemSettings(getLoginItemConfig(settings.startupLaunchEnabled));
  } catch {}

  syncStartupSettingFromSystem();
  syncFloatingWindowVisibility();
  syncMainWindowDockVisibility();
  refreshGlobalShortcuts();
}

function syncHoverStateFromCursor() {
  const cursor = screen.getCursorScreenPoint();
  const settings = getSettings();

  if (floatingWindow && !floatingWindow.isDestroyed() && settings.floatingIconEnabled) {
    const floatingBounds = floatingWindow.getBounds();
    const floatingDisplay = screen.getDisplayMatching(floatingBounds);
    const floatingWorkArea = floatingDisplay.workArea;
    const floatingSide = getSettings().floatingDockSide === 'left' ? 'left' : 'right';
    const nextFloatingHovered = !floatingDragState && (
      isPointInsideBounds(cursor, floatingBounds)
      || (settings.dockToEdgeEnabled && isPointInsideVerticalEdgeZone(
        cursor,
        floatingWorkArea,
        floatingSide,
        floatingBounds.y,
        floatingBounds.height,
        FLOATING_EDGE_TRIGGER_SIZE
      ))
    );
    if (nextFloatingHovered) {
      clearFloatingHideTimer();
      if (!floatingHovered) {
        floatingHovered = true;
        syncFloatingWindowVisibility();
      }
    } else if (floatingHovered && !floatingHideTimer && !floatingDragState) {
      floatingHideTimer = setTimeout(() => {
        floatingHideTimer = null;
        const latestCursor = screen.getCursorScreenPoint();
        if (!floatingDragState && floatingWindow && !floatingWindow.isDestroyed() && !isPointInsideBounds(latestCursor, floatingWindow.getBounds())) {
          floatingHovered = false;
          syncFloatingWindowVisibility();
        }
      }, FLOATING_HIDE_DELAY_MS);
    }
  }

  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
    const dockState = getMainWindowDockState();
    const nextMainHovered = isPointInsideBounds(cursor, mainWindow.getBounds()) || (
      !!dockState
      && settings.dockToEdgeEnabled
      && isPointInsideVerticalEdgeZone(
        cursor,
        dockState.workArea,
        dockState.side,
        dockState.visibleBounds.y,
        dockState.visibleBounds.height,
        MAIN_WINDOW_EDGE_TRIGGER_SIZE
      )
    );
    if (nextMainHovered) {
      clearMainWindowHideTimer();
      if (!mainWindowHovered) {
        mainWindowHovered = true;
        syncMainWindowDockVisibility();
      }
    } else if (mainWindowHovered && !mainWindowHideTimer) {
      mainWindowHideTimer = setTimeout(() => {
        mainWindowHideTimer = null;
        const latestCursor = screen.getCursorScreenPoint();
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() && !isPointInsideBounds(latestCursor, mainWindow.getBounds())) {
          mainWindowHovered = false;
          syncMainWindowDockVisibility();
        }
      }, MAIN_WINDOW_HIDE_DELAY_MS);
    }
  }
}

function setupHoverSync() {
  if (hoverSyncTimer) {
    clearInterval(hoverSyncTimer);
  }
  hoverSyncTimer = setInterval(syncHoverStateFromCursor, HOVER_SYNC_INTERVAL_MS);
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
        lastShortcutSourceContext = getForegroundWindowContext();
        scheduleCopyShortcutRead(0, lastClipboardSignature, lastShortcutSourceContext);
        return;
      }

      const settings = getSettings();
      const configured = settings.postCopyKey;

      if (!observing || !pendingPayload) return;

      if ((event.keycode === 56 || event.keycode === 3640) && !pressedKeys.ctrl && !pressedKeys.shift && !pressedKeys.meta) {
        const current = pendingPayload;
        const sourceContext = observeContext?.sourceContext;
        stopObserving();
        processPayload(current, 'copy_then_key', '已收藏到常用', { category: 'common', sourceContext });
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
    assets: storage.getAllAssets().map(normalizeAsset),
    browserCards: storage.getAllBrowserCards().map(normalizeBrowserCard),
    dateFilters: storage.getDateFilters(),
    categoryFilters: storage.getCategoryFilters(),
    settings: getSettings(),
    statusText: '后台监听中'
  }));

  ipcMain.handle('save-settings', async (_, settings) => {
    try {
      const selfBuiltWorkspaceDir = String(
        settings?.selfBuiltWorkspaceDir
        || settings?.selfBuiltUserDataRoot
        || settings?.browserScanRoot
        || ''
      ).trim();
      
      // 调试日志
      console.log('[save-settings] Received assetBackupPath:', settings?.assetBackupPath);
      
      const saved = storage.saveSettings({
        ...getSettings(),
        ...settings,
        selfBuiltWorkspaceDir,
        browserScanRoot: selfBuiltWorkspaceDir,
        selfBuiltUserDataRoot: selfBuiltWorkspaceDir,
        selfBuiltChromePath: selfBuiltWorkspaceDir ? path.join(selfBuiltWorkspaceDir, 'chrome.exe') : '',
        selfBuiltChromedriverPath: selfBuiltWorkspaceDir ? path.join(selfBuiltWorkspaceDir, 'chromedriver.exe') : ''
      });
      
      // 调试日志
      console.log('[save-settings] Saved assetBackupPath:', saved?.assetBackupPath);
      
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

  ipcMain.handle('delete-records', async (_, ids = []) => {
    const list = Array.isArray(ids) ? ids : [];
    let count = 0;
    for (const id of list) {
      if (storage.deleteRecord(id)) {
        count += 1;
      }
    }
    sendSnapshot(count ? `已删除 ${count} 条记录` : '没有删除任何记录');
    return { ok: true, count };
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

  ipcMain.handle('select-asset-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections']
    });
    return {
      canceled: result.canceled,
      paths: result.filePaths || []
    };
  });

  ipcMain.handle('select-asset-folders', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'multiSelections']
    });
    return {
      canceled: result.canceled,
      paths: result.filePaths || []
    };
  });

  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return {
      canceled: result.canceled,
      path: result.filePaths && result.filePaths[0] ? result.filePaths[0] : ''
    };
  });

  ipcMain.handle('select-floating-icon-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Image Files', extensions: ['gif', 'png', 'jpg', 'jpeg'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return {
      canceled: result.canceled,
      path: result.filePaths && result.filePaths[0] ? result.filePaths[0] : ''
    };
  });

  ipcMain.handle('import-assets', async (_, payload = {}) => {
    try {
      const mode = payload.mode === 'backup' ? 'backup' : 'link';
      const paths = Array.isArray(payload.paths) ? payload.paths : [];
      const imported = storage.importAssets(paths.map((sourcePath) => ({ sourcePath })), mode);
      sendSnapshot(imported.length ? '资源已导入' : '没有可导入的新资源');
      return { ok: true, count: imported.length };
    } catch (error) {
      const message = error && error.message ? error.message : '导入失败';
      sendSnapshot(message);
      return { ok: false, message };
    }
  });

  ipcMain.handle('scan-browser-cards', async (_, payload = {}) => {
    try {
      const scope = payload.scope === 'chrome' || payload.scope === 'self_built' ? payload.scope : 'all';
      const settings = getSettings();
      const selfBuiltRoot = normalizeSelfBuiltRoot(
        settings.selfBuiltWorkspaceDir
        || settings.selfBuiltUserDataRoot
        || settings.browserScanRoot
        || payload.selfBuiltWorkspaceDir
        || payload.selfBuiltRoot
        || getDefaultSelfBuiltRoot()
      );
      if ((settings.selfBuiltWorkspaceDir || settings.browserScanRoot || '') !== selfBuiltRoot) {
        storage.saveSettings({
          ...settings,
          selfBuiltWorkspaceDir: selfBuiltRoot,
          browserScanRoot: selfBuiltRoot,
          selfBuiltUserDataRoot: selfBuiltRoot,
          selfBuiltChromePath: selfBuiltRoot ? path.join(selfBuiltRoot, 'chrome.exe') : '',
          selfBuiltChromedriverPath: selfBuiltRoot ? path.join(selfBuiltRoot, 'chromedriver.exe') : ''
        });
      }

      const result = await scanBrowserCards({
        scope,
        selfBuiltRoot
      });

      return {
        ok: true,
        candidates: Array.isArray(result.candidates) ? result.candidates : [],
        results: Array.isArray(result.results) ? result.results : [],
        selfBuiltRoot: result.selfBuiltRoot || selfBuiltRoot
      };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '扫描失败'
      };
    }
  });

  ipcMain.handle('get-browser-import-sources', async (_, payload = {}) => {
    try {
      const settings = getSettings();
      const selfBuiltWorkspaceDir = String(
        settings.selfBuiltWorkspaceDir
        || settings.selfBuiltUserDataRoot
        || settings.browserScanRoot
        || payload.selfBuiltWorkspaceDir
        || payload.selfBuiltRoot
        || ''
      ).trim();
      const bitApiUrl = String(payload.bitApiUrl || '').trim();
      const bitApiToken = String(payload.bitApiToken || '').trim();
      if ((selfBuiltWorkspaceDir && selfBuiltWorkspaceDir !== (settings.selfBuiltWorkspaceDir || settings.selfBuiltUserDataRoot || settings.browserScanRoot || ''))
        || (bitApiUrl && bitApiUrl !== settings.bitApiUrl)
        || (bitApiToken !== '' && bitApiToken !== settings.bitApiToken)) {
        storage.saveSettings({
          ...settings,
          selfBuiltWorkspaceDir: selfBuiltWorkspaceDir || settings.selfBuiltWorkspaceDir || settings.selfBuiltUserDataRoot || settings.browserScanRoot || '',
          browserScanRoot: selfBuiltWorkspaceDir || settings.browserScanRoot || '',
          selfBuiltUserDataRoot: selfBuiltWorkspaceDir || settings.selfBuiltUserDataRoot || '',
          selfBuiltChromePath: selfBuiltWorkspaceDir ? path.join(selfBuiltWorkspaceDir, 'chrome.exe') : (settings.selfBuiltChromePath || ''),
          selfBuiltChromedriverPath: selfBuiltWorkspaceDir ? path.join(selfBuiltWorkspaceDir, 'chromedriver.exe') : (settings.selfBuiltChromedriverPath || ''),
          bitApiUrl: bitApiUrl || settings.bitApiUrl,
          bitApiToken: bitApiToken !== '' ? bitApiToken : settings.bitApiToken
        });
      }
      const result = await runPythonBridge('list-offline-sources', getPythonBridgeConfigFromPayload(payload));
      return {
        ok: true,
        results: result.results || {},
        selfBuiltRoot: result?.results?.self_built_root || selfBuiltWorkspaceDir || settings.selfBuiltWorkspaceDir || settings.browserScanRoot || ''
      };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '获取来源失败'
      };
    }
  });

  ipcMain.handle('get-self-built-import-sources', async (_, payload = {}) => {
    try {
      const settings = getSettings();
      const selfBuiltWorkspaceDir = normalizeSelfBuiltRoot(
        settings.selfBuiltWorkspaceDir
        || settings.selfBuiltUserDataRoot
        || settings.browserScanRoot
        || payload.selfBuiltWorkspaceDir
        || payload.selfBuiltRoot
        || ''
      );
      const results = listSelfBuiltProfiles(selfBuiltWorkspaceDir);
      return {
        ok: true,
        results,
        selfBuiltRoot: selfBuiltWorkspaceDir
      };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '获取自建浏览器来源失败'
      };
    }
  });

  ipcMain.handle('open-self-built-browser', async (_, payload = {}) => {
    try {
      const settings = getSettings();
      const selfBuiltWorkspaceDir = String(
        settings.selfBuiltWorkspaceDir
        || settings.selfBuiltUserDataRoot
        || settings.browserScanRoot
        || payload.selfBuiltWorkspaceDir
        || payload.selfBuiltRoot
        || ''
      ).trim();
      if (selfBuiltWorkspaceDir && selfBuiltWorkspaceDir !== (settings.selfBuiltWorkspaceDir || settings.selfBuiltUserDataRoot || settings.browserScanRoot || '')) {
        storage.saveSettings({
          ...settings,
          selfBuiltWorkspaceDir,
          browserScanRoot: selfBuiltWorkspaceDir,
          selfBuiltUserDataRoot: selfBuiltWorkspaceDir,
          selfBuiltChromePath: path.join(selfBuiltWorkspaceDir, 'chrome.exe'),
          selfBuiltChromedriverPath: path.join(selfBuiltWorkspaceDir, 'chromedriver.exe')
        });
      }
      const result = await runPythonBridge('open-self-built-browser', {
        ...getPythonBridgeConfigFromPayload(payload),
        port: payload.port || '',
        url: payload.url || ''
      });
      return result && typeof result === 'object'
        ? result
        : { ok: false, message: '打开自建浏览器失败' };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '打开自建浏览器失败'
      };
    }
  });

  ipcMain.handle('load-browser-import-groups', async (_, payload = {}) => {
    try {
      const settings = getSettings();
      const selfBuiltWorkspaceDir = String(
        settings.selfBuiltWorkspaceDir
        || settings.selfBuiltUserDataRoot
        || settings.browserScanRoot
        || payload.selfBuiltWorkspaceDir
        || payload.selfBuiltRoot
        || ''
      ).trim();
      const bitApiUrl = String(payload.bitApiUrl || '').trim();
      const bitApiToken = String(payload.bitApiToken || '').trim();
      if ((selfBuiltWorkspaceDir && selfBuiltWorkspaceDir !== (settings.selfBuiltWorkspaceDir || settings.selfBuiltUserDataRoot || settings.browserScanRoot || ''))
        || (bitApiUrl && bitApiUrl !== settings.bitApiUrl)
        || (bitApiToken !== '' && bitApiToken !== settings.bitApiToken)) {
        storage.saveSettings({
          ...settings,
          selfBuiltWorkspaceDir: selfBuiltWorkspaceDir || settings.selfBuiltWorkspaceDir || settings.selfBuiltUserDataRoot || settings.browserScanRoot || '',
          browserScanRoot: selfBuiltWorkspaceDir || settings.browserScanRoot || '',
          selfBuiltUserDataRoot: selfBuiltWorkspaceDir || settings.selfBuiltUserDataRoot || '',
          selfBuiltChromePath: selfBuiltWorkspaceDir ? path.join(selfBuiltWorkspaceDir, 'chrome.exe') : (settings.selfBuiltChromePath || ''),
          selfBuiltChromedriverPath: selfBuiltWorkspaceDir ? path.join(selfBuiltWorkspaceDir, 'chromedriver.exe') : (settings.selfBuiltChromedriverPath || ''),
          bitApiUrl: bitApiUrl || settings.bitApiUrl,
          bitApiToken: bitApiToken !== '' ? bitApiToken : settings.bitApiToken
        });
      }
      const result = await runPythonBridge('load-offline-groups', {
        ...getPythonBridgeConfigFromPayload(payload),
        sourceType: payload.sourceType || '',
        sourceId: payload.sourceId || '',
        filterAuth: payload.filterAuth !== false,
        mergeDomain: payload.mergeDomain !== false
      });
      return {
        ok: true,
        results: Array.isArray(result.results) ? result.results : []
      };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '加载 Cookie 失败'
      };
    }
  });

  ipcMain.handle('build-browser-import-cards', async (_, payload = {}) => {
    try {
      const projectPath = String(payload.projectPath || '').trim();
      const result = await runPythonBridge('build-import-cards', {
        ...getPythonBridgeConfig(projectPath),
        sourceType: payload.sourceType || '',
        sourceId: payload.sourceId || '',
        domainsJson: JSON.stringify(Array.isArray(payload.groups) ? payload.groups : [])
      });
      return {
        ok: true,
        results: Array.isArray(result.results) ? result.results : []
      };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '构建导入卡片失败'
      };
    }
  });

  ipcMain.handle('import-browser-cards', async (_, payload = {}) => {
    try {
      const cards = Array.isArray(payload.cards) ? payload.cards : [];
      const imported = storage.importBrowserCards(cards);
      sendSnapshot(imported.length ? '浏览器卡片已导入' : '没有可导入的新卡片');
      return { ok: true, count: imported.length };
    } catch (error) {
      const message = error && error.message ? error.message : '导入失败';
      sendSnapshot(message);
      return { ok: false, message };
    }
  });

  ipcMain.handle('list-online-import-targets', async () => {
    try {
      const result = await runPythonBridge('online-import-list-targets', getPythonBridgeConfig());
      return {
        ok: result.ok !== false,
        results: Array.isArray(result.results) ? result.results : [],
        message: result.message || ''
      };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '获取在线导入目标失败'
      };
    }
  });

  ipcMain.handle('run-online-import', async (_, payload = {}) => {
    try {
      const result = await runPythonBridge('online-import-capture', {
        ...getPythonBridgeConfig(),
        target: payload.target || null,
        accountName: String(payload.accountName || '').trim(),
        inheritBrowserSource: payload.inheritBrowserSource || null
      });
      if (!result.ok) {
        return result;
      }
      const cards = Array.isArray(result.cards) ? result.cards : [];
      if (!cards.length) {
        return { ok: false, message: '没有可导入的卡片' };
      }
      const imported = storage.importBrowserCards(cards);
      sendSnapshot(imported.length ? (result.message || `在线导入 ${imported.length} 张卡片`) : '没有可导入的新卡片');
      return { ok: true, count: imported.length, message: result.message || '' };
    } catch (error) {
      const message = error && error.message ? error.message : '在线导入失败';
      sendSnapshot(message);
      return { ok: false, message };
    }
  });

  ipcMain.handle('update-browser-card', async (_, payload = {}) => {
    const result = storage.updateBrowserCard(payload.id, {
      name: payload.name || '',
      remark: payload.remark || '',
      openUrl: payload.openUrl || '',
      username: payload.username || '',
      password: payload.password || ''
    });
    sendSnapshot('浏览器卡片已保存');
    return { ok: !!result };
  });

  ipcMain.handle('refresh-browser-card-cookies', async (_, id) => {
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
      const message = `${result.message || 'Cookie 已更新'}；已合并保存 ${mergedCookies.length} 条（本次更新 ${incomingCount} 条，新值优先覆盖旧值）`;
      sendSnapshot(message);
      return { ok: true, message };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '更新 Cookie 失败'
      };
    }
  });

  ipcMain.handle('rewrite-browser-card-cookies', async (_, id) => {
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
  });

  ipcMain.handle('open-browser-card', async (_, id) => {
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
  });

  ipcMain.handle('inject-browser-card', async (_, id) => {
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
  });

  ipcMain.handle('get-browser-inject-targets', async () => {
    try {
      const result = await runPythonBridge('list-inject-targets', getPythonBridgeConfig());
      return { ok: true, results: Array.isArray(result.results) ? result.results : [] };
    } catch (error) {
      return { ok: false, message: error && error.message ? error.message : '获取目标浏览器失败' };
    }
  });

  ipcMain.handle('execute-browser-card-inject', async (_, payload = {}) => {
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
  });

  ipcMain.handle('open-browser-card-source', async (_, id) => {
    const card = storage.getAllBrowserCards().find((item) => item.id === id);
    if (!card) return { ok: false, message: '浏览器卡片不存在' };
    const userDataDir = card.browserSource?.userDataDir;
    if (!userDataDir) return { ok: false, message: '来源目录不存在' };
    shell.showItemInFolder(userDataDir);
    return { ok: true };
  });

  ipcMain.handle('delete-browser-card', async (_, id) => {
    const ok = storage.deleteBrowserCard(id);
    sendSnapshot(ok ? '浏览器卡片已删除' : '删除失败');
    return { ok };
  });

  ipcMain.handle('delete-browser-cards', async (_, ids = []) => {
    try {
      const targets = Array.isArray(ids) ? ids : [];
      let count = 0;
      targets.forEach((id) => {
        if (storage.deleteBrowserCard(id)) {
          count += 1;
        }
      });
      sendSnapshot(count ? `已删除 ${count} 张浏览器卡片` : '没有删除任何卡片');
      return { ok: true, count };
    } catch (error) {
      return { ok: false, message: error && error.message ? error.message : '批量删除失败' };
    }
  });

  ipcMain.handle('check-browser-card-connectivity', async (_, ids = []) => {
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
      sendSnapshot(results.length ? `已完成 ${results.length} 张卡片连通性测试` : '没有可测试的卡片');
      return { ok: true, results };
    } catch (error) {
      return { ok: false, message: error && error.message ? error.message : '批量测试失败' };
    }
  });

  ipcMain.handle('update-asset-note', async (_, payload = {}) => {
    const result = storage.updateAsset(payload.id, { note: payload.note || '' });
    sendSnapshot('资源备注已保存');
    return { ok: !!result };
  });

  ipcMain.handle('open-asset-primary', async (_, id) => {
    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.primaryPath) return { ok: false, message: '资源不存在' };
    const errorMessage = await shell.openPath(asset.primaryPath);
    return { ok: !errorMessage, message: errorMessage || '' };
  });

  ipcMain.handle('open-asset-source', async (_, id) => {
    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.sourcePath) return { ok: false, message: '原路径不存在' };
    const errorMessage = await shell.openPath(asset.sourcePath);
    return { ok: !errorMessage, message: errorMessage || '' };
  });

  ipcMain.handle('open-asset-location', async (_, id) => {
    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.sourcePath) return { ok: false, message: '资源不存在' };
    shell.showItemInFolder(asset.sourcePath);
    return { ok: true };
  });

  ipcMain.handle('open-asset-stored', async (_, id) => {
    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.storedPath) return { ok: false, message: '备份文件不存在' };
    const errorMessage = await shell.openPath(asset.storedPath);
    return { ok: !errorMessage, message: errorMessage || '' };
  });

  ipcMain.handle('open-asset-stored-location', async (_, id) => {
    const asset = storage.getAllAssets().find((item) => item.id === id);
    if (!asset || !asset.storedPath) return { ok: false, message: '备份文件不存在' };
    shell.showItemInFolder(asset.storedPath);
    return { ok: true };
  });

  ipcMain.handle('delete-asset', async (_, id) => {
    const ok = storage.deleteAsset(id);
    sendSnapshot('资源已删除');
    return { ok };
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

  ipcMain.handle('open-external-url', async (_, url) => {
    const raw = String(url || '').trim();
    if (!/^https?:\/\//i.test(raw)) {
      return { ok: false, message: '仅支持 http(s) 链接' };
    }
    try {
      await shell.openExternal(raw);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error && error.message ? error.message : '无法打开链接'
      };
    }
  });

  ipcMain.handle('open-main-window', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return { ok: false };
    }

    showWindow();
    return { ok: true, visible: true };
  });

  ipcMain.handle('reset-settings', async () => {
    try {
      // 清空已保存设置，让 getSettings() 回落到当前版本默认值。
      storage.saveSettings({});
      const saved = getSettings();
      applySystemSettings(saved);
      sendSnapshot('设置已还原默认');
      return { ok: true, settings: saved };
    } catch (error) {
      const message = error && error.message ? error.message : '还原默认设置失败';
      sendSnapshot(message);
      return { ok: false, message };
    }
  });

  ipcMain.handle('floating-toggle-menu', async () => {
    if (floatingMenuOpen) {
      closeFloatingMenu();
    } else {
      openFloatingMenu();
    }
    return { ok: true };
  });

  ipcMain.handle('floating-close-menu', async () => {
    closeFloatingMenu();
    return { ok: true };
  });

  ipcMain.handle('floating-get-menu-state', async () => ({
    open: floatingMenuOpen,
    dockSide: getSettings().floatingDockSide === 'left' ? 'left' : 'right',
    menuSide: floatingMenuSide,
    accumulation: getAccumulationState(),
    lastCapture: getLastCaptureState(),
    floatingIconOpacity: (() => {
      const value = Number(getSettings().floatingIconOpacity);
      return Number.isFinite(value) ? Math.max(0.2, Math.min(1, value)) : 1;
    })(),
    floatingIconCustomPath: (() => String(getSettings().floatingIconCustomPath || '').trim())(),
    floatingIconCustomUrl: (() => {
      const filePath = String(getSettings().floatingIconCustomPath || '').trim();
      return filePath && fs.existsSync(filePath) ? pathToFileURL(filePath).href : '';
    })()
  }));

  ipcMain.handle('floating-quick-save', async () => quickCaptureClipboard({ category: 'daily' }));

  ipcMain.handle('floating-quick-save-common', async () => quickCaptureClipboard({ category: 'common' }));

  ipcMain.handle('start-accumulation', async () => startAccumulation());

  ipcMain.handle('undo-accumulation', async () => undoAccumulation());

  ipcMain.handle('finish-accumulation', async () => finishAccumulation());

  ipcMain.handle('cancel-accumulation', async () => cancelAccumulation());

  ipcMain.handle('delete-last-capture', async () => deleteLastCapture());

  ipcMain.handle('disable-floating-icon', async () => {
    closeFloatingMenu();
    const saved = storage.saveSettings({
      ...getSettings(),
      floatingIconEnabled: false
    });
    applySystemSettings(saved);
    sendSnapshot('已关闭悬浮图标');
    return { ok: true };
  });

  ipcMain.handle('floating-set-hovered', async (_, hovered) => {
    floatingHovered = !!hovered;
    clearFloatingHideTimer();
    syncFloatingWindowVisibility();
    return { ok: true };
  });

  ipcMain.handle('floating-drag-start', async (_, payload = {}) => {
    if (!floatingWindow || floatingWindow.isDestroyed()) return { ok: false };
    stopFloatingAnimation();
    floatingMenuOpen = false;
    floatingPinnedVisible = true;
    floatingHovered = true;
    clearFloatingHideTimer();
    floatingDragState = {
      offsetX: Number(payload.offsetX) || 0,
      offsetY: Number(payload.offsetY) || 0
    };
    sendFloatingMenuState();
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
    const nextBounds = {
      x: nextX,
      y: nextY,
      width: FLOATING_WINDOW_SIZE,
      height: FLOATING_WINDOW_SIZE
    };
    floatingAnchorBoundsCache = {
      ...nextBounds,
      side: nextX + (FLOATING_WINDOW_SIZE / 2) < workArea.x + (workArea.width / 2) ? 'left' : 'right'
    };
    floatingBoundsCache = { ...nextBounds, anchorX: nextX, anchorY: nextY };
    floatingWindow.setBounds(nextBounds);
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
      dockToEdgeEnabled: false,
      floatingOffsetX: Math.max(0, bounds.x - workArea.x),
      floatingDockSide: side,
      floatingOffsetY: Math.max(0, bounds.y - workArea.y)
    });
    floatingDragState = null;
    floatingPinnedVisible = false;
    floatingHovered = false;
    clearFloatingHideTimer();
    floatingAnchorBoundsCache = {
      x: bounds.x,
      y: bounds.y,
      width: FLOATING_WINDOW_SIZE,
      height: FLOATING_WINDOW_SIZE,
      side
    };
    positionFloatingWindow();
    sendFloatingMenuState();
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
  app.setName('DeskLibrary');
  storage = new StorageService(app.getPath('userData'));
  syncStartupSettingFromSystem();
  setupIpc();
  createWindow();
  createFloatingWindow();
  createTray();
  setupClipboardPolling();
  setupKeyboardListener();
  setupHoverSync();
  applySystemSettings(getSettings());
  screen.on('display-metrics-changed', positionFloatingWindow);
  sendSnapshot('后台监听中');
}).catch((error) => {
  console.error('App bootstrap failed:', error);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (hoverSyncTimer) {
    clearInterval(hoverSyncTimer);
    hoverSyncTimer = null;
  }
  clearFloatingHideTimer();
  clearMainWindowHideTimer();
  stopFloatingAnimation();
  stopMainWindowAnimation();
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
