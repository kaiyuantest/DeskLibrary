const button = document.getElementById('floatingAction');

let dragging = false;
let moved = false;
let dragOffset = null;
let pointerStart = null;
let menuOpen = false;
let accumulation = { active: false, count: 0 };
let activePointerId = null;

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
  } else {
    button.textContent = active ? `累计\n${accumulation.count || 0}` : 'D';
    button.style.backgroundImage = '';
    button.style.backgroundColor = '';
  }
}

button.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  dragging = false;
  moved = false;
  activePointerId = event.pointerId;
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

button.addEventListener('pointermove', async (event) => {
  if (activePointerId === null || event.pointerId !== activePointerId) return;
  const passedThreshold = !!pointerStart && (
    Math.abs(event.screenX - pointerStart.x) > 2 || Math.abs(event.screenY - pointerStart.y) > 2
  );
  if (passedThreshold || dragging) {
    moved = true;
  }
  if (!dragging && passedThreshold) {
    dragging = true;
    await window.deskLibraryFloating.startDrag({
      offsetX: dragOffset?.offsetX || 0,
      offsetY: dragOffset?.offsetY || 0
    });
  }
  if (!dragging) return;
  await window.deskLibraryFloating.dragMove({
    screenX: event.screenX,
    screenY: event.screenY
  });
});

button.addEventListener('pointerup', async (event) => {
  if (activePointerId === null || event.pointerId !== activePointerId) return;
  if (dragging) {
    dragging = false;
    await window.deskLibraryFloating.endDrag();
  }
  button.releasePointerCapture(event.pointerId);
  activePointerId = null;
  pointerStart = null;
  dragOffset = null;
});

button.addEventListener('pointercancel', async (event) => {
  if (activePointerId === null || event.pointerId !== activePointerId) return;
  if (dragging) {
    dragging = false;
    await window.deskLibraryFloating.endDrag();
  }
  try {
    button.releasePointerCapture(event.pointerId);
  } catch {}
  activePointerId = null;
  pointerStart = null;
  dragOffset = null;
});

button.addEventListener('click', async () => {
  if (dragging) {
    return;
  }
  if (moved) {
    moved = false;
    return;
  }
  if (menuOpen) {
    return;
  }
  await window.deskLibraryFloating.openMenu(getButtonAnchorPayload());
});

button.addEventListener('dblclick', async (event) => {
  event.preventDefault();
  if (moved) {
    moved = false;
    return;
  }
  await window.deskLibraryFloating.openMainWindow();
  await window.deskLibraryFloating.closeMenu();
});

button.addEventListener('mouseenter', () => {
  if (dragging) return;
  window.deskLibraryFloating.setHovered(true);
});

button.addEventListener('mouseleave', () => {
  if (dragging) return;
  window.deskLibraryFloating.setHovered(false);
});

window.addEventListener('blur', () => {
  window.deskLibraryFloating.setHovered(false);
});

window.deskLibraryFloating.onMenuState(renderMenuState);
window.deskLibraryFloating.getMenuState().then(renderMenuState).catch(() => {});
