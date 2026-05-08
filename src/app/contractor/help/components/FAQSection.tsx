import React from 'react'
import { Search, Wallet, Truck, ShieldCheck, Gavel, ChevronDown, ChevronRight } from 'lucide-react'
import { FAQCategory } from '../types'

interface FAQSectionProps {
    searchTerm: string
    setSearchTerm: (term: string) => void
    filteredFAQs: FAQCategory[]
    expandedCategory: number | null
    setExpandedCategory: (id: number | null) => void
    setActiveTab: (tab: 'faq' | 'disputes') => void
}

export const FAQSection: React.FC<FAQSectionProps> = ({
    searchTerm,
    setSearchTerm,
    filteredFAQs,
    expandedCategory,
    setExpandedCategory,
    setActiveTab
}) => {
    return (
        <div className="space-y-12">
            {/* FAQ Search */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10 space-y-6 text-center max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-slate-900">Bạn cần giúp đỡ điều gì?</h2>
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Nhập vấn đề bạn đang gặp phải (ví dụ: thanh toán, vận chuyển...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-2xl text-base focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all font-semibold placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {['Thanh toán ví', 'Vận chuyển vật tư', 'Bảo hiểm dự án', 'Khiếu nại cửa hàng'].map(tag => (
                            <button 
                                key={tag} 
                                onClick={() => setSearchTerm(tag)}
                                className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[11px] font-bold hover:bg-blue-50 hover:text-blue-600 transition-all"
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Category Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { id: 'payment', label: 'Tài chính & Ví', icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { id: 'logistics', label: 'Vận chuyển vật tư', icon: Truck, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { id: 'insurance', label: 'Bảo hiểm & Rủi ro', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { id: 'disputes', label: 'Khiếu nại B2B', icon: Gavel, color: 'text-purple-500', bg: 'bg-purple-50', tab: 'disputes' }
                ].map(cat => (
                    <div 
                        key={cat.id} 
                        onClick={() => {
                            if (cat.tab) {
                                setActiveTab(cat.tab as any)
                            } else {
                                setSearchTerm(cat.label)
                            }
                        }}
                        className="group bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer"
                    >
                        <div className={`w-14 h-14 ${cat.bg} ${cat.color} rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
                            <cat.icon size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{cat.label}</h3>
                        <p className="text-xs font-semibold text-slate-400 mt-2">Xem tài liệu liên quan</p>
                    </div>
                ))}
            </div>

            {/* FAQ Matrix */}
            <div className="grid gap-8">
                {filteredFAQs.map((category, catIdx) => {
                    const CategoryIcon = category.icon
                    const isExpanded = expandedCategory === catIdx

                    return (
                        <div key={catIdx} className={`bg-white rounded-2xl border ${isExpanded ? 'border-blue-200 shadow-lg shadow-blue-50' : 'border-slate-100 shadow-sm'} overflow-hidden transition-all duration-700`}>
                            <button
                                onClick={() => setExpandedCategory(isExpanded ? null : catIdx)}
                                className="w-full flex items-center gap-6 p-8 text-left hover:bg-slate-50/50 transition-all"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center`}>
                                    {/* @ts-ignore */}
                                    <CategoryIcon className="w-7 h-7 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900">{category.title}</h3>
                                    <p className="text-xs font-semibold text-slate-400">{category.faqs.length} câu hỏi thường gặp</p>
                                </div>
                                <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center transition-transform duration-500 ${isExpanded ? 'rotate-180 bg-blue-600 text-white' : 'text-slate-400'}`}>
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="px-8 pb-8 space-y-4">
                                    {category.faqs.map((faq, faqIdx) => (
                                        <details key={faqIdx} className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:bg-slate-50">
                                            <summary className="p-6 cursor-pointer list-none flex items-center justify-between">
                                                <span className="text-base font-bold text-slate-900 pr-8">{faq.question}</span>
                                                <ChevronRight className="w-5 h-5 text-slate-300 group-open:rotate-90 transition-transform" />
                                            </summary>
                                            <div className="px-6 pb-6 pt-0 border-t border-slate-50 mt-1">
                                                <p className="text-sm font-semibold text-slate-600 leading-relaxed italic pt-4">“{faq.answer}”</p>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
