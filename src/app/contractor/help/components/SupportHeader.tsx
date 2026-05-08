import React from 'react'
import { HelpCircle, Gavel, LifeBuoy } from 'lucide-react'

interface SupportHeaderProps {
    activeTab: 'faq' | 'disputes'
    setActiveTab: (tab: 'faq' | 'disputes') => void
}

export const SupportHeader: React.FC<SupportHeaderProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="space-y-6 pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <LifeBuoy className="w-8 h-8 text-blue-600" />
                        Hỗ trợ & Khiếu nại
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Giải đáp thắc mắc, xử lý kỹ thuật và hòa giải tranh chấp B2B</p>
                </div>

                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab('faq')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'faq' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <HelpCircle size={18} /> Hỏi đáp & AI
                    </button>
                    <button
                        onClick={() => setActiveTab('disputes')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'disputes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Gavel size={18} /> Khiếu nại & Hòa giải
                    </button>
                </div>
            </div>
        </div>
    )
}
