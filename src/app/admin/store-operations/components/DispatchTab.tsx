'use client'

import React, { useState, useMemo } from 'react'
import {
    Clock, CheckCircle, GripVertical, Truck, Search, User, Eye, Edit
} from 'lucide-react'
import {
    DndContext, DragOverlay, closestCorners,
    DragStartEvent, DragOverEvent, DragEndEvent,
    defaultDropAnimationSideEffects, useSensor, useSensors,
    PointerSensor, KeyboardSensor
} from '@dnd-kit/core'
import {
    SortableContext, sortableKeyboardCoordinates,
    useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { DispatchOrder, Driver, getStatusInfo } from '../types'

// ─── SortableOrderCard ──────────────────────────────────────────────────────
interface SortableOrderCardProps {
    order: DispatchOrder
    isOverlay?: boolean
    onViewDetail?: (id: string) => void
    onEditOrder?: (id: string) => void
}

export const SortableOrderCard = ({ order, isOverlay, onViewDetail, onEditOrder }: SortableOrderCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.id })
    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging && !isOverlay ? 0.3 : 1,
    }
    const statusInfo = getStatusInfo(order.status)

    const cardContent = (
        <div
            className={`px-3 py-2.5 bg-white border rounded-xl transition-all group relative flex items-center gap-2 ${isOverlay
                ? 'border-blue-500 shadow-xl rotate-1 scale-105 ring-2 ring-blue-500/20 cursor-grabbing z-50'
                : 'border-slate-100 hover:border-blue-300 cursor-grab active:cursor-grabbing'
                }`}
            {...(!isOverlay ? { ...attributes, ...listeners } : {})}
        >
            <div className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0">
                <GripVertical className="w-3.5 h-3.5" />
            </div>
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
            {!isOverlay && (
                <div
                    className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <button onClick={() => onViewDetail?.(order.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Xem chi tiết">
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onEditOrder?.(order.id)} className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Sửa đơn">
                        <Edit className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    )

    if (isOverlay) return cardContent
    return <div ref={setNodeRef} style={style} className="touch-none">{cardContent}</div>
}

// ─── UnassignedColumn ───────────────────────────────────────────────────────
const UnassignedColumn = ({ orders, onViewDetail, onEditOrder }: {
    orders: DispatchOrder[]
    onViewDetail: (id: string) => void
    onEditOrder: (id: string) => void
}) => {
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
        <div ref={setNodeRef} className={`bg-orange-50/30 rounded-[32px] p-5 border transition-all flex flex-col ${isOver ? 'border-orange-400 bg-orange-50/60 shadow-lg shadow-orange-100' : 'border-orange-100'}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Chờ điều xe
                </h3>
                <span className="px-2.5 py-1 bg-white border border-orange-200 text-orange-600 rounded-full text-[10px] font-black uppercase shadow-sm">
                    {orders.length} đơn
                </span>
            </div>

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

// ─── DriverDropZone ─────────────────────────────────────────────────────────
const DriverDropZone = ({ driver, orders, onStartTrip, onViewDetail, onEditOrder }: {
    driver: Driver
    orders: DispatchOrder[]
    onStartTrip: (id: string) => void
    onViewDetail: (id: string) => void
    onEditOrder: (id: string) => void
}) => {
    const { setNodeRef, isOver } = useDroppable({ id: driver.id })
    return (
        <div
            ref={setNodeRef}
            className={`rounded-2xl p-5 border transition-all ${isOver
                ? 'border-blue-400 bg-blue-50/80 shadow-lg shadow-blue-100 ring-2 ring-blue-200'
                : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm ${driver.status === 'ON_TRIP' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                        {driver.user.name.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">{driver.user.name}</h4>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${driver.status === 'ON_TRIP' ? 'text-orange-500' : 'text-emerald-500'}`}>
                            ● {driver.status === 'ON_TRIP' ? 'Đang giao' : 'Đang rảnh'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black">{orders.length} đơn</span>
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
            <SortableContext id={driver.id} items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 min-h-[60px] max-h-[250px] overflow-y-auto pr-1">
                    {orders.map(order => (
                        <SortableOrderCard key={order.id} order={order} onViewDetail={onViewDetail} onEditOrder={onEditOrder} />
                    ))}
                    {orders.length === 0 && (
                        <div className={`flex items-center justify-center py-6 border-2 border-dashed rounded-xl transition-all ${isOver ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 opacity-40'}`}>
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

// ─── DispatchTab (main export) ───────────────────────────────────────────────
interface DispatchTabProps {
    orders: DispatchOrder[]
    drivers: Driver[]
    onDragStart: (e: DragStartEvent) => void
    onDragOver: (e: DragOverEvent) => void
    onDragEnd: (e: DragEndEvent) => void
    onStartTrip: (driverId: string) => void
    onViewDetail: (id: string) => void
    onEditOrder: (id: string) => void
    activeOrder: DispatchOrder | null
}

export default function DispatchTab({
    orders, drivers,
    onDragStart, onDragOver, onDragEnd,
    onStartTrip, onViewDetail, onEditOrder,
    activeOrder,
}: DispatchTabProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <UnassignedColumn
                    orders={orders.filter(o => !o.driverId)}
                    onViewDetail={onViewDetail}
                    onEditOrder={onEditOrder}
                />
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
                            onStartTrip={onStartTrip}
                            onViewDetail={onViewDetail}
                            onEditOrder={onEditOrder}
                        />
                    ))}
                    {drivers.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                            <p className="text-slate-400 font-bold">Chưa có tài xế trong hệ thống.</p>
                        </div>
                    )}
                </div>
            </div>
            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: '0.5' } },
                }),
            }}>
                {activeOrder ? <SortableOrderCard order={activeOrder} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    )
}
