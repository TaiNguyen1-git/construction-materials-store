'use client'

import { AlertCircle, CheckCircle, Info } from 'lucide-react'

interface ChatConfirmDialogProps {
  type: 'warning' | 'info' | 'success'
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ChatConfirmDialog({
  type = 'info',
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel
}: ChatConfirmDialogProps) {
  const icons = {
    warning: <AlertCircle className="w-6 h-6 text-yellow-600" />,
    info: <Info className="w-6 h-6 text-blue-600" />,
    success: <CheckCircle className="w-6 h-6 text-green-600" />
  }
  
  const colors = {
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200'
  }
  
  const buttonColors = {
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700'
  }
  
  return (
    <div className={`rounded-lg border-2 p-4 ${colors[type]}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {icons[type]}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${buttonColors[type]}`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  )
}
