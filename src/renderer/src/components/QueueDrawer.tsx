import { useState, useEffect } from 'react'
import { FolderOpen, Trash2, Clock, ListVideo, Play, X, ChevronUp, ChevronDown, FileVideo, Music, CheckCircle, Settings, FolderInput, PauseCircle, Check, Image as ImageIcon, FileText, CheckSquare, Square, Pause, RotateCcw } from 'lucide-react'

export interface MediaItem {
  id: string
  title: string
  thumbnail: string
  date?: string
  filePath?: string
  type: 'video' | 'audio' | 'thumbnail' | 'subtitle'
  quality?: string
  audioFormat?: string
  folder?: string
  url?: string
  status?: 'stopped' | 'waiting' | 'downloading' | 'done' | 'fail'
  resolutions?: number[]
  includeThumbnail?: boolean
  includeSubtitle?: boolean
  subLanguage?: string
  progress?: number // [신규] 진행률 저장용
}

// (QueueItemEditor 컴포넌트 - 기존 유지)
function QueueItemEditor({ item, onSave, onCancel, onSelectFolder }: { item: MediaItem, onSave: (updates: Partial<MediaItem>) => void, onCancel: () => void, onSelectFolder: () => Promise<string | null> }) {
  // ... (기존 코드 유지)
  const [type, setType] = useState(item.type);
  const [quality, setQuality] = useState(item.quality || 'best');
  const [audioFormat, setAudioFormat] = useState(item.audioFormat || 'mp3');
  const [folder, setFolder] = useState(item.folder);
  const [includeThumbnail, setIncludeThumbnail] = useState(item.includeThumbnail || false);
  const [includeSubtitle, setIncludeSubtitle] = useState(item.includeSubtitle || false);

  const handleChangeFolder = async () => {
    const newPath = await onSelectFolder();
    if (newPath) setFolder(newPath);
  }

  return (
    <div className="bg-gray-750 px-5 py-4 border-t border-gray-700 animate-fade-in-down">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-400 ml-1">유형</label>
          <div className="flex rounded-lg bg-gray-900 p-1 h-[38px] items-center">
            <button onClick={() => setType('video')} disabled={type === 'thumbnail' || type === 'subtitle'} className={`px-4 py-1.5 text-xs font-bold rounded-md transition h-full flex items-center ${type === 'video' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white disabled:opacity-50'}`}>Video</button>
            <button onClick={() => setType('audio')} disabled={type === 'thumbnail' || type === 'subtitle'} className={`px-4 py-1.5 text-xs font-bold rounded-md transition h-full flex items-center ${type === 'audio' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white disabled:opacity-50'}`}>Audio</button>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-36">
          <label className="text-xs font-bold text-gray-400 ml-1">{type === 'video' ? '화질' : (type === 'audio' ? '포맷' : '옵션')}</label>
          <select value={type === 'video' ? quality : audioFormat} onChange={(e) => type === 'video' ? setQuality(e.target.value) : setAudioFormat(e.target.value)} disabled={type === 'thumbnail' || type === 'subtitle'} className="w-full appearance-none rounded-lg bg-gray-900 px-3 text-xs font-bold text-white outline-none ring-1 ring-gray-700 focus:ring-blue-500 cursor-pointer disabled:opacity-50 h-[38px]">
            {type === 'video' ? (<><option value="best">최고 화질</option>{item.resolutions?.map(res => <option key={res} value={res}>{res}p</option>)}{!item.resolutions && (<><option value="2160">2160p (4K)</option><option value="1080">1080p (FHD)</option></>)}</>) : type === 'audio' ? (<><option value="mp3">MP3</option><option value="m4a">M4A</option><option value="wav">WAV</option></>) : (<option value="default">기본</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2 w-72">
          <label className="text-xs font-bold text-gray-400 ml-1">저장 위치</label>
          <div className="flex items-center gap-2 rounded-lg bg-gray-900 pl-3 pr-1 ring-1 ring-gray-700 h-[38px]">
            <div className="flex-1 truncate text-xs font-medium text-gray-300" title={folder || '기본 다운로드 폴더'}>{folder || '기본'}</div>
            <button onClick={handleChangeFolder} className="shrink-0 flex items-center justify-center gap-1 rounded-md bg-gray-800 w-8 h-7 text-gray-300 hover:bg-gray-600 hover:text-white transition"><FolderInput size={14} /></button>
          </div>
        </div>
        <div className="flex flex-col gap-2 ml-2">
          <label className="text-xs font-bold text-gray-400 ml-1">추가 저장</label>
          <div className="flex items-center gap-4 h-[38px]">
             <button onClick={() => setIncludeThumbnail(!includeThumbnail)} className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white transition">
                {includeThumbnail ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>} 썸네일
             </button>
             <button onClick={() => setIncludeSubtitle(!includeSubtitle)} className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white transition">
                {includeSubtitle ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>} 자막
             </button>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <button onClick={onCancel} className="flex items-center gap-1.5 rounded-lg bg-gray-700 px-4 text-xs font-bold text-gray-300 hover:bg-gray-600 transition h-[38px]" title="취소"><X size={16} /> 취소</button>
          <button onClick={() => onSave({ type, quality, audioFormat, folder, includeThumbnail, includeSubtitle })} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-500 transition shadow-md h-[38px]"><Check size={16} /> 완료</button>
        </div>
      </div>
    </div>
  )
}

interface QueueDrawerProps {
  queue: MediaItem[]
  history: MediaItem[]
  onOpenFolder: (path: string) => void
  onDeleteHistory: (id: string) => void
  onClearHistory: () => void
  onRemoveQueue: (id: string) => void
  onDownloadAll: () => void
  onUpdateItem: (id: string, updates: Partial<MediaItem>) => void
  onSelectFolder: () => Promise<string | null>
  editingId: string | null
  setEditingId: (id: string | null) => void
  onStartItem: (id: string) => void
  
  // 제어 핸들러
  onPauseItem?: (id: string) => void
  onCancelItem?: (id: string) => void

  isOpen: boolean
  onToggle: (isOpen: boolean) => void
  hideQueueTab?: boolean
}

export function QueueDrawer({ 
  queue, history, onOpenFolder, onDeleteHistory, onClearHistory, onRemoveQueue, onDownloadAll, 
  onUpdateItem, onSelectFolder, editingId, setEditingId, onStartItem, onPauseItem, onCancelItem,
  isOpen, onToggle, hideQueueTab = false 
}: QueueDrawerProps) {
  
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>(hideQueueTab ? 'history' : 'queue');

  useEffect(() => {
    if (hideQueueTab) setActiveTab('history');
  }, [hideQueueTab]);

  useEffect(() => {
    const BASE_HEIGHT = 960; 
    const EXPANDED_HEIGHT = 1200; 
    const screenHeight = window.screen.availHeight;
    if (isOpen) {
      if (screenHeight >= EXPANDED_HEIGHT) window.api.resizeWindow(EXPANDED_HEIGHT);
    } else {
      window.api.resizeWindow(BASE_HEIGHT);
    }
  }, [isOpen]);

  const getHeightClass = () => {
    if (!isOpen) return 'h-12';
    return 'h-[320px]';
  }

  const currentItems = activeTab === 'queue' ? queue : history;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 flex flex-col bg-gray-900 border-t border-gray-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-[height] duration-500 ease-out ${getHeightClass()}`}>
      
      <div className="flex h-12 shrink-0 items-center justify-between bg-gray-800 px-0 select-none cursor-pointer hover:bg-gray-750 transition-colors" onClick={() => onToggle(!isOpen)}>
        <div className="flex h-full" onClick={(e) => e.stopPropagation()}>
          {!hideQueueTab && (
            <button onClick={() => { setActiveTab('queue'); onToggle(true); }} className={`flex items-center gap-2 px-8 text-sm font-bold transition-colors ${activeTab === 'queue' ? 'bg-gray-700 text-blue-400 border-t-2 border-blue-400' : 'text-gray-500 hover:bg-gray-750'}`}>
                <ListVideo size={18} /> 대기열 ({queue.length})
            </button>
          )}
          <button onClick={() => { setActiveTab('history'); onToggle(true); }} className={`flex items-center gap-2 px-8 text-sm font-bold transition-colors ${activeTab === 'history' ? 'bg-gray-700 text-green-400 border-t-2 border-green-400' : 'text-gray-500 hover:bg-gray-750'}`}>
            <Clock size={18} /> 기록 ({history.length})
          </button>
        </div>
        <div className="flex items-center gap-4 pr-6">
          {isOpen && (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
              {activeTab === 'queue' && queue.length > 0 && (
                <button onClick={() => onDownloadAll()} className="flex items-center gap-1.5 rounded bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg hover:shadow-blue-500/20"><Play size={12} fill="currentColor" /> 모두 시작</button>
              )}
              {activeTab === 'history' && history.length > 0 && (
                <button onClick={() => onClearHistory()} className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700 hover:text-red-400 transition"><Trash2 size={14}/> 전체 삭제</button>
              )}
            </div>
          )}
          <div className="ml-2 cursor-pointer text-gray-400 hover:text-white transition">{isOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-900/95 backdrop-blur-sm">
        {currentItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <p>{activeTab === 'queue' ? '대기 중인 영상이 없습니다.' : '기록이 없습니다.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {currentItems.map((item) => (
              <div key={item.id} className="flex flex-col rounded-xl bg-gray-800 ring-1 ring-gray-700/50 overflow-hidden shadow-md">
                
                <div className="group flex items-center gap-4 p-3 hover:bg-gray-750 transition-all">
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-black shadow-sm flex items-center justify-center">
                    {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" className="h-full w-full object-cover opacity-80" />
                    ) : (
                        <div className="text-gray-600">
                            {item.type === 'video' && <FileVideo size={24} />}
                            {item.type === 'audio' && <Music size={24} />}
                            {item.type === 'thumbnail' && <ImageIcon size={24} />}
                            {item.type === 'subtitle' && <FileText size={24} />}
                        </div>
                    )}
                    
                    {activeTab === 'queue' && item.status === 'downloading' && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div></div>}
                    {activeTab === 'queue' && item.status === 'done' && <div className="absolute inset-0 flex items-center justify-center bg-green-900/40 text-green-400"><CheckCircle size={20} /></div>}
                    {activeTab === 'queue' && item.status === 'stopped' && <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-yellow-400"><PauseCircle size={20} /></div>}
                  </div>

                  <div className="flex flex-1 flex-col overflow-hidden min-w-0 gap-1">
                    <h4 className="truncate text-sm font-bold text-gray-200 leading-tight" title={item.title}>{item.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1.5 bg-gray-900/50 px-2 py-0.5 rounded">
                        {item.type === 'video' && <><FileVideo size={12} />{activeTab === 'queue' && item.quality !== 'best' ? `${item.quality}p` : '최고 화질'}</>}
                        {item.type === 'audio' && <><Music size={12} />{activeTab === 'queue' ? item.audioFormat : 'Audio'}</>}
                        {item.type === 'thumbnail' && <><ImageIcon size={12} />썸네일</>}
                        {item.type === 'subtitle' && <><FileText size={12} />자막/대본</>}
                      </span>
                      {item.date && <span>{item.date}</span>}
                      {item.status === 'stopped' && <span className="text-yellow-500">대기 중 ({item.progress ? item.progress.toFixed(1) : 0}%)</span>}
                      {item.status === 'fail' && <span className="text-red-400">실패</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-2">
                    {activeTab === 'history' ? (
                      <>
                        <button onClick={() => onOpenFolder(item.filePath || item.folder || '')} className="rounded-lg bg-gray-700 p-2 text-blue-400 hover:bg-blue-600 hover:text-white transition" title="폴더 열기"><FolderOpen size={16} /></button>
                        <button onClick={() => onDeleteHistory(item.id)} className="rounded-lg bg-gray-700 p-2 text-gray-400 hover:bg-red-500 hover:text-white transition" title="삭제"><Trash2 size={16} /></button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        {item.status === 'downloading' && (
                            <>
                                {onPauseItem && (
                                    <button onClick={() => onPauseItem(item.id)} className="rounded-lg p-2 text-yellow-400 hover:bg-yellow-400/10 transition" title="일시정지">
                                        <Pause size={18} fill="currentColor" />
                                    </button>
                                )}
                                {onCancelItem && (
                                    // [수정] 취소 아이콘 Square(Stop)으로 변경
                                    <button onClick={() => onCancelItem(item.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-400/10 transition" title="취소">
                                        <Square size={18} fill="currentColor" />
                                    </button>
                                )}
                            </>
                        )}

                        {(item.status === 'stopped' || item.status === 'fail') && (
                          <button onClick={() => onStartItem(item.id)} className="rounded-lg p-2 text-green-400 hover:bg-green-500/20 transition" title={item.status === 'fail' ? "재시도" : "재개"}>
                             {item.status === 'fail' ? <RotateCcw size={18} /> : <Play size={18} fill="currentColor" />}
                          </button>
                        )}
                        
                        {/* [수정] stopped 상태에서도 편집 비활성화 */}
                        <button onClick={() => setEditingId(editingId === item.id ? null : item.id)} disabled={item.status === 'downloading' || item.status === 'stopped'} className={`rounded-lg p-2 transition ${editingId === item.id ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'} ${item.status === 'downloading' || item.status === 'stopped' ? 'opacity-50 cursor-not-allowed' : ''}`} title="설정 변경"><Settings size={16} /></button>
                        <button onClick={() => onRemoveQueue(item.id)} disabled={item.status === 'downloading'} className={`rounded-lg bg-gray-700 p-2 text-gray-400 hover:bg-red-500 hover:text-white transition ${item.status === 'downloading' ? 'opacity-50 cursor-not-allowed' : ''}`} title="목록에서 제거"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>

                {activeTab === 'queue' && editingId === item.id && (
                  <QueueItemEditor item={item} onSelectFolder={onSelectFolder} onCancel={() => setEditingId(null)} onSave={(updates) => { onUpdateItem(item.id, updates); setEditingId(null); }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}