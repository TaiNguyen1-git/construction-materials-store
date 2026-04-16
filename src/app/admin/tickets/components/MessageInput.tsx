'use client'

import { AlertTriangle, X, Paperclip, Send } from 'lucide-react'
import { SupportTicket } from '../types'

interface MessageInputProps {
    selectedTicket: SupportTicket | null
    dismissGuestWarning: boolean
    setDismissGuestWarning: (val: boolean) => void
    isInternal: boolean
    setIsInternal: (val: boolean) => void
    attachments: any[]
    removeAttachment: (index: number) => void
    fileInputRef: React.RefObject<HTMLInputElement | null>
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    uploading: boolean
    newMessage: string
    setNewMessage: (val: string) => void
    sendMessage: () => void
    sending: boolean
}

export default function MessageInput({
    selectedTicket,
    dismissGuestWarning,
    setDismissGuestWarning,
    isInternal,
    setIsInternal,
    attachments,
    removeAttachment,
    fileInputRef,
    handleFileUpload,
    uploading,
    newMessage,
    setNewMessage,
    sendMessage,
    sending
}: MessageInputProps) {
    if (!selectedTicket) return null

    return (
        <div className="p-4 border-t border-slate-100 bg-white">
            {(!selectedTicket.customerId) && !dismissGuestWarning && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 relative group/warn">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="pr-6">
                        <p className="text-sm font-bold text-amber-800">Khách vãng lai đăng ký hỗ trợ!</p>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">Xin vui lòng gọi điện hoặc Zalo qua SĐT <strong>{selectedTicket.guestPhone}</strong> để xử lý. Khung dưới đây đã bị khóa thành chế độ <strong>"Chỉ Ghi Chú Nội Bộ"</strong>.</p>
                    </div>
                    <button 
                        onClick={() => setDismissGuestWarning(true)}
                        className="absolute top-2 right-2 p-1 hover:bg-amber-100 rounded-lg text-amber-400 hover:text-amber-600 transition-colors opacity-0 group-hover/warn:opacity-100"
                        title="Tắt thông báo này"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="flex items-center gap-2 mb-2">
                <label className={`flex items-center gap-2 text-xs ${(!selectedTicket.customerId) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                        type="checkbox"
                        checked={(!selectedTicket.customerId) ? true : isInternal}
                        onChange={(e) => { if (selectedTicket.customerId) setIsInternal(e.target.checked) }}
                        disabled={!selectedTicket.customerId}
                        className="w-4 h-4 rounded border-slate-300 disabled:bg-slate-200"
                    />
                    <span className="text-slate-600 font-medium">Ghi chú nội bộ (KH không thấy)</span>
                </label>
            </div>
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-slate-200 text-xs shadow-sm">
                            <span className="truncate max-w-[200px] font-medium text-slate-700">{att.fileName}</span>
                            <button type="button" onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex gap-2">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden" 
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                />
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={`p-2.5 hover:bg-slate-100 rounded-xl transition-colors ${uploading ? 'opacity-50 animate-pulse' : ''}`}
                >
                    <Paperclip className="w-5 h-5 text-slate-400" />
                </button>
                <input
                    type="text"
                    placeholder={((!selectedTicket.customerId) || isInternal) ? "Nhập ghi chú nội bộ..." : "Nhập tin nhắn phản hồi..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                    onClick={sendMessage}
                    disabled={sending || (!newMessage.trim() && attachments.length === 0) || uploading}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 ${((!selectedTicket.customerId) || isInternal)
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                >
                    <Send className="w-4 h-4" />
                    {sending ? 'Đang gửi...' : (((!selectedTicket.customerId) || isInternal) ? 'Thêm ghi chú' : 'Gửi')}
                </button>
            </div>
        </div>
    )
}
