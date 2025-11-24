import { useState, useEffect } from 'react'
import { Youtube, Instagram, Download, Music, Video, Library, FolderInput } from 'lucide-react'

interface MediaCardProps {
  data: {
    title: string
    thumbnail: string
    duration: string
    platform: string
    isVertical: boolean
    resolutions: number[] // [수정] 단일 문자열 대신 숫자 배열 받음
  }
  onDownload: (options: { type: 'video' | 'audio'; quality: string; audioFormat: string }) => void
  onAddToQueue: (options: { type: 'video' | 'audio'; quality: string; audioFormat: string }) => void
  downloadPath: string
  onChangePath: () => void
}

export function MediaCard({ data, onDownload, onAddToQueue, downloadPath, onChangePath }: MediaCardProps) {
  const isVertical = data.isVertical;
  
  const [videoQuality, setVideoQuality] = useState('best');
  const [audioFormat, setAudioFormat] = useState('mp3');

  // [신규] 데이터가 바뀌면 화질 기본값을 'best'로 초기화
  useEffect(() => {
    setVideoQuality('best');
  }, [data]);

  const getIcon = () => {
    const platform = data.platform.toLowerCase();
    if (platform.includes('youtube')) return <Youtube className="text-red-500" />;
    if (platform.includes('instagram')) return <Instagram className="text-pink-500" />;
    if (platform.includes('tiktok')) return <span className="font-bold text-black dark:text-white">TikTok</span>;
    return <Video className="text-blue-400" />;
  }

  return (
    <div className={`mt-4 flex gap-8 overflow-hidden rounded-2xl bg-gray-800 p-6 shadow-2xl ring-1 ring-gray-700 transition-all ${isVertical ? 'flex-row' : 'flex-col md:flex-row'}`}>
      
      {/* 썸네일 */}
      <div className={`relative shrink-0 overflow-hidden rounded-xl bg-black shadow-lg self-center ${isVertical ? 'w-[180px] aspect-[9/16]' : 'w-full md:w-[480px] aspect-video'}`}>
        <img src={data.thumbnail} alt={data.title} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        <div className="absolute bottom-3 right-3 rounded bg-black/80 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
          {data.duration}
        </div>
      </div>

      {/* 정보 및 옵션 */}
      <div className="flex flex-1 flex-col justify-center gap-6 py-2 min-w-0">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
            {getIcon()}
            <span>{data.platform}</span>
          </div>
          <h3 className="text-xl font-bold leading-snug text-white line-clamp-2" title={data.title}>
            {data.title}
          </h3>
        </div>

        <div className="space-y-5">
          <div className="flex w-full items-center gap-3 rounded-lg bg-gray-900/50 px-4 py-3 ring-1 ring-gray-700/50">
            <span className="text-xs text-gray-500 shrink-0">저장 위치:</span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs text-gray-300" title={downloadPath || '기본 다운로드 폴더'}>
                {downloadPath || '기본 다운로드 폴더'}
              </p>
            </div>
            <button onClick={onChangePath} className="shrink-0 flex items-center gap-1 rounded bg-gray-700 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-600 hover:text-white transition">
              <FolderInput size={12} /> 변경
            </button>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-300">
            <div className="flex flex-col gap-1.5 w-36">
              <label className="text-xs text-gray-500 ml-1">영상 화질</label>
              <select 
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value)}
                className="w-full appearance-none rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm outline-none ring-1 ring-gray-600 transition-all focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 hover:bg-gray-600 cursor-pointer"
              >
                <option value="best">최고 화질 (원본)</option>
                
                {/* [수정] resolutions가 없거나 비어있을 때를 대비한 안전장치 */}
                {data.resolutions && data.resolutions.length > 0 ? (
                  data.resolutions.map((res) => (
                    <option key={res} value={res}>{res}p</option>
                  ))
                ) : (
                  /* 데이터가 없을 경우 기본 옵션 노출 */
                  <>
                    <option value="2160">2160p (4K)</option>
                    <option value="1440">1440p (QHD)</option>
                    <option value="1080">1080p (FHD)</option>
                    <option value="720">720p (HD)</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 w-36">
              <label className="text-xs text-gray-500 ml-1">오디오 포맷</label>
              <select 
                value={audioFormat}
                onChange={(e) => setAudioFormat(e.target.value)}
                className="w-full appearance-none rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm outline-none ring-1 ring-gray-600 transition-all focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 hover:bg-gray-600 cursor-pointer"
              >
                <option value="mp3">MP3</option>
                <option value="m4a">M4A</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex w-full gap-2">
                <button onClick={() => onDownload({ type: 'video', quality: videoQuality, audioFormat })} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-500 active:scale-95 shadow-lg transition-all">
                  <Download size={18} /> {isVertical ? '원본 바로 저장' : '비디오 바로 저장'}
                </button>
                <button onClick={() => onAddToQueue({ type: 'video', quality: videoQuality, audioFormat })} className="flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-5 py-3.5 text-sm font-bold text-gray-300 hover:bg-gray-600 hover:text-white active:scale-95 transition-all" title="대기열에 추가">
                  <Library size={20} /> +
                </button>
            </div>
            
            <div className="flex w-full gap-2">
                 <button onClick={() => onDownload({ type: 'audio', quality: 'best', audioFormat })} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-600 bg-transparent py-2.5 text-sm font-bold text-gray-300 hover:bg-gray-700 active:scale-95 transition-all">
                  <Music size={16} /> 오디오 저장
                </button>
                 <button onClick={() => onAddToQueue({ type: 'audio', quality: 'best', audioFormat })} className="flex items-center justify-center gap-2 rounded-lg border border-gray-600 bg-transparent px-5 py-2.5 text-sm font-bold text-gray-300 hover:bg-gray-700 active:scale-95 transition-all" title="대기열에 추가">
                  <Library size={18} /> +
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}