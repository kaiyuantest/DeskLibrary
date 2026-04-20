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
const DOUBLE_CLICK_DELAY_MS = 220;

async function openMenuByHover() {
  if (menuOpen || dragging || startPoint) return;
  if (togglePending) return;
  togglePending = true;
  try {
    await window.deskLibraryFloating.toggleMenu();
  } finally {
    setTimeout(() => {
      togglePending = false;
    }, 120);
  }
}

function renderMenuState(payload = {}) {
  menuOpen = !!payload.open;
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
    button.style.backgroundSize = 'cover';
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
  if (moved) {
    moved = false;
    return;
  }
  if (clickToggleTimer) {
    clearTimeout(clickToggleTimer);
    clickToggleTimer = null;
    return;
  }
  clickToggleTimer = setTimeout(async () => {
    clickToggleTimer = null;
    if (togglePending) return;
    togglePending = true;
    try {
      await window.deskLibraryFloating.toggleMenu();
    } finally {
      setTimeout(() => {
        togglePending = false;
      }, 120);
    }
  }, DOUBLE_CLICK_DELAY_MS);
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
  await openMenuByHover();
});

shell.addEventListener('mouseleave', async () => {
  if (!menuOpen || dragging || startPoint) return;
  await window.deskLibraryFloating.closeMenu();
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
  if (menuOpen) {
    await window.deskLibraryFloating.closeMenu();
  }
});

window.deskLibraryFloating.onMenuState(renderMenuState);
window.deskLibraryFloating.getMenuState().then(renderMenuState).catch(() => {});
