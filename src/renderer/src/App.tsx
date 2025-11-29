import { useState, useEffect, useRef } from 'react'
import { InputArea } from './components/InputArea'
import { MediaCard } from './components/MediaCard'
import { NotificationSidebar, NotificationItem } from './components/NotificationSidebar'
import { QueueDrawer, MediaItem } from './components/QueueDrawer'
import { Sidebar } from './components/Sidebar'
import { FloatingStatus } from './components/FloatingStatus'
import { SettingsModal } from './components/SettingsModal'
import { CheckCircle, AlertCircle, X, Bell, PanelLeft, Settings } from 'lucide-react'

// Toast: 등장/퇴장 애니메이션 로직 추가
function Toast({ message, visible, onClose, onOpenFolder }: { message: string, visible: boolean, onClose: () => void, onOpenFolder: () => void }) {
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) setShouldRender(true);
    else setTimeout(() => setShouldRender(false), 300); // 0.3초 애니메이션 대기 후 언마운트
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed top-6 left-1/2 z-50 flex -translate-x-1/2 transform items-center gap-4 rounded-xl bg-gray-800/90 px-6 py-4 shadow-2xl backdrop-blur-md ring-1 ring-white/10 transition-all duration-300 ease-in-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400"><CheckCircle size={20} /></div>
        <div className="flex flex-col"><span className="text-sm font-bold text-white">작업 완료!</span><span className="text-xs text-gray-400">{message}</span></div>
      </div>
      <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
        {onOpenFolder && <button onClick={onOpenFolder} className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600 transition">폴더 열기</button>}
        <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
      </div>
    </div>
  )
}

let hasCheckedClipboard = false;

function App() { return <WrappedApp /> }

function WrappedApp() {
  const [currentUrl, setCurrentUrl] = useState('') // 이제 InputArea와 값이 동기화됨
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [videoData, setVideoData] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')
  
  const [progress, setProgress] = useState(0)
  
  const progressRef = useRef(0);
  
  const [showToast, setShowToast] = useState(false)
  const [downloadPath, setDownloadPath] = useState<string>('') 
  const [lastSavedPath, setLastSavedPath] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [queue, setQueue] = useState<MediaItem[]>([])
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentItem, setCurrentItem] = useState<MediaItem | null>(null)
  
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const [appSettings, setAppSettings] = useState({
    general: { notifications: true },
    download: { defaultPath: '', defaultQuality: 'best', askLocation: false }
  });

  // 스마트 붙여넣기 (Paste-to-Analyze)
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      // 1. 입력창(input/textarea)에 포커스가 있으면 가로채지 않음 (기본 붙여넣기 허용)
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      // 2. 클립보드 텍스트 확인
      const text = e.clipboardData?.getData('text') || await navigator.clipboard.readText();
      
      // 3. 지원하는 URL인지 검사 후 자동 분석 실행
      if (text && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('instagram.com') || text.includes('tiktok.com'))) {
        e.preventDefault(); 
        addNotification('info', '링크를 감지하여 자동으로 분석합니다.');
        setCurrentUrl(text); // 입력창에 텍스트 표시
        handleAnalyze(text); // 분석 시작
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []); // 의존성 배열 비움 (마운트 시 1회 등록)

  useEffect(() => {
    const initSettings = async () => {
      const settings = await window.api.getSettings();
      if (settings) {
        setAppSettings(settings);
        if (settings.download.defaultPath) {
          setDownloadPath(settings.download.defaultPath);
        }
      }
    };
    initSettings();
  }, []);

  const handleSettingsChanged = (newSettings: any) => {
    setAppSettings(newSettings);
    if (newSettings.download.defaultPath) {
      setDownloadPath(newSettings.download.defaultPath);
    }
  };

  const [recentAnalysis, setRecentAnalysis] = useState<any[]>(() => {
    const saved = localStorage.getItem('recent_analysis')
    return saved ? JSON.parse(saved) : []
  })

  const [history, setHistory] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('download_history')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => { localStorage.setItem('recent_analysis', JSON.stringify(recentAnalysis)) }, [recentAnalysis])
  useEffect(() => { localStorage.setItem('download_history', JSON.stringify(history)) }, [history])

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const newItem: NotificationItem = { id: Date.now().toString(), type, message, time: new Date().toLocaleTimeString() }
    setNotifications(prev => [newItem, ...prev])
  }
  const deleteNotification = (id: string) => setNotifications(prev => prev.filter(item => item.id !== id))

  useEffect(() => {
    const removeUpdateListener = window.api.onUpdateAvailable(() => {
      addNotification('info', '새로운 버전이 있습니다! 다운로드 페이지를 확인하세요.');
      const confirmUpdate = confirm("새로운 버전이 출시되었습니다! \n다운로드 페이지로 이동하시겠습니까?");
      if (confirmUpdate) {
        window.open('https://github.com/thoven-jun/omni-video-downloader/releases');
      }
    });
    return () => { removeUpdateListener(); }
  }, []);

  useEffect(() => {
    const removeProgressListener = window.api.onDownloadProgress(({ id, progress }) => {
        if (currentItem?.id === id) {
            setProgress(progress);
            progressRef.current = progress;
        }
    });
    return () => { removeProgressListener() }
  }, [currentItem]);

  useEffect(() => {
    if (isProcessing) return;
    const nextItem = queue.find(item => item.status === 'waiting');
    if (nextItem && nextItem.id !== editingId) {
      processNextItem(nextItem);
    }
  }, [queue, isProcessing, editingId]);

  const processNextItem = async (item: MediaItem) => {
    setIsProcessing(true);
    setCurrentItem(item);
    
    const startProgress = item.progress || 0;
    setProgress(startProgress);
    progressRef.current = startProgress;

    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'downloading' } : q));

    try {
      await new Promise<void>((resolve) => {
        const cleanup = window.api.onDownloadComplete((res) => {
          if (res.id !== item.id) return;
          cleanup();
          
          try {
            if (res.success) {
              const savedFile = res.filePath || '';
              setLastSavedPath(savedFile);
              addToHistory(item.title, item.thumbnail, savedFile, item.type);
              addNotification('success', `다운로드 완료: ${item.title}`);
              
              setShowToast(true);
              setTimeout(() => setShowToast(false), 4000);

              setQueue(prev => prev.filter(q => q.id !== item.id));
              resolve();
            } else if (res.isPaused) {
              // [수정 #3 해결] progress(상태) 대신 progressRef.current(최신값) 사용
              setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'stopped', progress: progressRef.current } : q));
              resolve();
            } else if (res.isCancelled) {
              setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'fail' } : q));
              addNotification('info', `다운로드가 취소되었습니다: ${item.title}`);
              resolve();
            } else {
              addNotification('error', `${item.title} 실패: ${res.error}`);
              setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'fail' } : q));
              resolve();
            }
          } catch (error) {
            console.error("Completion Error:", error);
            // 에러가 나도 프로세스는 종료 처리
            setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'fail' } : q));
            resolve();
          }
        });

        window.api.startDownload({
          id: item.id,
          url: item.url!,
          folder: item.folder || downloadPath,
          title: item.title,
          type: item.type,
          quality: item.quality === '최고화질' ? 'best' : item.quality,
          audioFormat: item.audioFormat || 'mp3',
          includeThumbnail: item.includeThumbnail,
          includeSubtitle: item.includeSubtitle,
          subLanguage: item.subLanguage
        });
      });
    } catch (e) {
      console.error(e);
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'fail' } : q));
    } finally {
      setIsProcessing(false);
      setCurrentItem(null);
    }
  }

  const handlePauseItem = async (id: string) => {
    await window.api.pauseDownload(id);
    // 상태 업데이트는 onDownloadComplete(isPaused)에서 처리됨
  };

  const handleCancelItem = async (id: string) => {
    await window.api.cancelDownload(id);
    // 상태 업데이트는 onDownloadComplete(isCancelled)에서 처리됨
  };

  // 재시작 (처음부터 다시)
  const handleRetryItem = (id: string) => {
      // 상태를 waiting으로 바꾸면 useEffect가 감지하여 processNextItem 실행
      setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'waiting' } : q));
  };

  // 플로팅 바의 Resume 버튼용 (멈춘 첫 번째 항목 재개)
  const handleResumeFirst = () => {
      // 재개 시에는 '진행률이 있는' 멈춘 항목 우선, 없으면 그냥 멈춘 항목
      const stoppedItem = queue.find(q => q.status === 'stopped' && (q.progress || 0) > 0) || queue.find(q => q.status === 'stopped');
      if (stoppedItem) {
          handleRetryItem(stoppedItem.id);
      }
  };

  const addToHistory = (title: string, thumbnail: string, path: string, type: 'video' | 'audio' | 'thumbnail' | 'subtitle') => {
    const newItem: MediaItem = {
        id: Date.now().toString(),
        title, thumbnail, date: new Date().toLocaleDateString(), filePath: path, type
    }
    setHistory(prev => [newItem, ...prev].slice(0, 30))
  }

  useEffect(() => {
    const checkClipboard = async () => {
      if (hasCheckedClipboard) return;
      hasCheckedClipboard = true;
      try {
        const text = await window.api.readClipboard()
        if (text && text.length < 500 && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('instagram.com') || text.includes('tiktok.com'))) {
           if (!currentUrl) {
             setTimeout(() => {
               const displayUrl = text.length > 50 ? text.substring(0, 50) + '...' : text;
               if(confirm(`클립보드 링크 감지: ${displayUrl}\n분석할까요?`)) handleAnalyze(text);
             }, 100);
           }
        }
      } catch (e) { console.error(e) }
    }
    checkClipboard();
  }, [])

  const handleAnalyze = async (url: string) => {
    setCurrentUrl(url)
    setStatus('loading')
    setVideoData(null)
    setErrorMsg('')
    setShowToast(false)
    try {
      const result = await window.api.getVideoInfo(url)
      if (result.success) {
        setVideoData(result.data)
        setStatus('success')
        setRecentAnalysis(prev => {
          const filtered = prev.filter(item => item.title !== result.data.title);
          return [result.data, ...filtered].slice(0, 20);
        });
      } else {
        setStatus('error')
        setErrorMsg(result.error || '오류 발생')
        addNotification('error', `분석 실패: ${url}`)
      }
    } catch (e) {
      setStatus('error')
      setErrorMsg(`${e}`)
      addNotification('error', `시스템 오류: ${e}`)
    }
  }

  const handleDownload = async (options: any) => {
    let targetFolder = '';
    if (appSettings.download.askLocation) {
      const selected = await window.api.selectFolder();
      if (!selected) return;
      targetFolder = selected;
    } else {
      if (!downloadPath && appSettings.download.defaultPath) {
        setDownloadPath(appSettings.download.defaultPath);
      }
    }
    addQueueItem(options, 'waiting', targetFolder);
  }

  const handleAddToQueue = async (options: any) => {
    let targetFolder = '';
    if (appSettings.download.askLocation) {
      const selected = await window.api.selectFolder();
      if (!selected) return;
      targetFolder = selected;
    }
    addQueueItem(options, 'stopped', targetFolder);
  }

  const addQueueItem = (options: any, initialStatus: 'waiting' | 'stopped', folderPath?: string) => {
    if (!videoData) return;
    
    let titlePrefix = '';
    if (options.type === 'thumbnail') titlePrefix = '[썸네일] ';
    if (options.type === 'subtitle') titlePrefix = '[대본] '; // '자막' -> '대본' (기획 의도 반영)

    const newItem: MediaItem = {
      id: Date.now().toString(),
      title: titlePrefix + videoData.title,
      thumbnail: videoData.thumbnail,
      type: options.type,
      quality: options.quality === 'best' ? '최고화질' : options.quality,
      audioFormat: options.audioFormat,
      folder: folderPath || downloadPath || appSettings.download.defaultPath || '', 
      url: currentUrl,
      status: initialStatus,
      resolutions: videoData.resolutions,
      includeThumbnail: options.includeThumbnail,
      includeSubtitle: options.includeSubtitle,
      // 언어 저장
      subLanguage: options.subLanguage || 'ko' 
    }
    setQueue(prev => [...prev, newItem])
    
    if (initialStatus === 'stopped') {
       addNotification('info', '대기열에 추가되었습니다.')
    } else {
       if (options.type === 'thumbnail' || options.type === 'subtitle') {
          addNotification('info', `${options.type === 'thumbnail' ? '썸네일' : '대본'} 저장을 시작합니다.`);
       } else {
          addNotification('info', '다운로드 대기열에 추가되었습니다.')
       }
    }
  }

  const handleUpdateQueueItem = (id: string, updates: Partial<MediaItem>) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const handleDownloadAll = () => {
    setQueue(prev => prev.map(q => (q.status === 'stopped' || q.status === 'fail') ? { ...q, status: 'waiting' } : q));
  }

  const handleOpenFolder = (path?: string) => window.api.showInFolder(path || lastSavedPath)
  
  const handleChangeFolder = async () => {
    const path = await window.api.selectFolder();
    if (path) setDownloadPath(path);
  }

  const handleSelectFolder = async () => {
    return await window.api.selectFolder();
  }

  const handleSelectRecent = (item: any) => {
    setVideoData(item);
    if (item.url) setCurrentUrl(item.url);
    setStatus('success');
  }

  const activeStoppedItem = queue.find(q => q.status === 'stopped' && (q.progress || 0) > 0);
  const shouldShowFloating = isProcessing || !!activeStoppedItem;

  const activeTitle = currentItem?.title || activeStoppedItem?.title || '';

  const waitingOrNewStoppedCount = queue.filter(q => q.status === 'waiting' || (q.status === 'stopped' && (q.progress || 0) === 0)).length;
  const currentCount = queue.length - waitingOrNewStoppedCount;

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      
      <Sidebar 
        items={recentAnalysis}
        selectedId={videoData?.title || null}
        onSelect={handleSelectRecent}
        onDelete={(title) => setRecentAnalysis(prev => prev.filter(i => i.title !== title))}
        onClear={() => setRecentAnalysis([])}
        isOpen={isLeftSidebarOpen}
        onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
      />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 pointer-events-none">
          <div className="pointer-events-auto">
            {!isLeftSidebarOpen && (
              <button onClick={() => setIsLeftSidebarOpen(true)} className="rounded-full bg-gray-800 p-2 text-gray-300 hover:bg-gray-700 hover:text-white transition shadow-lg" title="사이드바 열기">
                <PanelLeft size={20} />
              </button>
            )}
          </div>
          
          <div className="pointer-events-auto flex items-center gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-full bg-gray-800 p-2 text-gray-300 hover:bg-gray-700 hover:text-white transition shadow-lg"
              title="설정"
            >
              <Settings size={20} />
            </button>
            <button onClick={() => setIsSidebarOpen(true)} className="relative rounded-full bg-gray-800 p-2 text-gray-300 hover:bg-gray-700 hover:text-white transition shadow-lg">
              <Bell size={20} />
              {notifications.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">{notifications.length}</span>}
            </button>
          </div>
        </div>

        <NotificationSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} notifications={notifications} onClear={() => setNotifications([])} onDelete={deleteNotification} />
        
        <Toast 
          visible={showToast} 
          message="작업이 완료되었습니다." 
          onClose={() => setShowToast(false)} 
          onOpenFolder={() => handleOpenFolder()} 
        />
        {shouldShowFloating && (
          <FloatingStatus 
            isDownloading={isProcessing} 
            title={activeTitle}
            progress={isProcessing ? progress : (activeStoppedItem?.progress || 0)} 
            // [수정 #2 적용] 보정된 순번 전달
            current={currentCount}
            total={queue.length}
            isDrawerOpen={isQueueOpen} 
            onPause={() => currentItem && handlePauseItem(currentItem.id)}
            onCancel={() => currentItem && handleCancelItem(currentItem.id)}
            onResume={handleResumeFirst}
          />
        )}

        <div className="flex-1 flex flex-col items-center px-6 py-12 overflow-y-auto pb-40">
          <div className="mb-8 w-full max-w-2xl flex flex-col items-center mt-4">
            <h1 className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-4xl font-black text-transparent mb-2">Omni Video Downloader</h1>
          </div>

          <InputArea 
            onAnalyze={handleAnalyze} 
            isLoading={status === 'loading'} 
            // App의 상태를 주입하여 동기화
            value={currentUrl}
            onChange={setCurrentUrl}
          />

          {(status === 'error') && <div className="mt-6 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/50"><AlertCircle size={16} /> {errorMsg}</div>}

          {status === 'success' && videoData && (
            <div className="w-full max-w-4xl animate-fade-in-up">
              <MediaCard 
                data={videoData} 
                onDownload={handleDownload} 
                onAddToQueue={handleAddToQueue} 
                downloadPath={downloadPath || appSettings.download.defaultPath}
                onChangePath={handleChangeFolder}
              />
            </div>
          )}

          <div className="mt-auto pt-10 text-center text-[14px] text-gray-600"><p>개인 소장 목적 외의 공유/재배포는 저작권법 위반 소지가 있습니다.</p></div>
        </div>

        <QueueDrawer 
          queue={queue}
          history={history}
          onOpenFolder={handleOpenFolder} 
          onDeleteHistory={(id) => setHistory(prev => prev.filter(item => item.id !== id))}
          onClearHistory={() => setHistory([])}
          onRemoveQueue={(id) => setQueue(prev => prev.filter(item => item.id !== id))}
          onDownloadAll={handleDownloadAll}
          onUpdateItem={handleUpdateQueueItem}
          onSelectFolder={handleSelectFolder}
          editingId={editingId}
          setEditingId={setEditingId}
          onStartItem={handleRetryItem} // 대기/실패 상태일 때 시작 -> 재시도
          onPauseItem={handlePauseItem}
          onCancelItem={handleCancelItem}
          isOpen={isQueueOpen}
          onToggle={setIsQueueOpen}
        />
        
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          onSettingsChanged={handleSettingsChanged}
        />
        
      </div>
    </div>
  )
}

export default App