const crypto = require('crypto');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { execFile, spawn } = require('child_process');

const SQLITE_PATH = 'C:\\Windows\\System32\\sqlite3.exe';
const POWERSHELL_PATH = process.env.SystemRoot
  ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  : 'powershell.exe';
const DEFAULT_BIT_API_URL = 'http://127.0.0.1:54345';
const AUTH_COOKIE_NAMES = [
  'session', 'sess', 'token', 'auth', 'login', 'uid', 'user',
  'account', 'passport', 'ticket', 'sid', 'csrf', 'remember',
  'access', 'refresh', 'jwt', 'bearer', 'credential', 'identity',
  'logged', 'member', 'customer', 'visitor_id', 'openid', 'unionid',
  '_ga', 'phpsessid', 'jsessionid', 'asp.net_sessionid', 'laravel_session',
  'django', 'wordpress', 'wp-', '__utma', 'connect.sid'
];
const SKIP_DOMAIN_SUFFIXES = [
  '.doubleclick.net', '.googlesyndication.com', '.google-analytics.com',
  '.facebook.com', '.twitter.com', '.analytics.', '.cloudflare.com',
  '.jsdelivr.net', '.unpkg.com', '.cdnjs.cloudflare.com'
];
const dpapiDecryptCache = new Map();

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function nowIso() {
  return new Date().toISOString();
}

function makeCardId() {
  return crypto.randomUUID().slice(0, 8);
}

function getRootDomain(domain) {
  const value = String(domain || '').trim().replace(/^\.+/, '');
  if (!value) return '';
  const parts = value.split('.');
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join('.')}`;
  }
  return `.${value}`;
}

function webkitNow() {
  return Math.floor((Date.now() / 1000 + 11644473600) * 1000000);
}

function unixToWebkit(ts) {
  return Math.floor((Number(ts) + 11644473600) * 1000000);
}

function webkitToUnix(value) {
  const numeric = Number(value || 0);
  if (!numeric) return null;
  return Math.floor(numeric / 1000000 - 11644473600);
}

function escapeSqlText(value) {
  return String(value ?? '').replace(/'/g, "''");
}

function normalizeUrl(value, fallbackDomain = '') {
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

function isIpHost(value) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(String(value || '').trim());
}

function resolveSelfBuiltRoot(cfg = {}) {
  return String(cfg?.self_built_workspace_dir || cfg?.self_built_root || '').trim();
}

function resolveSelfBuiltChromedriverPath(cfg = {}) {
  const workspaceDir = resolveSelfBuiltRoot(cfg);
  const workspaceCandidate = workspaceDir ? path.join(workspaceDir, 'chromedriver.exe') : '';
  if (workspaceCandidate && fs.existsSync(workspaceCandidate)) {
    return workspaceCandidate;
  }
  const preferred = String(cfg?.self_built_chromedriver_path || '').trim();
  if (preferred && fs.existsSync(preferred)) {
    return preferred;
  }
  return '';
}

function resolveSelfBuiltBaseDir(cfg = {}) {
  const explicitRoot = resolveSelfBuiltRoot(cfg);
  if (explicitRoot) {
    return explicitRoot;
  }
  const chromedriverPath = resolveSelfBuiltChromedriverPath(cfg);
  if (chromedriverPath) {
    return path.dirname(chromedriverPath);
  }
  return '';
}

function resolveSelfBuiltChromePath(cfg = {}) {
  const workspaceDir = resolveSelfBuiltRoot(cfg);
  const workspaceCandidate = workspaceDir ? path.join(workspaceDir, 'chrome.exe') : '';
  if (workspaceCandidate && fs.existsSync(workspaceCandidate)) {
    return workspaceCandidate;
  }
  const preferred = String(cfg?.self_built_chrome_path || '').trim();
  if (preferred && fs.existsSync(preferred)) {
    return preferred;
  }
  return findChromePath();
}

function buildSelfBuiltUserDataDir(cfg = {}, port) {
  const baseDir = resolveSelfBuiltBaseDir(cfg);
  if (!baseDir) {
    throw new Error('未设置自建浏览器目录，也无法从 Chromedriver 路径推断目录');
  }
  return path.join(baseDir, `chrome_user_data_port_${port}`);
}

function getCookiePath(baseDir) {
  const root = path.resolve(String(baseDir || ''));
  const candidates = [
    path.join(root, 'Network', 'Cookies'),
    path.join(root, 'Cookies'),
    path.join(root, 'Default', 'Network', 'Cookies'),
    path.join(root, 'Default', 'Cookies')
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || '';
}

function findChromePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
  ];
  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || '';
}

function spawnDetached(command, args) {
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();
}

function execFileText(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, {
      windowsHide: true,
      maxBuffer: 32 * 1024 * 1024,
      ...options
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error((stderr || error.message || '').trim() || '命令执行失败'));
        return;
      }
      resolve(String(stdout || ''));
    });
  });
}

function execPowerShell(script, args = [], timeoutMs = 15000) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'click2save-ps-'));
  const scriptPath = path.join(tempDir, 'runner.ps1');
  fs.writeFileSync(scriptPath, script, 'utf8');
  return execFileText(POWERSHELL_PATH, [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    scriptPath,
    ...args
  ], {
    timeout: timeoutMs
  }).finally(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });
}

async function withTempCopy(filePath, callback) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'click2save-db-'));
  const tempFile = path.join(tempDir, path.basename(filePath));
  try {
    fs.copyFileSync(filePath, tempFile);
    return await callback(tempFile, tempDir);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

async function sqliteReadJson(dbPath, sql) {
  if (!fs.existsSync(SQLITE_PATH)) {
    throw new Error('系统缺少 sqlite3.exe，无法读取 Cookie 数据库');
  }
  return withTempCopy(dbPath, async (tempDb) => {
    const stdout = await execFileText(SQLITE_PATH, ['-json', tempDb, sql]);
    try {
      return JSON.parse(stdout || '[]');
    } catch (error) {
      throw new Error(`SQLite 结果解析失败: ${error.message}`);
    }
  });
}

async function sqliteApplySql(dbPath, sqlScript) {
  if (!fs.existsSync(SQLITE_PATH)) {
    throw new Error('系统缺少 sqlite3.exe，无法写入 Cookie 数据库');
  }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'click2save-sql-'));
  const sqlFile = path.join(tempDir, 'apply.sql');
  try {
    fs.writeFileSync(sqlFile, sqlScript, 'utf8');
    await execFileText(SQLITE_PATH, [dbPath, `.read ${sqlFile.replace(/\\/g, '/')}`]);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

async function unprotectWindowsData(buffer) {
  if (!buffer || !buffer.length) {
    return Buffer.alloc(0);
  }
  const cacheKey = buffer.toString('base64');
  if (dpapiDecryptCache.has(cacheKey)) {
    return dpapiDecryptCache.get(cacheKey);
  }
  const script = [
    "param([string]$b64)",
    "$bytes=[Convert]::FromBase64String($b64)",
    "$out=[Security.Cryptography.ProtectedData]::Unprotect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)",
    "[Console]::Write([Convert]::ToBase64String($out))"
  ].join('\r\n');
  const stdout = await execPowerShell(script, [cacheKey], 12000);
  const decoded = Buffer.from(String(stdout || '').trim(), 'base64');
  dpapiDecryptCache.set(cacheKey, decoded);
  return decoded;
}

async function getMasterKey(userDataDir) {
  try {
    const localStatePath = path.join(userDataDir, 'Local State');
    if (!fs.existsSync(localStatePath)) {
      return Buffer.alloc(0);
    }
    const payload = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
    const encryptedKey = payload?.os_crypt?.encrypted_key;
    if (!encryptedKey) {
      return Buffer.alloc(0);
    }
    const raw = Buffer.from(encryptedKey, 'base64');
    const dpapiPayload = raw.slice(5);
    return await unprotectWindowsData(dpapiPayload);
  } catch {
    return Buffer.alloc(0);
  }
}

async function decryptCookieValue(masterKey, encryptedHex, rawValue = '') {
  if (rawValue) {
    return String(rawValue);
  }
  if (!encryptedHex) {
    return String(rawValue || '');
  }
  const encrypted = Buffer.from(encryptedHex, 'hex');
  if (!encrypted.length) {
    return String(rawValue || '');
  }
  const prefix = encrypted.slice(0, 3).toString('utf8');
  if ((prefix === 'v10' || prefix === 'v11' || prefix === 'v20') && masterKey?.length) {
    try {
      const iv = encrypted.slice(3, 15);
      const payload = encrypted.slice(15, -16);
      const tag = encrypted.slice(-16);
      const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(payload), decipher.final()]).toString('utf8');
    } catch {
      return '';
    }
  }
  if (prefix === 'v10' || prefix === 'v11' || prefix === 'v20') {
    return '';
  }
  try {
    const decoded = await unprotectWindowsData(encrypted);
    return decoded.toString('utf8');
  } catch {
    return String(rawValue || '');
  }
}

function encryptCookieValue(masterKey, value) {
  const text = String(value ?? '');
  if (!text) {
    return Buffer.alloc(0);
  }
  if (!masterKey?.length) {
    return Buffer.from(text, 'utf8');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from('v10', 'utf8'), iv, encrypted, tag]);
}

function isAuthCookie(cookie) {
  const domain = String(cookie?.domain || '').toLowerCase();
  if (SKIP_DOMAIN_SUFFIXES.some((suffix) => domain.endsWith(suffix))) {
    return false;
  }
  const name = String(cookie?.name || '').toLowerCase();
  if (cookie?.httpOnly) {
    return true;
  }
  if (AUTH_COOKIE_NAMES.some((keyword) => name.includes(keyword))) {
    return true;
  }
  const expiry = cookie?.expiry ?? cookie?.expires;
  return Number(expiry || 0) > 0;
}

function filterAuthCookies(cookies) {
  return ensureArray(cookies).filter((item) => isAuthCookie(item));
}

function groupCookiesByRootDomain(cookies) {
  const grouped = {};
  for (const cookie of ensureArray(cookies)) {
    const root = getRootDomain(cookie?.domain || '');
    if (!root) continue;
    if (!grouped[root]) {
      grouped[root] = [];
    }
    grouped[root].push(cookie);
  }
  return grouped;
}

function normalizeSameSite(value) {
  if (value === 1 || value === '1' || /lax/i.test(String(value || ''))) return 'Lax';
  if (value === 2 || value === '2' || /strict/i.test(String(value || ''))) return 'Strict';
  if (value === 3 || value === '3' || /none/i.test(String(value || ''))) return 'None';
  return '';
}

function sameSiteToDbValue(value) {
  if (/lax/i.test(String(value || ''))) return 1;
  if (/strict/i.test(String(value || ''))) return 2;
  if (/none/i.test(String(value || ''))) return 3;
  return 0;
}

function normalizeSourceSchemeForCdp(value, secure = false) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (value === 0 || value === '0' || /unset/i.test(String(value))) {
    return 'Unset';
  }
  if (value === 1 || value === '1' || /non.?secure/i.test(String(value))) {
    return 'NonSecure';
  }
  if (value === 2 || value === '2' || /secure/i.test(String(value))) {
    return 'Secure';
  }
  return secure ? 'Secure' : 'NonSecure';
}

function isCookieDomainMatch(hostname, cookieDomain) {
  const host = String(hostname || '').trim().toLowerCase();
  const domain = String(cookieDomain || '').trim().toLowerCase().replace(/^\./, '');
  if (!host || !domain) {
    return false;
  }
  return host === domain || host.endsWith(`.${domain}`);
}

function buildCookieUrl(cookie, fallbackUrl = '') {
  const pathValue = String(cookie?.path || '/').startsWith('/') ? String(cookie?.path || '/') : `/${String(cookie?.path || '')}`;
  const secure = !!cookie?.secure;
  const domain = String(cookie?.domain || '').trim().replace(/^\./, '');
  if (fallbackUrl) {
    try {
      const parsed = new URL(fallbackUrl);
      if (!domain || isCookieDomainMatch(parsed.hostname, domain)) {
        parsed.protocol = secure ? 'https:' : 'http:';
        parsed.pathname = pathValue;
        parsed.search = '';
        parsed.hash = '';
        return parsed.toString();
      }
    } catch {}
  }
  if (!domain) {
    return '';
  }
  try {
    return new URL(`${secure ? 'https' : 'http'}://${domain}${pathValue}`).toString();
  } catch {
    return '';
  }
}

function normalizeCookie(cookie, fallbackUrl = '') {
  const normalized = {
    name: String(cookie?.name || ''),
    value: String(cookie?.value || ''),
    domain: String(cookie?.domain || ''),
    path: String(cookie?.path || '/'),
    secure: !!cookie?.secure,
    httpOnly: !!cookie?.httpOnly
  };
  const expiry = Number(cookie?.expiry ?? cookie?.expires ?? 0);
  if (expiry > 0) {
    normalized.expiry = Math.floor(expiry);
  }
  const sameSite = normalizeSameSite(cookie?.sameSite);
  if (sameSite) normalized.sameSite = sameSite;
  if (cookie?.sourceScheme !== undefined && cookie?.sourceScheme !== null && cookie?.sourceScheme !== '') {
    normalized.sourceScheme = Number(cookie.sourceScheme);
  }
  if (cookie?.sourcePort !== undefined && cookie?.sourcePort !== null && cookie?.sourcePort !== '') {
    normalized.sourcePort = Number(cookie.sourcePort);
  }
  if (cookie?.isPartitioned) {
    normalized.isPartitioned = true;
  }
  if (cookie?.topFrameSiteKey) {
    normalized.topFrameSiteKey = String(cookie.topFrameSiteKey);
  }
  if (cookie?.hasCrossSiteAncestor !== undefined && cookie?.hasCrossSiteAncestor !== null) {
    normalized.hasCrossSiteAncestor = !!cookie.hasCrossSiteAncestor;
  }

  if (!normalized.domain && fallbackUrl) {
    try {
      normalized.domain = `.${new URL(fallbackUrl).hostname}`;
    } catch {}
  }
  const normalizedDomain = String(normalized.domain || '').trim();
  if (normalizedDomain && !normalizedDomain.startsWith('.') && !/^localhost$/i.test(normalizedDomain) && !isIpHost(normalizedDomain)) {
    normalized.domain = `.${normalizedDomain}`;
  }
  if (!normalized.domain) {
    throw new Error(`Cookie ${normalized.name || '(unknown)'} 缺少 domain`);
  }
  if (!normalized.path) {
    normalized.path = '/';
  }
  const cookieUrl = buildCookieUrl(normalized, fallbackUrl);
  if (cookieUrl) {
    normalized.url = cookieUrl;
  }
  const sourceScheme = normalizeSourceSchemeForCdp(normalized.sourceScheme, normalized.secure);
  if (sourceScheme) {
    normalized.sourceScheme = sourceScheme;
  } else {
    delete normalized.sourceScheme;
  }
  return normalized;
}

function buildGroupsFromCookies(cookies, mergeDomain = true) {
  const grouped = mergeDomain ? groupCookiesByRootDomain(cookies) : {};
  if (!mergeDomain) {
    for (const cookie of ensureArray(cookies)) {
      const domain = String(cookie?.domain || '');
      if (!domain) continue;
      if (!grouped[domain]) {
        grouped[domain] = [];
      }
      grouped[domain].push(cookie);
    }
  }

  return Object.entries(grouped)
    .sort((a, b) => (b[1].length - a[1].length) || String(a[0]).localeCompare(String(b[0]), 'zh-CN'))
    .map(([domain, items]) => ({
      domain,
      name: String(domain || '').replace(/^\.+/, '') || domain,
      cookies: items,
      cookieCount: items.length,
      authCount: filterAuthCookies(items).length,
      openUrl: normalizeUrl('', domain)
    }));
}

function readLocalStateNames(userDataDir) {
  try {
    const payload = JSON.parse(fs.readFileSync(path.join(userDataDir, 'Local State'), 'utf8'));
    return payload?.profile?.info_cache || {};
  } catch {
    return {};
  }
}

function listChromeUserDataDirs() {
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data'),
    path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data')
  ];
  return [...new Set(candidates.filter((candidate) => candidate && fs.existsSync(candidate)))];
}

function listChromeProfiles() {
  const results = [];
  for (const userDataDir of listChromeUserDataDirs()) {
    const infoCache = readLocalStateNames(userDataDir);
    const displayNames = {};
    for (const [profileName, info] of Object.entries(infoCache)) {
      displayNames[profileName] = info?.name || profileName;
    }
    for (const entry of fs.readdirSync(userDataDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name !== 'Default' && !entry.name.startsWith('Profile ')) continue;
      const profileDir = path.join(userDataDir, entry.name);
      const cookiePath = getCookiePath(profileDir);
      if (!cookiePath) continue;
      let updatedAt = '未知';
      try {
        updatedAt = new Date(fs.statSync(cookiePath).mtimeMs).toLocaleString('zh-CN', { hour12: false });
      } catch {}
      const displayName = displayNames[entry.name] || entry.name;
      results.push({
        type: 'chrome_profile',
        id: `${userDataDir}::${entry.name}`,
        label: `${displayName} [${updatedAt}]`,
        profile_name: entry.name,
        display_name: displayName,
        updated_at: updatedAt,
        user_data_dir: userDataDir,
        is_open: false,
        port: 0
      });
    }
  }
  return results;
}

function listSelfBuiltProfiles(rootDir) {
  const baseDir = String(rootDir || '').trim();
  if (!baseDir || !fs.existsSync(baseDir)) {
    return [];
  }
  const results = [];
  const seen = new Set();
  const stack = [baseDir];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.name.startsWith('chrome_user_data_port_')) {
        const resolved = path.resolve(fullPath);
        if (seen.has(resolved)) continue;
        seen.add(resolved);
        const cookiePath = getCookiePath(fullPath);
        if (!cookiePath) continue;
        const rawPort = entry.name.replace('chrome_user_data_port_', '');
        const port = Number.parseInt(rawPort, 10) || 0;
        results.push({
          type: 'self_built',
          id: resolved,
          label: port ? `端口 ${port}` : entry.name,
          user_data_dir: resolved,
          port,
          is_open: false
        });
        continue;
      }
      stack.push(fullPath);
    }
  }
  return results.sort((a, b) => String(a.label).localeCompare(String(b.label), 'zh-CN'));
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch {}
      resolve(value);
    };
    socket.setTimeout(500);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, '127.0.0.1');
  });
}

async function fetchJson(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    return { ok: response.ok, status: response.status, data, text };
  } finally {
    clearTimeout(timer);
  }
}

async function bitApiRequest(cfg, endpoint, payload = {}, timeoutMs = 10000) {
  const apiUrl = String(cfg?.bit_api_url || DEFAULT_BIT_API_URL).trim() || DEFAULT_BIT_API_URL;
  const token = String(cfg?.bit_api_token || '').trim();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['x-api-key'] = token;
  }
  const result = await fetchJson(`${apiUrl}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload || {})
  }, timeoutMs);
  return result.data || {};
}

async function bitGetBrowsers(cfg) {
  try {
    const payload = await bitApiRequest(cfg, '/browser/list', { page: 0, pageSize: 200 }, 10000);
    return payload?.success ? ensureArray(payload?.data?.list) : [];
  } catch {
    return [];
  }
}

async function bitGetOpenPorts(cfg) {
  try {
    const payload = await bitApiRequest(cfg, '/browser/ports', {}, 5000);
    return payload?.success && payload?.data && typeof payload.data === 'object' ? payload.data : {};
  } catch {
    return {};
  }
}

async function bitGetCookies(cfg, browserId) {
  try {
    const payload = await bitApiRequest(cfg, '/browser/cookies/get', { id: browserId }, 10000);
    if (!payload?.success) {
      return [];
    }
    const raw = payload.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      return ensureArray(raw.cookies || raw.list);
    }
    return [];
  } catch {
    return [];
  }
}

async function bitOpenBrowser(cfg, browserId) {
  const payload = await bitApiRequest(cfg, '/browser/open', { id: browserId, args: [], queue: true }, 30000);
  if (!payload?.success) {
    return null;
  }
  const info = payload.data || {};
  const httpUrl = String(info.http || '');
  const port = Number.parseInt(httpUrl.split(':').pop() || '', 10) || 0;
  return {
    http: httpUrl,
    port,
    ws: String(info.ws || '')
  };
}

async function listOfflineSources(cfg, selfBuiltRoot) {
  const resolvedSelfBuiltRoot = selfBuiltRoot || resolveSelfBuiltRoot(cfg);
  const chromeProfiles = listChromeProfiles();
  const selfBuilt = listSelfBuiltProfiles(resolvedSelfBuiltRoot);
  const openPorts = await bitGetOpenPorts(cfg);
  const bitBrowsers = [];
  let bitbrowserError = '';
  try {
    for (const item of await bitGetBrowsers(cfg)) {
      const browserId = String(item?.id || '');
      const name = String(item?.name || browserId);
      const seq = String(item?.seq || '').trim();
      bitBrowsers.push({
        type: 'bitbrowser_api',
        id: browserId,
        label: seq ? `[${seq}] ${name}` : name,
        browser_id: browserId,
        is_open: Object.prototype.hasOwnProperty.call(openPorts, browserId),
        port: Number.parseInt(String(openPorts[browserId] || ''), 10) || 0
      });
    }
  } catch (error) {
    bitbrowserError = error.message || '比特浏览器列表获取失败';
  }
  if (!bitBrowsers.length && !bitbrowserError) {
    bitbrowserError = '未读取到比特浏览器列表';
  }
  return {
    chrome_profiles: chromeProfiles,
    self_built: selfBuilt,
    bitbrowser: bitBrowsers,
    bitbrowser_error: bitbrowserError,
    self_built_root: resolvedSelfBuiltRoot
  };
}

async function readCookiesFromDb(cookiePath, userDataDir) {
  const masterKey = await getMasterKey(userDataDir);
  const pragmaRows = await sqliteReadJson(cookiePath, 'PRAGMA table_info(cookies)');
  const columns = new Set(pragmaRows.map((item) => String(item?.name || '')));
  const wantedColumns = [
    ['host_key', 'host_key'],
    ['name', 'name'],
    ['value', 'value'],
    ['encrypted_value_hex', columns.has('encrypted_value') ? 'hex(CAST(encrypted_value AS BLOB)) AS encrypted_value_hex' : "'' AS encrypted_value_hex"],
    ['path', 'path'],
    ['is_secure', columns.has('is_secure') ? 'is_secure' : '0 AS is_secure'],
    ['is_httponly', columns.has('is_httponly') ? 'is_httponly' : '0 AS is_httponly'],
    ['expires_utc', columns.has('expires_utc') ? 'expires_utc' : '0 AS expires_utc'],
    ['samesite', columns.has('samesite') ? 'samesite' : 'NULL AS samesite'],
    ['source_scheme', columns.has('source_scheme') ? 'source_scheme' : 'NULL AS source_scheme'],
    ['source_port', columns.has('source_port') ? 'source_port' : 'NULL AS source_port'],
    ['is_partitioned', columns.has('is_partitioned') ? 'is_partitioned' : 'NULL AS is_partitioned'],
    ['top_frame_site_key', columns.has('top_frame_site_key') ? 'top_frame_site_key' : "'' AS top_frame_site_key"],
    ['has_cross_site_ancestor', columns.has('has_cross_site_ancestor') ? 'has_cross_site_ancestor' : 'NULL AS has_cross_site_ancestor']
  ];
  const sql = `SELECT ${wantedColumns.map(([, expr]) => expr).join(', ')} FROM cookies`;
  const rows = await sqliteReadJson(cookiePath, sql);

  const cookies = [];
  for (const row of rows) {
    const value = await decryptCookieValue(masterKey, row?.encrypted_value_hex || '', row?.value || '');
    const item = {
      name: String(row?.name || ''),
      value,
      domain: String(row?.host_key || ''),
      path: String(row?.path || '/') || '/',
      secure: !!Number(row?.is_secure || 0),
      httpOnly: !!Number(row?.is_httponly || 0)
    };
    const expiry = webkitToUnix(row?.expires_utc);
    if (expiry) item.expiry = expiry;
    const sameSite = normalizeSameSite(row?.samesite);
    if (sameSite) item.sameSite = sameSite;
    if (row?.source_scheme !== null && row?.source_scheme !== undefined && row?.source_scheme !== '') {
      item.sourceScheme = Number(row.source_scheme);
    }
    if (row?.source_port !== null && row?.source_port !== undefined && row?.source_port !== '') {
      item.sourcePort = Number(row.source_port);
    }
    if (Number(row?.is_partitioned || 0)) item.isPartitioned = true;
    if (row?.top_frame_site_key) item.topFrameSiteKey = String(row.top_frame_site_key);
    if (row?.has_cross_site_ancestor !== null && row?.has_cross_site_ancestor !== undefined && row?.has_cross_site_ancestor !== '') {
      item.hasCrossSiteAncestor = !!Number(row.has_cross_site_ancestor);
    }
    cookies.push(item);
  }
  return cookies;
}

async function loadOfflineGroups(cfg, sourceType, sourceId, filterAuth, mergeDomain, selfBuiltRoot) {
  let allCookies = [];
  if (sourceType === 'chrome_profile') {
    const [userDataDir, profileName] = String(sourceId || '').split('::');
    const profileDir = profileName ? path.join(userDataDir, profileName) : '';
    const cookiePath = getCookiePath(profileDir);
    if (!cookiePath) {
      throw new Error(`找不到 Profile ${profileName || ''} 的 Cookie 文件`);
    }
    allCookies = await readCookiesFromDb(cookiePath, userDataDir);
  } else if (sourceType === 'self_built') {
    const cookiePath = getCookiePath(sourceId);
    if (!cookiePath) {
      throw new Error('找不到自建浏览器 Cookie 文件');
    }
    allCookies = await readCookiesFromDb(cookiePath, sourceId);
  } else if (sourceType === 'bitbrowser_api') {
    allCookies = await bitGetCookies(cfg, sourceId);
  } else {
    throw new Error(`未知来源类型: ${sourceType}`);
  }

  const normalizedCookies = ensureArray(allCookies).map((item) => normalizeCookie(item)).filter(Boolean);
  const finalCookies = filterAuth ? filterAuthCookies(normalizedCookies) : normalizedCookies;
  return buildGroupsFromCookies(finalCookies, mergeDomain !== false);
}

async function loadSourceCookies(cfg, sourceType, sourceId) {
  if (sourceType === 'chrome_profile') {
    const [userDataDir, profileName] = String(sourceId || '').split('::');
    const profileDir = profileName ? path.join(userDataDir, profileName) : '';
    const cookiePath = getCookiePath(profileDir);
    if (!cookiePath) {
      throw new Error(`找不到 Profile ${profileName || ''} 的 Cookie 文件`);
    }
    return readCookiesFromDb(cookiePath, userDataDir);
  }
  if (sourceType === 'self_built') {
    const cookiePath = getCookiePath(sourceId);
    if (!cookiePath) {
      throw new Error('找不到自建浏览器 Cookie 文件');
    }
    return readCookiesFromDb(cookiePath, sourceId);
  }
  if (sourceType === 'bitbrowser_api' || sourceType === 'bitbrowser') {
    return bitGetCookies(cfg, sourceId);
  }
  throw new Error(`未知来源类型: ${sourceType}`);
}

function getCardSourceIdentity(card) {
  const source = card?.browserSource || card?.browser_source || {};
  const type = String(source?.type || '');
  if (type === 'chrome_profile') {
    const userDataDir = String(source.userDataDir || source.user_data_dir || '');
    const profileName = String(source.profileName || source.profile_name || '');
    return {
      sourceType: 'chrome_profile',
      sourceId: `${userDataDir}::${profileName}`
    };
  }
  if (type === 'self_built') {
    return {
      sourceType: 'self_built',
      sourceId: String(source.userDataDir || source.user_data_dir || '')
    };
  }
  if (type === 'bitbrowser') {
    return {
      sourceType: 'bitbrowser',
      sourceId: String(source.browserId || source.browser_id || '')
    };
  }
  throw new Error(`暂不支持刷新该来源类型: ${type || 'unknown'}`);
}

async function refreshCardCookies(card, cfg) {
  const { sourceType, sourceId } = getCardSourceIdentity(card);
  const normalizedCookies = ensureArray(await loadSourceCookies(cfg, sourceType, sourceId))
    .map((item) => normalizeCookie(item))
    .filter(Boolean);
  const targetDomain = String(card?.domain || '').trim().toLowerCase();
  const matchedCookies = targetDomain
    ? normalizedCookies.filter((item) => {
      const cookieDomain = String(item?.domain || '').trim().toLowerCase();
      return cookieDomain === targetDomain
        || cookieDomain.endsWith(targetDomain)
        || targetDomain.endsWith(cookieDomain.replace(/^\./, ''));
    })
    : normalizedCookies;

  if (!matchedCookies.length) {
    return {
      ok: false,
      message: `未从来源浏览器读取到 ${targetDomain || '当前域名'} 的最新 Cookie`
    };
  }

  const cookieNames = [...new Set(matchedCookies.map((item) => item.name).filter(Boolean))];
  return {
    ok: true,
    cookies: matchedCookies,
    cookieNames,
    cookieCount: matchedCookies.length,
    message: `已更新 ${matchedCookies.length} 条 Cookie`
  };
}

function buildBrowserSource(cfg, sourceType, sourceId) {
  if (sourceType === 'chrome_profile') {
    const [userDataDir, profileName] = String(sourceId || '').split('::');
    const infoCache = readLocalStateNames(userDataDir);
    const displayName = infoCache?.[profileName]?.name || profileName || 'Default';
    return {
      type: 'chrome_profile',
      profile_name: profileName,
      display_name: displayName,
      user_data_dir: userDataDir,
      label: `系统 Chrome · ${displayName}`
    };
  }
  if (sourceType === 'self_built') {
    const dirName = path.basename(String(sourceId || ''));
    const port = Number.parseInt(dirName.replace('chrome_user_data_port_', ''), 10) || 0;
    return {
      type: 'self_built',
      port,
      user_data_dir: String(sourceId || ''),
      name: port ? `端口 ${port}` : dirName,
      label: `自建浏览器 · ${port ? `端口 ${port}` : dirName}`
    };
  }
  if (sourceType === 'bitbrowser_api') {
    return {
      type: 'bitbrowser',
      browser_id: String(sourceId || ''),
      name: String(sourceId || ''),
      label: `比特浏览器 · ${String(sourceId || '')}`
    };
  }
  throw new Error(`未知来源类型: ${sourceType}`);
}

function buildImportCards(cfg, sourceType, sourceId, groups) {
  const browserSource = buildBrowserSource(cfg, sourceType, sourceId);
  return ensureArray(groups).map((group) => {
    const domain = String(group?.domain || '');
    return {
      id: makeCardId(),
      name: String(group?.name || domain.replace(/^\.+/, '') || '未命名卡片'),
      url: normalizeUrl('', domain),
      open_url: normalizeUrl(group?.openUrl || '', domain),
      domain,
      cookies: ensureArray(group?.cookies),
      source: 'offline_import',
      saved_at: nowIso(),
      remark: '',
      username: '',
      password: '',
      last_used_at: '',
      last_used_method: '',
      browser_source: browserSource,
      cookieCount: Number(group?.cookieCount || ensureArray(group?.cookies).length || 0)
    };
  });
}

async function scanBrowserCards(options = {}) {
  const scope = options.scope === 'chrome' || options.scope === 'self_built' ? options.scope : 'all';
  const selfBuiltRoot = String(options.selfBuiltRoot || '').trim();
  const results = [];

  if (scope === 'all' || scope === 'chrome') {
    for (const source of listChromeProfiles()) {
      try {
        const cookiePath = getCookiePath(path.join(source.user_data_dir, source.profile_name));
        const cookies = await readCookiesFromDb(cookiePath, source.user_data_dir);
        const groups = buildGroupsFromCookies(cookies, true);
        if (groups.length) {
          results.push({
            source: {
              type: 'chrome_profile',
              profileName: source.profile_name,
              displayName: source.display_name,
              userDataDir: source.user_data_dir,
              label: `系统 Chrome · ${source.display_name}`
            },
            groups
          });
        }
      } catch {}
    }
  }

  if (scope === 'all' || scope === 'self_built') {
    for (const source of listSelfBuiltProfiles(selfBuiltRoot)) {
      try {
        const cookiePath = getCookiePath(source.user_data_dir);
        const cookies = await readCookiesFromDb(cookiePath, source.user_data_dir);
        const groups = buildGroupsFromCookies(cookies, true);
        if (groups.length) {
          results.push({
            source: {
              type: 'self_built',
              name: path.basename(source.user_data_dir),
              port: source.port,
              userDataDir: source.user_data_dir,
              label: `自建浏览器 · ${source.label}`
            },
            groups
          });
        }
      } catch {}
    }
  }

  const candidates = [];
  for (const result of results) {
    for (const group of ensureArray(result?.groups)) {
      candidates.push({
        domain: group.domain,
        openUrl: group.openUrl,
        cookieCount: group.cookieCount,
        cookieNames: ensureArray(group.cookies).map((item) => item.name).filter(Boolean).slice(0, 24),
        cookies: group.cookies,
        browserSource: result.source
      });
    }
  }

  return { ok: true, results, candidates, selfBuiltRoot };
}

function isDomainMatchForFilter(candidate, expected) {
  const left = String(candidate || '').trim().toLowerCase().replace(/^\./, '');
  const right = String(expected || '').trim().toLowerCase().replace(/^\./, '');
  if (!left || !right) {
    return false;
  }
  return left === right || left.endsWith(`.${right}`) || right.endsWith(`.${left}`);
}

async function getDevtoolsWsUrl(port, preferredDomain = '') {
  const payload = await fetchJson(`http://127.0.0.1:${port}/json`, {}, 4000);
  const pages = Array.isArray(payload.data) ? payload.data : [];
  let page = null;
  const expected = String(preferredDomain || '').trim().toLowerCase();
  if (expected) {
    page = pages.find((item) => {
      if (item?.type !== 'page' || !item?.webSocketDebuggerUrl || !item?.url) {
        return false;
      }
      try {
        return isDomainMatchForFilter(new URL(String(item.url)).hostname, expected);
      } catch {
        return false;
      }
    }) || null;
  }
  if (!page) {
    page = pages.find((item) => item?.type === 'page' && item?.webSocketDebuggerUrl) || pages.find((item) => item?.webSocketDebuggerUrl);
  }
  if (!page?.webSocketDebuggerUrl) {
    throw new Error('未找到可用的 DevTools 页面连接');
  }
  return page.webSocketDebuggerUrl;
}

async function readCookiesViaCdp(port, preferredDomain = '') {
  const wsUrl = await getDevtoolsWsUrl(port, preferredDomain);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'click2save-cdp-read-'));
  const payloadFile = path.join(tempDir, 'payload.json');
  const script = [
    "param([string]$payloadPath)",
    "$ErrorActionPreference='Stop'",
    "$ProgressPreference='SilentlyContinue'",
    "$ws=$null",
    "$enc=[Text.Encoding]::UTF8",
    "function Write-Json($obj){ [Console]::Out.Write(($obj | ConvertTo-Json -Depth 16 -Compress)) }",
    "function Send-Cdp($method,$params){",
    "  $script:msgId++",
    "  $body=@{id=$script:msgId;method=$method;params=$params} | ConvertTo-Json -Depth 16 -Compress",
    "  $bytes=$enc.GetBytes($body)",
    "  $seg=[ArraySegment[byte]]::new($bytes)",
    "  $ws.SendAsync($seg,[System.Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()",
    "  while($true){",
    "    $buffer=New-Object byte[] 524288",
    "    $ms=New-Object IO.MemoryStream",
    "    do {",
    "      $res=$ws.ReceiveAsync([ArraySegment[byte]]::new($buffer),[Threading.CancellationToken]::None).GetAwaiter().GetResult()",
    "      if($res.Count -gt 0){ $ms.Write($buffer,0,$res.Count) }",
    "    } while(-not $res.EndOfMessage)",
    "    $text=$enc.GetString($ms.ToArray())",
    "    if(-not $text){ continue }",
    "    $obj=$text | ConvertFrom-Json",
    "    if($obj.id -eq $script:msgId){ return $obj }",
    "  }",
    "}",
    "try {",
    "  $payload=Get-Content -LiteralPath $payloadPath -Raw | ConvertFrom-Json",
    "  $ws=New-Object System.Net.WebSockets.ClientWebSocket",
    "  $uri=[Uri]$payload.wsUrl",
    "  $ws.ConnectAsync($uri,[Threading.CancellationToken]::None).GetAwaiter().GetResult()",
    "  $script:msgId=0",
    "  [void](Send-Cdp 'Network.enable' @{})",
    "  $resp=Send-Cdp 'Network.getAllCookies' @{}",
    "  $items=@()",
    "  if($resp.result -and $resp.result.cookies){ $items=@($resp.result.cookies) }",
    "  Write-Json @{cookies=$items}",
    "} catch {",
    "  $message='CDP cookie read failed'",
    "  if($_.Exception -and $_.Exception.Message){ $message=[string]$_.Exception.Message }",
    "  Write-Json @{error=$message;cookies=@()}",
    "} finally {",
    "  if($ws -and (($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) -or ($ws.State -eq [System.Net.WebSockets.WebSocketState]::CloseReceived))){",
    "    try { $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure,'done',[Threading.CancellationToken]::None).GetAwaiter().GetResult() } catch {}",
    "  }",
    "  if($ws){ $ws.Dispose() }",
    "}"
  ].join('\r\n');
  try {
    fs.writeFileSync(payloadFile, JSON.stringify({ wsUrl }), 'utf8');
    const stdout = await execPowerShell(script, [payloadFile]);
    const parsed = JSON.parse(String(stdout || '').trim() || '{}');
    if (parsed?.error) {
      throw new Error(String(parsed.error));
    }
    return ensureArray(parsed?.cookies);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

async function runCdpScript(payload) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'click2save-cdp-'));
  const payloadFile = path.join(tempDir, 'payload.json');
  const script = [
    "param([string]$payloadPath)",
    "$ErrorActionPreference='Stop'",
    "$ProgressPreference='SilentlyContinue'",
    "$ws=$null",
    "$enc=[Text.Encoding]::UTF8",
    "function Write-Json($obj){ [Console]::Out.Write(($obj | ConvertTo-Json -Depth 16 -Compress)) }",
    "function Send-Cdp($method,$params){",
    "  $script:msgId++",
    "  $body=@{id=$script:msgId;method=$method;params=$params} | ConvertTo-Json -Depth 16 -Compress",
    "  $bytes=$enc.GetBytes($body)",
    "  $seg=[ArraySegment[byte]]::new($bytes)",
    "  $ws.SendAsync($seg,[System.Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()",
    "  while($true){",
    "    $buffer=New-Object byte[] 262144",
    "    $ms=New-Object IO.MemoryStream",
    "    do {",
    "      $res=$ws.ReceiveAsync([ArraySegment[byte]]::new($buffer),[Threading.CancellationToken]::None).GetAwaiter().GetResult()",
    "      if($res.Count -gt 0){ $ms.Write($buffer,0,$res.Count) }",
    "    } while(-not $res.EndOfMessage)",
    "    $text=$enc.GetString($ms.ToArray())",
    "    if(-not $text){ continue }",
    "    $obj=$text | ConvertFrom-Json",
    "    if($obj.id -eq $script:msgId){ return $obj }",
    "  }",
    "}",
    "function Copy-Map($map){ $copy=@{}; foreach($key in $map.Keys){ $copy[$key]=$map[$key] }; return $copy }",
    "function Remove-Keys($map,[string[]]$keys){ $copy=Copy-Map $map; foreach($key in $keys){ if($copy.ContainsKey($key)){ [void]$copy.Remove($key) } }; return $copy }",
    "function Get-CdpError($resp){",
    "  if($resp.error){",
    "    if($resp.error.message){ return [string]$resp.error.message }",
    "    if($resp.error.code){ return [string]$resp.error.code }",
    "    return 'CDP error'",
    "  }",
    "  if($resp.result -and $resp.result.success -eq $false){",
    "    if($resp.result.errorText){ return [string]$resp.result.errorText }",
    "    return 'Network.setCookie returned success=false'",
    "  }",
    "  return ''",
    "}",
    "function Invoke-SetCookie($params){",
    "  $lastError=''",
    "  $attempts=New-Object System.Collections.Generic.List[hashtable]",
    "  $attempts.Add((Copy-Map $params))",
    "  if($params.ContainsKey('domain') -and [string]$params.domain -and [string]$params.domain.StartsWith('.')){",
    "    $trimmed=Copy-Map $params",
    "    $trimmed.domain=([string]$trimmed.domain).Substring(1)",
    "    $attempts.Add($trimmed)",
    "  }",
    "  $reduced=Remove-Keys $params @('partitionKey','sourceScheme','sourcePort')",
    "  $attempts.Add($reduced)",
    "  if($reduced.ContainsKey('domain') -and [string]$reduced.domain -and [string]$reduced.domain.StartsWith('.')){",
    "    $trimmedReduced=Copy-Map $reduced",
    "    $trimmedReduced.domain=([string]$trimmedReduced.domain).Substring(1)",
    "    $attempts.Add($trimmedReduced)",
    "  }",
    "  $urlOnly=Remove-Keys $reduced @('domain','sameSite')",
    "  $attempts.Add($urlOnly)",
    "  foreach($attempt in $attempts){",
    "    if(((-not $attempt.ContainsKey('domain')) -or (-not [string]$attempt.domain)) -and ((-not $attempt.ContainsKey('url')) -or (-not [string]$attempt.url))){ continue }",
    "    $resp=Send-Cdp 'Network.setCookie' $attempt",
    "    if($resp.result.success){ return @{success=$true; error=''} }",
    "    $err=Get-CdpError $resp",
    "    if($err){ $lastError=$err }",
    "  }",
    "  if(-not $lastError){ $lastError='Network.setCookie returned success=false' }",
    "  return @{success=$false; error=$lastError}",
    "}",
    "try {",
    "  $payload=Get-Content -LiteralPath $payloadPath -Raw | ConvertFrom-Json",
    "  $cookies=@($payload.cookies)",
    "  $ws=New-Object System.Net.WebSockets.ClientWebSocket",
    "  $uri=[Uri]$payload.wsUrl",
    "  $ws.ConnectAsync($uri,[Threading.CancellationToken]::None).GetAwaiter().GetResult()",
    "  $script:msgId=0",
    "  [void](Send-Cdp 'Network.enable' @{})",
    "  [void](Send-Cdp 'Page.enable' @{})",
    "  $ok=0",
    "  $fail=0",
    "  $errors=New-Object System.Collections.Generic.List[string]",
    "  foreach($cookie in $cookies){",
    "    $pathValue='/'",
    "    if($cookie.path){ $pathValue=[string]$cookie.path }",
    "    $params=@{",
    "      name=[string]$cookie.name;",
    "      value=[string]$cookie.value;",
    "      path=$pathValue;",
    "      secure=[bool]$cookie.secure;",
    "      httpOnly=[bool]$cookie.httpOnly",
    "    }",
    "    if($cookie.url){ $params.url=[string]$cookie.url }",
    "    if($cookie.domain){ $params.domain=[string]$cookie.domain }",
    "    if($cookie.expiry){ $params.expires=[double]$cookie.expiry }",
    "    if($cookie.sameSite){ $params.sameSite=[string]$cookie.sameSite }",
    "    if($cookie.sourceScheme -ne $null -and $cookie.sourceScheme -ne ''){ $params.sourceScheme=[string]$cookie.sourceScheme }",
    "    if($cookie.sourcePort -ne $null -and $cookie.sourcePort -ne '' -and [int]$cookie.sourcePort -ge 0){ $params.sourcePort=[int]$cookie.sourcePort }",
    "    if($cookie.isPartitioned -and $cookie.topFrameSiteKey){ $params.partitionKey=@{topLevelSite=[string]$cookie.topFrameSiteKey} }",
    "    if($payload.overwriteExisting){",
    "      try {",
    "        if($params.url){ [void](Send-Cdp 'Network.deleteCookies' @{name=$params.name; url=$params.url}) }",
    "        if($params.domain){ [void](Send-Cdp 'Network.deleteCookies' @{name=$params.name; domain=$params.domain; path=$params.path}) }",
    "      } catch {}",
    "    }",
    "    $setResult=Invoke-SetCookie $params",
    "    if($setResult.success){",
    "      $ok++",
    "    } else {",
    "      $fail++",
    "      if($setResult.error -and -not $errors.Contains([string]$setResult.error)){ $errors.Add([string]$setResult.error) }",
    "    }",
    "  }",
    "  if($payload.url){ [void](Send-Cdp 'Page.navigate' @{url=[string]$payload.url}) }",
    "  Write-Json @{ok=$ok;fail=$fail;errors=@($errors)}",
    "} catch {",
    "  $message='CDP script failed'",
    "  if($_.Exception -and $_.Exception.Message){ $message=[string]$_.Exception.Message }",
    "  Write-Json @{ok=0;fail=0;errors=@($message)}",
    "} finally {",
    "  if($ws -and (($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) -or ($ws.State -eq [System.Net.WebSockets.WebSocketState]::CloseReceived))){",
    "    try { $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure,'done',[Threading.CancellationToken]::None).GetAwaiter().GetResult() } catch {}",
    "  }",
    "  if($ws){ $ws.Dispose() }",
    "}"
  ].join('\r\n');
  try {
    fs.writeFileSync(payloadFile, JSON.stringify(payload), 'utf8');
    const stdout = await execPowerShell(script, [payloadFile]);
    const text = String(stdout || '').trim();
    try {
      return JSON.parse(text || '{}');
    } catch {
      const match = text.match(/\{[\s\S]*\}$/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return { ok: 0, fail: 0, errors: [text || 'CDP 脚本未返回有效 JSON'] };
    }
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

async function injectCookies(port, url, cookies) {
  const normalized = ensureArray(cookies).map((item) => normalizeCookie(item, url));
  if (!normalized.length) {
    return { ok: false, message: '没有可注入的 Cookie' };
  }
  const wsUrl = await getDevtoolsWsUrl(port);
  const result = await runCdpScript({ wsUrl, url: String(url || ''), cookies: normalized, overwriteExisting: true });
  const okCount = Number(result?.ok || 0);
  const failCount = Number(result?.fail || 0);
  const errors = ensureArray(result?.errors).map((item) => String(item || '').trim()).filter(Boolean);
  if (!okCount) {
    return { ok: false, message: errors.length ? `全部 Cookie 注入失败: ${errors[0]}` : '全部 Cookie 注入失败' };
  }
  return {
    ok: true,
    message: failCount
      ? `成功注入 ${okCount} 条，失败 ${failCount} 条${errors.length ? `，首个错误: ${errors[0]}` : ''}`
      : `成功注入 ${okCount} 条`
  };
}

async function dbWriteCookies(cookieDbPath, cookies, userDataDir) {
  const masterKey = await getMasterKey(userDataDir);
  const pragmaRows = await sqliteReadJson(cookieDbPath, 'PRAGMA table_info(cookies)');
  const columns = new Set(pragmaRows.map((item) => String(item?.name || '')));
  const normalized = ensureArray(cookies).map((item) => normalizeCookie(item));
  if (!normalized.length) {
    return { ok: false, message: '没有可写入的 Cookie' };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'click2save-dbwrite-'));
  const tempDb = path.join(tempDir, path.basename(cookieDbPath));
  try {
    fs.copyFileSync(cookieDbPath, tempDb);
    const statements = ['BEGIN TRANSACTION;'];
    let count = 0;
    for (const cookie of normalized) {
      const encryptedValue = encryptCookieValue(masterKey, cookie.value);
      const valuesMap = {
        creation_utc: String(webkitNow()),
        host_key: `'${escapeSqlText(cookie.domain)}'`,
        name: `'${escapeSqlText(cookie.name)}'`,
        value: `''`,
        encrypted_value: `X'${encryptedValue.toString('hex').toUpperCase()}'`,
        path: `'${escapeSqlText(cookie.path || '/')}'`,
        expires_utc: String(cookie.expiry ? unixToWebkit(cookie.expiry) : 0),
        is_secure: cookie.secure ? '1' : '0',
        is_httponly: cookie.httpOnly ? '1' : '0',
        last_access_utc: String(webkitNow()),
        has_expires: cookie.expiry ? '1' : '0',
        is_persistent: cookie.expiry ? '1' : '0',
        priority: '1',
        samesite: String(sameSiteToDbValue(cookie.sameSite)),
        source_scheme: String(cookie.sourceScheme ?? (cookie.secure ? 2 : 1)),
        source_port: String(cookie.sourcePort ?? -1),
        is_partitioned: cookie.isPartitioned ? '1' : '0',
        top_frame_site_key: `'${escapeSqlText(cookie.topFrameSiteKey || '')}'`,
        has_cross_site_ancestor: cookie.hasCrossSiteAncestor ? '1' : '0'
      };
      statements.push(
        `DELETE FROM cookies WHERE host_key='${escapeSqlText(cookie.domain)}' AND name='${escapeSqlText(cookie.name)}' AND path='${escapeSqlText(cookie.path || '/')}';`
      );
      const insertColumns = Object.keys(valuesMap).filter((key) => columns.has(key));
      const insertValues = insertColumns.map((key) => valuesMap[key]);
      statements.push(`INSERT INTO cookies (${insertColumns.join(',')}) VALUES (${insertValues.join(',')});`);
      count += 1;
    }
    statements.push('COMMIT;');
    await sqliteApplySql(tempDb, statements.join('\n'));
    fs.copyFileSync(tempDb, cookieDbPath);
    return { ok: true, count, message: `已写入 ${count} 条 Cookie` };
  } catch (error) {
    return { ok: false, message: error.message || 'Cookie 数据库写入失败' };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

async function launchSelfBuiltBrowser(port, userDataDir, url = '', cfg = {}) {
  if (port && await isPortOpen(port)) {
    return '';
  }
  const chromePath = resolveSelfBuiltChromePath(cfg);
  if (!chromePath) {
    return '未找到本机 Chrome，请确认已安装';
  }
  fs.mkdirSync(userDataDir, { recursive: true });
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--remote-allow-origins=*'
  ];
  if (url) {
    args.push(url);
  }
  spawnDetached(chromePath, args);
  for (let index = 0; index < 30; index += 1) {
    if (await isPortOpen(port)) {
      return '';
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return `浏览器启动超时，端口 ${port} 未就绪`;
}

async function openNewSelfBuiltBrowser(portValue, cfg = {}, url = '') {
  const port = Number.parseInt(String(portValue || '').trim(), 10);
  if (!Number.isInteger(port) || port < 1000 || port > 65535) {
    return { ok: false, message: '端口必须是 1000-65535 之间的整数' };
  }
  const userDataDir = buildSelfBuiltUserDataDir(cfg, port);
  const launchError = await launchSelfBuiltBrowser(port, userDataDir, normalizeUrl(url), cfg);
  if (launchError) {
    return { ok: false, message: launchError };
  }
  return {
    ok: true,
    port,
    userDataDir,
    message: `已打开自建浏览器，端口 ${port}`
  };
}

function openUrlWithSystemChrome(url, profileName = '', userDataDir = '') {
  const chromePath = findChromePath();
  if (!chromePath) {
    return false;
  }
  const args = [];
  if (userDataDir) {
    args.push(`--user-data-dir=${userDataDir}`);
  }
  if (profileName) {
    args.push(`--profile-directory=${profileName}`);
  }
  args.push(url);
  spawnDetached(chromePath, args);
  return true;
}

async function findCookieDbForPort(port) {
  try {
    const payload = await fetchJson(`http://127.0.0.1:${port}/json/version`, {}, 3000);
    const userDataDir = String(payload?.data?.userDataDir || '');
    const cookieDbPath = getCookiePath(path.join(userDataDir, 'Default')) || getCookiePath(userDataDir);
    return {
      cookieDbPath,
      userDataDir
    };
  } catch {
    return { cookieDbPath: '', userDataDir: '' };
  }
}

function findCookieDbForUserDataDir(userDataDir) {
  const cookieDbPath = getCookiePath(path.join(userDataDir, 'Default')) || getCookiePath(userDataDir);
  return { cookieDbPath, userDataDir };
}

async function listInjectTargets(cfg, selfBuiltRoot) {
  const results = [];
  results.push(...listChromeProfiles());
  for (const item of listSelfBuiltProfiles(selfBuiltRoot || resolveSelfBuiltRoot(cfg))) {
    const isOpen = item.port ? await isPortOpen(item.port) : false;
    if (isOpen) {
      results.push({
        ...item,
        type: 'self_built',
        is_open: true
      });
    }
  }
  try {
    const openPorts = await bitGetOpenPorts(cfg);
    for (const item of await bitGetBrowsers(cfg)) {
      const browserId = String(item?.id || '');
      if (!Object.prototype.hasOwnProperty.call(openPorts, browserId)) {
        continue;
      }
      results.push({
        type: 'bitbrowser',
        id: browserId,
        name: String(item?.name || browserId),
        display_name: String(item?.name || browserId),
        browser_id: browserId,
        port: Number.parseInt(String(openPorts[browserId] || ''), 10) || 0,
        user_data_dir: '',
        is_open: true
      });
    }
  } catch {}
  return results;
}

async function defaultOpen(card, cfg) {
  const source = card?.browserSource || card?.browser_source || {};
  const srcType = String(source?.type || '');
  const url = normalizeUrl(card?.openUrl || card?.open_url || card?.url || '', card?.domain || '');
  const cookies = ensureArray(card?.cookies);

  if (srcType === 'chrome_profile') {
    const ok = openUrlWithSystemChrome(url, source.profileName || source.profile_name || '', source.userDataDir || source.user_data_dir || '');
    return { ok, message: ok ? '已用系统 Chrome 打开' : '未找到系统 Chrome' };
  }
  if (srcType === 'self_built') {
    const port = Number(source.port || 0);
    const userDataDir = String(source.userDataDir || source.user_data_dir || '');
    const running = port ? await isPortOpen(port) : false;
    if (!running) {
      const dbPath = getCookiePath(path.join(userDataDir, 'Default')) || getCookiePath(userDataDir);
      if (dbPath) {
        const writeResult = await dbWriteCookies(dbPath, cookies, userDataDir);
        if (writeResult.ok) {
          const launchError = await launchSelfBuiltBrowser(port, userDataDir, url, cfg);
          if (launchError) {
            return { ok: false, message: launchError };
          }
          return { ok: true, message: `${writeResult.message}，并已打开自建浏览器` };
        }
      }
    }
    const launchError = await launchSelfBuiltBrowser(port, userDataDir, '', cfg);
    if (launchError) {
      return { ok: false, message: launchError };
    }
    return injectCookies(port, url, cookies);
  }
  if (srcType === 'bitbrowser') {
    const browserId = String(source.browserId || source.browser_id || '');
    const opened = await bitOpenBrowser(cfg, browserId);
    if (!opened?.port) {
      return { ok: false, message: '打开比特浏览器失败' };
    }
    return injectCookies(opened.port, url, cookies);
  }
  return { ok: false, message: `未知来源类型: ${srcType}` };
}

async function injectOpen(card, cfg) {
  const source = card?.browserSource || card?.browser_source || {};
  const srcType = String(source?.type || '');
  const url = normalizeUrl(card?.openUrl || card?.open_url || card?.url || '', card?.domain || '');
  const cookies = ensureArray(card?.cookies);

  if (srcType === 'chrome_profile') {
    const userDataDir = String(source.userDataDir || source.user_data_dir || '');
    const profileName = String(source.profileName || source.profile_name || '');
    const cookieDbPath = getCookiePath(path.join(userDataDir, profileName));
    if (!cookieDbPath) {
      return { ok: false, message: '未找到系统 Chrome Cookie 数据库' };
    }
    const writeResult = await dbWriteCookies(cookieDbPath, cookies, userDataDir);
    if (!writeResult.ok) {
      return writeResult;
    }
    const opened = openUrlWithSystemChrome(url, profileName, userDataDir);
    return {
      ok: true,
      message: `${writeResult.message}${opened ? '，并已打开系统 Chrome' : '，但未能自动打开系统 Chrome'}`
    };
  }
  if (srcType === 'self_built' || srcType === 'bitbrowser') {
    return defaultOpen(card, cfg);
  }
  return { ok: false, message: `未知来源类型: ${srcType}` };
}

async function injectToTarget(card, target, method, cfg) {
  const url = normalizeUrl(card?.openUrl || card?.open_url || card?.url || '', card?.domain || '');
  const cookies = ensureArray(card?.cookies);
  const type = String(target?.type || '');

  if (type === 'chrome_profile') {
    const userDataDir = String(target?.user_data_dir || target?.userDataDir || '');
    const profileName = String(target?.profile_name || target?.profileName || '');
    const cookieDbPath = getCookiePath(path.join(userDataDir, profileName));
    if (!cookieDbPath) {
      return { ok: false, message: `找不到 Profile ${profileName} 的 Cookie 数据库` };
    }
    const writeResult = await dbWriteCookies(cookieDbPath, cookies, userDataDir);
    if (!writeResult.ok) {
      return writeResult;
    }
    return { ok: true, message: `已向系统 Chrome Profile 写入 ${writeResult.count} 条 Cookie` };
  }

  let port = Number(target?.port || 0);
  const userDataDir = String(target?.user_data_dir || target?.userDataDir || '');
  if (method === 'db_write') {
    let resolved = port ? await findCookieDbForPort(port) : { cookieDbPath: '', userDataDir: '' };
    if (!resolved.cookieDbPath && userDataDir) {
      resolved = findCookieDbForUserDataDir(userDataDir);
    }
    if (!resolved.cookieDbPath) {
      return { ok: false, message: '找不到目标浏览器 Cookie 数据库' };
    }
    const writeResult = await dbWriteCookies(resolved.cookieDbPath, cookies, resolved.userDataDir || userDataDir);
    if (!writeResult.ok) {
      return writeResult;
    }
    return { ok: true, message: `已写入 ${writeResult.count} 条 Cookie，重启目标浏览器后生效` };
  }

  if (type === 'self_built' && !port) {
    port = Number(target?.port || 0);
    const launchError = await launchSelfBuiltBrowser(port, userDataDir, '', cfg);
    if (launchError) {
      return { ok: false, message: launchError };
    }
  }

  if (type === 'bitbrowser' && !port) {
    const browserId = String(target?.id || target?.browser_id || target?.browserId || '');
    const opened = await bitOpenBrowser(cfg, browserId);
    if (!opened?.port) {
      return { ok: false, message: '打开比特浏览器环境失败' };
    }
    port = opened.port;
  }

  if (!port) {
    return { ok: false, message: '目标浏览器未运行，无法执行注入' };
  }
  return injectCookies(port, url, cookies);
}

async function runBrowserCommand(command, payload = {}) {
  const cfg = payload.cfg || {};
  const sourceType = String(payload.sourceType || '');
  const sourceId = String(payload.sourceId || '');
  const selfBuiltRoot = String(payload.selfBuiltRoot || '').trim();
  if (command === 'list-offline-sources') {
    return { ok: true, results: await listOfflineSources(cfg, selfBuiltRoot) };
  }
  if (command === 'load-offline-groups') {
    return {
      ok: true,
      results: await loadOfflineGroups(cfg, sourceType, sourceId, !!payload.filterAuth, !!payload.mergeDomain, selfBuiltRoot)
    };
  }
  if (command === 'build-import-cards') {
    return {
      ok: true,
      results: buildImportCards(cfg, sourceType, sourceId, ensureArray(payload.groups || JSON.parse(payload.domainsJson || '[]')))
    };
  }
  if (command === 'default-open') {
    return defaultOpen(payload.card || JSON.parse(payload.cardJson || '{}'), cfg);
  }
  if (command === 'inject-open') {
    return injectOpen(payload.card || JSON.parse(payload.cardJson || '{}'), cfg);
  }
  if (command === 'list-inject-targets') {
    return { ok: true, results: await listInjectTargets(cfg, selfBuiltRoot) };
  }
  if (command === 'open-self-built-browser') {
    return openNewSelfBuiltBrowser(payload.port, cfg, payload.url || '');
  }
  if (command === 'inject-to-target') {
    return injectToTarget(
      payload.card || JSON.parse(payload.cardJson || '{}'),
      payload.target || JSON.parse(payload.targetJson || '{}'),
      payload.method === 'db_write' ? 'db_write' : 'inject',
      cfg
    );
  }
  if (command === 'refresh-card-cookies') {
    return refreshCardCookies(payload.card || JSON.parse(payload.cardJson || '{}'), cfg);
  }
  throw new Error(`未知命令: ${command}`);
}

module.exports = {
  runBrowserCommand,
  scanBrowserCards,
  listSelfBuiltProfiles
};
