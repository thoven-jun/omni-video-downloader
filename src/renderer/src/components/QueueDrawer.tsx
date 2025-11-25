import { useState, useEffect } from 'react'
import { FolderOpen, Trash2, Clock, ListVideo, Play, X, ChevronUp, ChevronDown, FileVideo, Music, CheckCircle, Settings, FolderInput, PauseCircle, Check } from 'lucide-react'

export interface MediaItem {
  id: string
  title: string
  thumbnail: string
  date?: string
  filePath?: string
  type: 'video' | 'audio'
  quality?: string
  audioFormat?: string
  folder?: string
  url?: string
  status?: 'stopped' | 'waiting' | 'downloading' | 'done' | 'fail'
  resolutions?: number[]
}

// 편집 전용 컴포넌트
function QueueItemEditor({ item, onSave, onCancel, onSelectFolder }: { item: MediaItem, onSave: (updates: Partial<MediaItem>) => void, onCancel: () => void, onSelectFolder: () => Promise<string | null> }) {
  const [type, setType] = useState(item.type);
  const [quality, setQuality] = useState(item.quality || 'best');
  const [audioFormat, setAudioFormat] = useState(item.audioFormat || 'mp3');
  const [folder, setFolder] = useState(item.folder);

  const handleChangeFolder = async () => {
    const newPath = await onSelectFolder();
    if (newPath) setFolder(newPath);
  }

  return (
    <div className="bg-gray-750 px-4 py-3 border-t border-gray-700 animate-fade-in-down">
      <div className="flex flex-wrap items-end gap-4">
        
        {/* 1. 타입 선택 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-gray-400 ml-1">유형</label>
          <div className="flex rounded-lg bg-gray-900 p-1">
            <button onClick={() => setType('video')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${type === 'video' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Video</button>
            <button onClick={() => setType('audio')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${type === 'audio' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Audio</button>
          </div>
        </div>

        {/* 2. 화질/포맷 선택 */}
        <div className="flex flex-col gap-1.5 w-32">
          <label className="text-[10px] font-semibold text-gray-400 ml-1">{type === 'video' ? '화질' : '포맷'}</label>
          <select 
            value={type === 'video' ? quality : audioFormat}
            onChange={(e) => type === 'video' ? setQuality(e.target.value) : setAudioFormat(e.target.value)}
            className="w-full appearance-none rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white outline-none ring-1 ring-gray-700 focus:ring-blue-500 cursor-pointer"
          >
            {type === 'video' ? (
              <>
                <option value="best">최고 화질</option>
                {item.resolutions?.map(res => <option key={res} value={res}>{res}p</option>)}
                {!item.resolutions && (
                  <>
                    <option value="2160">2160p (4K)</option>
                    <option value="1440">1440p (QHD)</option>
                    <option value="1080">1080p (FHD)</option>
                    <option value="720">720p (HD)</option>
                  </>
                )}
              </>
            ) : (
              <>
                <option value="mp3">MP3</option>
                <option value="m4a">M4A</option>
              </>
            )}
          </select>
        </div>

        {/* 3. 저장 위치 */}
        <div className="flex flex-col gap-1.5 w-48">
          <label className="text-[10px] font-semibold text-gray-400 ml-1">저장 위치</label>
          <div className="flex items-center gap-2 rounded-lg bg-gray-900 pl-3 pr-1 py-1 ring-1 ring-gray-700">
            <div className="flex-1 truncate text-xs text-gray-300" title={folder || '기본 다운로드 폴더'}>
              {folder || '기본'}
            </div>
            <button onClick={handleChangeFolder} className="shrink-0 flex items-center gap-1 rounded-md bg-gray-800 px-2 py-1 text-[10px] font-bold text-gray-300 hover:bg-gray-600 hover:text-white transition">
              <FolderInput size={12} />
            </button>
          </div>
        </div>

        {/* 4. 버튼 그룹 */}
        <div className="flex items-center gap-2 ml-auto">
          <button 
            onClick={onCancel}
            className="flex items-center gap-1 rounded-lg bg-gray-700 px-3 py-2 text-xs font-bold text-gray-300 hover:bg-gray-600 transition h-[34px]"
            title="취소"
          >
            <X size={14} /> 취소
          </button>
          <button 
            onClick={() => onSave({ type, quality, audioFormat, folder })}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-md h-[34px]"
          >
            <Check size={14} /> 완료
          </button>
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
  
  // [수정됨] App에서 상태를 제어하기 위해 props 추가
  isOpen: boolean
  onToggle: (isOpen: boolean) => void
}

export function QueueDrawer({ 
  queue, history, onOpenFolder, onDeleteHistory, onClearHistory, onRemoveQueue, onDownloadAll, 
  onUpdateItem, onSelectFolder, editingId, setEditingId, onStartItem,
  isOpen, onToggle // [추가됨]
}: QueueDrawerProps) {
  
  // [삭제됨] 내부 state 제거
  // const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  useEffect(() => {
    const BASE_HEIGHT = 840;
    const EXPANDED_HEIGHT = 1160; 
    const screenHeight = window.screen.availHeight;

    if (isOpen) {
      if (screenHeight >= EXPANDED_HEIGHT) {
        window.api.resizeWindow(EXPANDED_HEIGHT);
      }
    } else {
      window.api.resizeWindow(BASE_HEIGHT);
    }
  }, [isOpen]);

  const getHeightClass = () => {
    if (!isOpen) return 'h-12'; // 닫혔을 때 높이
    return 'h-[320px]'; // 열렸을 때 높이
  }

  const currentItems = activeTab === 'queue' ? queue : history;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 flex flex-col bg-gray-900 border-t border-gray-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-[height] duration-500 ease-out ${getHeightClass()}`}>
      
      {/* 헤더 */}
      <div 
        className="flex h-12 shrink-0 items-center justify-between bg-gray-800 px-0 select-none cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => onToggle(!isOpen)} // [수정됨] prop 호출
      >
        <div className="flex h-full" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => { setActiveTab('queue'); onToggle(true); }} // [수정됨] prop 호출
            className={`flex items-center gap-2 px-8 text-sm font-bold transition-colors ${activeTab === 'queue' ? 'bg-gray-700 text-blue-400 border-t-2 border-blue-400' : 'text-gray-500 hover:bg-gray-750'}`}
          >
            <ListVideo size={18} /> 대기열 ({queue.length})
          </button>
          <button 
            onClick={() => { setActiveTab('history'); onToggle(true); }} // [수정됨] prop 호출
            className={`flex items-center gap-2 px-8 text-sm font-bold transition-colors ${activeTab === 'history' ? 'bg-gray-700 text-green-400 border-t-2 border-green-400' : 'text-gray-500 hover:bg-gray-750'}`}
          >
            <Clock size={18} /> 기록 ({history.length})
          </button>
        </div>

        <div className="flex items-center gap-4 pr-6">
          {isOpen && (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
              {activeTab === 'queue' && queue.length > 0 && (
                <button 
                  onClick={() => onDownloadAll()}
                  className="flex items-center gap-1.5 rounded bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg hover:shadow-blue-500/20"
                >
                  <Play size={12} fill="currentColor" /> 모두 시작
                </button>
              )}
              {activeTab === 'history' && history.length > 0 && (
                <button 
                  onClick={() => onClearHistory()}
                  className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700 hover:text-red-400 transition"
                >
                  <Trash2 size={14}/> 전체 삭제
                </button>
              )}
            </div>
          )}
          <div className="ml-2 cursor-pointer text-gray-400 hover:text-white transition">
            {isOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </div>
      </div>

      {/* 리스트 */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-900/95 backdrop-blur-sm">
        {currentItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <p>{activeTab === 'queue' ? '대기 중인 영상이 없습니다.' : '다운로드 기록이 없습니다.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {currentItems.map((item) => (
              <div key={item.id} className="flex flex-col rounded-xl bg-gray-800 ring-1 ring-gray-700/50 overflow-hidden shadow-md">
                
                {/* 아이템 메인 줄 */}
                <div className="group flex items-center gap-4 p-3 hover:bg-gray-750 transition-all">
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-black shadow-sm">
                    <img src={item.thumbnail} alt="" className="h-full w-full object-cover opacity-80" />
                    {activeTab === 'queue' && item.status === 'downloading' && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div></div>}
                    {activeTab === 'queue' && item.status === 'done' && <div className="absolute inset-0 flex items-center justify-center bg-green-900/40 text-green-400"><CheckCircle size={20} /></div>}
                    {activeTab === 'queue' && item.status === 'stopped' && <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-yellow-400"><PauseCircle size={20} /></div>}
                  </div>

                  <div className="flex flex-1 flex-col overflow-hidden min-w-0 gap-1">
                    <h4 className="truncate text-sm font-bold text-gray-200 leading-tight" title={item.title}>{item.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1.5 bg-gray-900/50 px-2 py-0.5 rounded">
                        {item.type === 'video' ? <FileVideo size={12} /> : <Music size={12} />}
                        {activeTab === 'queue' 
                          ? (item.type === 'video' ? (item.quality === 'best' ? '최고화질' : `${item.quality}p`) : item.audioFormat)
                          : (item.type === 'video' ? 'Video' : 'Audio')
                        }
                      </span>
                      {item.date && <span>{item.date}</span>}
                      {item.status === 'stopped' && <span className="text-yellow-500">대기 중</span>}
                      {item.status === 'fail' && <span className="text-red-400">실패</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-2">
                    {activeTab === 'history' ? (
                      <>
                        <button onClick={() => item.filePath && onOpenFolder(item.filePath)} className="rounded-lg bg-gray-700 p-2 text-blue-400 hover:bg-blue-600 hover:text-white transition" title="폴더 열기"><FolderOpen size={16} /></button>
                        <button onClick={() => onDeleteHistory(item.id)} className="rounded-lg bg-gray-700 p-2 text-gray-400 hover:bg-red-500 hover:text-white transition" title="삭제"><Trash2 size={16} /></button>
                      </>
                    ) : (
                      <>
                        {(item.status === 'stopped' || item.status === 'fail') && (
                          <button 
                            onClick={() => onStartItem(item.id)}
                            className="rounded-lg p-2 text-green-400 hover:bg-green-500/20 transition"
                            title="다운로드 시작"
                          >
                            <Play size={18} fill="currentColor" />
                          </button>
                        )}

                        <button 
                          onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                          disabled={item.status === 'downloading'} 
                          className={`rounded-lg p-2 transition ${editingId === item.id ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'} ${item.status === 'downloading' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="설정 변경"
                        >
                          <Settings size={16} />
                        </button>
                        <button 
                          onClick={() => onRemoveQueue(item.id)}
                          disabled={item.status === 'downloading'}
                          className={`rounded-lg bg-gray-700 p-2 text-gray-400 hover:bg-red-500 hover:text-white transition ${item.status === 'downloading' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="목록에서 제거"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {activeTab === 'queue' && editingId === item.id && (
                  <QueueItemEditor 
                    item={item} 
                    onSelectFolder={onSelectFolder}
                    onCancel={() => setEditingId(null)}
                    onSave={(updates) => {
                      onUpdateItem(item.id, updates);
                      setEditingId(null);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}