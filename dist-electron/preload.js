"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    selectFolder: () => electron_1.ipcRenderer.invoke("select-folder"),
    renameVideo: (oldPath, newTitle) => electron_1.ipcRenderer.invoke("rename-video", { oldPath, newTitle }),
    loadFolder: (folderPath) => electron_1.ipcRenderer.invoke("load-folder", folderPath),
    syncPreferences: (prefs) => electron_1.ipcRenderer.send("sync-preferences", prefs),
    onTogglePreference: (callback) => {
        electron_1.ipcRenderer.on("toggle-preference", (_event, key, value) => callback(key, value));
    },
    removeTogglePreference: () => {
        electron_1.ipcRenderer.removeAllListeners("toggle-preference");
    }
});
