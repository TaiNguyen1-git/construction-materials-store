'use client'

import { 
    MessageCircle, 
    ArrowUpRight, 
    User, 
    Phone, 
    Ticket, 
    Clock, 
    Paperclip 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SupportTicket, TicketMessage, StatusConfig } from '../types'

interface TicketDetailsProps {
    selectedTicket: SupportTicket | null
    messages: TicketMessage[]
    statusConfig: Record<string, StatusConfig>
    categoryLabels: Record<string, string>
    formatDate: (date: string) => string
    isSlaBreached: (ticket: SupportTicket) => boolean
    updateTicketStatus: (ticketId: string, status: string) => void
    messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export default function TicketDetails({
    selectedTicket,
    messages,
    statusConfig,
    categoryLabels,
    formatDate,
    isSlaBreached,
    updateTicketStatus,
    messagesEndRef
}: TicketDetailsProps) {
    const router = useRouter()

    if (!selectedTicket) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Chọn một ticket để xem chi tiết</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            {/* Detail Header */}
            <div className="p-4 border-b border-slate-100">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-lg font-black text-slate-900">{selectedTicket.ticketNumber}</h2>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusConfig[selectedTicket.status]?.color}`}>
                                {statusConfig[selectedTicket.status]?.label}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600">{selectedTicket.subject}</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                        {selectedTicket.orderId && (
                            <button
                                onClick={() => router.push(`/admin/orders/${selectedTicket.orderId}`)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                            >
                                <ArrowUpRight className="w-3 h-3" />
                                Xem đơn hàng
                            </button>
                        )}
                        <select
                            value={selectedTicket.status}
                            onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        >
                            {Object.entries(statusConfig).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Meta Info */}
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.senderType === 'STAFF' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[70%] ${msg.isInternal
                            ? 'bg-amber-50 border-2 border-dashed border-amber-200'
                            : msg.senderType === 'STAFF'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-200'
                            } rounded-2xl p-4`}>
                            {msg.isInternal && (
                                <div className="text-[10px] uppercase tracking-wider font-bold text-amber-600 mb-1">
                                    🔒 Ghi chú nội bộ
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold ${msg.senderType === 'STAFF' && !msg.isInternal ? 'text-indigo-100' : 'text-slate-500'}`}>
                                    {msg.senderName || (msg.senderType === 'STAFF' ? 'Nhân viên' : 'Khách')}
                                </span>
                                <span className={`text-[10px] ${msg.senderType === 'STAFF' && !msg.isInternal ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {formatDate(msg.createdAt)}
                                </span>
                            </div>
                            <p className={`text-sm whitespace-pre-wrap ${msg.senderType === 'STAFF' && !msg.isInternal ? 'text-white' : 'text-slate-700'}`}>
                                {msg.content}
                            </p>
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {msg.attachments.map((att: any, i: number) => (
                                        <a 
                                            key={i} 
                                            href={typeof att === 'string' ? att : att.fileUrl || att.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${msg.senderType === 'STAFF' && !msg.isInternal ? 'bg-indigo-700 hover:bg-indigo-800 text-indigo-50' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                        >
                                            <Paperclip className="w-3.5 h-3.5" />
                                            <span className="truncate max-w-[150px]">{typeof att === 'string' ? 'Đính kèm' : att.fileName || 'Tệp'}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}
