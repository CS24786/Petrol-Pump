const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  printToPDF: (options) => ipcRenderer.invoke('print-to-pdf', options),
  exportPDF: (html, fileName, options) => ipcRenderer.invoke('export-pdf', html, fileName, options),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
