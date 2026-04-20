const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('deskLibraryFloating', {
  openMainWindow: () => ipcRenderer.invoke('open-main-window'),
  openMenu: (payload) => ipcRenderer.invoke('floating-open-menu', payload),
  toggleMenu: () => ipcRenderer.invoke('floating-toggle-menu'),
  closeMenu: () => ipcRenderer.invoke('floating-close-menu'),
  getMenuState: () => ipcRenderer.invoke('floating-get-menu-state'),
  quickSave: () => ipcRenderer.invoke('floating-quick-save'),
  quickSaveCommon: () => ipcRenderer.invoke('floating-quick-save-common'),
  startAccumulation: () => ipcRenderer.invoke('start-accumulation'),
  undoAccumulation: () => ipcRenderer.invoke('undo-accumulation'),
  finishAccumulation: () => ipcRenderer.invoke('finish-accumulation'),
  cancelAccumulation: () => ipcRenderer.invoke('cancel-accumulation'),
  deleteLastCapture: () => ipcRenderer.invoke('delete-last-capture'),
  startScreenshotTranslate: () => ipcRenderer.invoke('open-screenshot-translate'),
  disableFloatingIcon: () => ipcRenderer.invoke('disable-floating-icon'),
  setHovered: (hovered) => ipcRenderer.invoke('floating-set-hovered', hovered),
  startDrag: (payload) => ipcRenderer.invoke('floating-drag-start', payload),
  dragMove: (payload) => ipcRenderer.invoke('floating-drag-move', payload),
  endDrag: () => ipcRenderer.invoke('floating-drag-end'),
  onMenuState: (callback) => ipcRenderer.on('floating-menu-state', (_, payload) => callback(payload))
});
