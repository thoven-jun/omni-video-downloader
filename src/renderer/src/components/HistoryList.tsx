import { FileVideo, FolderOpen, Trash2, Clock, Music } from 'lucide-react'

// 히스토리 아이템의 데이터 구조 정의
export interface HistoryItem {
  id: string
  title: string
  thumbnail: string
  date: string
  filePath: string
  type: 'video' | 'audio'
}

interface HistoryListProps {
  items: HistoryItem[]
  onOpenFolder: (path: string) => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

export function HistoryList({ items, onOpenFolder, onDelete, onClearAll }: HistoryListProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-12 w-full max-w-2xl animate-fade-in-up">
      <div className="mb-4 flex items-center justify-between px-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-300">
          <Clock size={20} /> 최근 다운로드 기록
        </h2>
        <button 
          onClick={onClearAll}
          className="text-xs text-gray-500 hover:text-red-400 transition"
        >
          기록 전체 삭제
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div 
            key={item.id}
            className="group relative flex items-center gap-4 rounded-xl bg-gray-800/50 p-3 ring-1 ring-gray-700/50 transition-all hover:bg-gray-800 hover:ring-gray-600"
          >
            {/* 썸네일 (작게) */}
            <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-black">
              <img src={item.thumbnail} alt="" className="h-full w-full object-cover opacity-80" />
            </div>

            {/* 정보 */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <h4 className="truncate text-sm font-bold text-gray-200" title={item.title}>
                {item.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  {item.type === 'video' ? <FileVideo size={10} /> : <Music size={10} />}
                  {item.type === 'video' ? 'Video' : 'Audio'}
                </span>
                <span>•</span>
                <span>{item.date}</span>
              </div>
            </div>

            {/* 액션 버튼들 (평소엔 흐릿하다가 마우스 올리면 선명해짐) */}
            <div className="flex items-center gap-2 opacity-50 transition-opacity group-hover:opacity-100">
              <button 
                onClick={() => onOpenFolder(item.filePath)}
                className="rounded-lg bg-gray-700 p-2 text-blue-400 hover:bg-blue-500 hover:text-white transition"
                title="폴더 열기"
              >
                <FolderOpen size={16} />
              </button>
              <button 
                onClick={() => onDelete(item.id)}
                className="rounded-lg bg-gray-700 p-2 text-gray-400 hover:bg-red-500 hover:text-white transition"
                title="기록 삭제"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}