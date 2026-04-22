const els = {
  vaultPath: document.getElementById("vaultPath"),
  vaultName: document.getElementById("vaultName"),
  formatVersion: document.getElementById("formatVersion"),
  countsGrid: document.getElementById("countsGrid"),
  recordsCount: document.getElementById("recordsCount"),
  imagesCount: document.getElementById("imagesCount"),
  filesCount: document.getElementById("filesCount"),
  cardsCount: document.getElementById("cardsCount"),
  recordsList: document.getElementById("recordsList"),
  imagesList: document.getElementById("imagesList"),
  filesList: document.getElementById("filesList"),
  cardsList: document.getElementById("cardsList"),
  refreshBtn: document.getElementById("refreshBtn"),
  selectVaultBtn: document.getElementById("selectVaultBtn"),
  openVaultBtn: document.getElementById("openVaultBtn")
};

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderCounts(counts = {}) {
  const entries = [
    ["rawRecords", "文本"],
    ["rawImages", "图片"],
    ["rawFiles", "文件"],
    ["rawBrowserCards", "卡片"],
    ["stagingDocuments", "Staging"],
    ["finalDocuments", "Final"]
  ];

  els.countsGrid.innerHTML = entries
    .map(
      ([key, label]) => `
        <article class="count-card">
          <div class="count-number">${Number(counts[key] || 0)}</div>
          <div class="count-name">${escapeHtml(label)}</div>
        </article>
      `
    )
    .join("");
}

function renderList(target, items, mapper) {
  if (!items?.length) {
    target.innerHTML = '<div class="empty">暂无数据</div>';
    return;
  }
  target.innerHTML = items.map(mapper).join("");
}

function applySnapshot(snapshot) {
  els.vaultPath.textContent = snapshot.vaultPath || "";
  els.vaultName.textContent = snapshot.manifest?.displayName || "";
  els.formatVersion.textContent = snapshot.manifest?.formatVersion || "";
  renderCounts(snapshot.counts || {});

  els.recordsCount.textContent = `${snapshot.counts?.rawRecords || 0} 条`;
  els.imagesCount.textContent = `${snapshot.counts?.rawImages || 0} 条`;
  els.filesCount.textContent = `${snapshot.counts?.rawFiles || 0} 条`;
  els.cardsCount.textContent = `${snapshot.counts?.rawBrowserCards || 0} 张`;

  renderList(els.recordsList, snapshot.samples?.records || [], (item) => `
    <article class="list-item">
      <div class="item-title">${escapeHtml(item.title)}</div>
      <div class="item-preview">${escapeHtml(item.preview)}</div>
      <div class="item-meta">${escapeHtml(item.sourceApp || "未知来源")} · ${escapeHtml(item.updatedAt)}</div>
    </article>
  `);

  renderList(els.imagesList, snapshot.samples?.images || [], (item) => `
    <article class="image-card">
      ${item.previewUrl ? `<img src="${item.previewUrl}" alt="${escapeHtml(item.name)}" />` : ""}
      <div class="item-title">${escapeHtml(item.name)}</div>
      <div class="item-preview">${escapeHtml(item.caption)}</div>
      <div class="item-meta">${escapeHtml(item.updatedAt)}</div>
    </article>
  `);

  renderList(els.filesList, snapshot.samples?.files || [], (item) => `
    <article class="list-item">
      <div class="item-title">${escapeHtml(item.name)}</div>
      <div class="item-preview">${escapeHtml(item.mode)} · ${escapeHtml(item.entryType)}</div>
      <div class="item-meta">${escapeHtml(item.primaryPath || item.sourcePath)}</div>
    </article>
  `);

  renderList(els.cardsList, snapshot.samples?.cards || [], (item) => `
    <article class="list-item">
      <div class="item-title">${escapeHtml(item.name || item.domain)}</div>
      <div class="item-preview">${escapeHtml(item.domain)}</div>
      <div class="item-meta">${escapeHtml(item.sourceType)}</div>
    </article>
  `);
}

async function refresh() {
  const snapshot = await window.deskLibraryNext.getVaultSnapshot();
  applySnapshot(snapshot);
}

els.refreshBtn.addEventListener("click", refresh);
els.openVaultBtn.addEventListener("click", async () => {
  await window.deskLibraryNext.openVaultFolder();
});
els.selectVaultBtn.addEventListener("click", async () => {
  const result = await window.deskLibraryNext.selectVaultFolder();
  if (result?.ok && result.snapshot) {
    applySnapshot(result.snapshot);
  }
});

refresh().catch((error) => {
  document.body.innerHTML = `<pre>${escapeHtml(error.stack || error.message || String(error))}</pre>`;
});
