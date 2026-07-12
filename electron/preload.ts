import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  renameVideo: (oldPath: string, newTitle: string) =>
    ipcRenderer.invoke("rename-video", { oldPath, newTitle }),
  loadFolder: (folderPath: string) =>
    ipcRenderer.invoke("load-folder", folderPath),
  syncPreferences: (prefs: any) => ipcRenderer.send("sync-preferences", prefs),
  onTogglePreference: (callback: (key: string, value: boolean) => void) => {
    ipcRenderer.on("toggle-preference", (_event, key, value) => callback(key, value));
  },
  removeTogglePreference: () => {
    ipcRenderer.removeAllListeners("toggle-preference");
  }
});
