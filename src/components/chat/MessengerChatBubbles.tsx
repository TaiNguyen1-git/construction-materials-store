'use client'

import { useState, useRef } from 'react'
import { ChatMessage, ChatThemeColor } from './types'
export type { ChatMessage, ChatThemeColor }
import ChatBubble from './ChatBubble'
import ChatTyping from './ChatTyping'
import ChatConfirmModal from './ChatConfirmModal'

interface Props {
    messages: ChatMessage[]
    themeColor?: ChatThemeColor
    showSenderNames?: boolean
    autoScroll?: boolean
    onImageClick?: (url: string) => void
    onFileClick?: (att: { fileName: string; fileUrl: string; fileType: string }) => void
    onReply?: (msg: ChatMessage) => void
    onUnsend?: (msgId: string) => void
    onRemove?: (msgId: string) => void
    isTyping?: boolean
    typingPartnerName?: string
}

function formatRelativeTime(dateStr: string) {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatDateGroup(dateStr: string) {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Hôm nay'
    if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua'
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })
}

function formatFullTime(dateStr: string) {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function MessengerChatBubbles({
    messages,
    themeColor = 'indigo',
    showSenderNames = true,
    onImageClick,
    onFileClick,
    onReply,
    onUnsend,
    onRemove,
    isTyping = false,
    typingPartnerName
}: Props) {
    const endRef = useRef<HTMLDivElement>(null)
    const [confirmAction, setConfirmAction] = useState<{ id: string, type: 'unsend' | 'remove' } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null)

    // Group messages by date
    const groups: { date: string; msgs: (ChatMessage & { isFirst: boolean; isLast: boolean })[] }[] = []
    let lastDate = ''

    messages.forEach((msg, i) => {
        const d = new Date(msg.createdAt)
        const dateKey = isNaN(d.getTime()) ? 'sending' : d.toDateString()
        const prev = messages[i - 1]
        const next = messages[i + 1]
        const isFirst = !prev || prev.senderType !== msg.senderType || prev.isInternal !== msg.isInternal
        const isLast = !next || next.senderType !== msg.senderType || next.isInternal !== msg.isInternal

        if (dateKey !== lastDate) {
            lastDate = dateKey
            groups.push({ date: dateKey, msgs: [] })
        }
        groups[groups.length - 1].msgs.push({ ...msg, isFirst, isLast })
    })

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400 py-12">
                <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium">Chưa có tin nhắn</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-1 py-4 px-4 w-full">
            {groups.map((group) => (
                <div key={group.date}>
                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap px-2">
                            {group.date === 'sending' ? '' : formatDateGroup(group.msgs[0].createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    {group.msgs.map((msg) => {
                        if (msg.senderType === 'system') {
                            return (
                                <div key={msg.id} className="flex justify-center my-2 w-full">
                                    <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-medium">{msg.content}</span>
                                </div>
                            )
                        }

                        if (msg.isInternal) {
                            return (
                                <div key={msg.id} className="flex justify-end w-full my-1">
                                    <div className="max-w-[80%] bg-amber-50 border border-dashed border-amber-300 rounded-2xl px-4 py-2.5">
                                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1">🔒 {msg.internalLabel || 'Ghi chú nội bộ'}</div>
                                        {showSenderNames && msg.senderName && <span className="text-[10px] font-bold text-amber-700 block mb-1">{msg.senderName}</span>}
                                        <p className="text-sm text-amber-900 whitespace-pre-wrap">{msg.content}</p>
                                        <div className="flex items-center gap-1 mt-1 justify-end"><span className="text-[10px] text-amber-400">{formatRelativeTime(msg.createdAt)}</span></div>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <ChatBubble 
                                key={msg.id}
                                msg={msg}
                                isMe={msg.senderType === 'me'}
                                themeColor={themeColor}
                                showSenderNames={showSenderNames}
                                selectedMsgId={selectedMsgId}
                                onSelect={setSelectedMsgId}
                                onImageClick={onImageClick}
                                onFileClick={onFileClick}
                                onReply={onReply}
                                onUnsend={(id) => setConfirmAction({ id, type: 'unsend' })}
                                onRemove={(id) => setConfirmAction({ id, type: 'remove' })}
                                formatRelativeTime={formatRelativeTime}
                                formatFullTime={formatFullTime}
                            />
                        )
                    })}
                </div>
            ))}

            <div ref={endRef} className="h-1" />
            {isTyping && <ChatTyping partnerName={typingPartnerName} />}

            {confirmAction && (
                <ChatConfirmModal 
                    type={confirmAction.type}
                    isProcessing={isProcessing}
                    onConfirm={async () => {
                        setIsProcessing(true)
                        try {
                            if (confirmAction.type === 'unsend' && onUnsend) await onUnsend(confirmAction.id)
                            if (confirmAction.type === 'remove' && onRemove) await onRemove(confirmAction.id)
                        } finally {
                            setIsProcessing(false)
                            setConfirmAction(null)
                        }
                    }}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </div>
    )
}
