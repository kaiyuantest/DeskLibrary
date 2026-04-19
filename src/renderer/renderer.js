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
  browserInjectModalOpen: false,
  browserInjectCardId: null,
  browserInjectTargets: [],
  browserInjectSelectedTargetId: '',
  browserInjectMethod: 'inject',
  browserInjectStatus: '请选择目标浏览器',
  statusText: '后台监听中',
  modalOpen: false,
  browserCardModalOpen: false,
  browserCardModalFocus: '',
  mobileDateToolsOpen: false,
  mobileFilterToolsOpen: false,
  assetDropActive: false,
  browserOnlineImportModalOpen: false,
  browserOnlineImportTargets: [],
  browserOnlineImportSelectedKey: '',
  browserOnlineImportGroupRef: null,
  browserOnlineImportStatus: ''
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
  aboutPageBtn: document.getElementById('aboutPageBtn'),
  mobileDailyNavBtn: document.getElementById('mobileDailyNavBtn'),
  mobileCommonNavBtn: document.getElementById('mobileCommonNavBtn'),
  mobileAssetsNavBtn: document.getElementById('mobileAssetsNavBtn'),
  mobileBrowserCardsNavBtn: document.getElementById('mobileBrowserCardsNavBtn'),
  mobileSettingsNavBtn: document.getElementById('mobileSettingsNavBtn'),
  mobileAboutNavBtn: document.getElementById('mobileAboutNavBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  dailyPage: document.getElementById('dailyPage'),
  commonPage: document.getElementById('commonPage'),
  assetsPage: document.getElementById('assetsPage'),
  browserCardsPage: document.getElementById('browserCardsPage'),
  settingsPage: document.getElementById('settingsPage'),
  aboutPage: document.getElementById('aboutPage'),
  topbarControlDeck: document.getElementById('topbarControlDeck'),
  aboutOpenSourceBtn: document.getElementById('aboutOpenSourceBtn'),
  aboutFeedbackForm: document.getElementById('aboutFeedbackForm'),
  aboutFeedbackSubmitBtn: document.getElementById('aboutFeedbackSubmitBtn'),
  aboutFeedbackStatus: document.getElementById('aboutFeedbackStatus'),
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
  browserOnlineImportModal: document.getElementById('browserOnlineImportModal'),
  browserOnlineImportModalOverlay: document.getElementById('browserOnlineImportModalOverlay'),
  closeBrowserOnlineImportModalBtn: document.getElementById('closeBrowserOnlineImportModalBtn'),
  browserOnlineImportRefreshBtn: document.getElementById('browserOnlineImportRefreshBtn'),
  browserOnlineImportTargetSelect: document.getElementById('browserOnlineImportTargetSelect'),
  browserOnlineImportAccountInput: document.getElementById('browserOnlineImportAccountInput'),
  browserOnlineImportSubmitBtn: document.getElementById('browserOnlineImportSubmitBtn'),
  browserOnlineImportStatus: document.getElementById('browserOnlineImportStatus'),
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
  doubleCopyEnabled: document.getElementById('doubleCopyEnabled'),
  copyThenKeyEnabled: document.getElementById('copyThenKeyEnabled'),
  startupLaunchEnabled: document.getElementById('startupLaunchEnabled'),
  floatingIconEnabled: document.getElementById('floatingIconEnabled'),
  dockToEdgeEnabled: document.getElementById('dockToEdgeEnabled'),
  postCopyKey: document.getElementById('postCopyKey'),
  deleteLastCaptureShortcutInput: document.getElementById('deleteLastCaptureShortcutInput'),
  accumulationStartShortcutInput: document.getElementById('accumulationStartShortcutInput'),
  accumulationFinishShortcutInput: document.getElementById('accumulationFinishShortcutInput'),
  accumulationUndoShortcutInput: document.getElementById('accumulationUndoShortcutInput'),
  hotkeyDeleteLastEnabled: document.getElementById('hotkeyDeleteLastEnabled'),
  hotkeyStartAccumEnabled: document.getElementById('hotkeyStartAccumEnabled'),
  hotkeyFinishAccumEnabled: document.getElementById('hotkeyFinishAccumEnabled'),
  hotkeyUndoAccumEnabled: document.getElementById('hotkeyUndoAccumEnabled'),
  selfBuiltWorkspaceDirInput: document.getElementById('selfBuiltWorkspaceDirInput'),
  selectSelfBuiltWorkspaceDirBtn: document.getElementById('selectSelfBuiltWorkspaceDirBtn'),
  assetBackupPathInput: document.getElementById('assetBackupPathInput'),
  selectAssetBackupPathBtn: document.getElementById('selectAssetBackupPathBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  settingsHelpModal: document.getElementById('settingsHelpModal'),
  settingsHelpModalOverlay: document.getElementById('settingsHelpModalOverlay'),
  closeSettingsHelpModalBtn: document.getElementById('closeSettingsHelpModalBtn'),
  settingsHelpTitle: document.getElementById('settingsHelpTitle'),
  settingsHelpSubline: document.getElementById('settingsHelpSubline'),
  settingsHelpBody: document.getElementById('settingsHelpBody'),
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
  browserInjectModal: document.getElementById('browserInjectModal'),
  browserInjectModalOverlay: document.getElementById('browserInjectModalOverlay'),
  closeBrowserInjectModalBtn: document.getElementById('closeBrowserInjectModalBtn'),
  browserInjectStatus: document.getElementById('browserInjectStatus'),
  browserInjectRefreshBtn: document.getElementById('browserInjectRefreshBtn'),
  browserInjectTargetCount: document.getElementById('browserInjectTargetCount'),
  browserInjectTargetsList: document.getElementById('browserInjectTargetsList'),
  browserInjectMethodInject: document.getElementById('browserInjectMethodInject'),
  browserInjectMethodDbWrite: document.getElementById('browserInjectMethodDbWrite'),
  browserInjectHint: document.getElementById('browserInjectHint'),
  browserInjectConfirmBtn: document.getElementById('browserInjectConfirmBtn'),
  browserImportModal: document.getElementById('browserImportModal'),
  browserImportModalOverlay: document.getElementById('browserImportModalOverlay'),
  closeBrowserImportModalBtn: document.getElementById('closeBrowserImportModalBtn'),
  browserImportStatus: document.getElementById('browserImportStatus'),
  browserImportChromeTabBtn: document.getElementById('browserImportChromeTabBtn'),
  browserImportSelfBuiltTabBtn: document.getElementById('browserImportSelfBuiltTabBtn'),
  browserImportBitTabBtn: document.getElementById('browserImportBitTabBtn'),
  browserImportBitApiUrlInput: document.getElementById('browserImportBitApiUrlInput'),
  browserImportBitApiTokenInput: document.getElementById('browserImportBitApiTokenInput'),
  browserImportSelfBuiltConfigBox: document.getElementById('browserImportSelfBuiltConfigBox'),
  browserImportSelfBuiltPortInput: document.getElementById('browserImportSelfBuiltPortInput'),
  browserImportOpenSelfBuiltBtn: document.getElementById('browserImportOpenSelfBuiltBtn'),
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

// 已移除：今日高频和最近命中功能
// function topDailyRecords(limit = 5) {
//   return [...dailyRecords()]
//     .sort((left, right) => Number(right.hitCount || 1) - Number(left.hitCount || 1))
//     .slice(0, limit);
// }

// function recentDailyRecords(limit = 5) {
//   return [...dailyRecords()]
//     .sort((left, right) => new Date(right.lastCapturedAt || right.updatedAt || right.createdAt) - new Date(left.lastCapturedAt || left.updatedAt || left.createdAt))
//     .slice(0, limit);
// }

function recordsForCurrentPage() {
  if (state.currentPage === 'common') return commonRecords();
  if (isAssetsPage()) return [];
  if (isBrowserCardsPage()) return [];
  if (state.currentPage === 'settings' || state.currentPage === 'about') return [];
  return dailyRecords();
}

function assetsForCurrentPage() {
  let assets = [...state.assets];
  if (state.assetTypeFilter !== '全部') {
    if (state.assetTypeFilter === '图片') {
      assets = assets.filter((item) => item.isImage);
    } else if (state.assetTypeFilter === '文件夹') {
      assets = assets.filter((item) => item.entryType === 'folder');
    } else if (state.assetTypeFilter === '视频') {
      assets = assets.filter((item) => {
        const ext = (item.name || '').toLowerCase();
        return ext.endsWith('.mp4') || ext.endsWith('.avi') || ext.endsWith('.mkv') || 
               ext.endsWith('.mov') || ext.endsWith('.wmv') || ext.endsWith('.flv') || 
               ext.endsWith('.webm') || ext.endsWith('.m4v');
      });
    } else if (state.assetTypeFilter === '压缩包') {
      assets = assets.filter((item) => {
        const ext = (item.name || '').toLowerCase();
        return ext.endsWith('.zip') || ext.endsWith('.rar') || ext.endsWith('.7z') || 
               ext.endsWith('.tar') || ext.endsWith('.gz') || ext.endsWith('.bz2');
      });
    } else if (state.assetTypeFilter === 'Excel') {
      assets = assets.filter((item) => {
        const ext = (item.name || '').toLowerCase();
        return ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.csv');
      });
    } else if (state.assetTypeFilter === 'Word') {
      assets = assets.filter((item) => {
        const ext = (item.name || '').toLowerCase();
        return ext.endsWith('.docx') || ext.endsWith('.doc');
      });
    } else if (state.assetTypeFilter === 'PDF') {
      assets = assets.filter((item) => {
        const ext = (item.name || '').toLowerCase();
        return ext.endsWith('.pdf');
      });
    } else if (state.assetTypeFilter === '其他文件') {
      assets = assets.filter((item) => item.entryType === 'file' && !item.isImage);
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
  renderDailyRecords();
  renderCommonRecords();
  renderAssetList();
  renderBrowserScanResults();
  renderBrowserCardsList();
  renderModal();
  renderAssetModal();
  renderBrowserCardModal();
  renderBrowserInjectModal();
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

function browserInjectTargetId(target) {
  const type = target.type || 'unknown';
  return `${type}:${target.id || target.browser_id || target.profile_name || target.user_data_dir || target.name || ''}`;
}

function browserInjectTargetLabel(target) {
  if ((target.type || '') === 'chrome_profile') {
    return target.display_name || target.profile_name || target.name || '系统 Chrome';
  }
  return target.name || target.display_name || target.id || '未知目标';
}

function onlineImportTargetKey(t) {
  return encodeURIComponent(
    JSON.stringify({
      sourceType: t.sourceType,
      sourceId: t.sourceId,
      port: Number(t.port || 0)
    })
  );
}

function parseOnlineImportTargetKey(key) {
  try {
    return JSON.parse(decodeURIComponent(String(key || '')));
  } catch {
    return null;
  }
}

function pathsLooselyEqualForOnlineImport(a, b) {
  const x = String(a || '').trim().replace(/\\/g, '/').toLowerCase();
  const y = String(b || '').trim().replace(/\\/g, '/').toLowerCase();
  if (!x || !y) {
    return false;
  }
  if (x === y) {
    return true;
  }
  return x.endsWith(y) || y.endsWith(x);
}

function pickOnlineImportSelectionKey(targets, groupRef) {
  if (!Array.isArray(targets) || !targets.length) {
    return '';
  }
  const card = groupRef && groupRef.items && groupRef.items[0];
  if (!card) {
    return onlineImportTargetKey(targets[0]);
  }
  const bs = card.browserSource || card.browser_source || {};
  const ud = String(bs.userDataDir || bs.user_data_dir || '').trim();
  const bid = String(bs.browserId || bs.browser_id || '').trim();
  const matched = targets.find((t) => {
    if ((t.sourceType === 'bitbrowser_api' || t.sourceType === 'bitbrowser') && bid) {
      return String(t.sourceId) === bid;
    }
    if (t.sourceType === 'self_built' && ud) {
      return pathsLooselyEqualForOnlineImport(t.sourceId, ud);
    }
    return false;
  });
  return onlineImportTargetKey(matched || targets[0]);
}

function selectedBrowserInjectTarget() {
  return state.browserInjectTargets.find((item) => browserInjectTargetId(item) === state.browserInjectSelectedTargetId) || null;
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
          : current === 'about'
            ? '关于与反馈'
            : '设置';
  els.dailyPage.classList.toggle('hidden', current !== 'daily');
  els.commonPage.classList.toggle('hidden', current !== 'common');
  els.assetsPage.classList.toggle('hidden', !isAssetsPage());
  els.browserCardsPage.classList.toggle('hidden', !isBrowserCardsPage());
  els.settingsPage.classList.toggle('hidden', current !== 'settings');
  if (els.aboutPage) {
    els.aboutPage.classList.toggle('hidden', current !== 'about');
  }
  if (els.topbarControlDeck) {
    els.topbarControlDeck.classList.toggle('hidden', current === 'settings' || current === 'about' || current === 'browserCards' || current === 'assets');
  }
  els.dailyFilterBar.classList.toggle('hidden', current !== 'daily');
  els.dailyPageBtn.classList.toggle('active', current === 'daily');
  els.commonPageBtn.classList.toggle('active', current === 'common');
  els.assetsPageBtn.classList.toggle('active', current === 'assets');
  els.browserCardsPageBtn.classList.toggle('active', current === 'browserCards');
  els.settingsPageBtn.classList.toggle('active', current === 'settings');
  if (els.aboutPageBtn) {
    els.aboutPageBtn.classList.toggle('active', current === 'about');
  }
  if (els.mobileDailyNavBtn) {
    els.mobileDailyNavBtn.classList.toggle('active', current === 'daily');
    els.mobileCommonNavBtn.classList.toggle('active', current === 'common');
    els.mobileAssetsNavBtn.classList.toggle('active', current === 'assets');
    els.mobileBrowserCardsNavBtn.classList.toggle('active', current === 'browserCards');
    els.mobileSettingsNavBtn.classList.toggle('active', current === 'settings');
    if (els.mobileAboutNavBtn) {
      els.mobileAboutNavBtn.classList.toggle('active', current === 'about');
    }
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
  const filterTypes = [
    { label: '全部', icon: '📦' },
    { label: '文件夹', icon: '📁' },
    { label: '图片', icon: '🖼️' },
    { label: '视频', icon: '🎬' },
    { label: '压缩包', icon: '📦' },
    { label: 'Excel', icon: '📊' },
    { label: 'Word', icon: '📝' },
    { label: 'PDF', icon: '📄' },
    { label: '其他文件', icon: '📄' }
  ];
  
  filterTypes.forEach(({ label, icon }) => {
    const button = document.createElement('button');
    button.className = `filter-chip ${state.assetTypeFilter === label ? 'active' : ''}`;
    button.innerHTML = `<span class="filter-chip-icon">${icon}</span><span>${label}</span>`;
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
  const isBackup = asset.mode === 'backup';
  const thumb = asset.previewUrl
    ? `<div class="assets-card-preview"><img src="${asset.previewUrl}" alt="${escapeHtml(asset.name)}" /></div>`
    : `<div class="assets-card-preview-placeholder">
        <span class="assets-card-preview-icon">${asset.isImage ? '🖼️' : asset.entryType === 'folder' ? '📁' : '📄'}</span>
      </div>`;

  // 备份存储显示 4 个按钮（原始 + 备份），快捷存储显示 2 个按钮
  const buttons = isBackup
    ? `
      <button class="assets-card-btn" data-asset-open="${asset.id}" title="打开原始文件">
        <span>📄</span>
        <span>原始</span>
      </button>
      <button class="assets-card-btn" data-asset-location="${asset.id}" title="打开原始文件所在位置">
        <span>📂</span>
        <span>原始位置</span>
      </button>
      <button class="assets-card-btn" data-asset-open-backup="${asset.id}" title="打开备份文件">
        <span>💾</span>
        <span>备份</span>
      </button>
      <button class="assets-card-btn" data-asset-backup-location="${asset.id}" title="打开备份文件所在位置">
        <span>🗂️</span>
        <span>备份位置</span>
      </button>
    `
    : `
      <button class="assets-card-btn" data-asset-open="${asset.id}" title="打开资源">
        <span>📂</span>
        <span>打开</span>
      </button>
      <button class="assets-card-btn" data-asset-location="${asset.id}" title="打开所在位置">
        <span>📍</span>
        <span>位置</span>
      </button>
    `;

  return `
    <div class="assets-card-header">
      <div class="assets-card-type-badge ${isBackup ? 'backup' : 'link'}">${isBackup ? '备份' : '快捷'}</div>
    </div>
    <div class="assets-card-title">${escapeHtml(asset.name)}</div>
    <div class="assets-card-meta">
      <span class="assets-card-meta-item">${escapeHtml(asset.entryTypeDisplay)}</span>
      ${asset.isImage ? '<span class="assets-card-meta-item">图片</span>' : ''}
    </div>
    ${thumb}
    ${asset.note ? `<div class="assets-card-note">${escapeHtml(asset.note)}</div>` : ''}
    <div class="assets-card-actions-row">
      ${buttons}
    </div>
    <div class="assets-card-footer">
      <span class="assets-card-status">${escapeHtml(asset.statusDisplay)}</span>
      <span class="assets-card-time">${escapeHtml(asset.updatedAtDisplay)}</span>
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
          <button class="card-copy-btn" data-browser-card-refresh="${card.id}" title="更新最新 Cookie">更</button>
          <button class="card-copy-btn" data-browser-card-edit-url="${card.id}" title="编辑地址、备注、账号密码">✎</button>
          <button class="card-copy-btn browser-card-rewrite" data-browser-card-rewrite="${card.id}" title="重写：自建需已开调试窗口，按卡片域名在线提取该站 Cookie 并合并到本卡（同名字段以本次为准），其它域名保留">重</button>
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
        <button class="browser-card-action primary" data-browser-card-open="${card.id}" title="打开目标页（浏览器已运行时仅导航，不覆盖当前登录）">打开</button>
        <button class="browser-card-action secondary" data-browser-card-inject="${card.id}" title="Cookie 转移到其他浏览器">注入</button>
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
        const result = await window.deskLibrary.copyRecordContent(record.id);
        if (result && result.ok === false) {
          alert(result.message || '复制失败');
        }
      });
    }
    container.appendChild(item);
  });
}

// 已移除：今日高频和最近命中功能
// function renderQuickList(container, records, emptyText) {
//   container.innerHTML = '';
//   if (!records.length) {
//     const empty = document.createElement('div');
//     empty.className = 'quick-empty';
//     empty.textContent = emptyText;
//     container.appendChild(empty);
//     return;
//   }
//   records.forEach((record) => {
//     const button = document.createElement('button');
//     button.className = `quick-item ${record.id === state.selectedRecordId ? 'active' : ''}`;
//     button.innerHTML = `
//       <div class="quick-item-title">${escapeHtml(record.displayTitle)}</div>
//       <div class="quick-item-meta">
//         <span>命中 ${escapeHtml(record.hitCount)}</span>
//         <span>${escapeHtml(record.lastCapturedAtDisplay)}</span>
//       </div>
//     `;
//     button.onclick = () => {
//       state.selectedRecordId = record.id;
//       openModal();
//     };
//     container.appendChild(button);
//   });
// }

// 已移除：今日高频和最近命中功能
// function renderQuickSections() {
//   renderQuickList(els.topDailyList, topDailyRecords(), '今天还没有高频内容');
//   renderQuickList(els.recentDailyList, recentDailyRecords(), '今天还没有最近命中内容');
// }

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
  els.assetsCount.textContent = `${assets.length}`;
  els.assetsList.innerHTML = '';

  if (!assets.length) {
    const empty = document.createElement('div');
    empty.className = 'assets-empty-state';
    empty.innerHTML = `
      <div class="assets-empty-icon">📦</div>
      <div class="assets-empty-text">还没有资源</div>
      <div class="assets-empty-hint">拖入文件或文件夹开始收集</div>
    `;
    els.assetsList.appendChild(empty);
    return;
  }

  assets.forEach((asset) => {
    const item = document.createElement('article');
    item.className = `assets-card ${asset.id === state.selectedAssetId ? 'active' : ''}`;
    item.tabIndex = 0;
    item.innerHTML = buildAssetCard(asset);
    
    // 点击卡片打开详情
    item.onclick = (e) => {
      // 如果点击的是按钮，不触发卡片点击
      if (e.target.closest('.assets-card-btn')) return;
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

    // 打开资源
    const openButton = item.querySelector('[data-asset-open]');
    openButton?.addEventListener('click', async (event) => {
      event.stopPropagation();
      const result = await window.deskLibrary.openAssetPrimary(asset.id);
      if (result && result.ok === false) {
        alert(result.message || '打开失败');
      }
    });

    // 打开所在位置
    const locationButton = item.querySelector('[data-asset-location]');
    locationButton?.addEventListener('click', async (event) => {
      event.stopPropagation();
      const result = await window.deskLibrary.openAssetLocation(asset.id);
      if (result && result.ok === false) {
        alert(result.message || '打开失败');
      }
    });

    // 打开备份资源（仅备份模式）
    const openBackupButton = item.querySelector('[data-asset-open-backup]');
    openBackupButton?.addEventListener('click', async (event) => {
      event.stopPropagation();
      const result = await window.deskLibrary.openAssetStored(asset.id);
      if (result && result.ok === false) {
        alert(result.message || '打开备份失败');
      }
    });

    // 打开备份所在位置（仅备份模式）
    const backupLocationButton = item.querySelector('[data-asset-backup-location]');
    backupLocationButton?.addEventListener('click', async (event) => {
      event.stopPropagation();
      const result = await window.deskLibrary.openAssetStoredLocation(asset.id);
      if (result && result.ok === false) {
        alert(result.message || '打开备份位置失败');
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
          <button class="text-action" data-browser-group-online-import="${escapeHtml(group.key)}" type="button">在线导入</button>
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
    section.querySelector('[data-browser-group-online-import]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      const key = event.currentTarget.getAttribute('data-browser-group-online-import') || '';
      openBrowserOnlineImportModalForGroup(key);
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
        const result = await window.deskLibrary.openBrowserCard(card.id);
        if (result && result.ok === false) {
          alert(result.message || '打开失败');
        }
      });
      item.querySelector('[data-browser-card-test]')?.addEventListener('click', async (event) => {
        event.stopPropagation();
        const result = await window.deskLibrary.checkBrowserCardConnectivity([card.id]);
        if (result && result.ok === false) {
          alert(result.message || '测试失败');
          return;
        }
        applySnapshot(await window.deskLibrary.getInitialData());
      });
      item.querySelector('[data-browser-card-refresh]')?.addEventListener('click', async (event) => {
        event.stopPropagation();
        const result = await window.deskLibrary.refreshBrowserCardCookies(card.id);
        if (result && result.ok === false) {
          alert(result.message || '更新 Cookie 失败');
          return;
        }
        applySnapshot(await window.deskLibrary.getInitialData());
      });
      item.querySelector('[data-browser-card-rewrite]')?.addEventListener('click', async (event) => {
        event.stopPropagation();
        const result = await window.deskLibrary.rewriteBrowserCardCookies(card.id);
        if (result && result.rewriteDebug) {
          // 主进程也会 console.log；此处便于在渲染进程 DevTools 里对照卡片目录与 CDP
          // eslint-disable-next-line no-console
          console.log('[DeskLibrary][重] CDP/卡片对照（自建）', result.rewriteDebug);
        }
        if (result && result.ok === false) {
          alert(result.message || '重写 Cookie 失败');
          return;
        }
        applySnapshot(await window.deskLibrary.getInitialData());
      });
      item.querySelector('[data-browser-card-inject]')?.addEventListener('click', async (event) => {
        event.stopPropagation();
        state.selectedBrowserCardId = card.id;
        openBrowserInjectModal(card.id);
        await loadBrowserInjectTargets();
      });
      item.querySelector('[data-browser-card-edit-url]')?.addEventListener('click', (event) => {
        event.stopPropagation();
        state.selectedBrowserCardId = card.id;
        openBrowserCardModal('openUrl');
      });
      item.querySelector('[data-browser-card-source]')?.addEventListener('click', async (event) => {
        event.stopPropagation();
        const result = await window.deskLibrary.openBrowserCardSource(card.id);
        if (result && result.ok === false) {
          alert(result.message || '打开失败');
        }
      });
      item.querySelector('[data-browser-card-delete-inline]')?.addEventListener('click', async (event) => {
        event.stopPropagation();
        if (!window.confirm('确认删除这张浏览器卡片吗？')) return;
        const result = await window.deskLibrary.deleteBrowserCard(card.id);
        if (result && result.ok === false) {
          alert(result.message || '删除失败');
          return;
        }
        applySnapshot(await window.deskLibrary.getInitialData());
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

function renderBrowserInjectModal() {
  if (!els.browserInjectModal) return;
  const targets = state.browserInjectTargets || [];
  const selectedTarget = selectedBrowserInjectTarget();
  els.browserInjectStatus.textContent = state.browserInjectStatus || '请选择目标浏览器';
  els.browserInjectTargetCount.textContent = String(targets.length);
  els.browserInjectTargetsList.innerHTML = '';

  if (!targets.length) {
    const empty = document.createElement('div');
    empty.className = 'quick-empty';
    empty.textContent = '还没有可用目标。系统 Chrome Profile 会始终显示；自建浏览器和比特浏览器需要先处于运行状态。';
    els.browserInjectTargetsList.appendChild(empty);
  } else {
    targets.forEach((target) => {
      const targetId = browserInjectTargetId(target);
      const row = document.createElement('label');
      row.className = 'browser-inject-target-row';
      row.innerHTML = `
        <input type="radio" name="browserInjectTarget" value="${escapeHtml(targetId)}"${targetId === state.browserInjectSelectedTargetId ? ' checked' : ''} />
        <div class="browser-inject-target-main">
          <strong>${escapeHtml(browserInjectTargetLabel(target))}</strong>
          <span>${escapeHtml(sourceTypeDisplay(target.type || ''))}${target.port ? ` · 端口 ${escapeHtml(target.port)}` : ''}${target.is_open ? ' · 运行中' : ''}</span>
        </div>
      `;
      row.querySelector('input')?.addEventListener('change', () => {
        state.browserInjectSelectedTargetId = targetId;
        renderBrowserInjectModal();
      });
      els.browserInjectTargetsList.appendChild(row);
    });
  }

  const forceDbWrite = selectedTarget && selectedTarget.type === 'chrome_profile';
  els.browserInjectMethodInject.checked = !forceDbWrite && state.browserInjectMethod !== 'db_write';
  els.browserInjectMethodDbWrite.checked = forceDbWrite || state.browserInjectMethod === 'db_write';
  els.browserInjectMethodInject.disabled = !!forceDbWrite;
  if (forceDbWrite) {
    state.browserInjectMethod = 'db_write';
  }
  els.browserInjectHint.textContent = forceDbWrite
    ? '系统 Chrome Profile 目标固定走数据库写入，请先关闭对应目标 Profile 窗口。'
    : '自建浏览器 / 比特浏览器运行中时建议使用 CDP 注入；数据库写入通常需要目标浏览器关闭。';
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
  els.browserImportSelfBuiltConfigBox?.classList.toggle('hidden', state.browserImportTab !== 'self_built');
  els.browserImportBitConfigBox?.classList.toggle('hidden', state.browserImportTab !== 'bitbrowser_api');
  els.browserImportSaveBitConfigBtn?.classList.toggle('hidden', state.browserImportTab !== 'bitbrowser_api');
  els.browserImportOpenSelfBuiltBtn?.classList.toggle('hidden', state.browserImportTab !== 'self_built');
  if (els.browserImportBitApiUrlInput) {
    els.browserImportBitApiUrlInput.value = state.settings.bitApiUrl || 'http://127.0.0.1:54345';
  }
  if (els.browserImportBitApiTokenInput) {
    els.browserImportBitApiTokenInput.value = state.settings.bitApiToken || '';
  }
  if (els.browserImportSelfBuiltPortInput && !els.browserImportSelfBuiltPortInput.value) {
    els.browserImportSelfBuiltPortInput.value = '9222';
  }
  els.browserImportStatus.textContent = state.browserScanSummary || '请选择来源并加载 Cookie';

  const sources = currentBrowserImportSources();
  if (els.browserImportSourceCount) {
    els.browserImportSourceCount.textContent = `${sources.length}`;
  }
  state.browserImportSourceIds = state.browserImportSourceIds.filter((id) => sources.some((item) => item.id === id));

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

const SETTINGS_HELP = {
  autoJudgment: {
    title: '复制后智能判断（文本）',
    subline: '根据内容特征自动分类',
    body: `智能判断会在复制文本后自动分析内容特征，决定是否收藏以及如何处理。

判断规则：
1. 长度过短（少于 2 个字符）→ 不收藏
2. 纯空白字符 → 不收藏
3. 单个字符或符号 → 不收藏
4. 常见系统路径（如 C:\\Windows）→ 不收藏
5. 重复内容（与上次相同）→ 不收藏
6. 包含换行、链接、较长正文或工作关键词 → 自动收藏

建议：
• 默认关闭，避免收藏过多无用内容
• 如需精确控制，使用全局快捷键或双击复制
• 开启后会自动过滤大部分无意义内容
• 图片等非文本内容不受此规则影响`
  },
  doubleCopy: {
    title: '观察窗口内连按两次复制',
    subline: '依赖系统复制快捷键（如 Ctrl+C）',
    body: '在检测到复制操作后会进入观察窗口。开启本项后，在窗口内连续两次触发复制（剪贴板变化两次），会将内容按规则合并为一次收藏，适合分段复制同一主题。'
  },
  copyThenKey: {
    title: '复制后再按修饰键收藏',
    subline: '中间输入框填 Shift / Ctrl / Alt 之一',
    body: '复制后进入观察窗口时，可在窗口未结束前按下所填修饰键之一，立即保存当前剪贴板。若在观察窗口内按下 Alt（无论此处填何键），可将当前内容加入「常用」分类。此项由全局按键监听实现，不是 Electron 全局热键。'
  },
  deleteLastCapture: {
    title: '删除上次收藏',
    subline: 'Electron 全局快捷键',
    body: '删除当前排序下最新的一条收藏记录。中间为可编辑快捷键（如 Ctrl+Alt+Z），右侧开关关闭后不再注册全局热键，仍可从悬浮球菜单操作。保存后生效。'
  },
  startAccumulation: {
    title: '开始累计',
    subline: 'Electron 全局快捷键',
    body: '进入累计复制模式后，之后每次复制会追加到同一张卡片，直到「结束累计」或「取消累计」。中间为快捷键，右侧开关可关闭全局注册。也可从悬浮球菜单开始。'
  },
  finishAccumulation: {
    title: '结束累计',
    subline: 'Electron 全局快捷键',
    body: '结束累计复制会话，将已合并的正文保留为一条完整收藏。也可从悬浮球菜单结束。'
  },
  undoAccumulation: {
    title: '撤销上一段',
    subline: '仅在累计会话中',
    body: '在累计复制过程中，移除最后追加的一段文本。中间留空则不会注册全局热键，请用悬浮球菜单；填写快捷键并打开右侧开关后可全局触发。'
  }
};

function normalizeWindowsPathDisplay(value) {
  if (value == null || value === '') return '';
  const s = String(value);
  if (/^\\\\[^\\]/.test(s)) return s;
  return s.replace(/\\{2,}/g, '\\');
}

function openSettingsHelpModal(key) {
  const entry = SETTINGS_HELP[key];
  if (!entry || !els.settingsHelpModal) return;
  els.settingsHelpTitle.textContent = entry.title;
  if (els.settingsHelpSubline) {
    els.settingsHelpSubline.textContent = entry.subline || '';
  }
  els.settingsHelpBody.textContent = entry.body;
  els.settingsHelpModal.classList.remove('hidden');
}

function closeSettingsHelpModal() {
  els.settingsHelpModal?.classList.add('hidden');
}

function renderSettings() {
  const s = state.settings || {};
  els.autoJudgmentEnabled.checked = !!s.autoJudgmentEnabled;
  els.doubleCopyEnabled.checked = !!s.doubleCopyEnabled;
  els.copyThenKeyEnabled.checked = !!s.copyThenKeyEnabled;
  els.startupLaunchEnabled.checked = !!s.startupLaunchEnabled;
  els.floatingIconEnabled.checked = !!s.floatingIconEnabled;
  els.dockToEdgeEnabled.checked = s.dockToEdgeEnabled !== false;
  els.postCopyKey.value = s.postCopyKey || 'Shift';
  if (els.deleteLastCaptureShortcutInput) {
    els.deleteLastCaptureShortcutInput.value = s.deleteLastCaptureShortcut != null
      ? s.deleteLastCaptureShortcut
      : 'Ctrl+Alt+Z';
  }
  if (els.accumulationStartShortcutInput) {
    els.accumulationStartShortcutInput.value = s.accumulationStartShortcut != null
      ? s.accumulationStartShortcut
      : 'Ctrl+Alt+A';
  }
  if (els.accumulationFinishShortcutInput) {
    els.accumulationFinishShortcutInput.value = s.accumulationFinishShortcut != null
      ? s.accumulationFinishShortcut
      : 'Ctrl+Alt+S';
  }
  if (els.accumulationUndoShortcutInput) {
    els.accumulationUndoShortcutInput.value = s.accumulationUndoShortcut || '';
  }
  if (els.hotkeyDeleteLastEnabled) {
    els.hotkeyDeleteLastEnabled.checked = s.hotkeyDeleteLastEnabled !== false;
  }
  if (els.hotkeyStartAccumEnabled) {
    els.hotkeyStartAccumEnabled.checked = s.hotkeyStartAccumEnabled !== false;
  }
  if (els.hotkeyFinishAccumEnabled) {
    els.hotkeyFinishAccumEnabled.checked = s.hotkeyFinishAccumEnabled !== false;
  }
  if (els.hotkeyUndoAccumEnabled) {
    els.hotkeyUndoAccumEnabled.checked = !!s.hotkeyUndoAccumEnabled;
  }
  if (els.selfBuiltWorkspaceDirInput) {
    const raw = s.selfBuiltWorkspaceDir
      || s.selfBuiltUserDataRoot
      || s.browserScanRoot
      || '';
    els.selfBuiltWorkspaceDirInput.value = normalizeWindowsPathDisplay(raw);
  }
  if (els.assetBackupPathInput) {
    els.assetBackupPathInput.value = normalizeWindowsPathDisplay(s.assetBackupPath || '');
  }
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

function openBrowserInjectModal(cardId) {
  state.browserInjectCardId = cardId || state.selectedBrowserCardId;
  state.browserInjectModalOpen = true;
  state.browserInjectStatus = '请选择目标浏览器';
  renderBrowserInjectModal();
  els.browserInjectModal.classList.remove('hidden');
}

function closeBrowserInjectModal() {
  state.browserInjectModalOpen = false;
  state.browserInjectCardId = null;
  els.browserInjectModal.classList.add('hidden');
}

function renderBrowserOnlineImportModal() {
  if (!els.browserOnlineImportModal) {
    return;
  }
  const targets = state.browserOnlineImportTargets || [];
  if (els.browserOnlineImportStatus) {
    els.browserOnlineImportStatus.textContent = state.browserOnlineImportStatus || '请选择目标并填写账号名称';
  }
  const sel = els.browserOnlineImportTargetSelect;
  if (sel) {
    const prev = state.browserOnlineImportSelectedKey;
    sel.innerHTML = targets.length
      ? targets
        .map((t) => {
          const k = onlineImportTargetKey(t);
          return `<option value="${escapeHtml(k)}">${escapeHtml(t.label || t.sourceId || '')}</option>`;
        })
        .join('')
      : '<option value="">（暂无可用目标）</option>';
    const keys = new Set(targets.map((t) => onlineImportTargetKey(t)));
    if (prev && keys.has(prev)) {
      sel.value = prev;
    } else if (state.browserOnlineImportSelectedKey && keys.has(state.browserOnlineImportSelectedKey)) {
      sel.value = state.browserOnlineImportSelectedKey;
    } else if (targets[0]) {
      const initial = pickOnlineImportSelectionKey(targets, state.browserOnlineImportGroupRef);
      sel.value = initial;
      state.browserOnlineImportSelectedKey = initial;
    } else {
      state.browserOnlineImportSelectedKey = '';
    }
  }
}

async function loadBrowserOnlineImportTargets() {
  state.browserOnlineImportStatus = '正在刷新在线导入目标…';
  renderBrowserOnlineImportModal();
  const result = await window.deskLibrary.listOnlineImportTargets();
  if (!result || result.ok === false) {
    state.browserOnlineImportTargets = [];
    state.browserOnlineImportStatus = (result && result.message) || '获取在线导入目标失败';
    renderBrowserOnlineImportModal();
    return;
  }
  state.browserOnlineImportTargets = Array.isArray(result.results) ? result.results : [];
  const keys = new Set(state.browserOnlineImportTargets.map((t) => onlineImportTargetKey(t)));
  const preferred = pickOnlineImportSelectionKey(state.browserOnlineImportTargets, state.browserOnlineImportGroupRef);
  state.browserOnlineImportSelectedKey = preferred && keys.has(preferred)
    ? preferred
    : (state.browserOnlineImportTargets[0] ? onlineImportTargetKey(state.browserOnlineImportTargets[0]) : '');
  state.browserOnlineImportStatus = state.browserOnlineImportTargets.length
    ? `已发现 ${state.browserOnlineImportTargets.length} 个在线目标，请选择后填写账号名称`
    : '未发现带调试端口的 Chrome 或未打开的比特浏览器，请先启动并开启远程调试后点「刷新」。';
  renderBrowserOnlineImportModal();
}

function openBrowserOnlineImportModalForGroup(groupKey) {
  const group = groupBrowserCardsBySource(browserCardsForCurrentPage()).find((g) => g.key === groupKey) || null;
  state.browserOnlineImportGroupRef = group;
  state.browserOnlineImportModalOpen = true;
  state.browserOnlineImportTargets = [];
  state.browserOnlineImportSelectedKey = '';
  state.browserOnlineImportStatus = '正在检测在线目标…';
  if (els.browserOnlineImportAccountInput) {
    els.browserOnlineImportAccountInput.value = '';
  }
  renderBrowserOnlineImportModal();
  els.browserOnlineImportModal?.classList.remove('hidden');
  void loadBrowserOnlineImportTargets();
}

function closeBrowserOnlineImportModal() {
  state.browserOnlineImportModalOpen = false;
  state.browserOnlineImportGroupRef = null;
  els.browserOnlineImportModal?.classList.add('hidden');
}

async function submitBrowserOnlineImport() {
  const key = els.browserOnlineImportTargetSelect?.value || state.browserOnlineImportSelectedKey || '';
  const target = parseOnlineImportTargetKey(key);
  const accountName = (els.browserOnlineImportAccountInput?.value || '').trim();
  if (!target) {
    alert('请选择目标浏览器');
    return;
  }
  const st = String(target.sourceType || '');
  if (st === 'self_built') {
    if (!Number(target.port || 0) && !String(target.sourceId || '').trim()) {
      alert('请选择目标浏览器');
      return;
    }
  } else if (st === 'bitbrowser_api' || st === 'bitbrowser') {
    if (!String(target.sourceId || '').trim()) {
      alert('请选择目标浏览器');
      return;
    }
  } else {
    alert('请选择目标浏览器');
    return;
  }
  if (!accountName) {
    alert('请填写账号名称');
    return;
  }
  let inheritBrowserSource = null;
  const groupCard = state.browserOnlineImportGroupRef?.items?.[0];
  if (groupCard) {
    const raw = groupCard.browserSource || groupCard.browser_source;
    if (raw && typeof raw === 'object') {
      try {
        inheritBrowserSource = JSON.parse(JSON.stringify(raw));
      } catch {
        inheritBrowserSource = { ...raw };
      }
    }
  }
  state.browserOnlineImportStatus = '正在提取 Cookie 并导入…';
  renderBrowserOnlineImportModal();
  const result = await window.deskLibrary.runOnlineImport({
    target,
    accountName,
    inheritBrowserSource
  });
  if (!result || result.ok === false) {
    state.browserOnlineImportStatus = (result && result.message) || '在线导入失败';
    renderBrowserOnlineImportModal();
    alert(state.browserOnlineImportStatus);
    return;
  }
  closeBrowserOnlineImportModal();
  applySnapshot(await window.deskLibrary.getInitialData());
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
  state.browserScanRoot = state.settings.selfBuiltWorkspaceDir
    || state.settings.selfBuiltUserDataRoot
    || state.settings.browserScanRoot
    || state.browserScanRoot
    || '';
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
  const selfBuiltWorkspaceDir = normalizeWindowsPathDisplay((els.selfBuiltWorkspaceDirInput?.value || '').trim());
  const assetBackupPath = normalizeWindowsPathDisplay((els.assetBackupPathInput?.value || '').trim());
  return {
    autoJudgmentEnabled: els.autoJudgmentEnabled.checked,
    doubleCopyEnabled: els.doubleCopyEnabled.checked,
    copyThenKeyEnabled: els.copyThenKeyEnabled.checked,
    startupLaunchEnabled: els.startupLaunchEnabled.checked,
    floatingIconEnabled: els.floatingIconEnabled.checked,
    dockToEdgeEnabled: els.dockToEdgeEnabled.checked,
    postCopyKey: els.postCopyKey.value.trim() || 'Shift',
    deleteLastCaptureShortcut: (els.deleteLastCaptureShortcutInput?.value || '').trim(),
    accumulationStartShortcut: (els.accumulationStartShortcutInput?.value || '').trim(),
    accumulationFinishShortcut: (els.accumulationFinishShortcutInput?.value || '').trim(),
    accumulationUndoShortcut: (els.accumulationUndoShortcutInput?.value || '').trim(),
    hotkeyDeleteLastEnabled: !!els.hotkeyDeleteLastEnabled?.checked,
    hotkeyStartAccumEnabled: !!els.hotkeyStartAccumEnabled?.checked,
    hotkeyFinishAccumEnabled: !!els.hotkeyFinishAccumEnabled?.checked,
    hotkeyUndoAccumEnabled: !!els.hotkeyUndoAccumEnabled?.checked,
    selfBuiltWorkspaceDir,
    browserScanRoot: selfBuiltWorkspaceDir,
    selfBuiltUserDataRoot: selfBuiltWorkspaceDir,
    selfBuiltChromePath: selfBuiltWorkspaceDir ? `${selfBuiltWorkspaceDir}\\chrome.exe` : '',
    selfBuiltChromedriverPath: selfBuiltWorkspaceDir ? `${selfBuiltWorkspaceDir}\\chromedriver.exe` : '',
    assetBackupPath
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
  const result = await window.deskLibrary.importAssets({
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
  const selfBuiltRoot = state.settings.selfBuiltWorkspaceDir
    || state.settings.selfBuiltUserDataRoot
    || state.settings.browserScanRoot
    || '';
  const result = await window.deskLibrary.scanBrowserCards({
    scope,
    selfBuiltWorkspaceDir: selfBuiltRoot,
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
  const selfBuiltWorkspaceDir = state.settings.selfBuiltWorkspaceDir || state.settings.selfBuiltUserDataRoot || state.settings.browserScanRoot || '';
  state.browserScanSummary = '正在加载来源列表...';
  renderBrowserImportModal();
  const result = state.browserImportTab === 'self_built'
    ? await window.deskLibrary.getSelfBuiltImportSources({
        selfBuiltWorkspaceDir,
        selfBuiltRoot: selfBuiltWorkspaceDir
      })
    : await window.deskLibrary.getBrowserImportSources({
        bitApiUrl,
        bitApiToken,
        selfBuiltWorkspaceDir,
        selfBuiltRoot: selfBuiltWorkspaceDir
      });
  if (!result || result.ok === false) {
    alert((result && result.message) || '获取来源失败');
    return;
  }
  if (state.browserImportTab === 'self_built') {
    state.browserImportSources = {
      ...(state.browserImportSources || {}),
      self_built: Array.isArray(result.results) ? result.results : []
    };
  } else {
    state.browserImportSources = result.results || {
      chrome_profiles: [],
      self_built: [],
      bitbrowser: []
    };
  }
  if (result.selfBuiltRoot) {
    state.browserScanRoot = result.selfBuiltRoot;
  }
  state.browserImportSourceError = state.browserImportTab === 'self_built'
    ? ''
    : ((result.results && result.results.bitbrowser_error) || '');
  state.browserImportSourceSelection = {};
  state.browserImportSourceIds = [];
  resetBrowserImportSelection();
  state.browserScanSummary = state.browserImportTab === 'self_built' && state.browserScanRoot
    ? `来源扫描完成，当前自建目录：${state.browserScanRoot}，共 ${Array.isArray(state.browserImportSources.self_built) ? state.browserImportSources.self_built.length : 0} 个来源`
    : '来源扫描完成，请勾选来源后再加载 Cookie。';
  renderBrowserImportModal();
}

async function openSelfBuiltBrowserFromModal() {
  const port = (els.browserImportSelfBuiltPortInput?.value || '').trim();
  if (!port) {
    alert('请先输入自定义端口');
    return;
  }
  state.browserScanSummary = `正在打开自建浏览器，端口 ${port}...`;
  renderBrowserImportModal();
  const result = await window.deskLibrary.openSelfBuiltBrowser({
    port,
    selfBuiltWorkspaceDir: state.settings.selfBuiltWorkspaceDir || state.settings.selfBuiltUserDataRoot || state.settings.browserScanRoot || '',
    selfBuiltRoot: state.settings.selfBuiltWorkspaceDir || state.settings.selfBuiltUserDataRoot || state.settings.browserScanRoot || '',
    selfBuiltChromePath: state.settings.selfBuiltChromePath || '',
    selfBuiltChromedriverPath: state.settings.selfBuiltChromedriverPath || ''
  });
  if (!result || result.ok === false) {
    state.browserScanSummary = (result && result.message) || '打开自建浏览器失败';
    renderBrowserImportModal();
    alert(state.browserScanSummary);
    return;
  }
  state.browserScanSummary = result.message || `已打开自建浏览器，端口 ${port}`;
  await loadBrowserImportSources();
  const nextId = String(result.userDataDir || '').trim();
  if (nextId) {
    state.browserImportSourceSelection[nextId] = true;
    state.browserImportSourceIds = [nextId];
  }
  resetBrowserImportSelection();
  state.browserScanSummary = result.message || `已打开自建浏览器，端口 ${port}`;
  renderBrowserImportModal();
}

async function saveBrowserImportBitConfig() {
  const nextSettings = {
    ...state.settings,
    pythonCookieProjectPath: state.settings.pythonCookieProjectPath || '',
    bitApiUrl: (els.browserImportBitApiUrlInput?.value || '').trim() || 'http://127.0.0.1:54345',
    bitApiToken: (els.browserImportBitApiTokenInput?.value || '').trim()
  };
  const result = await window.deskLibrary.saveSettings(nextSettings);
  if (result && result.ok === false) {
    alert(result.message || '保存失败');
    return;
  }
  state.settings = nextSettings;
  state.browserScanSummary = '比特浏览器配置已保存';
  renderBrowserImportModal();
}

async function loadBrowserInjectTargets() {
  state.browserInjectStatus = '正在刷新目标浏览器...';
  renderBrowserInjectModal();
  const result = await window.deskLibrary.getBrowserInjectTargets();
  if (!result || result.ok === false) {
    state.browserInjectTargets = [];
    state.browserInjectStatus = (result && result.message) || '获取目标浏览器失败';
    renderBrowserInjectModal();
    return;
  }
  state.browserInjectTargets = Array.isArray(result.results) ? result.results : [];
  const ids = new Set(state.browserInjectTargets.map((item) => browserInjectTargetId(item)));
  if (!ids.has(state.browserInjectSelectedTargetId)) {
    state.browserInjectSelectedTargetId = state.browserInjectTargets[0] ? browserInjectTargetId(state.browserInjectTargets[0]) : '';
  }
  state.browserInjectStatus = state.browserInjectTargets.length
    ? `已找到 ${state.browserInjectTargets.length} 个可用目标`
    : '未找到可用目标浏览器';
  renderBrowserInjectModal();
}

async function executeBrowserCardInject() {
  const cardId = state.browserInjectCardId || state.selectedBrowserCardId;
  const target = selectedBrowserInjectTarget();
  if (!cardId) {
    alert('未选择浏览器卡片');
    return;
  }
  if (!target) {
    alert('请先选择目标浏览器');
    return;
  }
  const method = target.type === 'chrome_profile'
    ? 'db_write'
    : (els.browserInjectMethodDbWrite?.checked ? 'db_write' : 'inject');
  state.browserInjectMethod = method;
  state.browserInjectStatus = '正在转移 Cookie...';
  renderBrowserInjectModal();
  const result = await window.deskLibrary.executeBrowserCardInject({
    id: cardId,
    method,
    target
  });
  if (!result || result.ok === false) {
    state.browserInjectStatus = (result && result.message) || 'Cookie 转移失败';
    renderBrowserInjectModal();
    alert(state.browserInjectStatus);
    return;
  }
  closeBrowserInjectModal();
  applySnapshot(await window.deskLibrary.getInitialData());
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
  const result = await window.deskLibrary.deleteBrowserCards(ids);
  if (result && result.ok === false) {
    alert(result.message || '批量删除失败');
    return;
  }
  state.browserCardSelection = {};
  applySnapshot(await window.deskLibrary.getInitialData());
}

async function batchTestBrowserCards() {
  const ids = selectedBrowserCardIds();
  if (!ids.length) {
    alert('请先选择卡片');
    return;
  }
  state.statusText = `正在测试 ${ids.length} 张浏览器卡片...`;
  render();
  const result = await window.deskLibrary.checkBrowserCardConnectivity(ids);
  if (result && result.ok === false) {
    alert(result.message || '批量测试失败');
    return;
  }
  applySnapshot(await window.deskLibrary.getInitialData());
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

  for (let index = 0; index < selectedSources.length; index += 1) {
    const source = selectedSources[index];
    state.browserScanSummary = `正在读取 Cookie... (${index + 1}/${selectedSources.length}) ${source.label}`;
    renderBrowserImportModal();
    const result = await window.deskLibrary.loadBrowserImportGroups({
      bitApiUrl,
      bitApiToken,
      selfBuiltWorkspaceDir: state.settings.selfBuiltWorkspaceDir || state.settings.selfBuiltUserDataRoot || state.settings.browserScanRoot || '',
      selfBuiltRoot: state.settings.selfBuiltWorkspaceDir || state.settings.selfBuiltUserDataRoot || state.settings.browserScanRoot || '',
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
    const built = await window.deskLibrary.buildBrowserImportCards({
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

  const result = await window.deskLibrary.importBrowserCards({
    cards
  });
  if (result && result.ok === false) {
    alert(result.message || '导入失败');
    return;
  }

  state.browserScanSummary = `已导入 ${selectedGroups.length} 张卡片`;
  resetBrowserImportSelection();
  closeBrowserImportModal();
  applySnapshot(await window.deskLibrary.getInitialData());
}

els.dailyPageBtn.addEventListener('click', () => switchPage('daily'));
els.commonPageBtn.addEventListener('click', () => switchPage('common'));
els.assetsPageBtn.addEventListener('click', () => switchPage('assets'));
els.browserCardsPageBtn?.addEventListener('click', () => switchPage('browserCards'));
els.settingsPageBtn.addEventListener('click', () => switchPage('settings'));
els.aboutPageBtn?.addEventListener('click', () => switchPage('about'));
els.mobileDailyNavBtn?.addEventListener('click', () => switchPage('daily'));
els.mobileCommonNavBtn?.addEventListener('click', () => switchPage('common'));
els.mobileAssetsNavBtn?.addEventListener('click', () => switchPage('assets'));
els.mobileBrowserCardsNavBtn?.addEventListener('click', () => switchPage('browserCards'));
els.mobileSettingsNavBtn?.addEventListener('click', () => switchPage('settings'));
els.mobileAboutNavBtn?.addEventListener('click', () => switchPage('about'));
els.windowMinBtn.addEventListener('click', () => window.deskLibrary.minimizeWindow());
els.windowMaxBtn.addEventListener('click', async () => {
  const result = await window.deskLibrary.toggleMaximizeWindow();
  els.windowMaxBtn.textContent = result && result.maximized ? '❐' : '□';
});
els.windowCloseBtn.addEventListener('click', () => window.deskLibrary.closeWindow());

els.refreshBtn.addEventListener('click', async () => {
  applySnapshot(await window.deskLibrary.getInitialData());
});
els.mobileRefreshBtn?.addEventListener('click', async () => {
  applySnapshot(await window.deskLibrary.getInitialData());
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
els.browserInjectModalOverlay?.addEventListener('click', closeBrowserInjectModal);
els.closeBrowserInjectModalBtn?.addEventListener('click', closeBrowserInjectModal);
els.browserOnlineImportModalOverlay?.addEventListener('click', closeBrowserOnlineImportModal);
els.closeBrowserOnlineImportModalBtn?.addEventListener('click', closeBrowserOnlineImportModal);
els.browserImportModalOverlay?.addEventListener('click', closeBrowserImportModal);
els.closeBrowserImportModalBtn?.addEventListener('click', closeBrowserImportModal);

els.browserInjectRefreshBtn?.addEventListener('click', async () => {
  await loadBrowserInjectTargets();
});

els.browserInjectMethodInject?.addEventListener('change', () => {
  if (els.browserInjectMethodInject.checked) {
    state.browserInjectMethod = 'inject';
    renderBrowserInjectModal();
  }
});

els.browserInjectMethodDbWrite?.addEventListener('change', () => {
  if (els.browserInjectMethodDbWrite.checked) {
    state.browserInjectMethod = 'db_write';
    renderBrowserInjectModal();
  }
});

els.browserInjectConfirmBtn?.addEventListener('click', async () => {
  await executeBrowserCardInject();
});

els.browserOnlineImportRefreshBtn?.addEventListener('click', async () => {
  await loadBrowserOnlineImportTargets();
});

els.browserOnlineImportTargetSelect?.addEventListener('change', (event) => {
  state.browserOnlineImportSelectedKey = String(event.target.value || '');
});

els.browserOnlineImportSubmitBtn?.addEventListener('click', async () => {
  await submitBrowserOnlineImport();
});

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

els.browserImportOpenSelfBuiltBtn?.addEventListener('click', async () => {
  await openSelfBuiltBrowserFromModal();
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
  const result = await window.deskLibrary.createManualTextRecord(els.newRecordDraft.value);
  if (result.ok) {
    els.newRecordDraft.value = '';
  } else if (result.message) {
    alert(result.message);
  }
});

els.saveContentBtn.addEventListener('click', async () => {
  const record = selectedRecord();
  if (!record || record.contentType !== 'text') return;
  await window.deskLibrary.updateRecordContent({ id: record.id, textContent: els.detailTextContent.value });
});

els.moveToCommonBtn.addEventListener('click', async () => {
  const record = selectedRecord();
  if (!record) return;
  await window.deskLibrary.moveRecordToCommon(record.id);
  state.currentPage = 'common';
  render();
  closeModal();
});

els.moveToDailyBtn.addEventListener('click', async () => {
  const record = selectedRecord();
  if (!record) return;
  await window.deskLibrary.moveRecordToDaily(record.id);
  state.currentPage = 'daily';
  render();
  closeModal();
});

els.saveNoteBtn.addEventListener('click', async () => {
  const record = selectedRecord();
  if (!record) return;
  await window.deskLibrary.updateRecordNote({ id: record.id, editableNote: els.detailNote.value });
});

els.deleteRecordBtn.addEventListener('click', async () => {
  const record = selectedRecord();
  if (!record) return;
  const confirmed = window.confirm('确认删除这条记录吗？删除后无法恢复。');
  if (!confirmed) return;
  await window.deskLibrary.deleteRecord(record.id);
  state.selectedRecordId = null;
  closeModal();
});

els.saveSettingsBtn.addEventListener('click', async () => {
  const nextSettings = collectSettings();
  const result = await window.deskLibrary.saveSettings(nextSettings);
  if (result && result.ok === false) {
    alert(result.message || '保存设置失败');
    return;
  }
  state.settings = {
    ...state.settings,
    ...nextSettings
  };
  state.browserScanRoot = nextSettings.selfBuiltWorkspaceDir || state.browserScanRoot;
  renderSettings();
});

els.selectSelfBuiltWorkspaceDirBtn?.addEventListener('click', async () => {
  const result = await window.deskLibrary.selectFolder();
  if (result && !result.canceled && result.path) {
    els.selfBuiltWorkspaceDirInput.value = result.path;
  }
});

els.selectAssetBackupPathBtn?.addEventListener('click', async () => {
  const result = await window.deskLibrary.selectFolder();
  if (result && !result.canceled && result.path) {
    els.assetBackupPathInput.value = result.path;
  }
});

els.settingsPage?.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-help-key]');
  if (!trigger) return;
  event.preventDefault();
  event.stopPropagation();
  openSettingsHelpModal(trigger.getAttribute('data-help-key'));
});

els.closeSettingsHelpModalBtn?.addEventListener('click', () => closeSettingsHelpModal());
els.settingsHelpModalOverlay?.addEventListener('click', () => closeSettingsHelpModal());

els.openImagePathBtn.addEventListener('click', async () => {
  const record = selectedRecord();
  if (!record || !record.imagePath) return;
  await window.deskLibrary.openImagePath(record.imagePath);
});

els.assetOpenPrimaryBtn?.addEventListener('click', async () => {
  const asset = selectedAsset();
  if (!asset) return;
  const result = await window.deskLibrary.openAssetPrimary(asset.id);
  if (result && result.ok === false) {
    alert(result.message || '打开失败');
  }
});

els.assetOpenSourceBtn?.addEventListener('click', async () => {
  const asset = selectedAsset();
  if (!asset) return;
  const result = await window.deskLibrary.openAssetSource(asset.id);
  if (result && result.ok === false) {
    alert(result.message || '打开失败');
  }
});

els.assetOpenLocationBtn?.addEventListener('click', async () => {
  const asset = selectedAsset();
  if (!asset) return;
  const result = await window.deskLibrary.openAssetLocation(asset.id);
  if (result && result.ok === false) {
    alert(result.message || '打开失败');
  }
});

els.assetSaveNoteBtn?.addEventListener('click', async () => {
  const asset = selectedAsset();
  if (!asset) return;
  const result = await window.deskLibrary.updateAssetNote({
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
  const result = await window.deskLibrary.deleteAsset(asset.id);
  if (result && result.ok === false) {
    alert(result.message || '删除失败');
    return;
  }
  closeAssetModal();
});

els.browserCardOpenBtn?.addEventListener('click', async () => {
  const card = selectedBrowserCard();
  if (!card) return;
  const result = await window.deskLibrary.openBrowserCard(card.id);
  if (result && result.ok === false) {
    alert(result.message || '打开失败');
  }
});

els.browserCardInjectBtn?.addEventListener('click', async () => {
  const card = selectedBrowserCard();
  if (!card) return;
  openBrowserInjectModal(card.id);
  await loadBrowserInjectTargets();
});

els.browserCardOpenSourceBtn?.addEventListener('click', async () => {
  const card = selectedBrowserCard();
  if (!card) return;
  const result = await window.deskLibrary.openBrowserCardSource(card.id);
  if (result && result.ok === false) {
    alert(result.message || '打开失败');
  }
});

els.browserCardSaveBtn?.addEventListener('click', async () => {
  const card = selectedBrowserCard();
  if (!card) return;
  const result = await window.deskLibrary.updateBrowserCard({
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
  applySnapshot(await window.deskLibrary.getInitialData());
});

els.browserCardDeleteBtn?.addEventListener('click', async () => {
  const card = selectedBrowserCard();
  if (!card) return;
  if (!window.confirm('确认删除这张浏览器卡片吗？')) return;
  const result = await window.deskLibrary.deleteBrowserCard(card.id);
  if (result && result.ok === false) {
    alert(result.message || '删除失败');
    return;
  }
  state.selectedBrowserCardId = null;
  closeBrowserCardModal();
  applySnapshot(await window.deskLibrary.getInitialData());
});

const ABOUT_REPO_URL = 'https://github.com/kaiyuantest/click2save-electron';
const FEEDBACK_POST_URL = 'https://www.swdtbook.com/mail/send.php';

els.aboutOpenSourceBtn?.addEventListener('click', async () => {
  const result = await window.deskLibrary.openExternalUrl(ABOUT_REPO_URL);
  if (result && result.ok === false) {
    alert(result.message || '无法打开链接');
  }
});

els.aboutFeedbackForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = (document.getElementById('aboutFeedbackTitle')?.value || '').trim();
  const contact = (document.getElementById('aboutFeedbackContact')?.value || '').trim();
  const message = (document.getElementById('aboutFeedbackMessage')?.value || '').trim();
  if (!message) {
    alert('请填写反馈内容');
    return;
  }
  const statusEl = els.aboutFeedbackStatus;
  const btn = els.aboutFeedbackSubmitBtn;
  if (statusEl) statusEl.textContent = '';
  if (btn) btn.disabled = true;
  try {
    const body = new URLSearchParams();
    body.set('title', title || 'DeskLibrary 用户留言');
    body.set('contact', contact || '未填写联系方式');
    body.set('message', message);
    body.set('source', 'DeskLibrary 桌面版');
    const res = await fetch(FEEDBACK_POST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body.toString()
    });
    const data = await res.json().catch(() => ({}));
    if (data && data.ok) {
      if (statusEl) statusEl.textContent = data.message || '发送成功';
      els.aboutFeedbackForm.reset();
      const src = document.getElementById('aboutFeedbackSource');
      if (src) src.value = 'DeskLibrary 桌面版';
    } else {
      const msg = (data && data.message) || `发送失败（HTTP ${res.status}）`;
      if (statusEl) statusEl.textContent = msg;
      else alert(msg);
    }
  } catch (err) {
    const msg = err && err.message ? err.message : '网络错误';
    if (statusEl) statusEl.textContent = msg;
    else alert(msg);
  } finally {
    if (btn) btn.disabled = false;
  }
});

window.deskLibrary.onSnapshot(applySnapshot);
window.deskLibrary.getInitialData().then(applySnapshot);
