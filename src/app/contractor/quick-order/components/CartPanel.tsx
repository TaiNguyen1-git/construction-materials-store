'use client'

import React, { useState } from 'react'
import {
    ShoppingCart, Plus, Minus, X, Trash2,
    Zap, Package, Truck, ChevronDown, ChevronUp,
    CreditCard, History, Calendar, FileText,
    Building2, Loader2, MapPin, Info, Gift,
    Pause, Save, Banknote
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
    onCheckout: (pm: 'CREDIT' | 'TRANSFER') => void
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
    // Drafts
    onSaveDraft: () => void
    onLoadDraft: (draft: any) => void
    drafts: any[]
    onDeleteDraft: (id: string) => void
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
    onOpenHistory,
    onSaveDraft,
    onLoadDraft,
    drafts,
    onDeleteDraft
}: CartPanelProps) {
    const [showProjectInfo, setShowProjectInfo] = useState(false)
    const [showProjectDropdown, setShowProjectDropdown] = useState(false)
    const [showDrafts, setShowDrafts] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<'CREDIT' | 'TRANSFER'>('CREDIT')
    const [showShippingTable, setShowShippingTable] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

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
        <div className="flex-1 w-full flex flex-col min-h-0 bg-white p-3 lg:p-4 rounded-none border-none overflow-hidden relative">
            {/* 1. PINNED HEADER */}
            <div className="shrink-0 mb-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <ShoppingCart className="text-blue-600 w-5 h-5" /> Giỏ Hàng
                            {cart.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg font-black">
                                    {cart.reduce((s, i) => s + i.quantity, 0)}
                                </span>
                            )}
                        </h2>
                        {cart.length > 2 && (
                            <div className="mt-2 relative">
                                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                                <input 
                                    type="text"
                                    placeholder="Tìm nhanh..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1 self-start">
                        <button
                            onClick={() => setShowDrafts(!showDrafts)}
                            title="Đơn nháp"
                            className={`p-2 rounded-xl transition-all relative ${showDrafts ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400 hover:text-orange-500'}`}
                        >
                            <Pause className="w-4 h-4" />
                            {drafts.length > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">{drafts.length}</span>}
                        </button>
                        <button
                            onClick={onSaveDraft}
                            disabled={cart.length === 0}
                            title="Lưu nháp"
                            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-30"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onOpenHistory}
                            title="Lịch sử"
                            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            <History className="w-4 h-4" />
                        </button>
                        <button
                            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-colors"
                            onClick={onClearCart}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Drafts Dropdown */}
                {showDrafts && (
                    <div className="absolute right-4 top-16 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 animate-in zoom-in-95 duration-200">
                        <div className="px-3 py-2 border-b border-slate-50 mb-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Danh sách đơn nháp</p>
                        </div>
                        {drafts.length === 0 ? (
                            <p className="py-8 text-center text-slate-300 italic text-[10px]">Chưa có đơn nháp nào</p>
                        ) : (
                            <div className="max-h-60 overflow-y-auto space-y-1">
                                {drafts.map(d => (
                                    <div key={d.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-xl group transition-all">
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onLoadDraft(d); setShowDrafts(false); }}>
                                            <p className="text-xs font-bold text-slate-700 truncate">{d.label}</p>
                                            <p className="text-[9px] text-slate-400 font-medium">{new Date(d.savedAt).toLocaleString('vi-VN')}</p>
                                        </div>
                                        <button onClick={() => onDeleteDraft(d.id)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. INDEPENDENT SCROLL AREA */}
            <div className="flex-1 min-h-0 relative flex flex-col mb-2 overflow-hidden border-t border-slate-50 pt-2">

                <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin scrollbar-thumb-slate-100 relative">
                    {/* B2B Configuration (Scrolls with items to save space) */}
                    <div className="space-y-2 mb-3 bg-slate-50/50 p-2 rounded-2xl border border-slate-100/50">
                        {/* Project Selector */}
                        <div className="relative">
                            <div
                                className="flex items-center gap-2 cursor-pointer group"
                                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                            >
                                <div className={`flex-1 flex items-center gap-2 rounded-xl px-3 py-2 transition-all bg-white border shadow-sm ${
                                    selectedProject || projectName.trim()
                                        ? 'border-blue-100'
                                        : cart.length > 0
                                            ? 'border-dashed border-red-300 animate-pulse'
                                            : 'border-dashed border-slate-200 hover:border-blue-300'
                                    }`}
                                >
                                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${selectedProject ? 'text-blue-500' : 'text-slate-300'}`} />
                                    <div className="flex-1 min-w-0">
                                        {selectedProject ? (
                                            <div>
                                                <p className="text-xs font-bold text-blue-700 truncate">{selectedProject.title}</p>
                                                <p className="text-[10px] text-blue-500/70 truncate">{selectedProject.location || selectedProject.city}</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs font-bold text-slate-400 italic">Chọn công trình giao hàng</p>
                                        )}
                                    </div>
                                    {showProjectDropdown ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                </div>
                            </div>

                            {/* Dropdown Items */}
                            {showProjectDropdown && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 max-h-[250px] overflow-y-auto">
                                    <div className="p-2 border-b border-slate-100" onClick={() => { onSelectProject(null); setShowProjectDropdown(false); setShowProjectInfo(true); }}>
                                        <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors">
                                            <Plus className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs font-bold text-blue-600">Địa chỉ mới</span>
                                        </div>
                                    </div>
                                    {projects.map(p => (
                                        <div key={p.id} onClick={() => { onSelectProject(p); onProjectNameChange(p.title); setShowProjectDropdown(false); }} className="flex items-center gap-2.5 p-3 cursor-pointer hover:bg-slate-50">
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-700 truncate">{p.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {showProjectInfo && !selectedProject && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2 space-y-2">
                                <input value={projectName} onChange={e => onProjectNameChange(e.target.value)} placeholder="Tên dự án / Địa chỉ *" className="w-full bg-white border border-blue-100 rounded-lg px-3 py-1.5 text-[11px] font-bold" />
                                <textarea value={notes} onChange={e => onNotesChange(e.target.value)} placeholder="Ghi chú..." className="w-full bg-white border border-blue-100 rounded-lg px-3 py-1 text-[11px] font-bold" />
                                <button onClick={() => setShowProjectInfo(false)} className="w-full py-1 bg-blue-500 text-white text-[10px] font-black rounded-lg">Xong</button>
                            </div>
                        )}

                        <div className="flex justify-between items-center bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm mt-1">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-blue-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Ngày giao hàng</span>
                                </div>
                                <input type="date" min={minDate} value={deliveryDate} onChange={e => onDeliveryDateChange(e.target.value)} className="bg-transparent border-none px-2 py-1 text-[11px] font-bold outline-none text-slate-700 right-0 text-right cursor-pointer" />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 border-dashed my-2"></div>
                    {evaluating && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Đang tính...</span>
                            </div>
                        </div>
                    )}

                    {cart
                        .filter(item => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((item) => {
                            const effectivePrice = getItemEffectivePrice(item.product.id, item.product.price)
                            const originalPrice = getItemOriginalPrice(item.product.id, item.product.price)
                            const isDiscounted = effectivePrice < originalPrice
                            const itemTotal = getItemTotal(item)

                            return (
                                <div key={item.product.id} className="group bg-white rounded-2xl border border-slate-100 p-3 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-100/50 transition-all flex gap-3 items-center">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        {item.product.images?.[0] || item.product.image ? (
                                            <img src={item.product.images?.[0] || item.product.image!} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <Package className="w-5 h-5 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <h4 className="font-bold text-slate-800 text-[11px] leading-tight truncate">{item.product.name}</h4>
                                            {isDiscounted && (
                                                <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded-md shrink-0">B2B</span>
                                            )}
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            <p className="text-[12px] font-black text-blue-600">{formatCurrency(itemTotal)}</p>
                                            {isDiscounted && (
                                                <p className="text-[9px] text-slate-300 line-through font-medium">{formatCurrency(originalPrice * item.quantity)}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-100/50">
                                            <button 
                                                onClick={() => onUpdateQuantity(item.product.id, -1)}
                                                className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:shadow-sm transition-all shadow-sm border border-slate-50"
                                            >
                                                <Minus size={10} />
                                            </button>
                                            <span className="w-7 text-center text-[11px] font-black text-slate-800">{item.quantity}</span>
                                            <button 
                                                onClick={() => onUpdateQuantity(item.product.id, 1)}
                                                className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-500 hover:shadow-sm transition-all shadow-sm border border-slate-50"
                                            >
                                                <Plus size={10} />
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => onRemoveItem(item.product.id)}
                                            className="text-slate-300 hover:text-red-400 p-0.5 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center py-12 text-slate-300 italic text-xs">
                            Giỏ hàng đang trống
                        </div>
                    )}
                </div>
            </div>

            {/* 3. PINNED SUMMARY & CHECKOUT */}
            <div className="shrink-0 pt-3 border-t border-slate-100 bg-white space-y-3">
                <div className="space-y-2">
                    {/* Payment Mode Selector */}
                    <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 mb-2">
                         <button 
                             onClick={() => setPaymentMethod('CREDIT')}
                             className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${paymentMethod === 'CREDIT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                             <CreditCard size={12} /> HẠN MỨC B2B
                         </button>
                         <button 
                             onClick={() => setPaymentMethod('TRANSFER')}
                             className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${paymentMethod === 'TRANSFER' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                             <Banknote size={12} /> CHUYỂN KHOẢN (QR)
                         </button>
                    </div>

                    <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>Tạm tính</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discountTotal > 0 && <div className="flex justify-between text-xs font-bold text-emerald-500">
                        <span>Chiết khấu B2B</span>
                        <span>-{formatCurrency(discountTotal)}</span>
                    </div>}
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1">Vận chuyển <Truck size={12} /></span>
                        <span className="text-blue-600">{shippingLoading ? '...' : shippingCalc ? formatCurrency(shippingFee) : 'Chưa tính'}</span>
                    </div>

                    <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-dashed border-slate-100">
                        <span>Tổng cộng</span>
                        <span className={paymentMethod === 'TRANSFER' ? 'text-emerald-600' : 'text-blue-600'}>{formatCurrency(finalTotal)}</span>
                    </div>
                </div>

                <button
                    onClick={() => onCheckout(paymentMethod)}
                    disabled={isProcessing || cart.length === 0}
                    className={`w-full py-4 text-white rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${paymentMethod === 'TRANSFER' ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700' : 'bg-blue-600 shadow-blue-100 hover:bg-blue-700'}`}
                >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Zap size={18} fill="white" />}
                    {paymentMethod === 'TRANSFER' ? 'XÁC NHẬN & QUÉT MÃ QR' : 'XÁC NHẬN ĐẶT HÀNG'}
                </button>
            </div>
        </div>
    )
}
