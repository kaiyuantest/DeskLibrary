const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
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

/**
 * 去掉 PowerShell 误写入 success 流的杂项（如 VoidTaskResult、Write 返回值等），定位首个 JSON 对象起点。
 */
function stripLeadingNonJsonNoise(text) {
  const s = String(text || '');
  const m = s.match(/\{\s*"(?:cookies|error|ok)"\s*:/);
  if (m && m.index > 0) {
    return s.slice(m.index).trimStart();
  }
  if (m && m.index === 0) {
    return s.trimStart();
  }
  const brace = s.indexOf('{');
  if (brace > 0) {
    return s.slice(brace).trimStart();
  }
  return s;
}

/**
 * 解析 CDP PowerShell 脚本写到 stdout 的 JSON。
 * 部分环境下 Task/GetResult、MemoryStream.Write 等返回值会混入 stdout，需在解析前剥离。
 */
function parseCdpScriptStdoutJson(raw, contextLabel = 'CDP') {
  let text = String(raw || '').replace(/^\uFEFF/, '').trim();
  text = stripLeadingNonJsonNoise(text);
  if (!text) {
    throw new Error(`${contextLabel} 脚本无输出`);
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (!line.startsWith('{')) {
      continue;
    }
    try {
      return JSON.parse(line);
    } catch {
      /* 尝试更上一行 */
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    const idx = text.indexOf('{');
    if (idx >= 0) {
      const tail = text.slice(idx).trim();
      const match = tail.match(/\{[\s\S]*\}\s*$/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          /* fall through */
        }
      }
    }
    const snippet = text.slice(0, 280).replace(/\s+/g, ' ');
    throw new Error(`${contextLabel} 输出不是合法 JSON。片段: ${snippet}`);
  }
}

async function withTempCopy(filePath, callback) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'click2save-db-'));
  const tempFile = path.join(tempDir, path.basename(filePath));
  try {
    try {
      fs.copyFileSync(filePath, tempFile);
    } catch (err) {
      const code = err && err.code;
      if (code === 'EBUSY' || code === 'EPERM' || code === 'EACCES') {
        throw new Error(
          'Cookie 数据库正被浏览器占用，无法复制本地文件。请关闭该浏览器后重试；若需浏览器保持打开，请使用分组旁的「在线导入」通过 CDP 提取。'
        );
      }
      throw err;
    }
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

function isPortOpenOnHost(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {}
      resolve(value);
    };
    socket.setTimeout(450);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

/** 本机调试端口：先试 IPv4 再试 IPv6（部分 Chromium 只监听 ::1） */
async function isPortOpen(port) {
  if (await isPortOpenOnHost(port, '127.0.0.1')) {
    return true;
  }
  return isPortOpenOnHost(port, '::1');
}

function httpGetJson(urlStr, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(urlStr);
    } catch (err) {
      reject(err);
      return;
    }
    const isHttps = u.protocol === 'https:';
    const lib = isHttps ? https : http;
    const opts = {
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: `${u.pathname}${u.search}`,
      method: 'GET',
      timeout: timeoutMs
    };
    const req = lib.request(opts, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        let data = {};
        try {
          const raw = stripJsonBom(body).trim();
          data = raw ? JSON.parse(raw) : {};
        } catch {
          data = {};
        }
        resolve({
          ok: !!(res.statusCode && res.statusCode < 400),
          status: res.statusCode || 0,
          data,
          text: body
        });
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.on('error', reject);
    req.end();
  });
}

function stripJsonBom(text) {
  return String(text || '').replace(/^\uFEFF/, '');
}

/** DevTools /json 返回 JSON 数组；httpGetJson 失败解析时 data 可能为空，需从 text 再解一次 */
function cdpJsonTargetsFromPayload(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  try {
    const raw = stripJsonBom(payload.text || '').trim();
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const CDP_LOCAL_HOSTS = ['127.0.0.1', 'localhost', '[::1]'];
const CDP_ONLINE_IMPORT_PORT_MIN = 9000;
const CDP_ONLINE_IMPORT_PORT_MAX = 10001;

async function fetchJson(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data = {};
    try {
      const raw = stripJsonBom(text).trim();
      data = raw ? JSON.parse(raw) : {};
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

async function loadSourceCookies(cfg, sourceType, sourceId, options = {}) {
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
    const explicitPort = Number(options.debugPort || options.port || 0);
    const preferredDomain = String(options.preferredDomain || '').trim();
    const cdpPort = await resolveSelfBuiltCdpPort(String(sourceId || ''), explicitPort);
    if (cdpPort) {
      // 浏览器正在运行：必须使用 CDP 读取（数据库文件被锁定）
      return await readCookiesViaCdp(cdpPort, preferredDomain);
    }
    // 浏览器未运行，从数据库读取
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

function extractPortFromUserDataDir(userDataDir) {
  // 从路径中提取端口号，例如 chrome_user_data_port_9222 -> 9222
  const match = String(userDataDir || '').match(/port[_-](\d+)/i);
  return match ? Number(match[1]) : 0;
}

function pathsEqualWin(a, b) {
  const left = String(a || '').trim();
  const right = String(b || '').trim();
  if (!left || !right) {
    return false;
  }
  try {
    return path.normalize(path.resolve(left)).toLowerCase() === path.normalize(path.resolve(right)).toLowerCase();
  } catch {
    return false;
  }
}

function normalizePathKeyForDedupe(p) {
  const s = String(p || '').trim();
  if (!s) {
    return '';
  }
  try {
    return path.normalize(path.resolve(s)).replace(/\\/g, '/').toLowerCase();
  } catch {
    return s.toLowerCase();
  }
}

function extractUserDataDirFromCdpVersionObject(d) {
  if (!d || typeof d !== 'object') {
    return '';
  }
  const direct = String(d.userDataDir || d.UserDataDir || d.user_data_dir || '').trim();
  if (direct) {
    return direct;
  }
  for (const v of Object.values(d)) {
    if (typeof v !== 'string') {
      continue;
    }
    const t = v.trim();
    if (t.length > 6 && (t.includes('\\') || t.includes('/')) && /User Data|chrome|Chromium|chromium|profile|AppData/i.test(t)) {
      return t;
    }
  }
  return '';
}

/** 与仅 normalize 相等相比更宽松：处理 Chrome 上报路径与卡片路径略有差异、或目录名一致等情况 */
function pathsLikelySameChromeUserData(a, b) {
  if (pathsEqualWin(a, b)) {
    return true;
  }
  const na = normalizePathKeyForDedupe(a);
  const nb = normalizePathKeyForDedupe(b);
  if (!na || !nb) {
    return false;
  }
  if (na === nb) {
    return true;
  }
  if (na.endsWith(nb) || nb.endsWith(na)) {
    return true;
  }
  const ba = path.basename(na);
  const bb = path.basename(nb);
  if (ba && ba === bb && /^chrome_user_data_port_/i.test(ba)) {
    return true;
  }
  return false;
}

/** 用 CDP HTTP /json/version 取 userDataDir（多主机 + http 直连，避免主进程 fetch 在本机调试端口上偶发失败） */
async function getUserDataDirFromDebugPort(port) {
  for (const host of CDP_LOCAL_HOSTS) {
    const url = `http://${host}:${port}/json/version`;
    let payload;
    try {
      payload = await httpGetJson(url, 4000);
    } catch {
      try {
        payload = await fetchJson(url, {}, 4000);
      } catch {
        continue;
      }
    }
    const udd = extractUserDataDirFromCdpVersionObject(payload?.data);
    if (udd) {
      return udd;
    }
  }
  return '';
}

/** 能拉取 /json 且含 webSocketDebuggerUrl 即视为 CDP 可用（部分内核不返回 userDataDir） */
async function hasCdpDevtoolsJson(port) {
  for (const host of CDP_LOCAL_HOSTS) {
    const url = `http://${host}:${port}/json`;
    try {
      const payload = await httpGetJson(url, 4000);
      const arr = cdpJsonTargetsFromPayload(payload);
      if (arr.some((item) => item && item.webSocketDebuggerUrl)) {
        return true;
      }
    } catch {
      try {
        const payload = await fetchJson(url, {}, 4000);
        const arr = cdpJsonTargetsFromPayload(payload);
        if (arr.some((item) => item && item.webSocketDebuggerUrl)) {
          return true;
        }
      } catch {
        /* 下一主机 */
      }
    }
  }
  return false;
}

/**
 * 与 cookie_manager v5 在线导入一致：在常用调试端口段内扫描，用 userDataDir 匹配当前 Chrome 实例。
 * Chromedriver 使用任意 --user-data-dir（如 E:\\...\\test）时，卡片上可能没有正确 port，仅靠路径无法推断。
 */
async function findDebugPortForUserDataDir(expectedUserDataDir, portHint = 0) {
  const expected = String(expectedUserDataDir || '').trim();
  if (!expected) {
    return 0;
  }
  const matchFromVersion = async (p) => {
    if (!p || !(await isPortOpen(p))) {
      return 0;
    }
    const verUdd = await getUserDataDirFromDebugPort(p);
    if (verUdd && (pathsEqualWin(verUdd, expected) || pathsLikelySameChromeUserData(verUdd, expected))) {
      return p;
    }
    if (!String(verUdd || '').trim() && (await hasCdpDevtoolsJson(p))) {
      const expectedPort = extractPortFromUserDataDir(expected);
      if (expectedPort && expectedPort === p) {
        return p;
      }
    }
    return 0;
  };
  const tryMatch = async (p) => {
    if (!p) {
      return 0;
    }
    return matchFromVersion(p);
  };
  const hint = Number(portHint || 0);
  if (hint > 0) {
    const hit = await tryMatch(hint);
    if (hit) {
      return hit;
    }
  }
  const candidates = [];
  for (let p = CDP_ONLINE_IMPORT_PORT_MIN; p < CDP_ONLINE_IMPORT_PORT_MAX; p += 1) {
    if (p === hint) {
      continue;
    }
    candidates.push(p);
  }
  const openPorts = [];
  for (let i = 0; i < candidates.length; i += 36) {
    const batch = candidates.slice(i, i + 36);
    const hits = await Promise.all(batch.map(async (p) => ((await isPortOpen(p)) ? p : 0)));
    openPorts.push(...hits.filter(Boolean));
  }
  openPorts.sort((a, b) => a - b);
  for (const p of openPorts) {
    const hit = await matchFromVersion(p);
    if (hit) {
      return hit;
    }
  }
  return 0;
}

/**
 * 解析用于 CDP 的端口：优先「端口 + /json/version 的 userDataDir」与卡片一致；否则扫描端口段。
 */
async function resolveSelfBuiltCdpPort(userDataDir, explicitPort) {
  const udd = String(userDataDir || '').trim();
  const hint = Number(explicitPort || 0);
  if (udd) {
    const found = await findDebugPortForUserDataDir(udd, hint);
    if (found) {
      return found;
    }
  }
  // 卡片上已写调试端口且本机确有 CDP：许多 Chromium 不在 /json/version 里带 userDataDir，不能仅靠路径比对
  if (hint > 0 && (await hasCdpDevtoolsJson(hint))) {
    if (!udd) {
      return hint;
    }
    const verUdd = await getUserDataDirFromDebugPort(hint);
    if (!String(verUdd || '').trim()) {
      return hint;
    }
    if (pathsEqualWin(verUdd, udd) || pathsLikelySameChromeUserData(verUdd, udd)) {
      return hint;
    }
    // 卡片路径与 /json/version 返回的 user-data-dir 字符串不一致（中文路径编码、8.3 短路径、盘符大小写等），
    // 但目录名已含 port_9222 且与卡片上的调试端口一致、且该端口 CDP 可用 → 仍视为同一实例
    const portFromCardPath = extractPortFromUserDataDir(udd);
    if (portFromCardPath && portFromCardPath === hint) {
      return hint;
    }
  }
  const fromPath = extractPortFromUserDataDir(udd);
  if (fromPath && (await hasCdpDevtoolsJson(fromPath))) {
    const verUdd = await getUserDataDirFromDebugPort(fromPath);
    if (!udd || pathsEqualWin(verUdd, udd) || pathsLikelySameChromeUserData(verUdd, udd)) {
      return fromPath;
    }
    // /json/version 偶发取不到 userDataDir 时：路径中已含端口且该端口确有 CDP，视为同一实例
    if (!String(verUdd || '').trim() && /port[_-]\d+/i.test(udd)) {
      return fromPath;
    }
  }
  // 目录名端口与卡片端口一致且本机 TCP 可连：在 /json 偶发未识别时仍尝试该端口（后续 CDP 读失败会另有报错）
  const inferredPort = extractPortFromUserDataDir(udd);
  if (hint > 0 && inferredPort === hint && udd && (await isPortOpen(hint))) {
    return hint;
  }
  return 0;
}

/** 自建/卡片来源上的远程调试端口（兼容只存 debug_port 的旧数据） */
function browserSourceDebugPort(source = {}) {
  const raw = source.port ?? source.debugPort ?? source.debug_port;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** 点击「重」时对照：卡片上的 user-data-dir / 端口 vs 本机 CDP /json/version 回报的路径 */
async function buildRewriteSelfBuiltDebug(card, sourceId, source, effectiveDebugPort, resolvedCdpPort) {
  const udd = String(sourceId || '').trim();
  const liveUdd = resolvedCdpPort ? await getUserDataDirFromDebugPort(resolvedCdpPort) : '';
  let pathsOk = null;
  if (liveUdd && udd) {
    pathsOk = pathsEqualWin(liveUdd, udd) || pathsLikelySameChromeUserData(liveUdd, udd);
  } else if (!liveUdd && resolvedCdpPort) {
    pathsOk = null;
  }
  const portFromFolder = extractPortFromUserDataDir(udd) || 0;
  return {
    card_id: card?.id,
    card_name: card?.name || '',
    card_userDataDir: udd,
    card_port_fields_raw: {
      port: source?.port,
      debugPort: source?.debugPort,
      debug_port: source?.debug_port
    },
    effective_debug_port: effectiveDebugPort || 0,
    port_inferred_from_card_path: portFromFolder,
    folder_port_matches_card_debug_port:
      !!(portFromFolder && effectiveDebugPort && portFromFolder === effectiveDebugPort),
    resolved_cdp_port: resolvedCdpPort || 0,
    http_json_version_userDataDir: liveUdd || '(empty or unreadable)',
    card_path_matches_version_path: pathsOk,
    tcp_port_open_at_effective: effectiveDebugPort ? await isPortOpen(effectiveDebugPort) : false,
    hasCdp_at_effective_port: effectiveDebugPort ? await hasCdpDevtoolsJson(effectiveDebugPort) : false,
    hasCdp_at_resolved_port: resolvedCdpPort ? await hasCdpDevtoolsJson(resolvedCdpPort) : false,
    hint:
      pathsOk === false
        ? '当前调试端口上报的 user-data-dir 与卡片里存的字符串不完全一致（中文路径编码、短路径等常见）。若目录名含 chrome_user_data_port_ 且与卡片端口一致，解析仍会使用该端口。'
        : pathsOk === null && resolvedCdpPort
          ? '/json/version 未返回 userDataDir，已仅凭端口可用性判断；若仍异常请核对端口是否与该窗口一致。'
          : ''
  };
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

function cardPreferredDomainForCdp(card) {
  const rawUrl = String(card?.openUrl || card?.open_url || '').trim();
  if (/^https?:\/\//i.test(rawUrl)) {
    try {
      return new URL(rawUrl).hostname;
    } catch {}
  }
  return String(card?.domain || '').trim().replace(/^\./, '');
}

/** 与 refreshCardCookies 中域名命中规则一致（用于「更」「重」子集与合并时剔除旧条目） */
function cookieMatchesStoredDomainRow(item, targetDomain) {
  const td = String(targetDomain || '').trim().toLowerCase();
  if (!td) {
    return false;
  }
  const cookieDomain = String(item?.domain || '').trim().toLowerCase();
  return cookieDomain === td
    || cookieDomain.endsWith(td)
    || td.endsWith(cookieDomain.replace(/^\./, ''));
}

function cardTargetDomainForCookieFilter(card) {
  const fromField = String(card?.domain || '').trim().toLowerCase();
  if (fromField) {
    return fromField;
  }
  const host = String(cardPreferredDomainForCdp(card) || '').trim().toLowerCase();
  return host;
}

async function refreshCardCookies(card, cfg) {
  const { sourceType, sourceId } = getCardSourceIdentity(card);
  const source = card?.browserSource || card?.browser_source || {};
  const debugPort = browserSourceDebugPort(source);
  const preferredDomain = cardPreferredDomainForCdp(card);
  const rawList = ensureArray(
    await loadSourceCookies(cfg, sourceType, sourceId, { debugPort, preferredDomain })
  );
  const normalizedCookies = [];
  for (const item of rawList) {
    try {
      normalizedCookies.push(normalizeCookie(item));
    } catch {
      /* 跳过单条异常，避免整批刷新失败 */
    }
  }
  const targetDomain = String(card?.domain || '').trim().toLowerCase();
  const matchedCookies = targetDomain
    ? normalizedCookies.filter((item) => cookieMatchesStoredDomainRow(item, targetDomain))
    : normalizedCookies;

  // 与老项目一致：先全量拉取；域名过滤仅作「优选子集」。过滤为空时仍保存全量，避免假阴性。
  const finalCookies = matchedCookies.length ? matchedCookies : normalizedCookies;

  if (!finalCookies.length) {
    return {
      ok: false,
      message: `未从来源浏览器读取到 Cookie（${targetDomain || '当前'}）`
    };
  }

  const usedFullFallback = targetDomain && !matchedCookies.length && normalizedCookies.length > 0;
  const cookieNames = [...new Set(finalCookies.map((item) => item.name).filter(Boolean))];
  const message = usedFullFallback
    ? `已更新 ${finalCookies.length} 条 Cookie（域名「${targetDomain.replace(/^\.+/, '')}」未匹配到条目，已保存本次读取的全量）`
    : `已更新 ${finalCookies.length} 条 Cookie${matchedCookies.length && matchedCookies.length < normalizedCookies.length ? `（域名命中 ${matchedCookies.length} 条）` : ''}`;
  return {
    ok: true,
    cookies: finalCookies,
    cookieNames,
    cookieCount: finalCookies.length,
    message
  };
}

/**
 * 「重」：在可走 CDP 时（自建浏览器）按卡片站点在线读取 Network.getAllCookies，只取与卡片域名相关的条目，
 * 与卡上已有 Cookie 合并——同站点旧条目剔除后以本次在线结果为准，其它域名条目保留（便于后续注入）。
 * 非自建来源仍从当前来源读取后做同样按域合并（不做全量覆盖整卡）。
 */
async function rewriteBrowserCardCookies(card, cfg) {
  const { sourceType, sourceId } = getCardSourceIdentity(card);
  const source = card?.browserSource || card?.browser_source || {};
  const debugPort = browserSourceDebugPort(source);

  let rewriteDebug = null;
  if (sourceType === 'self_built') {
    const resolved = await resolveSelfBuiltCdpPort(String(sourceId || ''), debugPort);
    rewriteDebug = await buildRewriteSelfBuiltDebug(card, sourceId, source, debugPort, resolved);
    // eslint-disable-next-line no-console
    console.log('[Click2Save][重][自建] CDP/卡片对照', JSON.stringify(rewriteDebug, null, 2));
    if (!resolved) {
      return {
        ok: false,
        message:
          '「重」需该自建浏览器已打开并启用远程调试（CDP）。请先打开对应窗口（如 9222）并在其中登录目标站，再点此按钮以按域名在线提取并合并 Cookie。',
        rewriteDebug
      };
    }
  }

  const preferredDomain = cardPreferredDomainForCdp(card);
  const rawList = ensureArray(
    await loadSourceCookies(cfg, sourceType, sourceId, { debugPort, preferredDomain })
  );
  const normalizedCookies = [];
  for (const item of rawList) {
    try {
      normalizedCookies.push(normalizeCookie(item, String(card?.openUrl || card?.open_url || '').trim()));
    } catch {
      /* 跳过单条异常 */
    }
  }
  if (!normalizedCookies.length) {
    return {
      ok: false,
      message: '未从来源读取到 Cookie，请确认自建浏览器已开远程调试或比特已运行',
      rewriteDebug
    };
  }

  const targetDomain = cardTargetDomainForCookieFilter(card);
  if (!targetDomain) {
    return {
      ok: false,
      message: '卡片缺少站点域名或打开地址，无法只重写该站 Cookie。请编辑卡片填写域名或完整 URL。',
      rewriteDebug
    };
  }

  const matchedFresh = normalizedCookies.filter((item) => cookieMatchesStoredDomainRow(item, targetDomain));
  if (!matchedFresh.length) {
    const label = targetDomain.replace(/^\.+/, '');
    return {
      ok: false,
      message: `未从当前在线会话读取到「${label}」相关 Cookie。请在已附加的调试窗口中打开该站并完成登录后再点「重」；不做全站 Cookie 回退以免无法注入。`,
      rewriteDebug
    };
  }

  const existingRaw = ensureArray(card.cookies);
  const openUrl = String(card?.openUrl || card?.open_url || '').trim();
  const existingNorm = [];
  for (const item of existingRaw) {
    try {
      existingNorm.push(normalizeCookie(item, openUrl));
    } catch {
      /* 跳过单条异常 */
    }
  }
  const kept = existingNorm.filter((c) => !cookieMatchesStoredDomainRow(c, targetDomain));
  const merged = [...kept, ...matchedFresh];

  const cookieNames = [...new Set(merged.map((item) => item.name).filter(Boolean))];
  const label = targetDomain.replace(/^\.+/, '');
  return {
    ok: true,
    cookies: merged,
    cookieNames,
    cookieCount: merged.length,
    message: `已按「${label}」在线合并 ${matchedFresh.length} 条 Cookie（同站条目以本次为准），其余域名共保留 ${kept.length} 条`,
    rewriteDebug
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
  let pages = [];
  let lastErr = null;
  for (const host of CDP_LOCAL_HOSTS) {
    const url = `http://${host}:${port}/json`;
    try {
      const payload = await httpGetJson(url, 5000);
      const arr = cdpJsonTargetsFromPayload(payload);
      if (arr.length) {
        pages = arr;
        break;
      }
    } catch (e) {
      lastErr = e;
      try {
        const payload = await fetchJson(url, {}, 5000);
        const arr = cdpJsonTargetsFromPayload(payload);
        if (arr.length) {
          pages = arr;
          break;
        }
      } catch (e2) {
        lastErr = e2;
      }
    }
  }
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
    const extra = lastErr && lastErr.message ? ` (${String(lastErr.message)})` : '';
    throw new Error(`未找到可用的 DevTools 页面连接${extra}`);
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
    "  $seg=[System.ArraySegment[byte]]::new($bytes)",
    "  [void]($ws.SendAsync($seg,[System.Net.WebSockets.WebSocketMessageType]::Text,$true,[System.Threading.CancellationToken]::None).GetAwaiter().GetResult())",
    "  while($true){",
    "    $buffer=New-Object byte[] 524288",
    "    $ms=New-Object IO.MemoryStream",
    "    do {",
    "      $res=$ws.ReceiveAsync([System.ArraySegment[byte]]::new($buffer),[System.Threading.CancellationToken]::None).GetAwaiter().GetResult()",
    "      if($res.Count -gt 0){ [void]($ms.Write($buffer,0,$res.Count)) }",
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
    "  [void]($ws.ConnectAsync($uri,[System.Threading.CancellationToken]::None).GetAwaiter().GetResult())",
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
    "    try { [void]($ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure,'done',[System.Threading.CancellationToken]::None).GetAwaiter().GetResult()) } catch {}",
    "  }",
    "  if($ws){ $ws.Dispose() }",
    "}"
  ].join('\r\n');
  try {
    fs.writeFileSync(payloadFile, JSON.stringify({ wsUrl }), 'utf8');
    const stdout = await execPowerShell(script, [payloadFile]);
    const parsed = parseCdpScriptStdoutJson(stdout, '读取 Cookie');
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

/** 仅通过 CDP 导航，不写入 Cookie（避免「打开」卡片时用旧快照覆盖用户刚登录的会话） */
async function navigateViaCdp(port, preferredDomain, targetUrl) {
  const wsUrl = await getDevtoolsWsUrl(port, preferredDomain);
  const url = String(targetUrl || '').trim();
  if (!url) {
    return { ok: false, message: '缺少要打开的地址' };
  }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'click2save-cdp-nav-'));
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
    "  $seg=[System.ArraySegment[byte]]::new($bytes)",
    "  [void]($ws.SendAsync($seg,[System.Net.WebSockets.WebSocketMessageType]::Text,$true,[System.Threading.CancellationToken]::None).GetAwaiter().GetResult())",
    "  while($true){",
    "    $buffer=New-Object byte[] 262144",
    "    $ms=New-Object IO.MemoryStream",
    "    do {",
    "      $res=$ws.ReceiveAsync([System.ArraySegment[byte]]::new($buffer),[System.Threading.CancellationToken]::None).GetAwaiter().GetResult()",
    "      if($res.Count -gt 0){ [void]($ms.Write($buffer,0,$res.Count)) }",
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
    "  [void]($ws.ConnectAsync($uri,[System.Threading.CancellationToken]::None).GetAwaiter().GetResult())",
    "  $script:msgId=0",
    "  [void](Send-Cdp 'Page.enable' @{})",
    "  $tUrl=[string]$payload.targetUrl",
    "  if($tUrl){ [void](Send-Cdp 'Page.navigate' @{url=$tUrl}) }",
    "  Write-Json @{ok=$true}",
    "} catch {",
    "  $message='CDP navigate failed'",
    "  if($_.Exception -and $_.Exception.Message){ $message=[string]$_.Exception.Message }",
    "  Write-Json @{ok=$false;error=$message}",
    "} finally {",
    "  if($ws -and (($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) -or ($ws.State -eq [System.Net.WebSockets.WebSocketState]::CloseReceived))){",
    "    try { [void]($ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure,'done',[System.Threading.CancellationToken]::None).GetAwaiter().GetResult()) } catch {}",
    "  }",
    "  if($ws){ $ws.Dispose() }",
    "}"
  ].join('\r\n');
  try {
    fs.writeFileSync(payloadFile, JSON.stringify({ wsUrl, targetUrl: url }), 'utf8');
    const stdout = await execPowerShell(script, [payloadFile]);
    const parsed = parseCdpScriptStdoutJson(stdout, 'CDP 导航');
    if (parsed?.error) {
      return { ok: false, message: String(parsed.error) };
    }
    if (parsed && parsed.ok === false) {
      return { ok: false, message: String(parsed.error || '导航失败') };
    }
    return { ok: true, message: '已导航到目标页（未修改当前 Cookie）' };
  } catch (error) {
    return { ok: false, message: error && error.message ? error.message : 'CDP 导航失败' };
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
    "  $seg=[System.ArraySegment[byte]]::new($bytes)",
    "  [void]($ws.SendAsync($seg,[System.Net.WebSockets.WebSocketMessageType]::Text,$true,[System.Threading.CancellationToken]::None).GetAwaiter().GetResult())",
    "  while($true){",
    "    $buffer=New-Object byte[] 262144",
    "    $ms=New-Object IO.MemoryStream",
    "    do {",
    "      $res=$ws.ReceiveAsync([System.ArraySegment[byte]]::new($buffer),[System.Threading.CancellationToken]::None).GetAwaiter().GetResult()",
    "      if($res.Count -gt 0){ [void]($ms.Write($buffer,0,$res.Count)) }",
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
    "function Invoke-SetCookie($params,$cookieObj){",
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
    "  if($cookieObj -and $cookieObj.url){",
    "    $pureUrl=@{ name=[string]$params.name;value=[string]$params.value;path=[string]$params.path;secure=[bool]$params.secure;httpOnly=[bool]$params.httpOnly }",
    "    if($params.expires){ $pureUrl.expires=[double]$params.expires }",
    "    if($cookieObj.sameSite){ $pureUrl.sameSite=[string]$cookieObj.sameSite }",
    "    $pureUrl.url=[string]$cookieObj.url",
    "    $attempts.Add($pureUrl)",
    "  }",
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
    "  [void]($ws.ConnectAsync($uri,[System.Threading.CancellationToken]::None).GetAwaiter().GetResult())",
    "  $script:msgId=0",
    "  [void](Send-Cdp 'Network.enable' @{})",
    "  [void](Send-Cdp 'Page.enable' @{})",
    "  $getAllResp=Send-Cdp 'Network.getAllCookies' @{}",
    "  $existingCookies=@()",
    "  if($getAllResp.result -and $getAllResp.result.cookies){ $existingCookies=@($getAllResp.result.cookies) }",
    "  foreach($cookie in $cookies){",
    "    $targetDomain=[string]$cookie.domain",
    "    $targetName=[string]$cookie.name",
    "    $targetPath=if($cookie.path){ [string]$cookie.path } else { '/' }",
    "    foreach($existing in $existingCookies){",
    "      if(([string]$existing.domain -eq $targetDomain) -and ([string]$existing.name -eq $targetName) -and (([string]$existing.path -eq $targetPath) -or ((-not $existing.path -or $existing.path -eq '') -and $targetPath -eq '/'))){",
    "        $deleteParams=@{ name=[string]$existing.name; domain=[string]$existing.domain }",
    "        if($existing.path){ $deleteParams.path=[string]$existing.path }",
    "        [void](Send-Cdp 'Network.deleteCookies' $deleteParams)",
    "      }",
    "    }",
    "  }",
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
    "    if($cookie.domain){ $params.domain=[string]$cookie.domain }",
    "    elseif($cookie.url){ $params.url=[string]$cookie.url }",
    "    if($cookie.expiry){ $params.expires=[double]$cookie.expiry }",
    "    if($cookie.sameSite){ $params.sameSite=[string]$cookie.sameSite }",
    "    if($cookie.sourceScheme -ne $null -and $cookie.sourceScheme -ne ''){ $params.sourceScheme=[string]$cookie.sourceScheme }",
    "    if($cookie.sourcePort -ne $null -and $cookie.sourcePort -ne '' -and [int]$cookie.sourcePort -ge 0){ $params.sourcePort=[int]$cookie.sourcePort }",
    "    if($cookie.isPartitioned -and $cookie.topFrameSiteKey){ $params.partitionKey=@{topLevelSite=[string]$cookie.topFrameSiteKey} }",
    "    $setResult=Invoke-SetCookie $params $cookie",
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
    "    try { [void]($ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure,'done',[System.Threading.CancellationToken]::None).GetAwaiter().GetResult()) } catch {}",
    "  }",
    "  if($ws){ $ws.Dispose() }",
    "}"
  ].join('\r\n');
  try {
    fs.writeFileSync(payloadFile, JSON.stringify(payload), 'utf8');
    const stdout = await execPowerShell(script, [payloadFile]);
    try {
      return parseCdpScriptStdoutJson(stdout, 'CDP 注入');
    } catch (err) {
      return {
        ok: 0,
        fail: 0,
        errors: [String(err && err.message ? err.message : 'CDP 脚本未返回有效 JSON')]
      };
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
  const result = await runCdpScript({ wsUrl, url: String(url || ''), cookies: normalized });
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
      // 精确删除：只删除 domain + name + path 完全匹配的 Cookie
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
    const d = payload?.data || {};
    const userDataDir = String(d.userDataDir || d.UserDataDir || '');
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
    let port = browserSourceDebugPort(source);
    const userDataDir = String(source.userDataDir || source.user_data_dir || '');
    if (!port && userDataDir) {
      port = extractPortFromUserDataDir(userDataDir);
    }
    const running = port ? await isPortOpen(port) : false;
    
    // 如果浏览器未运行，直接启动，不写入 Cookie
    // 让浏览器使用它自己的 Cookie（用户可能已经重新登录）
    if (!running) {
      const launchError = await launchSelfBuiltBrowser(port, userDataDir, url, cfg);
      if (launchError) {
        return { ok: false, message: launchError };
      }
      return { ok: true, message: '已打开自建浏览器' };
    }
    // 浏览器已在运行：只导航到卡片地址，不把卡片里的 Cookie 快照写回（避免覆盖用户当前登录态）
    const pref = cardPreferredDomainForCdp(card);
    return navigateViaCdp(port, pref, url);
  }
  if (srcType === 'bitbrowser') {
    const browserId = String(source.browserId || source.browser_id || '');
    const opened = await bitOpenBrowser(cfg, browserId);
    if (!opened?.port) {
      return { ok: false, message: '打开比特浏览器失败' };
    }
    // 与自建一致：不在「打开」时用卡片快照覆盖比特里当前会话
    const pref = cardPreferredDomainForCdp(card);
    return navigateViaCdp(opened.port, pref, url);
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
  if (srcType === 'self_built') {
    let port = browserSourceDebugPort(source);
    const userDataDir = String(source.userDataDir || source.user_data_dir || '');
    if (!port && userDataDir) {
      port = extractPortFromUserDataDir(userDataDir);
    }
    const running = port ? await isPortOpen(port) : false;
    if (!running) {
      const launchError = await launchSelfBuiltBrowser(port, userDataDir, url, cfg);
      if (launchError) {
        return { ok: false, message: launchError };
      }
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

  if (type === 'self_built' && !port && userDataDir) {
    port = extractPortFromUserDataDir(userDataDir);
  }
  if (type === 'self_built' && !port) {
    return { ok: false, message: '目标为自建浏览器但未指定调试端口，且用户目录路径中无法解析端口（请确认目录名为 chrome_user_data_port_端口 或在目标中填写端口）' };
  }
  if (type === 'self_built' && port && !(await isPortOpen(port))) {
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

async function listOnlineImportTargets(cfg) {
  const items = [];
  const seenUdd = new Set();
  const seenPortOnly = new Set();
  const portList = [];
  for (let p = CDP_ONLINE_IMPORT_PORT_MIN; p < CDP_ONLINE_IMPORT_PORT_MAX; p += 1) {
    portList.push(p);
  }
  const openDebugPorts = [];
  for (let i = 0; i < portList.length; i += 36) {
    const batch = portList.slice(i, i + 36);
    const hits = await Promise.all(batch.map(async (port) => ((await isPortOpen(port)) ? port : 0)));
    openDebugPorts.push(...hits.filter(Boolean));
  }
  openDebugPorts.sort((a, b) => a - b);
  for (const p of openDebugPorts) {
    const udd = await getUserDataDirFromDebugPort(p);
    if (udd) {
      const nk = normalizePathKeyForDedupe(udd);
      if (nk && seenUdd.has(nk)) {
        continue;
      }
      if (nk) {
        seenUdd.add(nk);
      }
      items.push({
        sourceType: 'self_built',
        sourceId: udd,
        port: p,
        label: `在线调试 · ${path.basename(udd)} · 端口 ${p}`
      });
      continue;
    }
    if (seenPortOnly.has(p)) {
      continue;
    }
    const cdpOk = await hasCdpDevtoolsJson(p);
    if (!cdpOk) {
      continue;
    }
    seenPortOnly.add(p);
    items.push({
      sourceType: 'self_built',
      sourceId: '',
      port: p,
      label: `在线调试 · 端口 ${p}（CDP 可用，未返回用户目录）`
    });
  }
  try {
    const bitPortMap = await bitGetOpenPorts(cfg);
    for (const item of await bitGetBrowsers(cfg)) {
      const browserId = String(item?.id || '');
      if (!browserId || !Object.prototype.hasOwnProperty.call(bitPortMap, browserId)) {
        continue;
      }
      const bp = Number.parseInt(String(bitPortMap[browserId] || ''), 10) || 0;
      items.push({
        sourceType: 'bitbrowser_api',
        sourceId: browserId,
        port: bp,
        label: `比特浏览器（运行中）· ${String(item?.name || browserId)} · 端口 ${bp}`
      });
    }
  } catch {
    /* 忽略比特列表失败 */
  }
  return items.sort((a, b) => String(a.label).localeCompare(String(b.label), 'zh-CN'));
}

function onlineImportBuildCards(cfg, sourceType, sourceId, groups, accountName) {
  const base = buildImportCards(cfg, sourceType, sourceId, groups);
  const nameBase = String(accountName || '').trim();
  if (!nameBase) {
    return base;
  }
  if (base.length === 1) {
    return [{ ...base[0], name: nameBase }];
  }
  return base.map((card) => {
    const dom = String(card.domain || '').replace(/^\.+/, '');
    return { ...card, name: dom ? `${nameBase} · ${dom}` : nameBase };
  });
}

/**
 * 将「当前分组」卡片的 browserSource 规范成导入卡片应写入的 browser_source（与 buildBrowserSource 字段一致）。
 * 在线导入从 CDP 读的是另一套 userDataDir/端口，卡片归属应以点击「在线导入」的分组为准，否则会误归到指纹调试端口对应目录。
 */
function flattenBrowserSourceForOnlineImportInherit(src) {
  if (!src || typeof src !== 'object') {
    return null;
  }
  const t = String(src.type || '').trim();
  if (t === 'chrome_profile') {
    const userDataDir = String(src.userDataDir || src.user_data_dir || '').trim();
    const profileName = String(src.profileName || src.profile_name || '').trim();
    if (!userDataDir || !profileName) {
      return null;
    }
    const infoCache = readLocalStateNames(userDataDir);
    const displayName = String(
      src.displayName || src.display_name || infoCache?.[profileName]?.name || profileName || 'Default'
    ).trim();
    return {
      type: 'chrome_profile',
      profile_name: profileName,
      display_name: displayName,
      user_data_dir: userDataDir,
      label: String(src.label || '').trim() || `系统 Chrome · ${displayName}`
    };
  }
  if (t === 'self_built') {
    const userDataDir = String(src.userDataDir || src.user_data_dir || '').trim();
    if (!userDataDir) {
      return null;
    }
    const dirName = path.basename(userDataDir);
    const pathPort = Number.parseInt(String(dirName.replace('chrome_user_data_port_', '')), 10) || 0;
    const port = Number(src.port || src.debugPort || 0) || pathPort || 0;
    return {
      type: 'self_built',
      port,
      user_data_dir: userDataDir,
      name: port ? `端口 ${port}` : dirName,
      label: String(src.label || '').trim() || `自建浏览器 · ${port ? `端口 ${port}` : dirName}`
    };
  }
  if (t === 'bitbrowser' || t === 'bitbrowser_api') {
    const id = String(src.browserId || src.browser_id || '').trim();
    if (!id) {
      return null;
    }
    const name = String(src.name || id).trim() || id;
    const port = Number(src.port || 0) || 0;
    return {
      type: 'bitbrowser',
      browser_id: id,
      name,
      port,
      label: String(src.label || '').trim() || `比特浏览器 · ${id}`
    };
  }
  return null;
}

function applyInheritedBrowserSourceToOnlineImportCards(cards, inheritedRaw) {
  const flat = flattenBrowserSourceForOnlineImportInherit(inheritedRaw);
  if (!flat) {
    return ensureArray(cards);
  }
  return ensureArray(cards).map((card) => {
    const next = { ...card, browser_source: { ...flat } };
    delete next.browserSource;
    return next;
  });
}

async function onlineImportCapture(cfg, payload = {}) {
  const target = payload.target || {};
  const accountName = String(payload.accountName || '').trim();
  if (!accountName) {
    return { ok: false, message: '请填写账号名称' };
  }
  const sourceType = String(target.sourceType || '');
  const sourceId = String(target.sourceId || '');
  const port = Number(target.port || 0);
  if (!sourceType) {
    return { ok: false, message: '请选择目标浏览器' };
  }
  if ((sourceType === 'bitbrowser_api' || sourceType === 'bitbrowser') && !sourceId) {
    return { ok: false, message: '请选择目标浏览器' };
  }
  if (sourceType === 'self_built' && !port && !sourceId) {
    return { ok: false, message: '请选择目标浏览器' };
  }

  let rawList = [];
  if (sourceType === 'bitbrowser_api' || sourceType === 'bitbrowser') {
    rawList = await bitGetCookies(cfg, sourceId);
  } else if (sourceType === 'self_built') {
    const cdpPort = await resolveSelfBuiltCdpPort(sourceId, port);
    if (!cdpPort) {
      return {
        ok: false,
        message: `无法通过 CDP 连接该实例。请确认已开启远程调试（如 --remote-debugging-port），且端口在 ${CDP_ONLINE_IMPORT_PORT_MIN}–${CDP_ONLINE_IMPORT_PORT_MAX - 1} 扫描范围内。`
      };
    }
    rawList = await readCookiesViaCdp(cdpPort, '');
  } else {
    return { ok: false, message: `暂不支持在线导入来源类型：${sourceType}` };
  }

  const normalizedCookies = [];
  for (const item of ensureArray(rawList)) {
    try {
      normalizedCookies.push(normalizeCookie(item));
    } catch {
      /* 跳过单条异常 */
    }
  }
  if (!normalizedCookies.length) {
    return { ok: false, message: '未读取到可用 Cookie' };
  }
  const groups = buildGroupsFromCookies(normalizedCookies, true);
  if (!groups.length) {
    return { ok: false, message: '未生成可导入的域名分组' };
  }
  const st = sourceType === 'bitbrowser' ? 'bitbrowser_api' : sourceType;
  const cards = onlineImportBuildCards(cfg, st, sourceId, groups, accountName);
  const inherited = payload.inheritBrowserSource || payload.inherit_browser_source;
  const finalCards = applyInheritedBrowserSourceToOnlineImportCards(cards, inherited);
  return {
    ok: true,
    cards: finalCards,
    message: `已提取 ${finalCards.length} 张卡片`
  };
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
  if (command === 'rewrite-card-cookies') {
    return rewriteBrowserCardCookies(payload.card || JSON.parse(payload.cardJson || '{}'), cfg);
  }
  if (command === 'online-import-list-targets') {
    return { ok: true, results: await listOnlineImportTargets(cfg) };
  }
  if (command === 'online-import-capture') {
    return onlineImportCapture(cfg, payload);
  }
  throw new Error(`未知命令: ${command}`);
}

module.exports = {
  runBrowserCommand,
  scanBrowserCards,
  listSelfBuiltProfiles
};
