'use client'

import React, { useState, useEffect, useMemo } from 'react'

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
    ChevronLeft,
    Trash2,
    Edit,
    PlusCircle,
    Package,
    GanttChart,
    LayoutDashboard,
    GripVertical,
    Search,
    Eye
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
import { Skeleton } from "@/components/ui/skeleton"

function StoreOperationsSkeleton() {
    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <Skeleton className="h-8 w-64 rounded-xl" />
                    </div>
                    <Skeleton className="h-4 w-96 rounded-lg ml-14" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-12 w-40 rounded-2xl" />
                    <Skeleton className="h-12 w-40 rounded-2xl" />
                </div>
            </div>

            {/* Snapshot Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                        <Skeleton className="h-3 w-24 mb-2 rounded-lg" />
                        <Skeleton className="h-8 w-32 rounded-xl" />
                    </div>
                ))}
            </div>

            {/* Tabs & Content - 2 Column Layout */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-100">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-32 rounded-2xl" />
                    ))}
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left column skeleton */}
                        <div className="bg-orange-50/30 rounded-[32px] p-6 border border-orange-100 min-h-[500px] flex flex-col gap-4">
                            <div className="flex justify-between items-center mb-2">
                                <Skeleton className="h-6 w-32 rounded-lg" />
                                <Skeleton className="h-6 w-12 rounded-full" />
                            </div>
                            <Skeleton className="h-24 w-full rounded-2xl" />
                            <Skeleton className="h-24 w-full rounded-2xl" />
                            <Skeleton className="h-24 w-full rounded-2xl" />
                        </div>
                        {/* Right column skeleton */}
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-slate-50/50 rounded-[24px] p-5 border border-slate-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <Skeleton className="h-5 w-36 rounded-lg" />
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                    <Skeleton className="h-20 w-full rounded-xl" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


// --- Interfaces ---

interface QuickQuote {
    id: string
    customerName: string
    customerPhone: string
    projectName?: string
    notes?: string
    totalAmount: number
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
    staffName?: string
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
    cashCollectedAt?: string
    cashHandedOverAt?: string
    driverName?: string
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

// --- Status translation helper ---
const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PROCESSING: { label: 'Đang xử lý', color: 'bg-blue-50 text-blue-600' },
    CONFIRMED: { label: 'Đã xác nhận', color: 'bg-orange-50 text-orange-600' },
    SHIPPED: { label: 'Đang giao', color: 'bg-emerald-50 text-emerald-600' },
    DELIVERED: { label: 'Đã giao', color: 'bg-green-50 text-green-700' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-red-50 text-red-500' },
    PENDING: { label: 'Chờ duyệt', color: 'bg-yellow-50 text-yellow-600' },
    COMPLETED: { label: 'Hoàn tất', color: 'bg-emerald-50 text-emerald-700' },
}

const getStatusInfo = (status: string) => STATUS_MAP[status] || { label: status, color: 'bg-slate-50 text-slate-600' }

// --- Sortable Item Component (Compact Row) ---

interface SortableOrderCardProps {
    order: DispatchOrder
    isOverlay?: boolean
    onViewDetail?: (id: string) => void
    onEditOrder?: (id: string) => void
}

const SortableOrderCard = ({ order, isOverlay, onViewDetail, onEditOrder }: SortableOrderCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: order.id })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging && !isOverlay ? 0.3 : 1,
    }

    const statusInfo = getStatusInfo(order.status)

    const cardContent = (
        <div
            className={`px-3 py-2.5 bg-white border rounded-xl transition-all group relative flex items-center gap-2 ${isOverlay ? 'border-blue-500 shadow-xl rotate-1 scale-105 ring-2 ring-blue-500/20 cursor-grabbing z-50' : 'border-slate-100 hover:border-blue-300 cursor-grab active:cursor-grabbing'
                }`}
            {...(!isOverlay ? { ...attributes, ...listeners } : {})}
        >
            {/* Grip */}
            <div className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0">
                <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Order info */}
            <div className="flex-1 min-w-0 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider truncate" title={order.orderNumber}>
                        {order.orderNumber}
                    </p>
                    <p className="text-xs text-slate-600 truncate" title={order.customerName}>
                        {order.customerName || 'N/A'}
                    </p>
                </div>
                <p className="text-xs font-black text-slate-900 shrink-0">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                </p>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter shrink-0 ${statusInfo.color}`}>
                    {statusInfo.label}
                </span>
            </div>

            {/* Action buttons */}
            {!isOverlay && (
                <div
                    className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => onViewDetail?.(order.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Xem chi tiết"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onEditOrder?.(order.id)}
                        className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                        title="Sửa đơn"
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    )

    if (isOverlay) return cardContent

    return (
        <div ref={setNodeRef} style={style} className="touch-none">
            {cardContent}
        </div>
    )
}

// --- Droppable Container Components ---

import { useDroppable } from '@dnd-kit/core'

// Left panel: Unassigned orders column with search & scroll
interface UnassignedColumnProps {
    orders: DispatchOrder[]
    onViewDetail: (id: string) => void
    onEditOrder: (id: string) => void
}

const UnassignedColumn = ({ orders, onViewDetail, onEditOrder }: UnassignedColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' })
    const [searchQuery, setSearchQuery] = useState('')

    const filteredOrders = useMemo(() => {
        if (!searchQuery.trim()) return orders
        const q = searchQuery.toLowerCase()
        return orders.filter(o =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.customerName?.toLowerCase().includes(q)
        )
    }, [orders, searchQuery])

    return (
        <div ref={setNodeRef} className={`bg-orange-50/30 rounded-[32px] p-5 border transition-all flex flex-col ${isOver ? 'border-orange-400 bg-orange-50/60 shadow-lg shadow-orange-100' : 'border-orange-100'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Chờ điều xe
                </h3>
                <span className="px-2.5 py-1 bg-white border border-orange-200 text-orange-600 rounded-full text-[10px] font-black uppercase shadow-sm">
                    {orders.length} đơn
                </span>
            </div>

            {/* Search */}
            {orders.length > 5 && (
                <div className="relative mb-3">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm mã đơn, tên khách..."
                        className="w-full pl-8 pr-3 py-2 bg-white border border-orange-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-slate-400"
                    />
                    {searchQuery && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-orange-500">
                            {filteredOrders.length}/{orders.length}
                        </span>
                    )}
                </div>
            )}

            {/* Scrollable order list */}
            <SortableContext id="unassigned" items={filteredOrders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 space-y-2 min-h-[80px] max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredOrders.map(order => (
                        <SortableOrderCard key={order.id} order={order} onViewDetail={onViewDetail} onEditOrder={onEditOrder} />
                    ))}
                    {filteredOrders.length === 0 && orders.length > 0 && (
                        <div className="flex flex-col items-center justify-center py-8 opacity-50">
                            <Search className="w-5 h-5 text-slate-300 mb-2" />
                            <p className="text-[10px] font-bold text-slate-400">Không tìm thấy đơn nào</p>
                        </div>
                    )}
                    {orders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-orange-200 rounded-2xl opacity-50">
                            <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                            <p className="text-xs font-bold text-slate-500">Tất cả đơn đã được gán!</p>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    )
}

// Right panel: Each driver as a compact droppable zone
interface DriverDropZoneProps {
    driver: Driver
    orders: DispatchOrder[]
    onStartTrip: (id: string) => void
    onViewDetail: (id: string) => void
    onEditOrder: (id: string) => void
}

const DriverDropZone = ({ driver, orders, onStartTrip, onViewDetail, onEditOrder }: DriverDropZoneProps) => {
    const { setNodeRef, isOver } = useDroppable({ id: driver.id })

    return (
        <div
            ref={setNodeRef}
            className={`rounded-2xl p-5 border transition-all ${isOver
                ? 'border-blue-400 bg-blue-50/80 shadow-lg shadow-blue-100 ring-2 ring-blue-200'
                : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
        >
            {/* Driver Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm ${driver.status === 'ON_TRIP' ? 'bg-orange-500' : 'bg-blue-600'
                        }`}>
                        {driver.user.name.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">{driver.user.name}</h4>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${driver.status === 'ON_TRIP' ? 'text-orange-500' : 'text-emerald-500'
                            }`}>
                            ● {driver.status === 'ON_TRIP' ? 'Đang giao' : 'Đang rảnh'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black">
                        {orders.length} đơn
                    </span>
                    {orders.length > 0 && orders.some(o => o.status !== 'SHIPPED') && (
                        <button
                            onClick={() => onStartTrip(driver.id)}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-sm hover:bg-blue-700 transition-all flex items-center gap-1"
                        >
                            <Truck className="w-3 h-3" /> XUẤT XE
                        </button>
                    )}
                </div>
            </div>

            {/* Orders in this driver */}
            <SortableContext id={driver.id} items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 min-h-[60px] max-h-[250px] overflow-y-auto pr-1">
                    {orders.map(order => (
                        <SortableOrderCard key={order.id} order={order} onViewDetail={onViewDetail} onEditOrder={onEditOrder} />
                    ))}
                    {orders.length === 0 && (
                        <div className={`flex items-center justify-center py-6 border-2 border-dashed rounded-xl transition-all ${isOver ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 opacity-40'
                            }`}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {isOver ? '↓ Thả đơn vào đây' : 'Kéo thả đơn vào đây'}
                            </p>
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
    const [cashHistoryItems, setCashHistoryItems] = useState<CashItem[]>([])
    const [expenses, setExpenses] = useState<Expense[]>([])

    // Filter & Pagination states
    const [cashSearchTerm, setCashSearchTerm] = useState('')
    const [cashPage, setCashPage] = useState(1)
    const [cashHistoryPage, setCashHistoryPage] = useState(1)
    const ITEMS_PER_PAGE = 5

    // Reset page on search
    useEffect(() => {
        setCashPage(1)
        setCashHistoryPage(1)
    }, [cashSearchTerm])

    // Drag state
    const [activeOrder, setActiveOrder] = useState<DispatchOrder | null>(null)

    // Form states
    const [quoteForm, setQuoteForm] = useState({ customerName: '', customerPhone: '', totalAmount: 0, notes: '' })
    const [expenseForm, setExpenseForm] = useState({ category: 'FUEL', amount: 0, description: '' })

    // Modal states
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(null)
    const [selectedQuote, setSelectedQuote] = useState<QuickQuote | null>(null)
    const [isQuoteDetailModalOpen, setIsQuoteDetailModalOpen] = useState(false)
    const [orderModalMode, setOrderModalMode] = useState<'view' | 'edit'>('view')

    // Sensors for DND
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            const [dispatchRes, quotesRes, cashRes, expenseRes] = await Promise.all([
                fetchWithAuth('/api/store/dispatch', { cache: 'no-store' }),
                fetchWithAuth('/api/store/quotes', { cache: 'no-store' }),
                fetchWithAuth('/api/store/cash-handover', { cache: 'no-store' }),
                fetchWithAuth('/api/store/expenses', { cache: 'no-store' })
            ])

            if (dispatchRes.ok) {
                const data = await dispatchRes.json()
                setOrders(data.data.orders.map((o: any) => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    customerName: o.customer?.user?.name || o.customer?.name || o.guestName || 'N/A',
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
                console.log('[StoreOps] Cash Handover Data:', data.data)

                // Map pending items
                setCashItems(data.data.pending.map((item: any) => ({
                    id: item.id,
                    orderNumber: item.orderNumber,
                    customerName: item.customer?.user?.name || item.customer?.name || item.guestName || 'N/A',
                    amount: item.totalAmount,
                    cashCollectedAt: item.cashCollectedAt
                })))

                // Map history items
                setCashHistoryItems(data.data.history.map((item: any) => ({
                    id: item.id,
                    orderNumber: item.orderNumber,
                    customerName: item.customer?.user?.name || item.customer?.name || item.guestName || 'N/A',
                    amount: item.totalAmount,
                    cashHandedOverAt: item.cashHandedOverAt,
                    driverName: item.driver?.user?.name || 'N/A'
                })))
            }
            if (expenseRes.ok) setExpenses((await expenseRes.json()).data)
        } catch (error: any) {
            console.error('[StoreOps] Fetch Error:', error)
            toast.error('Không thể tải dữ liệu cửa hàng')
        } finally {
            setLoading(false)
        }
    }

    // --- DND Handlers ---

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const orderId = active.id as string
        const order = orders.find(o => o.id === orderId)
        if (order) setActiveOrder(order)
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

        // Check if driver actually changed compared to the START of the drag
        if (activeOrder && activeOrder.driverId !== targetDriverId) {
            // Optimistic update already applied in handleDragOver
            // Just persist to backend
            try {
                const response = await fetchWithAuth('/api/store/dispatch', {
                    method: 'PUT',
                    body: JSON.stringify({ orderId: activeId, driverId: targetDriverId })
                })

                if (response.ok) {
                    toast.success(targetDriverId ? 'Đã gán tài xế thành công' : 'Đã gỡ tài xế')
                    // No reload needed - optimistic update is already correct
                } else {
                    toast.error('Không thể cập nhật điều phối')
                    fetchInitialData(true) // Silent revert
                }
            } catch (error) {
                toast.error('Có lỗi xảy ra')
                fetchInitialData(true) // Silent revert
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

                fetchInitialData(true) // Silent refresh
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

    const handleViewDetail = (orderId: string) => {
        const order = orders.find(o => o.id === orderId)
        if (order) {
            setSelectedOrder(order)
            setOrderModalMode('view')
        }
    }

    const handleEditOrder = (orderId: string) => {
        const order = orders.find(o => o.id === orderId)
        if (order) {
            setSelectedOrder(order)
            setOrderModalMode('edit')
        }
    }

    const handleAssignDriver = async (orderId: string, driverId: string | null) => {
        try {
            const response = await fetchWithAuth('/api/store/dispatch', {
                method: 'PUT',
                body: JSON.stringify({ orderId, driverId })
            })
            if (response.ok) {
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
            const response = await fetchWithAuth('/api/store/cash-handover', { method: 'PUT', body: JSON.stringify({ orderId }) })
            if (response.ok) {
                toast.success('Đã nhận tiền thành công')

                // Update local state smoothly without loading flash
                const itemToMove = cashItems.find(i => i.id === orderId)
                if (itemToMove) {
                    // Update pending list
                    setCashItems(prev => prev.filter(i => i.id !== orderId))
                    // Update history list (prepend)
                    setCashHistoryItems(prev => [
                        { ...itemToMove, cashHandedOverAt: new Date().toISOString() },
                        ...prev
                    ])
                }

                // Silent refresh in background to ensure data is in sync
                fetchInitialData(true)
            } else {
                toast.error('Không thể cập nhật đối soát')
            }
        } catch { toast.error('Có lỗi xảy ra') }
    }

    const handleQuoteSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetchWithAuth('/api/store/quotes', { method: 'POST', body: JSON.stringify({ ...quoteForm, items: [] }) })
            if (response.ok) { toast.success('Đã tạo báo giá'); setIsQuoteModalOpen(false); setQuoteForm({ customerName: '', customerPhone: '', totalAmount: 0, notes: '' }); fetchInitialData() }
        } catch { toast.error('Có lỗi xảy ra') }
    }

    const handleDeleteQuote = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa báo giá này?')) return
        try {
            const response = await fetchWithAuth(`/api/store/quotes/${id}`, { method: 'DELETE' })
            if (response.ok) {
                toast.success('Đã xóa báo giá')
                fetchInitialData(true)
            } else {
                toast.error('Không thể xóa báo giá')
            }
        } catch { toast.error('Có lỗi xảy ra') }
    }

    const handleAcceptQuote = async (id: string) => {
        try {
            const response = await fetchWithAuth(`/api/store/quotes/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'ACCEPTED' })
            })
            if (response.ok) {
                toast.success('Báo giá đã được khách chấp nhận!')
                fetchInitialData(true)
            }
        } catch { toast.error('Có lỗi xảy ra') }
    }

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetchWithAuth('/api/store/expenses', { method: 'POST', body: JSON.stringify({ ...expenseForm, date: new Date().toISOString() }) })
            if (response.ok) { toast.success('Đã ghi chi phí'); setIsExpenseModalOpen(false); setExpenseForm({ category: 'FUEL', amount: 0, description: '' }); fetchInitialData() }
        } catch (error) { toast.error('Có lỗi xảy ra') }
    }

    const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

    if (loading) return <StoreOperationsSkeleton />

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
                    <p className="text-slate-500 font-medium ml-14 mt-1"></p>
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
                <div className="flex items-center gap-1 px-6 py-3 bg-slate-50 border-b border-slate-100">
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                {/* Cột Trái: Đơn chờ điều xe */}
                                <UnassignedColumn orders={orders.filter(o => !o.driverId)} onViewDetail={handleViewDetail} onEditOrder={handleEditOrder} />

                                {/* Cột Phải: Danh sách tài xế (xếp dọc) */}
                                <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-5 h-5 text-blue-500" />
                                        <h3 className="text-base font-black text-slate-900">Danh sách Tài xế</h3>
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black">
                                            {drivers.length} người
                                        </span>
                                    </div>

                                    {drivers.map(driver => (
                                        <DriverDropZone
                                            key={driver.id}
                                            driver={driver}
                                            orders={orders.filter(o => o.driverId === driver.id)}
                                            onStartTrip={handleStartTrip}
                                            onViewDetail={handleViewDetail}
                                            onEditOrder={handleEditOrder}
                                        />
                                    ))}

                                    {drivers.length === 0 && (
                                        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                            <p className="text-slate-400 font-bold">Chưa có tài xế trong hệ thống.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Drag Overlay */}
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

                    {activeTab === 'cash' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Controls bar */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                <div className="relative w-full md:w-96 group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Search className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Tìm theo mã đơn hoặc tên khách..."
                                        value={cashSearchTerm}
                                        onChange={(e) => setCashSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    />
                                    {cashSearchTerm && (
                                        <button
                                            onClick={() => setCashSearchTerm('')}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <span className="text-[10px] font-black uppercase">Xóa</span>
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="px-4 py-2.5 bg-blue-50 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">
                                        Tổng cộng: {cashItems.length} đơn
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách chờ nộp tiền */}
                            <div className="space-y-4">
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 px-2">
                                    <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                    Chờ nộp tiền mặt (Paginated)
                                </h3>
                                <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
                                    <table className="w-full text-left table-fixed">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/2">Đơn hàng</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-1/4">Số tiền</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-1/4">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(() => {
                                                const filtered = cashItems.filter(item =>
                                                    item.orderNumber.toLowerCase().includes(cashSearchTerm.toLowerCase()) ||
                                                    item.customerName.toLowerCase().includes(cashSearchTerm.toLowerCase())
                                                )
                                                const paginated = filtered.slice((cashPage - 1) * ITEMS_PER_PAGE, cashPage * ITEMS_PER_PAGE)
                                                const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

                                                if (filtered.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan={3} className="py-20 text-center">
                                                                <div className="flex flex-col items-center gap-3">
                                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                                        <Search className="w-8 h-8" />
                                                                    </div>
                                                                    <p className="text-slate-400 font-bold italic">
                                                                        {cashSearchTerm ? 'Không tìm thấy đơn hàng phù hợp' : 'Hôm nay đã đối soát hết!'}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                }

                                                // Smart Pagination Logic
                                                const getPages = () => {
                                                    const delta = 1
                                                    const range = []
                                                    for (let i = Math.max(2, cashPage - delta); i <= Math.min(totalPages - 1, cashPage + delta); i++) {
                                                        range.push(i)
                                                    }
                                                    if (cashPage - delta > 2) range.unshift('...')
                                                    range.unshift(1)
                                                    if (cashPage + delta < totalPages - 1) range.push('...')
                                                    if (totalPages > 1) range.push(totalPages)
                                                    return range
                                                }

                                                return (
                                                    <>
                                                        {paginated.map(item => (
                                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                                <td className="px-6 py-5 font-bold text-slate-900 truncate">
                                                                    <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3">
                                                                        <span className="text-blue-600 font-black tracking-wider uppercase text-[10px] bg-blue-50 px-2 py-0.5 rounded-md self-start shrink-0">
                                                                            {item.orderNumber}
                                                                        </span>
                                                                        <span className="truncate">{item.customerName}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5 text-right font-black text-slate-900 truncate">
                                                                    {formatCurrency(item.amount)}
                                                                </td>
                                                                <td className="px-6 py-5 text-center">
                                                                    <button
                                                                        onClick={() => handleConfirmCash(item.id)}
                                                                        className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-200 hover:scale-105 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" />
                                                                        <span className="hidden xl:inline">Xác nhận nhận tiền</span>
                                                                        <span className="xl:hidden">Xác nhận</span>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}

                                                        {/* Pagination Controls */}
                                                        {totalPages > 1 && (
                                                            <tr>
                                                                <td colSpan={3} className="px-6 py-4 bg-slate-50/50">
                                                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                            Trang {cashPage} / {totalPages} ({filtered.length} đơn)
                                                                        </p>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <button
                                                                                disabled={cashPage === 1}
                                                                                onClick={() => setCashPage(p => p - 1)}
                                                                                className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                                                                            >
                                                                                <ChevronLeft className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <div className="flex items-center gap-1">
                                                                                {getPages().map((p, idx) => (
                                                                                    p === '...' ? (
                                                                                        <span key={`gap-${idx}`} className="px-2 text-slate-300 font-black text-xs">...</span>
                                                                                    ) : (
                                                                                        <button
                                                                                            key={`page-${p}`}
                                                                                            onClick={() => setCashPage(p as number)}
                                                                                            className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${cashPage === p ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-110' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
                                                                                        >
                                                                                            {p}
                                                                                        </button>
                                                                                    )
                                                                                ))}
                                                                            </div>
                                                                            <button
                                                                                disabled={cashPage === totalPages}
                                                                                onClick={() => setCashPage(p => p + 1)}
                                                                                className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                                                                            >
                                                                                <ChevronRight className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                )
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Lịch sử Đối soát */}
                            {cashHistoryItems.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2 px-2">
                                        <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                                        Lịch sử nộp tiền mặt
                                    </h3>
                                    <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
                                        <table className="w-full text-left table-fixed">
                                            <thead className="bg-slate-50 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[40%]">Đơn hàng</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[25%]">Tài xế giao</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[15%]">Số tiền</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[20%]">Thời gian nộp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 italic">
                                                {(() => {
                                                    const filtered = cashHistoryItems.filter(item =>
                                                        item.orderNumber.toLowerCase().includes(cashSearchTerm.toLowerCase()) ||
                                                        item.customerName.toLowerCase().includes(cashSearchTerm.toLowerCase())
                                                    )
                                                    const paginated = filtered.slice((cashHistoryPage - 1) * ITEMS_PER_PAGE, cashHistoryPage * ITEMS_PER_PAGE)
                                                    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

                                                    if (filtered.length === 0) {
                                                        return (
                                                            <tr><td colSpan={4} className="py-10 text-center text-slate-300 font-bold italic">Không tìm thấy lịch sử phù hợp</td></tr>
                                                        )
                                                    }

                                                    // Smart Pagination Logic for History
                                                    const getHistoryPages = () => {
                                                        const delta = 1
                                                        const range = []
                                                        for (let i = Math.max(2, cashHistoryPage - delta); i <= Math.min(totalPages - 1, cashHistoryPage + delta); i++) {
                                                            range.push(i)
                                                        }
                                                        if (cashHistoryPage - delta > 2) range.unshift('...')
                                                        range.unshift(1)
                                                        if (cashHistoryPage + delta < totalPages - 1) range.push('...')
                                                        if (totalPages > 1) range.push(totalPages)
                                                        return range
                                                    }

                                                    return (
                                                        <>
                                                            {paginated.map(item => (
                                                                <tr key={item.id} className="bg-slate-50/30 opacity-70">
                                                                    <td className="px-6 py-5 font-bold text-slate-500 text-sm truncate">{item.orderNumber} - {item.customerName}</td>
                                                                    <td className="px-6 py-5 text-slate-400 font-medium text-xs truncate">{item.driverName}</td>
                                                                    <td className="px-6 py-5 text-right font-black text-slate-400 text-sm">{formatCurrency(item.amount)}</td>
                                                                    <td className="px-6 py-5 text-center text-[10px] text-slate-400 font-black uppercase">
                                                                        {item.cashHandedOverAt ? new Date(item.cashHandedOverAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'N/A'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {/* Pagination for History */}
                                                            {totalPages > 1 && (
                                                                <tr>
                                                                    <td colSpan={4} className="px-6 py-4 bg-slate-50/50">
                                                                        <div className="flex items-center justify-between">
                                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                                Trang {cashHistoryPage} / {totalPages}
                                                                            </p>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <button
                                                                                    disabled={cashHistoryPage === 1}
                                                                                    onClick={() => setCashHistoryPage(p => p - 1)}
                                                                                    className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                                                                                >
                                                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <div className="flex items-center gap-1">
                                                                                    {getHistoryPages().map((p, idx) => (
                                                                                        p === '...' ? (
                                                                                            <span key={`h-gap-${idx}`} className="px-2 text-slate-300 font-black text-xs">...</span>
                                                                                        ) : (
                                                                                            <button
                                                                                                key={`h-page-${p}`}
                                                                                                onClick={() => setCashHistoryPage(p as number)}
                                                                                                className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${cashHistoryPage === p ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
                                                                                            >
                                                                                                {p}
                                                                                            </button>
                                                                                        )
                                                                                    ))}
                                                                                </div>
                                                                                <button
                                                                                    disabled={cashHistoryPage === totalPages}
                                                                                    onClick={() => setCashHistoryPage(p => p + 1)}
                                                                                    className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                                                                                >
                                                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </>
                                                    )
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quotes & Expenses - Improved with actions */}
                    {activeTab === 'quotes' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {quotes.map(quote => (
                                <div key={quote.id} className="group p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-black text-slate-900 leading-tight">{quote.customerName}</h4>
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${quote.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>{quote.status}</span>
                                    </div>
                                    <p className="text-2xl font-black text-blue-600 mb-6">{formatCurrency(quote.totalAmount)}</p>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAcceptQuote(quote.id)}
                                            className={`flex-1 py-3 rounded-2xl text-xs font-black shadow-lg transition-all ${quote.status === 'ACCEPTED' ? 'bg-emerald-500 text-white cursor-default' : 'bg-blue-600 text-white shadow-blue-100 hover:scale-[1.02]'}`}
                                            disabled={quote.status === 'ACCEPTED'}
                                        >
                                            {quote.status === 'ACCEPTED' ? 'Đã chấp nhận' : 'Chấp nhận'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteQuote(quote.id)}
                                            className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedQuote(quote); setIsQuoteDetailModalOpen(true); }}
                                        className="w-full mt-2 py-2 text-slate-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Xem chi tiết
                                    </button>
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
                        <div className="overflow-x-auto rounded-[32px] border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
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
                            {/* Order Info Grid */}
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
                                        {selectedOrder.driverId
                                            ? drivers.find(d => d.id === selectedOrder.driverId)?.user.name || 'Đã gán'
                                            : '— Chưa gán'}
                                    </p>
                                </div>
                            </div>

                            {/* Driver Assignment (Edit Mode) */}
                            {orderModalMode === 'edit' && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gán tài xế</p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleAssignDriver(selectedOrder.id, null)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-bold transition-all ${!selectedOrder.driverId
                                                ? 'border-orange-400 bg-orange-50 text-orange-700'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                }`}
                                        >
                                            ← Bỏ gán (chuyển về chờ điều xe)
                                        </button>
                                        {drivers.map(d => (
                                            <button
                                                key={d.id}
                                                onClick={() => handleAssignDriver(selectedOrder.id, d.id)}
                                                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-between ${selectedOrder.driverId === d.id
                                                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                                                    : 'border-slate-200 hover:border-blue-300 text-slate-700'
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black ${d.status === 'ON_TRIP' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                                        {d.user.name.charAt(0)}
                                                    </span>
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

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setSelectedOrder(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                                    Đóng
                                </button>
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

            {/* Quote Detail Modal */}
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

                            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 group">
                                <div className="flex flex-col gap-1">
                                    <span>Trạng thái: <span className={selectedQuote.status === 'ACCEPTED' ? 'text-emerald-500' : 'text-orange-500'}>{selectedQuote.status}</span></span>
                                    <span>Nhân viên: <span className="text-slate-600">{selectedQuote.staffName || 'Hệ thống'}</span></span>
                                </div>
                                <span>Ngày tạo: {new Date(selectedQuote.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsQuoteDetailModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Đóng
                                </button>
                                {selectedQuote.status !== 'ACCEPTED' && (
                                    <button
                                        onClick={() => { handleAcceptQuote(selectedQuote.id); setIsQuoteDetailModalOpen(false); }}
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
