const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('click2saveFloating', {
  openMainWindow: () => ipcRenderer.invoke('open-main-window'),
  setHovered: (hovered) => ipcRenderer.invoke('floating-set-hovered', hovered),
  startDrag: (payload) => ipcRenderer.invoke('floating-drag-start', payload),
  dragMove: (payload) => ipcRenderer.invoke('floating-drag-move', payload),
  endDrag: () => ipcRenderer.invoke('floating-drag-end')
});
