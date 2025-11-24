// src/renderer/src/components/FloatingStatus.tsx

import { Loader2 } from 'lucide-react'

interface FloatingStatusProps {
  isDownloading: boolean
  title: string
  progress: number
  total: number
  current: number
}

export function FloatingStatus({ isDownloading, title, progress, total, current }: FloatingStatusProps) {
  if (!isDownloading) return null;

  return (
    <div className="fixed bottom-14 left-1/2 z-20 w-[90%] max-w-2xl -translate-x-1/2 transform animate-slide-in-up">
      <div className="rounded-xl bg-gray-800/90 p-4 shadow-2xl backdrop-blur-md ring-1 ring-blue-500/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-blue-400">다운로드 중... ({current}/{total})</span>
              <span className="truncate text-xs text-gray-300 max-w-[300px]">{title}</span>
            </div>
          </div>
          <span className="text-sm font-bold text-white shrink-0">{progress.toFixed(1)}%</span>
        </div>
        
        {/* 진행률 바 */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </div>
  )
}