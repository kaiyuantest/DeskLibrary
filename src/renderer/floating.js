const button = document.getElementById('floatingAction');
let dragging = false;
let moved = false;
let startPoint = null;

button.addEventListener('mousedown', async (event) => {
  dragging = true;
  moved = false;
  startPoint = { x: event.screenX, y: event.screenY };
  await window.click2saveFloating.startDrag({
    offsetX: event.offsetX,
    offsetY: event.offsetY
  });
});

window.addEventListener('mousemove', async (event) => {
  if (!dragging) return;
  if (Math.abs(event.screenX - startPoint.x) > 2 || Math.abs(event.screenY - startPoint.y) > 2) {
    moved = true;
  }
  await window.click2saveFloating.dragMove({
    screenX: event.screenX,
    screenY: event.screenY
  });
});

window.addEventListener('mouseup', async () => {
  if (!dragging) return;
  dragging = false;
  await window.click2saveFloating.endDrag();
});

button.addEventListener('click', async () => {
  if (moved) {
    moved = false;
    return;
  }
  await window.click2saveFloating.openMainWindow();
});
