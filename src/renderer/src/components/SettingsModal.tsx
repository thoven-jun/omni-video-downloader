import { useState, useEffect } from 'react'
import { X, FolderInput, Check, RotateCcw, Bell, Download } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSettingsChanged: (newSettings: any) => void // 설정 변경 시 부모에게 알림
}

export function SettingsModal({ isOpen, onClose, onSettingsChanged }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'download'>('general');
  
  // 설정 상태 관리
  const [settings, setSettings] = useState({
    general: { notifications: true },
    download: { defaultPath: '', defaultQuality: 'best', askLocation: false }
  });

  // 모달 열릴 때 최신 설정 불러오기
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const loaded = await window.api.getSettings();
    setSettings(loaded);
  };

  const handleSave = async () => {
    await window.api.setSettings(settings);
    onSettingsChanged(settings); // 앱에 즉시 반영
    onClose();
  };

  const handleReset = async () => {
    if (confirm('모든 설정을 초기화하시겠습니까?')) {
      const reset = await window.api.resetSettings();
      setSettings(reset);
    }
  };

  // 폴더 선택 핸들러
  const handleSelectPath = async () => {
    const path = await window.api.selectFolder();
    if (path) {
      setSettings(prev => ({
        ...prev,
        download: { ...prev.download, defaultPath: path }
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-[500px] overflow-hidden rounded-2xl bg-gray-800 shadow-2xl ring-1 ring-gray-700">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between bg-gray-900 px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">설정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* 바디 */}
        <div className="flex h-[320px]">
          {/* 사이드 탭 */}
          <div className="w-36 bg-gray-850 border-r border-gray-700 py-4 flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-gray-700 text-blue-400 border-l-4 border-blue-400' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white border-l-4 border-transparent'}`}
            >
              <Bell size={16} /> 일반
            </button>
            <button 
              onClick={() => setActiveTab('download')}
              className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'download' ? 'bg-gray-700 text-blue-400 border-l-4 border-blue-400' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white border-l-4 border-transparent'}`}
            >
              <Download size={16} /> 다운로드
            </button>
          </div>

          {/* 컨텐츠 영역 */}
          <div className="flex-1 p-6 overflow-y-auto">
            
            {/* [탭 1] 일반 설정 */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-gray-500">알림</h3>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-gray-300 group-hover:text-white">다운로드 완료 알림 받기</span>
                    <input 
                      type="checkbox" 
                      checked={settings.general.notifications}
                      onChange={(e) => setSettings({...settings, general: {...settings.general, notifications: e.target.checked}})}
                      className="accent-blue-600 w-4 h-4" 
                    />
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-700 space-y-3">
                  <h3 className="text-xs font-bold uppercase text-gray-500">초기화</h3>
                  <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-xs font-bold text-gray-300 hover:bg-red-600 hover:text-white transition w-full justify-center"
                  >
                    <RotateCcw size={14} /> 모든 설정 초기화
                  </button>
                </div>
              </div>
            )}

            {/* [탭 2] 다운로드 설정 */}
            {activeTab === 'download' && (
              <div className="space-y-6">
                {/* 기본 경로 */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase text-gray-500">기본 저장 위치</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 truncate rounded bg-gray-900 px-3 py-2 text-xs text-gray-300 ring-1 ring-gray-700" title={settings.download.defaultPath || '기본 다운로드 폴더'}>
                      {settings.download.defaultPath || '기본 다운로드 폴더'}
                    </div>
                    <button onClick={handleSelectPath} className="shrink-0 flex items-center gap-1 rounded bg-gray-700 px-3 py-2 text-xs font-bold text-gray-300 hover:bg-gray-600 hover:text-white transition">
                      <FolderInput size={14} /> 변경
                    </button>
                  </div>

                  {/* [추가됨] 저장 위치 매번 묻기 체크박스 */}
                  <label className="flex items-center gap-2 cursor-pointer group pt-1">
                    <input 
                      type="checkbox"
                      checked={settings.download.askLocation}
                      onChange={(e) => setSettings({...settings, download: {...settings.download, askLocation: e.target.checked}})}
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    <span className="text-xs text-gray-400 group-hover:text-gray-300">다운로드 시 저장 위치 매번 확인</span>
                  </label>
                </div>

                {/* 기본 화질 */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase text-gray-500">기본 화질</h3>
                  <select 
                    value={settings.download.defaultQuality}
                    onChange={(e) => setSettings({...settings, download: {...settings.download, defaultQuality: e.target.value}})}
                    className="w-full appearance-none rounded bg-gray-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-gray-700 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="best">최고 화질 (권장)</option>
                    <option value="2160">2160p (4K)</option>
                    <option value="1080">1080p (FHD)</option>
                    <option value="720">720p (HD)</option>
                  </select>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 bg-gray-900 px-6 py-4 border-t border-gray-700">
          <button 
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-bold text-gray-400 hover:bg-gray-800 hover:text-white transition"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg"
          >
            <Check size={14} /> 저장하기
          </button>
        </div>
      </div>
    </div>
  )
}