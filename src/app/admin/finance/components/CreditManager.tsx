'use client'

import { useState, useEffect } from 'react'
import {
    CreditCard, AlertTriangle, CheckCircle, XCircle, Clock, Coins, Users, TrendingUp, Search, Filter, RefreshCw, ArrowUpRight, ArrowDownRight, ShieldAlert, ShieldCheck, Settings, User, Calendar, Briefcase, Trash2, RotateCcw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

interface DebtAgingReport {
    customerId: string
    customerName: string
    customerType: string
    totalDebt: number
    current: number
    days1to30: number
    days31to60: number
    days61to90: number
    over90: number
    maxOverdueDays: number
    creditLimit: number
    creditHold: boolean
}

interface CreditApproval {
    id: string
    customerId: string
    customer: { user: { name: string } }
    requestedAmount: number
    currentDebt: number
    creditLimit: number
    reason: string
    status: string
    createdAt: string
}

interface Configuration {
    name: string
    value: string
    description: string
}

export default function CreditManager() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'aging' | 'approvals' | 'config'>('aging')
    const [agingReport, setAgingReport] = useState<DebtAgingReport[]>([])
    const [pendingApprovals, setPendingApprovals] = useState<CreditApproval[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [configurations, setConfigurations] = useState<Configuration[]>([])
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [filters, setFilters] = useState({ customerType: 'ALL', status: 'ALL', minDebt: '' })
    const [selectedCustomer, setSelectedCustomer] = useState<DebtAgingReport | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editForm, setEditForm] = useState({ creditLimit: 0, creditHold: false, maxOverdueDays: 0 })

    useEffect(() => { loadData() }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'aging') {
                const res = await fetch('/api/credit?type=aging-report')
                setAgingReport(await res.json())
            } else if (activeTab === 'approvals') {
                const res = await fetch('/api/credit?type=pending-approvals')
                setPendingApprovals(await res.json())
            } else if (activeTab === 'config') {
                const res = await fetch('/api/credit?type=configurations')
                const data = await res.json()
                setConfigurations(data.length ? data : [
                    { name: 'DEFAULT_CREDIT_LIMIT', value: '50000000', description: 'Hạn mức tín dụng mặc định (VND)' },
                    { name: 'MAX_OVERDUE_DAYS', value: '30', description: 'Số ngày quá hạn tối đa trước khi khóa (Ngày)' },
                    { name: 'INTEREST_RATE', value: '0.05', description: 'Lãi suất phạt quá hạn (%)' }
                ])
            }
        } catch (error) { toast.error('Lỗi tải dữ liệu') }
        setLoading(false)
    }

    const handleApproval = async (approvalId: string, approved: boolean) => {
        try {
            await fetch('/api/credit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'process-approval', approvalId, approved, approvedBy: user?.id || 'system' })
            })
            loadData()
        } catch (error) { toast.error('Lỗi xử lý') }
    }

    const handleSaveAllConfigs = async () => {
        try {
            await Promise.all(configurations.map(config => fetch('/api/credit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update-config', configData: config })
            })))
            toast.success('Đã lưu cấu hình'); loadData()
        } catch (error) { toast.error('Lỗi lưu cấu hình') }
    }

    const handleUpdateCustomerCredit = async () => {
        if (!selectedCustomer) return
        try {
            const res = await fetch('/api/credit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update-customer-credit', customerId: selectedCustomer.customerId, ...editForm })
            })
            if (res.ok) { toast.success('Đã cập nhật'); setIsEditModalOpen(false); loadData() }
        } catch (error) { toast.error('Lỗi cập nhật') }
    }

    const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

    const filteredReport = agingReport.filter(r => {
        const matchesSearch = r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || r.customerId.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = filters.customerType === 'ALL' || r.customerType === filters.customerType
        const matchesStatus = filters.status === 'ALL' || (filters.status === 'BLOCK' ? r.creditHold : !r.creditHold)
        const matchesDebt = !filters.minDebt || r.totalDebt >= parseFloat(filters.minDebt)
        return matchesSearch && matchesType && matchesStatus && matchesDebt
    })

    return (
        <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-max border border-slate-200/50 mb-6">
                {[
                    { id: 'aging', label: 'Báo cáo tuổi nợ', icon: TrendingUp },
                    { id: 'approvals', label: 'Duyệt hạn mức', icon: CheckCircle, count: pendingApprovals.length },
                    { id: 'config', label: 'Chính sách', icon: Settings }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as 'aging' | 'approvals' | 'config')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        <tab.icon size={14} /> {tab.label} {tab.count ? <span className="ml-1 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px]">{tab.count}</span> : null}
                    </button>
                ))}
            </div>

            {activeTab === 'aging' && (
                <div className="space-y-4">
                    <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-center">
                        <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Tìm kiếm đối tác..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-xs font-bold" /></div>
                        <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${showAdvancedFilters ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}><Filter size={14} /> Bộ lọc</button>
                    </div>

                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest"><tr>
                                <th className="px-6 py-4 text-left">Đối tác</th><th className="px-4 py-4 text-right">Trong hạn</th><th className="px-4 py-4 text-right">Quá hạn</th><th className="px-6 py-4 text-right">Tổng nợ</th><th className="px-4 py-4 text-center">Trạng thái</th><th className="px-6 py-4 text-center">Thao tác</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-50">{loading ? <tr><td colSpan={6} className="py-12 text-center animate-pulse font-black text-[10px] text-slate-300 uppercase">Đang tải...</td></tr> : filteredReport.map(row => (
                                <tr key={row.customerId} className="hover:bg-slate-50/50 group"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><User size={14} /></div><div><div className="text-xs font-black text-slate-900">{row.customerName}</div><div className="text-[8px] font-black text-slate-400 uppercase">{row.customerType}</div></div></div></td><td className="px-4 py-4 text-right text-xs font-bold text-emerald-600">{formatCurrency(row.current)}</td><td className="px-4 py-4 text-right text-xs font-bold text-red-500">{formatCurrency(row.totalDebt - row.current)}</td><td className="px-6 py-4 text-right text-xs font-black text-slate-900">{formatCurrency(row.totalDebt)}</td><td className="px-4 py-4 text-center">{row.creditHold ? <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[8px] font-black uppercase">Blocked</span> : <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black uppercase">Active</span>}</td><td className="px-6 py-4 text-center"><button onClick={() => { setSelectedCustomer(row); setEditForm({ creditLimit: row.creditLimit, creditHold: row.creditHold, maxOverdueDays: row.maxOverdueDays }); setIsEditModalOpen(true) }} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Settings size={14} /></button></td></tr>
                            ))}</tbody>
                        </table></div>
                    </div>
                </div>
            )}

            {activeTab === 'approvals' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingApprovals.map(app => (
                        <div key={app.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-black text-slate-900 uppercase">{app.customer.user.name}</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase italic line-clamp-2">"{app.reason}"</p>
                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-end">
                                <div><span className="text-[8px] font-black text-slate-400 uppercase block">Yêu cầu</span><span className="text-xs font-black text-emerald-600">{formatCurrency(app.requestedAmount)}</span></div>
                                <div className="flex gap-2"><button onClick={() => handleApproval(app.id, true)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle size={14} /></button><button onClick={() => handleApproval(app.id, false)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"><XCircle size={14} /></button></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'config' && (
                <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {configurations.map((config, idx) => (
                            <div key={config.name || idx} className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{config.description}</label>
                                <input className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-black" value={config.value} onChange={(e) => { const newConfigs = [...configurations]; newConfigs[idx].value = e.target.value; setConfigurations(newConfigs) }} />
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t border-slate-50 flex justify-end"><button onClick={handleSaveAllConfigs} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">Lưu cấu hình hệ thống</button></div>
                </div>
            )}

            {isEditModalOpen && selectedCustomer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 space-y-6">
                        <div><h3 className="text-lg font-black text-slate-900 uppercase">{selectedCustomer.customerName}</h3><p className="text-[10px] font-black text-slate-400 uppercase">Cấu hình tín dụng cá nhân</p></div>
                        <div className="space-y-4">
                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase">Hạn mức (VND)</label><input type="number" value={editForm.creditLimit} onChange={(e) => setEditForm({ ...editForm, creditLimit: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-xs font-black" /></div>
                            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase">Kỳ hạn (Ngày)</label><input type="number" value={editForm.maxOverdueDays} onChange={(e) => setEditForm({ ...editForm, maxOverdueDays: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-xs font-black" /></div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl"><span className="text-[10px] font-black uppercase text-slate-600">Khóa tín dụng</span><button onClick={() => setEditForm({ ...editForm, creditHold: !editForm.creditHold })} className={`w-10 h-5 rounded-full transition-all relative ${editForm.creditHold ? 'bg-red-500' : 'bg-slate-200'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${editForm.creditHold ? 'left-5.5' : 'left-0.5'}`}></div></button></div>
                        </div>
                        <div className="flex gap-3 pt-4"><button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase">Hủy</button><button onClick={handleUpdateCustomerCredit} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20">Cập nhật</button></div>
                    </div>
                </div>
            )}
        </div>
    )
}
