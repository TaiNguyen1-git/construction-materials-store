'use client'

import { Search } from 'lucide-react'
import { StatusConfig, PriorityConfig } from '../types'

interface TicketFiltersProps {
    search: string
    setSearch: (val: string) => void
    statusFilter: string
    setStatusFilter: (val: string) => void
    priorityFilter: string
    setPriorityFilter: (val: string) => void
    statusConfig: Record<string, StatusConfig>
    priorityConfig: Record<string, PriorityConfig>
}

export default function TicketFilters({
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    statusConfig,
    priorityConfig
}: TicketFiltersProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
            <div className="flex flex-wrap gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo mã ticket, nội dung..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(statusConfig).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                </select>

                {/* Priority Filter */}
                <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option value="">Tất cả độ ưu tiên</option>
                    {Object.entries(priorityConfig).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}
