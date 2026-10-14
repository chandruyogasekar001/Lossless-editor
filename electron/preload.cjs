const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs
  openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options),

  // Video operations
  probeMedia: (filePath) => ipcRenderer.invoke('ffmpeg:probeMedia', filePath),
  getKeyframes: (filePath) => ipcRenderer.invoke('ffmpeg:getKeyframes', filePath),
  generateThumbnails: (params) => ipcRenderer.invoke('ffmpeg:generateThumbnails', params),

  // Processing
  losslessTrim: (params) => ipcRenderer.invoke('ffmpeg:losslessTrim', params),
  losslessMerge: (params) => ipcRenderer.invoke('ffmpeg:losslessMerge', params),
  cancelJob: (jobId) => ipcRenderer.invoke('ffmpeg:cancelJob', jobId),

  // Progress listeners
  onProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('ffmpeg:progress', handler);
    return () => ipcRenderer.removeListener('ffmpeg:progress', handler);
  },

  // Shell & OS
  showItemInFolder: (filePath) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
  getPlatform: () => process.platform,
});
