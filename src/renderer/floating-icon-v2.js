const button = document.getElementById('floatingAction');
const DOUBLE_CLICK_DELAY_MS = 280;
const HOVER_OPEN_DELAY_MS = 260;

let dragging = false;
let moved = false;
let dragOffset = null;
let pointerStart = null;
let menuOpen = false;
let accumulation = { active: false, count: 0 };
let activePointerId = null;
let hoverOpening = false;
let lastOpenRequestAt = 0;
let dragReady = false;
let startDragInFlight = false;
let pendingDragPoint = null;
let dragMoveRaf = 0;
let dragSessionId = 0;
let clickTimer = null;
let hoverOpenTimer = null;
let lastClickAt = 0;
let hoverSuppressedUntil = 0;

function clearClickTimer() {
  if (!clickTimer) return;
  clearTimeout(clickTimer);
  clickTimer = null;
}

function clearHoverOpenTimer() {
  if (!hoverOpenTimer) return;
  clearTimeout(hoverOpenTimer);
  hoverOpenTimer = null;
}

function queueDragMove() {
  if (!dragReady || !pendingDragPoint || dragMoveRaf) return;
  dragMoveRaf = requestAnimationFrame(() => {
    dragMoveRaf = 0;
    if (!dragReady || !pendingDragPoint) return;
    const point = pendingDragPoint;
    pendingDragPoint = null;
    window.deskLibraryFloating.dragMove(point).catch(() => {});
    if (pendingDragPoint) {
      queueDragMove();
    }
  });
}

function getButtonAnchorPayload() {
  const rect = button.getBoundingClientRect();
  const centerX = Math.round(window.screenX + rect.left + (rect.width / 2));
  const centerY = Math.round(window.screenY + rect.top + (rect.height / 2));
  return {
    centerX,
    centerY,
    buttonWidth: Math.round(rect.width),
    buttonHeight: Math.round(rect.height)
  };
}

function renderMenuState(payload = {}) {
  menuOpen = !!payload.open;
  accumulation = payload.accumulation || accumulation;

  const opacity = Number(payload.floatingIconOpacity);
  const clampedOpacity = Number.isFinite(opacity) ? Math.max(0.2, Math.min(1, opacity)) : 1;
  button.style.opacity = String(clampedOpacity);

  const active = !!accumulation.active;
  button.classList.toggle('accumulating', active);
  button.title = active ? `累计复制中，已收集 ${accumulation.count || 0} 段` : '快捷菜单';

  const customUrl = String(payload.floatingIconCustomUrl || '').trim();
  if (!active && customUrl) {
    button.textContent = '';
    button.style.backgroundImage = `url("${customUrl.replace(/"/g, '%22')}")`;
    button.style.backgroundColor = 'transparent';
    button.style.backgroundSize = 'contain';
  } else {
    button.textContent = active ? `累计\n${accumulation.count || 0}` : 'D';
    button.style.backgroundImage = '';
    button.style.backgroundColor = '';
    button.style.backgroundSize = 'contain';
  }
}

async function openMenuByHover() {
  const now = Date.now();
  if (now < hoverSuppressedUntil) return;
  if (now - lastOpenRequestAt < 240) return;
  if (hoverOpening || menuOpen || dragging || activePointerId !== null) return;
  lastOpenRequestAt = now;
  hoverOpening = true;
  try {
    await window.deskLibraryFloating.openMenu(getButtonAnchorPayload());
  } finally {
    hoverOpening = false;
  }
}

button.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  clearHoverOpenTimer();
  hoverSuppressedUntil = Date.now() + 420;
  dragging = false;
  moved = false;
  activePointerId = event.pointerId;
  dragSessionId += 1;
  button.setPointerCapture(event.pointerId);
  pointerStart = { x: event.screenX, y: event.screenY };
  dragOffset = {
    offsetX: event.offsetX,
    offsetY: event.offsetY
  };
});

button.addEventListener('dragstart', (event) => {
  event.preventDefault();
});

button.addEventListener('pointermove', (event) => {
  if (activePointerId === null || event.pointerId !== activePointerId) return;
  const passedThreshold = !!pointerStart && (
    Math.abs(event.screenX - pointerStart.x) > 6 || Math.abs(event.screenY - pointerStart.y) > 6
  );
  if (passedThreshold || dragging) {
    moved = true;
  }
  if (!dragging && passedThreshold) {
    dragging = true;
    startDragInFlight = true;
    const sessionId = dragSessionId;
    window.deskLibraryFloating.startDrag({
      offsetX: dragOffset?.offsetX || 0,
      offsetY: dragOffset?.offsetY || 0
    }).then(() => {
      if (sessionId !== dragSessionId || activePointerId === null || !dragging) {
        startDragInFlight = false;
        dragReady = false;
        return;
      }
      startDragInFlight = false;
      dragReady = true;
      queueDragMove();
    }).catch(() => {
      if (sessionId !== dragSessionId) {
        return;
      }
      startDragInFlight = false;
      dragReady = false;
      dragging = false;
    });
  }
  if (!dragging) return;
  pendingDragPoint = {
    screenX: event.screenX,
    screenY: event.screenY
  };
  queueDragMove();
});

button.addEventListener('pointerup', async (event) => {
  if (activePointerId === null || event.pointerId !== activePointerId) return;
  if (dragging || startDragInFlight) {
    dragging = false;
    dragReady = false;
    startDragInFlight = false;
    pendingDragPoint = null;
    if (dragMoveRaf) {
      cancelAnimationFrame(dragMoveRaf);
      dragMoveRaf = 0;
    }
    await window.deskLibraryFloating.endDrag();
  }
  button.releasePointerCapture(event.pointerId);
  activePointerId = null;
  dragSessionId += 1;
  pointerStart = null;
  dragOffset = null;
});

button.addEventListener('pointercancel', async (event) => {
  if (activePointerId === null || event.pointerId !== activePointerId) return;
  if (dragging || startDragInFlight) {
    dragging = false;
    dragReady = false;
    startDragInFlight = false;
    pendingDragPoint = null;
    if (dragMoveRaf) {
      cancelAnimationFrame(dragMoveRaf);
      dragMoveRaf = 0;
    }
    await window.deskLibraryFloating.endDrag();
  }
  try {
    button.releasePointerCapture(event.pointerId);
  } catch {}
  activePointerId = null;
  dragSessionId += 1;
  pointerStart = null;
  dragOffset = null;
});

window.addEventListener('blur', async () => {
  clearClickTimer();
  clearHoverOpenTimer();
  if (dragging || startDragInFlight) {
    dragging = false;
    dragReady = false;
    startDragInFlight = false;
    pendingDragPoint = null;
    if (dragMoveRaf) {
      cancelAnimationFrame(dragMoveRaf);
      dragMoveRaf = 0;
    }
    try {
      await window.deskLibraryFloating.endDrag();
    } catch {}
  }
  activePointerId = null;
  dragSessionId += 1;
  pointerStart = null;
  dragOffset = null;
});

button.addEventListener('click', async () => {
  if (dragging || activePointerId !== null) {
    return;
  }
  if (moved) {
    moved = false;
    return;
  }
  const now = Date.now();
  if (now - lastClickAt <= DOUBLE_CLICK_DELAY_MS) {
    lastClickAt = 0;
    clearClickTimer();
    hoverSuppressedUntil = now + 520;
    await window.deskLibraryFloating.openMainWindow();
    return;
  }
  lastClickAt = now;
  clearClickTimer();
  if (menuOpen) {
    return;
  }
  clickTimer = setTimeout(() => {
    clickTimer = null;
    lastClickAt = 0;
    openMenuByHover().catch(() => {});
  }, DOUBLE_CLICK_DELAY_MS);
});

button.addEventListener('mouseenter', () => {
  if (dragging) return;
  clearHoverOpenTimer();
  hoverOpenTimer = setTimeout(() => {
    hoverOpenTimer = null;
    openMenuByHover().catch(() => {});
  }, HOVER_OPEN_DELAY_MS);
});

button.addEventListener('mouseleave', () => {
  clearHoverOpenTimer();
});

window.deskLibraryFloating.onMenuState(renderMenuState);
window.deskLibraryFloating.getMenuState().then(renderMenuState).catch(() => {});
