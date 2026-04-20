const selectionEl = document.getElementById('selection');
let displayBounds = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
let dragging = false;
let start = null;
let currentRect = null;

function normalizeRect(x1, y1, x2, y2) {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  return { x: left, y: top, width, height };
}

function renderRect(rect) {
  if (!rect) {
    selectionEl.classList.add('hidden');
    return;
  }
  selectionEl.classList.remove('hidden');
  selectionEl.style.left = `${rect.x}px`;
  selectionEl.style.top = `${rect.y}px`;
  selectionEl.style.width = `${rect.width}px`;
  selectionEl.style.height = `${rect.height}px`;
}

window.deskLibraryScreenshot.onSelectionInit((payload = {}) => {
  const bounds = payload.displayBounds || {};
  displayBounds = {
    x: Number(bounds.x) || 0,
    y: Number(bounds.y) || 0,
    width: Number(bounds.width) || window.innerWidth,
    height: Number(bounds.height) || window.innerHeight
  };
});

window.addEventListener('mousedown', (event) => {
  dragging = true;
  start = { x: event.clientX, y: event.clientY };
  currentRect = { x: start.x, y: start.y, width: 0, height: 0 };
  renderRect(currentRect);
});

window.addEventListener('mousemove', (event) => {
  if (!dragging || !start) return;
  currentRect = normalizeRect(start.x, start.y, event.clientX, event.clientY);
  renderRect(currentRect);
});

window.addEventListener('mouseup', async (event) => {
  if (!dragging || !start) return;
  dragging = false;
  currentRect = normalizeRect(start.x, start.y, event.clientX, event.clientY);
  renderRect(currentRect);

  if (!currentRect || currentRect.width < 8 || currentRect.height < 8) {
    await window.deskLibraryScreenshot.cancelSelection();
    return;
  }

  const payload = {
    x: Math.round(displayBounds.x + currentRect.x),
    y: Math.round(displayBounds.y + currentRect.y),
    width: Math.round(currentRect.width),
    height: Math.round(currentRect.height)
  };
  await window.deskLibraryScreenshot.completeSelection(payload);
});

window.addEventListener('keydown', async (event) => {
  if (event.key === 'Escape') {
    await window.deskLibraryScreenshot.cancelSelection();
  }
});
