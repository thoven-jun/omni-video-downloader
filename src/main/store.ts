import Store from 'electron-store';
import { ipcMain } from 'electron';

// 설정 데이터 타입 정의
interface AppSchema {
  general: {
    notifications: boolean;
    resetHistory: boolean;
  };
  download: {
    defaultPath: string;
    defaultQuality: string;
    askLocation: boolean;
  };
}

// [수정됨] 라이브러리 import 호환성 처리
// 'Store is not a constructor' 오류 수정: 
// ESM/CJS 환경 차이로 인해 모듈이 default 속성 안에 담겨 있을 수 있음.
const StoreClass = (Store as any).default || Store;

// 스키마 및 기본값 설정
const store = new StoreClass({
  defaults: {
    general: {
      notifications: true,
      resetHistory: false
    },
    download: {
      defaultPath: '', // 비어있으면 app.getPath('downloads') 사용
      defaultQuality: 'best',
      askLocation: false
    }
  }
});

export const setupStoreHandlers = () => {
  // 1. 설정 불러오기
  ipcMain.handle('get-settings', () => {
    return store.store;
  });

  // 2. 설정 저장하기 (Key-Value)
  ipcMain.handle('set-setting', (_, key: string, value: any) => {
    store.set(key, value);
    return true;
  });

  // 3. 전체 설정 저장하기
  ipcMain.handle('set-settings', (_, settings: AppSchema) => {
    store.store = settings;
    return true;
  });
  
  // 4. 초기화
  ipcMain.handle('reset-settings', () => {
    store.clear();
    return store.store;
  });
};

export default store;