const state = {
  records: [],
  assets: [],
  dateFilters: [],
  settings: {},
  currentPage: 'daily',
  selectedFilter: '全部',
  searchKeyword: '',
  selectedCalendarDate: '',
  currentPageNumber: 1,
  pageSize: 12,
  selectedRecordId: null,
  selectedAssetId: null,
  assetSearchKeyword: '',
  assetTypeFilter: '全部',
  statusText: '后台监听中',
  modalOpen: false,
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
  backupPageBtn: document.getElementById('backupPageBtn'),
  linksPageBtn: document.getElementById('linksPageBtn'),
  settingsPageBtn: document.getElementById('settingsPageBtn'),
  mobileDailyNavBtn: document.getElementById('mobileDailyNavBtn'),
  mobileCommonNavBtn: document.getElementById('mobileCommonNavBtn'),
  mobileBackupNavBtn: document.getElementById('mobileBackupNavBtn'),
  mobileLinksNavBtn: document.getElementById('mobileLinksNavBtn'),
  mobileSettingsNavBtn: document.getElementById('mobileSettingsNavBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  dailyPage: document.getElementById('dailyPage'),
  commonPage: document.getElementById('commonPage'),
  assetsPage: document.getElementById('assetsPage'),
  settingsPage: document.getElementById('settingsPage'),
  dailySearchInput: document.getElementById('dailySearchInput'),
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
  assetDropZone: document.getElementById('assetDropZone'),
  assetDropTitle: document.getElementById('assetDropTitle'),
  assetDropHint: document.getElementById('assetDropHint'),
  pickAssetFilesBtn: document.getElementById('pickAssetFilesBtn'),
  pickAssetFoldersBtn: document.getElementById('pickAssetFoldersBtn'),
  assetSearchInput: document.getElementById('assetSearchInput'),
  assetTypeFilterBar: document.getElementById('assetTypeFilterBar'),
  assetsList: document.getElementById('assetsList'),
  assetDetailTitle: document.getElementById('assetDetailTitle'),
  assetDetailStatus: document.getElementById('assetDetailStatus'),
  assetDetailEmpty: document.getElementById('assetDetailEmpty'),
  assetDetailBody: document.getElementById('assetDetailBody'),
  assetDetailMeta: document.getElementById('assetDetailMeta'),
  assetDetailPaths: document.getElementById('assetDetailPaths'),
  assetNoteInput: document.getElementById('assetNoteInput'),
  assetOpenPrimaryBtn: document.getElementById('assetOpenPrimaryBtn'),
  assetOpenSourceBtn: document.getElementById('assetOpenSourceBtn'),
  assetOpenLocationBtn: document.getElementById('assetOpenLocationBtn'),
  assetSaveNoteBtn: document.getElementById('assetSaveNoteBtn'),
  assetDeleteBtn: document.getElementById('assetDeleteBtn'),
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
  deleteRecordBtn: document.getElementById('deleteRecordBtn')
};

function selectedRecord() {
  return state.records.find((item) => item.id === state.selectedRecordId) || null;
}

function selectedAsset() {
  return state.assets.find((item) => item.id === state.selectedAssetId) || null;
}

function isAssetsPage() {
  return state.currentPage === 'backup' || state.currentPage === 'links';
}

function currentAssetMode() {
  return state.currentPage === 'backup' ? 'backup' : 'link';
}

function dailyRecords() {
  let records = state.records.filter((item) => (item.category || 'daily') !== 'common');

  if (state.selectedCalendarDate) {
    records = records.filter((item) => item.createdDate === state.selectedCalendarDate);
  } else if (state.selectedFilter !== '全部') {
    records = records.filter((item) => item.createdDate === state.selectedFilter);
  }

  const keyword = state.searchKeyword.trim().toLowerCase();
  if (!keyword) {
    return records;
  }

  return records.filter((item) => {
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

function commonRecords() {
  return state.records
    .filter((item) => (item.category || 'daily') === 'common')
    .sort((left, right) => {
      const hitDelta = Number(right.hitCount || 1) - Number(left.hitCount || 1);
      if (hitDelta !== 0) return hitDelta;
      return new Date(right.lastCapturedAt || right.updatedAt || right.createdAt) - new Date(left.lastCapturedAt || left.updatedAt || left.createdAt);
    });
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
  if (state.currentPage === 'settings') return [];
  return dailyRecords();
}

function assetsForCurrentPage() {
  let assets = state.assets.filter((item) => item.mode === currentAssetMode());
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
  els.dailyDatePicker.value = state.selectedCalendarDate;
  if (els.assetSearchInput) {
    els.assetSearchInput.value = state.assetSearchKeyword;
  }
  renderPage();
  renderMobileTools();
  renderFilters();
  renderAssetFilters();
  renderQuickSections();
  renderDailyRecords();
  renderCommonRecords();
  renderAssetList();
  renderAssetDetail();
  renderModal();
  renderSettings();
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
      : current === 'backup'
        ? '备份库'
        : current === 'links'
          ? '快捷入口'
          : '设置';
  els.dailyPage.classList.toggle('hidden', current !== 'daily');
  els.commonPage.classList.toggle('hidden', current !== 'common');
  els.assetsPage.classList.toggle('hidden', !isAssetsPage());
  els.settingsPage.classList.toggle('hidden', current !== 'settings');
  els.dailyFilterBar.classList.toggle('hidden', current !== 'daily');
  els.dailyPageBtn.classList.toggle('active', current === 'daily');
  els.commonPageBtn.classList.toggle('active', current === 'common');
  els.backupPageBtn.classList.toggle('active', current === 'backup');
  els.linksPageBtn.classList.toggle('active', current === 'links');
  els.settingsPageBtn.classList.toggle('active', current === 'settings');
  if (els.mobileDailyNavBtn) {
    els.mobileDailyNavBtn.classList.toggle('active', current === 'daily');
    els.mobileCommonNavBtn.classList.toggle('active', current === 'common');
    els.mobileBackupNavBtn.classList.toggle('active', current === 'backup');
    els.mobileLinksNavBtn.classList.toggle('active', current === 'links');
    els.mobileSettingsNavBtn.classList.toggle('active', current === 'settings');
  }

  if (isAssetsPage()) {
    const backupMode = currentAssetMode() === 'backup';
    els.assetsPageHeading.textContent = backupMode ? '备份库' : '快捷入口';
    els.assetDropTitle.textContent = backupMode ? '拖入文件或文件夹，完整备份到软件目录' : '拖入文件或文件夹，创建快捷入口';
    els.assetDropHint.textContent = backupMode ? '导入后会复制一份到软件目录中保存' : '导入后只保留原始路径，点击即可打开';
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

  return `
    <div class="record-card-actions">
      <div class="record-topline">${escapeHtml(record.categoryDisplay)} · ${escapeHtml(record.contentTypeDisplay)}</div>
      <button class="card-copy-btn" data-record-id="${record.id}" title="复制">⧉</button>
    </div>
    <div class="record-title">${escapeHtml(record.displayTitle)}</div>
    <div class="record-source">${escapeHtml(record.sourceAppDisplay || '未知应用')}</div>
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
      <button class="card-copy-btn card-open-btn" data-asset-id="${asset.id}" title="打开">↗</button>
    </div>
    <div class="record-title">${escapeHtml(asset.name)}</div>
    <div class="record-source">${escapeHtml(asset.statusDisplay)}</div>
    ${thumb}
    <div class="record-preview">${escapeHtml(asset.note || asset.sourcePathDisplay || '')}</div>
    <div class="record-footer">
      <span>${escapeHtml(asset.modeDisplay)}</span>
      <span>${escapeHtml(asset.updatedAtDisplay)}</span>
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
    empty.textContent = currentAssetMode() === 'backup'
      ? '还没有备份资源，拖入文件或文件夹开始收集。'
      : '还没有快捷入口，拖入文件或文件夹开始收集。';
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
      render();
    };
    item.onkeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        state.selectedAssetId = asset.id;
        render();
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
    els.assetsList.appendChild(item);
  });
}

function renderAssetDetail() {
  if (!els.assetDetailBody) return;
  const asset = selectedAsset();
  if (!asset || !assetsForCurrentPage().some((item) => item.id === asset.id)) {
    els.assetDetailTitle.textContent = '资源详情';
    els.assetDetailStatus.textContent = '未选择';
    els.assetDetailEmpty.classList.remove('hidden');
    els.assetDetailBody.classList.add('hidden');
    els.assetNoteInput.value = '';
    return;
  }

  els.assetDetailTitle.textContent = asset.name;
  els.assetDetailStatus.textContent = asset.statusDisplay;
  els.assetDetailEmpty.classList.add('hidden');
  els.assetDetailBody.classList.remove('hidden');
  els.assetNoteInput.value = asset.note || '';
  els.assetDetailMeta.innerHTML = `
    <div><span class="meta-label">模式</span><span>${escapeHtml(asset.modeDisplay)}</span></div>
    <div><span class="meta-label">类型</span><span>${escapeHtml(asset.entryTypeDisplay)}</span></div>
    <div><span class="meta-label">更新时间</span><span>${escapeHtml(asset.updatedAtDisplay)}</span></div>
  `;
  const rows = [
    `<div><span class="meta-label">当前资源</span><span class="break-all">${escapeHtml(asset.primaryPath || '-')}</span></div>`,
    `<div><span class="meta-label">原路径</span><span class="break-all">${escapeHtml(asset.sourcePathDisplay || '-')}</span></div>`
  ];
  if (asset.mode === 'backup') {
    rows.push(`<div><span class="meta-label">备份路径</span><span class="break-all">${escapeHtml(asset.storedPathDisplay || '-')}</span></div>`);
  }
  els.assetDetailPaths.innerHTML = rows.join('');
  els.assetOpenSourceBtn.classList.toggle('hidden', !asset.hasSecondaryOpen);
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

function openModal() {
  state.modalOpen = true;
  renderModal();
  els.recordModal.classList.remove('hidden');
}

function closeModal() {
  state.modalOpen = false;
  els.recordModal.classList.add('hidden');
}

function applySnapshot(payload) {
  state.records = payload.records || [];
  state.assets = payload.assets || [];
  state.dateFilters = buildRecentDateFilters(state.records);
  state.settings = payload.settings || {};
  state.statusText = payload.statusText || '后台监听中';

  if (!state.dateFilters.includes(state.selectedFilter)) {
    state.selectedFilter = state.dateFilters[0] || '全部';
  }

  if (state.selectedCalendarDate && !state.dateFilters.includes(state.selectedCalendarDate)) {
    state.selectedCalendarDate = '';
  }

  ensureValidSelection();
  ensureValidAssetSelection();
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
  render();
}

async function importAssetPaths(paths) {
  const validPaths = [...new Set((paths || []).map((item) => String(item || '').trim()).filter(Boolean))];
  if (!validPaths.length) return;
  const result = await window.click2save.importAssets({
    mode: currentAssetMode(),
    paths: validPaths
  });
  if (result && result.ok === false) {
    alert(result.message || '导入失败');
  }
}

els.dailyPageBtn.addEventListener('click', () => switchPage('daily'));
els.commonPageBtn.addEventListener('click', () => switchPage('common'));
els.backupPageBtn.addEventListener('click', () => switchPage('backup'));
els.linksPageBtn.addEventListener('click', () => switchPage('links'));
els.settingsPageBtn.addEventListener('click', () => switchPage('settings'));
els.mobileDailyNavBtn?.addEventListener('click', () => switchPage('daily'));
els.mobileCommonNavBtn?.addEventListener('click', () => switchPage('common'));
els.mobileBackupNavBtn?.addEventListener('click', () => switchPage('backup'));
els.mobileLinksNavBtn?.addEventListener('click', () => switchPage('links'));
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

els.pickAssetFilesBtn?.addEventListener('click', async () => {
  const result = await window.click2save.selectAssetFiles();
  if (!result || result.canceled) return;
  await importAssetPaths(result.paths || []);
});

els.pickAssetFoldersBtn?.addEventListener('click', async () => {
  const result = await window.click2save.selectAssetFolders();
  if (!result || result.canceled) return;
  await importAssetPaths(result.paths || []);
});

['dragenter', 'dragover'].forEach((eventName) => {
  els.assetDropZone?.addEventListener(eventName, (event) => {
    event.preventDefault();
    state.assetDropActive = true;
    els.assetDropZone.classList.add('dragover');
  });
});

['dragleave', 'dragend'].forEach((eventName) => {
  els.assetDropZone?.addEventListener(eventName, (event) => {
    event.preventDefault();
    state.assetDropActive = false;
    els.assetDropZone.classList.remove('dragover');
  });
});

els.assetDropZone?.addEventListener('drop', async (event) => {
  event.preventDefault();
  state.assetDropActive = false;
  els.assetDropZone.classList.remove('dragover');
  const paths = [...(event.dataTransfer?.files || [])].map((file) => file.path).filter(Boolean);
  await importAssetPaths(paths);
});

els.modalOverlay.addEventListener('click', closeModal);
els.closeModalBtn.addEventListener('click', closeModal);

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
  }
});

window.click2save.onSnapshot(applySnapshot);
window.click2save.getInitialData().then(applySnapshot);
