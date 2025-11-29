import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getVideoInfo: (url: string) => Promise<{ success: boolean; data?: any; error?: string }>
      startDownload: (params: { 
        id: string; // [신규] 프로세스 제어를 위한 ID 필수
        url: string; 
        folder: string; 
        title: string;
        type: 'video' | 'audio' | 'thumbnail' | 'subtitle';
        quality?: string;
        audioFormat?: string;
        includeThumbnail?: boolean;
        includeSubtitle?: boolean;
        subLanguage?: string;
      }) => Promise<any>
      
      // [신규] 제어 API
      pauseDownload: (id: string) => Promise<void>
      cancelDownload: (id: string) => Promise<void>

      selectFolder: () => Promise<string | null>
      selectFile: () => Promise<string[] | null>
      getFilePath: (file: File) => string
      onDownloadProgress: (callback: (data: { id: string; progress: number }) => void) => () => void // [수정] ID 포함
      onDownloadComplete: (callback: (result: { id: string; success: boolean; error?: string; filePath?: string; isPaused?: boolean; isCancelled?: boolean }) => void) => () => void // [수정] 상태 플래그 추가
      showInFolder: (path: string) => Promise<void>
      readClipboard: () => Promise<string>
      resizeWindow: (height: number) => Promise<void>
      startConvert: (params: { fileId: string, filePath: string, options: any }) => Promise<{ success: boolean, error?: string, filePath?: string, thumbnail?: string }>
      onConvertProgress: (callback: (data: { fileId: string, progress: number }) => void) => () => void
      getSettings: () => Promise<any>
      setSetting: (key: string, value: any) => Promise<boolean>
      setSettings: (settings: any) => Promise<boolean>
      resetSettings: () => Promise<any>
      onUpdateAvailable: (callback: () => void) => () => void
      onUpdateDownloaded: (callback: () => void) => () => void
      quitAndInstall: () => Promise<void>
    }
  }
}