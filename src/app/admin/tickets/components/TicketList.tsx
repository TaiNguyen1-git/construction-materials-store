'use client'

import { Filter, Clock } from 'lucide-react'
import { SupportTicket, StatusConfig, PriorityConfig } from '../types'

interface TicketListProps {
    tickets: SupportTicket[]
    loading: boolean
    selectedTicketId?: string
    onSelectTicket: (ticket: SupportTicket) => void
    statusConfig: Record<string, StatusConfig>
    priorityConfig: Record<string, PriorityConfig>
    formatDate: (date: string) => string
    isSlaBreached: (ticket: SupportTicket) => boolean
    page: number
    setPage: (page: number) => void
    totalPages: number
}

export default function TicketList({
    tickets,
    loading,
    selectedTicketId,
    onSelectTicket,
    statusConfig,
    priorityConfig,
    formatDate,
    isSlaBreached,
    page,
    setPage,
    totalPages
}: TicketListProps) {
    return (
        <div className="w-[380px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">{tickets.length} ticket</span>
                <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                    title="Cuộn lên bộ lọc"
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                >
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Đang tải...</div>
                ) : tickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        Không có ticket nào
                    </div>
                ) : (
                    tickets.map((ticket) => {
                        const statusCfg = statusConfig[ticket.status] || statusConfig.OPEN
                        const priorityCfg = priorityConfig[ticket.priority] || priorityConfig.MEDIUM
                        const StatusIcon = statusCfg.icon

                        return (
                            <button
                                key={ticket.id}
                                onClick={() => onSelectTicket(ticket)}
                                className={`w-full p-4 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors ${selectedTicketId === ticket.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <span className="text-xs font-bold text-indigo-600">{ticket.ticketNumber}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityCfg.color}`}>
                                        {priorityCfg.label}
                                    </span>
                                </div>

                                <h4 className="font-bold text-sm text-slate-900 mb-1 line-clamp-1">
                                    {ticket.subject}
                                </h4>

                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                                    {ticket.description}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <StatusIcon className="w-3 h-3" />
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                                            {statusCfg.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                        {isSlaBreached(ticket) && (
                                            <span className="text-red-500 font-bold">⚠️ SLA</span>
                                        )}
                                        <Clock className="w-3 h-3" />
                                        {formatDate(ticket.createdAt)}
                                    </div>
                                </div>
                            </button>
                        )
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-3 border-t border-slate-100 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 text-sm rounded-lg hover:bg-slate-100 disabled:opacity-50"
                    >
                        ←
                    </button>
                    <span className="text-sm text-slate-600">{page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 text-sm rounded-lg hover:bg-slate-100 disabled:opacity-50"
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    )
}
