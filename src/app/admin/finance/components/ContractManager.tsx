'use client'
// Force rebuild - 2026-05-13 v2

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
    FileText, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, Coins, Users, Calendar, RefreshCw, Search, Eye, Briefcase, ShieldCheck, AlertCircle, Tag, BarChart, ChevronDown, ArrowUpRight, List, Loader2, X
} from 'lucide-react'

interface Contract {
    id: string
    contractNumber: string
    name: string
    customerId: string
    customer?: { 
        user?: { 
            name: string
            email?: string 
        } 
    }
    contractType: string
    status: string
    validFrom: string
    validTo: string
    creditTermDays: number
    contractPrices?: any[]
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
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createForm, setCreateForm] = useState({
        customerId: '',
        name: '',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        creditTermDays: 30,
        products: []
    })
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    useEffect(() => { 
        loadData()
        fetchCustomers()
    }, [activeTab])

    const handleViewContract = async (contract: Contract) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/contracts?contractId=${contract.id}`)
            if (res.ok) {
                const data = await res.json()
                setSelectedContract(data)
                setIsDetailModalOpen(true)
            }
        } catch (e) { toast.error('Lỗi khi tải chi tiết') }
        setLoading(false)
    }

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers?type=CONTRACTOR,WHOLESALE')
            if (res.ok) {
                const json = await res.json()
                setCustomers(json.data.data || [])
            }
        } catch (e) { console.error('Lỗi tải KH') }
    }

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

    const handleCreateContract = async () => {
        if (!createForm.customerId || !createForm.name) {
            return toast.error('Vui lòng điền đầy đủ thông tin')
        }
        
        setLoading(true)
        try {
            const res = await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...createForm,
                    // Mặc định thêm 1 sản phẩm mẫu nếu chưa chọn để khớp API requirement (v1)
                    products: [{ productId: 'dummy', discountPercent: 0 }] 
                })
            })
            if (res.ok) {
                toast.success('Đã tạo bản thảo hợp đồng')
                setIsCreateModalOpen(false)
                loadData()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Lỗi khi tạo')
            }
        } catch (e) { toast.error('Lỗi kết nối') }
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

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Đang hiệu lực'
            case 'DRAFT': return 'Bản nháp'
            case 'EXPIRED': return 'Hết hạn'
            case 'CANCELLED': return 'Đã hủy'
            default: return status
        }
    }

    const handleDeleteContract = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) return
        try {
            const res = await fetch(`/api/contracts?contractId=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Đã xóa hợp đồng')
                loadData()
            }
        } catch (e) { toast.error('Lỗi khi xóa') }
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
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"><Plus size={14} /> Soạn hợp đồng</button>
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
                                <tr key={c.id} className="hover:bg-slate-50/50 group"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><FileText size={14} /></div><div><div className="text-xs font-black text-slate-900 uppercase tracking-tight">{c.name}</div><div className="text-[8px] font-mono font-bold text-slate-400 mt-0.5">#{c.contractNumber}</div></div></div></td><td className="px-6 py-4"><div className="flex items-center gap-2"><Users size={12} className="text-blue-400" /><span className="text-xs font-bold text-slate-600">{c.customer?.user?.name || 'N/A'}</span></div></td><td className="px-4 py-4 text-center"><div className="text-[10px] font-bold text-slate-600">{new Date(c.validFrom).toLocaleDateString('vi-VN')} - {new Date(c.validTo).toLocaleDateString('vi-VN')}</div></td><td className="px-4 py-4 text-center"><div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-md text-[10px] font-bold text-slate-500"><List size={10} />{c._count.contractPrices}</div></td><td className="px-4 py-4 text-center"><span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${getStatusStyle(c.status)}`}>{getStatusLabel(c.status)}</span></td><td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity"><div className="flex justify-end gap-1"><button onClick={() => handleViewContract(c)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-all"><Eye size={14} /></button><button onClick={() => handleDeleteContract(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={14} /></button></div></td></tr>
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

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 space-y-6">
                        <div><h3 className="text-lg font-black text-slate-900 uppercase">Soạn hợp đồng B2B mới</h3><p className="text-[10px] font-black text-slate-400 uppercase">Khởi tạo bản thảo hợp đồng thương mại</p></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Khách hàng đối tác</label>
                                <select className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-xs font-black outline-none" value={createForm.customerId} onChange={(e) => setCreateForm({...createForm, customerId: e.target.value})}>
                                    <option value="">Chọn khách hàng...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name || 'N/A'}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Tên hợp đồng / Dự án</label>
                                <input type="text" value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})} placeholder="VD: Cung ứng vật liệu cao tốc 2026..." className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-xs font-black" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Ngày hiệu lực</label>
                                <input type="date" value={createForm.validFrom} onChange={(e) => setCreateForm({...createForm, validFrom: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-xs font-black" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Ngày hết hạn</label>
                                <input type="date" value={createForm.validTo} onChange={(e) => setCreateForm({...createForm, validTo: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-xs font-black" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Hạn mức nợ (Ngày)</label>
                                <input type="number" value={createForm.creditTermDays} onChange={(e) => setCreateForm({...createForm, creditTermDays: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-xs font-black" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">Hủy bỏ</button>
                            <button onClick={handleCreateContract} disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Tạo bản thảo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal chi tiết hợp đồng */}
            {isDetailModalOpen && selectedContract && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl p-0 overflow-hidden">
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${getStatusStyle(selectedContract.status)}`}>{getStatusLabel(selectedContract.status)}</span>
                                <h3 className="text-xl font-black text-slate-900 uppercase mt-2">{selectedContract.name}</h3>
                                <p className="text-[10px] font-mono text-slate-400">#{selectedContract.contractNumber}</p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">Đối tác</label>
                                    <div className="text-sm font-bold text-slate-700">{selectedContract.customer?.user?.name || 'N/A'}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">Hiệu lực</label>
                                    <div className="text-sm font-bold text-slate-700">{new Date(selectedContract.validFrom).toLocaleDateString('vi-VN')} - {new Date(selectedContract.validTo).toLocaleDateString('vi-VN')}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">Hạn mức nợ</label>
                                    <div className="text-sm font-bold text-slate-700">{selectedContract.creditTermDays} ngày</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">Số lượng sản phẩm</label>
                                    <div className="text-sm font-bold text-slate-700">{selectedContract._count?.contractPrices || 0} mục</div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Danh mục giá ưu đãi</label>
                                {selectedContract.contractPrices && selectedContract.contractPrices.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedContract.contractPrices.map((p: any) => (
                                            <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                                <span className="text-xs font-bold text-slate-600">{p.product?.name}</span>
                                                <span className="text-xs font-black text-blue-600">{p.fixedPrice?.toLocaleString()} đ</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-[10px] font-black text-slate-300 uppercase italic">Chưa có sản phẩm nào được gán giá ưu đãi</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                            <button className="flex-1 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-black text-[10px] uppercase hover:bg-slate-100 transition-all flex items-center justify-center gap-2"><FileText size={14} /> Xuất PDF</button>
                            <button className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all">Kích hoạt hiệu lực</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
