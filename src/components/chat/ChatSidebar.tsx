import { Search, MessageCircle } from 'lucide-react'
import { Conversation } from './types'

interface ChatSidebarProps {
    conversations: Conversation[]
    selectedConv: string | null
    loading: boolean
    onSelect: (id: string) => void
    formatTime: (date: string) => string
    formatLastMessage: (content: string | null) => string
}

export default function ChatSidebar({
    conversations,
    selectedConv,
    loading,
    onSelect,
    formatTime,
    formatLastMessage
}: ChatSidebarProps) {
    return (
        <div className="w-80 border-r border-gray-100 overflow-y-auto bg-white flex-shrink-0 flex flex-col">
            <div className="p-4 border-b border-gray-50 flex-shrink-0">
                <div className="relative group mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm cuộc hội thoại..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Đang tải...</span>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="p-12 text-center">
                        <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Chưa có tin nhắn</p>
                    </div>
                ) : (
                    conversations.map(conv => (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`w-full p-4 text-left flex items-center gap-3 transition-all border-l-4 ${selectedConv === conv.id
                                ? 'bg-blue-50/50 border-l-blue-600'
                                : 'border-l-transparent hover:bg-gray-50'
                                }`}
                        >
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md">
                                    {conv.otherUserName.charAt(0)}
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <span className="font-black text-gray-900 truncate text-[13px] tracking-tight flex items-center gap-2">
                                        {conv.otherUserName}
                                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded-md border border-blue-100 uppercase tracking-tighter">Nhà thầu</span>
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-bold ml-2">
                                        {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                                    </span>
                                </div>
                                <p className={`text-[11px] truncate ${conv.unreadCount > 0 ? 'font-black text-blue-700' : 'text-gray-400 font-medium'}`}>
                                    {formatLastMessage(conv.lastMessage)}
                                </p>
                            </div>
                            {conv.unreadCount > 0 && (
                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-lg">
                                    {conv.unreadCount}
                                </div>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
