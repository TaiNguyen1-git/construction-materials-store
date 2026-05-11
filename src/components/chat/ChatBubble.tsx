import { RotateCcw, MessageSquareReply, Trash2 } from 'lucide-react'
import { ChatMessage, ChatThemeColor, THEME } from './types'
import ChatStatus from './ChatStatus'
import ChatAttachment from './ChatAttachment'

interface ChatBubbleProps {
    msg: ChatMessage & { isFirst: boolean; isLast: boolean }
    isMe: boolean
    themeColor: ChatThemeColor
    showSenderNames: boolean
    selectedMsgId: string | null
    onSelect: (id: string | null) => void
    onImageClick?: (url: string) => void
    onFileClick?: (att: any) => void
    onReply?: (msg: ChatMessage) => void
    onUnsend?: (id: string) => void
    onRemove?: (id: string) => void
    formatRelativeTime: (date: string) => string
    formatFullTime: (date: string) => string
}

export default function ChatBubble({
    msg,
    isMe,
    themeColor,
    showSenderNames,
    selectedMsgId,
    onSelect,
    onImageClick,
    onFileClick,
    onReply,
    onUnsend,
    onRemove,
    formatRelativeTime,
    formatFullTime
}: ChatBubbleProps) {
    const theme = THEME[themeColor]
    const isSending = msg.status === 'sending'
    const isError = msg.status === 'error'

    return (
        <div className={`flex items-end gap-2 mb-0.5 w-full ${isMe ? 'justify-end' : 'justify-start'} ${msg.isFirst ? 'mt-3' : 'mt-0.5'}`}>
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

            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] group/msg relative`}>
                {!isMe && showSenderNames && msg.isFirst && msg.senderName && (
                    <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">
                        {msg.senderName}
                    </span>
                )}

                <div
                    onClick={() => !msg.isUnsent && onSelect(selectedMsgId === msg.id ? null : msg.id)}
                    className={`
                        relative px-4 py-2.5 shadow-sm w-fit min-w-[60px] max-w-full cursor-pointer
                        ${msg.isUnsent 
                            ? 'bg-slate-50 border border-slate-200 text-slate-400 shadow-none' 
                            : (isMe ? `${theme.bubble} text-white` : 'bg-white border border-slate-100 text-slate-800')
                        }
                        ${msg.isFirst ? 'rounded-t-2xl' : 'rounded-t-lg'} 
                        ${isMe 
                            ? (msg.isLast ? 'rounded-bl-2xl rounded-br-sm' : 'rounded-b-lg')
                            : (msg.isLast ? 'rounded-br-2xl rounded-bl-sm' : 'rounded-b-lg')
                        }
                        ${isSending ? 'opacity-70' : ''}
                        ${isError ? 'ring-2 ring-red-400' : ''}
                        transition-all duration-150 overflow-hidden
                    `}
                >
                    {!msg.isUnsent && msg.replyTo && (
                        <div className={`mb-2 p-2 rounded-lg border-l-4 text-[10px] ${isMe ? 'bg-black/10 border-white/30' : 'bg-slate-50 border-blue-400'}`}>
                            <p className={`font-black mb-0.5 ${isMe ? 'text-white/80' : 'text-blue-600'}`}>{msg.replyTo.senderName}</p>
                            <p className={`line-clamp-1 italic ${isMe ? 'text-white/70' : 'text-slate-500'}`}>
                                {msg.replyTo.content || (msg.replyTo.fileUrl ? '📎 Tệp đính kèm' : '...')}
                            </p>
                        </div>
                    )}

                    {!msg.isUnsent && msg.imageUrl && (
                        <div className="mt-1 mb-2 overflow-hidden rounded-xl">
                            <img
                                src={msg.imageUrl}
                                alt="image"
                                className="max-w-[260px] h-auto max-h-[300px] rounded-xl cursor-pointer hover:scale-[1.02] transition-transform object-contain"
                                onClick={() => onImageClick ? onImageClick(msg.imageUrl!) : window.open(msg.imageUrl, '_blank')}
                            />
                        </div>
                    )}

                    {msg.isUnsent ? (
                        <p className="text-[13px] italic flex items-center gap-1.5 py-0.5">
                            <RotateCcw size={12} className="opacity-50" /> Tin nhắn đã được thu hồi
                        </p>
                    ) : msg.content && (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                            {msg.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                                if (part.match(/https?:\/\/[^\s]+/)) {
                                    return (
                                        <a 
                                            key={i} 
                                            href={`/link-protection?url=${encodeURIComponent(part)}`}
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

                    {msg.attachments && msg.attachments.length > 0 && !msg.isUnsent && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {msg.attachments.map((att, i) => (
                                <ChatAttachment 
                                    key={i} 
                                    attachment={att} 
                                    isMe={isMe} 
                                    themeColor={themeColor} 
                                    onImageClick={onImageClick} 
                                    onFileClick={onFileClick} 
                                />
                            ))}
                        </div>
                    )}
                </div>

                {(selectedMsgId === msg.id || msg.isLast) && !msg.isUnsent ? (
                    <div className={`text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-200 ${isMe ? 'justify-end mr-1' : 'ml-1'}`}>
                        <span className="opacity-80">{formatFullTime(msg.createdAt)}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className={msg.status === 'seen' ? 'text-blue-400' : ''}>
                            {msg.status === 'seen' ? 'Đã xem' : (msg.status === 'sent' ? 'Đã gửi' : 'Đang gửi')}
                        </span>
                    </div>
                ) : (
                    msg.isLast && (
                        <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-[10px] text-slate-400">{formatRelativeTime(msg.createdAt)}</span>
                            {isMe && <ChatStatus status={msg.status} />}
                        </div>
                    )
                )}

                {!msg.isUnsent && (
                    <div className={`absolute top-0 ${isMe ? '-left-24' : '-right-24'} opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-0.5 h-10`}>
                        <button onClick={() => onReply?.(msg)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-600 transition-all active:scale-90" title="Trả lời">
                            <MessageSquareReply size={14} />
                        </button>
                        {isMe && onUnsend && (
                            <button onClick={() => onUnsend(msg.id)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-all active:scale-90" title="Thu hồi">
                                <RotateCcw size={14} />
                            </button>
                        )}
                        {onRemove && (
                            <button onClick={() => onRemove(msg.id)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all active:scale-90" title="Gỡ ở phía tôi">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
