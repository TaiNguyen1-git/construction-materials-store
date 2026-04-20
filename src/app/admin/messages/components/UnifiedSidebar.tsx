'use client'

import { Search, MessageCircle, Ticket, X, Loader2, RefreshCw, Clock } from 'lucide-react'
import { ActiveTab, SupportTicket, StatusConfig, PriorityConfig } from '../types'

interface UnifiedSidebarProps {
    activeTab: ActiveTab
    setActiveTab: (tab: ActiveTab) => void
    // Direct Chat Props
    searchQuery: string
    setSearchQuery: (q: string) => void
    isSearching: boolean
    searchResults: any[]
    chatLoading: boolean
    conversations: any[]
    selectedId: string | null
    setSelectedId: (id: string | null) => void
    jumpToMessage: (convId: string, msgId: string) => void
    handleSearch: (val: string) => void
    formatLastMessage: (content: string) => string
    user: any
    // Ticket Props
    ticketSearch: string
    setTicketSearch: (q: string) => void
    statusFilter: string
    setStatusFilter: (s: string) => void
    priorityFilter: string
    setPriorityFilter: (p: string) => void
    tickets: SupportTicket[]
    ticketsLoading: boolean
    selectedTicketId: string | undefined
    onSelectTicket: (ticket: SupportTicket) => void
    fetchTickets: () => void
    statusConfig: Record<string, StatusConfig>
    priorityConfig: Record<string, PriorityConfig>
    isSlaBreached: (ticket: SupportTicket) => boolean
}

export default function UnifiedSidebar({
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResults,
    chatLoading,
    conversations,
    selectedId,
    setSelectedId,
    jumpToMessage,
    handleSearch,
    formatLastMessage,
    user,
    ticketSearch,
    setTicketSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    tickets,
    ticketsLoading,
    selectedTicketId,
    onSelectTicket,
    fetchTickets,
    statusConfig,
    priorityConfig,
    isSlaBreached
}: UnifiedSidebarProps) {
    return (
        <div className="w-80 border-r border-gray-100 flex flex-col bg-white overflow-hidden">
            {/* Tab switcher */}
            <div className="p-3 border-b border-gray-100">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all duration-200 ${activeTab === 'chat'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all duration-200 ${activeTab === 'tickets'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Ticket className="w-3.5 h-3.5" />
                        Tickets
                    </button>
                </div>
            </div>

            {/* ── Chat sidebar ───────────────────────────────────────── */}
            {activeTab === 'chat' && (
                <>
                    <div className="p-4 border-b border-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-gray-900">Hội thoại</h2>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Tìm nội dung tin nhắn..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500"
                                value={searchQuery} onChange={e => handleSearch(e.target.value)} />
                            {searchQuery && (
                                <button onClick={() => { setSearchQuery(''); handleSearch('') }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {searchQuery.length >= 2 ? (
                            <div className="flex flex-col">
                                <div className="px-4 py-2 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    {isSearching ? 'Đang tìm kiếm...' : `Tìm thấy ${searchResults.length} kết quả`}
                                </div>
                                {searchResults.map(result => (
                                    <button key={result.id} onClick={() => jumpToMessage(result.conversationId, result.id)}
                                        className="w-full p-4 text-left hover:bg-indigo-50 border-b border-gray-50 transition-colors group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-xs text-indigo-600 truncate">{result.conversationTitle}</span>
                                            <span className="text-[9px] text-gray-400 flex-shrink-0">{new Date(result.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed italic">"{result.content}"</p>
                                    </button>
                                ))}
                            </div>
                        ) : chatLoading ? (
                            <div className="flex flex-col items-center justify-center p-8 text-gray-400 gap-3">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Đang tải...</span>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic">Chưa có hội thoại nào</div>
                        ) : (
                            conversations.map(conv => (
                                <button key={conv.id} onClick={() => setSelectedId(conv.id)}
                                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-r-4 ${selectedId === conv.id ? 'bg-indigo-50/50 border-indigo-600' : 'border-transparent'}`}>
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            {(user?.id === conv.participant1Id ? conv.participant2Name : conv.participant1Name).charAt(0)}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h4 className="font-bold text-gray-900 truncate text-[13px]">
                                                {user?.id === conv.participant1Id ? conv.participant2Name : conv.participant1Name}
                                            </h4>
                                            <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">
                                                {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <p className={`text-[11px] truncate ${conv.unread1 > 0 || conv.unread2 > 0 ? 'font-bold text-indigo-900' : 'text-gray-500'}`}>
                                            {formatLastMessage(conv.lastMessage)}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* ── Ticket sidebar ─────────────────────────────────────── */}
            {activeTab === 'tickets' && (
                <>
                    <div className="p-3 border-b border-gray-100 space-y-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input type="text" placeholder="Tìm mã ticket, nội dung..."
                                value={ticketSearch} onChange={e => setTicketSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-gray-100 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="flex gap-2">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="flex-1 px-2 py-1.5 bg-gray-100 border-none rounded-lg text-[11px] font-medium focus:ring-2 focus:ring-indigo-500">
                                <option value="">Tất cả trạng thái</option>
                                {Object.entries(statusConfig).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                                className="flex-1 px-2 py-1.5 bg-gray-100 border-none rounded-lg text-[11px] font-medium focus:ring-2 focus:ring-indigo-500">
                                <option value="">Tất cả độ ưu tiên</option>
                                {Object.entries(priorityConfig).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-bold">{tickets.length} ticket</span>
                            <button onClick={fetchTickets} title="Làm mới"
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 transition-colors">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {ticketsLoading ? (
                            <div className="p-8 text-center text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic">Không có ticket nào</div>
                        ) : (
                            tickets.map(ticket => {
                                const statusCfg = statusConfig[ticket.status] || statusConfig.OPEN
                                const priorityCfg = priorityConfig[ticket.priority]
                                const StatusIcon = statusCfg.icon
                                return (
                                    <button key={ticket.id}
                                        onClick={() => onSelectTicket(ticket)}
                                        className={`w-full p-4 border-b border-gray-50 text-left hover:bg-gray-50 transition-colors border-r-4 ${selectedTicketId === ticket.id ? 'bg-indigo-50/50 border-indigo-600' : 'border-transparent'}`}>
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <span className="text-[11px] font-black text-indigo-600">{ticket.ticketNumber}</span>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${priorityCfg?.color}`}>{priorityCfg?.label}</span>
                                        </div>
                                        <h4 className="font-bold text-[12px] text-gray-900 mb-1 line-clamp-1">{ticket.subject}</h4>
                                        <p className="text-[10px] text-gray-500 line-clamp-1 mb-2">{ticket.description}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <StatusIcon className="w-3 h-3 opacity-60" />
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] text-gray-400">
                                                {isSlaBreached(ticket) && <span className="text-red-500 font-bold">⚠️</span>}
                                                <Clock className="w-2.5 h-2.5" />
                                                {new Date(ticket.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
