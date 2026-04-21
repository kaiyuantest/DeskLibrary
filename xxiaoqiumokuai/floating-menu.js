class FloatingCircleMenu {
  constructor(options = {}) {
    this.options = {
      buttonId: options.buttonId || "show-circle-btn",
      baseRadius: Number(options.baseRadius || 88),
      radiusStep: Number(options.radiusStep || 34),
      maxNodesPerLayer: Math.max(3, Number(options.maxNodesPerLayer || 6)),
      rootLabel: options.rootLabel || "D",
      closeAfterLeaf: options.closeAfterLeaf !== false,
      tree: options.tree || { id: "root", label: "D", children: [] },
      onAction: typeof options.onAction === "function" ? options.onAction : () => {}
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
    this.expandingGuard = "";
    this.leaveTimer = null;
    this.syntheticIdSeed = 0;
    this.runtime = {
      accumulationActive: false,
      dockToEdgeEnabled: true
    };

    this.init();
  }

  init() {
    this.injectStyles();
    this.createUi();
    this.bindTrigger();
    this.bindGlobal();
  }

  injectStyles() {
    if (document.getElementById("floating-menu-multi-style-v4")) return;
    const style = document.createElement("style");
    style.id = "floating-menu-multi-style-v4";
    style.textContent = `
      .fm-root {
        position: fixed;
        left: 50%;
        top: 50%;
        width: 56px;
        height: 56px;
        transform: translate(-50%, -50%);
        display: none;
        z-index: 99999;
      }
      .fm-root.visible { display: block; }
      .fm-center {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 56px;
        height: 56px;
        margin-left: -28px;
        margin-top: -28px;
        border-radius: 999px;
        border: 0;
        color: #fff;
        background: linear-gradient(140deg, #1f6feb, #57a5ff);
        font: 700 14px/1 "Microsoft YaHei UI", sans-serif;
        cursor: pointer;
        box-shadow: 0 12px 28px rgba(26, 79, 170, 0.35);
      }
      .fm-ring-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .fm-orb {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 42px;
        height: 42px;
        margin-left: -21px;
        margin-top: -21px;
        border-radius: 999px;
        border: 1px solid rgba(180, 214, 255, 0.42);
        background: linear-gradient(145deg, #174aa7, #1d69d8);
        color: #eff6ff;
        font: 700 12px/1 "Microsoft YaHei UI", sans-serif;
        pointer-events: auto;
        cursor: pointer;
        opacity: 0;
        transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(0.84);
        transition: transform 140ms ease, opacity 140ms ease, box-shadow 120ms ease;
      }
      .fm-orb.visible {
        opacity: 1;
        transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(1);
      }
      .fm-orb.danger {
        background: linear-gradient(145deg, #8f2432, #cf3e52);
        border-color: rgba(255, 202, 207, 0.48);
      }
      .fm-orb:hover,
      .fm-orb.active {
        box-shadow: 0 10px 22px rgba(40, 97, 190, 0.38);
        border-color: rgba(213, 231, 255, 0.7);
      }
      .fm-tip {
        position: absolute;
        left: 50%;
        bottom: calc(100% + 7px);
        transform: translateX(-50%);
        white-space: nowrap;
        border-radius: 8px;
        background: rgba(9, 19, 39, 0.92);
        border: 1px solid rgba(142, 180, 245, 0.34);
        color: #e7f0ff;
        padding: 5px 8px;
        font: 500 11px/1.2 "Microsoft YaHei UI", sans-serif;
        opacity: 0;
        pointer-events: none;
        transition: opacity 120ms ease;
      }
      .fm-orb:hover .fm-tip,
      .fm-orb.active .fm-tip { opacity: 1; }
      .fm-msg {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        max-width: 90vw;
        border-radius: 8px;
        padding: 8px 10px;
        color: #e7f0ff;
        background: rgba(9, 19, 39, 0.92);
        border: 1px solid rgba(142, 180, 245, 0.34);
        font: 500 12px/1.3 "Microsoft YaHei UI", sans-serif;
        display: none;
        z-index: 100000;
      }
      .fm-msg.visible { display: block; }
    `;
    document.head.appendChild(style);
  }

  createUi() {
    this.root = document.createElement("div");
    this.root.className = "fm-root";

    this.center = document.createElement("button");
    this.center.className = "fm-center";
    this.center.type = "button";
    this.center.textContent = this.options.rootLabel;
    this.bindTap(this.center, () => this.onCenterTap());
    this.root.appendChild(this.center);

    this.msg = document.createElement("div");
    this.msg.className = "fm-msg";
    document.body.appendChild(this.msg);
    document.body.appendChild(this.root);

    this.root.addEventListener("mouseenter", () => {
      if (this.leaveTimer) {
        clearTimeout(this.leaveTimer);
        this.leaveTimer = null;
      }
    });
  }

  bindTrigger() {
    const btn = document.getElementById(this.options.buttonId);
    if (!btn) {
      this.showMessage(`未找到按钮 #${this.options.buttonId}`);
      return;
    }
    this.bindTap(btn, () => {
      if (this.state.visible) this.hideMenu();
      else this.showMenu();
    });
  }

  bindGlobal() {
    document.addEventListener("click", (event) => {
      if (!this.state.visible) return;
      if (!this.root.contains(event.target) && event.target.id !== this.options.buttonId) {
        this.hideMenu();
      }
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.hideMenu();
    });
    document.addEventListener("mousemove", (event) => {
      if (!this.state.visible) return;
      this.handlePointerKeepZone(event.clientX, event.clientY);
    });
  }

  bindTap(node, handler) {
    let touched = false;
    node.addEventListener("touchend", (e) => {
      e.preventDefault();
      e.stopPropagation();
      touched = true;
      handler(e);
      setTimeout(() => { touched = false; }, 300);
    }, { passive: false });
    node.addEventListener("click", (e) => {
      if (touched) return;
      e.preventDefault();
      e.stopPropagation();
      handler(e);
    });
  }

  showMenu() {
    this.syncRuntimeBranches();
    this.state.visible = true;
    this.root.classList.add("visible");
    this.collapseToCenter();
  }

  hideMenu() {
    this.state.visible = false;
    this.root.classList.remove("visible");
    this.clearLayersFrom(0);
    this.state.activePath = [];
    this.state.layerAnchors = [{ x: 0, y: 0 }];
    this.state.keepZones = [];
    this.center.textContent = this.options.rootLabel;
  }

  onCenterTap() {
    const now = Date.now();
    if (now - this.lastCenterTap < 280) {
      this.hideMenu();
      this.lastCenterTap = 0;
      return;
    }
    this.lastCenterTap = now;
    if (this.ringLayers.length === 0) {
      this.expandFromCenterToSecondLayer();
      return;
    }
    if (!this.state.activePath.length) {
      this.collapseToCenter();
      return;
    }
    this.state.activePath.pop();
    this.state.layerAnchors = this.state.layerAnchors.slice(0, this.state.activePath.length + 1);
    this.state.keepZones = this.state.keepZones.slice(0, this.state.activePath.length);
    this.renderFromDepth(this.state.activePath.length);
  }

  expandFromCenterToSecondLayer() {
    const rootChildren = Array.isArray(this.options.tree?.children) ? this.options.tree.children : [];
    if (!rootChildren.length) {
      this.state.activePath = [];
      this.state.layerAnchors = [{ x: 0, y: 0 }];
      this.state.keepZones = [];
      this.renderFromDepth(0);
      return;
    }

    const first = rootChildren[0];
    const n = rootChildren.length;
    const idx = 0;
    const angle = (-Math.PI / 2) + ((Math.PI * 2) * idx) / n;
    const anchor = {
      x: Math.cos(angle) * this.getLayerRadius(0),
      y: Math.sin(angle) * this.getLayerRadius(0)
    };

    this.state.activePath = [first];
    this.state.layerAnchors = [{ x: 0, y: 0 }, anchor];
    this.state.keepZones = [this.makeKeepZone(0, anchor)];
    this.renderFromDepth(1);
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

  renderFromDepth(depth) {
    this.clearLayersFrom(0);
    this.state.layerAnchors = this.state.layerAnchors.slice(0, Math.max(1, this.state.activePath.length + 1));
    this.state.keepZones = this.state.keepZones.slice(0, this.state.activePath.length);
    this.center.textContent = this.state.activePath.length ? "返" : this.options.rootLabel;

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
    this.center.textContent = this.options.rootLabel;
  }

  renderLayer(depth, nodes) {
    const layer = document.createElement("div");
    layer.className = "fm-ring-layer";
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
      const orb = document.createElement("button");
      orb.className = "fm-orb";
      if (selected && selected.id === item.id) orb.classList.add("active");
      if (item.danger) orb.classList.add("danger");
      orb.type = "button";
      orb.dataset.depth = String(depth);
      orb.textContent = item.label || "?";
      orb.style.setProperty("--dx", `${x}px`);
      orb.style.setProperty("--dy", `${y}px`);

      const tip = document.createElement("span");
      tip.className = "fm-tip";
      tip.textContent = item.tip || item.label || "";
      orb.appendChild(tip);

      this.bindOrbInteraction(orb, item, depth);
      layer.appendChild(orb);
      requestAnimationFrame(() => orb.classList.add("visible"));
    });
  }

  limitLayerNodes(nodes, depth) {
    const max = this.options.maxNodesPerLayer;
    if (!Array.isArray(nodes) || nodes.length <= max) {
      return Array.isArray(nodes) ? nodes : [];
    }
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
      label: "更多",
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
      setTimeout(() => { if (this.expandingGuard === guardKey) this.expandingGuard = ""; }, 120);

      this.state.activePath = this.state.activePath.slice(0, depth);
      this.state.activePath[depth] = item;
      this.state.layerAnchors = this.state.layerAnchors.slice(0, depth + 1);
      const parentAnchor = this.getOrbAnchor(orb);
      this.state.layerAnchors[depth + 1] = parentAnchor;
      this.state.keepZones = this.state.keepZones.slice(0, depth);
      this.state.keepZones[depth] = this.makeKeepZone(depth, parentAnchor);
      this.renderFromDepth(depth + 1);
    };

    orb.addEventListener("mouseenter", () => {
      if (hasChildren) expand();
    });

    orb.addEventListener("touchstart", (e) => {
      touchMoved = false;
      if (hasChildren) {
        e.preventDefault();
        e.stopPropagation();
        expand();
      }
    }, { passive: false });

    orb.addEventListener("pointerdown", (e) => {
      if (!hasChildren) return;
      if (e.pointerType && e.pointerType !== "mouse") return;
      e.preventDefault();
      e.stopPropagation();
      expand();
    });

    orb.addEventListener("touchmove", () => {
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
    // depth: 0 表示从第一层父圆到第二层子圆的保活范围
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

    // 若鼠标正悬停在某个圆球上，直接保留到该圆所在层
    const hovered = document.elementFromPoint(clientX, clientY);
    const orb = hovered && hovered.closest ? hovered.closest(".fm-orb") : null;
    if (orb) {
      const d = Number.parseInt(String(orb.dataset.depth || "0"), 10);
      if (Number.isFinite(d)) {
        keepLen = Math.max(keepLen, d + 1);
      }
    }

    // 命中任一层的保活范围即可，取最深命中层，不再要求“逐层都命中”
    for (let i = 0; i < this.state.keepZones.length; i += 1) {
      const z = this.state.keepZones[i];
      if (!z) continue;
      const dx = p.x - z.cx;
      const dy = p.y - z.cy;
      if ((dx * dx) + (dy * dy) <= (z.r * z.r)) {
        keepLen = Math.max(keepLen, i + 1);
      }
    }

    if (keepLen < this.state.activePath.length) {
      this.state.activePath = this.state.activePath.slice(0, keepLen);
      this.state.layerAnchors = this.state.layerAnchors.slice(0, keepLen + 1);
      this.state.keepZones = this.state.keepZones.slice(0, keepLen);
      if (keepLen === 0) {
        this.collapseToCenter();
      } else {
        this.renderFromDepth(keepLen);
      }
    }
  }

  getOrbAnchor(orb) {
    const x = Number.parseFloat(String(orb.style.getPropertyValue("--dx") || "0").replace("px", "")) || 0;
    const y = Number.parseFloat(String(orb.style.getPropertyValue("--dy") || "0").replace("px", "")) || 0;
    return { x, y };
  }

  async executeLeaf(node) {
    const action = node.action || { type: "noop", message: "无动作" };
    const result = await this.runAction(action, node);
    this.syncRuntimeBranches();
    const msg = result && result.message ? result.message : `执行：${node.label || "动作"}`;
    this.showMessage(msg);
    this.options.onAction({
      node,
      action,
      message: msg,
      ok: result ? result.ok !== false : true,
      time: new Date().toISOString()
    });
    if (this.options.closeAfterLeaf) this.hideMenu();
  }

  async runAction(action, node) {
    switch (action.type) {
      case "copy-text": {
        const ok = await this.copyText(action.text || "");
        return { ok, message: ok ? `已复制：${this.shortText(action.text)}` : "复制失败" };
      }
      case "open-url":
        window.open(String(action.url || ""), "_blank");
        return { ok: true, message: `已打开网址：${action.url}` };
      case "open-path": {
        const p = String(action.path || "");
        window.open(`file:///${p.replace(/\\/g, "/")}`, "_blank");
        return { ok: true, message: `尝试打开路径：${p}` };
      }
      case "open-main-window":
        return { ok: true, message: "Demo：打开主窗口" };
      case "goto-page":
        return { ok: true, message: `Demo：切换到 ${action.page}` };
      case "quick-save-daily":
        return { ok: true, message: "Demo：已收藏到每日" };
      case "quick-save-common":
        return { ok: true, message: "Demo：已收藏到常用" };
      case "move-common":
        return { ok: true, message: `Demo：${action.title || node.label} 已转常用` };
      case "move-daily":
        return { ok: true, message: `Demo：${action.title || node.label} 已移回每日` };
      case "delete-last":
        return { ok: true, message: "Demo：已删除上次收藏" };
      case "delete-record":
        return { ok: true, message: `Demo：已删除 ${action.title || node.label}` };
      case "card-test":
        return { ok: true, message: `Demo：已测试 ${action.target || node.label}` };
      case "card-inject":
        return { ok: true, message: `Demo：已注入 ${action.target || node.label}` };
      case "acc-start":
        this.runtime.accumulationActive = true;
        return { ok: true, message: "Demo：开始累计" };
      case "acc-finish":
        this.runtime.accumulationActive = false;
        return { ok: true, message: "Demo：结束累计" };
      case "acc-undo":
        return { ok: true, message: "Demo：撤销上一段" };
      case "acc-cancel":
        this.runtime.accumulationActive = false;
        return { ok: true, message: "Demo：取消累计" };
      case "ocr-start":
        return { ok: true, message: "Demo：截图翻译" };
      case "toggle-dock":
        this.runtime.dockToEdgeEnabled = !this.runtime.dockToEdgeEnabled;
        return {
          ok: true,
          message: `Demo：靠边显示已${this.runtime.dockToEdgeEnabled ? "开启" : "关闭"}`
        };
      case "hide-floating":
        return { ok: true, message: "Demo：关闭悬浮图标" };
      case "noop":
      default:
        return { ok: true, message: action.message || `Demo：${node.label}` };
    }
  }

  async copyText(text) {
    const value = String(text || "");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch {
      return false;
    }
  }

  shortText(text) {
    const t = String(text || "").replace(/\s+/g, " ").trim();
    return t.length <= 16 ? t : `${t.slice(0, 16)}...`;
  }

  showMessage(text) {
    this.msg.textContent = text;
    this.msg.classList.add("visible");
    clearTimeout(this.msgTimer);
    this.msgTimer = setTimeout(() => this.msg.classList.remove("visible"), 1500);
  }

  syncRuntimeBranches() {
    const accNode = this.findNodeById(this.options.tree, "acc");
    if (accNode) {
      accNode.tip = this.runtime.accumulationActive
        ? "累计中：结束/撤销/取消"
        : "累计未开始：点击开始";
      accNode.children = this.runtime.accumulationActive
        ? [
            { id: "acc.finish", label: "结束", action: { type: "acc-finish" } },
            { id: "acc.undo", label: "撤销", action: { type: "acc-undo" } },
            { id: "acc.cancel", label: "取消", action: { type: "acc-cancel" }, danger: true }
          ]
        : [
            { id: "acc.start", label: "开始", action: { type: "acc-start" } }
          ];
    }

    const settingsNode = this.findNodeById(this.options.tree, "more.settings");
    if (settingsNode) {
      settingsNode.children = [
        {
          id: "more.settings.dock",
          label: this.runtime.dockToEdgeEnabled ? "靠边:开" : "靠边:关",
          action: { type: "toggle-dock" }
        }
      ];
    }
  }

  findNodeById(node, id) {
    if (!node) return null;
    if (node.id === id) return node;
    const children = Array.isArray(node.children) ? node.children : [];
    for (let i = 0; i < children.length; i += 1) {
      const found = this.findNodeById(children[i], id);
      if (found) return found;
    }
    return null;
  }
}

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = FloatingCircleMenu;
}
