import { Loader2, GripHorizontal } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface FloatingStatusProps {
  isDownloading: boolean
  title: string
  progress: number
  total: number
  current: number
  isDrawerOpen?: boolean
}

export function FloatingStatus({ isDownloading, title, progress, total, current, isDrawerOpen }: FloatingStatusProps) {
  // 드래그 관련 상태
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false); // 사용자가 이동시켰는지 여부
  
  const dragRef = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });

  // 다운로드 시작 시 위치 초기화가 필요하면 아래 주석 해제 (현재는 위치 기억)
  // useEffect(() => { if (!isDownloading) setHasMoved(false); }, [isDownloading]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      // 처음 드래그 시 현재 계산된 위치(bottom 기준)를 절대 좌표(top/left)로 변환하여 시작
      if (!hasMoved) {
        setPosition({ x: rect.left, y: rect.top });
      }
      
      setIsDragging(true);
      setHasMoved(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - offset.current.x;
        const newY = e.clientY - offset.current.y;
        
        // 화면 밖으로 나가지 않게 제한
        const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 0);
        const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 0);
        
        setPosition({
          x: Math.min(Math.max(0, newX), maxX),
          y: Math.min(Math.max(0, newY), maxY)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isDownloading) return null;

  // 사용자가 옮겼으면(hasMoved) 절대 좌표, 아니면 기존 자동 위치(bottom)
  const style = hasMoved 
    ? { left: `${position.x}px`, top: `${position.y}px`, transform: 'none', bottom: 'auto' } 
    : {};

  const className = hasMoved
    ? "fixed z-50 w-[90%] max-w-2xl cursor-move" // 드래그 중엔 transition 제거
    : `fixed left-1/2 z-50 w-[90%] max-w-2xl -translate-x-1/2 transform transition-all duration-500 ease-out ${isDrawerOpen ? 'bottom-[340px]' : 'bottom-14'}`;

  return (
    <div 
      ref={dragRef}
      onMouseDown={handleMouseDown}
      className={className}
      style={style}
    >
      <div className={`rounded-xl bg-gray-800/90 p-4 shadow-2xl backdrop-blur-md ring-1 ${isDragging ? 'ring-blue-400' : 'ring-blue-500/30'} transition-shadow`}>
        {/* 드래그 핸들 (상단 중앙) */}
        <div className="flex justify-center -mt-2 mb-1 opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing">
           <GripHorizontal size={16} className="text-gray-500" />
        </div>

        <div className="flex items-center justify-between mb-2 select-none">
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