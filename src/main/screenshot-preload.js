const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('deskLibraryScreenshot', {
  onSelectionInit: (callback) => {
    ipcRenderer.on('screenshot-selection-init', (_, payload) => callback(payload));
  },
  completeSelection: (payload) => ipcRenderer.invoke('screenshot-selection-complete', payload),
  cancelSelection: () => ipcRenderer.invoke('screenshot-selection-cancel'),
  onResultData: (callback) => {
    ipcRenderer.on('screenshot-result-data', (_, payload) => callback(payload));
  },
  requestTranslate: (payload) => ipcRenderer.invoke('screenshot-translate', payload),
  copyText: (text) => ipcRenderer.invoke('screenshot-copy-text', text),
  closeResult: () => ipcRenderer.invoke('screenshot-result-close')
});
