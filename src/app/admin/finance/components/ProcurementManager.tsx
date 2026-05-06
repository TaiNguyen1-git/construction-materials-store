'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
    Package, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock, Truck, ShoppingCart, RefreshCw, Plus, ArrowRight, Search, Cpu, Boxes, BarChart3, Zap, History, FileText, Sparkles
} from 'lucide-react'
import SupplierAutocomplete from '../../components/SupplierAutocomplete'

interface PurchaseSuggestion {
    productId: string
    productName: string
    productSku: string
    categoryName: string
    currentStock: number
    reorderPoint: number
    suggestedQty: number
    avgDailySales: number
    daysUntilStockout: number
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
    bestSupplier?: { id: string, name: string, unitPrice: number, leadTimeDays: number }
    estimatedCost: number
}

interface PurchaseRequest {
    id: string
    requestNumber: string
    productId: string
    productName?: string
    productSku?: string
    supplierId?: string
    supplierName?: string
    requestedQty: number
    currentStock: number
    estimatedCost?: number
    source: string
    status: string
    priority: string
    createdAt: string
}

export default function ProcurementManager() {
    const [activeTab, setActiveTab] = useState<'suggestions' | 'requests'>('suggestions')
    const [searchTerm, setSearchTerm] = useState('')
    const queryClient = useQueryClient()

    const { data: suggestions = [], isLoading: loadingSuggestions, refetch: refetchSuggestions } = useQuery({
        queryKey: ['procurement', 'suggestions'],
        queryFn: async () => {
            const res = await fetch('/api/procurement?type=suggestions')
            return res.json() as Promise<PurchaseSuggestion[]>
        }
    })

    const { data: requests = [], isLoading: loadingRequests, refetch: refetchRequests } = useQuery({
        queryKey: ['procurement', 'requests'],
        queryFn: async () => {
            const res = await fetch('/api/procurement?type=requests')
            return res.json() as Promise<PurchaseRequest[]>
        }
    })

    const assignSupplierMutation = useMutation({
        mutationFn: async ({ requestId, supplierId }: { requestId: string, supplierId: string }) => {
            await fetch('/api/procurement', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'assign-supplier', requestId, supplierId })
            })
        },
        onSuccess: () => { toast.success('Đã cập nhật nhà cung cấp'); queryClient.invalidateQueries({ queryKey: ['procurement', 'requests'] }) }
    })

    const createRequestMutation = useMutation({
        mutationFn: async (suggestion: PurchaseSuggestion) => {
            await fetch('/api/procurement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create-request', productId: suggestion.productId, requestedQty: suggestion.suggestedQty, supplierId: suggestion.bestSupplier?.id })
            })
        },
        onSuccess: () => { toast.success('Đã tạo phiếu yêu cầu'); queryClient.invalidateQueries({ queryKey: ['procurement'] }) }
    })

    const approveRequestMutation = useMutation({
        mutationFn: async (requestId: string) => {
            await fetch('/api/procurement', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve', requestId, approvedBy: 'admin' })
            })
        },
        onSuccess: () => { toast.success('Đã phê duyệt'); queryClient.invalidateQueries({ queryKey: ['procurement', 'requests'] }) }
    })

    const handleAutoGenerate = async () => {
        try {
            const res = await fetch('/api/procurement', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'auto-generate' }) })
            const data = await res.json()
            toast.success(data.message || 'Đã phân tích xong lô hàng AI')
            queryClient.invalidateQueries({ queryKey: ['procurement'] })
        } catch (error) { toast.error('Tiến trình AI gặp sự cố') }
    }

    const formatCurrency = (amount: number | undefined | null) => {
        if (!amount) return '-'
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
    }

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-50 text-red-600 border-red-100'
            case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-100'
            case 'MEDIUM': return 'bg-blue-50 text-blue-600 border-blue-100'
            default: return 'bg-slate-50 text-slate-500 border-slate-100'
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100'
            case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
            case 'CONVERTED': return 'bg-blue-50 text-blue-600 border-blue-100'
            default: return 'bg-slate-50 text-slate-500 border-slate-100'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl w-max border border-slate-200/50">
                    <button onClick={() => setActiveTab('suggestions')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'suggestions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        <BarChart3 size={14} /> Gợi ý AI tối ưu tồn kho
                    </button>
                    <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        <FileText size={14} /> Lịch sử yêu cầu
                    </button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.location.href = '/admin/procurement-management/wizard'} className="bg-white text-blue-600 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-blue-100 hover:bg-blue-50 transition-all flex items-center gap-2"><Sparkles size={14} className="text-blue-500" /> Wizard</button>
                    <button onClick={handleAutoGenerate} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center gap-2"><Zap size={14} className="text-amber-400 fill-amber-400" /> AI Auto-Generate</button>
                    <button onClick={() => { refetchSuggestions(); refetchRequests(); }} className="bg-white text-slate-400 px-3 py-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all"><RefreshCw size={14} className={loadingSuggestions || loadingRequests ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            {activeTab === 'suggestions' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loadingSuggestions ? <div className="col-span-full py-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Đang phân tích dữ liệu kho AI...</div> : suggestions.length === 0 ? <div className="col-span-full py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center text-[10px] font-black text-slate-400 uppercase">Tồn kho hiện tại đang ở mức an toàn</div> : suggestions.map(s => (
                        <div key={s.productId} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className={`absolute top-4 right-4 px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${getPriorityStyle(s.priority)}`}>{s.priority}</div>
                            <div className="mb-4">
                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{s.categoryName}</div>
                                <h3 className="text-sm font-black text-slate-900 mt-1 uppercase line-clamp-1">{s.productName}</h3>
                                <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">SKU: {s.productSku}</div>
                            </div>
                            <div className="flex justify-between items-end mb-4">
                                <div><span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Hiện có</span><span className={`text-xl font-black ${s.currentStock <= s.reorderPoint ? 'text-red-600' : 'text-slate-900'}`}>{s.currentStock}</span></div>
                                <div className="text-right"><span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Khuyên nhập</span><span className="text-xl font-black text-blue-600">+{s.suggestedQty}</span></div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden mb-4"><div className={`h-full rounded-full ${s.currentStock <= s.reorderPoint ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (s.currentStock / s.reorderPoint) * 50)}%` }}></div></div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center mb-4"><span className="text-[9px] font-black text-slate-400 uppercase">Ước tính chi phí:</span><span className="text-[11px] font-black text-slate-900">{formatCurrency(s.estimatedCost)}</span></div>
                            <button onClick={() => createRequestMutation.mutate(s)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"><Plus size={14} /> Khởi tạo yêu cầu nhập</button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest"><tr><th className="px-6 py-4 text-left">Yêu cầu</th><th className="px-6 py-4 text-left">Sản phẩm</th><th className="px-6 py-4 text-left">Nhà cung cấp</th><th className="px-4 py-4 text-right">Số lượng</th><th className="px-4 py-4 text-center">Trạng thái</th><th className="px-6 py-4 text-right">Thao tác</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">{loadingRequests ? <tr><td colSpan={6} className="py-12 text-center text-[10px] font-black text-slate-300 uppercase animate-pulse">Đang tải lịch sử...</td></tr> : requests.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-[10px] font-black text-slate-300 uppercase italic">Chưa có bản ghi nào</td></tr> : requests.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/50 group"><td className="px-6 py-4"><div className="text-xs font-black text-slate-900 uppercase tracking-tight">{r.requestNumber}</div><div className="text-[8px] text-slate-400 font-bold uppercase mt-1">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</div></td><td className="px-6 py-4"><div className="text-xs font-black text-slate-900 line-clamp-1">{r.productName}</div></td><td className="px-6 py-4 min-w-[200px]">{r.supplierName ? <span className="text-xs font-bold text-slate-600">{r.supplierName}</span> : <SupplierAutocomplete value="" placeholder="Chỉ định NCC..." className="w-full bg-slate-50 border-none rounded-xl px-2 py-1.5 text-[9px] font-black uppercase" onChange={(sid) => sid && assignSupplierMutation.mutate({ requestId: r.id, supplierId: sid })} />}</td><td className="px-4 py-4 text-right text-xs font-black text-slate-900">{r.requestedQty}</td><td className="px-4 py-4 text-center"><span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${getStatusStyle(r.status)}`}>{r.status}</span></td><td className="px-6 py-4 text-right">{r.status === 'PENDING' && <button onClick={() => approveRequestMutation.mutate(r.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle size={14} /></button>}</td></tr>
                        ))}</tbody>
                    </table></div>
                </div>
            )}
        </div>
    )
}
