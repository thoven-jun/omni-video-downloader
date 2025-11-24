import { app } from 'electron';
import * as path from 'path'; // * as path 로 수정된 import 유지
import { spawn } from 'child_process';

// 바이너리 경로 찾기
const getBinaryPath = (binaryName: string) => {
  const isDev = !app.isPackaged;
  if (isDev) {
    return path.join(process.cwd(), 'binaries', binaryName);
  }
  return path.join(process.resourcesPath, 'binaries', binaryName);
};

// [추가된 기능] 이미지를 직접 다운로드해서 Base64 문자열로 변환하는 함수
async function fetchThumbnailAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // 이미지를 'data:image/jpg;base64,...' 형태의 문자열로 변환
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.log("썸네일 변환 실패, 원본 URL 사용:", error);
    return url; // 실패하면 원래 URL이라도 반환
  }
}

export const getVideoMetadata = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const ytDlpPath = getBinaryPath('yt-dlp');
    const process = spawn(ytDlpPath, ['--dump-json', '--no-playlist', url]);

    let outputData = '';
    let errorData = '';

    process.stdout.on('data', (data) => (outputData += data.toString()));
    process.stderr.on('data', (data) => (errorData += data.toString()));

    process.on('close', async (code) => { // async 키워드 추가
      if (code === 0) {
        try {
          const json = JSON.parse(outputData);
          
          // 세로 영상 판별 로직
          const isVertical = (json.width && json.height && json.height > json.width) 
                             || (json.width === json.height)
                             || url.includes('shorts')
                             || json.extractor_key.toLowerCase().includes('tiktok')
                             || json.extractor_key.toLowerCase().includes('instagram');

          // [수정됨] 썸네일 처리 로직
          let finalThumbnail = json.thumbnail;
          // 인스타그램인 경우에만 백엔드에서 직접 이미지를 가져옵니다.
          if (json.extractor_key.toLowerCase().includes('instagram')) {
             finalThumbnail = await fetchThumbnailAsBase64(json.thumbnail);
          }

          // [수정] 사용 가능한 해상도 목록 추출 (중복 제거 및 내림차순 정렬)
          const availableResolutions: number[] = [];
          if (json.formats) {
            json.formats.forEach((f: any) => {
              if (f.height && !availableResolutions.includes(f.height)) {
                availableResolutions.push(f.height);
              }
            });
          }
          // 큰 숫자부터 정렬 (8K -> 4K -> 1080p ...)
          availableResolutions.sort((a, b) => b - a);

          // 1080p, 720p 등 주요 해상도가 없다면 강제로라도 리스트에 있는지 확인 (선택사항)
          // 여기서는 yt-dlp가 준 그대로 사용합니다.

          resolve({
            title: json.title,
            thumbnail: finalThumbnail,
            duration: json.duration_string,
            platform: json.extractor_key,
            isVertical: isVertical, 
            resolutions: availableResolutions, // [신규] 해상도 리스트 반환
            formats: json.formats ? json.formats.length : 0,
            url: url
          });
        } catch (e) {
          reject(`JSON 파싱 실패: ${e}`);
        }
      } else {
        reject(`에러 발생 (${code}): ${errorData}`);
      }
    });
  });
};