const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runBrowserCommand, scanBrowserCards: scanBrowserCardsInNode } = require('./browser-node-service');

const DEFAULT_SELF_BUILT_CANDIDATES = [];
const DEFAULT_PYTHON_COOKIE_PROJECT = '';

function getDefaultSelfBuiltRoot() {
  return DEFAULT_SELF_BUILT_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || '';
}

function normalizeSelfBuiltRoot(value) {
  const normalized = String(value || '').trim();
  if (normalized) {
    return normalized;
  }
  return getDefaultSelfBuiltRoot();
}

function resolveSelfBuiltWorkspaceDir(payload = {}, settings = {}) {
  return normalizeSelfBuiltRoot(
    payload.selfBuiltWorkspaceDir
    || payload.selfBuiltRoot
    || settings.selfBuiltWorkspaceDir
    || settings.selfBuiltUserDataRoot
    || settings.browserScanRoot
    || ''
  );
}

function findChromePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return '';
}

function spawnDetached(command, args) {
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();
}

function openBrowserCard(card) {
  const browserSource = card?.browserSource || {};
  const chromePath = findChromePath();
  if (!chromePath) {
    throw new Error('未找到本机 Chrome，请确认已安装');
  }

  const openUrl = String(card.openUrl || '').trim() || `https://${String(card.domain || '').replace(/^\.+/, '')}`;
  if (!openUrl) {
    throw new Error('卡片缺少可打开的地址');
  }

  if (browserSource.type === 'chrome_profile') {
    const profileName = String(browserSource.profileName || '').trim();
    if (!profileName) {
      throw new Error('系统 Chrome Profile 信息不完整');
    }

    const args = [];
    if (browserSource.userDataDir) {
      args.push(`--user-data-dir=${browserSource.userDataDir}`);
    }
    args.push(`--profile-directory=${profileName}`, openUrl);
    spawnDetached(chromePath, args);
    return {
      ok: true,
      message: `已用系统 Chrome 打开 ${profileName}`
    };
  }

  if (browserSource.type === 'self_built') {
    const userDataDir = String(browserSource.userDataDir || '').trim();
    if (!userDataDir) {
      throw new Error('自建浏览器目录不存在');
    }

    const args = [
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      openUrl
    ];
    spawnDetached(chromePath, args);
    return {
      ok: true,
      message: `已用自建浏览器打开 ${path.basename(userDataDir)}`
    };
  }

  throw new Error(`暂不支持的浏览器来源类型: ${browserSource.type || 'unknown'}`);
}

function runPythonJson(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('python', ['-X', 'utf8', scriptPath, ...args], {
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Python 脚本执行失败，退出码 ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`扫描结果解析失败: ${error.message}`));
      }
    });
  });
}

function writeTempJsonArg(name, value) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'desklibrary-py-'));
  const filePath = path.join(dir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(value ?? {}, null, 0), 'utf8');
  return {
    filePath,
    cleanup() {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {}
    }
  };
}

async function runPythonJsonWithTempArgs(scriptPath, args = [], tempFiles = []) {
  try {
    return await runPythonJson(scriptPath, args);
  } finally {
    for (const tempFile of tempFiles) {
      try {
        tempFile.cleanup();
      } catch {}
    }
  }
}

async function scanBrowserCards(options = {}) {
  const scope = options.scope === 'chrome' || options.scope === 'self_built' ? options.scope : 'all';
  const selfBuiltRoot = normalizeSelfBuiltRoot(options.selfBuiltRoot);
  const payload = await scanBrowserCardsInNode({ scope, selfBuiltRoot });
  return { ...payload, selfBuiltRoot };
}

async function runPythonBridge(command, payload = {}) {
  const selfBuiltRoot = normalizeSelfBuiltRoot(payload.selfBuiltWorkspaceDir || payload.selfBuiltRoot || '');
  return runBrowserCommand(command, {
    ...payload,
    selfBuiltRoot,
    cfg: {
      ...(payload.cfg || {}),
      self_built_workspace_dir: selfBuiltRoot,
      self_built_root: selfBuiltRoot,
      self_built_chromedriver_path: payload?.cfg?.self_built_chromedriver_path || (selfBuiltRoot ? path.join(selfBuiltRoot, 'chromedriver.exe') : ''),
      self_built_chrome_path: payload?.cfg?.self_built_chrome_path || (selfBuiltRoot ? path.join(selfBuiltRoot, 'chrome.exe') : '')
    }
  });
}

module.exports = {
  DEFAULT_PYTHON_COOKIE_PROJECT,
  getDefaultSelfBuiltRoot,
  normalizeSelfBuiltRoot,
  resolveSelfBuiltWorkspaceDir,
  openBrowserCard,
  runPythonBridge,
  scanBrowserCards
};
