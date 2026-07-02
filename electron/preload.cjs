const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("papertechDesktop", {
  isDesktop: true,
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  getPlatform: () => ipcRenderer.invoke("app:platform"),
  checkForUpdates: () => ipcRenderer.invoke("updates:check"),
});
