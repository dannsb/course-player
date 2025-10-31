"use strict";
// electron/main.ts
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false, // Allow loading local files
        },
    });
    if (process.env.NODE_ENV === "development") {
        win.loadURL("http://localhost:3000");
    }
    else {
        win.loadFile(path.join(__dirname, "../build/index.html"));
    }
}
// IPC handler for renaming video files
ipcMain.handle("rename-video", async (event, { oldPath, newTitle }) => {
    try {
        const dir = path.dirname(oldPath);
        const ext = path.extname(oldPath);
        const newPath = path.join(dir, newTitle + ext);
        // Check if the new file name already exists
        if (fs.existsSync(newPath) && oldPath !== newPath) {
            return {
                success: false,
                error: "A file with this name already exists.",
            };
        }
        // Rename the file
        fs.renameSync(oldPath, newPath);
        return {
            success: true,
            newPath: newPath,
        };
    }
    catch (error) {
        console.error("Error renaming video:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
});
// IPC handler for folder selection
ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog({
        title: "Select Course Folder",
        properties: ["openDirectory", "dontAddToRecent"],
        buttonLabel: "Select Folder"
    });
    if (result.canceled) {
        return null;
    }
    const folderPath = result.filePaths[0];
    // Read all files in the folder
    try {
        const files = fs.readdirSync(folderPath);
        // Filter video files
        const videoExtensions = [".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv", ".m4v", "ts"];
        const videoFiles = files.filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return videoExtensions.includes(ext);
        });
        // Sort video files naturally (alphanumeric)
        videoFiles.sort((a, b) => {
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });
        // Map to full paths
        const videos = videoFiles.map((file, index) => ({
            id: index + 1,
            title: path.basename(file, path.extname(file)),
            file: path.join(folderPath, file),
        }));
        return {
            folderPath,
            videos,
        };
    }
    catch (error) {
        console.error("Error reading folder:", error);
        return null;
    }
});
app.whenReady().then(() => {
    createWindow();
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
