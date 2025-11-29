import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('set-setting', key, value),
  setSettings: (settings: any) => ipcRenderer.invoke('set-settings', settings),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),

  getVideoInfo: (url: string) => ipcRenderer.invoke('get-video-info', url),
  
  startDownload: (params: any) => ipcRenderer.invoke('start-download', params),
  // [신규] 제어 함수 연결
  pauseDownload: (id: string) => ipcRenderer.invoke('pause-download', id),
  cancelDownload: (id: string) => ipcRenderer.invoke('cancel-download', id),

  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: () => ipcRenderer.invoke('select-file'),

  // [신규] D&D 파일 경로 추출
  getFilePath: (file: File) => {
      // @ts-ignore
      return window.electron.webUtils.getPathForFile(file);
  },

  onDownloadProgress: (callback: (data: { id: string, progress: number }) => void) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on('download-progress', subscription);
    return () => ipcRenderer.removeListener('download-progress', subscription);
  },

  onDownloadComplete: (callback: (result: any) => void) => {
    const subscription = (_: any, result: any) => callback(result);
    ipcRenderer.on('download-complete', subscription);
    return () => ipcRenderer.removeListener('download-complete', subscription);
  },

  showInFolder: (path: string) => ipcRenderer.invoke('show-in-folder', path),
  readClipboard: () => ipcRenderer.invoke('read-clipboard'),
  resizeWindow: (height: number) => ipcRenderer.invoke('resize-window', height),

  startConvert: (params: any) => ipcRenderer.invoke('start-convert', params),
  onConvertProgress: (callback: (data: { fileId: string, progress: number }) => void) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on('convert-progress', subscription);
    return () => ipcRenderer.removeListener('convert-progress', subscription);
  },

  onUpdateAvailable: (callback: () => void) => {
    const subscription = (_: any) => callback();
    ipcRenderer.on('update-available', subscription);
    return () => ipcRenderer.removeListener('update-available', subscription);
  },
  onUpdateDownloaded: (callback: () => void) => {
    const subscription = (_: any) => callback();
    ipcRenderer.on('update-downloaded', subscription);
    return () => ipcRenderer.removeListener('update-downloaded', subscription);
  },
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (types in contextBridge)
  window.electron = electronAPI
  // @ts-ignore (types in contextBridge)
  window.api = api
}