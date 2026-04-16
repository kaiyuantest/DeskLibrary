const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('click2save', {
  getInitialData: () => ipcRenderer.invoke('get-initial-data'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  createManualTextRecord: (text) => ipcRenderer.invoke('create-manual-text-record', text),
  updateRecordContent: (payload) => ipcRenderer.invoke('update-record-content', payload),
  updateRecordNote: (payload) => ipcRenderer.invoke('update-record-note', payload),
  deleteRecord: (id) => ipcRenderer.invoke('delete-record', id),
  moveRecordToCommon: (id) => ipcRenderer.invoke('move-record-to-common', id),
  moveRecordToDaily: (id) => ipcRenderer.invoke('move-record-to-daily', id),
  openImagePath: (imagePath) => ipcRenderer.invoke('open-image-path', imagePath),
  copyRecordContent: (id) => ipcRenderer.invoke('copy-record-content', id),
  openMainWindow: () => ipcRenderer.invoke('open-main-window'),
  onSnapshot: (callback) => ipcRenderer.on('snapshot', (_, payload) => callback(payload))
});
