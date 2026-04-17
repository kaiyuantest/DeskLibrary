const state = {
  records: [],
  assets: [],
  browserCards: [],
  browserScanCandidates: [],
  dateFilters: [],
  settings: {},
  currentPage: 'daily',
  selectedFilter: '全部',
  searchKeyword: '',
  imageOnly: false,
  selectedSourceApp: '全部来源',
  selectedCalendarDate: '',
  currentPageNumber: 1,
  pageSize: 12,
  selectedRecordId: null,
  selectedAssetId: null,
  selectedBrowserCardId: null,
  assetSearchKeyword: '',
  assetTypeFilter: '全部',
  browserCardSearchKeyword: '',
  browserScanRoot: '',
  browserScanSummary: '扫描后可选择域名卡片导入。',
  browserScanSelection: {},
  browserImportModalOpen: false,
  browserImportTab: 'chrome_profile',
  browserImportSources: {
    chrome_profiles: [],
    self_built: [],
    bitbrowser: []
  },
  browserImportGroups: [],
  browserImportSourceId: '',
  browserImportFilterAuth: true,
  browserImportMergeDomain: true,
  statusText: '后台监听中',
  modalOpen: false,
  browserCardModalOpen: false,
  mobileDateToolsOpen: false,
  mobileFilterToolsOpen: false,
  assetDropActive: false
};

const els = {
  pageTitle: document.getElementById('pageTitle'),
  statusText: document.getElementById('statusText'),
  windowMinBtn: document.getElementById('windowMinBtn'),
  windowMaxBtn: document.getElementById('windowMaxBtn'),
  windowCloseBtn: document.getElementById('windowCloseBtn'),
  dailyPageBtn: document.getElementById('dailyPageBtn'),
  commonPageBtn: document.getElementById('commonPageBtn'),
  assetsPageBtn: document.getElementById('assetsPageBtn'),
  browserCardsPageBtn: document.getElementById('browserCardsPageBtn'),
  settingsPageBtn: document.getElementById('settingsPageBtn'),
  mobileDailyNavBtn: document.getElementById('mobileDailyNavBtn'),
  mobileCommonNavBtn: document.getElementById('mobileCommonNavBtn'),
  mobileAssetsNavBtn: document.getElementById('mobileAssetsNavBtn'),
  mobileBrowserCardsNavBtn: document.getElementById('mobileBrowserCardsNavBtn'),
  mobileSettingsNavBtn: document.getElementById('mobileSettingsNavBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  dailyPage: document.getElementById('dailyPage'),
  commonPage: document.getElementById('commonPage'),
  assetsPage: document.getElementById('assetsPage'),
  browserCardsPage: document.getElementById('browserCardsPage'),
  settingsPage: document.getElementById('settingsPage'),
  dailySearchInput: document.getElementById('dailySearchInput'),
  imageOnlyToggle: document.getElementById('imageOnlyToggle'),
  sourceFilterSelect: document.getElementById('sourceFilterSelect'),
  dailyDatePicker: document.getElementById('dailyDatePicker'),
  mobileDateToggleBtn: document.getElementById('mobileDateToggleBtn'),
  mobileFilterToggleBtn: document.getElementById('mobileFilterToggleBtn'),
  dateCard: document.querySelector('.date-card'),
  filterCard: document.querySelector('.filter-card'),
  dailyFilterBar: document.getElementById('dailyFilterBar'),
  recordsList: document.getElementById('recordsList'),
  dailyPagination: document.getElementById('dailyPagination'),
  commonRecordsList: document.getElementById('commonRecordsList'),
  topDailyList: document.getElementById('topDailyList'),
  recentDailyList: document.getElementById('recentDailyList'),
  dailyCount: document.getElementById('dailyCount'),
  commonCount: document.getElementById('commonCount'),
  assetsPageHeading: document.getElementById('assetsPageHeading'),
  assetsCount: document.getElementById('assetsCount'),
  assetBackupDropZone: document.getElementById('assetBackupDropZone'),
  assetLinkDropZone: document.getElementById('assetLinkDropZone'),
  assetSearchInput: document.getElementById('assetSearchInput'),
  assetTypeFilterBar: document.getElementById('assetTypeFilterBar'),
  assetsList: document.getElementById('assetsList'),
  browserCardCount: document.getElementById('browserCardCount'),
  browserScanRootInput: document.getElementById('browserScanRootInput'),
  browserScanSummary: document.getElementById('browserScanSummary'),
  browserScanResults: document.getElementById('browserScanResults'),
  openBrowserImportModalBtn: document.getElementById('openBrowserImportModalBtn'),
  scanAllBrowsersBtn: document.getElementById('scanAllBrowsersBtn'),
  scanChromeBtn: document.getElementById('scanChromeBtn'),
  scanSelfBuiltBtn: document.getElementById('scanSelfBuiltBtn'),
  importSelectedBrowsersBtn: document.getElementById('importSelectedBrowsersBtn'),
  browserCardSearchInput: document.getElementById('browserCardSearchInput'),
  browserCardsList: document.getElementById('browserCardsList'),
  assetNoteInput: document.getElementById('assetNoteInput'),
  assetOpenPrimaryBtn: document.getElementById('assetOpenPrimaryBtn'),
  assetOpenSourceBtn: document.getElementById('assetOpenSourceBtn'),
  assetOpenLocationBtn: document.getElementById('assetOpenLocationBtn'),
  assetSaveNoteBtn: document.getElementById('assetSaveNoteBtn'),
  assetDeleteBtn: document.getElementById('assetDeleteBtn'),
  assetModal: document.getElementById('assetModal'),
  assetModalOverlay: document.getElementById('assetModalOverlay'),
  closeAssetModalBtn: document.getElementById('closeAssetModalBtn'),
  assetModalTitle: document.getElementById('assetModalTitle'),
  assetModalSubline: document.getElementById('assetModalSubline'),
  assetModalMeta: document.getElementById('assetModalMeta'),
  assetModalPreviewBlock: document.getElementById('assetModalPreviewBlock'),
  assetModalImage: document.getElementById('assetModalImage'),
  assetModalPaths: document.getElementById('assetModalPaths'),
  newRecordDraft: document.getElementById('newRecordDraft'),
  createRecordBtn: document.getElementById('createRecordBtn'),
  autoJudgmentEnabled: document.getElementById('autoJudgmentEnabled'),
  altQEnabled: document.getElementById('altQEnabled'),
  doubleCopyEnabled: document.getElementById('doubleCopyEnabled'),
  copyThenKeyEnabled: document.getElementById('copyThenKeyEnabled'),
  startupLaunchEnabled: document.getElementById('startupLaunchEnabled'),
  floatingIconEnabled: document.getElementById('floatingIconEnabled'),
  dockToEdgeEnabled: document.getElementById('dockToEdgeEnabled'),
  postCopyKey: document.getElementById('postCopyKey'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  recordModal: document.getElementById('recordModal'),
  modalOverlay: document.getElementById('modalOverlay'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  modalTitle: document.getElementById('modalTitle'),
  modalSubline: document.getElementById('modalSubline'),
  modalType: document.getElementById('modalType'),
  modalMethod: document.getElementById('modalMethod'),
  modalCategory: document.getElementById('modalCategory'),
  modalHitCount: document.getElementById('modalHitCount'),
  modalLastCapturedAt: document.getElementById('modalLastCapturedAt'),
  modalImagePreviewBlock: document.getElementById('modalImagePreviewBlock'),
  modalImage: document.getElementById('modalImage'),
  modalImagePath: document.getElementById('modalImagePath'),
  detailTextContent: document.getElementById('detailTextContent'),
  detailNote: document.getElementById('detailNote'),
  detailWindowTitle: document.getElementById('detailWindowTitle'),
  openImagePathBtn: document.getElementById('openImagePathBtn'),
  saveContentBtn: document.getElementById('saveContentBtn'),
  saveNoteBtn: document.getElementById('saveNoteBtn'),
  moveToCommonBtn: document.getElementById('moveToCommonBtn'),
  moveToDailyBtn: document.getElementById('moveToDailyBtn'),
  deleteRecordBtn: document.getElementById('deleteRecordBtn'),
  browserCardModal: document.getElementById('browserCardModal'),
  browserCardModalOverlay: document.getElementById('browserCardModalOverlay'),
  closeBrowserCardModalBtn: document.getElementById('closeBrowserCardModalBtn'),
  browserCardModalTitle: document.getElementById('browserCardModalTitle'),
  browserCardModalSubline: document.getElementById('browserCardModalSubline'),
  browserCardModalMeta: document.getElementById('browserCardModalMeta'),
  browserCardCookieNames: document.getElementById('browserCardCookieNames'),
  browserCardRemarkInput: document.getElementById('browserCardRemarkInput'),
  browserCardOpenUrlInput: document.getElementById('browserCardOpenUrlInput'),
  browserCardOpenBtn: document.getElementById('browserCardOpenBtn'),
  browserCardOpenSourceBtn: document.getElementById('browserCardOpenSourceBtn'),
  browserCardSaveBtn: document.getElementById('browserCardSaveBtn'),
  browserCardDeleteBtn: document.getElementById('browserCardDeleteBtn')
  ,
  browserImportModal: document.getElementById('browserImportModal'),
  browserImportModalOverlay: document.getElementById('browserImportModalOverlay'),
  closeBrowserImportModalBtn: document.getElementById('closeBrowserImportModalBtn'),
  browserImportStatus: document.getElementById('browserImportStatus'),
  browserImportChromeTabBtn: document.getElementById('browserImportChromeTabBtn'),
  browserImportSelfBuiltTabBtn: document.getElementById('browserImportSelfBuiltTabBtn'),
  browserImportBitTabBtn: document.getElementById('browserImportBitTabBtn'),
  browserImportSourceSelect: document.getElementById('browserImportSourceSelect'),
  browserImportFilterAuth: document.getElementById('browserImportFilterAuth'),
  browserImportMergeDomain: document.getElementById('browserImportMergeDomain'),
  browserImportLoadBtn: document.getElementById('browserImportLoadBtn'),
  browserImportSelectedCount: document.getElementById('browserImportSelectedCount'),
  browserImportGroupsList: document.getElementById('browserImportGroupsList'),
  browserImportSelectAllBtn: document.getElementById('browserImportSelectAllBtn'),
  browserImportClearBtn: document.getElementById('browserImportClearBtn'),
  browserImportConfirmBtn: document.getElementById('browserImportConfirmBtn')
};

function selectedRecord() {
  return state.records.find((item) => item.id === state.selectedRecordId) || null;
}

function selectedAsset() {
  return state.assets.find((item) => item.id === state.selectedAssetId) || null;
}

function selectedBrowserCard() {
  return state.browserCards.find((item) => item.id === state.selectedBrowserCardId) || null;
}

function isAssetsPage() {
  return state.currentPage === 'assets';
}

function isBrowserCardsPage() {
  return state.currentPage === 'browserCards';
}

function sourceOptions() {
  return ['全部来源', ...Array.from(new Set(
    state.records
      .map((item) => item.sourceAppDisplay || '未知应用')
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, 'zh-CN'))
  ))];
}

function filterRecordsByControls(records) {
  let nextRecords = [...records];

  if (state.imageOnly) {
    nextRecords = nextRecords.filter((item) => item.contentType === 'image');
  }

  if (state.selectedSourceApp !== '全部来源') {
    nextRecords = nextRecords.filter((item) => (item.sourceAppDisplay || '未知应用') === state.selectedSourceApp);
  }

  const keyword = state.searchKeyword.trim().toLowerCase();
  if (!keyword) {
    return nextRecords;
  }

  return nextRecords.filter((item) => {
    const haystack = [
      item.displayTitle,
      item.preview,
      item.textContent,
      item.editableNote,
      item.sourceAppDisplay,
      item.windowTitleDisplay
    ].join('\n').toLowerCase();
    return haystack.includes(keyword);
  });
}

function dailyRecords() {
  let records = state.records.filter((item) => (item.category || 'daily') !== 'common');

  if (state.selectedCalendarDate) {
    records = records.filter((item) => item.createdDate === state.selectedCalendarDate);
  } else if (state.selectedFilter !== '全部') {
    records = records.filter((item) => item.createdDate === state.selectedFilter);
  }

  return filterRecordsByControls(records);
}

function commonRecords() {
  return filterRecordsByControls(state.records
    .filter((item) => (item.category || 'daily') === 'common')
    .sort((left, right) => {
      const hitDelta = Number(right.hitCount || 1) - Number(left.hitCount || 1);
      if (hitDelta !== 0) return hitDelta;
      return new Date(right.lastCapturedAt || right.updatedAt || right.createdAt) - new Date(left.lastCapturedAt || left.updatedAt || left.createdAt);
    }));
}

function topDailyRecords(limit = 5) {
  return [...dailyRecords()]
    .sort((left, right) => Number(right.hitCount || 1) - Number(left.hitCount || 1))
    .slice(0, limit);
}

function recentDailyRecords(limit = 5) {
  return [...dailyRecords()]
    .sort((left, right) => new Date(right.lastCapturedAt || right.updatedAt || right.createdAt) - new Date(left.lastCapturedAt || left.updatedAt || left.createdAt))
    .slice(0, limit);
}

function recordsForCurrentPage() {
  if (state.currentPage === 'common') return commonRecords();
  if (isAssetsPage()) return [];
  if (isBrowserCardsPage()) return [];
  if (state.currentPage === 'settings') return [];
  return dailyRecords();
}

function assetsForCurrentPage() {
  let assets = [...state.assets];
  if (state.assetTypeFilter !== '全部') {
    if (state.assetTypeFilter === '图片') {
      assets = assets.filter((item) => item.isImage);
    } else if (state.assetTypeFilter === '文件') {
      assets = assets.filter((item) => item.entryType === 'file');
    } else if (state.assetTypeFilter === '文件夹') {
      assets = assets.filter((item) => item.entryType === 'folder');
    }
  }

  const keyword = state.assetSearchKeyword.trim().toLowerCase();
  if (!keyword) return assets;

  return assets.filter((item) => {
    const haystack = [item.name, item.note, item.sourcePathDisplay, item.storedPathDisplay].join('\n').toLowerCase();
    return haystack.includes(keyword);
  });
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildRecentDateFilters(records, days = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recentDays = [];
  for (let index = 0; index < days; index += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    recentDays.push(formatDateKey(date));
  }

  const recordDates = new Set((records || []).map((item) => item.createdDate).filter(Boolean));
  const merged = recentDays.filter((item) => recordDates.has(item) || recentDays.includes(item));
  return ['全部', ...merged];
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function render() {
  els.statusText.textContent = state.statusText;
  els.dailySearchInput.value = state.searchKeyword;
  els.imageOnlyToggle.classList.toggle('active', !!state.imageOnly);
  els.dailyDatePicker.value = state.selectedCalendarDate;
  if (els.assetSearchInput) {
    els.assetSearchInput.value = state.assetSearchKeyword;
  }
  if (els.browserScanRootInput) {
    els.browserScanRootInput.value = state.browserScanRoot;
  }
  if (els.browserCardSearchInput) {
    els.browserCardSearchInput.value = state.browserCardSearchKeyword;
  }
  renderPage();
  renderMobileTools();
  renderSearchTools();
  renderFilters();
  renderAssetFilters();
  renderQuickSections();
  renderDailyRecords();
  renderCommonRecords();
  renderAssetList();
  renderBrowserScanResults();
  renderBrowserCardsList();
  renderModal();
  renderAssetModal();
  renderBrowserCardModal();
  renderBrowserImportModal();
  renderSettings();
}

function browserCardsForCurrentPage() {
  let cards = [...state.browserCards];
  const keyword = state.browserCardSearchKeyword.trim().toLowerCase();
  if (!keyword) return cards;

  return cards.filter((item) => {
    const haystack = [
      item.domainDisplay,
      item.remark,
      item.sourceLabel,
      item.openUrl,
      (item.cookieNames || []).join(' ')
    ].join('\n').toLowerCase();
    return haystack.includes(keyword);
  });
}

function renderSearchTools() {
  if (!els.sourceFilterSelect) return;
  const options = sourceOptions();
  const currentValue = options.includes(state.selectedSourceApp) ? state.selectedSourceApp : '全部来源';
  state.selectedSourceApp = currentValue;
  els.sourceFilterSelect.innerHTML = options
    .map((item) => `<option value="${escapeHtml(item)}"${item === currentValue ? ' selected' : ''}>${escapeHtml(item)}</option>`)
    .join('');
}

function renderMobileTools() {
  const dateOpen = !!state.mobileDateToolsOpen;
  const filterOpen = !!state.mobileFilterToolsOpen;
  els.mobileDateToggleBtn.classList.toggle('active', dateOpen);
  els.mobileFilterToggleBtn.classList.toggle('active', filterOpen);
  els.dateCard.classList.toggle('mobile-open', dateOpen);
  els.filterCard.classList.toggle('mobile-open', filterOpen);
}

function renderPage() {
  const current = state.currentPage;
  els.pageTitle.textContent = current === 'daily'
    ? '每日内容'
    : current === 'common'
      ? '常用'
      : current === 'assets'
        ? '资源库'
        : current === 'browserCards'
          ? '浏览器卡片'
          : '设置';
  els.dailyPage.classList.toggle('hidden', current !== 'daily');
  els.commonPage.classList.toggle('hidden', current !== 'common');
  els.assetsPage.classList.toggle('hidden', !isAssetsPage());
  els.browserCardsPage.classList.toggle('hidden', !isBrowserCardsPage());
  els.settingsPage.classList.toggle('hidden', current !== 'settings');
  els.dailyFilterBar.classList.toggle('hidden', current !== 'daily');
  els.dailyPageBtn.classList.toggle('active', current === 'daily');
  els.commonPageBtn.classList.toggle('active', current === 'common');
  els.assetsPageBtn.classList.toggle('active', current === 'assets');
  els.browserCardsPageBtn.classList.toggle('active', current === 'browserCards');
  els.settingsPageBtn.classList.toggle('active', current === 'settings');
  if (els.mobileDailyNavBtn) {
    els.mobileDailyNavBtn.classList.toggle('active', current === 'daily');
    els.mobileCommonNavBtn.classList.toggle('active', current === 'common');
    els.mobileAssetsNavBtn.classList.toggle('active', current === 'assets');
    els.mobileBrowserCardsNavBtn.classList.toggle('active', current === 'browserCards');
    els.mobileSettingsNavBtn.classList.toggle('active', current === 'settings');
  }
  if (isAssetsPage()) {
    els.assetsPageHeading.textContent = '资源库';
  }
}

function renderFilters() {
  els.dailyFilterBar.innerHTML = '';
  if (state.currentPage !== 'daily') return;
  state.dateFilters.forEach((item) => {
    const button = document.createElement('button');
    button.className = `filter-chip ${state.selectedFilter === item ? 'active' : ''}`;
    button.textContent = item;
    button.onclick = () => {
      state.selectedFilter = item;
      state.selectedCalendarDate = item === '全部' ? '' : item;
      state.currentPageNumber = 1;
      state.mobileFilterToolsOpen = false;
      render();
    };
    els.dailyFilterBar.appendChild(button);
  });
}

function renderAssetFilters() {
  if (!els.assetTypeFilterBar) return;
  els.assetTypeFilterBar.innerHTML = '';
  ['全部', '文件', '文件夹', '图片'].forEach((label) => {
    const button = document.createElement('button');
    button.className = `filter-chip ${state.assetTypeFilter === label ? 'active' : ''}`;
    button.textContent = label;
    button.onclick = () => {
      state.assetTypeFilter = label;
      ensureValidAssetSelection();
      render();
    };
    els.assetTypeFilterBar.appendChild(button);
  });
}

function buildRecordCard(record) {
  const thumb = record.contentType === 'image' && record.imageDataUrl
    ? `<div class="thumb-wrap"><img src="${record.imageDataUrl}" alt="缩略图" /></div>`
    : '';
  const sourceLabel = record.sourceAppDisplay || '未知应用';
  const detailLine = record.windowTitleDisplay && record.windowTitleDisplay !== '未获取到窗口标题'
    ? record.windowTitleDisplay
    : sourceLabel;

  return `
    <div class="record-card-actions">
      <div class="record-topline">${escapeHtml(record.categoryDisplay)} · ${escapeHtml(record.contentTypeDisplay)} · ${escapeHtml(sourceLabel)}</div>
      <button class="card-copy-btn" data-record-id="${record.id}" title="复制">⧉</button>
    </div>
    <div class="record-title">${escapeHtml(record.displayTitle)}</div>
    <div class="record-source">${escapeHtml(detailLine)}</div>
    ${thumb}
    <div class="record-preview">${escapeHtml(record.preview || '')}</div>
    <div class="record-footer">
      <span>命中 ${escapeHtml(record.hitCount)}</span>
      <span>${escapeHtml(record.lastCapturedAtDisplay)}</span>
    </div>
  `;
}

function buildAssetCard(asset) {
  const thumb = asset.previewUrl
    ? `<div class="thumb-wrap asset-thumb-wrap"><img src="${asset.previewUrl}" alt="${escapeHtml(asset.name)}" /></div>`
    : '<div class="asset-icon-placeholder">资源</div>';

  return `
    <div class="record-card-actions">
      <div class="record-topline">${escapeHtml(asset.modeDisplay)} · ${escapeHtml(asset.entryTypeDisplay)}</div>
      <div class="asset-card-actions">
        <button class="card-copy-btn card-location-btn" data-asset-id="${asset.id}" title="打开所在位置">⌂</button>
        <button class="card-copy-btn card-open-btn" data-asset-id="${asset.id}" title="打开资源">↗</button>
      </div>
    </div>
    <div class="record-title">${escapeHtml(asset.name)}</div>
    <div class="record-source">${escapeHtml(asset.sourcePathDisplay)}</div>
    ${thumb}
    <div class="record-preview">${escapeHtml(asset.note || asset.sourcePathDisplay || '')}</div>
    <div class="record-footer">
      <span>${escapeHtml(asset.statusDisplay)}</span>
      <span>${escapeHtml(asset.updatedAtDisplay)}</span>
    </div>
  `;
}

function buildBrowserScanCandidateCard(candidate, checked) {
  return `
    <label class="browser-scan-card">
      <div class="record-card-actions">
        <div class="record-topline">${escapeHtml(candidate.browserSource?.label || '未知来源')}</div>
        <input class="browser-scan-checkbox" type="checkbox" data-candidate-key="${escapeHtml(candidate.selectionKey)}"${checked ? ' checked' : ''} />
      </div>
      <div class="record-title">${escapeHtml(String(candidate.domain || '').replace(/^\.+/, '') || 'unknown')}</div>
      <div class="record-source">${escapeHtml(candidate.openUrl || '')}</div>
      <div class="record-preview">${escapeHtml((candidate.cookieNames || []).slice(0, 8).join(', ') || '没有可展示的 Cookie 名称')}</div>
      <div class="record-footer">
        <span>${escapeHtml(candidate.browserSource?.type === 'chrome_profile' ? '系统 Chrome' : '自建浏览器')}</span>
        <span>${escapeHtml(candidate.cookieCount)} 条 Cookie</span>
      </div>
    </label>
  `;
}

function buildBrowserCard(card) {
  const remarkPreview = card.remark
    ? `💬 ${card.remark.slice(0, 5)}${card.remark.length > 5 ? '…' : ''}`
    : '';
  const credentialPreview = [
    card.username ? `👤${card.username.slice(0, 10)}` : '',
    card.password ? `🔑${'*'.repeat(Math.min(String(card.password).length, 8))}` : ''
  ].filter(Boolean).join('  ');
  return `
    <div class="record-card-actions">
      <div class="browser-card-avatar">${escapeHtml((card.nameDisplay || '?').slice(0, 1).toUpperCase())}</div>
      <div class="asset-card-actions">
        <button class="card-copy-btn" data-browser-card-edit-url="${card.id}" title="编辑访问地址">🌐</button>
        <button class="card-copy-btn" data-browser-card-edit="${card.id}" title="编辑备注账号密码">···</button>
      </div>
    </div>
    <div class="record-title">${escapeHtml(card.nameDisplay)}</div>
    ${remarkPreview ? `<div class="browser-card-meta-line">${escapeHtml(remarkPreview)}</div>` : ''}
    ${credentialPreview ? `<div class="browser-card-meta-line">${escapeHtml(credentialPreview)}</div>` : ''}
    <div class="browser-card-meta-line">🌐 ${escapeHtml((card.openUrl || '').slice(0, 30))} · ${escapeHtml(card.cookieCount)}条</div>
    ${card.test_title ? `<div class="browser-card-meta-line ${card.test_ok ? 'is-ok' : 'is-bad'}">${escapeHtml(card.test_ok ? '✅' : '❌')} ${escapeHtml(String(card.test_title).slice(0, 22))}</div>` : ''}
    ${card.last_used_at ? `<div class="browser-card-meta-line">🕐 ${escapeHtml(card.last_used_at)} ${escapeHtml(card.lastUsedMethodDisplay || '')}</div>` : ''}
    <div class="record-footer">
      <button class="browser-card-action primary" data-browser-card-open="${card.id}" title="默认打开">默认打开</button>
      <button class="browser-card-action secondary" data-browser-card-inject="${card.id}" title="指定打开">指定打开</button>
      <button class="browser-card-action danger" data-browser-card-delete-inline="${card.id}" title="删除">删除</button>
    </div>
  `;
}

function renderRecordList(container, records) {
  container.innerHTML = '';
  records.forEach((record) => {
    const item = document.createElement('article');
    item.className = `record-item ${record.contentType === 'image' ? 'is-image' : 'is-text'} ${record.id === state.selectedRecordId ? 'active' : ''}`;
    item.tabIndex = 0;
    item.innerHTML = buildRecordCard(record);
    item.onclick = () => {
      state.selectedRecordId = record.id;
      openModal();
    };
    item.onkeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        state.selectedRecordId = record.id;
        openModal();
      }
    };
    const copyButton = item.querySelector('.card-copy-btn');
    if (copyButton) {
      copyButton.addEventListener('click', async (event) => {
        event.stopPropagation();
        const result = await window.click2save.copyRecordContent(record.id);
        if (result && result.ok === false) {
          alert(result.message || '复制失败');
        }
      });
    }
    container.appendChild(item);
  });
}

function renderQuickList(container, records, emptyText) {
  container.innerHTML = '';

  if (!records.length) {
    const empty = document.createElement('div');
    empty.className = 'quick-empty';
    empty.textContent = emptyText;
    container.appendChild(empty);
    return;
  }

  records.forEach((record) => {
    const button = document.createElement('button');
    button.className = `quick-item ${record.id === state.selectedRecordId ? 'active' : ''}`;
    button.innerHTML = `
      <div class="quick-item-title">${escapeHtml(record.displayTitle)}</div>
      <div class="quick-item-meta">
        <span>命中 ${escapeHtml(record.hitCount)}</span>
        <span>${escapeHtml(record.lastCapturedAtDisplay)}</span>
      </div>
    `;
    button.onclick = () => {
      state.selectedRecordId = record.id;
      openModal();
    };
    container.appendChild(button);
  });
}

function renderQuickSections() {
  renderQuickList(els.topDailyList, topDailyRecords(), '今天还没有高频内容');
  renderQuickList(els.recentDailyList, recentDailyRecords(), '今天还没有最近命中内容');
}

function renderDailyRecords() {
  const records = dailyRecords();
  els.dailyCount.textContent = `${records.length} 条`;
  const pageCount = Math.max(1, Math.ceil(records.length / state.pageSize));
  if (state.currentPageNumber > pageCount) {
    state.currentPageNumber = pageCount;
  }
  const start = (state.currentPageNumber - 1) * state.pageSize;
  const pageRecords = records.slice(start, start + state.pageSize);
  renderRecordList(els.recordsList, pageRecords);
  renderPagination(pageCount);
}

function renderPagination(pageCount) {
  els.dailyPagination.innerHTML = '';
  if (pageCount <= 1) return;

  for (let page = 1; page <= pageCount; page += 1) {
    const button = document.createElement('button');
    button.className = `page-btn ${page === state.currentPageNumber ? 'active' : ''}`;
    button.textContent = String(page);
    button.onclick = () => {
      state.currentPageNumber = page;
      render();
    };
    els.dailyPagination.appendChild(button);
  }
}

function renderCommonRecords() {
  const records = commonRecords();
  els.commonCount.textContent = `${records.length} 条`;
  renderRecordList(els.commonRecordsList, records);
}

function renderAssetList() {
  if (!els.assetsList) return;
  const assets = assetsForCurrentPage();
  els.assetsCount.textContent = `${assets.length} 条`;
  els.assetsList.innerHTML = '';

  if (!assets.length) {
    const empty = document.createElement('div');
    empty.className = 'quick-empty';
    empty.textContent = '还没有资源，拖入文件或文件夹开始收集。';
    els.assetsList.appendChild(empty);
    return;
  }

  assets.forEach((asset) => {
    const item = document.createElement('article');
    item.className = `record-item ${asset.id === state.selectedAssetId ? 'active' : ''}`;
    item.tabIndex = 0;
    item.innerHTML = buildAssetCard(asset);
    item.onclick = () => {
      state.selectedAssetId = asset.id;
      openAssetModal();
    };
    item.onkeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        state.selectedAssetId = asset.id;
        openAssetModal();
      }
    };
    const openButton = item.querySelector('.card-open-btn');
    openButton?.addEventListener('click', async (event) => {
      event.stopPropagation();
      const result = await window.click2save.openAssetPrimary(asset.id);
      if (result && result.ok === false) {
        alert(result.message || '打开失败');
      }
    });
    const locationButton = item.querySelector('.card-location-btn');
    locationButton?.addEventListener('click', async (event) => {
      event.stopPropagation();
      const result = await window.click2save.openAssetLocation(asset.id);
      if (result && result.ok === false) {
        alert(result.message || '打开失败');
      }
    });
    els.assetsList.appendChild(item);
  });
}

function renderBrowserScanResults() {
  if (!els.browserScanSummary) return;
  els.browserScanSummary.textContent = state.browserScanSummary || '导入方式改为弹窗扫描选择。';
}

function renderBrowserCardsList() {
  if (!els.browserCardsList) return;
  const cards = browserCardsForCurrentPage();
  els.browserCardCount.textContent = `${cards.length} 条`;
  els.browserCardsList.innerHTML = '';

  if (!cards.length) {
    const empty = document.createElement('div');
    empty.className = 'quick-empty';
    empty.textContent = '还没有导入浏览器卡片。先扫描并选择域名导入。';
    els.browserCardsList.appendChild(empty);
    return;
  }

  cards.forEach((card) => {
    const item = document.createElement('article');
    item.className = `record-item ${card.id === state.selectedBrowserCardId ? 'active' : ''}`;
    item.tabIndex = 0;
    item.innerHTML = buildBrowserCard(card);
    item.onclick = () => {
      state.selectedBrowserCardId = card.id;
      openBrowserCardModal();
    };
    item.onkeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        state.selectedBrowserCardId = card.id;
        openBrowserCardModal();
      }
    };
    item.querySelector('[data-browser-card-open]')?.addEventListener('click', async (event) => {
      event.stopPropagation();
      const result = await window.click2save.openBrowserCard(card.id);
      if (result && result.ok === false) {
        alert(result.message || '打开失败');
      }
    });
    item.querySelector('[data-browser-card-edit]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      state.selectedBrowserCardId = card.id;
      openBrowserCardModal();
    });
    item.querySelector('[data-browser-card-edit-url]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      state.selectedBrowserCardId = card.id;
      openBrowserCardModal();
    });
    item.querySelector('[data-browser-card-source]')?.addEventListener('click', async (event) => {
      event.stopPropagation();
      const result = await window.click2save.openBrowserCardSource(card.id);
      if (result && result.ok === false) {
        alert(result.message || '打开失败');
      }
    });
    item.querySelector('[data-browser-card-delete-inline]')?.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (!window.confirm('确认删除这张浏览器卡片吗？')) return;
      const result = await window.click2save.deleteBrowserCard(card.id);
      if (result && result.ok === false) {
        alert(result.message || '删除失败');
        return;
      }
      applySnapshot(await window.click2save.getInitialData());
    });
    els.browserCardsList.appendChild(item);
  });
}

function renderAssetModal() {
  const asset = selectedAsset();
  if (!asset) {
    els.assetModalTitle.textContent = '请选择一个资源';
    els.assetModalSubline.textContent = '-';
    els.assetModalMeta.innerHTML = '';
    els.assetModalPaths.innerHTML = '';
    els.assetNoteInput.value = '';
    els.assetModalPreviewBlock.classList.add('hidden');
    return;
  }

  els.assetModalTitle.textContent = asset.name;
  els.assetModalSubline.textContent = `${asset.modeDisplay} · ${asset.updatedAtDisplay}`;
  els.assetNoteInput.value = asset.note || '';
  els.assetModalMeta.innerHTML = `
    <div><span class="meta-label">模式</span><span>${escapeHtml(asset.modeDisplay)}</span></div>
    <div><span class="meta-label">类型</span><span>${escapeHtml(asset.entryTypeDisplay)}</span></div>
    <div><span class="meta-label">状态</span><span>${escapeHtml(asset.statusDisplay)}</span></div>
    <div><span class="meta-label">更新时间</span><span>${escapeHtml(asset.updatedAtDisplay)}</span></div>
  `;
  const rows = [
    `<div><span class="meta-label">当前资源</span><span class="break-all">${escapeHtml(asset.primaryPath || '-')}</span></div>`,
    `<div><span class="meta-label">原路径</span><span class="break-all">${escapeHtml(asset.sourcePathDisplay || '-')}</span></div>`
  ];
  if (asset.mode === 'backup') {
    rows.push(`<div><span class="meta-label">备份路径</span><span class="break-all">${escapeHtml(asset.storedPathDisplay || '-')}</span></div>`);
  }
  els.assetModalPaths.innerHTML = rows.join('');
  els.assetOpenSourceBtn.classList.toggle('hidden', !asset.hasSecondaryOpen);
  if (asset.previewUrl) {
    els.assetModalPreviewBlock.classList.remove('hidden');
    els.assetModalImage.src = asset.previewUrl;
  } else {
    els.assetModalPreviewBlock.classList.add('hidden');
    els.assetModalImage.removeAttribute('src');
  }
}

function renderBrowserCardModal() {
  const card = selectedBrowserCard();
  if (!card) {
    els.browserCardModalTitle.textContent = '请选择一张浏览器卡片';
    els.browserCardModalSubline.textContent = '-';
    els.browserCardModalMeta.innerHTML = '';
    els.browserCardCookieNames.innerHTML = '';
    els.browserCardRemarkInput.value = '';
    els.browserCardOpenUrlInput.value = '';
    return;
  }

  els.browserCardModalTitle.textContent = card.domainDisplay;
  els.browserCardModalSubline.textContent = `${card.sourceLabel} · ${card.updatedAtDisplay}`;
  els.browserCardRemarkInput.value = card.remark || '';
  els.browserCardOpenUrlInput.value = card.openUrl || '';
  els.browserCardModalMeta.innerHTML = `
    <div><span class="meta-label">来源</span><span>${escapeHtml(card.sourceLabel)}</span></div>
    <div><span class="meta-label">类型</span><span>${escapeHtml(card.sourceTypeDisplay)}</span></div>
    <div><span class="meta-label">域名</span><span>${escapeHtml(card.domainDisplay)}</span></div>
    <div><span class="meta-label">Cookie</span><span>${escapeHtml(card.cookieCount)} 条</span></div>
  `;
  els.browserCardCookieNames.innerHTML = `
    <div><span class="meta-label">打开地址</span><span class="break-all">${escapeHtml(card.openUrl || '-')}</span></div>
    <div><span class="meta-label">Cookie 名称</span><span class="break-all">${escapeHtml((card.cookieNames || []).join(', ') || '-')}</span></div>
  `;
}

function currentBrowserImportSources() {
  if (state.browserImportTab === 'self_built') return state.browserImportSources.self_built || [];
  if (state.browserImportTab === 'bitbrowser_api') return state.browserImportSources.bitbrowser || [];
  return state.browserImportSources.chrome_profiles || [];
}

function renderBrowserImportModal() {
  if (!els.browserImportModal) return;
  els.browserImportChromeTabBtn?.classList.toggle('active', state.browserImportTab === 'chrome_profile');
  els.browserImportSelfBuiltTabBtn?.classList.toggle('active', state.browserImportTab === 'self_built');
  els.browserImportBitTabBtn?.classList.toggle('active', state.browserImportTab === 'bitbrowser_api');
  els.browserImportFilterAuth.checked = !!state.browserImportFilterAuth;
  els.browserImportMergeDomain.checked = !!state.browserImportMergeDomain;
  els.browserImportStatus.textContent = state.browserScanSummary || '请选择来源并加载 Cookie';

  const sources = currentBrowserImportSources();
  const nextSourceId = sources.some((item) => item.id === state.browserImportSourceId)
    ? state.browserImportSourceId
    : (sources[0]?.id || '');
  state.browserImportSourceId = nextSourceId;
  els.browserImportSourceSelect.innerHTML = sources.length
    ? sources.map((item) => `<option value="${escapeHtml(item.id)}"${item.id === nextSourceId ? ' selected' : ''}>${escapeHtml(item.label)}</option>`).join('')
    : '<option value="">暂无可用来源</option>';

  els.browserImportGroupsList.innerHTML = '';
  const groups = state.browserImportGroups || [];
  els.browserImportSelectedCount.textContent = `${groups.filter((item) => state.browserScanSelection[item.selectionKey]).length}`;
  if (!groups.length) {
    const empty = document.createElement('div');
    empty.className = 'quick-empty';
    empty.textContent = '加载后会在这里显示域名列表。';
    els.browserImportGroupsList.appendChild(empty);
    return;
  }

  groups.forEach((group) => {
    const row = document.createElement('label');
    row.className = 'browser-import-group-row';
    row.innerHTML = `
      <input type="checkbox" class="browser-scan-checkbox" data-import-group="${escapeHtml(group.selectionKey)}"${state.browserScanSelection[group.selectionKey] ? ' checked' : ''} />
      <div class="browser-import-group-main">
        <strong>${escapeHtml(group.domain)}</strong>
        <span>${escapeHtml(group.cookieCount)} 条 · ${group.authCount > 0 ? `${group.authCount} 条认证` : '无认证 Cookie'}</span>
      </div>
    `;
    row.querySelector('[data-import-group]')?.addEventListener('change', (event) => {
      state.browserScanSelection[group.selectionKey] = !!event.target.checked;
      renderBrowserImportModal();
    });
    els.browserImportGroupsList.appendChild(row);
  });
}

function renderModal() {
  const record = selectedRecord();
  if (!record) {
    els.modalTitle.textContent = '请选择一条记录';
    els.modalSubline.textContent = '-';
    els.modalType.textContent = '-';
    els.modalMethod.textContent = '-';
    els.modalCategory.textContent = '-';
    els.modalHitCount.textContent = '-';
    els.modalLastCapturedAt.textContent = '-';
    els.detailTextContent.value = '';
    els.detailTextContent.disabled = true;
    els.detailNote.value = '';
    els.detailWindowTitle.textContent = '-';
    els.modalImagePreviewBlock.classList.add('hidden');
    return;
  }

  els.modalTitle.textContent = record.displayTitle;
  els.modalSubline.textContent = `${record.sourceAppDisplay} · ${record.createdAtDisplay}`;
  els.modalType.textContent = record.contentTypeDisplay;
  els.modalMethod.textContent = record.captureMethodDisplay;
  els.modalCategory.textContent = record.categoryDisplay;
  els.modalHitCount.textContent = String(record.hitCount || 1);
  els.modalLastCapturedAt.textContent = record.lastCapturedAtDisplay || '-';
  els.detailTextContent.value = record.textContent || '';
  els.detailTextContent.disabled = record.contentType !== 'text';
  els.detailNote.value = record.editableNote || '';
  els.detailWindowTitle.textContent = record.windowTitleDisplay;
  els.moveToCommonBtn.disabled = record.category === 'common';
  els.moveToDailyBtn.disabled = record.category !== 'common';
  els.saveContentBtn.disabled = record.contentType !== 'text';

  if (record.contentType === 'image' && record.imageDataUrl) {
    els.modalImagePreviewBlock.classList.remove('hidden');
    els.modalImage.src = record.imageDataUrl;
    els.modalImagePath.textContent = record.imagePath || '-';
  } else {
    els.modalImagePreviewBlock.classList.add('hidden');
    els.modalImage.removeAttribute('src');
    els.modalImagePath.textContent = '-';
  }
}

function renderSettings() {
  els.autoJudgmentEnabled.checked = !!state.settings.autoJudgmentEnabled;
  els.altQEnabled.checked = !!state.settings.altQEnabled;
  els.doubleCopyEnabled.checked = !!state.settings.doubleCopyEnabled;
  els.copyThenKeyEnabled.checked = !!state.settings.copyThenKeyEnabled;
  els.startupLaunchEnabled.checked = !!state.settings.startupLaunchEnabled;
  els.floatingIconEnabled.checked = !!state.settings.floatingIconEnabled;
  els.dockToEdgeEnabled.checked = state.settings.dockToEdgeEnabled !== false;
  els.postCopyKey.value = state.settings.postCopyKey || 'Shift';
}

function ensureValidSelection() {
  const current = selectedRecord();
  const currentPageIds = new Set(recordsForCurrentPage().map((item) => item.id));
  if (current && currentPageIds.has(current.id)) return;
  const fallback = recordsForCurrentPage()[0] || state.records[0];
  state.selectedRecordId = fallback?.id || null;
}

function ensureValidAssetSelection() {
  if (!isAssetsPage()) return;
  const current = selectedAsset();
  const currentPageIds = new Set(assetsForCurrentPage().map((item) => item.id));
  if (current && currentPageIds.has(current.id)) return;
  state.selectedAssetId = assetsForCurrentPage()[0]?.id || null;
}

function ensureValidBrowserCardSelection() {
  if (!isBrowserCardsPage()) return;
  const current = selectedBrowserCard();
  const currentPageIds = new Set(browserCardsForCurrentPage().map((item) => item.id));
  if (current && currentPageIds.has(current.id)) return;
  state.selectedBrowserCardId = browserCardsForCurrentPage()[0]?.id || null;
}

function openModal() {
  state.modalOpen = true;
  renderModal();
  els.recordModal.classList.remove('hidden');
}

function closeModal() {
  state.modalOpen = false;
  els.recordModal.classList.add('hidden');
}

function openAssetModal() {
  renderAssetModal();
  els.assetModal.classList.remove('hidden');
}

function closeAssetModal() {
  els.assetModal.classList.add('hidden');
}

function openBrowserCardModal() {
  state.browserCardModalOpen = true;
  renderBrowserCardModal();
  els.browserCardModal.classList.remove('hidden');
}

function closeBrowserCardModal() {
  state.browserCardModalOpen = false;
  els.browserCardModal.classList.add('hidden');
}

function openBrowserImportModal() {
  state.browserImportModalOpen = true;
  renderBrowserImportModal();
  els.browserImportModal.classList.remove('hidden');
}

function closeBrowserImportModal() {
  state.browserImportModalOpen = false;
  els.browserImportModal.classList.add('hidden');
}

function applySnapshot(payload) {
  state.records = payload.records || [];
  state.assets = payload.assets || [];
  state.browserCards = payload.browserCards || [];
  state.dateFilters = buildRecentDateFilters(state.records);
  state.settings = payload.settings || {};
  state.browserScanRoot = state.settings.browserScanRoot || state.browserScanRoot || '';
  if (state.settings.pythonCookieProjectPath) {
    state.browserScanRoot = state.settings.pythonCookieProjectPath;
  }
  state.statusText = payload.statusText || '后台监听中';

  if (!state.dateFilters.includes(state.selectedFilter)) {
    state.selectedFilter = state.dateFilters[0] || '全部';
  }

  if (state.selectedCalendarDate && !state.dateFilters.includes(state.selectedCalendarDate)) {
    state.selectedCalendarDate = '';
  }

  if (!sourceOptions().includes(state.selectedSourceApp)) {
    state.selectedSourceApp = '全部来源';
  }

  ensureValidSelection();
  ensureValidAssetSelection();
  ensureValidBrowserCardSelection();
  render();
}

function collectSettings() {
  return {
    autoJudgmentEnabled: els.autoJudgmentEnabled.checked,
    altQEnabled: els.altQEnabled.checked,
    doubleCopyEnabled: els.doubleCopyEnabled.checked,
    copyThenKeyEnabled: els.copyThenKeyEnabled.checked,
    startupLaunchEnabled: els.startupLaunchEnabled.checked,
    floatingIconEnabled: els.floatingIconEnabled.checked,
    dockToEdgeEnabled: els.dockToEdgeEnabled.checked,
    postCopyKey: els.postCopyKey.value.trim() || 'Shift'
  };
}

function switchPage(page) {
  state.currentPage = page;
  ensureValidSelection();
  ensureValidAssetSelection();
  ensureValidBrowserCardSelection();
  render();
}

async function importAssetPaths(paths, mode) {
  const validPaths = [...new Set((paths || []).map((item) => String(item || '').trim()).filter(Boolean))];
  if (!validPaths.length) return;
  const result = await window.click2save.importAssets({
    mode,
    paths: validPaths
  });
  if (result && result.ok === false) {
    alert(result.message || '导入失败');
  }
}

function candidateSelectionKey(candidate) {
  const source = candidate.browserSource || {};
  return [
    source.type || 'unknown',
    source.profileName || '',
    source.userDataDir || '',
    candidate.domain || ''
  ].join('|');
}

async function scanBrowserCards(scope = 'all') {
  const selfBuiltRoot = (els.browserScanRootInput?.value || '').trim();
  const result = await window.click2save.scanBrowserCards({
    scope,
    selfBuiltRoot
  });
  if (!result || result.ok === false) {
    alert((result && result.message) || '扫描失败');
    return;
  }

  state.browserScanRoot = result.selfBuiltRoot || selfBuiltRoot;
  const candidates = Array.isArray(result.candidates) ? result.candidates : [];
  state.browserScanCandidates = candidates.map((candidate) => ({
    ...candidate,
    selectionKey: candidateSelectionKey(candidate)
  }));
  state.browserScanSelection = Object.fromEntries(state.browserScanCandidates.map((item) => [item.selectionKey, false]));
  state.browserScanSummary = `扫描到 ${state.browserScanCandidates.length} 个可导入域名卡片`;
  render();
}

async function loadBrowserImportSources() {
  const projectPath = (els.browserScanRootInput?.value || '').trim();
  const result = await window.click2save.getBrowserImportSources({
    projectPath
  });
  if (!result || result.ok === false) {
    alert((result && result.message) || '获取来源失败');
    return;
  }
  state.browserScanRoot = projectPath || state.browserScanRoot;
  state.browserImportSources = result.results || {
    chrome_profiles: [],
    self_built: [],
    bitbrowser: []
  };
  renderBrowserImportModal();
}

async function loadBrowserImportGroups() {
  const sourceId = els.browserImportSourceSelect?.value || '';
  if (!sourceId) {
    alert('请先选择来源');
    return;
  }
  state.browserImportSourceId = sourceId;
  state.browserScanSummary = '正在读取 Cookie...';
  renderBrowserImportModal();
  const result = await window.click2save.loadBrowserImportGroups({
    projectPath: (els.browserScanRootInput?.value || '').trim(),
    sourceType: state.browserImportTab,
    sourceId,
    filterAuth: !!els.browserImportFilterAuth?.checked,
    mergeDomain: !!els.browserImportMergeDomain?.checked
  });
  if (!result || result.ok === false) {
    alert((result && result.message) || '读取 Cookie 失败');
    return;
  }
  state.browserImportFilterAuth = !!els.browserImportFilterAuth?.checked;
  state.browserImportMergeDomain = !!els.browserImportMergeDomain?.checked;
  state.browserImportGroups = (result.results || []).map((item) => ({
    ...item,
    selectionKey: `${state.browserImportTab}|${sourceId}|${item.domain}`
  }));
  state.browserScanSelection = Object.fromEntries(state.browserImportGroups.map((item) => [item.selectionKey, false]));
  state.browserScanSummary = `已加载 ${state.browserImportGroups.length} 个域`;
  renderBrowserImportModal();
}

async function importSelectedBrowserCards() {
  const selectedGroups = state.browserImportGroups.filter((item) => state.browserScanSelection[item.selectionKey]);
  if (!selectedGroups.length) {
    alert('请先勾选要导入的域名卡片');
    return;
  }

  const built = await window.click2save.buildBrowserImportCards({
    projectPath: (els.browserScanRootInput?.value || '').trim(),
    sourceType: state.browserImportTab,
    sourceId: state.browserImportSourceId,
    groups: selectedGroups
  });
  if (!built || built.ok === false) {
    alert((built && built.message) || '导入构建失败');
    return;
  }

  const result = await window.click2save.importBrowserCards({
    cards: built.results || []
  });
  if (result && result.ok === false) {
    alert(result.message || '导入失败');
    return;
  }

  state.browserScanSummary = `已导入 ${selectedGroups.length} 张卡片`;
  state.browserImportGroups = [];
  state.browserScanSelection = {};
  closeBrowserImportModal();
  applySnapshot(await window.click2save.getInitialData());
}

els.dailyPageBtn.addEventListener('click', () => switchPage('daily'));
els.commonPageBtn.addEventListener('click', () => switchPage('common'));
els.assetsPageBtn.addEventListener('click', () => switchPage('assets'));
els.browserCardsPageBtn?.addEventListener('click', () => switchPage('browserCards'));
els.settingsPageBtn.addEventListener('click', () => switchPage('settings'));
els.mobileDailyNavBtn?.addEventListener('click', () => switchPage('daily'));
els.mobileCommonNavBtn?.addEventListener('click', () => switchPage('common'));
els.mobileAssetsNavBtn?.addEventListener('click', () => switchPage('assets'));
els.mobileBrowserCardsNavBtn?.addEventListener('click', () => switchPage('browserCards'));
els.mobileSettingsNavBtn?.addEventListener('click', () => switchPage('settings'));
els.windowMinBtn.addEventListener('click', () => window.click2save.minimizeWindow());
els.windowMaxBtn.addEventListener('click', async () => {
  const result = await window.click2save.toggleMaximizeWindow();
  els.windowMaxBtn.textContent = result && result.maximized ? '❐' : '□';
});
els.windowCloseBtn.addEventListener('click', () => window.click2save.closeWindow());

els.refreshBtn.addEventListener('click', async () => {
  applySnapshot(await window.click2save.getInitialData());
});
els.mobileRefreshBtn?.addEventListener('click', async () => {
  applySnapshot(await window.click2save.getInitialData());
});

function toggleMobileDateTools() {
  state.mobileDateToolsOpen = !state.mobileDateToolsOpen;
  if (state.mobileDateToolsOpen) {
    state.mobileFilterToolsOpen = false;
  }
  render();
}

function toggleMobileFilterTools() {
  state.mobileFilterToolsOpen = !state.mobileFilterToolsOpen;
  if (state.mobileFilterToolsOpen) {
    state.mobileDateToolsOpen = false;
  }
  render();
}

els.mobileDateToggleBtn.addEventListener('click', toggleMobileDateTools);
els.mobileFilterToggleBtn.addEventListener('click', toggleMobileFilterTools);
els.mobileDateNavBtn?.addEventListener('click', toggleMobileDateTools);
els.mobileFilterNavBtn?.addEventListener('click', toggleMobileFilterTools);

els.dailySearchInput.addEventListener('input', (event) => {
  state.searchKeyword = event.target.value || '';
  state.currentPageNumber = 1;
  render();
});

els.imageOnlyToggle?.addEventListener('click', () => {
  state.imageOnly = !state.imageOnly;
  state.currentPageNumber = 1;
  ensureValidSelection();
  render();
});

els.sourceFilterSelect?.addEventListener('change', (event) => {
  state.selectedSourceApp = event.target.value || '全部来源';
  state.currentPageNumber = 1;
  ensureValidSelection();
  render();
});

els.dailyDatePicker.addEventListener('change', (event) => {
  state.selectedCalendarDate = event.target.value || '';
  state.selectedFilter = state.selectedCalendarDate || '全部';
  state.currentPageNumber = 1;
  state.mobileDateToolsOpen = false;
  render();
});

els.assetSearchInput?.addEventListener('input', (event) => {
  state.assetSearchKeyword = event.target.value || '';
  ensureValidAssetSelection();
  render();
});

els.browserCardSearchInput?.addEventListener('input', (event) => {
  state.browserCardSearchKeyword = event.target.value || '';
  ensureValidBrowserCardSelection();
  render();
});

els.scanAllBrowsersBtn?.addEventListener('click', async () => {
  await scanBrowserCards('all');
});

els.scanChromeBtn?.addEventListener('click', async () => {
  await scanBrowserCards('chrome');
});

els.scanSelfBuiltBtn?.addEventListener('click', async () => {
  await scanBrowserCards('self_built');
});

els.openBrowserImportModalBtn?.addEventListener('click', async () => {
  await loadBrowserImportSources();
  openBrowserImportModal();
});

['dragenter', 'dragover'].forEach((eventName) => {
  [els.assetBackupDropZone, els.assetLinkDropZone].forEach((dropZone) => {
    dropZone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      state.assetDropActive = true;
      dropZone.classList.add('dragover');
    });
  });
});

['dragleave', 'dragend'].forEach((eventName) => {
  [els.assetBackupDropZone, els.assetLinkDropZone].forEach((dropZone) => {
    dropZone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      state.assetDropActive = false;
      dropZone.classList.remove('dragover');
    });
  });
});

[
  { element: els.assetBackupDropZone, mode: 'backup' },
  { element: els.assetLinkDropZone, mode: 'link' }
].forEach(({ element, mode }) => {
  element?.addEventListener('drop', async (event) => {
    event.preventDefault();
    state.assetDropActive = false;
    element.classList.remove('dragover');
    const paths = [...(event.dataTransfer?.files || [])].map((file) => file.path).filter(Boolean);
    await importAssetPaths(paths, mode);
  });
});

els.modalOverlay.addEventListener('click', closeModal);
els.closeModalBtn.addEventListener('click', closeModal);
els.assetModalOverlay?.addEventListener('click', closeAssetModal);
els.closeAssetModalBtn?.addEventListener('click', closeAssetModal);
els.browserCardModalOverlay?.addEventListener('click', closeBrowserCardModal);
els.closeBrowserCardModalBtn?.addEventListener('click', closeBrowserCardModal);
els.browserImportModalOverlay?.addEventListener('click', closeBrowserImportModal);
els.closeBrowserImportModalBtn?.addEventListener('click', closeBrowserImportModal);

els.browserImportChromeTabBtn?.addEventListener('click', () => {
  state.browserImportTab = 'chrome_profile';
  state.browserImportGroups = [];
  renderBrowserImportModal();
});

els.browserImportSelfBuiltTabBtn?.addEventListener('click', () => {
  state.browserImportTab = 'self_built';
  state.browserImportGroups = [];
  renderBrowserImportModal();
});

els.browserImportBitTabBtn?.addEventListener('click', () => {
  state.browserImportTab = 'bitbrowser_api';
  state.browserImportGroups = [];
  renderBrowserImportModal();
});

els.browserImportSourceSelect?.addEventListener('change', (event) => {
  state.browserImportSourceId = event.target.value || '';
});

els.browserImportLoadBtn?.addEventListener('click', async () => {
  await loadBrowserImportGroups();
});

els.browserImportSelectAllBtn?.addEventListener('click', () => {
  state.browserImportGroups.forEach((item) => {
    state.browserScanSelection[item.selectionKey] = true;
  });
  renderBrowserImportModal();
});

els.browserImportClearBtn?.addEventListener('click', () => {
  state.browserImportGroups.forEach((item) => {
    state.browserScanSelection[item.selectionKey] = false;
  });
  renderBrowserImportModal();
});

els.browserImportConfirmBtn?.addEventListener('click', async () => {
  await importSelectedBrowserCards();
});

els.createRecordBtn.addEventListener('click', async () => {
  const result = await window.click2save.createManualTextRecord(els.newRecordDraft.value);
  if (result.ok) {
    els.newRecordDraft.value = '';
  } else if (result.message) {
    alert(result.message);
  }
});

els.saveContentBtn.addEventListener('click', async () => {
  const record = selectedRecord();
  if (!record || record.contentType !== 'text') return;
  await window.click2save.updateRecordContent({ id: record.id, textContent: els.detailTextContent.value });
});

els.moveToCommonBtn.addEventListener('click', async () => {
  const record = selectedRecord();
  if (!record) return;
  await window.click2save.moveRecordToCommon(record.id);
  state.currentPage = 'common';
  render();
  closeModal();
});

els.moveToDailyBtn.addEventListener('click', async () => {
  const record = selectedRecord();
  if (!record) return;
  await window.click2save.moveRecordToDaily(record.id);
  state.currentPage = 'daily';
  render();
  closeModal();
});

els.saveNoteBtn.addEventListener('click', async () => {
  const record = selectedRecord();
  if (!record) return;
  await window.click2save.updateRecordNote({ id: record.id, editableNote: els.detailNote.value });
});

els.deleteRecordBtn.addEventListener('click', async () => {
  const record = selectedRecord();
  if (!record) return;
  const confirmed = window.confirm('确认删除这条记录吗？删除后无法恢复。');
  if (!confirmed) return;
  await window.click2save.deleteRecord(record.id);
  state.selectedRecordId = null;
  closeModal();
});

els.saveSettingsBtn.addEventListener('click', async () => {
  const result = await window.click2save.saveSettings(collectSettings());
  if (result && result.ok === false) {
    alert(result.message || '保存设置失败');
  }
});

els.openImagePathBtn.addEventListener('click', async () => {
  const record = selectedRecord();
  if (!record || !record.imagePath) return;
  await window.click2save.openImagePath(record.imagePath);
});

els.assetOpenPrimaryBtn?.addEventListener('click', async () => {
  const asset = selectedAsset();
  if (!asset) return;
  const result = await window.click2save.openAssetPrimary(asset.id);
  if (result && result.ok === false) {
    alert(result.message || '打开失败');
  }
});

els.assetOpenSourceBtn?.addEventListener('click', async () => {
  const asset = selectedAsset();
  if (!asset) return;
  const result = await window.click2save.openAssetSource(asset.id);
  if (result && result.ok === false) {
    alert(result.message || '打开失败');
  }
});

els.assetOpenLocationBtn?.addEventListener('click', async () => {
  const asset = selectedAsset();
  if (!asset) return;
  const result = await window.click2save.openAssetLocation(asset.id);
  if (result && result.ok === false) {
    alert(result.message || '打开失败');
  }
});

els.assetSaveNoteBtn?.addEventListener('click', async () => {
  const asset = selectedAsset();
  if (!asset) return;
  const result = await window.click2save.updateAssetNote({
    id: asset.id,
    note: els.assetNoteInput.value
  });
  if (result && result.ok === false) {
    alert(result.message || '保存失败');
  }
});

els.assetDeleteBtn?.addEventListener('click', async () => {
  const asset = selectedAsset();
  if (!asset) return;
  if (!window.confirm('确认删除这个资源吗？')) return;
  const result = await window.click2save.deleteAsset(asset.id);
  if (result && result.ok === false) {
    alert(result.message || '删除失败');
    return;
  }
  closeAssetModal();
});

els.browserCardOpenBtn?.addEventListener('click', async () => {
  const card = selectedBrowserCard();
  if (!card) return;
  const result = await window.click2save.openBrowserCard(card.id);
  if (result && result.ok === false) {
    alert(result.message || '打开失败');
  }
});

els.browserCardOpenSourceBtn?.addEventListener('click', async () => {
  const card = selectedBrowserCard();
  if (!card) return;
  const result = await window.click2save.openBrowserCardSource(card.id);
  if (result && result.ok === false) {
    alert(result.message || '打开失败');
  }
});

els.browserCardSaveBtn?.addEventListener('click', async () => {
  const card = selectedBrowserCard();
  if (!card) return;
  const result = await window.click2save.updateBrowserCard({
    id: card.id,
    remark: els.browserCardRemarkInput.value,
    openUrl: els.browserCardOpenUrlInput.value
  });
  if (result && result.ok === false) {
    alert(result.message || '保存失败');
    return;
  }
  applySnapshot(await window.click2save.getInitialData());
});

els.browserCardDeleteBtn?.addEventListener('click', async () => {
  const card = selectedBrowserCard();
  if (!card) return;
  if (!window.confirm('确认删除这张浏览器卡片吗？')) return;
  const result = await window.click2save.deleteBrowserCard(card.id);
  if (result && result.ok === false) {
    alert(result.message || '删除失败');
    return;
  }
  state.selectedBrowserCardId = null;
  closeBrowserCardModal();
  applySnapshot(await window.click2save.getInitialData());
});

window.click2save.onSnapshot(applySnapshot);
window.click2save.getInitialData().then(applySnapshot);
