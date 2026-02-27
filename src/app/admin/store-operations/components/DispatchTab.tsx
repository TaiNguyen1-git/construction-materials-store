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
            className={`px-4 py-3 bg-white border rounded-2xl transition-all group relative flex items-center gap-3 ${isOverlay
                ? 'border-blue-500 shadow-2xl rotate-1 scale-105 ring-4 ring-blue-500/10 cursor-grabbing z-50'
                : 'border-slate-100 hover:border-blue-200 hover:shadow-md cursor-grab active:cursor-grabbing'
                }`}
            {...(!isOverlay ? { ...attributes, ...listeners } : {})}
        >
            <div className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0">
                <GripVertical className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5 truncate" title={order.orderNumber}>
                        #{order.orderNumber}
                    </p>
                    <p className="text-xs font-black text-slate-900 truncate" title={order.customerName}>
                        {order.customerName || 'Khách lẻ'}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-900 mb-1">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                    </p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter inline-block ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                </div>
            </div>
            {!isOverlay && (
                <div
                    className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <button onClick={() => onViewDetail?.(order.id)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEditOrder?.(order.id)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all" title="Sửa đơn">
                        <Edit className="w-4 h-4" />
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
        <div ref={setNodeRef} className={`bg-slate-50/50 rounded-[32px] p-6 border transition-all flex flex-col min-h-[500px] ${isOver ? 'border-blue-400 bg-blue-50/30' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Chờ điều xe
                </h3>
                <span className="px-3 py-1 bg-white border border-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase shadow-sm">
                    {orders.length} đơn
                </span>
            </div>

            <div className="relative mb-6">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm mã đơn, tên khách..."
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 shadow-sm transition-all"
                />
            </div>

            <SortableContext id="unassigned" items={filteredOrders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 space-y-3 min-h-[100px] max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredOrders.map(order => (
                        <SortableOrderCard key={order.id} order={order} onViewDetail={onViewDetail} onEditOrder={onEditOrder} />
                    ))}
                    {filteredOrders.length === 0 && orders.length > 0 && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <Search className="w-8 h-8 text-slate-300 mb-3" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Không tìm thấy đơn nào</p>
                        </div>
                    )}
                    {orders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 bg-white/50 border-2 border-dashed border-slate-100 rounded-3xl opacity-60">
                            <div className="p-4 bg-emerald-50 rounded-full mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Tất cả đơn đã được gán!</p>
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
            className={`rounded-3xl p-6 border transition-all duration-300 ${isOver
                ? 'border-blue-400 bg-blue-50 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20'
                : 'border-slate-100 bg-white/50 hover:border-blue-200 hover:bg-white'
                }`}
        >
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg ${driver.status === 'ON_TRIP' ? 'bg-orange-500 shadow-orange-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
                        {driver.user.name.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 text-sm tracking-tight">{driver.user.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${driver.status === 'ON_TRIP' ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${driver.status === 'ON_TRIP' ? 'text-orange-500' : 'text-emerald-500'}`}>
                                {driver.status === 'ON_TRIP' ? 'Đang giao hàng' : 'Đang rảnh'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-100/80 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-tighter">{orders.length} Đơn</span>
                    {orders.length > 0 && orders.some(o => o.status !== 'SHIPPED') && (
                        <button
                            onClick={() => onStartTrip(driver.id)}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            <Truck className="w-3.5 h-3.5" /> XUẤT XE
                        </button>
                    )}
                    {driver.status === 'ON_TRIP' && (
                        <a
                            href="/admin/delivery/tracking"
                            className="p-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors"
                            title="Theo dõi vị trí"
                        >
                            <Truck className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </div>
            <SortableContext id={driver.id} items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 min-h-[60px] max-h-[350px] overflow-y-auto pr-1">
                    {orders.map(order => (
                        <SortableOrderCard key={order.id} order={order} onViewDetail={onViewDetail} onEditOrder={onEditOrder} />
                    ))}
                    {orders.length === 0 && (
                        <div className={`flex items-center justify-center py-8 border-2 border-dashed rounded-2xl transition-all ${isOver ? 'border-blue-300 bg-blue-50/50' : 'border-slate-100 opacity-40'}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {isOver ? '↓ Thả đơn vào đây' : 'Chưa có đơn hàng'}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <UnassignedColumn
                    orders={orders.filter(o => !o.driverId)}
                    onViewDetail={onViewDetail}
                    onEditOrder={onEditOrder}
                />
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-slate-900">Danh sách Tài xế</h3>
                        </div>
                        <span className="px-3 py-1 bg-white border border-slate-100 text-blue-600 rounded-xl text-[10px] font-black uppercase shadow-sm">
                            {drivers.length} nhân sự
                        </span>
                    </div>
                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
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
                            <div className="py-32 text-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[32px]">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chưa có tài xế trong hệ thống</p>
                            </div>
                        )}
                    </div>
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
