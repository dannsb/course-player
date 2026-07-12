export interface ElectronAPI {
  selectFolder: () => Promise<{ folderPath: string; videos: any[] } | null>;
  renameVideo: (oldPath: string, newTitle: string) => Promise<{ success: boolean; newPath?: string; error?: string }>;
  loadFolder: (folderPath: string) => Promise<{ folderPath: string; videos: any[] } | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const isElectron = (): boolean => {
  return typeof window !== "undefined" && !!window.electronAPI;
};

export const selectVideoFolder = async () => {
  if (!window.electronAPI) throw new Error("Not running in Electron environment");
  return await window.electronAPI.selectFolder();
};

export const renameVideoFile = async (oldPath: string, newTitle: string) => {
  if (!window.electronAPI) throw new Error("Not running in Electron environment");
  return await window.electronAPI.renameVideo(oldPath, newTitle);
};

export const loadVideoFolder = async (folderPath: string) => {
  if (!window.electronAPI) throw new Error("Not running in Electron environment");
  return await window.electronAPI.loadFolder(folderPath);
};

export const getMediaUrl = (absolutePath: string): string => {
  if (absolutePath.startsWith("http")) {
    return absolutePath;
  }
  
  // Directly use the internal HTTP server on port 49213
  // This bypasses the buggy Electron custom protocol IPC completely
  return `http://127.0.0.1:49213/?path=${encodeURIComponent(absolutePath)}`;
};
