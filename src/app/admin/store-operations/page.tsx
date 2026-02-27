'use client'

import React, { useState, useEffect } from 'react'
import {
    Store, Truck, Wallet, FileText, DollarSign,
    GanttChart, Plus, PlusCircle, CheckCircle, Edit
} from 'lucide-react'
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import FormattedNumberInput from '@/components/FormattedNumberInput'
import { Skeleton } from '@/components/ui/skeleton'

import {
    QuickQuote, DispatchOrder, CashItem, Expense, Driver,
    getStatusInfo, formatCurrency,
} from './types'
import DispatchTab from './components/DispatchTab'
import CashTab from './components/CashTab'
import QuotesTab from './components/QuotesTab'
import ExpensesTab from './components/ExpensesTab'

// ─── Loading Skeleton ────────────────────────────────────────────────────────
function StoreOperationsSkeleton() {
    return (
        <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-20">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 rounded-xl" />
                        <Skeleton className="h-6 w-80 rounded-lg" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-14 w-44 rounded-2xl" />
                    <Skeleton className="h-14 w-44 rounded-2xl" />
                </div>
            </div>

            {/* Metrics Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/50 rounded-[32px] p-7 border border-slate-100/50 shadow-sm">
                        <div className="flex justify-between mb-4">
                            <Skeleton className="h-3 w-32 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-xl" />
                        </div>
                        <Skeleton className="h-8 w-48 rounded-xl" />
                    </div>
                ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="bg-white/50 rounded-[40px] border border-slate-100/50 shadow-xl overflow-hidden min-h-[600px]">
                <div className="flex items-center gap-3 px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-40 rounded-2xl" />)}
                </div>
                <div className="p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-slate-50/50 rounded-[32px] p-6 border border-slate-100 min-h-[500px]">
                            <div className="flex justify-between items-center mb-6">
                                <Skeleton className="h-5 w-40 rounded-lg" />
                                <Skeleton className="h-6 w-20 rounded-xl" />
                            </div>
                            <Skeleton className="h-12 w-full rounded-2xl mb-6" />
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-5 w-48 rounded-lg" />
                                <Skeleton className="h-6 w-24 rounded-xl" />
                            </div>
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-white/50 rounded-[28px] p-6 border border-slate-100">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Skeleton className="h-12 w-12 rounded-2xl" />
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-32 rounded-lg" />
                                                <Skeleton className="h-3 w-20 rounded-md" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-20 w-full rounded-2xl" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


// ─── Main Page ───────────────────────────────────────────────────────────────
export default function StoreOperationsPage() {
    const [activeTab, setActiveTab] = useState<'quotes' | 'dispatch' | 'cash' | 'expenses'>('dispatch')
    const [loading, setLoading] = useState(true)

    // Data
    const [quotes, setQuotes] = useState<QuickQuote[]>([])
    const [orders, setOrders] = useState<DispatchOrder[]>([])
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [cashItems, setCashItems] = useState<CashItem[]>([])
    const [cashHistoryItems, setCashHistoryItems] = useState<CashItem[]>([])
    const [expenses, setExpenses] = useState<Expense[]>([])

    // Pagination / filter
    const [cashSearchTerm, setCashSearchTerm] = useState('')
    const [cashPage, setCashPage] = useState(1)
    const [cashHistoryPage, setCashHistoryPage] = useState(1)
    const ITEMS_PER_PAGE = 5

    useEffect(() => { setCashPage(1); setCashHistoryPage(1) }, [cashSearchTerm])

    // DnD drag state
    const [activeOrder, setActiveOrder] = useState<DispatchOrder | null>(null)

    // Forms
    const [quoteForm, setQuoteForm] = useState({ customerName: '', customerPhone: '', totalAmount: 0, notes: '' })
    const [expenseForm, setExpenseForm] = useState({ category: 'FUEL', amount: 0, description: '' })

    // Modals
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(null)
    const [selectedQuote, setSelectedQuote] = useState<QuickQuote | null>(null)
    const [isQuoteDetailModalOpen, setIsQuoteDetailModalOpen] = useState(false)
    const [orderModalMode, setOrderModalMode] = useState<'view' | 'edit'>('view')

    useEffect(() => { fetchInitialData() }, [])

    const fetchInitialData = async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            const [dispatchRes, quotesRes, cashRes, expenseRes] = await Promise.all([
                fetchWithAuth('/api/store/dispatch', { cache: 'no-store' }),
                fetchWithAuth('/api/store/quotes', { cache: 'no-store' }),
                fetchWithAuth('/api/store/cash-handover', { cache: 'no-store' }),
                fetchWithAuth('/api/store/expenses', { cache: 'no-store' }),
            ])

            if (dispatchRes.ok) {
                const data = await dispatchRes.json()
                setOrders(data.data.orders.map((o: any) => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    customerName: o.customer?.user?.name || o.customer?.name || o.guestName || 'N/A',
                    status: o.status,
                    totalAmount: o.totalAmount,
                    driverId: o.driverId,
                })))
                setDrivers(data.data.drivers.map((d: any) => ({ id: d.id, user: d.user, status: 'AVAILABLE' })))
            }
            if (quotesRes.ok) setQuotes((await quotesRes.json()).data)
            if (cashRes.ok) {
                const data = await cashRes.json()
                setCashItems(data.data.pending.map((item: any) => ({
                    id: item.id,
                    orderNumber: item.orderNumber,
                    customerName: item.customer?.user?.name || item.customer?.name || item.guestName || 'N/A',
                    amount: item.totalAmount,
                    cashCollectedAt: item.cashCollectedAt,
                })))
                setCashHistoryItems(data.data.history.map((item: any) => ({
                    id: item.id,
                    orderNumber: item.orderNumber,
                    customerName: item.customer?.user?.name || item.customer?.name || item.guestName || 'N/A',
                    amount: item.totalAmount,
                    cashHandedOverAt: item.cashHandedOverAt,
                    driverName: item.driver?.user?.name || 'N/A',
                })))
            }
            if (expenseRes.ok) setExpenses((await expenseRes.json()).data)
        } catch (error) {
            console.error('[StoreOps] Fetch Error:', error)
            toast.error('Không thể tải dữ liệu cửa hàng')
        } finally {
            setLoading(false)
        }
    }

    // ─── DnD Handlers ────────────────────────────────────────────────────────
    const findColumn = (id: string) => {
        if (id === 'unassigned' || drivers.some(d => d.id === id)) return id
        const order = orders.find(o => o.id === id)
        if (!order) return null
        return order.driverId || 'unassigned'
    }

    const handleDragStart = (event: DragStartEvent) => {
        const order = orders.find(o => o.id === (event.active.id as string))
        if (order) setActiveOrder(order)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return
        const activeColumn = findColumn(active.id as string)
        const overColumn = findColumn(over.id as string)
        if (!activeColumn || !overColumn || activeColumn === overColumn) return
        setOrders(prev => {
            const idx = prev.findIndex(o => o.id === active.id)
            const newOrders = [...prev]
            newOrders[idx] = { ...newOrders[idx], driverId: overColumn === 'unassigned' ? null : overColumn }
            return newOrders
        })
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveOrder(null)
        if (!over) return
        const overColumn = findColumn(over.id as string)
        if (!overColumn) return
        const targetDriverId = overColumn === 'unassigned' ? null : overColumn
        if (activeOrder && activeOrder.driverId !== targetDriverId) {
            try {
                const res = await fetchWithAuth('/api/store/dispatch', {
                    method: 'PUT',
                    body: JSON.stringify({ orderId: active.id, driverId: targetDriverId }),
                })
                if (res.ok) {
                    toast.success(targetDriverId ? 'Đã gán tài xế thành công' : 'Đã gỡ tài xế')
                } else {
                    toast.error('Không thể cập nhật điều phối')
                    fetchInitialData(true)
                }
            } catch {
                toast.error('Có lỗi xảy ra')
                fetchInitialData(true)
            }
        }
    }

    const handleStartTrip = async (driverId: string) => {
        try {
            toast.loading('Đang xử lý xuất kho...', { id: 'dispatch' })
            const res = await fetchWithAuth('/api/store/dispatch/confirm-trip', {
                method: 'POST',
                body: JSON.stringify({ driverId }),
            })
            if (res.ok) {
                toast.success('Bác tài đã xuất bến!', { id: 'dispatch' })
                setOrders(prev => prev.map(o => o.driverId === driverId ? { ...o, status: 'SHIPPED' } : o))
                setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'ON_TRIP' } : d))
                fetchInitialData(true)
            } else {
                toast.error('Không thể xác nhận xuất xe', { id: 'dispatch' })
            }
        } catch {
            toast.error('Có lỗi xảy ra khi xác nhận xuất xe', { id: 'dispatch' })
        }
    }

    // ─── Modal & action handlers ──────────────────────────────────────────────
    const handleViewDetail = (orderId: string) => {
        const order = orders.find(o => o.id === orderId)
        if (order) { setSelectedOrder(order); setOrderModalMode('view') }
    }

    const handleEditOrder = (orderId: string) => {
        const order = orders.find(o => o.id === orderId)
        if (order) { setSelectedOrder(order); setOrderModalMode('edit') }
    }

    const handleAssignDriver = async (orderId: string, driverId: string | null) => {
        try {
            const res = await fetchWithAuth('/api/store/dispatch', {
                method: 'PUT',
                body: JSON.stringify({ orderId, driverId }),
            })
            if (res.ok) {
                toast.success(driverId ? 'Đã gán tài xế thành công' : 'Đã gỡ tài xế')
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, driverId } : o))
                setSelectedOrder(prev => prev ? { ...prev, driverId } : null)
            } else {
                toast.error('Không thể cập nhật')
            }
        } catch { toast.error('Có lỗi xảy ra') }
    }

    const handleConfirmCash = async (orderId: string) => {
        try {
            const res = await fetchWithAuth('/api/store/cash-handover', {
                method: 'PUT',
                body: JSON.stringify({ orderId }),
            })
            if (res.ok) {
                toast.success('Đã nhận tiền thành công')
                const itemToMove = cashItems.find(i => i.id === orderId)
                if (itemToMove) {
                    setCashItems(prev => prev.filter(i => i.id !== orderId))
                    setCashHistoryItems(prev => [{ ...itemToMove, cashHandedOverAt: new Date().toISOString() }, ...prev])
                }
                fetchInitialData(true)
            } else {
                toast.error('Không thể cập nhật đối soát')
            }
        } catch { toast.error('Có lỗi xảy ra') }
    }

    const handleQuoteSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetchWithAuth('/api/store/quotes', {
                method: 'POST',
                body: JSON.stringify({ ...quoteForm, items: [] }),
            })
            if (res.ok) {
                toast.success('Đã tạo báo giá')
                setIsQuoteModalOpen(false)
                setQuoteForm({ customerName: '', customerPhone: '', totalAmount: 0, notes: '' })
                fetchInitialData()
            }
        } catch { toast.error('Có lỗi xảy ra') }
    }

    const handleDeleteQuote = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa báo giá này?')) return
        try {
            const res = await fetchWithAuth(`/api/store/quotes/${id}`, { method: 'DELETE' })
            if (res.ok) { toast.success('Đã xóa báo giá'); fetchInitialData(true) }
            else toast.error('Không thể xóa báo giá')
        } catch { toast.error('Có lỗi xảy ra') }
    }

    const handleAcceptQuote = async (id: string) => {
        try {
            const res = await fetchWithAuth(`/api/store/quotes/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'ACCEPTED' }),
            })
            if (res.ok) { toast.success('Báo giá đã được khách chấp nhận!'); fetchInitialData(true) }
        } catch { toast.error('Có lỗi xảy ra') }
    }

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetchWithAuth('/api/store/expenses', {
                method: 'POST',
                body: JSON.stringify({ ...expenseForm, date: new Date().toISOString() }),
            })
            if (res.ok) {
                toast.success('Đã ghi chi phí')
                setIsExpenseModalOpen(false)
                setExpenseForm({ category: 'FUEL', amount: 0, description: '' })
                fetchInitialData()
            }
        } catch { toast.error('Có lỗi xảy ra') }
    }

    if (loading) return <StoreOperationsSkeleton />

    const tabs = [
        { id: 'dispatch', name: 'Điều Xe Giao Hàng', icon: Truck },
        { id: 'cash', name: 'Đối Soát COD', icon: Wallet },
        { id: 'quotes', name: 'Sổ Báo Giá', icon: FileText },
        { id: 'expenses', name: 'Chi Phí', icon: DollarSign },
    ] as const

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
                            <GanttChart className="w-7 h-7" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Vận Hành Hệ Thống
                        </h1>
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1 bg-slate-100/50 px-3 py-1 rounded-lg inline-block">
                        Trung tâm điều phối & Quản lý cửa hàng
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsQuoteModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                    >
                        <PlusCircle className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" /> Báo Giá Nhanh
                    </button>
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                    >
                        <DollarSign className="w-4 h-4" /> Ghi Chi Phí
                    </button>
                </div>
            </div>

            {/* Snapshot Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-7 shadow-sm border border-white/50 ring-1 ring-slate-200/50">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Tiền tài xế đang giữ</p>
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-orange-500" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(cashItems.reduce((a, c) => a + c.amount, 0))}</p>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-7 shadow-sm border border-white/50 ring-1 ring-slate-200/50">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Đơn chờ điều xe</p>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Truck className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-blue-600 tracking-tight">{orders.filter(o => !o.driverId).length} Đơn hàng</p>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-7 shadow-sm border border-white/50 ring-1 ring-slate-200/50">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Báo giá đang chờ</p>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 tracking-tight">{quotes.filter(q => q.status === 'PENDING').length} Bản thảo</p>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-7 shadow-sm border border-white/50 ring-1 ring-slate-200/50">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Chi phí hằng ngày</p>
                        <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-red-500" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-red-500 tracking-tight">{formatCurrency(expenses.reduce((a, c) => a + c.amount, 0))}</p>
                </div>
            </div>

            {/* Main Content Area with Glass Navigation */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-[44px] blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-white/70 backdrop-blur-2xl rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white/80 overflow-hidden min-h-[600px]">
                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1.5 px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-white text-blue-600 shadow-md shadow-slate-200/50 ring-1 ring-slate-100'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'opacity-70'}`} />
                                <span className="text-[11px] font-black uppercase tracking-widest">{tab.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-8 md:p-10">
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                            {activeTab === 'dispatch' && (
                                <DispatchTab
                                    orders={orders}
                                    drivers={drivers}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDragEnd={handleDragEnd}
                                    onStartTrip={handleStartTrip}
                                    onViewDetail={handleViewDetail}
                                    onEditOrder={handleEditOrder}
                                    activeOrder={activeOrder}
                                />
                            )}
                            {activeTab === 'cash' && (
                                <CashTab
                                    cashItems={cashItems}
                                    cashHistoryItems={cashHistoryItems}
                                    cashSearchTerm={cashSearchTerm}
                                    setCashSearchTerm={setCashSearchTerm}
                                    cashPage={cashPage}
                                    setCashPage={setCashPage}
                                    cashHistoryPage={cashHistoryPage}
                                    setCashHistoryPage={setCashHistoryPage}
                                    onConfirmCash={handleConfirmCash}
                                    ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                                />
                            )}
                            {activeTab === 'quotes' && (
                                <QuotesTab
                                    quotes={quotes}
                                    onAcceptQuote={handleAcceptQuote}
                                    onDeleteQuote={handleDeleteQuote}
                                    onViewDetail={(q) => { setSelectedQuote(q); setIsQuoteDetailModalOpen(true) }}
                                />
                            )}
                            {activeTab === 'expenses' && <ExpensesTab expenses={expenses} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
            {isQuoteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2"><PlusCircle className="text-blue-600" /> Tạo Báo Giá</h2>
                        <form onSubmit={handleQuoteSubmit} className="space-y-4">
                            <input type="text" required value={quoteForm.customerName} onChange={e => setQuoteForm({ ...quoteForm, customerName: e.target.value })} placeholder="Tên khách hàng" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" />
                            <input type="text" value={quoteForm.customerPhone} onChange={e => setQuoteForm({ ...quoteForm, customerPhone: e.target.value })} placeholder="Số điện thoại" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" />
                            <FormattedNumberInput value={quoteForm.totalAmount} onChange={val => setQuoteForm({ ...quoteForm, totalAmount: val })} placeholder="Số tiền báo giá" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-blue-600 text-xl" />
                            <textarea value={quoteForm.notes} onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })} placeholder="Ghi chú mặt hàng..." className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium" rows={3} />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsQuoteModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Hủy</button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200">Lưu &amp; Gửi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2"><DollarSign className="text-red-500" /> Ghi Chi Phí</h2>
                        <form onSubmit={handleExpenseSubmit} className="space-y-4">
                            <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold">
                                <option value="FUEL">Xăng dầu</option>
                                <option value="MAINTENANCE">Sửa chữa xe</option>
                                <option value="MEALS">Cơm nước/Bốc xếp</option>
                                <option value="OTHERS">Khác</option>
                            </select>
                            <FormattedNumberInput value={expenseForm.amount} onChange={val => setExpenseForm({ ...expenseForm, amount: val })} placeholder="Số tiền chi" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-red-500 text-xl" />
                            <input type="text" required value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Diễn giải chi phí" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium" />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Hủy</button>
                                <button type="submit" className="flex-[2] py-4 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-200">Xác Nhận Chi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">
                                        {orderModalMode === 'view' ? 'Chi tiết đơn hàng' : 'Chỉnh sửa đơn'}
                                    </p>
                                    <h2 className="text-xl font-black">{selectedOrder.orderNumber}</h2>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                    <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Khách hàng</p>
                                    <p className="font-bold text-slate-900 text-sm">{selectedOrder.customerName || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng tiền</p>
                                    <p className="font-black text-blue-600 text-lg">{formatCurrency(selectedOrder.totalAmount)}</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Trạng thái</p>
                                    <span className={`text-xs px-2.5 py-1 rounded-lg font-black inline-block ${getStatusInfo(selectedOrder.status).color}`}>
                                        {getStatusInfo(selectedOrder.status).label}
                                    </span>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tài xế</p>
                                    <p className="font-bold text-slate-900 text-sm">
                                        {selectedOrder.driverId ? drivers.find(d => d.id === selectedOrder.driverId)?.user.name || 'Đã gán' : '— Chưa gán'}
                                    </p>
                                </div>
                            </div>
                            {orderModalMode === 'edit' && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gán tài xế</p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleAssignDriver(selectedOrder.id, null)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-bold transition-all ${!selectedOrder.driverId ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                                        >
                                            ← Bỏ gán (chuyển về chờ điều xe)
                                        </button>
                                        {drivers.map(d => (
                                            <button
                                                key={d.id}
                                                onClick={() => handleAssignDriver(selectedOrder.id, d.id)}
                                                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-between ${selectedOrder.driverId === d.id ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-300 text-slate-700'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black ${d.status === 'ON_TRIP' ? 'bg-orange-500' : 'bg-blue-600'}`}>{d.user.name.charAt(0)}</span>
                                                    {d.user.name}
                                                </span>
                                                <span className={`text-[9px] font-bold uppercase ${d.status === 'ON_TRIP' ? 'text-orange-500' : 'text-emerald-500'}`}>
                                                    {d.status === 'ON_TRIP' ? 'Đang giao' : 'Rảnh'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setSelectedOrder(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all">Đóng</button>
                                {orderModalMode === 'view' ? (
                                    <button onClick={() => setOrderModalMode('edit')} className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                        <Edit className="w-4 h-4" /> Chỉnh sửa
                                    </button>
                                ) : (
                                    <button onClick={() => setOrderModalMode('view')} className="flex-[2] py-3.5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Xong
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isQuoteDetailModalOpen && selectedQuote && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsQuoteDetailModalOpen(false)}>
                    <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
                            <button onClick={() => setIsQuoteDetailModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Chi tiết báo giá</p>
                                    <h3 className="text-2xl font-black">{selectedQuote.customerName}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số điện thoại</p>
                                    <p className="text-lg font-black text-slate-900">{selectedQuote.customerPhone || '—'}</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Tổng tiền</p>
                                    <p className="text-lg font-black text-blue-600">{formatCurrency(selectedQuote.totalAmount)}</p>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ghi chú mặt hàng</p>
                                <p className="text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                                    {selectedQuote.notes || 'Không có ghi chú bổ sung.'}
                                </p>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                                <div className="flex flex-col gap-1">
                                    <span>Trạng thái: <span className={selectedQuote.status === 'ACCEPTED' ? 'text-emerald-500' : 'text-orange-500'}>{selectedQuote.status}</span></span>
                                    <span>Nhân viên: <span className="text-slate-600">{selectedQuote.staffName || 'Hệ thống'}</span></span>
                                </div>
                                <span>Ngày tạo: {new Date(selectedQuote.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setIsQuoteDetailModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all">Đóng</button>
                                {selectedQuote.status !== 'ACCEPTED' && (
                                    <button
                                        onClick={() => { handleAcceptQuote(selectedQuote.id); setIsQuoteDetailModalOpen(false) }}
                                        className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                                    >
                                        Chấp nhận báo giá
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
