const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const ffmpegEngine = require('./ffmpeg-engine.cjs');

// Register custom protocol for high-performance streaming of local media
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0b0e14',
    title: 'Lossless Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Essential for loading and seeking local media files
    },
    show: false,
  });

  // Load dev server or production build
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Setup custom media stream handler
app.whenReady().then(() => {
  protocol.handle('media', (request) => {
    try {
      const url = new URL(request.url);
      let targetPath = url.searchParams.get('path');
      
      if (!targetPath) {
        // Fallback for direct path URLs
        let raw = request.url.replace(/^media:\/\/local\/?/, '').replace(/^media:\/\//, '');
        targetPath = decodeURIComponent(raw);
        if (process.platform === 'win32' && targetPath.startsWith('/')) {
          targetPath = targetPath.slice(1);
        }
      }

      const fileUrl = pathToFileURL(targetPath).toString();
      return net.fetch(fileUrl);
    } catch (err) {
      console.error('Error serving media protocol:', err);
      return new Response('Media load error', { status: 500 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler: File Dialog (Open)
ipcMain.handle('dialog:openFile', async (_event, options = {}) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || 'Select Video Files',
    properties: options.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mkv', 'mov', 'webm', 'avi', 'ts', 'm4v', 'flv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || !result.filePaths.length) return null;
  return options.multiple ? result.filePaths : result.filePaths[0];
});

// IPC Handler: File Dialog (Save)
ipcMain.handle('dialog:saveFile', async (_event, options = {}) => {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options.title || 'Save Video',
    defaultPath: options.defaultPath || 'lossless_output.mp4',
    filters: [
      { name: 'MP4 Video', extensions: ['mp4'] },
      { name: 'MKV Video', extensions: ['mkv'] },
      { name: 'MOV Video', extensions: ['mov'] },
      { name: 'WebM Video', extensions: ['webm'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled) return null;
  return result.filePath;
});

// IPC Handlers: Media Probing and Keyframes
ipcMain.handle('ffmpeg:probeMedia', async (_event, filePath) => {
  return await ffmpegEngine.probeMedia(filePath);
});

ipcMain.handle('ffmpeg:getKeyframes', async (_event, filePath) => {
  return await ffmpegEngine.getKeyframes(filePath);
});

ipcMain.handle('ffmpeg:generateThumbnails', async (_event, params) => {
  const thumbDir = path.join(app.getPath('temp'), 'lossless_thumbs');
  return await ffmpegEngine.generateThumbnails({ ...params, outputDir: thumbDir });
});

// IPC Handlers: Lossless Operations
ipcMain.handle('ffmpeg:losslessTrim', async (_event, params) => {
  return await ffmpegEngine.losslessTrim({
    ...params,
    onProgress: (progress) => {
      mainWindow?.webContents.send('ffmpeg:progress', progress);
    }
  });
});

ipcMain.handle('ffmpeg:losslessMerge', async (_event, params) => {
  return await ffmpegEngine.losslessMerge({
    ...params,
    onProgress: (progress) => {
      mainWindow?.webContents.send('ffmpeg:progress', progress);
    }
  });
});

ipcMain.handle('ffmpeg:cancelJob', async (_event, jobId) => {
  return ffmpegEngine.cancelJob(jobId);
});

// IPC Handlers: Shell utilities
ipcMain.handle('shell:showItemInFolder', async (_event, filePath) => {
  shell.showItemInFolder(filePath);
  return true;
});
