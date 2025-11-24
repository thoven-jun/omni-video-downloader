import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface NotificationItem {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  time: string
}

interface NotificationSidebarProps {
  isOpen: boolean
  onClose: () => void
  notifications: NotificationItem[]
  onClear: () => void
  onDelete: (id: string) => void // [신규] 개별 삭제 함수 받기
}

export function NotificationSidebar({ isOpen, onClose, notifications, onClear, onDelete }: NotificationSidebarProps) {
  return (
    <>
      {/* 배경 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 사이드바 본체 */}
      <div className={`fixed right-0 top-0 z-50 h-full w-80 transform bg-gray-900 border-l border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Bell size={20} className="text-blue-400" /> 알림 센터
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* 알림 목록 */}
        <div className="flex h-[calc(100vh-110px)] flex-col overflow-y-auto p-4 gap-3">
          {notifications.length === 0 ? (
            <div className="mt-10 text-center text-sm text-gray-600">
              새로운 알림이 없습니다.
            </div>
          ) : (
            notifications.map((item) => (
              <div key={item.id} className="group relative flex flex-col gap-1 rounded-lg bg-gray-800 p-3 ring-1 ring-gray-700 pr-7">
                
                {/* [신규] 개별 삭제 버튼 (우측 상단 절대 위치) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="삭제"
                >
                  <X size={14} />
                </button>

                <div className="flex items-start gap-2">
                  {item.type === 'success' && <CheckCircle size={16} className="mt-0.5 text-green-400 shrink-0" />}
                  {item.type === 'error' && <AlertCircle size={16} className="mt-0.5 text-red-400 shrink-0" />}
                  {item.type === 'info' && <Info size={16} className="mt-0.5 text-blue-400 shrink-0" />}
                  <p className="text-sm text-gray-200 leading-snug break-all">{item.message}</p>
                </div>
                <span className="self-end text-[10px] text-gray-500">{item.time}</span>
              </div>
            ))
          )}
        </div>

        {/* 푸터 */}
        {notifications.length > 0 && (
          <div className="absolute bottom-0 w-full border-t border-gray-800 p-3 bg-gray-900">
            <button 
              onClick={onClear}
              className="w-full rounded-lg bg-gray-800 py-2 text-xs text-gray-400 hover:bg-gray-700 hover:text-white transition"
            >
              알림 전체 삭제
            </button>
          </div>
        )}
      </div>
    </>
  )
}