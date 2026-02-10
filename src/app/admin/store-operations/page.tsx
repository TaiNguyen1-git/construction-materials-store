'use client'

import React, { useState, useEffect } from 'react'
import {
    Store,
    Truck,
    Wallet,
    History,
    Plus,
    CheckCircle,
    Clock,
    FileText,
    DollarSign,
    User,
    ChevronRight,
    Trash2,
    Edit,
    PlusCircle,
    Package,
    GanttChart,
    LayoutDashboard,
    GripVertical
} from 'lucide-react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import FormattedNumberInput from '@/components/FormattedNumberInput'

// --- Interfaces ---

interface QuickQuote {
    id: string
    customerName: string
    customerPhone: string
    projectName?: string
    totalAmount: number
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
    createdAt: string
}

interface DispatchOrder {
    id: string
    orderNumber: string
    customerName: string
    status: string
    totalAmount: number
    driverId: string | null
}

interface CashItem {
    id: string
    orderNumber: string
    customerName: string
    amount: number
    cashCollectedAt: string
}

interface Expense {
    id: string
    category: string
    amount: number
    description: string
    date: string
}

interface Driver {
    id: string
    user: { name: string }
    status: 'AVAILABLE' | 'ON_TRIP' | 'OFFLINE'
}

// --- Sortable Item Component (The Card) ---

interface SortableOrderCardProps {
    order: DispatchOrder
    isOverlay?: boolean
}

const SortableOrderCard = ({ order, isOverlay }: SortableOrderCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: order.id, data: { order } })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging && !isOverlay ? 0.3 : 1,
    }

    const cardContent = (
        <div className={`p-5 bg-white border rounded-2xl shadow-sm transition-all group ${isOverlay ? 'border-blue-500 shadow-xl rotate-2 scale-105 ring-2 ring-blue-500/20' : 'border-slate-100 hover:border-blue-300'
            }`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                    {!isOverlay && (
                        <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-blue-500">
                            <GripVertical className="w-4 h-4" />
                        </div>
                    )}
                    <div>
                        <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider">{order.orderNumber}</p>
                        <h4 className="font-bold text-slate-900 mt-0.5">{order.customerName}</h4>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${order.status === 'CONFIRMED' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                        }`}>{order.status}</span>
                </div>
            </div>

            {!isOverlay && (
                <div className="flex items-center justify-between mt-4 border-t border-dashed border-slate-100 pt-3">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3 text-blue-500" />
                        {order.driverId ? 'Đang giao' : 'Chờ xe'}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-lg" title="Xem chi tiết">
                            <FileText className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-slate-50 text-slate-400 hover:text-orange-600 rounded-lg" title="Sửa đơn">
                            <Edit className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )

    if (isOverlay) return cardContent

    return (
        <div ref={setNodeRef} style={style}>
            {cardContent}
        </div>
    )
}

// --- Droppable Container Component (The Column) ---

interface OrderColumnProps {
    id: string
    title: string
    icon: React.ReactNode
    orders: DispatchOrder[]
    countLabel?: string
    colorClass?: string
}

const OrderColumn = ({ id, title, icon, orders, countLabel, colorClass = "bg-slate-50/50", onStartTrip, driverStatus }: OrderColumnProps & { onStartTrip?: (id: string) => void, driverStatus?: string }) => {
    return (
        <div className={`${colorClass} rounded-[40px] p-6 border border-slate-100 flex flex-col h-full min-h-[500px]`}>
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex flex-col">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        {icon}
                        {title}
                    </h3>
                    {driverStatus && (
                        <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${driverStatus === 'ON_TRIP' ? 'text-orange-500' : 'text-emerald-500'
                            }`}>
                            ● {driverStatus === 'ON_TRIP' ? 'Đang đi giao' : 'Đang rảnh'}
                        </span>
                    )}
                </div>
                {countLabel && (
                    <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-tight shadow-sm">
                        {countLabel}
                    </span>
                )}
            </div>

            {id !== 'unassigned' && orders.length > 0 && orders.some(o => o.status !== 'SHIPPED') && (
                <button
                    onClick={() => onStartTrip?.(id)}
                    className="mb-4 w-full py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                >
                    <Truck className="w-4 h-4" /> XÁC NHẬN XUẤT XE
                </button>
            )}

            <SortableContext id={id} items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 space-y-4 min-h-[100px]">
                    {orders.map(order => (
                        <SortableOrderCard key={order.id} order={order} />
                    ))}
                    {orders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-[32px] opacity-40">
                            <Plus className="w-6 h-6 text-slate-300 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thả đơn vào đây</p>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    )
}

// --- Main Page Component ---

export default function StoreOperationsPage() {
    const [activeTab, setActiveTab] = useState<'quotes' | 'dispatch' | 'cash' | 'expenses'>('dispatch')
    const [loading, setLoading] = useState(true)

    // Data states
    const [quotes, setQuotes] = useState<QuickQuote[]>([])
    const [orders, setOrders] = useState<DispatchOrder[]>([])
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [cashItems, setCashItems] = useState<CashItem[]>([])
    const [expenses, setExpenses] = useState<Expense[]>([])

    // Drag state
    const [activeOrder, setActiveOrder] = useState<DispatchOrder | null>(null)

    // Form states
    const [quoteForm, setQuoteForm] = useState({ customerName: '', customerPhone: '', totalAmount: 0, notes: '' })
    const [expenseForm, setExpenseForm] = useState({ category: 'FUEL', amount: 0, description: '' })

    // Modal states
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)

    // Sensors for DND
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            setLoading(true)
            const [dispatchRes, quotesRes, cashRes, expenseRes] = await Promise.all([
                fetchWithAuth('/api/store/dispatch'),
                fetchWithAuth('/api/store/quotes'),
                fetchWithAuth('/api/store/cash-handover'),
                fetchWithAuth('/api/store/expenses')
            ])

            if (dispatchRes.ok) {
                const data = await dispatchRes.json()
                setOrders(data.data.orders.map((o: any) => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    customerName: o.customerName || (o.customer?.name) || o.guestName || 'N/A',
                    status: o.status,
                    totalAmount: o.totalAmount,
                    driverId: o.driverId
                })))
                setDrivers(data.data.drivers.map((d: any) => ({
                    id: d.id,
                    user: d.user,
                    status: 'AVAILABLE'
                })))
            }
            if (quotesRes.ok) setQuotes((await quotesRes.json()).data)
            if (cashRes.ok) {
                const data = await cashRes.json()
                setCashItems(data.data.map((item: any) => ({
                    id: item.id, orderNumber: item.orderNumber, customerName: item.customerName || item.customer?.name || item.guestName || 'N/A',
                    amount: item.totalAmount, cashCollectedAt: item.cashCollectedAt
                })))
            }
            if (expenseRes.ok) setExpenses((await expenseRes.json()).data)
        } catch (error) {
            toast.error('Không thể tải dữ liệu cửa hàng')
        } finally {
            setLoading(false)
        }
    }

    // --- DND Handlers ---

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const activeData = active.data.current?.order as DispatchOrder
        setActiveOrder(activeData)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        // Find the columns
        const activeColumn = findColumn(activeId)
        const overColumn = findColumn(overId)

        if (!activeColumn || !overColumn || activeColumn === overColumn) return

        setOrders((prev) => {
            const activeIndex = prev.findIndex((o) => o.id === activeId)
            // Moving to a new column
            const newOrders = [...prev]
            const targetDriverId = overColumn === 'unassigned' ? null : overColumn
            newOrders[activeIndex] = { ...newOrders[activeIndex], driverId: targetDriverId }
            return newOrders
        })
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveOrder(null)

        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string
        const overColumn = findColumn(overId)

        if (!overColumn) return

        const targetDriverId = overColumn === 'unassigned' ? null : overColumn
        const originalOrder = orders.find(o => o.id === activeId)

        // Only update if driver changed
        if (originalOrder && originalOrder.driverId !== targetDriverId) {
            try {
                const response = await fetchWithAuth('/api/store/dispatch', {
                    method: 'PUT',
                    body: JSON.stringify({ orderId: activeId, driverId: targetDriverId })
                })

                if (response.ok) {
                    toast.success(targetDriverId ? 'Đã gán tài xế thành công' : 'Đã gỡ tài xế')
                    fetchInitialData() // Re-fetch to confirm state
                } else {
                    toast.error('Không thể cập nhật điều phối')
                    fetchInitialData()
                }
            } catch (error) {
                toast.error('Có lỗi xảy ra')
                fetchInitialData()
            }
        }
    }

    const handleStartTrip = async (driverId: string) => {
        try {
            toast.loading('Đang xử lý xuất kho...', { id: 'dispatch' })

            const response = await fetchWithAuth('/api/store/dispatch/confirm-trip', {
                method: 'POST',
                body: JSON.stringify({ driverId })
            })

            if (response.ok) {
                toast.success('Bác tài đã xuất bến!', { id: 'dispatch' })

                // Update local state for immediate feedback
                setOrders(prev => prev.map(o =>
                    o.driverId === driverId ? { ...o, status: 'SHIPPED' } : o
                ))

                setDrivers(prev => prev.map(d =>
                    d.id === driverId ? { ...d, status: 'ON_TRIP' } : d
                ))

                fetchInitialData() // Refresh to get official data
            } else {
                toast.error('Không thể xác nhận xuất xe', { id: 'dispatch' })
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi xác nhận xuất xe', { id: 'dispatch' })
        }
    }

    const findColumn = (id: string) => {
        if (id === 'unassigned' || drivers.some(d => d.id === id)) return id
        const order = orders.find(o => o.id === id)
        if (!order) return null
        return order.driverId || 'unassigned'
    }

    // --- Other Handlers ---

    const handleConfirmCash = async (orderId: string) => {
        try {
            const response = await fetchWithAuth('/api/store/cash-handover', { method: 'PUT', body: JSON.stringify({ orderId }) })
            if (response.ok) { toast.success('Đã nhận tiền thành công'); fetchInitialData() }
        } catch (error) { toast.error('Có lỗi xảy ra') }
    }

    const handleQuoteSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetchWithAuth('/api/store/quotes', { method: 'POST', body: JSON.stringify({ ...quoteForm, items: [] }) })
            if (response.ok) { toast.success('Đã tạo báo giá'); setIsQuoteModalOpen(false); setQuoteForm({ customerName: '', customerPhone: '', totalAmount: 0, notes: '' }); fetchInitialData() }
        } catch (error) { toast.error('Có lỗi xảy ra') }
    }

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetchWithAuth('/api/store/expenses', { method: 'POST', body: JSON.stringify({ ...expenseForm, date: new Date().toISOString() }) })
            if (response.ok) { toast.success('Đã ghi chi phí'); setIsExpenseModalOpen(false); setExpenseForm({ category: 'FUEL', amount: 0, description: '' }); fetchInitialData() }
        } catch (error) { toast.error('Có lỗi xảy ra') }
    }

    const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                            <GanttChart className="w-8 h-8" />
                        </div>
                        Điều Phối Thông Minh
                    </h1>
                    <p className="text-slate-500 font-medium ml-14 mt-1">Giao diện Trello - Kéo thả để gán đơn cho tài xế</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setIsQuoteModalOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-white border border-blue-100 text-blue-600 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all">
                        <PlusCircle className="w-5 h-5" /> Báo Giá Nhanh
                    </button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                        <DollarSign className="w-5 h-5" /> Ghi Chi Phí
                    </button>
                </div>
            </div>

            {/* Snapshot Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiền tài xế đang cầm</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(cashItems.reduce((a, c) => a + c.amount, 0))}</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đơn chờ điều xe</p>
                    <p className="text-2xl font-black text-blue-600">{orders.filter(o => !o.driverId).length} Đơn</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Báo giá chờ duyệt</p>
                    <p className="text-2xl font-black text-emerald-600">{quotes.filter(q => q.status === 'PENDING').length} Bản</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chi phí trong ngày</p>
                    <p className="text-2xl font-black text-red-500">{formatCurrency(expenses.reduce((a, c) => a + c.amount, 0))}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-100">
                    {[
                        { id: 'dispatch', name: 'Điều Xe Giao Hàng', icon: Truck },
                        { id: 'cash', name: 'Đối Soát COD', icon: Wallet },
                        { id: 'quotes', name: 'Sổ Báo Giá', icon: FileText },
                        { id: 'expenses', name: 'Chi Phí', icon: DollarSign },
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                            <tab.icon className="w-4 h-4" /> {tab.name}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {activeTab === 'dispatch' && (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCorners}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                                {/* Column: Unassigned */}
                                <OrderColumn
                                    id="unassigned"
                                    title="Chờ điều xe"
                                    icon={<Clock className="w-5 h-5 text-orange-500" />}
                                    orders={orders.filter(o => !o.driverId)}
                                    countLabel={`${orders.filter(o => !o.driverId).length} đơn`}
                                    colorClass="bg-orange-50/30 border-orange-100"
                                />

                                {/* Columns: Drivers */}
                                {drivers.map(driver => (
                                    <OrderColumn
                                        key={driver.id}
                                        id={driver.id}
                                        title={driver.user.name}
                                        icon={<User className="w-5 h-5 text-blue-500" />}
                                        orders={orders.filter(o => o.driverId === driver.id)}
                                        countLabel={`${orders.filter(o => o.driverId === driver.id).length} đơn`}
                                        onStartTrip={handleStartTrip}
                                        driverStatus={driver.status}
                                    />
                                ))}

                                {drivers.length === 0 && (
                                    <div className="col-span-3 py-20 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
                                        <p className="text-slate-400 font-bold">Chưa có danh sách tài xế trong hệ thống.</p>
                                    </div>
                                )}
                            </div>

                            {/* Drag Overlay - The clear card that follows the mouse */}
                            <DragOverlay dropAnimation={{
                                sideEffects: defaultDropAnimationSideEffects({
                                    styles: { active: { opacity: '0.5' } },
                                }),
                            }}>
                                {activeOrder ? (
                                    <SortableOrderCard order={activeOrder} isOverlay />
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    )}

                    {/* Cash Tab */}
                    {activeTab === 'cash' && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto rounded-[32px] border border-slate-100">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn hàng</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {cashItems.map(item => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-5 font-bold text-slate-900">{item.orderNumber} - {item.customerName}</td>
                                                <td className="px-6 py-5 text-right font-black text-blue-600">{formatCurrency(item.amount)}</td>
                                                <td className="px-6 py-5 text-center">
                                                    <button onClick={() => handleConfirmCash(item.id)} className="bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-200">Xác nhận nhận tiền</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {cashItems.length === 0 && (
                                            <tr><td colSpan={3} className="py-20 text-center text-slate-400 font-bold">Hôm nay đã đối soát hết!</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Quotes & Expenses - Improved with actions */}
                    {activeTab === 'quotes' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {quotes.map(quote => (
                                <div key={quote.id} className="group p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-black text-slate-900 leading-tight">{quote.customerName}</h4>
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${quote.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>{quote.status}</span>
                                    </div>
                                    <p className="text-2xl font-black text-blue-600 mb-6">{formatCurrency(quote.totalAmount)}</p>

                                    <div className="flex gap-2">
                                        <button className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-100">Chấp nhận</button>
                                        <button className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button className="w-full mt-2 py-2 text-slate-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-widest">Xem chi tiết</button>
                                </div>
                            ))}
                            {quotes.length === 0 && (
                                <div className="col-span-3 py-20 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
                                    <p className="text-slate-400 font-bold italic">Chưa có báo giá nào được tạo.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="overflow-x-auto rounded-[32px] border border-slate-100">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {expenses.map(ex => (
                                        <tr key={ex.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-5">
                                                <span className="px-3 py-1 bg-red-50 text-red-500 rounded-lg text-[10px] font-black uppercase">{ex.category}</span>
                                            </td>
                                            <td className="px-6 py-5 text-slate-600 font-medium">{ex.description}</td>
                                            <td className="px-6 py-5 text-right font-black text-slate-900">{formatCurrency(ex.amount)}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Sửa">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Xóa">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && (
                                        <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold italic">Chưa ghi nhận chi phí nào hôm nay.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals (Quick Quotes & Expenses) */}
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
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200">Lưu & Gửi</button>
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
        </div>
    )
}
