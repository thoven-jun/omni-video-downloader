import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getVideoInfo: (url: string) => Promise<{ success: boolean; data?: any; error?: string }>
      startDownload: (params: { 
        url: string; 
        folder: string; 
        title: string;        // [신규] 파일명 중복 처리를 위해 제목 추가
        type: 'video' | 'audio';
        quality?: string;
        audioFormat?: string;
      }) => Promise<any>
      selectFolder: () => Promise<string | null>
      onDownloadProgress: (callback: (progress: number) => void) => () => void
      onDownloadComplete: (callback: (result: { success: boolean; error?: string; filePath?: string }) => void) => () => void
      showInFolder: (path: string) => Promise<void>
      readClipboard: () => Promise<string>
      resizeWindow: (height: number) => Promise<void>
      onUpdateAvailable: (callback: () => void) => () => void
      onUpdateDownloaded: (callback: () => void) => () => void
      quitAndInstall: () => Promise<void>
    }
  }
}