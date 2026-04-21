class FloatingCircleMenu {
  constructor(options = {}) {
    this.options = {
      buttonId: options.buttonId || "show-circle-btn",
      closeAfterLeafAction: options.closeAfterLeafAction !== false,
      rootLabel: options.rootLabel || "D",
      tree: options.tree || this.buildDefaultTree(),
      onAction: typeof options.onAction === "function" ? options.onAction : () => {}
    };

    this.state = {
      visible: false,
      stack: [this.options.tree]
    };

    this.orbNodes = [];
    this.lastCenterTapAt = 0;
    this.msgTimer = null;

    this.init();
  }

  buildDefaultTree() {
    return {
      id: "root",
      label: "D",
      children: [
        {
          id: "main",
          label: "主",
          tip: "主窗口与页面快捷",
          children: [
            { id: "main.open", label: "主窗", action: { type: "open-main-window" } },
            {
              id: "main.page",
              label: "页面",
              children: [
                { id: "page.daily", label: "每日", action: { type: "goto-page", page: "daily" } },
                { id: "page.common", label: "常用", action: { type: "goto-page", page: "common" } },
                { id: "page.assets", label: "资源", action: { type: "goto-page", page: "assets" } },
                { id: "page.cards", label: "卡片", action: { type: "goto-page", page: "cards" } }
              ]
            },
            {
              id: "main.assets.quick",
              label: "资源",
              children: [
                {
                  id: "assets.folder.fast",
                  label: "文件夹",
                  children: [
                    {
                      id: "folder.project",
                      label: "项目目录",
                      children: [
                        { id: "folder.project.open", label: "打开", action: { type: "open-path", path: "E:\\project\\Click2Save" } },
                        { id: "folder.project.copy", label: "复制", action: { type: "copy-text", text: "E:\\project\\Click2Save" } }
                      ]
                    },
                    {
                      id: "folder.downloads",
                      label: "下载目录",
                      children: [
                        { id: "folder.downloads.open", label: "打开", action: { type: "open-path", path: "C:\\Users\\Asus\\Downloads" } },
                        { id: "folder.downloads.copy", label: "复制", action: { type: "copy-text", text: "C:\\Users\\Asus\\Downloads" } }
                      ]
                    }
                  ]
                },
                {
                  id: "assets.recent.file",
                  label: "最近资源",
                  children: [
                    {
                      id: "asset.req.docx",
                      label: "需求.docx",
                      children: [
                        { id: "asset.req.open", label: "打开", action: { type: "open-path", path: "E:\\docs\\需求评审.docx" } },
                        { id: "asset.req.loc", label: "位置", action: { type: "open-path", path: "E:\\docs" } }
                      ]
                    },
                    {
                      id: "asset.design.zip",
                      label: "素材.zip",
                      children: [
                        { id: "asset.design.open", label: "打开", action: { type: "open-path", path: "E:\\assets\\素材.zip" } },
                        { id: "asset.design.loc", label: "位置", action: { type: "open-path", path: "E:\\assets" } }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              id: "main.cards.quick",
              label: "浏览",
              children: [
                {
                  id: "cards.recent",
                  label: "最近卡",
                  children: [
                    {
                      id: "card.shop.demo",
                      label: "shop",
                      children: [
                        { id: "card.shop.open", label: "打开", action: { type: "open-url", url: "https://shop.demo.example" } },
                        { id: "card.shop.test", label: "测试", action: { type: "card-connectivity-test", target: "shop.demo.example" } },
                        { id: "card.shop.inject", label: "注入", action: { type: "card-inject", target: "shop.demo.example" } }
                      ]
                    },
                    {
                      id: "card.portal.demo",
                      label: "portal",
                      children: [
                        { id: "card.portal.open", label: "打开", action: { type: "open-url", url: "https://portal.demo.example" } },
                        { id: "card.portal.test", label: "测试", action: { type: "card-connectivity-test", target: "portal.demo.example" } },
                        { id: "card.portal.inject", label: "注入", action: { type: "card-inject", target: "portal.demo.example" } }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "save",
          label: "存",
          tip: "每日收藏与最近三天",
          children: [
            { id: "save.now", label: "立即存", action: { type: "quick-save-daily" } },
            {
              id: "save.days3",
              label: "近3天",
              children: [
                {
                  id: "save.d1",
                  label: "会议要点",
                  children: [
                    { id: "save.d1.copy", label: "复制", action: { type: "copy-text", text: "会议要点：完成悬浮菜单圈层改造与联调" } },
                    { id: "save.d1.common", label: "转常", action: { type: "move-to-common", title: "会议要点" } },
                    { id: "save.d1.delete", label: "删除", action: { type: "delete-record", title: "会议要点" } }
                  ]
                },
                {
                  id: "save.d2",
                  label: "demo网址",
                  children: [
                    { id: "save.d2.copy", label: "复制", action: { type: "copy-text", text: "https://example.com/demo" } },
                    { id: "save.d2.open", label: "打开", action: { type: "open-url", url: "https://example.com/demo" } },
                    { id: "save.d2.delete", label: "删除", action: { type: "delete-record", title: "demo网址" } }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "common",
          label: "常",
          tip: "常用收藏与最近三天",
          children: [
            { id: "common.now", label: "立即常", action: { type: "quick-save-common" } },
            {
              id: "common.days3",
              label: "近3天",
              children: [
                {
                  id: "common.item1",
                  label: "登录指引",
                  children: [
                    { id: "common.item1.copy", label: "复制", action: { type: "copy-text", text: "登录指引：先VPN再SSO，最后校验二次验证码" } },
                    { id: "common.item1.daily", label: "回每", action: { type: "move-to-daily", title: "登录指引" } },
                    { id: "common.item1.delete", label: "删除", action: { type: "delete-record", title: "登录指引" } }
                  ]
                },
                {
                  id: "common.item2",
                  label: "运营后台",
                  children: [
                    { id: "common.item2.copy", label: "复制", action: { type: "copy-text", text: "https://ops.example.com" } },
                    { id: "common.item2.open", label: "打开", action: { type: "open-url", url: "https://ops.example.com" } },
                    { id: "common.item2.daily", label: "回每", action: { type: "move-to-daily", title: "运营后台" } }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "deleteLast",
          label: "删",
          tip: "删除入口",
          children: [
            { id: "delete.last.direct", label: "删上次", action: { type: "delete-last" } },
            {
              id: "delete.pick",
              label: "选删",
              children: [
                { id: "delete.pick.1", label: "日报草稿", action: { type: "delete-record", title: "日报草稿" } },
                { id: "delete.pick.2", label: "测试命令", action: { type: "delete-record", title: "测试命令" } }
              ]
            }
          ]
        },
        {
          id: "start",
          label: "始",
          tip: "累计复制",
          children: [
            { id: "acc.start", label: "开始", action: { type: "acc-start" } },
            { id: "acc.finish", label: "结束", action: { type: "acc-finish" } },
            { id: "acc.undo", label: "撤销", action: { type: "acc-undo" } },
            { id: "acc.cancel", label: "取消", action: { type: "acc-cancel" } }
          ]
        },
        {
          id: "ocr",
          label: "译",
          tip: "截图翻译",
          children: [
            { id: "ocr.start", label: "截图", action: { type: "ocr-start" } },
            {
              id: "ocr.history",
              label: "最近译",
              children: [
                { id: "ocr.h1", label: "复制", action: { type: "copy-text", text: "Recent translation: Please review the deployment checklist." } },
                { id: "ocr.h2", label: "再开", action: { type: "ocr-start" } }
              ]
            }
          ]
        },
        {
          id: "hide",
          label: "隐",
          tip: "关闭悬浮",
          children: [
            { id: "hide.confirm", label: "确认", action: { type: "hide-floating" } },
            { id: "hide.cancel", label: "取消", action: { type: "noop", message: "已取消关闭悬浮图标" } }
          ]
        }
      ]
    };
  }

  init() {
    this.injectStyles();
    this.createUi();
    this.bindTrigger();
    this.bindGlobalEvents();
  }

  injectStyles() {
    if (document.getElementById("floating-menu-styles-v3")) return;
    const style = document.createElement("style");
    style.id = "floating-menu-styles-v3";
    style.textContent = `
      .fm-root {
        position: fixed;
        left: 50%;
        top: 50%;
        width: 56px;
        height: 56px;
        transform: translate(-50%, -50%);
        z-index: 99999;
        display: none;
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
        border: 0;
        border-radius: 999px;
        background: linear-gradient(140deg, #1f6feb, #57a5ff);
        color: #fff;
        font: 700 14px/1 "Microsoft YaHei UI", sans-serif;
        box-shadow: 0 12px 28px rgba(26, 79, 170, 0.35);
        cursor: pointer;
      }
      .fm-orb {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 42px;
        height: 42px;
        margin-left: -21px;
        margin-top: -21px;
        border: 1px solid rgba(180, 214, 255, 0.4);
        border-radius: 999px;
        background: linear-gradient(145deg, #174aa7, #1d69d8);
        color: #eff6ff;
        font: 700 12px/1 "Microsoft YaHei UI", sans-serif;
        cursor: pointer;
        opacity: 0;
        transform: translate(0, 0) scale(0.84);
        transition: transform 180ms ease, opacity 180ms ease, box-shadow 120ms ease;
      }
      .fm-orb.visible {
        opacity: 1;
        transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(1);
      }
      .fm-orb:hover { box-shadow: 0 10px 22px rgba(40, 97, 190, 0.36); }
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
      .fm-orb:hover .fm-tip { opacity: 1; }
      .fm-msg {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        max-width: 92vw;
        padding: 8px 10px;
        border-radius: 8px;
        background: rgba(9, 19, 39, 0.92);
        border: 1px solid rgba(142, 180, 245, 0.34);
        color: #e7f0ff;
        font: 500 12px/1.3 "Microsoft YaHei UI", sans-serif;
        z-index: 100000;
        display: none;
      }
      .fm-msg.visible { display: block; }
    `;
    document.head.appendChild(style);
  }

  createUi() {
    this.root = document.createElement("div");
    this.root.className = "fm-root";

    this.centerNode = document.createElement("button");
    this.centerNode.className = "fm-center";
    this.centerNode.type = "button";
    this.centerNode.textContent = this.options.rootLabel;
    this.centerNode.title = "触摸/点击：返回上一级；双击：关闭菜单";
    this.bindTap(this.centerNode, () => this.onCenterTap());
    this.root.appendChild(this.centerNode);

    this.msgNode = document.createElement("div");
    this.msgNode.className = "fm-msg";
    document.body.appendChild(this.msgNode);
    document.body.appendChild(this.root);
  }

  bindTrigger() {
    const trigger = document.getElementById(this.options.buttonId);
    if (!trigger) {
      this.showMessage(`未找到触发按钮 #${this.options.buttonId}`);
      return;
    }
    this.bindTap(trigger, () => {
      if (this.state.visible) this.hideMenu();
      else this.showMenu();
    });
  }

  bindGlobalEvents() {
    document.addEventListener("click", (event) => {
      if (!this.state.visible) return;
      if (!this.root.contains(event.target) && event.target.id !== this.options.buttonId) {
        this.hideMenu();
      }
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.hideMenu();
    });
  }

  bindTap(node, handler) {
    let touchHandled = false;
    node.addEventListener("touchend", (event) => {
      event.preventDefault();
      event.stopPropagation();
      touchHandled = true;
      handler();
      setTimeout(() => { touchHandled = false; }, 320);
    }, { passive: false });
    node.addEventListener("click", (event) => {
      if (touchHandled) return;
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
  }

  onCenterTap() {
    const now = Date.now();
    if (now - this.lastCenterTapAt < 280) {
      this.hideMenu();
      this.lastCenterTapAt = 0;
      return;
    }
    this.lastCenterTapAt = now;

    if (this.state.stack.length > 1) {
      this.state.stack.pop();
      this.renderCurrentLayer();
      return;
    }
    this.hideMenu();
  }

  showMenu() {
    this.state.visible = true;
    this.state.stack = [this.options.tree];
    this.root.classList.add("visible");
    this.renderCurrentLayer();
  }

  hideMenu() {
    this.state.visible = false;
    this.clearOrbNodes();
    this.root.classList.remove("visible");
    this.state.stack = [this.options.tree];
    this.centerNode.textContent = this.options.rootLabel;
  }

  getCurrentNode() {
    return this.state.stack[this.state.stack.length - 1];
  }

  renderCurrentLayer() {
    const current = this.getCurrentNode();
    const children = Array.isArray(current.children) ? current.children : [];
    this.centerNode.textContent = this.state.stack.length > 1 ? "返" : this.options.rootLabel;

    this.clearOrbNodes();
    if (!children.length) return;

    const radius = 92 + (this.state.stack.length - 1) * 30;
    const start = -Math.PI / 2;

    children.forEach((item, index) => {
      const angle = start + ((Math.PI * 2) * index) / children.length;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const orb = document.createElement("button");
      orb.className = "fm-orb";
      orb.type = "button";
      orb.textContent = item.label || "?";
      orb.style.setProperty("--dx", `${x}px`);
      orb.style.setProperty("--dy", `${y}px`);

      const tip = document.createElement("span");
      tip.className = "fm-tip";
      tip.textContent = item.tip || item.label || "";
      orb.appendChild(tip);

      this.bindTap(orb, () => this.onNodeTap(item));
      this.root.appendChild(orb);
      requestAnimationFrame(() => orb.classList.add("visible"));
      this.orbNodes.push(orb);
    });
  }

  clearOrbNodes() {
    this.orbNodes.forEach((node) => node.remove());
    this.orbNodes = [];
  }

  onNodeTap(node) {
    if (Array.isArray(node.children) && node.children.length > 0) {
      this.state.stack.push(node);
      this.renderCurrentLayer();
      return;
    }

    this.executeLeaf(node);
    if (this.options.closeAfterLeafAction) {
      this.hideMenu();
    }
  }

  async executeLeaf(node) {
    const action = node && node.action ? node.action : { type: "noop", message: "无动作" };
    const result = await this.runAction(action, node);
    const msg = result && result.message ? result.message : `执行：${node.label || "动作"}`;
    this.showMessage(msg);
    this.options.onAction({
      node,
      action,
      message: msg,
      ok: result ? result.ok !== false : true,
      time: new Date().toISOString()
    });
  }

  async runAction(action, node) {
    switch (action.type) {
      case "copy-text": {
        const ok = await this.copyText(action.text || "");
        return { ok, message: ok ? `已复制：${this.shortText(action.text)}` : "复制失败（浏览器权限限制）" };
      }
      case "open-url": {
        const url = String(action.url || "").trim();
        if (!url) return { ok: false, message: "URL 为空" };
        window.open(url, "_blank");
        return { ok: true, message: `已打开网址：${url}` };
      }
      case "open-path": {
        const raw = String(action.path || "").trim();
        if (!raw) return { ok: false, message: "路径为空" };
        const asUrl = raw.startsWith("http://") || raw.startsWith("https://")
          ? raw
          : `file:///${raw.replace(/\\/g, "/")}`;
        window.open(asUrl, "_blank");
        return { ok: true, message: `尝试打开：${raw}` };
      }
      case "open-main-window":
        return { ok: true, message: "Demo：打开主窗口" };
      case "goto-page":
        return { ok: true, message: `Demo：切换到 ${action.page} 页面` };
      case "quick-save-daily":
        return { ok: true, message: "Demo：已收藏到每日" };
      case "quick-save-common":
        return { ok: true, message: "Demo：已收藏到常用" };
      case "move-to-common":
        return { ok: true, message: `Demo：${action.title || node.label} 已加入常用` };
      case "move-to-daily":
        return { ok: true, message: `Demo：${action.title || node.label} 已移回每日` };
      case "delete-last":
        return { ok: true, message: "Demo：已删除上次收藏" };
      case "delete-record":
        return { ok: true, message: `Demo：已删除 ${action.title || node.label}` };
      case "card-connectivity-test":
        return { ok: true, message: `Demo：已测试 ${action.target || node.label}` };
      case "card-inject":
        return { ok: true, message: `Demo：已注入到 ${action.target || node.label}` };
      case "acc-start":
        return { ok: true, message: "Demo：开始累计" };
      case "acc-finish":
        return { ok: true, message: "Demo：结束累计" };
      case "acc-undo":
        return { ok: true, message: "Demo：撤销上一段" };
      case "acc-cancel":
        return { ok: true, message: "Demo：取消累计" };
      case "ocr-start":
        return { ok: true, message: "Demo：打开截图翻译" };
      case "hide-floating":
        return { ok: true, message: "Demo：关闭悬浮图标" };
      case "noop":
      default:
        return { ok: true, message: action.message || `Demo：执行 ${node.label}` };
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
      ta.style.pointerEvents = "none";
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
    if (t.length <= 18) return t;
    return `${t.slice(0, 18)}...`;
  }

  showMessage(text) {
    this.msgNode.textContent = text;
    this.msgNode.classList.add("visible");
    clearTimeout(this.msgTimer);
    this.msgTimer = setTimeout(() => {
      this.msgNode.classList.remove("visible");
    }, 1600);
  }
}

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = FloatingCircleMenu;
}
