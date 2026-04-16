const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('click2saveFloating', {
  openMainWindow: () => ipcRenderer.invoke('open-main-window')
});
