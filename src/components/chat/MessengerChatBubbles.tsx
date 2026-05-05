'use client'

import { useEffect, useRef } from 'react'
import { Check, CheckCheck, Clock, Paperclip, AlertCircle, Reply, Undo2, Trash2, MoreHorizontal } from 'lucide-react'

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
    // Professional features
    isUnsent?: boolean
    replyTo?: {
        id: string
        content: string
        senderName: string
        fileUrl?: string
        fileType?: string
    }
}

interface Props {
    messages: ChatMessage[]
    currentUserAvatar?: string
    themeColor?: 'indigo' | 'blue' | 'green' | 'amber'
    showSenderNames?: boolean
    autoScroll?: boolean
    onImageClick?: (url: string) => void
    onFileClick?: (att: { fileName: string; fileUrl: string; fileType: string }) => void
    onReply?: (msg: ChatMessage) => void
    onUnsend?: (msgId: string) => void
    onRemove?: (msgId: string) => void
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
    onImageClick,
    onFileClick,
    onReply,
    onUnsend,
    onRemove
}: Props) {
    const endRef = useRef<HTMLDivElement>(null)
    const theme = THEME[themeColor]

    useEffect(() => {
        // 🛡️ DISABLED: scrollIntoView causes the whole window to scroll.
        // Auto-scroll is now handled by the parent container in page.tsx
        /*
        if (autoScroll) {
            endRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
        */
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
        <div className="flex flex-col gap-1 py-4 px-4 w-full">
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
                                <div key={msg.id} className="flex justify-center my-2 w-full">
                                    <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-medium">
                                        {msg.content}
                                    </span>
                                </div>
                            )
                        }

                        // Internal note
                        if (isInternal) {
                            return (
                                <div key={msg.id} className="flex justify-end w-full my-1">
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
                                className={`flex items-end gap-2 mb-0.5 w-full ${isMe ? 'justify-end' : 'justify-start'} ${msg.isFirst ? 'mt-3' : 'mt-0.5'}`}
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

                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[72%] group/msg relative`}>
                                    {/* Sender name (first in group) */}
                                    {!isMe && showSenderNames && msg.isFirst && msg.senderName && (
                                        <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">
                                            {msg.senderName}
                                        </span>
                                    )}

                                    {/* Bubble */}
                                    <div
                                        className={`
                                            relative px-4 py-2.5 shadow-sm w-fit max-w-[75%]
                                            ${isMe
                                                ? `${theme.bubble} text-white ${msg.isFirst ? 'rounded-t-2xl' : 'rounded-t-lg'} ${msg.isLast ? 'rounded-bl-2xl rounded-br-sm' : 'rounded-b-lg'}`
                                                : `bg-white border border-slate-100 text-slate-800 ${msg.isFirst ? 'rounded-t-2xl' : 'rounded-t-lg'} ${msg.isLast ? 'rounded-br-2xl rounded-bl-sm' : 'rounded-b-lg'}`
                                            }
                                            ${isSending ? 'opacity-70' : ''}
                                            ${isError ? 'ring-2 ring-red-400' : ''}
                                            ${msg.isUnsent ? '!bg-slate-50 !text-slate-400 !border-slate-200 !shadow-none' : ''}
                                            transition-all duration-150 overflow-hidden
                                        `}
                                    >
                                        {/* Quoted Message (Reply) */}
                                        {msg.replyTo && !msg.isUnsent && (
                                            <div className={`mb-2 p-2 rounded-lg border-l-4 text-[10px] ${isMe ? 'bg-black/10 border-white/30' : 'bg-slate-50 border-blue-400'}`}>
                                                <p className={`font-black mb-0.5 ${isMe ? 'text-white/80' : 'text-blue-600'}`}>{msg.replyTo.senderName}</p>
                                                <p className={`line-clamp-1 italic ${isMe ? 'text-white/70' : 'text-slate-500'}`}>
                                                    {msg.replyTo.content || (msg.replyTo.fileUrl ? '📎 Tệp đính kèm' : '...')}
                                                </p>
                                            </div>
                                        )}

                                        {/* Inline image */}
                                        {msg.imageUrl && !msg.isUnsent && (
                                            <img
                                                src={msg.imageUrl}
                                                alt="image"
                                                className="max-w-[220px] max-h-[280px] rounded-xl mb-2 cursor-pointer hover:scale-[1.02] transition-transform"
                                                onClick={() => onImageClick ? onImageClick(msg.imageUrl!) : window.open(msg.imageUrl, '_blank')}
                                            />
                                        )}

                                        {/* Text with Link Protection or Unsent State */}
                                        {msg.isUnsent ? (
                                            <p className="text-[13px] italic opacity-70 flex items-center gap-1.5">
                                                <Undo2 size={12} /> Tin nhắn đã được thu hồi
                                            </p>
                                        ) : msg.content && (
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">
                                                {msg.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                                                    const isLink = part.match(/https?:\/\/[^\s]+/)
                                                    if (isLink) {
                                                        const safeRedirectUrl = `/link-protection?url=${encodeURIComponent(part)}`
                                                        return (
                                                            <a 
                                                                key={i} 
                                                                href={safeRedirectUrl} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className={`underline decoration-2 underline-offset-2 font-bold ${isMe ? 'text-white/90 hover:text-white' : 'text-blue-600 hover:text-blue-700'}`}
                                                            >
                                                                {part}
                                                            </a>
                                                        )
                                                    }
                                                    return part
                                                })}
                                            </p>
                                        )}

                                        {/* Attachments */}
                                        {msg.attachments && msg.attachments.length > 0 && !msg.isUnsent && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {msg.attachments.map((att, i) => {
                                                    const isImg = att.fileType?.startsWith('image/')
                                                    return isImg ? (
                                                        <img
                                                            key={i}
                                                            src={att.fileUrl}
                                                            alt={att.fileName}
                                                            className="max-w-[180px] rounded-xl cursor-pointer hover:scale-[1.02] transition-transform"
                                                            onClick={() => onImageClick ? onImageClick(att.fileUrl) : window.open(att.fileUrl, '_blank')}
                                                        />
                                                    ) : (
                                                        <div key={i} className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => onFileClick ? onFileClick(att) : window.open(att.fileUrl, '_blank')}
                                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isMe ? theme.attach : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                                            >
                                                                <Paperclip className="w-3 h-3 flex-shrink-0" />
                                                                <span className="truncate max-w-[120px]">{att.fileName || 'Tệp đính kèm'}</span>
                                                            </button>
                                                            
                                                            {/* Safe Preview Button for Docs */}
                                                            {(att.fileName.toLowerCase().endsWith('.docx') || 
                                                              att.fileName.toLowerCase().endsWith('.doc') || 
                                                              att.fileName.toLowerCase().endsWith('.xlsx') || 
                                                              att.fileName.toLowerCase().endsWith('.pptx') ||
                                                              att.fileName.toLowerCase().endsWith('.pdf')) && (
                                                                <button
                                                                    onClick={() => {
                                                                        const isBase64 = att.fileUrl.startsWith('data:')
                                                                        let finalUrl = att.fileUrl

                                                                        if (isBase64) {
                                                                            try {
                                                                                const parts = att.fileUrl.split(',')
                                                                                const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream'
                                                                                const b64Data = parts[1]
                                                                                const byteCharacters = atob(b64Data)
                                                                                const byteNumbers = new Array(byteCharacters.length)
                                                                                for (let i = 0; i < byteCharacters.length; i++) {
                                                                                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                                                                                }
                                                                                const byteArray = new Uint8Array(byteNumbers)
                                                                                const blob = new Blob([byteArray], { type: mime })
                                                                                finalUrl = URL.createObjectURL(blob)
                                                                            } catch (e) {
                                                                                console.error('Blob conversion failed', e)
                                                                            }
                                                                        }

                                                                        const isPdf = att.fileName.toLowerCase().endsWith('.pdf')
                                                                        const viewerUrl = (isPdf || isBase64)
                                                                            ? finalUrl 
                                                                            : `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(finalUrl)}`
                                                                        
                                                                        window.open(viewerUrl, '_blank')
                                                                    }}
                                                                    className={`flex items-center gap-1 px-1.5 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md border border-dashed transition-all ${
                                                                        isMe 
                                                                        ? 'border-white/30 text-white/80 hover:bg-white/10' 
                                                                        : 'border-blue-200 text-blue-500 hover:bg-blue-50'
                                                                    }`}
                                                                >
                                                                    Xem trước an toàn
                                                                </button>
                                                            )}
                                                        </div>
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

                                    {/* Action Menu (on Hover) */}
                                    {!isSystem && !isInternal && !msg.isUnsent && (
                                        <div className={`absolute top-0 ${isMe ? '-left-24' : '-right-24'} opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-0.5 h-10`}>
                                            <button 
                                                onClick={() => onReply?.(msg)} 
                                                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-600 transition-all active:scale-90" 
                                                title="Trả lời"
                                            >
                                                <Reply size={14} />
                                            </button>
                                            {isMe && onUnsend && (
                                                <button 
                                                    onClick={() => onUnsend(msg.id)} 
                                                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-all active:scale-90" 
                                                    title="Thu hồi"
                                                >
                                                    <Undo2 size={14} />
                                                </button>
                                            )}
                                            {onRemove && (
                                                <button 
                                                    onClick={() => onRemove(msg.id)} 
                                                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all active:scale-90" 
                                                    title="Gỡ ở phía tôi"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
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
