'use client'

import React, { useState } from 'react'
import { GanttChart, PlusCircle, Coins } from 'lucide-react'
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'

// Types & Helpers
import {
    QuickQuote, DispatchOrder, CashItem, Expense, Driver
} from './types'

// Components
import DispatchTab from './components/DispatchTab'
import CashTab from './components/CashTab'
import QuotesTab from './components/QuotesTab'
import ExpensesTab from './components/ExpensesTab'
import StoreOperationsSkeleton from './components/StoreOperationsSkeleton'
import StoreMetrics from './components/StoreMetrics'

// Modals
import dynamic from 'next/dynamic'
const QuoteModal = dynamic(() => import('./components/modals/QuoteModal'))
const ExpenseModal = dynamic(() => import('./components/modals/ExpenseModal'))
const OrderActionModal = dynamic(() => import('./components/modals/OrderActionModal'))
const QuoteDetailModal = dynamic(() => import('./components/modals/QuoteDetailModal'))

export default function StoreOperationsPage() {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<'quotes' | 'dispatch' | 'cash' | 'expenses'>('dispatch')

    // Search & Pagination States
    const [cashSearchTerm, setCashSearchTerm] = useState('')
    const [cashPage, setCashPage] = useState(1)
    const [cashHistoryPage, setCashHistoryPage] = useState(1)
    const ITEMS_PER_PAGE = 5

    // Modal & Selection States
    const [activeOrder, setActiveOrder] = useState<DispatchOrder | null>(null)
    const [quoteForm, setQuoteForm] = useState({ customerName: '', customerPhone: '', totalAmount: 0, notes: '' })
    const [expenseForm, setExpenseForm] = useState({ category: 'FUEL', amount: 0, description: '' })
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(null)
    const [selectedQuote, setSelectedQuote] = useState<QuickQuote | null>(null)
    const [isQuoteDetailModalOpen, setIsQuoteDetailModalOpen] = useState(false)
    const [orderModalMode, setOrderModalMode] = useState<'view' | 'edit'>('view')

    // ─── React Query: Fetching ───────────────────────────────────────────
    
    // Dispatch Data (Orders & Drivers)
    const { data: dispatchData, isLoading: dispatchLoading } = useQuery({
        queryKey: ['store-dispatch'],
        queryFn: async () => {
            const res = await fetchWithAuth('/api/store/dispatch')
            if (!res.ok) throw new Error('Failed to fetch dispatch')
            const json = await res.json()
            return {
                orders: json.data.orders.map((o: any) => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    customerName: o.customer?.user?.name || o.customer?.name || o.guestName || 'N/A',
                    status: o.status,
                    totalAmount: o.totalAmount,
                    driverId: o.driverId,
                    deliveryToken: o.delivery?.deliveryToken,
                })),
                drivers: json.data.drivers.map((d: any) => ({
                    id: d.id,
                    user: d.user,
                    status: d.status || 'AVAILABLE'
                }))
            }
        },
        refetchInterval: 30000 
    })

    // Quotes Data
    const { data: quotes = [], isLoading: quotesLoading } = useQuery({
        queryKey: ['store-quotes'],
        queryFn: async () => {
            const res = await fetchWithAuth('/api/store/quotes')
            if (!res.ok) throw new Error('Failed to fetch quotes')
            return (await res.json()).data as QuickQuote[]
        }
    })

    // Cash Handover Data
    const { data: cashData, isLoading: cashLoading } = useQuery({
        queryKey: ['store-cash'],
        queryFn: async () => {
            const res = await fetchWithAuth('/api/store/cash-handover')
            if (!res.ok) throw new Error('Failed to fetch cash handover')
            const json = await res.json()
            return {
                pending: json.data.pending.map((item: any) => ({
                    id: item.id, orderNumber: item.orderNumber, customerName: item.customer?.user?.name || item.customer?.name || item.guestName || 'N/A',
                    amount: item.totalAmount, cashCollectedAt: item.cashCollectedAt
                })),
                history: json.data.history.map((item: any) => ({
                    id: item.id, orderNumber: item.orderNumber, customerName: item.customer?.user?.name || item.customer?.name || item.guestName || 'N/A',
                    amount: item.totalAmount, cashHandedOverAt: item.cashHandedOverAt, driverName: item.driver?.user?.name || 'N/A'
                }))
            }
        }
    })

    // Expenses Data
    const { data: expenses = [], isLoading: expensesLoading } = useQuery({
        queryKey: ['store-expenses'],
        queryFn: async () => {
            const res = await fetchWithAuth('/api/store/expenses')
            if (!res.ok) throw new Error('Failed to fetch expenses')
            return (await res.json()).data as Expense[]
        }
    })

    const orders = (dispatchData?.orders || []) as DispatchOrder[]
    const drivers = (dispatchData?.drivers || []) as Driver[]
    const cashItems = (cashData?.pending || []) as CashItem[]
    const cashHistoryItems = (cashData?.history || []) as CashItem[]

    // ─── React Query: Mutations ──────────────────────────────────────────

    const assignMutation = useMutation({
        mutationFn: async ({ orderId, driverId }: { orderId: string, driverId: string | null }) => {
            const res = await fetchWithAuth('/api/store/dispatch', {
                method: 'PUT', body: JSON.stringify({ orderId, driverId }),
            })
            if (!res.ok) throw new Error('Assign failed')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store-dispatch'] })
        },
        onError: () => toast.error('Không thể cập nhật điều phối')
    })

    const tripMutation = useMutation({
        mutationFn: async (driverId: string) => {
            const res = await fetchWithAuth('/api/store/dispatch/confirm-trip', {
                method: 'POST', body: JSON.stringify({ driverId }),
            })
            if (!res.ok) throw new Error('Trip failed')
        },
        onSuccess: () => {
            toast.success('Bác tài đã xuất bến!')
            queryClient.invalidateQueries({ queryKey: ['store-dispatch'] })
        }
    })

    const cashMutation = useMutation({
        mutationFn: async (orderId: string) => {
            const res = await fetchWithAuth('/api/store/cash-handover', { method: 'PUT', body: JSON.stringify({ orderId }) })
            if (!res.ok) throw new Error('Cash confirm failed')
        },
        onSuccess: () => {
            toast.success('Đã nhận tiền thành công')
            queryClient.invalidateQueries({ queryKey: ['store-cash'] })
        }
    })

    const quoteSubmitMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await fetchWithAuth('/api/store/quotes', {
                method: 'POST', body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error('Quote failed')
        },
        onSuccess: () => {
            toast.success('Đã tạo báo giá')
            setIsQuoteModalOpen(false)
            setQuoteForm({ customerName: '', customerPhone: '', totalAmount: 0, notes: '' })
            queryClient.invalidateQueries({ queryKey: ['store-quotes'] })
        }
    })

    const quoteActionMutation = useMutation({
        mutationFn: async ({ id, status, method }: { id: string, status?: string, method: string }) => {
            const res = await fetchWithAuth(`/api/store/quotes/${id}`, {
                method, body: status ? JSON.stringify({ status }) : undefined
            })
            if (!res.ok) throw new Error('Action failed')
        },
        onSuccess: () => {
            toast.success('Xử lý báo giá thành công')
            setIsQuoteDetailModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['store-quotes'] })
        }
    })

    const expenseMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await fetchWithAuth('/api/store/expenses', {
                method: 'POST', body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error('Expense failed')
        },
        onSuccess: () => {
            toast.success('Đã ghi chi phí')
            setIsExpenseModalOpen(false)
            setExpenseForm({ category: 'FUEL', amount: 0, description: '' })
            queryClient.invalidateQueries({ queryKey: ['store-expenses'] })
        }
    })

    // ─── DnD Handlers ────────────────────────────────────────────────────────
    const findColumn = (id: string) => (id === 'unassigned' || drivers.some(d => d.id === id)) ? id : (orders.find(o => o.id === id)?.driverId || 'unassigned')

    const handleDragStart = (event: DragStartEvent) => {
        const order = orders.find(o => o.id === (event.active.id as string))
        if (order) setActiveOrder(order)
    }

    const handleDragOver = (event: DragOverEvent) => {
        // No-op for now to avoid flickering, mutation will update cache
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveOrder(null)
        if (!over) return
        const overColumn = findColumn(over.id as string)
        if (!overColumn) return
        const targetDriverId = overColumn === 'unassigned' ? null : overColumn
        if (activeOrder && activeOrder.driverId !== targetDriverId) {
            assignMutation.mutate({ orderId: active.id as string, driverId: targetDriverId })
        }
    }

    if (dispatchLoading || quotesLoading || cashLoading || expensesLoading) return <StoreOperationsSkeleton />

    const tabs = [
        { id: 'dispatch', name: 'Điều Xe Giao Hàng', icon: 'Truck' },
        { id: 'cash', name: 'Đối Soát COD', icon: 'Wallet' },
        { id: 'quotes', name: 'Sổ Báo Giá', icon: 'FileText' },
        { id: 'expenses', name: 'Chi Phí', icon: 'Coins' },
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
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vận Hành Hệ Thống</h1>
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1 bg-slate-100/50 px-3 py-1 rounded-lg inline-block">
                        Trung tâm điều phối & Quản lý cửa hàng
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsQuoteModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                        <PlusCircle className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" /> Báo Giá Nhanh
                    </button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all">
                        <Coins className="w-4 h-4" /> Ghi Chi Phí
                    </button>
                </div>
            </div>

            <StoreMetrics 
                cashCollected={cashItems.reduce((a: number, c: CashItem) => a + c.amount, 0)}
                unassignedOrdersCount={orders.filter((o: DispatchOrder) => !o.driverId).length}
                pendingQuotesCount={quotes.filter((q: QuickQuote) => q.status === 'PENDING').length}
                totalExpenses={expenses.reduce((a: number, c: Expense) => a + c.amount, 0)}
            />

            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-[44px] blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-white/70 backdrop-blur-2xl rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white/80 overflow-hidden min-h-[600px]">
                    <div className="flex items-center gap-1.5 px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-md shadow-slate-200/50 ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>
                                <span className="text-[11px] font-black uppercase tracking-widest">{tab.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="p-8 md:p-10 animate-in fade-in zoom-in-95 duration-500">
                        {activeTab === 'dispatch' && (
                            <DispatchTab 
                                orders={orders} drivers={drivers} activeOrder={activeOrder}
                                onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
                                onStartTrip={(id: string) => tripMutation.mutate(id)} 
                                onViewDetail={(id: string) => { const o = orders.find((x: DispatchOrder)=>x.id===id); if(o){ setSelectedOrder(o); setOrderModalMode('view') } }}
                                onEditOrder={(id: string) => { const o = orders.find((x: DispatchOrder)=>x.id===id); if(o){ setSelectedOrder(o); setOrderModalMode('edit') } }}
                            />
                        )}
                        {activeTab === 'cash' && (
                            <CashTab 
                                cashItems={cashItems} cashHistoryItems={cashHistoryItems} 
                                cashSearchTerm={cashSearchTerm} setCashSearchTerm={setCashSearchTerm}
                                cashPage={cashPage} setCashPage={setCashPage}
                                cashHistoryPage={cashHistoryPage} setCashHistoryPage={setCashHistoryPage}
                                onConfirmCash={(id) => cashMutation.mutate(id)} ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                            />
                        )}
                        {activeTab === 'quotes' && (
                            <QuotesTab 
                                quotes={quotes} 
                                onAcceptQuote={(id) => quoteActionMutation.mutate({ id, status: 'ACCEPTED', method: 'PUT' })} 
                                onDeleteQuote={(id) => { if(confirm('Xóa báo giá?')) quoteActionMutation.mutate({ id, method: 'DELETE' })}}
                                onViewDetail={(q) => { setSelectedQuote(q); setIsQuoteDetailModalOpen(true) }}
                            />
                        )}
                        {activeTab === 'expenses' && <ExpensesTab expenses={expenses} />}
                    </div>
                </div>
            </div>

            <QuoteModal 
                isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)}
                quoteForm={quoteForm} setQuoteForm={setQuoteForm} 
                onSubmit={(e) => {e.preventDefault(); quoteSubmitMutation.mutate({...quoteForm, items: []})}}
            />
            <ExpenseModal 
                isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)}
                expenseForm={expenseForm} setExpenseForm={setExpenseForm} 
                onSubmit={(e) => {e.preventDefault(); expenseMutation.mutate({...expenseForm, date: new Date().toISOString()})}}
            />
            <OrderActionModal 
                order={selectedOrder} mode={orderModalMode} setMode={setOrderModalMode}
                drivers={drivers} onAssignDriver={(id, drId) => assignMutation.mutate({orderId: id, driverId: drId})} 
                onClose={() => setSelectedOrder(null)}
            />
            <QuoteDetailModal 
                quote={selectedQuote} isOpen={isQuoteDetailModalOpen} 
                onClose={() => setIsQuoteDetailModalOpen(false)} 
                onAccept={(id) => quoteActionMutation.mutate({ id, status: 'ACCEPTED', method: 'PUT' })}
            />
        </div>
    )
}
