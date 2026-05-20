'use client'

import { Search, MessageCircle, Ticket, X, Loader2, RefreshCw, Clock, MoreVertical, Archive, EyeOff, Trash2, Users, Plus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { ActiveTab, SupportTicket, StatusConfig, PriorityConfig } from '../types'
import CreateGroupModal from './CreateGroupModal'

function ConversationMenu({
    conv,
    onArchive,
    onDelete,
    onHide,
    isArchived
}: {
    conv: any
    onArchive: (id: string) => void
    onDelete: (id: string) => void
    onHide: (id: string) => void
    isArchived: boolean
}) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    return (
        <div 
            className={`absolute right-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 shadow-sm transition-all ${
                isOpen 
                    ? 'opacity-100 z-30 ring-2 ring-indigo-500/20' 
                    : 'opacity-0 group-hover/item:opacity-100 z-20 hover:bg-gray-50/90'
            }`} 
            ref={menuRef}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
                className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-800 transition-colors"
            >
                <MoreVertical className="w-4 h-4" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsOpen(false)
                            onArchive(conv.id)
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <Archive className="w-3.5 h-3.5 text-gray-400" />
                        {isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
                    </button>
                    {!isArchived && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsOpen(false)
                                onHide(conv.id)
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                            Ẩn cuộc chat
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsOpen(false)
                            onDelete(conv.id)
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        Xóa chat
                    </button>
                </div>
            )}
        </div>
    )
}

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
    chatTab: 'active' | 'archived'
    setChatTab: (tab: 'active' | 'archived') => void
    onArchiveConversation: (id: string, action: 'archive' | 'unarchive') => void
    onHideConversation: (id: string) => void
    onDeleteConversation: (id: string) => void
    hasMoreConversations: boolean
    onLoadMoreConversations: () => void
    // Ticket Props
    ticketSearch: string
    setTicketSearch: (q: string) => void
    statusFilter: string
    setStatusFilter: (s: string) => void
    priorityFilter: string
    setPriorityFilter: (p: string) => void
    assignedFilter: string
    setAssignedFilter: (a: string) => void
    tickets: SupportTicket[]
    ticketsLoading: boolean
    selectedTicketId: string | undefined
    onSelectTicket: (ticket: SupportTicket) => void
    fetchTickets: () => void
    statusConfig: Record<string, StatusConfig>
    priorityConfig: Record<string, PriorityConfig>
    isSlaBreached: (ticket: SupportTicket) => boolean
    onGroupCreated?: (newConv: any) => void
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
    chatTab,
    setChatTab,
    onArchiveConversation,
    onHideConversation,
    onDeleteConversation,
    hasMoreConversations,
    onLoadMoreConversations,
    ticketSearch,
    setTicketSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    assignedFilter,
    setAssignedFilter,
    tickets,
    ticketsLoading,
    selectedTicketId,
    onSelectTicket,
    fetchTickets,
    statusConfig,
    priorityConfig,
    isSlaBreached,
    onGroupCreated
}: UnifiedSidebarProps) {
    const [chatGroupFilter, setChatGroupFilter] = useState<'all' | 'project' | 'support' | 'direct' | 'group'>('all')
    const [showCreateGroup, setShowCreateGroup] = useState(false)

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
            onLoadMoreConversations()
        }
    }

    // Apply filters to conversations
    let filteredConversations = conversations
    if (chatGroupFilter === 'support') {
        filteredConversations = conversations.filter(conv => conv.participant1Id === 'admin_support' || conv.participant2Id === 'admin_support')
    } else if (chatGroupFilter === 'direct') {
        filteredConversations = conversations.filter(conv => !conv.isGroup && conv.participant1Id !== 'admin_support' && conv.participant2Id !== 'admin_support')
    } else if (chatGroupFilter === 'group') {
        filteredConversations = conversations.filter(conv => conv.isGroup === true)
    }

    // Grouping by project
    const groupedConvs: Record<string, any[]> = {}
    filteredConversations.forEach(conv => {
        const key = conv.projectTitle || 'Hội thoại chung & Hỗ trợ'
        if (!groupedConvs[key]) groupedConvs[key] = []
        groupedConvs[key].push(conv)
    })

    const hasConversations = filteredConversations.length > 0

    // Helper function to render a single conversation item
    const renderConvItem = (conv: any) => {
        const isGroupConv = conv.isGroup === true
        const displayName = isGroupConv
            ? (conv.groupTitle || 'Trò chuyện nhóm')
            : (user?.id === conv.participant1Id ? conv.participant2Name : conv.participant1Name)
        const avatarLetter = (displayName || '?').charAt(0).toUpperCase()
        const unreadCount = isGroupConv
            ? ((conv.unreadByUser && typeof conv.unreadByUser === 'object') ? (conv.unreadByUser as any)[user?.id] || 0 : 0)
            : (conv.unreadCount || 0)

        return (
            <div key={conv.id} className="relative group/item">
                <button onClick={() => setSelectedId(conv.id)}
                    className={`w-full p-4 pr-12 flex items-center gap-3 hover:bg-gray-50 transition-colors border-r-4 ${selectedId === conv.id ? 'bg-indigo-50/50 border-indigo-600' : 'border-transparent'}`}>
                    <div className="relative flex-shrink-0">
                        {isGroupConv ? (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                <Users className="w-5 h-5" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {avatarLetter}
                            </div>
                        )}
                        {!isGroupConv && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <h4 className="font-bold text-gray-900 truncate text-[13px]">{displayName}</h4>
                                {isGroupConv && (
                                    <span className="flex-shrink-0 text-[8px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                                        Nhóm
                                    </span>
                                )}
                            </div>
                            <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">
                                {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className={`text-[11px] truncate ${unreadCount > 0 ? 'font-bold text-indigo-900' : 'text-gray-500'}`}>
                                {formatLastMessage(conv.lastMessage)}
                            </p>
                            {unreadCount > 0 && (
                                <span className="ml-2 flex-shrink-0 w-5 h-5 bg-indigo-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                    </div>
                </button>
                <ConversationMenu
                    conv={conv}
                    onArchive={(id) => onArchiveConversation(id, chatTab === 'archived' ? 'unarchive' : 'archive')}
                    onHide={onHideConversation}
                    onDelete={onDeleteConversation}
                    isArchived={chatTab === 'archived'}
                />
            </div>
        )
    }

    return (
        <>
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
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowCreateGroup(true)}
                                    title="Tạo nhóm chat đa bên"
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20"
                                >
                                    <Plus className="w-3 h-3" />
                                    Nhóm
                                </button>
                                <div className="flex bg-gray-100 p-0.5 rounded-lg text-[10px]">
                                    <button
                                        onClick={() => setChatTab('active')}
                                        className={`px-2 py-1 rounded-md font-bold uppercase tracking-wider transition-colors ${chatTab === 'active' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Hoạt động
                                    </button>
                                    <button
                                        onClick={() => setChatTab('archived')}
                                        className={`px-2 py-1 rounded-md font-bold uppercase tracking-wider transition-colors ${chatTab === 'archived' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Lưu trữ
                                    </button>
                                </div>
                            </div>
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
                        {/* Selector Phân nhóm */}
                        <div className="mt-2">
                            <select value={chatGroupFilter} onChange={e => setChatGroupFilter(e.target.value as any)}
                                className="w-full px-2 py-1.5 bg-gray-100 border-none rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                                <option value="all">📂 Tất cả</option>
                                <option value="group">👥 Chat nhóm</option>
                                <option value="project">🏗️ Theo Dự án</option>
                                <option value="support">💬 Hỗ trợ chung</option>
                                <option value="direct">👤 Chat trực tiếp</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar" onScroll={handleScroll}>
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
                        ) : !hasConversations ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic">Không tìm thấy hội thoại phù hợp</div>
                        ) : chatGroupFilter === 'project' ? (
                            <>
                                {Object.entries(groupedConvs).map(([projectTitle, items]) => (
                                    <div key={projectTitle} className="mb-2">
                                        <div className="sticky top-0 bg-slate-50/90 backdrop-blur-xs px-4 py-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 border-y border-slate-100/80 z-10">
                                            <span>🏗️ {projectTitle}</span>
                                            <span className="ml-auto bg-indigo-100/60 text-indigo-700 px-2 py-0.2 rounded-full text-[9px] font-bold">{items.length}</span>
                                        </div>
                                        <div>
                                            {items.map(conv => renderConvItem(conv))}
                                        </div>
                                    </div>
                                ))}
                                {hasMoreConversations && (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {filteredConversations.map(conv => renderConvItem(conv))}
                                {hasMoreConversations && (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                    </div>
                                )}
                            </>
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
                        <div className="grid grid-cols-3 gap-1">
                            <select value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)}
                                className="px-1.5 py-1.5 bg-gray-100 border-none rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-indigo-500">
                                <option value="">Phân công</option>
                                <option value="me">Của tôi</option>
                                <option value="unassigned">Chưa nhận</option>
                            </select>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="px-1.5 py-1.5 bg-gray-100 border-none rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-indigo-500">
                                <option value="">Trạng thái</option>
                                {Object.entries(statusConfig).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                                className="px-1.5 py-1.5 bg-gray-100 border-none rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-indigo-500">
                                <option value="">Độ ưu tiên</option>
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

        {/* Create Group Chat Modal */}
        {onGroupCreated && (
            <CreateGroupModal
                isOpen={showCreateGroup}
                onClose={() => setShowCreateGroup(false)}
                onGroupCreated={(newConv) => {
                    onGroupCreated(newConv)
                    setShowCreateGroup(false)
                }}
                currentUserId={user?.id || ''}
            />
        )}
    </>
    )
}
