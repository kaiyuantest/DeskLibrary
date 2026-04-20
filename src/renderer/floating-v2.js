class FloatingCircleMenu {
  constructor(options = {}) {
    this.options = {
      baseRadius: Number(options.baseRadius || 88),
      radiusStep: Number(options.radiusStep || 34),
      maxNodesPerLayer: Math.max(3, Number(options.maxNodesPerLayer || 6)),
      rootLabel: options.rootLabel || 'D',
      closeAfterLeaf: options.closeAfterLeaf !== false,
      tree: options.tree || { id: 'root', label: 'D', children: [] },
      onAction: typeof options.onAction === 'function' ? options.onAction : () => {},
      onRequestClose: typeof options.onRequestClose === 'function' ? options.onRequestClose : null
    };

    this.state = {
      visible: false,
      activePath: [],
      layerAnchors: [{ x: 0, y: 0 }],
      keepZones: []
    };

    this.ringLayers = [];
    this.lastCenterTap = 0;
    this.msgTimer = null;
    this.expandingGuard = '';
    this.syntheticIdSeed = 0;
    this.silentClosing = false;
    this.init();
  }

  init() {
    this.injectStyles();
    this.createUi();
    this.bindGlobal();
  }

  injectStyles() {
    if (document.getElementById('floating-menu-v2-style')) return;
    const style = document.createElement('style');
    style.id = 'floating-menu-v2-style';
    style.textContent = `
      html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden}
      .fm-root{position:fixed;left:50%;top:50%;width:56px;height:56px;transform:translate(-50%,-50%);display:none;z-index:99999}
      .fm-root.visible{display:block}
      .fm-center{position:absolute;left:50%;top:50%;width:64px;height:64px;margin-left:-32px;margin-top:-32px;padding:0;border-radius:999px;border:0;color:transparent;background:transparent;font:700 14px/1 "Microsoft YaHei UI",sans-serif;cursor:pointer;box-shadow:none;transition:none;appearance:none;-webkit-appearance:none;-moz-appearance:none;tap-highlight-color:rgba(0,0,0,0);-webkit-tap-highlight-color:rgba(0,0,0,0);touch-action:none}
      .fm-center:hover,.fm-center:focus,.fm-center:focus-visible,.fm-center:active{outline:none !important;background:transparent !important;box-shadow:none !important;border:0 !important;transform:none !important}
      .fm-center::-moz-focus-inner{border:0}
      .fm-ring-layer{position:absolute;inset:0;pointer-events:none}
      .fm-orb{position:absolute;left:50%;top:50%;width:42px;height:42px;margin-left:-21px;margin-top:-21px;border-radius:999px;border:1px solid rgba(180,214,255,.42);background:linear-gradient(145deg,#174aa7,#1d69d8);color:#eff6ff;font:700 12px/1 "Microsoft YaHei UI",sans-serif;pointer-events:auto;cursor:pointer;opacity:0;transform:translate(var(--dx,0px),var(--dy,0px)) scale(.84);transition:transform 140ms ease,opacity 140ms ease,box-shadow 120ms ease}
      .fm-orb.visible{opacity:1;transform:translate(var(--dx,0px),var(--dy,0px)) scale(1)}
      .fm-orb.danger{background:linear-gradient(145deg,#8f2432,#cf3e52);border-color:rgba(255,202,207,.48)}
      .fm-orb:hover,.fm-orb.active{box-shadow:0 10px 22px rgba(40,97,190,.38);border-color:rgba(213,231,255,.7)}
      .fm-tip{position:absolute;left:50%;bottom:calc(100% + 7px);transform:translateX(-50%);white-space:nowrap;border-radius:8px;background:rgba(9,19,39,.92);border:1px solid rgba(142,180,245,.34);color:#e7f0ff;padding:5px 8px;font:500 11px/1.2 "Microsoft YaHei UI",sans-serif;opacity:0;pointer-events:none;transition:opacity 120ms ease}
      .fm-orb:hover .fm-tip,.fm-orb.active .fm-tip{opacity:1}
      .fm-msg{position:fixed;top:16px;left:50%;transform:translateX(-50%);max-width:90vw;border-radius:8px;padding:8px 10px;color:#e7f0ff;background:rgba(9,19,39,.92);border:1px solid rgba(142,180,245,.34);font:500 12px/1.3 "Microsoft YaHei UI",sans-serif;display:none;z-index:100000}
      .fm-msg.visible{display:block}
    `;
    document.head.appendChild(style);
  }

  createUi() {
    this.root = document.createElement('div');
    this.root.className = 'fm-root';

    this.center = document.createElement('button');
    this.center.className = 'fm-center';
    this.center.type = 'button';
    this.center.textContent = '';
    this.center.setAttribute('aria-label', '返回上一级');
    this.bindTap(this.center, () => this.onCenterTap());
    this.center.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.center.blur();
    });
    this.center.addEventListener('pointerup', () => {
      this.center.blur();
    });
    this.root.appendChild(this.center);

    this.msg = document.createElement('div');
    this.msg.className = 'fm-msg';
    document.body.appendChild(this.msg);
    document.body.appendChild(this.root);
  }

  bindGlobal() {
    document.addEventListener('click', (event) => {
      if (!this.state.visible) return;
      if (!this.root.contains(event.target)) {
        this.hideMenu(true);
      }
    });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.hideMenu(true);
    });
    document.addEventListener('mousemove', (event) => {
      if (!this.state.visible) return;
      this.handlePointerKeepZone(event.clientX, event.clientY);
    });
  }

  bindTap(node, handler) {
    let touched = false;
    node.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      touched = true;
      handler(e);
      setTimeout(() => { touched = false; }, 300);
    }, { passive: false });
    node.addEventListener('click', (e) => {
      if (touched) return;
      e.preventDefault();
      e.stopPropagation();
      handler(e);
    });
  }

  setTree(tree) {
    this.options.tree = tree || { id: 'root', label: this.options.rootLabel, children: [] };
    if (this.state.visible) {
      this.state.activePath = [];
      this.state.layerAnchors = [{ x: 0, y: 0 }];
      this.state.keepZones = [];
      this.renderFromDepth(0);
    }
  }

  showMenu() {
    this.state.visible = true;
    this.root.classList.add('visible');
    this.showFirstLayer();
  }

  hideMenu(notifyClose = false) {
    if (!this.state.visible && !notifyClose) return;
    this.state.visible = false;
    this.root.classList.remove('visible');
    this.clearLayersFrom(0);
    this.state.activePath = [];
    this.state.layerAnchors = [{ x: 0, y: 0 }];
    this.state.keepZones = [];
    this.center.textContent = '';
    if (notifyClose && !this.silentClosing && this.options.onRequestClose) {
      this.options.onRequestClose();
    }
  }

  onCenterTap() {
    const now = Date.now();
    if (now - this.lastCenterTap < 280) {
      this.hideMenu(true);
      this.lastCenterTap = 0;
      return;
    }
    this.lastCenterTap = now;
    if (!this.state.activePath.length) {
      this.hideMenu(true);
      return;
    }
    this.state.activePath.pop();
    this.state.layerAnchors = this.state.layerAnchors.slice(0, this.state.activePath.length + 1);
    this.state.keepZones = this.state.keepZones.slice(0, this.state.activePath.length);
    this.renderFromDepth(this.state.activePath.length);
  }

  showFirstLayer() {
    this.state.activePath = [];
    this.state.layerAnchors = [{ x: 0, y: 0 }];
    this.state.keepZones = [];
    this.renderFromDepth(0);
  }

  nodeAtDepth(depth) {
    let current = this.options.tree;
    for (let i = 0; i < depth; i += 1) {
      const node = this.state.activePath[i];
      if (!node) return current;
      current = node;
    }
    return current;
  }

  clearLayersFrom(depth) {
    for (let i = depth; i < this.ringLayers.length; i += 1) {
      const layer = this.ringLayers[i];
      if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
      this.ringLayers[i] = null;
    }
    this.ringLayers.length = depth;
  }

  renderFromDepth() {
    this.clearLayersFrom(0);
    this.state.layerAnchors = this.state.layerAnchors.slice(0, Math.max(1, this.state.activePath.length + 1));
    this.state.keepZones = this.state.keepZones.slice(0, this.state.activePath.length);
    this.center.textContent = '';

    for (let d = 0; d <= this.state.activePath.length; d += 1) {
      const parent = this.nodeAtDepth(d);
      const children = Array.isArray(parent.children) ? parent.children : [];
      if (!children.length) continue;
      this.renderLayer(d, children);
    }
  }

  collapseToCenter() {
    this.state.activePath = [];
    this.state.layerAnchors = [{ x: 0, y: 0 }];
    this.state.keepZones = [];
    this.clearLayersFrom(0);
    this.center.textContent = '';
  }

  renderLayer(depth, nodes) {
    const layer = document.createElement('div');
    layer.className = 'fm-ring-layer';
    this.ringLayers[depth] = layer;
    this.root.appendChild(layer);

    const visibleNodes = this.limitLayerNodes(nodes, depth);
    const radius = this.getLayerRadius(depth);
    const start = -Math.PI / 2;
    const selected = this.state.activePath[depth];
    const anchor = this.state.layerAnchors[depth] || { x: 0, y: 0 };
    const outwardAngle = Math.atan2(anchor.y, anchor.x);
    const spread = (Math.PI / 180) * 110;

    visibleNodes.forEach((item, idx) => {
      const angle = depth === 0
        ? (start + ((Math.PI * 2) * idx) / visibleNodes.length)
        : (outwardAngle - (spread / 2) + ((visibleNodes.length === 1 ? 0 : spread / (visibleNodes.length - 1)) * idx));
      const x = anchor.x + (Math.cos(angle) * radius);
      const y = anchor.y + (Math.sin(angle) * radius);
      const orb = document.createElement('button');
      orb.className = 'fm-orb';
      if (selected && selected.id === item.id) orb.classList.add('active');
      if (item.danger) orb.classList.add('danger');
      orb.type = 'button';
      orb.dataset.depth = String(depth);
      orb.textContent = item.label || '?';
      orb.style.setProperty('--dx', `${x}px`);
      orb.style.setProperty('--dy', `${y}px`);

      const tip = document.createElement('span');
      tip.className = 'fm-tip';
      tip.textContent = item.tip || item.label || '';
      orb.appendChild(tip);

      this.bindOrbInteraction(orb, item, depth);
      layer.appendChild(orb);
      requestAnimationFrame(() => orb.classList.add('visible'));
    });
  }

  limitLayerNodes(nodes, depth) {
    const max = this.options.maxNodesPerLayer;
    if (!Array.isArray(nodes) || nodes.length <= max) return Array.isArray(nodes) ? nodes : [];
    const keep = Math.max(1, max - 1);
    const head = nodes.slice(0, keep);
    const tail = nodes.slice(keep);
    const moreNode = this.makeMoreNode(depth, tail);
    return [...head, moreNode];
  }

  makeMoreNode(depth, remaining) {
    const max = this.options.maxNodesPerLayer;
    const keep = Math.max(1, max - 1);
    const bucket = remaining.slice(0, keep);
    const next = remaining.slice(keep);
    const children = next.length ? [...bucket, this.makeMoreNode(depth + 1, next)] : bucket;
    this.syntheticIdSeed += 1;
    return {
      id: `__more_${depth}_${this.syntheticIdSeed}`,
      label: '更多',
      tip: `展开剩余 ${remaining.length} 项`,
      children
    };
  }

  bindOrbInteraction(orb, item, depth) {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    let touchMoved = false;

    const expand = () => {
      if (!hasChildren) return;
      if (this.state.activePath[depth] && this.state.activePath[depth].id === item.id) return;
      const guardKey = `${depth}:${item.id}`;
      if (this.expandingGuard === guardKey) return;
      this.expandingGuard = guardKey;
      setTimeout(() => { if (this.expandingGuard === guardKey) this.expandingGuard = ''; }, 120);

      this.state.activePath = this.state.activePath.slice(0, depth);
      this.state.activePath[depth] = item;
      this.state.layerAnchors = this.state.layerAnchors.slice(0, depth + 1);
      const parentAnchor = this.getOrbAnchor(orb);
      this.state.layerAnchors[depth + 1] = parentAnchor;
      this.state.keepZones = this.state.keepZones.slice(0, depth);
      this.state.keepZones[depth] = this.makeKeepZone(depth, parentAnchor);
      this.renderFromDepth(depth + 1);
    };

    orb.addEventListener('mouseenter', () => {
      if (hasChildren) expand();
    });

    orb.addEventListener('touchstart', (e) => {
      touchMoved = false;
      if (hasChildren) {
        e.preventDefault();
        e.stopPropagation();
        expand();
      }
    }, { passive: false });

    orb.addEventListener('pointerdown', (e) => {
      if (!hasChildren) return;
      if (e.pointerType && e.pointerType !== 'mouse') return;
      e.preventDefault();
      e.stopPropagation();
      expand();
    });

    orb.addEventListener('touchmove', () => {
      touchMoved = true;
    }, { passive: true });

    this.bindTap(orb, () => {
      if (hasChildren) {
        expand();
        return;
      }
      if (touchMoved) return;
      this.executeLeaf(item);
    });
  }

  getLayerRadius(depth) {
    if (depth === 0) return this.options.baseRadius;
    return Math.max(54, Math.round(this.options.baseRadius * 0.72))
      + ((depth - 1) * Math.max(8, Math.round(this.options.radiusStep * 0.24)));
  }

  getOrbVisualRadius() {
    return 22;
  }

  makeKeepZone(depth, anchor) {
    const childLayerDepth = depth + 1;
    const childRadius = this.getLayerRadius(childLayerDepth);
    return {
      cx: anchor.x,
      cy: anchor.y,
      r: childRadius + this.getOrbVisualRadius() + 34
    };
  }

  clientToRootRelative(clientX, clientY) {
    const rect = this.root.getBoundingClientRect();
    return {
      x: clientX - (rect.left + rect.width / 2),
      y: clientY - (rect.top + rect.height / 2)
    };
  }

  handlePointerKeepZone(clientX, clientY) {
    if (!this.state.activePath.length) return;
    const p = this.clientToRootRelative(clientX, clientY);
    let keepLen = 0;
    const hovered = document.elementFromPoint(clientX, clientY);
    const orb = hovered && hovered.closest ? hovered.closest('.fm-orb') : null;
    if (orb) {
      const d = Number.parseInt(String(orb.dataset.depth || '0'), 10);
      if (Number.isFinite(d)) keepLen = Math.max(keepLen, d + 1);
    }
    for (let i = 0; i < this.state.keepZones.length; i += 1) {
      const z = this.state.keepZones[i];
      if (!z) continue;
      const dx = p.x - z.cx;
      const dy = p.y - z.cy;
      if ((dx * dx) + (dy * dy) <= (z.r * z.r)) keepLen = Math.max(keepLen, i + 1);
    }
    if (keepLen < this.state.activePath.length) {
      this.state.activePath = this.state.activePath.slice(0, keepLen);
      this.state.layerAnchors = this.state.layerAnchors.slice(0, keepLen + 1);
      this.state.keepZones = this.state.keepZones.slice(0, keepLen);
      if (keepLen === 0) this.showFirstLayer();
      else this.renderFromDepth(keepLen);
    }
  }

  getOrbAnchor(orb) {
    const x = Number.parseFloat(String(orb.style.getPropertyValue('--dx') || '0').replace('px', '')) || 0;
    const y = Number.parseFloat(String(orb.style.getPropertyValue('--dy') || '0').replace('px', '')) || 0;
    return { x, y };
  }

  async executeLeaf(node) {
    const action = node.action || { type: 'noop', message: '无动作' };
    const result = await runFloatingAction(action, node);
    const msg = result && result.message ? result.message : `执行：${node.label || '动作'}`;
    this.showMessage(msg);
    this.options.onAction({
      node,
      action,
      message: msg,
      ok: result ? result.ok !== false : true,
      time: new Date().toISOString()
    });
    if (this.options.closeAfterLeaf) this.hideMenu(true);
  }

  showMessage(text) {
    this.msg.textContent = text;
    this.msg.classList.add('visible');
    clearTimeout(this.msgTimer);
    this.msgTimer = setTimeout(() => this.msg.classList.remove('visible'), 1500);
  }
}

function shortLabel(value, len = 6) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '未命名';
  return text.length <= len ? text : `${text.slice(0, len)}…`;
}

function buildRecordNode(record, category) {
  const id = Number(record.id);
  const title = String(record.title || '未命名').trim() || '未命名';
  const preview = String(record.preview || '').trim();
  const itemLabel = shortLabel(title, 6);
  const commonAction = category === 'daily'
    ? { id: `rec.${id}.toCommon`, label: '转常', action: { type: 'move-common', id, title } }
    : { id: `rec.${id}.toDaily`, label: '回每', action: { type: 'move-daily', id, title } };

  return {
    id: `rec.${id}`,
    label: itemLabel,
    tip: preview || title,
    children: [
      { id: `rec.${id}.copy`, label: '复制', action: { type: 'copy-record', id, title } },
      commonAction,
      { id: `rec.${id}.delete`, label: '删除', action: { type: 'delete-record', id, title }, danger: true }
    ]
  };
}

function buildMenuTree(payload = {}) {
  const recentDaily = Array.isArray(payload.recentDailyRecords) ? payload.recentDailyRecords.slice(0, 4) : [];
  const recentCommon = Array.isArray(payload.recentCommonRecords) ? payload.recentCommonRecords.slice(0, 4) : [];
  const accumulation = payload.accumulation || {};
  const accActive = !!accumulation.active;
  const deleteTip = payload.lastCapture && payload.lastCapture.available
    ? `删上次：${payload.lastCapture.preview || '最近收藏'}`
    : '暂无可删的最近收藏';

  return {
    id: 'root',
    label: 'D',
    children: [
      {
        id: 'main',
        label: '主',
        tip: '主窗口与页面导航',
        children: [
          { id: 'main.open', label: '主窗', action: { type: 'open-main-window' } },
          {
            id: 'main.pages',
            label: '页面',
            children: [
              { id: 'page.daily', label: '每日', action: { type: 'goto-page', page: 'daily' } },
              { id: 'page.common', label: '常用', action: { type: 'goto-page', page: 'common' } },
              { id: 'page.assets', label: '资源', action: { type: 'goto-page', page: 'assets' } },
              { id: 'page.cards', label: '卡片', action: { type: 'goto-page', page: 'browserCards' } }
            ]
          }
        ]
      },
      {
        id: 'save',
        label: '存',
        tip: '每日内容',
        children: [
          { id: 'save.now', label: '立即存', action: { type: 'quick-save-daily' } },
          {
            id: 'save.recent',
            label: '最近4条',
            children: recentDaily.length
              ? recentDaily.map((item) => buildRecordNode(item, 'daily'))
              : [{ id: 'save.empty', label: '空', action: { type: 'noop', message: '最近没有每日记录' } }]
          }
        ]
      },
      {
        id: 'common',
        label: '常',
        tip: '常用内容',
        children: [
          { id: 'common.now', label: '立即常', action: { type: 'quick-save-common' } },
          {
            id: 'common.recent',
            label: '最近4条',
            children: recentCommon.length
              ? recentCommon.map((item) => buildRecordNode(item, 'common'))
              : [{ id: 'common.empty', label: '空', action: { type: 'noop', message: '最近没有常用记录' } }]
          }
        ]
      },
      {
        id: 'acc',
        label: '始',
        tip: accActive ? '累计中：结束/撤销/取消' : '累计未开始',
        children: accActive
          ? [
              { id: 'acc.finish', label: '结束', action: { type: 'acc-finish' } },
              { id: 'acc.undo', label: '撤销', action: { type: 'acc-undo' } },
              { id: 'acc.cancel', label: '取消', action: { type: 'acc-cancel' }, danger: true }
            ]
          : [
              { id: 'acc.start', label: '开始', action: { type: 'acc-start' } }
            ]
      },
      {
        id: 'ocr',
        label: '译',
        tip: '截图翻译',
        children: [
          { id: 'ocr.start', label: '截图', action: { type: 'ocr-start' } },
          { id: 'ocr.main', label: '主窗', action: { type: 'open-main-window' } }
        ]
      },
      {
        id: 'assets',
        label: '资',
        tip: '资源入口',
        children: [
          { id: 'assets.open', label: '资源库', action: { type: 'goto-page', page: 'assets' } }
        ]
      },
      {
        id: 'more',
        label: '更',
        tip: '低频和危险操作',
        children: [
          {
            id: 'more.browser',
            label: '浏览器',
            children: [
              { id: 'more.browser.open', label: '卡片页', action: { type: 'goto-page', page: 'browserCards' } }
            ]
          },
          {
            id: 'more.delete',
            label: '删除',
            children: [
              { id: 'more.delete.last', label: '删上次', tip: deleteTip, action: { type: 'delete-last' }, danger: true }
            ]
          },
          {
            id: 'more.settings',
            label: '设置',
            children: [
              { id: 'more.settings.open', label: '偏好', action: { type: 'goto-page', page: 'settings' } }
            ]
          },
          {
            id: 'more.hide',
            label: '隐藏',
            children: [
              { id: 'more.hide.confirm', label: '确认', action: { type: 'hide-floating' }, danger: true },
              { id: 'more.hide.cancel', label: '取消', action: { type: 'noop', message: '已取消隐藏' } }
            ]
          }
        ]
      }
    ]
  };
}

async function runFloatingAction(action, node) {
  const kind = String(action.type || 'noop');
  switch (kind) {
    case 'open-main-window': {
      const result = await window.deskLibraryFloating.openMainWindow();
      return { ok: !!(result && result.ok !== false), message: '已打开主界面' };
    }
    case 'goto-page': {
      const result = await window.deskLibraryFloating.openMainWindowPage(String(action.page || ''));
      return result && result.ok === false
        ? { ok: false, message: result.message || '跳转失败' }
        : { ok: true, message: '已跳转到目标页面' };
    }
    case 'quick-save-daily':
      await window.deskLibraryFloating.quickSave();
      return { ok: true, message: '已收藏到每日' };
    case 'quick-save-common':
      await window.deskLibraryFloating.quickSaveCommon();
      return { ok: true, message: '已收藏到常用' };
    case 'copy-record': {
      const result = await window.deskLibraryFloating.copyRecordContent(Number(action.id));
      return result && result.ok === false
        ? { ok: false, message: result.message || '复制失败' }
        : { ok: true, message: `已复制：${action.title || node.label || ''}` };
    }
    case 'move-common': {
      const result = await window.deskLibraryFloating.moveRecordToCommon(Number(action.id));
      return result && result.ok === false
        ? { ok: false, message: result.message || '转常用失败' }
        : { ok: true, message: `已转常用：${action.title || node.label || ''}` };
    }
    case 'move-daily': {
      const result = await window.deskLibraryFloating.moveRecordToDaily(Number(action.id));
      return result && result.ok === false
        ? { ok: false, message: result.message || '移回每日失败' }
        : { ok: true, message: `已移回每日：${action.title || node.label || ''}` };
    }
    case 'delete-record': {
      const result = await window.deskLibraryFloating.deleteRecord(Number(action.id));
      return result && result.ok === false
        ? { ok: false, message: result.message || '删除失败' }
        : { ok: true, message: `已删除：${action.title || node.label || ''}` };
    }
    case 'delete-last': {
      const result = await window.deskLibraryFloating.deleteLastCapture();
      return result && result.ok === false
        ? { ok: false, message: result.message || '删除失败' }
        : { ok: true, message: '已删除上次收藏' };
    }
    case 'acc-start':
      await window.deskLibraryFloating.startAccumulation();
      return { ok: true, message: '累计复制已开始' };
    case 'acc-finish':
      await window.deskLibraryFloating.finishAccumulation();
      return { ok: true, message: '累计复制已结束' };
    case 'acc-undo':
      await window.deskLibraryFloating.undoAccumulation();
      return { ok: true, message: '已撤销上一段' };
    case 'acc-cancel':
      await window.deskLibraryFloating.cancelAccumulation();
      return { ok: true, message: '累计复制已取消' };
    case 'ocr-start':
      await window.deskLibraryFloating.startScreenshotTranslate();
      return { ok: true, message: '已打开截图翻译' };
    case 'hide-floating':
      await window.deskLibraryFloating.disableFloatingIcon();
      return { ok: true, message: '已关闭悬浮图标' };
    case 'open-url': {
      const result = await window.deskLibraryFloating.openExternalUrl(String(action.url || ''));
      return result && result.ok === false
        ? { ok: false, message: result.message || '打开失败' }
        : { ok: true, message: '已打开链接' };
    }
    case 'copy-text': {
      const text = String(action.text || '');
      const result = await window.deskLibraryFloating.copyText(text);
      return result && result.ok === false ? { ok: false, message: '复制失败' } : { ok: true, message: '已复制文本' };
    }
    case 'noop':
    default:
      return { ok: true, message: action.message || `已执行：${node.label || '操作'}` };
  }
}

let latestPayload = {};
let lastTreeSignature = '';

const menu = new FloatingCircleMenu({
  baseRadius: 88,
  radiusStep: 34,
  maxNodesPerLayer: 6,
  closeAfterLeaf: true,
  onRequestClose: () => {
    window.deskLibraryFloating.closeMenu().catch(() => {});
  }
});

function applyMenuState(payload = {}) {
  latestPayload = payload || {};
  const nextSignature = JSON.stringify({
    acc: !!(latestPayload.accumulation && latestPayload.accumulation.active),
    lastCapture: latestPayload.lastCapture && latestPayload.lastCapture.preview ? latestPayload.lastCapture.preview : '',
    recentDaily: (latestPayload.recentDailyRecords || []).map((item) => `${item.id}:${item.title || ''}:${item.preview || ''}`),
    recentCommon: (latestPayload.recentCommonRecords || []).map((item) => `${item.id}:${item.title || ''}:${item.preview || ''}`)
  });

  menu.silentClosing = true;
  if (nextSignature !== lastTreeSignature) {
    const tree = buildMenuTree(latestPayload);
    menu.setTree(tree);
    lastTreeSignature = nextSignature;
  }

  if (latestPayload.open) {
    if (!menu.state.visible) {
      menu.showMenu();
    }
  } else {
    if (menu.state.visible) {
      menu.hideMenu(false);
    }
  }
  menu.silentClosing = false;
}

window.deskLibraryFloating.onMenuState(applyMenuState);
window.deskLibraryFloating.getMenuState().then(applyMenuState).catch(() => {});
