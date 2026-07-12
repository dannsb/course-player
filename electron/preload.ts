import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  renameVideo: (oldPath: string, newTitle: string) =>
    ipcRenderer.invoke("rename-video", { oldPath, newTitle }),
  loadFolder: (folderPath: string) =>
    ipcRenderer.invoke("load-folder", folderPath),
});
