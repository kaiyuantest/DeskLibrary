const layer = document.getElementById('notesLayer');

let viewport = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
let notes = [];
let interactive = false;

function setInteractive(next) {
  const value = !!next;
  if (interactive === value) return;
  interactive = value;
  window.deskLibrarySticky.setInteractive(value).catch(() => {});
}

function toLocalX(screenX) {
  return Math.round(screenX - viewport.x);
}

function toLocalY(screenY) {
  return Math.round(screenY - viewport.y);
}

function render() {
  if (!layer) return;
  layer.innerHTML = '';
  notes.forEach((note) => {
    const card = document.createElement('article');
    card.className = 'sticky-note';
    card.dataset.noteId = String(note.id);
    card.style.left = `${toLocalX(note.x)}px`;
    card.style.top = `${toLocalY(note.y)}px`;

    const text = document.createElement('div');
    text.className = 'sticky-note-text';
    text.textContent = note.text || '';
    text.title = note.text || '';
    card.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'sticky-note-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'sticky-note-btn primary';
    copyBtn.type = 'button';
    copyBtn.textContent = '⎘';
    copyBtn.title = '复制';
    copyBtn.setAttribute('aria-label', '复制');
    copyBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      await window.deskLibrarySticky.copyNote(note.id);
    });
    actions.appendChild(copyBtn);

    const hideBtn = document.createElement('button');
    hideBtn.className = 'sticky-note-btn';
    hideBtn.type = 'button';
    hideBtn.textContent = '✕';
    hideBtn.title = '关闭显示';
    hideBtn.setAttribute('aria-label', '关闭显示');
    hideBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      await window.deskLibrarySticky.hideNote(note.id);
    });
    actions.appendChild(hideBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'sticky-note-btn danger';
    deleteBtn.type = 'button';
    deleteBtn.textContent = '🗑';
    deleteBtn.title = '彻底删除';
    deleteBtn.setAttribute('aria-label', '彻底删除');
    deleteBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      await window.deskLibrarySticky.deleteNote(note.id);
    });
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    setupDrag(card, note);
    layer.appendChild(card);
  });
}

function setupDrag(card, note) {
  let dragging = false;
  let pointerId = null;
  let startLocalX = 0;
  let startLocalY = 0;
  let originLeft = 0;
  let originTop = 0;

  card.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.sticky-note-btn')) return;
    setInteractive(true);
    dragging = true;
    pointerId = event.pointerId;
    startLocalX = event.clientX;
    startLocalY = event.clientY;
    originLeft = parseFloat(card.style.left || '0');
    originTop = parseFloat(card.style.top || '0');
    card.classList.add('dragging');
    card.setPointerCapture(pointerId);
  });

  card.addEventListener('pointermove', (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const dx = event.clientX - startLocalX;
    const dy = event.clientY - startLocalY;
    card.style.left = `${Math.round(originLeft + dx)}px`;
    card.style.top = `${Math.round(originTop + dy)}px`;
  });

  const finishDrag = async (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    dragging = false;
    card.classList.remove('dragging');
    try {
      card.releasePointerCapture(pointerId);
    } catch {}
    pointerId = null;
    const nextX = viewport.x + parseFloat(card.style.left || '0');
    const nextY = viewport.y + parseFloat(card.style.top || '0');
    await window.deskLibrarySticky.moveNote({
      id: note.id,
      x: Math.round(nextX),
      y: Math.round(nextY)
    });
    setInteractive(false);
  };

  card.addEventListener('pointerup', finishDrag);
  card.addEventListener('pointercancel', finishDrag);
  card.addEventListener('mouseenter', () => {
    setInteractive(true);
  });
  card.addEventListener('mouseleave', () => {
    if (!dragging) {
      setInteractive(false);
    }
  });
}

function applyState(payload = {}) {
  viewport = payload.viewport || viewport;
  notes = Array.isArray(payload.notes) ? payload.notes : [];
  if (!notes.length) {
    setInteractive(false);
  }
  render();
}

window.deskLibrarySticky.onState(applyState);
setInteractive(false);
window.deskLibrarySticky.getState().then(applyState).catch(() => {});
