'use client'

import React from 'react'
import { Facebook, Share2, Link as LinkIcon, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface SocialShareBarProps {
  title: string
  url?: string
}

const SocialShareBar: React.FC<SocialShareBarProps> = ({ title, url }) => {
  const currentUrl = typeof window !== 'undefined' ? (url || window.location.href) : ''

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl)
    toast.success('Đã sao chép liên kết!')
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank')
  }

  const shareZalo = () => {
    window.open(`https://sp.zalo.me/share/base?url=${encodeURIComponent(currentUrl)}`, '_blank')
  }

  return (
    <div className="flex flex-wrap items-center gap-3 py-6 border-t border-slate-100 mt-8">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-full md:w-auto mb-2 md:mb-0">
        Chia sẻ ngay:
      </span>
      
      <button 
        onClick={shareFacebook}
        className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-xl text-xs font-bold hover:shadow-lg hover:scale-105 transition-all"
      >
        <Facebook size={14} fill="white" />
        Facebook
      </button>

      <button 
        onClick={shareZalo}
        className="flex items-center gap-2 px-4 py-2 bg-[#0068FF] text-white rounded-xl text-xs font-bold hover:shadow-lg hover:scale-105 transition-all"
      >
        <MessageCircle size={14} fill="white" />
        Zalo
      </button>

      <button 
        onClick={handleCopyLink}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
      >
        <LinkIcon size={14} />
        Sao chép link
      </button>

      <button 
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all ml-auto"
        onClick={() => {
          if (navigator.share) {
            navigator.share({ title, url: currentUrl }).catch(() => {})
          }
        }}
      >
        <Share2 size={14} />
        Khác
      </button>
    </div>
  )
}

export default SocialShareBar
