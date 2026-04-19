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

function renderMenuState(payload = {}) {
  menuOpen = !!payload.open;
  menu.classList.toggle('hidden', !menuOpen);
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
    ? `按 ${accumulation.finishShortcutLabel} 结束累计`
    : '结束当前累计复制并保留卡片';
  const cancelDesc = accumulation.cancelShortcutLabel
    ? `按 ${accumulation.cancelShortcutLabel} 取消累计`
    : '退出累计复制，保留当前已保存内容';
  const deleteDesc = lastCapture.available
    ? `${lastCapture.preview || '最近收藏'}${lastCapture.shortcutLabel ? ` · ${lastCapture.shortcutLabel}` : ''}`
    : '暂无可删除的最近收藏';

  finishAccumulationBtn.querySelector('.menu-desc').textContent = finishDesc;
  cancelAccumulationBtn.querySelector('.menu-desc').textContent = cancelDesc;
  deleteLastCaptureBtn.querySelector('.menu-desc').textContent = deleteDesc;
  deleteLastCaptureBtn.disabled = !lastCapture.available;
  button.textContent = active ? `累计\n${accumulation.count || 0}` : 'C';
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
  if (togglePending) return;
  togglePending = true;
  try {
    await window.deskLibraryFloating.toggleMenu();
  } finally {
    setTimeout(() => {
      togglePending = false;
    }, 120);
  }
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
