/**
 * Check if the application is running in Electron environment
 */
export const isElectron = (): boolean => {
  // @ts-ignore - Check for Electron
  return !!(window && window.process && window.process.type);
};

/**
 * Get Electron's ipcRenderer if available
 */
export const getIpcRenderer = () => {
  if (!isElectron()) {
    throw new Error("Not running in Electron environment");
  }
  // @ts-ignore - Electron IPC
  const { ipcRenderer } = window.require("electron");
  return ipcRenderer;
};

/**
 * Select a folder containing videos
 */
export const selectVideoFolder = async () => {
  const ipcRenderer = getIpcRenderer();
  const result = await ipcRenderer.invoke("select-folder");
  return result;
};

/**
 * Rename a video file
 */
export const renameVideoFile = async (oldPath: string, newTitle: string) => {
  const ipcRenderer = getIpcRenderer();
  const result = await ipcRenderer.invoke("rename-video", {
    oldPath,
    newTitle,
  });
  return result;
};

