import { Search, Loader2, Link } from 'lucide-react'
import { useState } from 'react'

interface InputAreaProps {
  onAnalyze: (url: string) => void
  isLoading: boolean
}

export function InputArea({ onAnalyze, isLoading }: InputAreaProps) {
  const [inputUrl, setInputUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputUrl.trim()) {
      onAnalyze(inputUrl)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-gray-400">
          <Link size={20} />
        </div>
        
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="YouTube, Instagram, TikTok 링크를 붙여넣으세요"
          className="w-full rounded-xl bg-gray-800 py-4 pl-12 pr-32 text-white placeholder-gray-500 shadow-lg outline-none ring-1 ring-gray-700 transition-all focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading || !inputUrl}
          className="absolute right-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              <span>분석 중</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Search size={18} />
              <span>확인</span>
            </div>
          )}
        </button>
      </div>
    </form>
  )
}