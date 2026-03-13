'use client'

import React, { useState } from 'react'
import {
    ShoppingCart, Plus, Minus, X, Trash2,
    Zap, Package, Truck, ChevronDown, ChevronUp,
    CreditCard, History, Calendar, FileText,
    Building2, Loader2
} from 'lucide-react'
import { CartItem, EvaluatedCart } from '../types'

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
    // Credit
    creditLimit: number
    availableCredit: number
    // Shipping
    shippingFee: number
    onShippingFeeChange: (v: number) => void
    deliveryDate: string
    onDeliveryDateChange: (v: string) => void
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
    creditLimit,
    availableCredit,
    shippingFee,
    onShippingFeeChange,
    deliveryDate,
    onDeliveryDateChange,
    onOpenHistory
}: CartPanelProps) {
    const [showShipping, setShowShipping] = useState(false)
    const [showProjectInfo, setShowProjectInfo] = useState(false)

    // Calculate totals
    const subtotal = evaluatedCart?.summary?.totalOriginal
        ?? cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const discountTotal = evaluatedCart?.summary?.totalDiscount ?? 0
    const cartTotal = evaluatedCart?.summary?.totalPrice
        ?? cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const finalTotal = Math.max(0, cartTotal + shippingFee)

    const getItemEffectivePrice = (productId: string, fallbackPrice: number) => {
        const evaluated = evaluatedCart?.items?.find(i => i.productId === productId)
        return evaluated?.effectivePrice ?? fallbackPrice
    }

    const getItemOriginalPrice = (productId: string, fallbackPrice: number) => {
        const evaluated = evaluatedCart?.items?.find(i => i.productId === productId)
        return evaluated?.originalPrice ?? fallbackPrice
    }

    const getItemTotal = (item: CartItem) => {
        const evaluated = evaluatedCart?.items?.find(i => i.productId === item.product.id)
        return evaluated?.totalPrice ?? (item.product.price * item.quantity)
    }

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

                {/* Project Info Toggle */}
                <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => setShowProjectInfo(!showProjectInfo)}
                >
                    <div className={`flex-1 flex items-center gap-2 rounded-2xl px-3 py-2 transition-all ${projectName
                        ? 'bg-blue-50 border border-blue-100'
                        : 'bg-slate-50 border border-dashed border-slate-200 hover:border-blue-300'
                        }`}
                    >
                        <Building2 className={`w-3.5 h-3.5 shrink-0 ${projectName ? 'text-blue-500' : 'text-slate-300 group-hover:text-blue-400'} transition-colors`} />
                        <div className="flex-1 min-w-0">
                            {projectName ? (
                                <p className="text-xs font-bold text-blue-700 truncate">{projectName}</p>
                            ) : (
                                <p className="text-xs font-bold text-slate-400 italic group-hover:text-blue-500 transition-colors">
                                    Chọn công trình / dự án
                                </p>
                            )}
                        </div>
                        {showProjectInfo
                            ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        }
                    </div>
                </div>

                {/* Project Info Expanded */}
                {showProjectInfo && (
                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-[16px] p-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
                        <div>
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 block">
                                Tên dự án <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="VD: Dự án Biên Hòa"
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
                                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-md line-through-none">
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
                                    {/* Qty */}
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
                                    {/* Remove */}
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
                                <CreditCard className="w-3 h-3" /> Chiết khấu B2B
                            </span>
                            <span>-{formatCurrency(discountTotal)}</span>
                        </div>
                    )}

                    {/* Shipping — click to expand */}
                    <div>
                        <div
                            className="flex justify-between text-xs font-bold cursor-pointer group"
                            onClick={() => setShowShipping(!showShipping)}
                        >
                            <span className={`flex items-center gap-1 transition-colors ${shippingFee > 0 ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'}`}>
                                <Truck className="w-3 h-3" />
                                Vận chuyển
                                {showShipping ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </span>
                            <span className={shippingFee > 0 ? 'text-blue-500' : 'text-emerald-500 text-[10px]'}>
                                {shippingFee > 0 ? `+${formatCurrency(shippingFee)}` : 'Miễn phí'}
                            </span>
                        </div>

                        {showShipping && (
                            <div className="mt-2 bg-blue-50 border border-blue-100 rounded-[14px] p-2.5 space-y-2 animate-in slide-in-from-top-2 duration-150">
                                <div className="flex items-center gap-2">
                                    <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Phí vận chuyển (VNĐ)"
                                        value={shippingFee || ''}
                                        onChange={e => onShippingFeeChange(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="flex-1 min-w-0 bg-white border border-blue-100 rounded-lg px-2 py-1 text-xs font-black text-slate-700 focus:ring-1 focus:ring-blue-300 outline-none"
                                    />
                                    {shippingFee > 0 && (
                                        <button
                                            onClick={() => { onShippingFeeChange(0); onDeliveryDateChange('') }}
                                            className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <input
                                        type="date"
                                        value={deliveryDate}
                                        onChange={e => onDeliveryDateChange(e.target.value)}
                                        className="flex-1 bg-white border border-blue-100 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-blue-300 outline-none"
                                    />
                                </div>
                            </div>
                        )}
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
