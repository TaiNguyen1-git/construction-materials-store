'use client'

import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'danger',
  loading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const getTypeStyle = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-8 h-8 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-100',
          button: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-500/20'
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-100',
          button: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20'
        }
      case 'info':
        return {
          icon: <Info className="w-8 h-8 text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-100',
          button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'
        }
    }
  }

  const styles = getTypeStyle()

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-white rounded-[32px] shadow-[0_32px_80px_rgba(0,0,0,0.15)] max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${styles.bgColor}`}>
              {styles.icon}
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-all active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-slate-600 font-medium leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 bg-slate-50/50 border-t border-slate-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 ${styles.button}`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
