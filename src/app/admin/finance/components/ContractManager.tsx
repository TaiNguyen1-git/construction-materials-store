'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
    FileText, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, Coins, Users, Calendar, RefreshCw, Search, Eye, Briefcase, ShieldCheck, AlertCircle, Tag, BarChart, ChevronDown, ArrowUpRight, List, Loader2
} from 'lucide-react'

interface Contract {
    id: string
    contractNumber: string
    name: string
    customerId: string
    customer: { user: { name: string } }
    contractType: string
    status: string
    validFrom: string
    validTo: string
    creditTermDays: number
    _count: { contractPrices: number }
    createdAt: string
}

interface PriceList {
    id: string
    code: string
    name: string
    discountPercent: number
    customerTypes: string[]
    priority: number
    isActive: boolean
}

export default function ContractManager() {
    const [activeTab, setActiveTab] = useState<'contracts' | 'price-lists'>('contracts')
    const [contracts, setContracts] = useState<Contract[]>([])
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => { loadData() }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            const endpoint = activeTab === 'contracts' ? '/api/contracts' : '/api/price-lists'
            const res = await fetch(endpoint)
            const data = await res.json()
            if (activeTab === 'contracts') setContracts(data)
            else setPriceLists(data)
        } catch (error) { toast.error('Lỗi tải dữ liệu') }
        setLoading(false)
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
            case 'DRAFT': return 'bg-slate-50 text-slate-400 border-slate-100'
            case 'EXPIRED': return 'bg-red-50 text-red-600 border-red-100'
            default: return 'bg-slate-100 text-slate-500 border-slate-200'
        }
    }

    const filteredContracts = contracts.filter(c => {
        const matchSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.contractNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchStatus = !statusFilter || c.status === statusFilter
        return matchSearch && matchStatus
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl w-max border border-slate-200/50">
                    <button onClick={() => setActiveTab('contracts')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'contracts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Briefcase size={14} /> Danh sách hợp đồng
                    </button>
                    <button onClick={() => setActiveTab('price-lists')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'price-lists' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Tag size={14} /> Bảng giá B2B
                    </button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => toast.error('Tính năng đang được tích hợp')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"><Plus size={14} /> Soạn hợp đồng</button>
                    <button onClick={loadData} className="bg-white text-slate-400 px-3 py-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            {activeTab === 'contracts' ? (
                <div className="space-y-4">
                    <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-center">
                        <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Tìm kiếm hợp đồng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-xs font-bold" /></div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase text-slate-400 outline-none"><option value="">Tất cả trạng thái</option><option value="ACTIVE">Hiệu lực</option><option value="DRAFT">Bản nháp</option></select>
                    </div>

                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest"><tr><th className="px-6 py-4 text-left">Hợp đồng</th><th className="px-6 py-4 text-left">Đối tác</th><th className="px-4 py-4 text-center">Hiệu lực</th><th className="px-4 py-4 text-center">Sản phẩm</th><th className="px-4 py-4 text-center">Trạng thái</th><th className="px-6 py-4 text-right">Thao tác</th></tr></thead>
                            <tbody className="divide-y divide-slate-50">{loading ? <tr><td colSpan={6} className="py-12 text-center text-[10px] font-black text-slate-300 uppercase animate-pulse">Đang tải danh sách...</td></tr> : filteredContracts.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-[10px] font-black text-slate-300 uppercase italic">Không tìm thấy dữ liệu</td></tr> : filteredContracts.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50/50 group"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><FileText size={14} /></div><div><div className="text-xs font-black text-slate-900 uppercase tracking-tight">{c.name}</div><div className="text-[8px] font-mono font-bold text-slate-400 mt-0.5">#{c.contractNumber}</div></div></div></td><td className="px-6 py-4"><div className="flex items-center gap-2"><Users size={12} className="text-blue-400" /><span className="text-xs font-bold text-slate-600">{c.customer?.user?.name || 'N/A'}</span></div></td><td className="px-4 py-4 text-center"><div className="text-[10px] font-bold text-slate-600">{new Date(c.validFrom).toLocaleDateString('vi-VN')} - {new Date(c.validTo).toLocaleDateString('vi-VN')}</div></td><td className="px-4 py-4 text-center"><div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-md text-[10px] font-bold text-slate-500"><List size={10} />{c._count.contractPrices}</div></td><td className="px-4 py-4 text-center"><span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${getStatusStyle(c.status)}`}>{c.status}</span></td><td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity"><div className="flex justify-end gap-1"><button className="p-1.5 text-slate-400 hover:text-blue-600"><Eye size={14} /></button><button className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button></div></td></tr>
                            ))}</tbody>
                        </table></div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? <div className="col-span-full py-12 text-center text-[10px] font-black text-slate-300 uppercase animate-pulse">Đang tải bảng giá...</div> : priceLists.length === 0 ? <div className="col-span-full py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center text-[10px] font-black text-slate-400 uppercase italic">Chưa cấu hình bảng giá đặc thù</div> : priceLists.map(p => (
                        <div key={p.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="flex justify-between items-start mb-4"><span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${p.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{p.isActive ? 'Active' : 'Draft'}</span><span className="text-[8px] font-black text-slate-300 uppercase">Priority #{p.priority}</span></div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{p.name}</h3>
                            <div className="text-[8px] font-mono font-bold text-slate-400 uppercase mt-1">CODE: {p.code}</div>
                            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"><div className="text-[8px] font-black text-slate-400 uppercase italic mb-1">Contractual Discount</div><div className="flex items-baseline gap-1"><span className="text-2xl font-black text-slate-900">{p.discountPercent}</span><span className="text-xs font-black text-blue-600">%</span></div></div>
                            <div className="mt-4 flex flex-wrap gap-1">
                                {p.customerTypes.map((type, idx) => <span key={idx} className="px-2 py-0.5 bg-white border border-slate-100 rounded text-[7px] font-black text-slate-400 uppercase tracking-widest">{type}</span>)}
                            </div>
                            <div className="mt-6 flex gap-2"><button className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all">Sửa</button><button className="flex-1 py-2 bg-slate-100 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">Xóa</button></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
