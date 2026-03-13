'use client'

import React, { useState } from 'react'
import {
    ShoppingCart, Plus, Minus, X, Trash2,
    Zap, Package, Truck, ChevronDown, ChevronUp,
    CreditCard, History, Calendar, FileText,
    Building2, Loader2, MapPin, Info, Gift
} from 'lucide-react'
import { CartItem, EvaluatedCart, ContractorProject, ShippingCalculation } from '../types'

interface CartPanelProps {
    cart: CartItem[]
    evaluatedCart: EvaluatedCart | null
    evaluating: boolean
    onUpdateQuantity: (productId: string, delta: number) => void
    onSetQuantity: (productId: string, qty: number) => void
    onRemoveItem: (productId: string) => void
    onClearCart: () => void
    onCheckout: () => void
    isProcessing: boolean
    // Project info
    projectName: string
    onProjectNameChange: (v: string) => void
    poNumber: string
    onPoNumberChange: (v: string) => void
    notes: string
    onNotesChange: (v: string) => void
    // Projects
    projects: ContractorProject[]
    selectedProject: ContractorProject | null
    onSelectProject: (project: ContractorProject | null) => void
    // Shipping
    shippingCalc: ShippingCalculation | null
    shippingLoading: boolean
    deliveryDate: string
    onDeliveryDateChange: (v: string) => void
    // Credit
    creditLimit: number
    availableCredit: number
    // History
    onOpenHistory: () => void
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

export default function CartPanel({
    cart,
    evaluatedCart,
    evaluating,
    onUpdateQuantity,
    onSetQuantity,
    onRemoveItem,
    onClearCart,
    onCheckout,
    isProcessing,
    projectName,
    onProjectNameChange,
    poNumber,
    onPoNumberChange,
    notes,
    onNotesChange,
    projects,
    selectedProject,
    onSelectProject,
    shippingCalc,
    shippingLoading,
    deliveryDate,
    onDeliveryDateChange,
    creditLimit,
    availableCredit,
    onOpenHistory
}: CartPanelProps) {
    const [showProjectInfo, setShowProjectInfo] = useState(false)
    const [showProjectDropdown, setShowProjectDropdown] = useState(false)
    const [showShippingTable, setShowShippingTable] = useState(false)

    // Calculate totals
    const subtotal = evaluatedCart?.summary?.totalOriginal
        ?? cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const discountTotal = evaluatedCart?.summary?.totalDiscount ?? 0
    const cartTotal = evaluatedCart?.summary?.totalPrice
        ?? cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const shippingFee = shippingCalc?.finalFee ?? 0
    const finalTotal = Math.max(0, cartTotal + shippingFee)

    const getItemEffectivePrice = (productId: string, fallbackPrice: number) => {
        return evaluatedCart?.items?.find(i => i.productId === productId)?.effectivePrice ?? fallbackPrice
    }

    const getItemOriginalPrice = (productId: string, fallbackPrice: number) => {
        return evaluatedCart?.items?.find(i => i.productId === productId)?.originalPrice ?? fallbackPrice
    }

    const getItemTotal = (item: CartItem) => {
        return evaluatedCart?.items?.find(i => i.productId === item.product.id)?.totalPrice
            ?? (item.product.price * item.quantity)
    }

    // Min delivery date = tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const minDate = tomorrow.toISOString().split('T')[0]

    return (
        <div className="w-full lg:w-[420px] h-full flex flex-col bg-white p-5 rounded-[36px] shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="shrink-0 mb-3">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <ShoppingCart className="text-blue-600 w-5 h-5" /> Giỏ Hàng
                        {cart.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg font-black">
                                {cart.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={onOpenHistory}
                            title="Lịch sử đơn hàng"
                            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            <History className="w-4 h-4" />
                        </button>
                        <button
                            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-colors"
                            onClick={onClearCart}
                            title="Xóa giỏ hàng"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Project Selector */}
                <div className="relative">
                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                    >
                        <div className={`flex-1 flex items-center gap-2 rounded-2xl px-3 py-2 transition-all ${
                            selectedProject
                                ? 'bg-blue-50 border border-blue-100'
                                : projectName.trim()
                                    ? 'bg-blue-50 border border-blue-100'
                                    : cart.length > 0
                                        ? 'bg-red-50 border-2 border-dashed border-red-300 animate-pulse'
                                        : 'bg-slate-50 border border-dashed border-slate-200 hover:border-blue-300'
                            }`}
                        >
                            <MapPin className={`w-3.5 h-3.5 shrink-0 ${selectedProject ? 'text-blue-500' : 'text-slate-300 group-hover:text-blue-400'} transition-colors`} />
                            <div className="flex-1 min-w-0">
                                {selectedProject ? (
                                    <div>
                                        <p className="text-xs font-bold text-blue-700 truncate">{selectedProject.title}</p>
                                        <p className="text-[10px] text-blue-500/70 truncate">{selectedProject.location || selectedProject.city || ''}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs font-bold text-slate-400 italic group-hover:text-blue-500 transition-colors">
                                        Chọn công trình giao hàng
                                    </p>
                                )}
                            </div>
                            {showProjectDropdown
                                ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            }
                        </div>
                    </div>

                    {/* Project Dropdown */}
                    {showProjectDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 max-h-[240px] overflow-y-auto animate-in slide-in-from-top-2 duration-150">
                            {/* Manual project name input */}
                            <div className="p-2 border-b border-slate-100">
                                <div
                                    onClick={() => {
                                        onSelectProject(null)
                                        setShowProjectDropdown(false)
                                        setShowProjectInfo(true)
                                    }}
                                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors"
                                >
                                    <Plus className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs font-bold text-blue-600">Nhập địa chỉ giao hàng mới</span>
                                </div>
                            </div>

                            {projects.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400 italic">
                                    Chưa có dự án nào
                                </div>
                            ) : (
                                projects.map(project => (
                                    <div
                                        key={project.id}
                                        onClick={() => {
                                            onSelectProject(project)
                                            onProjectNameChange(project.title)
                                            setShowProjectDropdown(false)
                                            setShowProjectInfo(false)
                                        }}
                                        className={`flex items-center gap-2.5 p-3 cursor-pointer transition-colors ${selectedProject?.id === project.id
                                            ? 'bg-blue-50'
                                            : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${project.lat && project.lng
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-orange-100 text-orange-500'
                                            }`}>
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{project.title}</p>
                                            <p className="text-[10px] text-slate-400 truncate">
                                                {project.location || project.city || 'Chưa có địa chỉ'}
                                                {!(project.lat && project.lng) && ' • Chưa có GPS'}
                                            </p>
                                        </div>
                                        {selectedProject?.id === project.id && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Project Info Expanded (manual entry) */}
                {showProjectInfo && !selectedProject && (
                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-[16px] p-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
                        <div>
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 block">
                                Tên dự án / Địa chỉ <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="VD: Dự án Biên Hòa, 12 Lê Lợi..."
                                value={projectName}
                                onChange={e => onProjectNameChange(e.target.value)}
                                className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-blue-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 block">
                                Mã PO
                            </label>
                            <input
                                type="text"
                                placeholder="Mã tham chiếu nội bộ..."
                                value={poNumber}
                                onChange={e => onPoNumberChange(e.target.value)}
                                className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-blue-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 block">
                                Ghi chú
                            </label>
                            <textarea
                                placeholder="Ghi chú giao hàng..."
                                value={notes}
                                onChange={e => onNotesChange(e.target.value)}
                                rows={2}
                                className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-blue-400 outline-none resize-none"
                            />
                        </div>
                        <button
                            onClick={() => setShowProjectInfo(false)}
                            className="w-full py-1.5 bg-blue-500 text-white text-[10px] font-black rounded-xl hover:bg-blue-600 transition-all"
                        >
                            Xong
                        </button>
                    </div>
                )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200 mb-2 relative">
                {evaluating && cart.length > 0 && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-xs font-bold text-slate-600">Đang cập nhật giá...</span>
                        </div>
                    </div>
                )}

                {cart.map((item, idx) => {
                    const effectivePrice = getItemEffectivePrice(item.product.id, item.product.price)
                    const originalPrice = getItemOriginalPrice(item.product.id, item.product.price)
                    const isDiscounted = effectivePrice < originalPrice
                    const itemTotal = getItemTotal(item)

                    return (
                        <div
                            key={item.product.id || idx}
                            className="group bg-white rounded-[18px] border border-slate-100 hover:border-blue-200 transition-all overflow-hidden"
                        >
                            <div className="flex gap-3 p-3 items-center">
                                {/* Image */}
                                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                    {item.product.images?.[0] || item.product.image ? (
                                        <img
                                            src={item.product.images?.[0] || item.product.image!}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Package className="w-5 h-5 text-slate-300" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-xs leading-tight line-clamp-1 mb-0.5">
                                        {item.product.name}
                                    </h4>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            {formatCurrency(effectivePrice)}
                                            <span className="text-slate-300"> / {item.product.unit}</span>
                                        </p>
                                        {isDiscounted && (
                                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-md">
                                                B2B
                                            </span>
                                        )}
                                    </div>
                                    {isDiscounted && (
                                        <p className="text-[10px] text-slate-300 line-through">
                                            {formatCurrency(originalPrice)}
                                        </p>
                                    )}
                                    <p className="text-xs font-black text-blue-600 mt-0.5">
                                        {formatCurrency(itemTotal)}
                                    </p>
                                </div>

                                {/* Controls */}
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl">
                                        <button
                                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-white shadow-sm text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onClick={e => (e.target as HTMLInputElement).select()}
                                            onChange={e => {
                                                const val = parseInt(e.target.value)
                                                if (!isNaN(val) && val >= 1) {
                                                    onSetQuantity(item.product.id, val)
                                                }
                                            }}
                                            className="w-11 text-center text-[11px] font-black text-slate-900 bg-white rounded-lg border-none focus:ring-2 focus:ring-blue-400 outline-none py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button
                                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-white shadow-sm text-slate-400 hover:text-blue-500 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => onRemoveItem(item.product.id)}
                                        className="p-0.5 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {cart.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-[28px] border-2 border-dashed border-slate-100 py-12">
                        <Zap className="w-10 h-10 text-slate-200 mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Giỏ hàng trống
                        </p>
                        <p className="text-[10px] text-slate-300 mt-1">Click sản phẩm bên trái để thêm</p>
                    </div>
                )}
            </div>

            {/* Summary & Checkout */}
            <div className="shrink-0 pt-3 border-t border-slate-100 bg-white space-y-2.5">
                {/* Summary rows */}
                <div className="space-y-1">
                    <div className="flex justify-between text-slate-400 font-bold text-xs">
                        <span>Tạm tính</span>
                        <span className="text-slate-600">{formatCurrency(subtotal)}</span>
                    </div>

                    {discountTotal > 0 && (
                        <div className="flex justify-between text-xs font-bold text-emerald-500">
                            <span className="flex items-center gap-1">
                                <Gift className="w-3 h-3" /> Chiết khấu B2B
                            </span>
                            <span>-{formatCurrency(discountTotal)}</span>
                        </div>
                    )}

                    {/* Shipping — Auto calculated */}
                    <div>
                        <div className="flex justify-between text-xs font-bold">
                            <span className="flex items-center gap-1 text-slate-400">
                                <Truck className="w-3 h-3" />
                                Vận chuyển
                                {shippingCalc && !shippingCalc.requiresContact && (
                                    <button
                                        onClick={() => setShowShippingTable(!showShippingTable)}
                                        className="text-blue-400 hover:text-blue-600 transition-colors"
                                        title="Xem bảng giá"
                                    >
                                        <Info className="w-3 h-3" />
                                    </button>
                                )}
                            </span>
                            {shippingLoading ? (
                                <span className="flex items-center gap-1 text-slate-400">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Đang tính...
                                </span>
                            ) : shippingCalc ? (
                                <span className={shippingCalc.isFreeShipping ? 'text-emerald-500' : shippingCalc.requiresContact ? 'text-orange-500' : 'text-blue-500'}>
                                    {shippingCalc.requiresContact
                                        ? 'Liên hệ'
                                        : shippingCalc.isFreeShipping
                                            ? 'Miễn phí'
                                            : `+${formatCurrency(shippingCalc.finalFee)}`
                                    }
                                </span>
                            ) : (
                                <span className="text-slate-300 text-[10px] italic">Chọn công trình</span>
                            )}
                        </div>

                        {/* Shipping details row */}
                        {shippingCalc && !shippingLoading && (
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md font-medium">
                                    📏 {shippingCalc.distanceKm} km
                                </span>
                                <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md font-medium">
                                    {shippingCalc.tier.label}
                                </span>
                                {shippingCalc.isFreeShipping && shippingCalc.freeReason && (
                                    <span className="text-[10px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md font-bold">
                                        ✅ {shippingCalc.freeReason}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Shipping rate table */}
                        {showShippingTable && (
                            <div className="mt-2 bg-slate-50 border border-slate-200 rounded-[14px] p-3 animate-in slide-in-from-top-2 duration-150">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Bảng giá vận chuyển</p>
                                <div className="space-y-1">
                                    {[
                                        { range: '0 – 5 km', fee: 'Miễn phí', active: shippingCalc && shippingCalc.distanceKm <= 5 },
                                        { range: '5 – 10 km', fee: '30.000đ', active: shippingCalc && shippingCalc.distanceKm > 5 && shippingCalc.distanceKm <= 10 },
                                        { range: '10 – 20 km', fee: '50.000đ', active: shippingCalc && shippingCalc.distanceKm > 10 && shippingCalc.distanceKm <= 20 },
                                        { range: '20 – 40 km', fee: '100.000đ', active: shippingCalc && shippingCalc.distanceKm > 20 && shippingCalc.distanceKm <= 40 },
                                        { range: '40 – 70 km', fee: '200.000đ', active: shippingCalc && shippingCalc.distanceKm > 40 && shippingCalc.distanceKm <= 70 },
                                        { range: '> 70 km', fee: 'Liên hệ', active: shippingCalc && shippingCalc.distanceKm > 70 },
                                    ].map((row, i) => (
                                        <div
                                            key={i}
                                            className={`flex justify-between text-[10px] px-2 py-1 rounded-lg ${row.active
                                                ? 'bg-blue-100 text-blue-700 font-black'
                                                : 'text-slate-500 font-medium'
                                                }`}
                                        >
                                            <span>{row.range}</span>
                                            <span>{row.fee}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[9px] text-slate-400 mt-2 italic">
                                    ✅ Miễn phí cho đơn ≥ 5 triệu hoặc ≤ 5km
                                </p>
                            </div>
                        )}

                        {/* Delivery date picker */}
                        <div className="mt-2">
                            <div className="flex items-center gap-2">
                                <Calendar className={`w-3.5 h-3.5 shrink-0 ${!deliveryDate && cart.length > 0 ? 'text-red-400' : 'text-blue-400'}`} />
                                <input
                                    type="date"
                                    min={minDate}
                                    value={deliveryDate}
                                    onChange={e => onDeliveryDateChange(e.target.value)}
                                    className={`flex-1 border rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 focus:ring-1 outline-none transition-all ${
                                        !deliveryDate && cart.length > 0
                                            ? 'bg-red-50 border-red-300 focus:ring-red-300'
                                            : 'bg-slate-50 border-slate-200 focus:ring-blue-300'
                                    }`}
                                />
                            </div>
                            {!deliveryDate && cart.length > 0 && (
                                <p className="text-[9px] text-red-400 font-bold mt-0.5 pl-5">
                                    ⚠️ Bắt buộc chọn ngày giao hàng
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between text-slate-900 font-black text-lg pt-1.5 border-t border-dashed border-slate-100">
                        <span>Tổng Cộng</span>
                        <div className="text-right">
                            <span className="text-blue-600">{formatCurrency(finalTotal)}</span>
                            {discountTotal > 0 && (
                                <p className="text-[10px] text-emerald-500 font-bold text-right">
                                    Tiết kiệm {formatCurrency(discountTotal)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Credit limit warning */}
                {finalTotal > availableCredit && availableCredit > 0 && (
                    <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold flex items-start gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Vượt hạn mức tín dụng! Khả dụng: {formatCurrency(availableCredit)}</span>
                    </div>
                )}

                {/* Contact shipping warning */}
                {shippingCalc?.requiresContact && (
                    <div className="p-2.5 bg-orange-50 border border-orange-100 rounded-xl text-orange-600 text-[10px] font-bold flex items-start gap-1.5">
                        <Truck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Khoảng cách &gt; 70km. Phí vận chuyển sẽ được nhân viên xác nhận sau.</span>
                    </div>
                )}

                {/* Checkout Button */}
                <button
                    onClick={onCheckout}
                    disabled={isProcessing || cart.length === 0 || (availableCredit > 0 && finalTotal > availableCredit)}
                    className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang đặt hàng...
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5 fill-white" /> XÁC NHẬN ĐẶT HÀNG
                        </>
                    )}
                </button>

                {/* Footer actions */}
                <div className="flex justify-center gap-6 pb-1">
                    <button
                        onClick={onOpenHistory}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                    >
                        <History className="w-3.5 h-3.5" /> Lịch Sử
                    </button>
                </div>
            </div>
        </div>
    )
}
