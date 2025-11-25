import * as fs from 'fs';
import { autoUpdater } from 'electron-updater';
import { app, shell, BrowserWindow, ipcMain, clipboard, dialog, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getVideoMetadata } from './downloader'
import { setupDownloadHandler } from './downloadHandler'
import { setupStoreHandlers } from './store';

function createWindow(): void {
  // 화면 크기 감지 및 초기 사이즈 설정
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  let width = 1280;
  let height = 840;

  // 작은 화면 대응
  if (screenWidth < 1300) width = 1024;
  if (screenHeight < 900) height = 700;

  const mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 1024, // 최소 너비 설정
    minHeight: 600, // 최소 높이 설정
    show: false,
    autoHideMenuBar: true,
    resizable: false, // 기본적으로 고정
    maximizable: false,
    fullscreenable: false,
    backgroundColor: '#111827',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // [신규] 모니터 이동 감지 및 자동 리사이징 (잘림 방지)
  mainWindow.on('moved', () => {
    const bounds = mainWindow.getBounds();
    const currentDisplay = screen.getDisplayMatching(bounds);
    const { width: dw, height: dh } = currentDisplay.workAreaSize;

    let newWidth = bounds.width;
    let newHeight = bounds.height;
    let shouldResize = false;

    if (bounds.width > dw) {
      newWidth = Math.min(1280, dw - 20); // 여유 공간
      shouldResize = true;
    }
    if (bounds.height > dh) {
      newHeight = Math.min(840, dh - 20);
      shouldResize = true;
    }

    if (shouldResize) {
      mainWindow.setSize(newWidth, newHeight, true);
    }
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // [2] 업데이트 체크 로직 연결
  // 앱이 켜지고 화면이 보일 때 업데이트 체크 시작
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // 개발 모드가 아닐 때만 체크 (개발 중엔 에러 날 수 있음)
    if (!is.dev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  setupDownloadHandler(mainWindow);
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // [3] 업데이트 관련 이벤트 리스너 (UI로 신호 보내기)
  
  // 업데이트가 있음!
  autoUpdater.on('update-available', () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.webContents.send('update-available');
  });

  // 업데이트가 없음 (최신 버전임)
  autoUpdater.on('update-not-available', () => {
    // 필요하면 로그 출력
    console.log('현재 최신 버전입니다.');
  });

  // 다운로드 완료 (서명된 앱일 경우 자동 설치 준비)
  autoUpdater.on('update-downloaded', () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.webContents.send('update-downloaded');
  });

  setupStoreHandlers();

  ipcMain.handle('get-video-info', async (_, url: string) => {
    try {
      const data = await getVideoMetadata(url);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.toString() };
    }
  });

  ipcMain.handle('show-in-folder', (_, filePath: string) => {
    if (!filePath) {
      shell.openPath(app.getPath('downloads'));
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      shell.openPath(filePath);
    } else {
      shell.showItemInFolder(filePath);
    }
  });
  
  ipcMain.handle('read-clipboard', () => {
    return clipboard.readText();
  });

  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  // [수정] 창 크기 조절 핸들러 (화면 크기 초과 방지)
  ipcMain.handle('resize-window', (_, targetHeight: number) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      const bounds = win.getBounds();
      const currentDisplay = screen.getDisplayMatching(bounds);
      // 화면 높이보다 커지려고 하면, 화면 높이만큼만 늘림 (상단바 등 제외한 작업영역)
      const maxHeight = currentDisplay.workAreaSize.height;
      
      // 목표 높이가 화면보다 크면 화면 높이로 제한, 아니면 목표 높이 사용
      const finalHeight = Math.min(targetHeight, maxHeight);
      
      win.setSize(bounds.width, finalHeight, true);
    }
  });

  // [신규] 수동으로 업데이트 체크 요청 (나중에 설정 메뉴에서 쓸 수 있음)
  ipcMain.handle('check-for-updates', () => {
    if (!is.dev) {
      autoUpdater.checkForUpdates();
    }
  });
  
  // [신규] 업데이트 설치(재시작) 요청
  ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall();
  });

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})