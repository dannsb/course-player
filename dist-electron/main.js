"use strict";
// electron/main.ts
const { app, BrowserWindow, ipcMain, dialog, nativeTheme, protocol, net, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const { Readable } = require("stream");
// Register 'media' scheme as privileged before app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'media', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true, corsEnabled: true } }
]);
let mainWindow = null;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        icon: path.join(__dirname, "../public/favicon.ico"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
        },
    });
    if (process.env.NODE_ENV === "development") {
        mainWindow.loadURL("http://localhost:3000");
    }
    else {
        mainWindow.loadFile(path.join(__dirname, "../build/index.html"));
    }
    setupMenu({ autoNext: true, loadThumbnails: true });
}
function setupMenu(prefs) {
    const isMac = process.platform === 'darwin';
    const template = [
        ...(isMac
            ? [{
                    label: app.name,
                    submenu: [
                        { role: 'about' },
                        { type: 'separator' },
                        { role: 'services' },
                        { type: 'separator' },
                        { role: 'hide' },
                        { role: 'hideOthers' },
                        { role: 'unhide' },
                        { type: 'separator' },
                        { role: 'quit' }
                    ]
                }]
            : []),
        {
            label: 'File',
            submenu: [
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac
                    ? [
                        { role: 'pasteAndMatchStyle' },
                        { role: 'delete' },
                        { role: 'selectAll' },
                        { type: 'separator' },
                        {
                            label: 'Speech',
                            submenu: [
                                { role: 'startSpeaking' },
                                { role: 'stopSpeaking' }
                            ]
                        }
                    ]
                    : [
                        { role: 'delete' },
                        { type: 'separator' },
                        { role: 'selectAll' }
                    ])
            ]
        },
        {
            label: 'Preferences',
            submenu: [
                {
                    label: 'Auto Next Video',
                    type: 'checkbox',
                    checked: prefs.autoNext,
                    click: (menuItem) => {
                        if (mainWindow) {
                            mainWindow.webContents.send('toggle-preference', 'autoNext', menuItem.checked);
                        }
                    }
                },
                {
                    label: 'Load Thumbnails',
                    type: 'checkbox',
                    checked: prefs.loadThumbnails,
                    click: (menuItem) => {
                        if (mainWindow) {
                            mainWindow.webContents.send('toggle-preference', 'loadThumbnails', menuItem.checked);
                        }
                    }
                },
                {
                    label: 'Save Last Folder',
                    type: 'checkbox',
                    checked: prefs.saveLastFolder,
                    click: (menuItem) => {
                        if (mainWindow) {
                            mainWindow.webContents.send('toggle-preference', 'saveLastFolder', menuItem.checked);
                        }
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac
                    ? [
                        { type: 'separator' },
                        { role: 'front' },
                        { type: 'separator' },
                        { role: 'window' }
                    ]
                    : [
                        { role: 'close' }
                    ])
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
ipcMain.on('sync-preferences', (event, prefs) => {
    setupMenu(prefs);
});
// Helper function for recursive file collection
function getVideoFilesRecursively(dir, extensions) {
    const results = [];
    const walk = (currentDir) => {
        const entries = fs.readdirSync(currentDir);
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    walk(fullPath);
                }
                else {
                    const ext = path.extname(entry).toLowerCase();
                    if (extensions.includes(ext)) {
                        results.push(fullPath);
                    }
                }
            }
            catch {
                // Skip files we can't access
            }
        }
    };
    walk(dir);
    return results;
}
// IPC handler for renaming video files (async & safe)
ipcMain.handle("rename-video", async (_event, { oldPath, newTitle }) => {
    try {
        const dir = path.dirname(oldPath);
        const ext = path.extname(oldPath);
        // Sanitize: strip path separators to prevent directory traversal
        const safeTitle = path.basename(newTitle.replace(/[<>:"/\\|?*]/g, '_'));
        if (!safeTitle.trim()) {
            return { success: false, error: "Invalid file name." };
        }
        const newPath = path.join(dir, safeTitle + ext);
        // Check existence asynchronously
        if (oldPath !== newPath) {
            try {
                await fs.promises.access(newPath);
                return { success: false, error: "A file with this name already exists." };
            }
            catch {
                // File doesn't exist — good
            }
        }
        // Rename asynchronously
        await fs.promises.rename(oldPath, newPath);
        return { success: true, newPath };
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
    try {
        const videoExtensions = [".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".m4v", ".ts"];
        const videoFiles = getVideoFilesRecursively(folderPath, videoExtensions);
        videoFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
        const videos = videoFiles.map((file, index) => {
            const relativePath = path.relative(folderPath, file);
            const ext = path.extname(file);
            const titleFromPath = relativePath.slice(0, -ext.length).replace(/[\\/]/g, " › ");
            return {
                id: index + 1,
                title: titleFromPath,
                file: file,
            };
        });
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
// IPC handler for loading a specific folder path (no dialog)
ipcMain.handle("load-folder", async (_event, folderPath) => {
    try {
        if (!fs.existsSync(folderPath)) {
            return null;
        }
        const videoExtensions = [".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".m4v", ".ts"];
        const videoFiles = getVideoFilesRecursively(folderPath, videoExtensions);
        videoFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
        const videos = videoFiles.map((file, index) => {
            const relativePath = path.relative(folderPath, file);
            const ext = path.extname(file);
            const titleFromPath = relativePath.slice(0, -ext.length).replace(/[\\/]/g, " › ");
            return {
                id: index + 1,
                title: titleFromPath,
                file: file,
            };
        });
        return {
            folderPath,
            videos,
        };
    }
    catch (error) {
        console.error("Error loading folder:", error);
        return null;
    }
});
app.whenReady().then(() => {
    // Force dark mode regardless of system theme
    nativeTheme.themeSource = "dark";
    // Global port for the local media HTTP server
    let mediaServerPort = 0;
    const http = require('http');
    const mediaServer = http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            let filePath = url.searchParams.get('path');
            if (!filePath) {
                res.writeHead(400);
                return res.end('Missing path');
            }
            const stat = await fs.promises.stat(filePath);
            const fileSize = stat.size;
            const rangeHeader = req.headers.range;
            const ext = path.extname(filePath).toLowerCase();
            let contentType = 'video/mp4';
            if (ext === '.webm')
                contentType = 'video/webm';
            else if (ext === '.ogg')
                contentType = 'video/ogg';
            else if (ext === '.mkv')
                contentType = 'video/x-matroska';
            else if (ext === '.avi')
                contentType = 'video/x-msvideo';
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                return res.end();
            }
            if (rangeHeader) {
                const parts = rangeHeader.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': contentType,
                });
                const fileStream = fs.createReadStream(filePath, { start, end });
                fileStream.pipe(res);
                res.on('close', () => { if (!fileStream.destroyed)
                    fileStream.destroy(); });
            }
            else {
                res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': contentType,
                    'Accept-Ranges': 'bytes',
                });
                const fileStream = fs.createReadStream(filePath);
                fileStream.pipe(res);
                res.on('close', () => { if (!fileStream.destroyed)
                    fileStream.destroy(); });
            }
        }
        catch (error) {
            if (!res.headersSent) {
                res.writeHead(404);
            }
            res.end('Not found');
        }
    });
    mediaServerPort = 49213;
    mediaServer.listen(mediaServerPort, '127.0.0.1', () => {
        console.log('Local media HTTP server running on port:', mediaServerPort);
    });
    protocol.handle('media', (request) => {
        const cleanUrl = request.url.split('?')[0].split('#')[0];
        let filePath = decodeURIComponent(cleanUrl.slice('media://'.length));
        if (filePath.startsWith('/')) {
            filePath = filePath.slice(1);
        }
        // Transparently proxy custom protocol to the robust local HTTP server using net.fetch
        // This avoids 302 redirects which can cause HTML5 video players to momentarily reset their time state
        const targetUrl = `http://127.0.0.1:${mediaServerPort}/?path=${encodeURIComponent(filePath)}`;
        return net.fetch(targetUrl, {
            method: request.method,
            headers: request.headers,
        });
    });
    createWindow();
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
