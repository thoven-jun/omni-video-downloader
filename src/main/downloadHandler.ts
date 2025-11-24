import { ipcMain, BrowserWindow, app } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs';

const getBinaryPath = (binaryName: string) => {
  const isDev = !app.isPackaged;
  if (isDev) {
    return path.join(process.cwd(), 'binaries', binaryName);
  }
  return path.join(process.resourcesPath, 'binaries', binaryName);
};

// [신규] 파일명 안전하게 만들기 (특수문자 제거)
const sanitizeFilename = (name: string) => {
  return name.replace(/[\\/:*?"<>|]/g, "").trim();
};

// [신규] 중복되지 않는 파일 경로 생성 함수
const getUniqueFilePath = (folder: string, title: string, ext: string) => {
  const safeTitle = sanitizeFilename(title).substring(0, 100); // 길이 제한
  let fileName = `${safeTitle}.${ext}`;
  let filePath = path.join(folder, fileName);
  
  let counter = 1;
  // 파일이 존재하면 (1), (2)... 붙이기
  while (fs.existsSync(filePath)) {
    fileName = `${safeTitle} (${counter}).${ext}`;
    filePath = path.join(folder, fileName);
    counter++;
  }
  
  return filePath;
};

export const setupDownloadHandler = (mainWindow: BrowserWindow) => {
  
  ipcMain.handle('start-download', async (_, params) => {
    const { url, folder, title, quality, type, audioFormat } = params; // title 추가됨
    
    console.log(`다운로드 시작: ${title}`);
    
    const ytDlpPath = getBinaryPath('yt-dlp');
    const ffmpegPath = getBinaryPath('ffmpeg');
    const downloadFolder = folder || app.getPath('downloads');
    
    if (!fs.existsSync(downloadFolder)){
        try { fs.mkdirSync(downloadFolder, { recursive: true }); } catch(e) { console.error(e); }
    }

    // [핵심] 확장자 결정 및 중복 방지 경로 생성
    let ext = 'mp4'; // 비디오 기본값
    if (type === 'audio') {
      ext = audioFormat || 'mp3';
    }
    
    // 유니크한 파일 경로 미리 계산 (중복 방지)
    // 주의: 재생목록의 경우 이 로직 대신 yt-dlp 템플릿을 써야 하지만, 
    // 현재 단일 영상 기준으로 충돌 방지를 우선 적용합니다.
    // 재생목록 링크인 경우(list=)에는 기존처럼 템플릿을 쓰는 분기를 유지합니다.
    let outputTemplate = '';
    let finalFilePath = ''; // 완료 후 열기 위해 저장

    if (url.includes('list=') || url.includes('instagram.com/')) {
       // 재생목록/인스타는 여러 파일이므로 템플릿 사용 (중복 방지 어려움, 덮어쓰기 가능성 있음)
       outputTemplate = path.join(downloadFolder, '%(playlist_index)s_%(title).100s.%(ext)s');
    } else {
       // 단일 영상: 우리가 직접 이름을 정해서 yt-dlp에 "이 이름으로 저장해!"라고 명령함
       finalFilePath = getUniqueFilePath(downloadFolder, title || 'video', ext);
       outputTemplate = finalFilePath;
    }

    const args = [
      url,
      '-o', outputTemplate,
      '--ffmpeg-location', ffmpegPath,
      '--progress',
      '--newline',
    ];

    if (type === 'audio') {
      args.push('-x');
      args.push('--audio-format', ext);
      args.push('--audio-quality', '0');
    } else {
      if (quality === 'best') {
        args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
      } else {
        args.push('-f', `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${quality}][ext=mp4]/best`);
      }
      args.push('--merge-output-format', 'mp4');
    }

    const process = spawn(ytDlpPath, args);

    process.stdout.on('data', (data) => {
      const line = data.toString();
      const match = line.match(/(\d+(\.\d+)?)%/);
      if (match && match[1]) {
        mainWindow.webContents.send('download-progress', parseFloat(match[1]));
      }
    });

    process.stderr.on('data', (data) => {
      console.error(`Error output: ${data}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        // 성공 시 다운로드 폴더 경로 반환
        mainWindow.webContents.send('download-complete', { success: true, filePath: downloadFolder });
      } else {
        mainWindow.webContents.send('download-complete', { success: false, error: `Exit code: ${code}` });
      }
    });

    return { started: true };
  });
};