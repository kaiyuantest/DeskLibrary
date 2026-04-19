const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DEFAULT_PYTHON_COOKIE_PROJECT } = require('./browser-import');
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg']);

function normalizeOpenUrl(value, fallbackDomain = '') {
  const raw = String(value || '').trim();
  const domain = String(fallbackDomain || '').trim().replace(/^\.+/, '');
  if (!raw) {
    return domain ? `https://${domain}` : '';
  }
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw)) {
    return raw;
  }
  return `https://${raw.replace(/^\/+/, '')}`;
}

class StorageService {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.dataDir = path.join(baseDir, 'data');
    this.imagesDir = path.join(this.dataDir, 'images');
    this.assetsDir = path.join(this.dataDir, 'assets-backups');
    this.recordsFile = path.join(this.dataDir, 'records.json');
    this.assetsFile = path.join(this.dataDir, 'assets.json');
    this.browserCardsFile = path.join(this.dataDir, 'browserCards.json');
    this.settingsFile = path.join(this.dataDir, 'settings.json');
    this.duplicateFile = path.join(this.dataDir, 'duplicate-notices.json');

    fs.mkdirSync(this.imagesDir, { recursive: true });
    fs.mkdirSync(this.assetsDir, { recursive: true });

    this.ensureFile(this.recordsFile, []);
    this.ensureFile(this.assetsFile, []);
    this.ensureFile(this.browserCardsFile, []);
    this.ensureFile(this.settingsFile, {
      autoJudgmentEnabled: true,
      altQEnabled: true,
      doubleCopyEnabled: true,
      copyThenKeyEnabled: true,
      postCopyKey: 'Shift',
      accumulationStartShortcut: 'Ctrl+Alt+A',
      accumulationFinishShortcut: 'Ctrl+Alt+S',
      accumulationCancelShortcut: 'Ctrl+Alt+X',
      deleteLastCaptureShortcut: 'Ctrl+Alt+Z',
      startupLaunchEnabled: false,
      floatingIconEnabled: false,
      dockToEdgeEnabled: true,
      floatingOffsetX: null,
      floatingDockSide: 'right',
      floatingOffsetY: null,
      selfBuiltWorkspaceDir: '',
      browserScanRoot: '',
      selfBuiltUserDataRoot: '',
      selfBuiltChromePath: '',
      selfBuiltChromedriverPath: '',
      pythonCookieProjectPath: DEFAULT_PYTHON_COOKIE_PROJECT,
      bitApiUrl: 'http://127.0.0.1:54345',
      bitApiToken: ''
    });
    this.ensureFile(this.duplicateFile, {});
  }

  ensureFile(file, defaultValue) {
    if (!fs.existsSync(file)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2), 'utf-8');
    }
  }

  readJson(file, defaultValue) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
      return defaultValue;
    }
  }

  writeJson(file, value) {
    fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
  }

  formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  normalizeRecordDates(record) {
    const createdAt = record.createdAt ? new Date(record.createdAt) : new Date();
    const updatedAt = record.updatedAt ? new Date(record.updatedAt) : createdAt;
    const lastCapturedAt = record.lastCapturedAt ? new Date(record.lastCapturedAt) : updatedAt;
    return {
      ...record,
      createdDate: this.formatLocalDate(createdAt),
      updatedAt: updatedAt.toISOString(),
      lastCapturedAt: lastCapturedAt.toISOString()
    };
  }

  normalizeAsset(asset) {
    const createdAt = asset.createdAt ? new Date(asset.createdAt) : new Date();
    const updatedAt = asset.updatedAt ? new Date(asset.updatedAt) : createdAt;
    const mode = asset.mode === 'backup' ? 'backup' : 'link';
    const primaryPath = mode === 'backup' && asset.storedPath ? asset.storedPath : asset.sourcePath;
    const extension = asset.extension || path.extname(primaryPath || asset.sourcePath || '').toLowerCase();
    return {
      ...asset,
      mode,
      primaryPath,
      extension,
      name: asset.name || path.basename(primaryPath || asset.sourcePath || '未命名资源'),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      isImage: IMAGE_EXTENSIONS.has(extension),
      exists: primaryPath ? fs.existsSync(primaryPath) : false,
      sourceExists: asset.sourcePath ? fs.existsSync(asset.sourcePath) : false,
      backupExists: asset.storedPath ? fs.existsSync(asset.storedPath) : false
    };
  }

  normalizeBrowserCard(card) {
    const createdAt = card.createdAt ? new Date(card.createdAt) : new Date();
    const updatedAt = card.updatedAt ? new Date(card.updatedAt) : createdAt;
    const rawBrowserSource = card.browserSource || card.browser_source || {};
    const browserSource = {
      ...rawBrowserSource,
      profileName: rawBrowserSource.profileName || rawBrowserSource.profile_name || '',
      displayName: rawBrowserSource.displayName || rawBrowserSource.display_name || '',
      userDataDir: rawBrowserSource.userDataDir || rawBrowserSource.user_data_dir || '',
      browserId: rawBrowserSource.browserId || rawBrowserSource.browser_id || '',
      label: rawBrowserSource.label || '',
      name: rawBrowserSource.name || '',
      port: (() => {
        const raw = rawBrowserSource.port ?? rawBrowserSource.debugPort ?? rawBrowserSource.debug_port;
        if (raw === undefined || raw === null || raw === '') {
          return 0;
        }
        const n = Number(raw);
        return Number.isFinite(n) ? n : 0;
      })()
    };
    const sourceLabel = browserSource.label
      || browserSource.displayName
      || browserSource.name
      || browserSource.profileName
      || '未知来源';
    const domain = String(card.domain || '').trim() || '.unknown';
    const openUrl = normalizeOpenUrl(card.openUrl || card.open_url || '', domain);
    const cookies = Array.isArray(card.cookies) ? card.cookies : [];
    const cookieNames = Array.isArray(card.cookieNames) ? card.cookieNames : cookies.map((item) => item.name).filter(Boolean);

    return {
      ...card,
      name: card.name || domain.replace(/^\.+/, '') || '未命名卡片',
      domain,
      openUrl,
      open_url: openUrl,
      url: card.url || `https://${domain.replace(/^\.+/, '')}`,
      cookies,
      cookieNames,
      cookieCount: Number(card.cookieCount || cookies.length || 0),
      remark: card.remark || '',
      username: card.username || '',
      password: card.password || '',
      saved_at: card.saved_at || createdAt.toISOString(),
      last_used_at: card.last_used_at || '',
      last_used_method: card.last_used_method || '',
      test_title: card.test_title || '',
      test_ok: typeof card.test_ok === 'boolean' ? card.test_ok : null,
      browserSource,
      sourceType: browserSource.type || 'unknown',
      sourceLabel,
      sourceKey: this.getBrowserSourceKey(browserSource),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    };
  }

  getBrowserSourceKey(browserSource = {}) {
    if (browserSource.type === 'chrome_profile') {
      return `chrome_profile:${browserSource.userDataDir || browserSource.user_data_dir || ''}:${browserSource.profileName || browserSource.profile_name || browserSource.label || ''}`;
    }
    if (browserSource.type === 'self_built') {
      return `self_built:${browserSource.userDataDir || browserSource.user_data_dir || browserSource.label || ''}`;
    }
    return `${browserSource.type || 'unknown'}:${browserSource.browserId || browserSource.browser_id || browserSource.label || browserSource.name || browserSource.displayName || browserSource.display_name || ''}`;
  }

  getSettings() {
    const raw = this.readJson(this.settingsFile, {});
    const selfBuiltWorkspaceDir = String(
      raw.selfBuiltWorkspaceDir
      || raw.selfBuiltUserDataRoot
      || raw.browserScanRoot
      || ''
    ).trim();
    const derivedChromedriverPath = selfBuiltWorkspaceDir ? path.join(selfBuiltWorkspaceDir, 'chromedriver.exe') : '';
    const derivedChromePath = selfBuiltWorkspaceDir ? path.join(selfBuiltWorkspaceDir, 'chrome.exe') : '';

    return {
      autoJudgmentEnabled: true,
      altQEnabled: true,
      doubleCopyEnabled: true,
      copyThenKeyEnabled: true,
      postCopyKey: 'Shift',
      accumulationStartShortcut: 'Ctrl+Alt+A',
      accumulationFinishShortcut: 'Ctrl+Alt+S',
      accumulationCancelShortcut: 'Ctrl+Alt+X',
      deleteLastCaptureShortcut: 'Ctrl+Alt+Z',
      startupLaunchEnabled: false,
      floatingIconEnabled: false,
      dockToEdgeEnabled: true,
      floatingOffsetX: null,
      floatingDockSide: 'right',
      floatingOffsetY: null,
      selfBuiltWorkspaceDir,
      browserScanRoot: '',
      selfBuiltUserDataRoot: '',
      selfBuiltChromePath: '',
      selfBuiltChromedriverPath: '',
      pythonCookieProjectPath: DEFAULT_PYTHON_COOKIE_PROJECT,
      bitApiUrl: 'http://127.0.0.1:54345',
      bitApiToken: '',
      ...raw,
      selfBuiltWorkspaceDir,
      browserScanRoot: selfBuiltWorkspaceDir,
      selfBuiltUserDataRoot: selfBuiltWorkspaceDir,
      selfBuiltChromePath: String(raw.selfBuiltChromePath || '').trim() || derivedChromePath,
      selfBuiltChromedriverPath: String(raw.selfBuiltChromedriverPath || '').trim() || derivedChromedriverPath
    };
  }

  saveSettings(settings) {
    this.writeJson(this.settingsFile, settings);
    return settings;
  }

  getAllRecords() {
    return this.readJson(this.recordsFile, []).map((item) => this.normalizeRecordDates(item)).sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }

  getAllAssets() {
    return this.readJson(this.assetsFile, []).map((item) => this.normalizeAsset(item)).sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }

  getAllBrowserCards() {
    return this.readJson(this.browserCardsFile, []).map((item) => this.normalizeBrowserCard(item)).sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }

  getDateFilters() {
    const records = this.getAllRecords();
    return ['全部', ...new Set(records.map((item) => item.createdDate))];
  }

  getCategoryFilters() {
    return ['全部', '常用', '每日'];
  }

  findDuplicate(payload) {
    const records = this.getAllRecords();
    if (payload.contentType === 'text') {
      return records.find((item) => item.contentType === 'text' && item.textContent === payload.textContent) || null;
    }
    return records.find((item) => item.contentType === 'image' && item.contentHash === payload.signature) || null;
  }

  addRecord(payload, captureMethod, source = {}) {
    const records = this.getAllRecords();
    const now = new Date();
    const record = {
      id: records.length ? Math.max(...records.map((item) => item.id)) + 1 : 1,
      contentType: payload.contentType,
      textContent: payload.textContent || '',
      imagePath: payload.contentType === 'image' ? this.saveImage(payload.imageBuffer, now) : '',
      imageDataUrl: payload.contentType === 'image' ? payload.imageDataUrl : '',
      contentHash: payload.contentType === 'image' ? payload.signature : '',
      captureMethod,
      category: source.category || 'daily',
      hitCount: 1,
      lastCapturedAt: now.toISOString(),
      sourceApp: source.sourceApp || '',
      windowTitle: source.windowTitle || '',
      editableNote: '',
      createdAt: now.toISOString(),
      createdDate: this.formatLocalDate(now),
      updatedAt: now.toISOString()
    };

    records.unshift(record);
    this.writeJson(this.recordsFile, records);
    return record;
  }

  addManualTextRecord(text) {
    return this.addRecord({
      contentType: 'text',
      textContent: text,
      signature: text
    }, 'manual', {
      category: 'daily',
      sourceApp: 'Click2Save',
      windowTitle: '手动新增'
    });
  }

  updateRecord(recordId, updates) {
    const records = this.getAllRecords();
    const index = records.findIndex((item) => item.id === recordId);
    if (index === -1) {
      return null;
    }

    const nextRecord = {
      ...records[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    records[index] = nextRecord;
    this.writeJson(this.recordsFile, records);
    return nextRecord;
  }

  touchRecord(recordId, updates = {}) {
    const records = this.getAllRecords();
    const current = records.find((item) => item.id === recordId);
    if (!current) {
      return null;
    }

    return this.updateRecord(recordId, {
      hitCount: Math.max(1, Number(current.hitCount || 1) + 1),
      lastCapturedAt: new Date().toISOString(),
      ...updates
    });
  }

  updateAsset(assetId, updates) {
    const assets = this.getAllAssets();
    const index = assets.findIndex((item) => item.id === assetId);
    if (index === -1) return null;
    const nextAsset = this.normalizeAsset({
      ...assets[index],
      ...updates,
      updatedAt: new Date().toISOString()
    });
    assets[index] = nextAsset;
    this.writeJson(this.assetsFile, assets);
    return nextAsset;
  }

  updateBrowserCard(cardId, updates, options = {}) {
    const cards = this.getAllBrowserCards();
    const index = cards.findIndex((item) => item.id === cardId);
    if (index === -1) return null;
    const nextUpdatedAt = options.preserveUpdatedAt
      ? (cards[index].updatedAt || cards[index].createdAt || new Date().toISOString())
      : new Date().toISOString();
    const nextCard = this.normalizeBrowserCard({
      ...cards[index],
      ...updates,
      updatedAt: nextUpdatedAt
    });
    cards[index] = nextCard;
    this.writeJson(this.browserCardsFile, cards);
    return nextCard;
  }

  importBrowserCards(cards = []) {
    const existing = this.getAllBrowserCards();
    const imported = [];

    for (const incoming of cards) {
      const normalized = this.normalizeBrowserCard({
        ...incoming,
        id: incoming.id || crypto.randomUUID().slice(0, 8),
        createdAt: incoming.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      const existingIndex = existing.findIndex((item) => item.domain === normalized.domain && item.sourceKey === normalized.sourceKey);

      if (existingIndex >= 0) {
        existing[existingIndex] = this.normalizeBrowserCard({
          ...existing[existingIndex],
          ...normalized,
          id: existing[existingIndex].id,
          remark: existing[existingIndex].remark || normalized.remark || '',
          createdAt: existing[existingIndex].createdAt,
          updatedAt: new Date().toISOString()
        });
        imported.push(existing[existingIndex]);
      } else {
        existing.unshift(normalized);
        imported.push(normalized);
      }
    }

    this.writeJson(this.browserCardsFile, existing);
    return imported;
  }

  importAssets(entries = [], mode = 'link') {
    const assets = this.getAllAssets();
    const imported = [];
    const now = new Date().toISOString();
    let nextId = assets.length ? Math.max(...assets.map((item) => Number(item.id) || 0)) + 1 : 1;

    for (const entry of entries) {
      const sourcePath = path.resolve(String(entry.sourcePath || '').trim());
      if (!sourcePath || !fs.existsSync(sourcePath)) continue;
      const stats = fs.statSync(sourcePath);
      const entryType = stats.isDirectory() ? 'folder' : 'file';
      const duplicate = assets.find((item) => item.mode === mode && item.sourcePath === sourcePath);
      if (duplicate) {
        const touched = this.normalizeAsset({
          ...duplicate,
          updatedAt: now
        });
        assets[assets.findIndex((item) => item.id === duplicate.id)] = touched;
        imported.push(touched);
        continue;
      }

      const name = path.basename(sourcePath);
      const storedPath = mode === 'backup' ? this.copyPathToBackup(sourcePath, name) : '';
      const asset = this.normalizeAsset({
        id: nextId,
        mode,
        entryType,
        name,
        extension: entryType === 'file' ? path.extname(sourcePath).toLowerCase() : '',
        sourcePath,
        storedPath,
        note: '',
        createdAt: now,
        updatedAt: now
      });
      assets.unshift(asset);
      imported.push(asset);
      nextId += 1;
    }

    this.writeJson(this.assetsFile, assets);
    return imported;
  }

  deleteRecord(recordId) {
    const records = this.getAllRecords();
    const target = records.find((item) => item.id === recordId);
    if (!target) {
      return false;
    }

    if (target.imagePath) {
      try {
        if (fs.existsSync(target.imagePath)) {
          fs.unlinkSync(target.imagePath);
        }
      } catch {}
    }

    this.writeJson(this.recordsFile, records.filter((item) => item.id !== recordId));
    return true;
  }

  deleteAsset(assetId) {
    const assets = this.getAllAssets();
    const target = assets.find((item) => item.id === assetId);
    if (!target) return false;

    if (target.mode === 'backup' && target.storedPath) {
      const resolved = path.resolve(target.storedPath);
      const root = path.resolve(this.assetsDir);
      if (resolved.startsWith(root)) {
        this.removePathSafe(resolved);
      }
    }

    this.writeJson(this.assetsFile, assets.filter((item) => item.id !== assetId));
    return true;
  }

  deleteBrowserCard(cardId) {
    const cards = this.getAllBrowserCards();
    const target = cards.find((item) => item.id === cardId);
    if (!target) return false;
    this.writeJson(this.browserCardsFile, cards.filter((item) => item.id !== cardId));
    return true;
  }

  shouldNotifyDuplicate(recordId) {
    const map = this.readJson(this.duplicateFile, {});
    const today = this.formatLocalDate(new Date());
    return map[String(recordId)] !== today;
  }

  markDuplicateNotified(recordId) {
    const map = this.readJson(this.duplicateFile, {});
    map[String(recordId)] = this.formatLocalDate(new Date());
    this.writeJson(this.duplicateFile, map);
  }

  saveImage(buffer, date) {
    const day = this.formatLocalDate(date);
    const dayDir = path.join(this.imagesDir, day);
    fs.mkdirSync(dayDir, { recursive: true });
    const file = path.join(dayDir, `${crypto.randomUUID()}.png`);
    fs.writeFileSync(file, buffer);
    return file;
  }

  copyPathToBackup(sourcePath, name) {
    const targetPath = path.join(this.assetsDir, `${crypto.randomUUID()}-${this.sanitizeName(name || 'resource')}`);
    this.copyPathRecursive(sourcePath, targetPath);
    return targetPath;
  }

  copyPathRecursive(sourcePath, targetPath) {
    const stats = fs.statSync(sourcePath);
    if (stats.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      for (const child of fs.readdirSync(sourcePath)) {
        this.copyPathRecursive(path.join(sourcePath, child), path.join(targetPath, child));
      }
      return;
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }

  removePathSafe(targetPath) {
    if (!fs.existsSync(targetPath)) return;
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      for (const child of fs.readdirSync(targetPath)) {
        this.removePathSafe(path.join(targetPath, child));
      }
      fs.rmdirSync(targetPath);
      return;
    }
    fs.unlinkSync(targetPath);
  }

  sanitizeName(name) {
    return String(name || 'resource').replace(/[<>:\"/\\|?*\x00-\x1F]/g, '_');
  }

  hashText(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  hashBuffer(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}

module.exports = { StorageService };
