'use client'

import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function FormModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}: FormModalProps) {
  if (!isOpen) return null

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md'
      case 'md':
        return 'max-w-2xl'
      case 'lg':
        return 'max-w-4xl'
      case 'xl':
        return 'max-w-6xl'
      default:
        return 'max-w-2xl'
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`relative bg-white/95 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] w-full ${getSizeClass()} max-h-[90vh] flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300`}>
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{title}</h3>
            <div className="h-1 w-10 bg-blue-600 mt-2 rounded-full"></div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1 p-8 pt-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
