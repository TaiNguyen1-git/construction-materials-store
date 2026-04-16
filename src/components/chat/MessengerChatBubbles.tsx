'use client'

import { useEffect, useRef } from 'react'
import { Check, CheckCheck, Clock, Paperclip, AlertCircle } from 'lucide-react'

export interface ChatMessage {
    id: string
    content: string
    senderType: 'me' | 'other' | 'system'
    senderName?: string
    senderAvatar?: string
    createdAt: string
    status?: 'sending' | 'sent' | 'delivered' | 'seen' | 'error'
    attachments?: { fileName: string; fileUrl: string; fileType: string }[]
    isInternal?: boolean
    internalLabel?: string
    imageUrl?: string
}

interface Props {
    messages: ChatMessage[]
    currentUserAvatar?: string
    themeColor?: 'indigo' | 'blue' | 'green' | 'amber'
    showSenderNames?: boolean
    autoScroll?: boolean
}

const THEME = {
    indigo: { bubble: 'bg-indigo-600', text: 'text-white', meta: 'text-indigo-200', attach: 'bg-indigo-700 hover:bg-indigo-800 text-indigo-50' },
    blue: { bubble: 'bg-blue-600', text: 'text-white', meta: 'text-blue-200', attach: 'bg-blue-700 hover:bg-blue-800 text-blue-50' },
    green: { bubble: 'bg-emerald-600', text: 'text-white', meta: 'text-emerald-200', attach: 'bg-emerald-700 hover:bg-emerald-800 text-emerald-50' },
    amber: { bubble: 'bg-amber-500', text: 'text-white', meta: 'text-amber-100', attach: 'bg-amber-600 hover:bg-amber-700 text-amber-50' },
}

function formatRelativeTime(dateStr: string) {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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

function StatusIcon({ status }: { status?: string }) {
    if (status === 'sending') return <Clock className="w-3 h-3 opacity-60 animate-pulse" />
    if (status === 'sent') return <Check className="w-3 h-3 opacity-60" />
    if (status === 'delivered') return <CheckCheck className="w-3 h-3 opacity-60" />
    if (status === 'seen') return <CheckCheck className="w-3 h-3 text-blue-300" />
    if (status === 'error') return <AlertCircle className="w-3 h-3 text-red-400" />
    return null
}

export default function MessengerChatBubbles({
    messages,
    themeColor = 'indigo',
    showSenderNames = true,
    autoScroll = true,
}: Props) {
    const endRef = useRef<HTMLDivElement>(null)
    const theme = THEME[themeColor]

    useEffect(() => {
        if (autoScroll) {
            endRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, autoScroll])

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
                    <p className="text-xs mt-1">Hãy bắt đầu cuộc trò chuyện</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-1 py-4 px-4">
            {groups.map((group) => (
                <div key={group.date}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap px-2">
                            {group.date === 'sending' ? '' : formatDateGroup(group.msgs[0].createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    {/* Messages in this date group */}
                    {group.msgs.map((msg) => {
                        const isMe = msg.senderType === 'me'
                        const isSystem = msg.senderType === 'system'
                        const isInternal = msg.isInternal
                        const isSending = msg.status === 'sending'
                        const isError = msg.status === 'error'

                        // System message
                        if (isSystem) {
                            return (
                                <div key={msg.id} className="flex justify-center my-2">
                                    <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-medium">
                                        {msg.content}
                                    </span>
                                </div>
                            )
                        }

                        // Internal note
                        if (isInternal) {
                            return (
                                <div key={msg.id} className="flex justify-center my-1">
                                    <div className="max-w-[80%] bg-amber-50 border border-dashed border-amber-300 rounded-2xl px-4 py-2.5">
                                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1 flex items-center gap-1">
                                            🔒 {msg.internalLabel || 'Ghi chú nội bộ'}
                                        </div>
                                        {showSenderNames && msg.senderName && (
                                            <span className="text-[10px] font-bold text-amber-700 block mb-1">{msg.senderName}</span>
                                        )}
                                        <p className="text-sm text-amber-900 whitespace-pre-wrap">{msg.content}</p>
                                        <div className="flex items-center gap-1 mt-1 justify-end">
                                            <span className="text-[10px] text-amber-400">{formatRelativeTime(msg.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div
                                key={msg.id}
                                className={`flex items-end gap-2 mb-0.5 ${isMe ? 'justify-end' : 'justify-start'} ${msg.isFirst ? 'mt-3' : 'mt-0.5'}`}
                            >
                                {/* Other user avatar */}
                                {!isMe && (
                                    <div className="w-7 h-7 flex-shrink-0 mb-0.5">
                                        {msg.isLast ? (
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-[11px] font-black text-white shadow-sm">
                                                {msg.senderName?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        ) : (
                                            <div className="w-7" />
                                        )}
                                    </div>
                                )}

                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[72%]`}>
                                    {/* Sender name (first in group) */}
                                    {!isMe && showSenderNames && msg.isFirst && msg.senderName && (
                                        <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">
                                            {msg.senderName}
                                        </span>
                                    )}

                                    {/* Bubble */}
                                    <div
                                        className={`
                                            relative px-4 py-2.5 shadow-sm
                                            ${isMe
                                                ? `${theme.bubble} text-white ${msg.isFirst ? 'rounded-t-2xl' : 'rounded-t-lg'} ${msg.isLast ? 'rounded-bl-2xl rounded-br-sm' : 'rounded-b-lg'}`
                                                : `bg-white border border-slate-100 text-slate-800 ${msg.isFirst ? 'rounded-t-2xl' : 'rounded-t-lg'} ${msg.isLast ? 'rounded-br-2xl rounded-bl-sm' : 'rounded-b-lg'}`
                                            }
                                            ${isSending ? 'opacity-70' : ''}
                                            ${isError ? 'ring-2 ring-red-400' : ''}
                                            transition-all duration-150
                                        `}
                                    >
                                        {/* Inline image */}
                                        {msg.imageUrl && (
                                            <img
                                                src={msg.imageUrl}
                                                alt="image"
                                                className="max-w-[220px] max-h-[280px] rounded-xl mb-2 cursor-pointer hover:scale-[1.02] transition-transform"
                                                onClick={() => window.open(msg.imageUrl, '_blank')}
                                            />
                                        )}

                                        {/* Text */}
                                        {msg.content && (
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                                        )}

                                        {/* Attachments */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {msg.attachments.map((att, i) => {
                                                    const isImg = att.fileType?.startsWith('image/')
                                                    return isImg ? (
                                                        <img
                                                            key={i}
                                                            src={att.fileUrl}
                                                            alt={att.fileName}
                                                            className="max-w-[180px] rounded-xl cursor-pointer hover:scale-[1.02] transition-transform"
                                                            onClick={() => window.open(att.fileUrl, '_blank')}
                                                        />
                                                    ) : (
                                                        <a
                                                            key={i}
                                                            href={att.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isMe ? theme.attach : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                                        >
                                                            <Paperclip className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate max-w-[140px]">{att.fileName || 'Tệp đính kèm'}</span>
                                                        </a>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Timestamp + Status (only last in group) */}
                                    {msg.isLast && (
                                        <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-[10px] text-slate-400">{formatRelativeTime(msg.createdAt)}</span>
                                            {isMe && <StatusIcon status={msg.status} />}
                                        </div>
                                    )}
                                </div>

                                {/* My avatar placeholder */}
                                {isMe && <div className="w-1 flex-shrink-0" />}
                            </div>
                        )
                    })}
                </div>
            ))}

            <div ref={endRef} className="h-1" />
        </div>
    )
}
