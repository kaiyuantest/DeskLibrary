const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deskLibraryNext", {
  getVaultSnapshot: () => ipcRenderer.invoke("desktop:get-vault-snapshot"),
  selectVaultFolder: () => ipcRenderer.invoke("desktop:select-vault-folder"),
  openVaultFolder: () => ipcRenderer.invoke("desktop:open-vault-folder")
});
