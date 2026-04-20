const shell = document.getElementById('floatingShell');
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

let menuOpen = false;
let accumulation = { active: false, count: 0, finishShortcutLabel: '', cancelShortcutLabel: '' };
let lastCapture = { available: false, preview: '', shortcutLabel: '' };
let closeTimer = null;

function clearCloseTimer() {
  if (!closeTimer) return;
  clearTimeout(closeTimer);
  closeTimer = null;
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
}

openMainWindowBtn.addEventListener('click', async () => {
  await window.deskLibraryFloating.openMainWindow();
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

window.addEventListener('mouseenter', () => {
  clearCloseTimer();
});

window.addEventListener('mouseleave', () => {
  if (!menuOpen) return;
  clearCloseTimer();
  closeTimer = setTimeout(async () => {
    closeTimer = null;
    if (!menuOpen) return;
    await window.deskLibraryFloating.closeMenu();
  }, 80);
});

window.addEventListener('keydown', async (event) => {
  if (event.key === 'Escape' && menuOpen) {
    await window.deskLibraryFloating.closeMenu();
  }
});

window.deskLibraryFloating.onMenuState(renderMenuState);
window.deskLibraryFloating.getMenuState().then(renderMenuState).catch(() => {});
