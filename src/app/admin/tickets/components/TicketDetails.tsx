'use client'

import {
    ArrowUpRight,
    User,
    Phone,
    Ticket,
    Clock,
    MessageCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SupportTicket, TicketMessage, StatusConfig } from '../types'
import MessengerChatBubbles, { ChatMessage } from '@/components/chat/MessengerChatBubbles'

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

function mapToChat(messages: TicketMessage[]): ChatMessage[] {
    return messages.map((msg, i) => {
        const isMe = msg.senderType === 'STAFF'
        const isSystem = msg.senderType === 'SYSTEM'
        const isSending = msg.id.startsWith('temp-')

        const attachments = (msg.attachments || []).map((att: any) => {
            if (typeof att === 'string') return { fileName: 'Đính kèm', fileUrl: att, fileType: '' }
            return { fileName: att.fileName || 'Đính kèm', fileUrl: att.fileUrl || att.url || '', fileType: att.fileType || '' }
        })

        return {
            id: msg.id,
            content: msg.content,
            senderType: isSystem ? 'system' : isMe ? 'me' : 'other',
            senderName: msg.senderName || (isMe ? 'Nhân viên' : 'Khách hàng'),
            createdAt: msg.createdAt,
            status: isSending ? 'sending' : 'sent',
            attachments,
            isInternal: msg.isInternal,
            internalLabel: 'Ghi chú nội bộ',
        }
    })
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

    const chatMessages = mapToChat(messages)

    return (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            {/* Detail Header */}
            <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
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

            {/* Messages — Messenger-quality */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30">
                <MessengerChatBubbles
                    messages={chatMessages}
                    themeColor="indigo"
                    showSenderNames={true}
                    autoScroll={true}
                />
            </div>
        </div>
    )
}
