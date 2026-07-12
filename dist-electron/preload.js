"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    selectFolder: () => electron_1.ipcRenderer.invoke("select-folder"),
    renameVideo: (oldPath, newTitle) => electron_1.ipcRenderer.invoke("rename-video", { oldPath, newTitle }),
    loadFolder: (folderPath) => electron_1.ipcRenderer.invoke("load-folder", folderPath),
});
