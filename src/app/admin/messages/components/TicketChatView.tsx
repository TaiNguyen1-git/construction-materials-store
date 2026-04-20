'use client'

import { Ticket, User, Phone, Clock, Paperclip, X, Send, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import MessengerChatBubbles from '@/components/chat/MessengerChatBubbles'
import { SupportTicket, TicketMessage, StatusConfig } from '../types'

interface TicketChatViewProps {
    selectedTicket: SupportTicket | null
    ticketMessages: TicketMessage[]
    ticketNewMessage: string
    setTicketNewMessage: (msg: string) => void
    isInternal: boolean
    setIsInternal: (val: boolean) => void
    ticketAttachments: any[]
    setTicketAttachments: (val: any) => void
    ticketUploading: boolean
    dismissGuestWarning: boolean
    setDismissGuestWarning: (val: boolean) => void
    updateTicketStatus: (id: string, status: string) => void
    sendTicketMessage: () => void
    handleTicketFileUpload: (e: any) => void
    isSlaBreached: (ticket: SupportTicket) => boolean
    formatDate: (date: string) => string
    mapTicketsToChatMessages: (msgs: TicketMessage[]) => any[]
    statusConfig: Record<string, StatusConfig>
    categoryLabels: Record<string, string>
    ticketFileInputRef: any
}

export default function TicketChatView({
    selectedTicket,
    ticketMessages,
    ticketNewMessage,
    setTicketNewMessage,
    isInternal,
    setIsInternal,
    ticketAttachments,
    setTicketAttachments,
    ticketUploading,
    dismissGuestWarning,
    setDismissGuestWarning,
    updateTicketStatus,
    sendTicketMessage,
    handleTicketFileUpload,
    isSlaBreached,
    formatDate,
    mapTicketsToChatMessages,
    statusConfig,
    categoryLabels,
    ticketFileInputRef
}: TicketChatViewProps) {
    const router = useRouter()

    if (!selectedTicket) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Ticket className="w-10 h-10 text-indigo-300" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Quản lý Ticket</h3>
                <p className="text-gray-500 max-w-sm text-xs font-medium leading-relaxed">
                    Chọn một ticket từ danh sách bên trái để xem chi tiết và phản hồi khách hàng.
                </p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col bg-white">
            {/* Ticket detail header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-lg font-black text-slate-900">{selectedTicket.ticketNumber}</h2>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusConfig[selectedTicket.status]?.color}`}>
                                {statusConfig[selectedTicket.status]?.label}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600">{selectedTicket.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {selectedTicket.orderId && (
                            <button onClick={() => router.push(`/admin/orders/${selectedTicket.orderId}`)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100">
                                <ArrowUpRight className="w-3 h-3" /> Xem đơn hàng
                            </button>
                        )}
                        <select value={selectedTicket.status}
                            onChange={e => updateTicketStatus(selectedTicket.id, e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold">
                            {Object.entries(statusConfig).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {selectedTicket.guestName || 'Khách hàng đăng ký'}
                    </div>
                    {selectedTicket.guestPhone && (
                        <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-indigo-500" />
                            <span className="font-bold text-slate-700">{selectedTicket.guestPhone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        {categoryLabels[selectedTicket.category] || selectedTicket.category}
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(selectedTicket.createdAt)}
                    </div>
                    {isSlaBreached(selectedTicket) && (
                        <span className="text-red-600 font-bold">⚠️ Vi phạm SLA</span>
                    )}
                </div>
            </div>

            {/* Ticket chat messages */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30">
                <MessengerChatBubbles
                    messages={mapTicketsToChatMessages(ticketMessages)}
                    themeColor="indigo"
                    showSenderNames={true}
                    autoScroll={true}
                />
            </div>

            {/* Ticket message input */}
            <div className="p-4 border-t border-slate-100 bg-white">
                {!selectedTicket.customerId && !dismissGuestWarning && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 relative group/warn">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="pr-6">
                            <p className="text-sm font-bold text-amber-800">Khách vãng lai đăng ký hỗ trợ!</p>
                            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                Gọi điện qua SĐT <strong>{selectedTicket.guestPhone}</strong>. Khung dưới đây ở chế độ <strong>"Ghi Chú Nội Bộ"</strong>.
                            </p>
                        </div>
                        <button onClick={() => setDismissGuestWarning(true)}
                            className="absolute top-2 right-2 p-1 hover:bg-amber-100 rounded-lg text-amber-400 hover:text-amber-600 transition-colors opacity-0 group-hover/warn:opacity-100">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                    <label className={`flex items-center gap-2 text-xs ${!selectedTicket.customerId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input type="checkbox"
                            checked={!selectedTicket.customerId ? true : isInternal}
                            onChange={e => { if (selectedTicket.customerId) setIsInternal(e.target.checked) }}
                            disabled={!selectedTicket.customerId}
                            className="w-4 h-4 rounded border-slate-300 disabled:bg-slate-200" />
                        <span className="text-slate-600 font-medium">Ghi chú nội bộ (KH không thấy)</span>
                    </label>
                </div>
                {ticketAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {ticketAttachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-slate-200 text-xs shadow-sm">
                                <span className="truncate max-w-[200px] font-medium text-slate-700">{att.fileName}</span>
                                <button type="button" onClick={() => setTicketAttachments((prev: any[]) => prev.filter((_, idx) => idx !== i))}
                                    className="text-slate-400 hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <input type="file" ref={ticketFileInputRef} onChange={handleTicketFileUpload}
                        className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" />
                    <button type="button" onClick={() => ticketFileInputRef.current?.click()} disabled={ticketUploading}
                        className={`p-2.5 hover:bg-slate-100 rounded-xl transition-colors ${ticketUploading ? 'opacity-50 animate-pulse' : ''}`}>
                        <Paperclip className="w-5 h-5 text-slate-400" />
                    </button>
                    <input type="text"
                        placeholder={(!selectedTicket.customerId || isInternal) ? 'Nhập ghi chú nội bộ...' : 'Nhập tin nhắn phản hồi...'}
                        value={ticketNewMessage} onChange={e => setTicketNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendTicketMessage()}
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    <button onClick={sendTicketMessage}
                        disabled={(!ticketNewMessage.trim() && ticketAttachments.length === 0) || ticketUploading}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 ${(!selectedTicket.customerId || isInternal)
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                        <Send className="w-4 h-4" />
                        {(!selectedTicket.customerId || isInternal) ? 'Thêm ghi chú' : 'Gửi'}
                    </button>
                </div>
            </div>
        </div>
    )
}
