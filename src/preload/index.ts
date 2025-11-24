import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // 1. 영상 정보 가져오기
  getVideoInfo: (url: string) => ipcRenderer.invoke('get-video-info', url),
  
  // 2. 다운로드 시작 요청
  startDownload: (params: any) => ipcRenderer.invoke('start-download', params),
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // 3. 진행률 리스너 (Main -> Renderer)
  onDownloadProgress: (callback: (progress: number) => void) => {
    const subscription = (_: any, progress: number) => callback(progress);
    ipcRenderer.on('download-progress', subscription);
    return () => ipcRenderer.removeListener('download-progress', subscription);
  },

  // 4. 완료 리스너
  onDownloadComplete: (callback: (result: { success: boolean; error?: string }) => void) => {
    const subscription = (_: any, result: any) => callback(result);
    ipcRenderer.on('download-complete', subscription);
    return () => ipcRenderer.removeListener('download-complete', subscription);
  },

  // [신규 추가]
  showInFolder: (path: string) => ipcRenderer.invoke('show-in-folder', path),
  readClipboard: () => ipcRenderer.invoke('read-clipboard'),
  resizeWindow: (height: number) => ipcRenderer.invoke('resize-window', height),

  // [신규] 업데이트 관련
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