import { Trash2, Clock, X, PanelLeftClose } from 'lucide-react'

interface SidebarProps {
  items: any[]
  selectedId: string | null
  onSelect: (item: any) => void
  onDelete: (id: string) => void
  onClear: () => void
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ items, selectedId, onSelect, onDelete, onClear, isOpen, onToggle }: SidebarProps) {
  return (
    <div 
      className={`flex flex-col border-r border-gray-800 bg-gray-900/50 backdrop-blur-sm h-full shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 border-none'
      }`}
    >
      {/* [수정] 너비를 w-64 -> w-72로 조금 늘려서 글자가 잘리지 않게 확보 */}
      
      {/* 헤더 */}
      <div className="flex h-14 items-center justify-between border-b border-gray-800 px-4 min-w-[18rem]">
        <div className="flex items-center gap-2 text-base font-bold text-gray-300"> {/* text-sm -> text-base */}
          <Clock size={18} className="text-blue-400" /> {/* size 16 -> 18 */}
          <span>최근 조회 ({items.length})</span>
        </div>
        
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button 
              onClick={onClear}
              className="text-xs text-gray-500 hover:text-red-400 transition p-1"
              title="전체 삭제"
            >
              <Trash2 size={16} /> {/* size 14 -> 16 */}
            </button>
          )}
          <button 
            onClick={onToggle}
            className="text-gray-500 hover:text-white transition p-1"
            title="사이드바 접기"
          >
            <PanelLeftClose size={18} /> {/* size 16 -> 18 */}
          </button>
        </div>
      </div>

      {/* 리스트 */}
      <div className="flex-1 overflow-y-auto p-3 min-w-[18rem]">
        {items.length === 0 ? (
          <div className="mt-10 text-center text-sm text-gray-600 px-4">
            분석한 링크가 여기에 기록됩니다.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item, index) => (
              <div 
                key={index}
                onClick={() => onSelect(item)}
                className={`group relative flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-all ${
                  (selectedId === item.title) 
                    ? 'bg-gray-800 ring-1 ring-blue-500/50' 
                    : 'hover:bg-gray-800/50'
                }`}
              >
                {/* 썸네일 (크기 증가) */}
                <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-black">
                  <img src={item.thumbnail} alt="" className="h-full w-full object-cover opacity-80" />
                </div>

                {/* 정보 */}
                <div className="flex flex-1 flex-col overflow-hidden gap-0.5">
                  {/* [수정] 폰트 사이즈 키움 */}
                  <h4 className={`truncate text-sm font-bold ${selectedId === item.title ? 'text-blue-300' : 'text-gray-300'}`}>
                    {item.title}
                  </h4>
                  <span className="text-xs text-gray-500 font-medium">{item.platform}</span>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(item.title); }}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition bg-gray-900/80 rounded-full"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}