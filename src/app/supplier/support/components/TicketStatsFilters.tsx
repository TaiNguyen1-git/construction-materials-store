import { Filter, Search } from 'lucide-react'
import { SupplierTicket, STATUS_CONFIG } from '../types'

interface TicketStatsFiltersProps {
    tickets: SupplierTicket[]
    statusFilter: string
    setStatusFilter: (filter: string) => void
    search: string
    setSearch: (search: string) => void
}

export default function TicketStatsFilters({
    tickets, statusFilter, setStatusFilter, search, setSearch
}: TicketStatsFiltersProps) {
    return (
        <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng yêu cầu', value: tickets.length, color: 'text-slate-700' },
                    { label: 'Đang xử lý', value: tickets.filter(t => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length, color: 'text-amber-600' },
                    { label: 'Chờ phản hồi', value: tickets.filter(t => t.status === 'WAITING').length, color: 'text-purple-600' },
                    { label: 'Đã xử lý', value: tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length, color: 'text-green-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex items-center gap-3 overflow-x-auto">
                <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <button
                    onClick={() => setStatusFilter('')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${!statusFilter ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Tất cả
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${statusFilter === key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        {cfg.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Tìm kiếm yêu cầu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                />
            </div>
        </>
    )
}
