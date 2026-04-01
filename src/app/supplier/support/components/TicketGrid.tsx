import { LifeBuoy, ChevronRight, Clock, Package, MessageCircle } from 'lucide-react'
import { SupplierTicket, STATUS_CONFIG, CATEGORIES, PRIORITY_CONFIG } from '../types'

interface TicketGridProps {
    filteredTickets: SupplierTicket[]
    setSelectedTicket: (ticket: SupplierTicket) => void
    fetchTicketDetails: (id: string) => void
    formatRelative: (date: string) => string
}

export default function TicketGrid({
    filteredTickets, setSelectedTicket, fetchTicketDetails, formatRelative
}: TicketGridProps) {
    if (filteredTickets.length === 0) {
        return (
            <div className="col-span-full py-24 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-4 border-dashed border-slate-100">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-200 mb-6">
                    <LifeBuoy className="w-10 h-10" />
                </div>
                <p className="text-lg font-black text-slate-300 uppercase tracking-widest">Không có yêu cầu nào</p>
                <p className="text-sm text-slate-400 mt-2">Gửi yêu cầu mới khi gặp vấn đề cần hỗ trợ</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {filteredTickets.map((t) => {
                const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN
                const categoryCfg = CATEGORIES[t.category || 'GENERAL'] || CATEGORIES.GENERAL
                const CategoryIcon = categoryCfg.icon

                return (
                    <button
                        key={t.id}
                        onClick={() => {
                            setSelectedTicket(t)
                            fetchTicketDetails(t.id)
                        }}
                        className="w-full bg-white rounded-2xl border border-slate-100 p-5 text-left hover:shadow-md hover:border-blue-200 transition-all group"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                                    <CategoryIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusCfg.color}`}>
                                            {statusCfg.label}
                                        </span>
                                        {t.priority && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_CONFIG[t.priority]?.color}`}>
                                                {PRIORITY_CONFIG[t.priority]?.label}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-slate-400">{categoryCfg.label}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                        {t.reason}
                                    </h3>
                                    <p className="text-xs text-slate-400 truncate mt-0.5">{t.description}</p>
                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatRelative(t.createdAt)}
                                        </span>
                                        {t.orderId && (
                                            <span className="flex items-center gap-1 text-blue-500 font-bold">
                                                <Package className="w-3 h-3" />
                                                PO: {t.orderId}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <MessageCircle className="w-3 h-3" />
                                            {t.comments?.length || 0} phản hồi
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-2" />
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
