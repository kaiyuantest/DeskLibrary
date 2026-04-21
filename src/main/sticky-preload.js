const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('deskLibrarySticky', {
  getState: () => ipcRenderer.invoke('temp-sticky-get-state'),
  copyNote: (id) => ipcRenderer.invoke('temp-sticky-copy-note', id),
  hideNote: (id) => ipcRenderer.invoke('temp-sticky-hide-note', id),
  deleteNote: (id) => ipcRenderer.invoke('temp-sticky-delete-note', id),
  moveNote: (payload) => ipcRenderer.invoke('temp-sticky-move-note', payload),
  setInteractive: (interactive) => ipcRenderer.invoke('temp-sticky-set-interactive', interactive),
  onState: (callback) => ipcRenderer.on('temp-sticky-state', (_, payload) => callback(payload))
});
