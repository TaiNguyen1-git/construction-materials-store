import { Filter, ChevronDown } from 'lucide-react'
import { CATEGORIES } from './types'

interface ContractorFilterBarProps {
    filter: string
    setFilter: (val: string) => void
    sortBy: string
    setSortBy: (val: string) => void
    isSortOpen: boolean
    setIsSortOpen: (val: boolean) => void
}

export default function ContractorFilterBar({
    filter,
    setFilter,
    sortBy,
    setSortBy,
    isSortOpen,
    setIsSortOpen
}: ContractorFilterBarProps) {
    return (
        <div className="max-w-[1400px] mx-auto px-4 -mt-10 relative z-10">
            <div className="bg-white rounded-[32px] p-3 border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.08)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setFilter(cat.id)}
                            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[10px] font-black whitespace-nowrap transition-all duration-300 ${
                                filter === cat.id 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 scale-105' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <cat.icon className={`w-4 h-4 ${filter === cat.id ? 'animate-pulse' : ''}`} />
                            {cat.name.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className="relative sort-dropdown">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-4 px-6 py-3.5 bg-slate-50 rounded-2xl border border-slate-100/50 hover:border-blue-200 transition-all text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sắp xếp:</span>
                        </div>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest min-w-[120px]">
                            {sortBy}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSortOpen && (
                        <div className="absolute top-[calc(100%+8px)] right-0 w-64 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.12)] z-[100] animate-in fade-in zoom-in-95 duration-300">
                            <div className="py-2">
                                {['Mặc định', 'Đánh giá cao nhất', 'Kinh nghiệm lâu năm'].map((option) => (
                                    <button
                                        key={option}
                                        className={`w-full px-6 py-3.5 text-left text-[11px] font-black uppercase tracking-widest transition-all ${
                                            sortBy === option ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                                        }`}
                                        onClick={() => {
                                            setSortBy(option);
                                            setIsSortOpen(false);
                                        }}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
