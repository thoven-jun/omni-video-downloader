import { ipcMain, BrowserWindow, app, Notification } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';

const activeDownloads = new Map<string, ChildProcess>();
const downloadStates = new Map<string, 'running' | 'paused' | 'cancelled'>();

const getBinaryPath = (binaryName: string) => {
  const isDev = !app.isPackaged;
  if (isDev) {
    return path.join(process.cwd(), 'binaries', binaryName);
  }
  return path.join(process.resourcesPath, 'binaries', binaryName);
};

const sanitizeFilename = (name: string) => {
  return name.replace(/[\\/:*?"<>|]/g, "").trim();
};

const getUniqueFilePath = (folder: string, title: string, ext: string) => {
  const safeTitle = sanitizeFilename(title).substring(0, 100); 
  let fileName = `${safeTitle}.${ext}`;
  let filePath = path.join(folder, fileName);
  let counter = 1;
  while (fs.existsSync(filePath)) {
    fileName = `${safeTitle} (${counter}).${ext}`;
    filePath = path.join(folder, fileName);
    counter++;
  }
  return filePath;
};

// SRT 파일을 읽어 텍스트 스크립트로 변환 및 중복 제거
const processSubtitleToScript = (folder: string, filenameBase: string) => {
    try {
        // 폴더 내 해당 파일명의 .srt 찾기 (언어 코드 등 자동 생성된 접미사 처리)
        const files = fs.readdirSync(folder);
        // 파일명이 포함된 .srt 파일 찾기
        const srtFiles = files.filter(f => f.includes(filenameBase) && f.endsWith('.srt'));

        srtFiles.forEach(srtFile => {
            const fullPath = path.join(folder, srtFile);
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // SRT 파싱 (타임코드 제거)
            // 패턴: 숫자 줄 -> 타임코드 줄 -> 텍스트 -> 빈 줄
            const lines = content.split('\n');
            let scriptLines: string[] = [];
            let lastLine = '';

            lines.forEach(line => {
                const trimmed = line.trim();
                // 숫자만 있거나, 타임코드(00:00:00 --> ...)는 건너뜀
                if (!trimmed || /^\d+$/.test(trimmed) || trimmed.includes('-->')) return;
                
                // 중복 제거 로직 (이전 줄과 같으면 생략)
                // 유튜브 자동 자막은 한 단어씩 밀리며 중복되는 경향이 있음. 
                // 여기서는 단순 완전 중복 및 포함 관계만 1차적으로 제거
                if (trimmed !== lastLine && !lastLine.includes(trimmed)) {
                    scriptLines.push(trimmed);
                    lastLine = trimmed;
                }
            });

            // 하나의 문단으로 합치기
            const finalScript = scriptLines.join(' ').replace(/\s+/g, ' ');
            
            // .txt 파일로 저장
            const txtPath = fullPath.replace('.srt', '_script.txt');
            fs.writeFileSync(txtPath, finalScript, 'utf-8');
            
            console.log(`[Script Generated] ${txtPath}`);
            
            // 원본 SRT 삭제 여부는 선택 (여기서는 유지)
        });

    } catch (e) {
        console.error('Script processing failed:', e);
    }
};

export const setupDownloadHandler = (mainWindow: BrowserWindow) => {
  ipcMain.removeHandler('start-download');
  ipcMain.removeHandler('pause-download');
  ipcMain.removeHandler('cancel-download');

  // 일시정지 핸들러
  ipcMain.handle('pause-download', (_, id: string) => {
    const process = activeDownloads.get(id);
    if (process) {
        downloadStates.set(id, 'paused');
        process.kill(); // 프로세스 종료 (일시정지 효과)
        activeDownloads.delete(id);
    }
  });

  // [신규] 취소 핸들러
  ipcMain.handle('cancel-download', (_, id: string) => {
    const process = activeDownloads.get(id);
    if (process) {
        downloadStates.set(id, 'cancelled');
        process.kill();
        activeDownloads.delete(id);
    }
  });

  ipcMain.handle('start-download', async (_, params) => {
    const { id, url, folder, title, quality, type, audioFormat, includeThumbnail, includeSubtitle, subLanguage } = params;

    console.log(`[Download Start] Title: ${title}, Type: ${type}, Lang: ${subLanguage}`);

    // 상태 초기화
    downloadStates.set(id, 'running');

    const ytDlpPath = getBinaryPath('yt-dlp');
    const ffmpegPath = getBinaryPath('ffmpeg');
    const downloadFolder = folder || app.getPath('downloads');

    if (!fs.existsSync(downloadFolder)){
      try { fs.mkdirSync(downloadFolder, { recursive: true }); } catch(e) { console.error(e); }
    }

    let ext = 'mp4';
    if (type === 'audio') ext = audioFormat || 'mp3';
    else if (type === 'thumbnail') ext = 'jpg';
    else if (type === 'subtitle') ext = 'srt';

    const args = [
      url,
      '--ffmpeg-location', ffmpegPath,
      '--progress',
      '--newline',
      '--no-playlist',
      '--ignore-errors',
      '--add-metadata',
    ];

    // [수정 4번] 언어 필터링 (기본값: ko)
    const targetLang = subLanguage || 'ko'; 
    // 'all'이면 필터링 없음, 아니면 해당 언어 지정
    const langArgs = targetLang === 'all' ? ['--sub-langs', 'all'] : ['--sub-langs', targetLang, '--sub-langs', `${targetLang}.*`]; // ko, ko-KR 등 포함

    let finalFilePath = '';
    const safeTitle = sanitizeFilename(title || 'video').substring(0, 100); // 파일명 베이스 저장

    if (url.includes('list=') && !url.includes('watch?v=')) {
      args.push('-o', path.join(downloadFolder, '%(playlist_index)s_%(title).100s.%(ext)s'));
    } else {
      finalFilePath = getUniqueFilePath(downloadFolder, title || 'video', ext);
      args.push('-o', finalFilePath.replace(`.${ext}`, '.%(ext)s'));
    }

    if (type === 'thumbnail') {
        args.push('--skip-download'); 
        args.push('--write-thumbnail');
        args.push('--convert-thumbnails', 'jpg');
    } 
    else if (type === 'subtitle') {
        args.push('--skip-download'); 
        args.push('--write-subs');
        args.push('--write-auto-subs');
        args.push(...langArgs); // 언어 적용
        args.push('--convert-subs', 'srt');
    } 
    else if (type === 'audio') {
        args.push('--extract-audio');
        args.push('--audio-format', ext);
        args.push('--audio-quality', '0');
        if (ext !== 'wav') args.push('--embed-thumbnail');
    } 
    else {
        if (quality === 'best') args.push('-f', 'bv+ba/b');
        else args.push('-f', `bv[height<=${quality}]+ba/b[height<=${quality}]/b`);
        args.push('--merge-output-format', 'mp4');
        args.push('--embed-thumbnail');

        if (includeThumbnail) {
            args.push('--write-thumbnail');
            args.push('--convert-thumbnails', 'jpg');
        }
        if (includeSubtitle) {
            args.push('--write-subs');
            args.push('--write-auto-subs');
            args.push(...langArgs); // 언어 적용
            args.push('--convert-subs', 'srt');
        }
    }

    const process = spawn(ytDlpPath, args);

    activeDownloads.set(id, process);

    process.stdout.on('data', (data) => {
      const line = data.toString();
      const match = line.match(/(\d+(\.\d+)?)%/);
      if (match && match[1]) {
        mainWindow.webContents.send('download-progress', { id, progress: parseFloat(match[1]) });
      }
    });

    process.stderr.on('data', (data) => {
      const errLine = data.toString();
      if(errLine.includes('ERROR:')) console.error(`DL Error: ${errLine}`);
    });

    process.on('close', (code) => {
      // 프로세스 종료 시 목록에서 제거
      activeDownloads.delete(id);
      const finalState = downloadStates.get(id);

      // 상태에 따른 분기 처리
      if (finalState === 'paused') {
          mainWindow.webContents.send('download-complete', { id, success: false, isPaused: true });
          return;
      }
      if (finalState === 'cancelled') {
          // 취소 시 임시 파일 정리 로직을 추가할 수도 있음 (선택 사항)
          mainWindow.webContents.send('download-complete', { id, success: false, isCancelled: true });
          return;
      }
      
      if (code === 0) {
        // [수정 4번] 자막 다운로드/포함 시 스크립트 변환 실행
        if (type === 'subtitle' || includeSubtitle) {
            processSubtitleToScript(downloadFolder, safeTitle);
        }

        let msg = '저장 완료';
        if (type === 'thumbnail') msg = '썸네일 저장 완료';
        if (type === 'subtitle') msg = '대본 저장 완료';
        
        new Notification({ title: '완료', body: `${title} - ${msg}` }).show();
        
        mainWindow.webContents.send('download-complete', {
          id,
          success: true,
          filePath: finalFilePath || downloadFolder
        });
      } else {
        mainWindow.webContents.send('download-complete', {
          id,
          success: false,
          error: `다운로드 실패 (Exit code: ${code})`
        });
      }
    });

    return { started: true };
  });
};