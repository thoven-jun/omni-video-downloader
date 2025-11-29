import { Youtube, Instagram, Download, Music, Video, FolderInput, CheckSquare, Square, Image as ImageIcon, FileText, ListPlus, Globe } from 'lucide-react'
import { useState, useEffect } from 'react'

interface MediaCardProps {
  data: {
    title: string
    thumbnail: string
    duration: string
    platform: string
    isVertical: boolean
    resolutions: number[] 
  }
  onDownload: (options: { type: 'video' | 'audio' | 'thumbnail' | 'subtitle'; quality: string; audioFormat: string; includeThumbnail?: boolean; includeSubtitle?: boolean; subLanguage?: string }) => void
  onAddToQueue: (options: { type: 'video' | 'audio' | 'thumbnail' | 'subtitle'; quality: string; audioFormat: string; includeThumbnail?: boolean; includeSubtitle?: boolean; subLanguage?: string }) => void
  downloadPath: string
  onChangePath: () => void
}

export function MediaCard({ data, onDownload, onAddToQueue, downloadPath, onChangePath }: MediaCardProps) {
  const isVertical = data.isVertical;
  
  // [신규] 콘텐츠 타입 상태 (video | audio)
  const [contentType, setContentType] = useState<'video' | 'audio'>('video');

  const [videoQuality, setVideoQuality] = useState('best');
  const [audioFormat, setAudioFormat] = useState('mp3');

  const [includeThumbnail, setIncludeThumbnail] = useState(false)
  const [includeSubtitle, setIncludeSubtitle] = useState(false)
  const [subLanguage, setSubLanguage] = useState('ko');

  // 데이터 변경 시 초기화
  useEffect(() => {
    setContentType('video');
    setVideoQuality('best');
    setIncludeThumbnail(false);
    setIncludeSubtitle(false);
    setSubLanguage('ko');
  }, [data]);

  const getIcon = () => {
    const platform = data.platform.toLowerCase();
    if (platform.includes('youtube')) return <Youtube className="text-red-500" />;
    if (platform.includes('instagram')) return <Instagram className="text-pink-500" />;
    if (platform.includes('tiktok')) return <span className="font-bold text-black dark:text-white">TikTok</span>;
    return <Video className="text-blue-400" />;
  }

  // [수정] 통합된 액션 핸들러 (현재 선택된 contentType을 기반으로 동작)
  const handleMainAction = (action: 'download' | 'queue') => {
    const options = {
        type: contentType, // 현재 탭(video/audio)에 따라 결정
        quality: contentType === 'video' ? videoQuality : 'best',
        audioFormat: audioFormat,
        includeThumbnail,
        includeSubtitle,
        subLanguage
    };

    if (action === 'download') {
        onDownload(options);
    } else {
        onAddToQueue(options);
    }
  };

  // 서브 액션 (썸네일/자막 단독)
  const handleSubAction = (type: 'thumbnail' | 'subtitle') => {
     // 단독 다운로드는 즉시 실행으로 처리 (대기열보다는 다운로드가 자연스러움)
     onDownload({
        type,
        quality: 'best',
        audioFormat: 'mp3',
        includeThumbnail: false,
        includeSubtitle: false,
        subLanguage
     });
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
          {/* 저장 위치 */}
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

          {/* [UI 개선] 콘텐츠 타입 선택 탭 */}
          <div className="flex rounded-lg bg-gray-900 p-1 ring-1 ring-gray-700">
            <button 
                onClick={() => setContentType('video')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-bold transition-all ${contentType === 'video' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <Video size={16} /> 비디오 다운로드
            </button>
            <button 
                onClick={() => setContentType('audio')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-bold transition-all ${contentType === 'audio' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <Music size={16} /> 오디오 추출
            </button>
          </div>

          {/* 옵션 선택 영역 (탭에 따라 변경) */}
          <div className="flex flex-col gap-4">
            {contentType === 'video' ? (
                // 비디오 옵션
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-500 ml-1">영상 화질 선택</label>
                    <select 
                        value={videoQuality}
                        onChange={(e) => setVideoQuality(e.target.value)}
                        className="w-full appearance-none rounded-lg bg-gray-700 px-4 py-3 text-sm font-medium text-white shadow-sm outline-none ring-1 ring-gray-600 transition-all focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 hover:bg-gray-600 cursor-pointer"
                    >
                        <option value="best">최고 화질 (원본)</option>
                        {data.resolutions && data.resolutions.length > 0 ? (
                        data.resolutions.map((res) => (
                            <option key={res} value={res}>{res}p</option>
                        ))
                        ) : (
                        <><option value="2160">2160p (4K)</option><option value="1440">1440p (QHD)</option><option value="1080">1080p (FHD)</option><option value="720">720p (HD)</option></>
                        )}
                    </select>
                </div>
            ) : (
                // 오디오 옵션
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-500 ml-1">오디오 포맷 선택</label>
                    <select 
                        value={audioFormat}
                        onChange={(e) => setAudioFormat(e.target.value)}
                        className="w-full appearance-none rounded-lg bg-gray-700 px-4 py-3 text-sm font-medium text-white shadow-sm outline-none ring-1 ring-gray-600 transition-all focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 hover:bg-gray-600 cursor-pointer"
                    >
                        <option value="mp3">MP3 (일반 호환성)</option>
                        <option value="m4a">M4A (애플 기기 최적화)</option>
                        <option value="wav">WAV (무손실 원음)</option>
                    </select>
                </div>
            )}

            {/* 체크박스 옵션 및 언어 선택 */}
            <div className="flex flex-wrap gap-4 px-1 pt-1 items-center">
                <button onClick={() => setIncludeThumbnail(!includeThumbnail)} className="flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white transition">
                    {includeThumbnail ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>} 썸네일 이미지 포함
                </button>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIncludeSubtitle(!includeSubtitle)} className="flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white transition">
                        {includeSubtitle ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>} 자막/대본 포함
                    </button>
                    {/* [수정 3번] 언어 선택 드롭다운 */}
                    <div className="flex items-center gap-1.5 bg-gray-900/50 px-2 py-1 rounded border border-gray-700">
                        <Globe size={12} className="text-gray-500" />
                        <select value={subLanguage} onChange={(e) => setSubLanguage(e.target.value)} className="bg-transparent text-xs text-gray-300 outline-none font-bold cursor-pointer w-20">
                            <option value="ko">한국어</option>
                            <option value="en">English</option>
                            <option value="ja">日本語</option>
                            <option value="zh">中文</option>
                            <option value="es">Español</option>
                            <option value="all">전체 (All)</option>
                        </select>
                    </div>
                </div>
            </div>
          </div>

          {/* 메인 액션 버튼 (통합됨) */}
          <div className="flex gap-3 pt-2">
            <button 
                onClick={() => handleMainAction('queue')} 
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-700 py-3.5 text-sm font-bold text-white transition hover:bg-gray-600 active:scale-95"
            >
                <ListPlus size={18} /> 대기열 추가
            </button>
            <button 
                onClick={() => handleMainAction('download')} 
                className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 active:scale-95"
            >
                <Download size={18} /> {contentType === 'video' ? '비디오 다운로드' : '오디오 다운로드'}
            </button>
          </div>

          {/* 서브 액션 (썸네일/자막 단독) - 하단에 작게 배치 */}
          <div className="flex gap-3 justify-end border-t border-gray-700/50 pt-4">
             <span className="mr-auto text-[14px] font-semibold text-gray-500 flex items-center">단독 추출:</span>
             <button onClick={() => handleSubAction('thumbnail')} className="flex items-center gap-1.5 rounded bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-gray-700 hover:text-white transition border border-gray-700">
              <ImageIcon size={12} /> 썸네일만
            </button>
             <button onClick={() => handleSubAction('subtitle')} className="flex items-center gap-1.5 rounded bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-gray-700 hover:text-white transition border border-gray-700">
              <FileText size={12} /> 자막만
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}