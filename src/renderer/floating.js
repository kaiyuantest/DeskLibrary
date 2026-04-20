const shell = document.getElementById('floatingShell');
const button = document.getElementById('floatingAction');
const menu = document.getElementById('floatingMenu');
const quickSaveBtn = document.getElementById('quickSaveBtn');
const quickCommonBtn = document.getElementById('quickCommonBtn');
const deleteLastCaptureBtn = document.getElementById('deleteLastCaptureBtn');
const openMainWindowBtn = document.getElementById('openMainWindowBtn');
const startAccumulationBtn = document.getElementById('startAccumulationBtn');
const finishAccumulationBtn = document.getElementById('finishAccumulationBtn');
const undoAccumulationBtn = document.getElementById('undoAccumulationBtn');
const cancelAccumulationBtn = document.getElementById('cancelAccumulationBtn');
const hideFloatingBtn = document.getElementById('hideFloatingBtn');

let dragging = false;
let moved = false;
let startPoint = null;
let dragOffset = null;
let menuOpen = false;
let accumulation = { active: false, count: 0, finishShortcutLabel: '', cancelShortcutLabel: '' };
let lastCapture = { available: false, preview: '', shortcutLabel: '' };
let togglePending = false;
let clickToggleTimer = null;
let suppressClickUntil = 0;
let closeMenuTimer = null;
let lastMenuOpenAt = 0;
let lastHoverOpenRequestAt = 0;
const HOVER_OPEN_ENABLED = false;

function getButtonAnchorPayload() {
  const rect = button.getBoundingClientRect();
  const centerX = Math.round(window.screenX + rect.left + (rect.width / 2));
  const centerY = Math.round(window.screenY + rect.top + (rect.height / 2));
  return {
    centerX,
    centerY,
    buttonWidth: Math.round(rect.width),
    buttonHeight: Math.round(rect.height)
  };
}

function clearCloseMenuTimer() {
  if (closeMenuTimer) {
    clearTimeout(closeMenuTimer);
    closeMenuTimer = null;
  }
}

async function openMenuByHover() {
  if (!HOVER_OPEN_ENABLED) return;
  if (menuOpen || dragging || startPoint) return;
  if (togglePending) return;
  lastHoverOpenRequestAt = Date.now();
  clearCloseMenuTimer();
  if (clickToggleTimer) {
    clearTimeout(clickToggleTimer);
    clickToggleTimer = null;
  }
  togglePending = true;
  try {
    await window.deskLibraryFloating.openMenu(getButtonAnchorPayload());
    suppressClickUntil = Date.now() + 420;
  } finally {
    setTimeout(() => {
      togglePending = false;
    }, 120);
  }
}

function renderMenuState(payload = {}) {
  menuOpen = !!payload.open;
  if (menuOpen) {
    lastMenuOpenAt = Date.now();
  }
  menu.classList.toggle('hidden', !menuOpen);
  shell.classList.toggle('menu-open', menuOpen);
  shell.dataset.side = payload.menuSide === 'left' ? 'left' : 'right';
  accumulation = payload.accumulation || accumulation;
  lastCapture = payload.lastCapture || lastCapture;

  const active = !!accumulation.active;
  menu.classList.toggle('accumulation-mode', active);
  quickSaveBtn.classList.toggle('hidden', active);
  quickCommonBtn.classList.toggle('hidden', active);
  startAccumulationBtn.classList.toggle('hidden', active);
  finishAccumulationBtn.classList.toggle('hidden', !active);
  undoAccumulationBtn.classList.toggle('hidden', !active);
  cancelAccumulationBtn.classList.toggle('hidden', !active);
  button.classList.toggle('accumulating', active);
  button.title = active ? `累计复制中，已收集 ${accumulation.count || 0} 段` : '快捷菜单';

  const finishDesc = accumulation.finishShortcutLabel
    ? `结束累计（${accumulation.finishShortcutLabel}）`
    : '结束累计';
  const cancelDesc = accumulation.cancelShortcutLabel
    ? `取消累计（${accumulation.cancelShortcutLabel}）`
    : '取消累计';
  const deleteDesc = lastCapture.available
    ? `删除上次收藏：${lastCapture.preview || '最近收藏'}`
    : '暂无可删除的最近收藏';

  finishAccumulationBtn.dataset.tip = finishDesc;
  cancelAccumulationBtn.dataset.tip = cancelDesc;
  deleteLastCaptureBtn.dataset.tip = deleteDesc;
  deleteLastCaptureBtn.disabled = !lastCapture.available;
  const opacity = Number(payload.floatingIconOpacity);
  const clampedOpacity = Number.isFinite(opacity) ? Math.max(0.2, Math.min(1, opacity)) : 1;
  button.style.opacity = String(clampedOpacity);
  const customUrl = String(payload.floatingIconCustomUrl || '').trim();
  if (!active && customUrl) {
    button.textContent = '';
    button.style.backgroundImage = `url("${customUrl.replace(/"/g, '%22')}")`;
    button.style.backgroundSize = 'contain';
    button.style.backgroundPosition = 'center';
    button.style.backgroundRepeat = 'no-repeat';
    button.style.backgroundColor = 'transparent';
  } else {
    button.textContent = active ? `累计\n${accumulation.count || 0}` : 'D';
    button.style.backgroundImage = '';
    button.style.backgroundSize = '';
    button.style.backgroundPosition = '';
    button.style.backgroundRepeat = '';
    button.style.backgroundColor = '';
  }

}

button.addEventListener('mousedown', (event) => {
  dragging = false;
  moved = false;
  startPoint = { x: event.screenX, y: event.screenY };
  dragOffset = {
    offsetX: event.offsetX,
    offsetY: event.offsetY
  };
});

window.addEventListener('mousemove', async (event) => {
  if (!startPoint) return;
  const passedThreshold = Math.abs(event.screenX - startPoint.x) > 2 || Math.abs(event.screenY - startPoint.y) > 2;
  if (passedThreshold) {
    moved = true;
  }
  if (!dragging && passedThreshold) {
    dragging = true;
    await window.deskLibraryFloating.startDrag({
      offsetX: dragOffset?.offsetX || 0,
      offsetY: dragOffset?.offsetY || 0
    });
  }
  if (!dragging) return;
  await window.deskLibraryFloating.dragMove({
    screenX: event.screenX,
    screenY: event.screenY
  });
});

window.addEventListener('mouseup', async () => {
  if (dragging) {
    dragging = false;
    await window.deskLibraryFloating.endDrag();
  }
  startPoint = null;
  dragOffset = null;
});

button.addEventListener('click', async () => {
  if (Date.now() < suppressClickUntil) {
    return;
  }
  if (moved) {
    moved = false;
    return;
  }
  if (menuOpen) {
    return;
  }
  if (clickToggleTimer) {
    clearTimeout(clickToggleTimer);
    clickToggleTimer = null;
  }
  if (togglePending) return;
  togglePending = true;
  try {
    await window.deskLibraryFloating.openMenu(getButtonAnchorPayload());
  } finally {
    setTimeout(() => {
      togglePending = false;
    }, 120);
  }
});

button.addEventListener('dblclick', async (event) => {
  event.preventDefault();
  if (moved) {
    moved = false;
    return;
  }
  if (clickToggleTimer) {
    clearTimeout(clickToggleTimer);
    clickToggleTimer = null;
  }
  await window.deskLibraryFloating.openMainWindow();
  await window.deskLibraryFloating.closeMenu();
});

button.addEventListener('mouseenter', async () => {
  if (!HOVER_OPEN_ENABLED) return;
  clearCloseMenuTimer();
  await openMenuByHover();
});

shell.addEventListener('mouseleave', async () => {
  if (!menuOpen || dragging || startPoint) return;
  const inOpenGracePeriod = Date.now() - lastHoverOpenRequestAt < 500;
  if (inOpenGracePeriod) return;
  clearCloseMenuTimer();
  const elapsed = Date.now() - lastMenuOpenAt;
  // 菜单刚打开时窗口会重排，给一段缓冲避免被瞬时 mouseleave 立刻关闭。
  const delay = elapsed < 420 ? (420 - elapsed + 160) : 160;
  closeMenuTimer = setTimeout(async () => {
    closeMenuTimer = null;
    if (!menuOpen || dragging || startPoint) return;
    await window.deskLibraryFloating.closeMenu();
  }, delay);
});

shell.addEventListener('mouseenter', () => {
  clearCloseMenuTimer();
});

openMainWindowBtn.addEventListener('click', async () => {
  await window.deskLibraryFloating.openMainWindow();
  await window.deskLibraryFloating.closeMenu();
});

quickSaveBtn.addEventListener('click', async () => {
  await window.deskLibraryFloating.quickSave();
  await window.deskLibraryFloating.closeMenu();
});

quickCommonBtn.addEventListener('click', async () => {
  await window.deskLibraryFloating.quickSaveCommon();
  await window.deskLibraryFloating.closeMenu();
});

deleteLastCaptureBtn.addEventListener('click', async () => {
  await window.deskLibraryFloating.deleteLastCapture();
  await window.deskLibraryFloating.closeMenu();
});

startAccumulationBtn.addEventListener('click', async () => {
  await window.deskLibraryFloating.startAccumulation();
  await window.deskLibraryFloating.closeMenu();
});

finishAccumulationBtn.addEventListener('click', async () => {
  await window.deskLibraryFloating.finishAccumulation();
  await window.deskLibraryFloating.closeMenu();
});

undoAccumulationBtn.addEventListener('click', async () => {
  await window.deskLibraryFloating.undoAccumulation();
  await window.deskLibraryFloating.closeMenu();
});

cancelAccumulationBtn.addEventListener('click', async () => {
  await window.deskLibraryFloating.cancelAccumulation();
  await window.deskLibraryFloating.closeMenu();
});

hideFloatingBtn.addEventListener('click', async () => {
  await window.deskLibraryFloating.disableFloatingIcon();
  await window.deskLibraryFloating.closeMenu();
});

window.addEventListener('keydown', async (event) => {
  if (event.key === 'Escape' && menuOpen) {
    await window.deskLibraryFloating.closeMenu();
  }
});

window.addEventListener('blur', async () => {
  clearCloseMenuTimer();
  if (menuOpen) {
    const recentlyOpened = Date.now() - lastMenuOpenAt < 600;
    const stillHovering = shell.matches(':hover') || button.matches(':hover') || menu.matches(':hover');
    if (recentlyOpened && stillHovering) {
      return;
    }
    await window.deskLibraryFloating.closeMenu();
  }
});

window.deskLibraryFloating.onMenuState(renderMenuState);
window.deskLibraryFloating.getMenuState().then(renderMenuState).catch(() => {});
