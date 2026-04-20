'use client'

import { useRef, useEffect } from 'react'
import {
    MoreVertical, User, Flag, Trash2, Phone, Video,
    ChevronDown, Sparkles, Loader2, Paperclip, Send,
    Check, CheckCheck, MessageCircle
} from 'lucide-react'
import { ChatMessage } from '@/components/chat/MessengerChatBubbles'

interface DirectChatViewProps {
    selectedConv: any
    displayName: string
    otherParticipantId: string | null
    isGuestChat: boolean
    messages: any[]
    newMessage: string
    setNewMessage: (msg: string) => void
    sending: boolean
    uploading: boolean
    smartReplies: string[]
    smartReplyLoading: boolean
    showMenu: boolean
    setShowMenu: (show: boolean) => void
    showScrollButton: boolean
    setShowCustomerPanel: (show: any) => void
    showCustomerPanel: boolean
    highlightId: string | null
    handleSendMessage: (e?: any, fileData?: any) => void
    handleFileUpload: (e: any) => void
    handleCall: (type?: 'audio' | 'video') => void
    handleMenuAction: (action: string) => void
    scrollToBottom: () => void
    renderMessageContent: (msg: any) => React.ReactNode
    formatTime: (date: string) => string
    messagesEndRef: any
    scrollContainerRef: any
    fileInputRef: any
    menuRef: any
    user: any
    setSmartReplies: (r: string[]) => void
    setHideSmartReplies: (h: boolean) => void
    selectedId: string | null
    fetchConversations: () => void
}

export default function DirectChatView({
    selectedConv,
    displayName,
    otherParticipantId,
    isGuestChat,
    messages,
    newMessage,
    setNewMessage,
    sending,
    uploading,
    smartReplies,
    smartReplyLoading,
    showMenu,
    setShowMenu,
    showScrollButton,
    setShowCustomerPanel,
    showCustomerPanel,
    highlightId,
    handleSendMessage,
    handleFileUpload,
    handleCall,
    handleMenuAction,
    scrollToBottom,
    renderMessageContent,
    formatTime,
    messagesEndRef,
    scrollContainerRef,
    fileInputRef,
    menuRef,
    user,
    setSmartReplies,
    setHideSmartReplies,
    selectedId,
    fetchConversations
}: DirectChatViewProps) {
    if (!selectedConv) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/20">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <MessageCircle className="w-10 h-10 text-indigo-300" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Trung tâm Hỗ trợ</h3>
                <p className="text-gray-500 max-w-sm text-xs font-medium leading-relaxed">
                    Chọn cuộc hội thoại từ danh sách bên trái để bắt đầu hỗ trợ khách hàng.
                </p>
                <button onClick={fetchConversations}
                    className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-full font-black text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                    LÀM MỚI DANH SÁCH
                </button>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col bg-white relative">
            {/* Chat Header */}
            <div className="sticky top-0 px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                        {displayName.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">{displayName}</h3>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Đang xem yêu cầu</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1" ref={menuRef}>
                    <button onClick={() => handleCall('audio')} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="Gọi thoại">
                        <Phone className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleCall('video')} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="Gọi video">
                        <Video className="w-5 h-5" />
                    </button>
                    <button onClick={() => setShowMenu(!showMenu)} className={`p-2 rounded-full transition-all ${showMenu ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100'}`}>
                        <MoreVertical className="w-5 h-5" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-6 top-[60px] w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button onClick={() => handleMenuAction('info')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 font-medium">
                                <User className="w-4 h-4 text-gray-400" /> {showCustomerPanel ? 'Ẩn thông tin KH' : 'Xem thông tin KH'}
                            </button>
                            <button onClick={() => handleMenuAction('report')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 font-medium">
                                <Flag className="w-4 h-4 text-gray-400" /> Báo cáo
                            </button>
                            <div className="h-px bg-gray-50 my-2 mx-2" />
                            <button onClick={() => handleMenuAction('delete')} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-bold">
                                <Trash2 className="w-4 h-4" /> Xóa hội thoại
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Container */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/50 custom-scrollbar relative">
                {messages.map((msg, idx) => {
                    const isAI = msg.senderId === 'smartbuild_bot' || msg.senderRole === 'BOT'
                    const isStaffFlag = msg.senderId === 'admin_support'
                    const isTrulyMe = msg.realSenderId ? String(msg.realSenderId) === String(user?.id) : String(msg.senderId) === String(user?.id)
                    const role = msg.senderRole
                    const isAdminRole = role === 'MANAGER'
                    const isStaffRole = role === 'EMPLOYEE'
                    const isMe = isTrulyMe || isStaffFlag
                    const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId)
                    return (
                        <div key={msg.id || `msg-idx-${idx}`} id={`msg-${msg.id || idx}`}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                            {!isMe && (
                                <div className="w-8 h-8 flex-shrink-0">
                                    {showAvatar ? (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${isAI ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-600'}`}>
                                            {isAI ? 'AI' : msg.senderName?.charAt(0)}
                                        </div>
                                    ) : <div className="w-8" />}
                                </div>
                            )}
                            <div className="max-w-[70%] group relative">
                                <div className={`flex items-center gap-1 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {isAI && (
                                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 text-[8px] font-black uppercase tracking-tighter shadow-sm flex items-center gap-0.5">
                                            <Sparkles className="w-2 h-2" /> AI BOT
                                        </span>
                                    )}
                                    {isTrulyMe && (
                                        <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-600 text-[8px] font-black uppercase tracking-tighter shadow-sm">
                                            BẠN ({isAdminRole ? 'ADMIN' : (isStaffRole ? 'NHÂN VIÊN' : 'ME')})
                                        </span>
                                    )}
                                    {!isTrulyMe && isStaffFlag && (
                                        isAdminRole
                                            ? <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-tighter shadow-sm">ADMIN: {msg.senderName}</span>
                                            : <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 text-[8px] font-black uppercase tracking-tighter shadow-sm">NV: {msg.senderName}</span>
                                    )}
                                </div>
                                <div className={`p-3.5 rounded-2xl shadow-sm border ${isMe
                                    ? 'bg-indigo-600 text-white border-indigo-500 rounded-br-none'
                                    : 'bg-white text-gray-800 border-gray-100 rounded-bl-none'
                                    } ${msg.id === highlightId ? 'ring-4 ring-amber-400 ring-offset-2 scale-[1.02] transition-all duration-500' : ''}`}>
                                    {renderMessageContent(msg)}
                                </div>
                                <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase">{formatTime(msg.createdAt)}</span>
                                    {isMe && (msg.isRead ? <CheckCheck className="w-3 h-3 text-indigo-500" /> : <Check className="w-3 h-3 text-gray-300" />)}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
                <button onClick={scrollToBottom}
                    className="absolute bottom-28 right-8 p-4 bg-white text-indigo-600 rounded-full shadow-2xl border border-indigo-50 animate-bounce z-40 hover:scale-110 transition-all">
                    <ChevronDown className="w-6 h-6" />
                </button>
            )}

            {/* Chat Input with Smart Reply */}
            <div className="p-4 bg-white border-t border-gray-100">
                {(smartReplies.length > 0 || smartReplyLoading) && (
                    <div className="mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                {smartReplyLoading ? 'AI đang phân tích...' : 'Gợi ý trả lời nhanh'}
                            </span>
                        </div>
                        {smartReplyLoading ? (
                            <div className="flex gap-2">
                                {[1, 2, 3].map(i => <div key={i} className="flex-1 h-10 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {smartReplies.map((reply, idx) => (
                                    <button key={idx}
                                        onClick={() => {
                                            setNewMessage(reply); setSmartReplies([])
                                            setHideSmartReplies(true)
                                            document.cookie = `hide_smart_replies_${selectedId}=true; path=/; max-age=31536000`
                                        }}
                                        className="text-left px-3 py-2 rounded-xl text-xs text-gray-700 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 hover:from-amber-100 hover:to-orange-100 transition-all hover:shadow-sm active:scale-[0.99]">
                                        <div className="flex items-start gap-2">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[9px] font-black mt-0.5">{idx + 1}</span>
                                            <span className="line-clamp-2 leading-relaxed">{reply}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <div className="max-w-4xl mx-auto flex items-end gap-2 bg-gray-100 p-2 rounded-3xl">
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                        className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-full transition-all">
                        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <div className="flex-1">
                        <textarea rows={1} placeholder="Nhập tin nhắn..."
                            className="w-full p-3 bg-transparent border-none rounded-2xl text-sm focus:ring-0 resize-none max-h-32"
                            value={newMessage} onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }} />
                    </div>
                    <button onClick={() => handleSendMessage()} disabled={sending || (!newMessage.trim() && !uploading)}
                        className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all hover:scale-105">
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    )
}
