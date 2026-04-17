const els = {
  observeStatus: document.getElementById('observeStatus'),
  closeMenuBtn: document.getElementById('closeMenuBtn'),
  openMainBtn: document.getElementById('openMainBtn'),
  collectNowBtn: document.getElementById('collectNowBtn'),
  collectCommonBtn: document.getElementById('collectCommonBtn'),
  autoJudgmentEnabled: document.getElementById('autoJudgmentEnabled'),
  doubleCopyEnabled: document.getElementById('doubleCopyEnabled'),
  copyThenKeyEnabled: document.getElementById('copyThenKeyEnabled'),
  dockToEdgeEnabled: document.getElementById('dockToEdgeEnabled'),
  postCopyKeyText: document.getElementById('postCopyKeyText'),
  quitBtn: document.getElementById('quitBtn')
};

async function refreshState() {
  const payload = await window.click2saveFloating.getMenuState();
  const settings = payload?.settings || {};
  els.observeStatus.textContent = payload?.observeStatus || '等待下一次复制';
  els.autoJudgmentEnabled.checked = !!settings.autoJudgmentEnabled;
  els.doubleCopyEnabled.checked = !!settings.doubleCopyEnabled;
  els.copyThenKeyEnabled.checked = !!settings.copyThenKeyEnabled;
  els.dockToEdgeEnabled.checked = !!settings.dockToEdgeEnabled;
  els.postCopyKeyText.textContent = `复制后按键: ${settings.postCopyKey || 'Shift'}`;
}

async function updateSetting(key, value) {
  await window.click2saveFloating.updateSetting({ key, value });
  await refreshState();
}

els.closeMenuBtn.addEventListener('click', () => window.click2saveFloating.closeMenu());
els.openMainBtn.addEventListener('click', async () => {
  await window.click2saveFloating.openMainWindow();
  await window.click2saveFloating.closeMenu();
});
els.collectNowBtn.addEventListener('click', () => window.click2saveFloating.collectNow({ category: 'daily' }));
els.collectCommonBtn.addEventListener('click', () => window.click2saveFloating.collectNow({ category: 'common' }));
els.autoJudgmentEnabled.addEventListener('change', (event) => updateSetting('autoJudgmentEnabled', event.target.checked));
els.doubleCopyEnabled.addEventListener('change', (event) => updateSetting('doubleCopyEnabled', event.target.checked));
els.copyThenKeyEnabled.addEventListener('change', (event) => updateSetting('copyThenKeyEnabled', event.target.checked));
els.dockToEdgeEnabled.addEventListener('change', (event) => updateSetting('dockToEdgeEnabled', event.target.checked));
els.quitBtn.addEventListener('click', () => window.click2saveFloating.quit());

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    window.click2saveFloating.closeMenu();
  }
});

refreshState();
