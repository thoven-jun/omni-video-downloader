import { ipcMain, BrowserWindow, app, Notification } from 'electron';
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

// [유틸] 파일명 안전하게 만들기 (특수문자 제거)
const sanitizeFilename = (name: string) => {
  // 윈도우/맥 공통 금지 문자 제거 및 앞뒤 공백 제거
  return name.replace(/[\\/:*?"<>|]/g, "").trim();
};

// [유틸] 중복되지 않는 파일 경로 생성 함수
// 파일명 (1).mp4, 파일명 (2).mp4 형식으로 자동 넘버링
const getUniqueFilePath = (folder: string, title: string, ext: string) => {
  const safeTitle = sanitizeFilename(title).substring(0, 100); // 파일명 길이 제한 (오류 방지)
  
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

export const setupDownloadHandler = (mainWindow: BrowserWindow) => {
  
  ipcMain.handle('start-download', async (_, params) => {
    const { url, folder, title, quality, type, audioFormat } = params;
    
    console.log(`[Download Start] Title: ${title}, Type: ${type}, Quality: ${quality}`);
    
    const ytDlpPath = getBinaryPath('yt-dlp');
    const ffmpegPath = getBinaryPath('ffmpeg');
    
    // folder가 없으면 기본 다운로드 폴더 사용
    const downloadFolder = folder || app.getPath('downloads');
    
    if (!fs.existsSync(downloadFolder)){
        try { fs.mkdirSync(downloadFolder, { recursive: true }); } catch(e) { console.error(e); }
    }

    // [1] 확장자 및 최종 파일명 결정
    let ext = 'mp4'; // 비디오 기본값
    if (type === 'audio') {
      ext = audioFormat || 'mp3';
    }
    
    // [2] 명령어 인수(Args) 구성
    const args = [
      url,
      '--ffmpeg-location', ffmpegPath,
      '--progress',
      '--newline',        // 진행률 파싱을 위해 줄바꿈 출력
      '--no-playlist',    // 재생목록 링크여도 단일 영상만 처리 (우선순위)
      '--ignore-errors',  // 사소한 에러 무시
      
      // [품질 향상] 메타데이터 및 썸네일 삽입
      '--add-metadata',
      '--embed-thumbnail',
    ];

    // [3] 중복 방지 파일명 로직 및 출력 템플릿 설정
    let finalFilePath = '';
    
    if (url.includes('list=') && !url.includes('watch?v=')) {
       // 순수 재생목록 링크인 경우 (현재 UI 로직상 단일 영상 위주이나 예외처리)
       args.push('-o', path.join(downloadFolder, '%(playlist_index)s_%(title).100s.%(ext)s'));
    } else {
       // 단일 영상: 중복 방지 처리된 경로를 직접 지정
       finalFilePath = getUniqueFilePath(downloadFolder, title || 'video', ext);
       args.push('-o', finalFilePath);
    }

    // [4] 형식(Format) 및 품질 설정 (핵심 로직 개선)
    if (type === 'audio') {
      // 오디오 모드
      args.push('--extract-audio');
      args.push('--audio-format', ext);
      args.push('--audio-quality', '0'); // 0 = Best Quality
    } else {
      // 비디오 모드
      // 중요: mp4 컨테이너를 강제하지 않고, '최고 화질 소스'를 받은 뒤 mp4로 병합합니다.
      // 이렇게 해야 4K(WebM) 소스를 받아 MP4로 변환할 수 있습니다.
      
      if (quality === 'best') {
        // 최고 화질 비디오 + 최고 화질 오디오 (없으면 일반 최고 화질)
        args.push('-f', 'bv+ba/b'); 
      } else {
        // 특정 높이 제한 (예: 1080p 이하 중 최고)
        // [height<=?]: 사용자가 선택한 화질 이하 중 가장 좋은 것 선택
        args.push('-f', `bv[height<=${quality}]+ba/b[height<=${quality}]/b`);
      }
      
      // 다운로드 후 MP4로 컨테이너 병합/변환
      args.push('--merge-output-format', 'mp4');
    }

    // 프로세스 실행
    const process = spawn(ytDlpPath, args);

    // [5] 로그 및 진행률 파싱
    process.stdout.on('data', (data) => {
      const line = data.toString();
      
      // 진행률 추출 (예: 53.2%)
      const match = line.match(/(\d+(\.\d+)?)%/);
      if (match && match[1]) {
        mainWindow.webContents.send('download-progress', parseFloat(match[1]));
      }
      
      // (선택 사항) 상태 메시지 로깅 - 디버깅용
      if (line.includes('[Merger]')) console.log('병합 중...');
      if (line.includes('[ExtractAudio]')) console.log('오디오 추출 중...');
    });

    process.stderr.on('data', (data) => {
      // ffmpeg 경고 등이 stderr로 나오므로 에러로 간주하진 않지만 로그는 찍음
      const errLine = data.toString();
      // 치명적인 에러만 필터링해서 볼 수도 있음
      if(errLine.includes('ERROR:')) console.error(`DL Error: ${errLine}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        new Notification({
          title: '다운로드 완료',
          body: `${title} 파일이 저장되었습니다.`,
          silent: false //소리 켜기
        }).show();

        // 성공 시 '실제 저장된 파일 경로'를 보냅니다.
        // (참고: yt-dlp가 병합 과정에서 파일명을 바꿀 수도 있지만, -o로 지정했으므로 대부분 일치합니다)
        
        // 최종 파일이 존재하는지 한 번 더 확인 (확장자 변경 가능성 대비)
        // 예: .webm -> .mp4로 병합됨. finalFilePath는 이미 .mp4로 계산했으므로 일치할 것임.
        
        mainWindow.webContents.send('download-complete', { 
          success: true, 
          filePath: finalFilePath || downloadFolder 
        });
      } else {
        new Notification({
          title: '다운로드 실패',
          body: `${title} 다운로드 중 오류가 발생했습니다.`,
        }).show();

        mainWindow.webContents.send('download-complete', { 
          success: false, 
          error: `다운로드 실패 (Exit code: ${code})` 
        });
      }
    });

    return { started: true };
  });
};