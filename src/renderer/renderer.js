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
  browserCardSelection: {},
  browserCardCollapsed: {},
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
  browserImportSourceSelection: {},
  browserImportGroups: [],
  browserImportSourceIds: [],
  browserImportSourceError: '',
  browserImportFilterAuth: false,
  browserImportMergeDomain: false,
  statusText: '后台监听中',
  modalOpen: false,
  browserCardModalOpen: false,
  browserCardModalFocus: '',
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
  browserCardSelectedCount: document.getElementById('browserCardSelectedCount'),
  browserCardSelectAllBtn: document.getElementById('browserCardSelectAllBtn'),
  browserCardClearSelectionBtn: document.getElementById('browserCardClearSelectionBtn'),
  browserCardExpandAllBtn: document.getElementById('browserCardExpandAllBtn'),
  browserCardCollapseAllBtn: document.getElementById('browserCardCollapseAllBtn'),
  browserCardBatchTestBtn: document.getElementById('browserCardBatchTestBtn'),
  browserCardBatchDeleteBtn: document.getElementById('browserCardBatchDeleteBtn'),
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
  browserCardNameInput: document.getElementById('browserCardNameInput'),
  browserCardRemarkInput: document.getElementById('browserCardRemarkInput'),
  browserCardOpenUrlInput: document.getElementById('browserCardOpenUrlInput'),
  browserCardUsernameInput: document.getElementById('browserCardUsernameInput'),
  browserCardPasswordInput: document.getElementById('browserCardPasswordInput'),
  browserCardOpenBtn: document.getElementById('browserCardOpenBtn'),
  browserCardInjectBtn: document.getElementById('browserCardInjectBtn'),
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
  browserImportBitApiUrlInput: document.getElementById('browserImportBitApiUrlInput'),
  browserImportBitApiTokenInput: document.getElementById('browserImportBitApiTokenInput'),
  browserImportBitConfigBox: document.getElementById('browserImportBitConfigBox'),
  browserImportSaveBitConfigBtn: document.getElementById('browserImportSaveBitConfigBtn'),
  browserImportScanSourcesBtn: document.getElementById('browserImportScanSourcesBtn'),
  browserImportSourceSelectAllBtn: document.getElementById('browserImportSourceSelectAllBtn'),
  browserImportSourceClearBtn: document.getElementById('browserImportSourceClearBtn'),
  browserImportSourceCount: document.getElementById('browserImportSourceCount'),
  browserImportSourcesList: document.getElementById('browserImportSourcesList'),
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
      item.nameDisplay,
      item.domainDisplay,
      item.remark,
      item.sourceLabel,
      item.openUrl,
      item.test_title,
      item.lastUsedMethodDisplay,
      item.last_used_at,
      item.last_used_method,
      (item.last_used_at || item.lastUsedMethodDisplay) ? '最近使用' : '',
      (item.cookieNames || []).join(' ')
    ].join('\n').toLowerCase();
    return haystack.includes(keyword);
  });
}

function sourceTypeDisplay(type) {
  if (type === 'chrome_profile') return '系统 Chrome';
  if (type === 'self_built') return '自建浏览器';
  if (type === 'bitbrowser' || type === 'bitbrowser_api') return '比特浏览器';
  return '未知来源';
}

function browserSourceLabel(card) {
  const source = card.browserSource || {};
  return source.label || source.displayName || source.name || source.profileName || card.sourceLabel || '未知来源';
}

function groupBrowserCardsBySource(cards) {
  const groups = new Map();
  cards.forEach((card) => {
    const label = browserSourceLabel(card);
    const key = card.sourceKey || `${card.sourceType || 'unknown'}:${label}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label,
        sourceType: card.sourceType || 'unknown',
        items: []
      });
    }
    groups.get(key).items.push(card);
  });
  return [...groups.values()].sort((left, right) => left.label.localeCompare(right.label, 'zh-CN'));
}

function selectedBrowserCardIds() {
  return browserCardsForCurrentPage()
    .filter((item) => state.browserCardSelection[item.id])
    .map((item) => item.id);
}

function browserCardStyleVars(card) {
  return [
    '--browser-card-border: rgba(104, 129, 168, 0.18)',
    '--browser-card-glow: rgba(61, 87, 120, 0.1)',
    '--browser-card-wash: rgba(255, 255, 255, 0.96)'
  ].join(';');
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
  const selected = !!state.browserCardSelection[card.id];
  const host = card.domainDisplay || card.nameDisplay || 'unknown';
  const faviconUrl = host && host !== 'unknown'
    ? `https://${host}/favicon.ico`
    : '';
  const remarkPreview = card.remark
    ? card.remark.slice(0, 18)
    : '';
  const credentialPreview = [
    card.username ? `账号 ${card.username.slice(0, 10)}` : '',
    card.password ? `密码 ${'*'.repeat(Math.min(String(card.password).length, 6))}` : ''
  ].filter(Boolean).join(' · ');
  const testTitle = card.test_title ? String(card.test_title).slice(0, 34) : '';
  const recentUse = card.lastUsedMethodDisplay
    ? `${card.lastUsedMethodDisplay}${card.last_used_at ? ` · ${card.last_used_at}` : ''}`
    : '';
  const sourceLabel = browserSourceLabel(card);
  return `
    <div class="browser-card-surface" style="${escapeHtml(browserCardStyleVars(card))}">
      <div class="record-card-actions browser-card-topbar">
        ${faviconUrl ? `<img class="browser-card-favicon-bg" src="${escapeHtml(faviconUrl)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=&quot;browser-card-favicon-bg browser-card-favicon-placeholder&quot;>无</span>'" />` : '<span class="browser-card-favicon-bg browser-card-favicon-placeholder">无</span>'}
        <label class="browser-card-checkwrap" title="选择卡片">
          <input class="browser-scan-checkbox browser-card-toggle" type="checkbox" data-browser-card-select="${card.id}"${selected ? ' checked' : ''} />
        </label>
        <div class="asset-card-actions browser-card-tools">
          <button class="card-copy-btn" data-browser-card-test="${card.id}" title="测试网站连通性">测</button>
          <button class="card-copy-btn" data-browser-card-edit-url="${card.id}" title="编辑地址、备注、账号密码">✎</button>
        </div>
      </div>
      <div class="browser-card-headline">
        <div class="browser-card-avatar">${escapeHtml((card.nameDisplay || '?').slice(0, 1).toUpperCase())}</div>
        <div class="browser-card-titlebox">
          <div class="record-title browser-card-title">${escapeHtml(card.nameDisplay)}</div>
          <div class="browser-card-meta-line">${escapeHtml(card.domainDisplay)}</div>
        </div>
      </div>
      ${recentUse ? `<div class="browser-card-meta-line">${escapeHtml(recentUse)}</div>` : ''}
      <div class="browser-card-meta-line">${escapeHtml(sourceLabel)}</div>
      ${remarkPreview ? `<div class="browser-card-meta-line">${escapeHtml(remarkPreview)}</div>` : ''}
      ${credentialPreview ? `<div class="browser-card-meta-line">${escapeHtml(credentialPreview)}</div>` : ''}
      ${testTitle ? `<div class="browser-card-meta-line">${escapeHtml(testTitle)}</div>` : ''}
      <div class="browser-card-meta-row">
        <span class="browser-card-chip">${escapeHtml(card.cookieCount)} Cookie</span>
        ${card.test_ok === true
          ? '<span class="browser-card-chip ok">可连接</span>'
          : card.test_ok === false
            ? '<span class="browser-card-chip bad">连接异常</span>'
            : '<span class="browser-card-chip">未测试</span>'}
      </div>
      <div class="record-footer browser-card-footer">
        <button class="browser-card-action primary" data-browser-card-open="${card.id}" title="默认打开">打开</button>
        <button class="browser-card-action secondary" data-browser-card-inject="${card.id}" title="指定打开">注入</button>
        <button class="browser-card-action danger" data-browser-card-delete-inline="${card.id}" title="删除">删</button>
      </div>
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
  if (els.browserCardSelectedCount) {
    els.browserCardSelectedCount.textContent = String(selectedBrowserCardIds().length);
  }
  els.browserCardsList.innerHTML = '';

  if (!cards.length) {
    const empty = document.createElement('div');
    empty.className = 'quick-empty';
    empty.textContent = '还没有导入浏览器卡片。先扫描并选择域名导入。';
    els.browserCardsList.appendChild(empty);
    return;
  }

  const groupsWrap = document.createElement('div');
  groupsWrap.className = 'browser-card-groups';

  groupBrowserCardsBySource(cards).forEach((group) => {
    const collapsed = !!state.browserCardCollapsed[group.key];
    const section = document.createElement('section');
    section.className = 'browser-card-group';
    section.innerHTML = `
      <div class="browser-card-group-head">
        <div class="browser-card-group-title">
          <strong>${escapeHtml(group.label)}</strong>
          <span>${escapeHtml(sourceTypeDisplay(group.sourceType))}</span>
        </div>
        <div class="browser-card-group-head-actions">
          <span class="count-chip">${group.items.length} 张</span>
          <button class="text-action" data-browser-group-select="${escapeHtml(group.key)}" type="button">本组全选</button>
          <button class="text-action" data-browser-group-toggle="${escapeHtml(group.key)}" type="button">${collapsed ? '展开' : '收起'}</button>
        </div>
      </div>
      <div class="browser-card-group-grid${collapsed ? ' hidden' : ''}"></div>
    `;
    const grid = section.querySelector('.browser-card-group-grid');
    section.querySelector('[data-browser-group-select]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      group.items.forEach((item) => {
        state.browserCardSelection[item.id] = true;
      });
      renderBrowserCardsList();
    });
    section.querySelector('[data-browser-group-toggle]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      state.browserCardCollapsed[group.key] = !state.browserCardCollapsed[group.key];
      renderBrowserCardsList();
    });

    group.items.forEach((card) => {
      const item = document.createElement('article');
      item.className = `record-item browser-card-item ${card.id === state.selectedBrowserCardId ? 'active' : ''} ${state.browserCardSelection[card.id] ? 'selected' : ''}`;
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
      item.querySelector('[data-browser-card-test]')?.addEventListener('click', async (event) => {
        event.stopPropagation();
        const result = await window.click2save.checkBrowserCardConnectivity([card.id]);
        if (result && result.ok === false) {
          alert(result.message || '测试失败');
          return;
        }
        applySnapshot(await window.click2save.getInitialData());
      });
      item.querySelector('[data-browser-card-inject]')?.addEventListener('click', async (event) => {
        event.stopPropagation();
        const result = await window.click2save.injectBrowserCard(card.id);
        if (result && result.ok === false) {
          alert(result.message || 'Cookie 转移失败');
          return;
        }
        applySnapshot(await window.click2save.getInitialData());
      });
      item.querySelector('[data-browser-card-edit-url]')?.addEventListener('click', (event) => {
        event.stopPropagation();
        state.selectedBrowserCardId = card.id;
        openBrowserCardModal('openUrl');
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
      item.querySelector('[data-browser-card-select]')?.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      item.querySelector('[data-browser-card-select]')?.addEventListener('change', (event) => {
        state.browserCardSelection[card.id] = !!event.target.checked;
        renderBrowserCardsList();
      });
      grid.appendChild(item);
    });

    groupsWrap.appendChild(section);
  });

  els.browserCardsList.appendChild(groupsWrap);
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
    els.browserCardNameInput.value = '';
    els.browserCardRemarkInput.value = '';
    els.browserCardOpenUrlInput.value = '';
    els.browserCardUsernameInput.value = '';
    els.browserCardPasswordInput.value = '';
    return;
  }

  els.browserCardModalTitle.textContent = card.domainDisplay;
  els.browserCardModalSubline.textContent = `${card.sourceLabel} · ${card.updatedAtDisplay}`;
  els.browserCardNameInput.value = card.nameDisplay || '';
  els.browserCardRemarkInput.value = card.remark || '';
  els.browserCardOpenUrlInput.value = card.openUrl || '';
  els.browserCardUsernameInput.value = card.username || '';
  els.browserCardPasswordInput.value = card.password || '';
  els.browserCardModalMeta.innerHTML = `
    <div><span class="meta-label">来源</span><span>${escapeHtml(card.sourceLabel)}</span></div>
    <div><span class="meta-label">类型</span><span>${escapeHtml(card.sourceTypeDisplay)}</span></div>
    <div><span class="meta-label">域名</span><span>${escapeHtml(card.domainDisplay)}</span></div>
    <div><span class="meta-label">Cookie</span><span>${escapeHtml(card.cookieCount)} 条</span></div>
  `;
}

function currentBrowserImportSources() {
  if (state.browserImportTab === 'self_built') return state.browserImportSources.self_built || [];
  if (state.browserImportTab === 'bitbrowser_api') return state.browserImportSources.bitbrowser || [];
  return state.browserImportSources.chrome_profiles || [];
}

function selectedBrowserImportSources() {
  const sources = currentBrowserImportSources();
  return sources.filter((item) => state.browserImportSourceSelection[item.id]);
}

function resetBrowserImportSelection() {
  state.browserImportGroups = [];
  state.browserScanSelection = {};
}

function renderBrowserImportModal() {
  if (!els.browserImportModal) return;
  els.browserImportChromeTabBtn?.classList.toggle('active', state.browserImportTab === 'chrome_profile');
  els.browserImportSelfBuiltTabBtn?.classList.toggle('active', state.browserImportTab === 'self_built');
  els.browserImportBitTabBtn?.classList.toggle('active', state.browserImportTab === 'bitbrowser_api');
  els.browserImportFilterAuth.checked = !!state.browserImportFilterAuth;
  els.browserImportMergeDomain.checked = !!state.browserImportMergeDomain;
  els.browserImportBitConfigBox?.classList.toggle('hidden', state.browserImportTab !== 'bitbrowser_api');
  els.browserImportSaveBitConfigBtn?.classList.toggle('hidden', state.browserImportTab !== 'bitbrowser_api');
  if (els.browserImportBitApiUrlInput) {
    els.browserImportBitApiUrlInput.value = state.settings.bitApiUrl || 'http://127.0.0.1:54345';
  }
  if (els.browserImportBitApiTokenInput) {
    els.browserImportBitApiTokenInput.value = state.settings.bitApiToken || '';
  }
  els.browserImportStatus.textContent = state.browserScanSummary || '请选择来源并加载 Cookie';

  const sources = currentBrowserImportSources();
  if (els.browserImportSourceCount) {
    els.browserImportSourceCount.textContent = `${sources.length}`;
  }
  state.browserImportSourceIds = state.browserImportSourceIds.filter((id) => sources.some((item) => item.id === id));
  if (!state.browserImportSourceIds.length && sources.length === 1) {
    state.browserImportSourceIds = [sources[0].id];
    state.browserImportSourceSelection[sources[0].id] = true;
  }

  els.browserImportSourcesList.innerHTML = '';
  if (!sources.length) {
    const emptySource = document.createElement('div');
    emptySource.className = 'quick-empty';
    emptySource.textContent = state.browserImportTab === 'bitbrowser_api'
      ? (state.browserImportSourceError || '没有读取到比特浏览器来源，请确认 API 地址、Token 和比特主程序状态。')
      : '点击“开始扫描来源”后，这里会显示可选来源。';
    els.browserImportSourcesList.appendChild(emptySource);
  } else {
    sources.forEach((item) => {
      const checked = !!state.browserImportSourceSelection[item.id];
      const row = document.createElement('label');
      row.className = 'browser-import-source-row';
      row.innerHTML = `
        <input type="checkbox" class="browser-scan-checkbox" data-import-source="${escapeHtml(item.id)}"${checked ? ' checked' : ''} />
        <div class="browser-import-source-main">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(sourceTypeDisplay(item.type || state.browserImportTab))}</span>
        </div>
      `;
      row.querySelector('[data-import-source]')?.addEventListener('change', (event) => {
        const enabled = !!event.target.checked;
        state.browserImportSourceSelection[item.id] = enabled;
        state.browserImportSourceIds = enabled
          ? [...new Set([...state.browserImportSourceIds, item.id])]
          : state.browserImportSourceIds.filter((id) => id !== item.id);
        resetBrowserImportSelection();
        renderBrowserImportModal();
      });
      els.browserImportSourcesList.appendChild(row);
    });
  }

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

  const groupMap = new Map();
  groups.forEach((group) => {
    const sourceKey = `${group.sourceType || 'unknown'}|${group.sourceId || ''}|${group.sourceLabel || '未知来源'}`;
    if (!groupMap.has(sourceKey)) {
      groupMap.set(sourceKey, {
        key: sourceKey,
        label: group.sourceLabel || '未知来源',
        type: group.sourceType || 'unknown',
        items: []
      });
    }
    groupMap.get(sourceKey).items.push(group);
  });

  [...groupMap.values()].forEach((sourceGroup) => {
    const section = document.createElement('section');
    section.className = 'browser-import-domain-group';
    section.innerHTML = `
      <div class="browser-card-group-head">
        <div class="browser-card-group-title">
          <strong>${escapeHtml(sourceGroup.label)}</strong>
          <span>${escapeHtml(sourceTypeDisplay(sourceGroup.type))}</span>
        </div>
        <div class="browser-card-group-head-actions">
          <span class="count-chip">${sourceGroup.items.length} 个域</span>
          <button class="text-action" data-import-group-select-source="${escapeHtml(sourceGroup.key)}" type="button">本组全选</button>
          <button class="text-action" data-import-group-clear-source="${escapeHtml(sourceGroup.key)}" type="button">本组清空</button>
        </div>
      </div>
      <div class="browser-import-domain-list"></div>
    `;
    section.querySelector('[data-import-group-select-source]')?.addEventListener('click', () => {
      sourceGroup.items.forEach((item) => {
        state.browserScanSelection[item.selectionKey] = true;
      });
      renderBrowserImportModal();
    });
    section.querySelector('[data-import-group-clear-source]')?.addEventListener('click', () => {
      sourceGroup.items.forEach((item) => {
        state.browserScanSelection[item.selectionKey] = false;
      });
      renderBrowserImportModal();
    });

    const list = section.querySelector('.browser-import-domain-list');
    sourceGroup.items.forEach((group) => {
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
      list.appendChild(row);
    });
    els.browserImportGroupsList.appendChild(section);
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

function openBrowserCardModal(focusField = '') {
  state.browserCardModalOpen = true;
  state.browserCardModalFocus = focusField;
  renderBrowserCardModal();
  els.browserCardModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    const target = state.browserCardModalFocus === 'openUrl'
      ? els.browserCardOpenUrlInput
      : state.browserCardModalFocus === 'remark'
        ? (els.browserCardUsernameInput || els.browserCardRemarkInput)
        : null;
    target?.focus();
    if (target && 'select' in target) {
      target.select?.();
    }
  });
}

function closeBrowserCardModal() {
  state.browserCardModalOpen = false;
  state.browserCardModalFocus = '';
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
  const cardIds = new Set(state.browserCards.map((item) => item.id));
  state.browserCardSelection = Object.fromEntries(
    Object.entries(state.browserCardSelection).filter(([id, value]) => value && cardIds.has(id))
  );
  state.browserCardCollapsed = Object.fromEntries(
    Object.entries(state.browserCardCollapsed).filter(([key]) => state.browserCards.some((item) => item.sourceKey === key))
  );

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
  const bitApiUrl = (els.browserImportBitApiUrlInput?.value || '').trim();
  const bitApiToken = (els.browserImportBitApiTokenInput?.value || '').trim();
  state.browserScanSummary = '正在加载来源列表...';
  renderBrowserImportModal();
  const result = await window.click2save.getBrowserImportSources({
    bitApiUrl,
    bitApiToken
  });
  if (!result || result.ok === false) {
    alert((result && result.message) || '获取来源失败');
    return;
  }
  state.browserImportSources = result.results || {
    chrome_profiles: [],
    self_built: [],
    bitbrowser: []
  };
  state.browserImportSourceError = (result.results && result.results.bitbrowser_error) || '';
  state.browserImportSourceSelection = {};
  state.browserImportSourceIds = [];
  resetBrowserImportSelection();
  state.browserScanSummary = '来源扫描完成，请勾选来源后再加载 Cookie。';
  renderBrowserImportModal();
}

async function saveBrowserImportBitConfig() {
  const nextSettings = {
    ...state.settings,
    pythonCookieProjectPath: state.settings.pythonCookieProjectPath || '',
    bitApiUrl: (els.browserImportBitApiUrlInput?.value || '').trim() || 'http://127.0.0.1:54345',
    bitApiToken: (els.browserImportBitApiTokenInput?.value || '').trim()
  };
  const result = await window.click2save.saveSettings(nextSettings);
  if (result && result.ok === false) {
    alert(result.message || '保存失败');
    return;
  }
  state.settings = nextSettings;
  state.browserScanSummary = '比特浏览器配置已保存';
  renderBrowserImportModal();
}

async function batchDeleteBrowserCards() {
  const ids = selectedBrowserCardIds();
  if (!ids.length) {
    alert('请先选择卡片');
    return;
  }
  if (!window.confirm(`确认删除选中的 ${ids.length} 张卡片吗？`)) {
    return;
  }
  const result = await window.click2save.deleteBrowserCards(ids);
  if (result && result.ok === false) {
    alert(result.message || '批量删除失败');
    return;
  }
  state.browserCardSelection = {};
  applySnapshot(await window.click2save.getInitialData());
}

async function batchTestBrowserCards() {
  const ids = selectedBrowserCardIds();
  if (!ids.length) {
    alert('请先选择卡片');
    return;
  }
  state.statusText = `正在测试 ${ids.length} 张浏览器卡片...`;
  render();
  const result = await window.click2save.checkBrowserCardConnectivity(ids);
  if (result && result.ok === false) {
    alert(result.message || '批量测试失败');
    return;
  }
  applySnapshot(await window.click2save.getInitialData());
}

async function loadBrowserImportGroups() {
  const selectedSources = selectedBrowserImportSources();
  if (!selectedSources.length) {
    alert('请先勾选至少一个来源');
    return;
  }
  state.browserScanSummary = '正在读取 Cookie...';
  renderBrowserImportModal();

  const loadedGroups = [];
  const bitApiUrl = (els.browserImportBitApiUrlInput?.value || '').trim();
  const bitApiToken = (els.browserImportBitApiTokenInput?.value || '').trim();

  for (const source of selectedSources) {
    const result = await window.click2save.loadBrowserImportGroups({
      bitApiUrl,
      bitApiToken,
      sourceType: state.browserImportTab,
      sourceId: source.id,
      filterAuth: !!els.browserImportFilterAuth?.checked,
      mergeDomain: !!els.browserImportMergeDomain?.checked
    });
    if (!result || result.ok === false) {
      alert(`${source.label} 读取失败：${(result && result.message) || '读取 Cookie 失败'}`);
      return;
    }
    loadedGroups.push(...(result.results || []).map((item) => ({
      ...item,
      sourceId: source.id,
      sourceLabel: source.label,
      sourceType: state.browserImportTab
    })));
  }

  state.browserImportFilterAuth = !!els.browserImportFilterAuth?.checked;
  state.browserImportMergeDomain = !!els.browserImportMergeDomain?.checked;
  state.browserImportSourceIds = selectedSources.map((item) => item.id);
  state.browserImportGroups = loadedGroups.map((item) => ({
    ...item,
    selectionKey: `${state.browserImportTab}|${item.sourceId}|${item.domain}`
  }));
  state.browserScanSelection = Object.fromEntries(state.browserImportGroups.map((item) => [item.selectionKey, false]));
  state.browserScanSummary = `已从 ${selectedSources.length} 个来源加载 ${state.browserImportGroups.length} 个域`;
  renderBrowserImportModal();
}

async function importSelectedBrowserCards() {
  const selectedGroups = state.browserImportGroups.filter((item) => state.browserScanSelection[item.selectionKey]);
  if (!selectedGroups.length) {
    alert('请先勾选要导入的域名卡片');
    return;
  }

  const groupedBySource = new Map();
  selectedGroups.forEach((group) => {
    const key = `${group.sourceType}|${group.sourceId}`;
    if (!groupedBySource.has(key)) {
      groupedBySource.set(key, []);
    }
    groupedBySource.get(key).push(group);
  });

  const cards = [];
  for (const [key, groups] of groupedBySource.entries()) {
    const [sourceType, sourceId] = key.split('|');
    const built = await window.click2save.buildBrowserImportCards({
      sourceType,
      sourceId,
      groups
    });
    if (!built || built.ok === false) {
      alert((built && built.message) || '导入构建失败');
      return;
    }
    cards.push(...(built.results || []));
  }

  const result = await window.click2save.importBrowserCards({
    cards
  });
  if (result && result.ok === false) {
    alert(result.message || '导入失败');
    return;
  }

  state.browserScanSummary = `已导入 ${selectedGroups.length} 张卡片`;
  resetBrowserImportSelection();
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

els.browserCardSelectAllBtn?.addEventListener('click', () => {
  browserCardsForCurrentPage().forEach((item) => {
    state.browserCardSelection[item.id] = true;
  });
  renderBrowserCardsList();
});

els.browserCardClearSelectionBtn?.addEventListener('click', () => {
  state.browserCardSelection = {};
  renderBrowserCardsList();
});

els.browserCardExpandAllBtn?.addEventListener('click', () => {
  state.browserCardCollapsed = {};
  renderBrowserCardsList();
});

els.browserCardCollapseAllBtn?.addEventListener('click', () => {
  const next = {};
  groupBrowserCardsBySource(browserCardsForCurrentPage()).forEach((group) => {
    next[group.key] = true;
  });
  state.browserCardCollapsed = next;
  renderBrowserCardsList();
});

els.browserCardBatchDeleteBtn?.addEventListener('click', async () => {
  await batchDeleteBrowserCards();
});

els.browserCardBatchTestBtn?.addEventListener('click', async () => {
  await batchTestBrowserCards();
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
  resetBrowserImportSelection();
  renderBrowserImportModal();
});

els.browserImportSelfBuiltTabBtn?.addEventListener('click', () => {
  state.browserImportTab = 'self_built';
  resetBrowserImportSelection();
  renderBrowserImportModal();
});

els.browserImportBitTabBtn?.addEventListener('click', () => {
  state.browserImportTab = 'bitbrowser_api';
  resetBrowserImportSelection();
  renderBrowserImportModal();
});

els.browserImportScanSourcesBtn?.addEventListener('click', async () => {
  await loadBrowserImportSources();
});

els.browserImportSaveBitConfigBtn?.addEventListener('click', async () => {
  await saveBrowserImportBitConfig();
});

els.browserImportSourceSelectAllBtn?.addEventListener('click', () => {
  currentBrowserImportSources().forEach((item) => {
    state.browserImportSourceSelection[item.id] = true;
  });
  state.browserImportSourceIds = currentBrowserImportSources().map((item) => item.id);
  resetBrowserImportSelection();
  renderBrowserImportModal();
});

els.browserImportSourceClearBtn?.addEventListener('click', () => {
  currentBrowserImportSources().forEach((item) => {
    state.browserImportSourceSelection[item.id] = false;
  });
  state.browserImportSourceIds = [];
  resetBrowserImportSelection();
  renderBrowserImportModal();
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

els.browserCardInjectBtn?.addEventListener('click', async () => {
  const card = selectedBrowserCard();
  if (!card) return;
  const result = await window.click2save.injectBrowserCard(card.id);
  if (result && result.ok === false) {
    alert(result.message || 'Cookie 转移失败');
    return;
  }
  applySnapshot(await window.click2save.getInitialData());
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
    name: els.browserCardNameInput.value,
    remark: els.browserCardRemarkInput.value,
    openUrl: els.browserCardOpenUrlInput.value,
    username: els.browserCardUsernameInput.value,
    password: els.browserCardPasswordInput.value
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
